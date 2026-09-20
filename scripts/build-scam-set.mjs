// Turns data/scam-eval/raw.json into data/scam-eval/set.json:
// adds disguised copies, and splits into "dev" (used for tuning) and "test" (touched once, at the end).
// A disguised copy always lands in the same split as its original, so the test cannot leak.
import fs from 'fs';
import crypto from 'crypto';

const raw = JSON.parse(fs.readFileSync(new URL('../data/scam-eval/raw.json', import.meta.url), 'utf8'));
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');
const num = (s, n) => parseInt(sha(s).slice(0, 8), 16) % n;

// tiny seeded random so the set is reproducible
function rng(seed) { let x = parseInt(sha(seed).slice(0, 8), 16) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
const ZW = String.fromCharCode(0x200b);
const CYR = { a: String.fromCharCode(0x0430), e: String.fromCharCode(0x0435), o: String.fromCharCode(0x043e), i: String.fromCharCode(0x0456), c: String.fromCharCode(0x0441), p: String.fromCharCode(0x0440) };
const KEYWORDS = /\b(account|verify|payment|refund|bank|urgent|prize|confirm|password|invoice|deposit|gift|code|click|link|pay|fee|suspended|locked|security|card)\b/gi;

const T = {
  typos(t, r) { return t.split(' ').map((w) => (w.length > 4 && r() < 0.3 ? w[0] + w[2] + w[1] + w.slice(3) : w)).join(' '); },
  homoglyph(t) { return t.replace(KEYWORDS, (w) => w.split('').map((c) => CYR[c.toLowerCase()] || c).join('')); },
  leet(t, r) { return t.split(' ').map((w) => (r() < 0.4 ? w.replace(/o/gi, '0').replace(/e/gi, '3').replace(/l/g, '1') : w)).join(' '); },
  spaced(t) { return t.replace(KEYWORDS, (w) => w.split('').join(' ')); },
  zerowidth(t) { return t.replace(KEYWORDS, (w) => w.split('').join(ZW)); },
  defang(t) { return t.replace(/https?:\/\//gi, 'hxxp://').replace(/\.(com|net|org|top|xyz|info|click|site|online)\b/gi, '[.]$1'); },
  emoji(t, r) { const e = ['⚠️', '🔒', '💰', '🚨', '✅']; return e[Math.floor(r() * e.length)] + ' ' + t + ' ' + e[Math.floor(r() * e.length)]; },
  caps(t) { return t.toUpperCase(); },
};
const SCAM_T = Object.keys(T);
const LEGIT_T = ['typos', 'caps', 'emoji', 'leet'];

const set = [];
let i = 0;
for (const r of raw) {
  const id = 'm' + String(++i).padStart(3, '0');
  const split = num(r.text, 100) < 30 ? 'test' : 'dev';
  set.push({ id, split, ...r, base: id, transform: null });
  const english = r.lang === 'en';
  const pick = num('v' + r.text, 100);
  if (english && r.label === 'scam' && pick < 34) {
    const name = SCAM_T[num('t' + r.text, SCAM_T.length)];
    const text = T[name](r.text, rng(r.text + name));
    if (text !== r.text) set.push({ id: id + '-' + name, split, ...r, category: r.category, text, base: id, transform: name });
  }
  if (english && r.label === 'legit' && pick < 20) {
    const name = LEGIT_T[num('t' + r.text, LEGIT_T.length)];
    const text = T[name](r.text, rng(r.text + name));
    if (text !== r.text) set.push({ id: id + '-' + name, split, ...r, text, base: id, transform: name });
  }
}
fs.writeFileSync(new URL('../data/scam-eval/set.json', import.meta.url), JSON.stringify(set, null, 1) + '\n');
const count = (f) => set.filter(f).length;
console.log('total', set.length);
for (const sp of ['dev', 'test']) console.log(sp.padEnd(5), 'scam', count((x) => x.split === sp && x.label === 'scam'), 'legit', count((x) => x.split === sp && x.label === 'legit'), '| disguised', count((x) => x.split === sp && x.transform), '| non-English', count((x) => x.split === sp && x.lang !== 'en'), '| hard', count((x) => x.split === sp && x.difficulty === 'hard'));
console.log(Object.entries(set.filter((x) => x.transform).reduce((a, x) => ((a[x.transform] = (a[x.transform] || 0) + 1), a), {})).map(([k, v]) => k + ':' + v).join(' '));
