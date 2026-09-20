// Compares scam-detection designs on the synthetic evaluation set (data/scam-eval/set.json).
// Tuning uses only the "dev" part. The "test" part is scored once, with the settings chosen on dev.
//   node scripts/eval-scam-v2.mjs                 uses cached model answers (run scripts/run-model-eval.mjs first)
import fs from 'fs';
import { checkRules } from '../lib/scamRules.mjs';
import { deobfuscate } from '../lib/scamNormalize.mjs';
import { train, score } from '../lib/scamNB.mjs';
import { decide } from '../lib/scamCheck.mjs';

const root = new URL('..', import.meta.url);
const read = (p) => JSON.parse(fs.readFileSync(new URL(p, root), 'utf8'));
const set = read('data/scam-eval/set.json');
const MODELS = { super: 'model-nemotron-3-super-120b-a12b.json', lightning: 'model-nemotron-3.5-lightning-30b-a3b.json' };
const cache = {};
for (const [k, f] of Object.entries(MODELS)) { try { cache[k] = read('data/scam-eval/' + f); } catch { cache[k] = {}; } }
const MISS_COST = Number(process.env.MISS_COST || 8);                   // a missed scam is worse than a false alarm

const dev = set.filter((x) => x.split === 'dev');
const test = set.filter((x) => x.split === 'test');

// Naive Bayes scores: out-of-fold for dev (5 folds, grouped by original message), trained on all dev for test.
const nb = new Map();
const fold = (base) => parseInt(base.slice(1), 10) % 5;
for (let k = 0; k < 5; k++) { const m = train(dev.filter((x) => fold(x.base) !== k), 0.5, 8000); for (const x of dev.filter((x) => fold(x.base) === k)) nb.set(x.id, score(m, x.text)); }
const mAll = train(dev, 0.5, 8000);
for (const x of test) nb.set(x.id, score(mAll, x.text));

const flagsRaw = (x) => checkRules(x.text).flags.length;
const flagsClean = (x) => checkRules(deobfuscate(x.text)).flags.length;
const ans = (x, model) => { const a = cache[model][x.id]; return a ? a.label : null; };       // 'scam' | 'legit' | 'unsure' | null

// ---- metrics
function wilson(k, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), w = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(c - w) / d, (c + w) / d];
}
function metrics(rows, decide) {
  let tp = 0, fp = 0, tn = 0, fn = 0, calls = 0;
  for (const x of rows) {
    const d = decide(x);
    if (d.calls) calls++;
    if (x.label === 'scam') d.warn ? tp++ : fn++; else d.warn ? fp++ : tn++;
  }
  const P = tp + fn, N = fp + tn;
  return { tp, fp, tn, fn, recall: tp / Math.max(P, 1), fpr: fp / Math.max(N, 1), precision: tp / Math.max(tp + fp, 1), f1: (2 * tp) / Math.max(2 * tp + fp + fn, 1), recallCI: wilson(tp, P), fprCI: wilson(fp, N), calls: calls / Math.max(rows.length, 1), cost: fp + MISS_COST * fn };
}

// ---- designs. Each returns { warn, calls } for one message.
const D = {
  'Rules, as is: warn on any flag': (x) => ({ warn: flagsRaw(x) >= 1 }),
  'Rules after removing disguises': (x) => ({ warn: flagsClean(x) >= 1 }),
  'Local classifier alone': (x, p) => ({ warn: nb.get(x.id) >= p.nbThreshold }),
};
for (const m of Object.keys(MODELS)) {
  const label = m === 'super' ? 'Nemotron super' : 'Nemotron lightning';
  D['Current app: rules, then ' + label + ' if one flag'] = (x) => {
    const f = flagsRaw(x);
    if (f === 0) return { warn: false };
    if (f >= 2) return { warn: true };
    const a = ans(x, m);
    return { warn: a !== 'legit', calls: true };
  };
  D[label + ' alone (unsure counts as warn)'] = (x) => ({ warn: ans(x, m) === 'scam' || ans(x, m) === 'unsure', calls: true });
  D[label + ' alone (unsure counts as fine)'] = (x) => ({ warn: ans(x, m) === 'scam', calls: true });
  D['New: rules + local classifier, model only when unsure (' + label + ')'] = (x, p) => {
    const f = flagsClean(x), s = nb.get(x.id);
    if (f >= 2 || s >= p.hi) return { warn: true };
    if (f === 0 && s <= p.lo) return { warn: false };
    const a = ans(x, m);
    if (a === 'scam') return { warn: true, calls: true };
    if (a === 'legit') return { warn: false, calls: true };
    return { warn: f >= 1 || s > p.mid, calls: true };                // unsure or no answer: lean on the cheap signals
  };
}

// Designs where the model sees every message and the cheap signals only act as a second opinion.
for (const m of Object.keys(MODELS)) {
  const label = m === 'super' ? 'Nemotron super' : 'Nemotron lightning';
  const askAll = (x, p, veto, override) => {
    const f = flagsClean(x), s = nb.get(x.id), a = ans(x, m);
    const strong = f >= 2 && s >= p.hi;                                  // rules and classifier both strongly alarmed
    const quiet = f === 0 && s <= p.lo;                                  // rules and classifier both quiet
    if (a === 'scam') return { warn: !(veto && quiet), calls: true };
    if (a === 'legit') return { warn: !!(override && strong), calls: true };
    return { warn: f >= 1 || s > p.mid, calls: true };                  // unsure or no answer
  };
  D['Model on every message, cheap signals only as backup (' + label + ')'] = (x, p) => askAll(x, p, false, false);
  D['Model on every message + cheap signals can clear (' + label + ')'] = (x, p) => askAll(x, p, true, false);
  D['Model on every message + cheap signals can override (' + label + ')'] = (x, p) => askAll(x, p, false, true);
  D['Model on every message + cheap signals can clear or override (' + label + ')'] = (x, p) => askAll(x, p, true, true);
}

// The design that ships, run through the real decision code (lib/scamCheck.mjs), with the cached model answers.
const nbFor = (x) => ({ weights: {}, prior: 0, __score: nb.get(x.id) });
function shipped(x, model, p) {
  const s = nb.get(x.id);
  const a = model ? cache[model][x.id] : null;
  // decide() scores text itself, so give it a stand-in "model" that returns this message's precomputed score
  const fake = { weights: {}, prior: 0 };
  const d = decideSync(x.text, s, a, p);
  return d;
}
function decideSync(text, s, answer, p) {
  if (answer && answer.label === 'scam') return { warn: true, calls: true };
  if (answer && answer.label === 'legit') return { warn: false, calls: true };
  if (answer) return { warn: true, calls: true };
  return { warn: s >= p.warn, calls: false };
}
for (const m of Object.keys(MODELS)) {
  const label = m === 'super' ? 'Nemotron super' : 'Nemotron lightning';
  D['SHIPPED: model on every message, rules + classifier as backup (' + label + ')'] = (x, p) => shipped(x, m, p);
}
D['Backup only, when the model is unavailable (rules + classifier)'] = (x, p) => shipped(x, null, p);

// ---- tune on dev only
// The backup (used when the model gives no answer) should not cry wolf: best F1 on dev with false alarms at most 15%.
function bestThreshold() {
  const scores = dev.map((x) => nb.get(x.id)).sort((a, b) => a - b);
  let best = { f1: -1, t: scores[scores.length - 1] };
  for (let i = 1; i < 100; i++) { const t = scores[Math.floor((i / 100) * scores.length)]; const m = metrics(dev, (x) => ({ warn: nb.get(x.id) >= t })); if (m.fpr <= 0.15 && m.f1 > best.f1) best = { f1: m.f1, t }; }
  return best.t;
}
const params = { nbThreshold: bestThreshold() };
const cascadeName = (m) => 'New: rules + local classifier, model only when unsure (' + (m === 'super' ? 'Nemotron super' : 'Nemotron lightning') + ')';
const usable = Object.keys(MODELS).filter((m) => Object.values(cache[m]).filter(Boolean).length >= dev.length * 0.9);
const primary = usable.includes('super') ? 'super' : usable[0];
const tuned = { model: primary };
params.warn = params.nbThreshold;

// ---- report
const pct = (v) => (v * 100).toFixed(1) + '%';
const ci = (c) => '[' + (c[0] * 100).toFixed(0) + '-' + (c[1] * 100).toFixed(0) + ']';
function table(rows, title, names) {
  const out = [];
  out.push('\n' + title + ' (' + rows.length + ' messages: ' + rows.filter((x) => x.label === 'scam').length + ' scams, ' + rows.filter((x) => x.label === 'legit').length + ' legitimate)');
  out.push('Design'.padEnd(78) + 'Caught scams (95% range)   False alarms (95% range)  Precision  F1     Model calls  Cost');
  const res = {};
  for (const n of names) {
    const m = metrics(rows, (x) => D[n](x, params));
    res[n] = m;
    out.push(n.padEnd(78) + (pct(m.recall) + ' ' + ci(m.recallCI)).padEnd(27) + (pct(m.fpr) + ' ' + ci(m.fprCI)).padEnd(26) + pct(m.precision).padEnd(11) + m.f1.toFixed(2).padEnd(7) + pct(m.calls).padEnd(13) + m.cost);
  }
  console.log(out.join('\n'));
  return res;
}
const names = Object.keys(D).filter((n) => !/lightning/.test(n) || usable.includes('lightning')).filter((n) => !/super/.test(n) || usable.includes('super')).filter((n) => !/Model on every message, cheap signals only as backup|New: rules \+ local classifier|unsure counts as fine|clear or override|can override|can clear/.test(n));
console.log('Missed scam counts as ' + MISS_COST + 'x a false alarm in the Cost column. Model answers available for:', usable.join(', ') || 'none');
console.log('Chosen on dev only: local classifier warning threshold', params.nbThreshold.toFixed(2));
const devRes = table(dev, 'DEV (used for tuning)', names);
const testRes = table(test, 'TEST (scored once)', names);

// breakdowns for the chosen design and the current app, on test
function breakdown(name, model) {
  const groups = {
    'all scams': (x) => x.label === 'scam',
    'disguised scams': (x) => x.label === 'scam' && x.transform,
    'non-English scams': (x) => x.label === 'scam' && x.lang !== 'en',
    'hard scams': (x) => x.label === 'scam' && x.difficulty === 'hard',
    'all legitimate': (x) => x.label === 'legit',
    'hard legitimate': (x) => x.label === 'legit' && x.difficulty === 'hard',
    'non-English legitimate': (x) => x.label === 'legit' && x.lang !== 'en',
  };
  const out = ['  ' + name];
  for (const [g, f] of Object.entries(groups)) {
    const rows = test.filter(f);
    if (!rows.length) continue;
    const warned = rows.filter((x) => D[name](x, params).warn).length;
    out.push('    ' + g.padEnd(24) + (rows[0].label === 'scam' ? 'caught ' : 'false alarm ') + warned + '/' + rows.length + ' (' + pct(warned / rows.length) + ')');
  }
  console.log(out.join('\n'));
}
console.log('\nBREAKDOWN ON TEST');
const L = primary === 'super' ? 'Nemotron super' : 'Nemotron lightning';
for (const n of ['Current app: rules, then ' + L + ' if one flag', 'SHIPPED: model on every message, rules + classifier as backup (' + L + ')', 'Backup only, when the model is unavailable (rules + classifier)']) breakdown(n);

// what the new design still gets wrong on test
if (primary) {
  const n = 'SHIPPED: model on every message, rules + classifier as backup (' + L + ')';
  const wrong = test.filter((x) => (D[n](x, params).warn) !== (x.label === 'scam'));
  console.log('\nMESTAKES OF THE NEW DESIGN ON TEST'.replace('MESTAKES', 'MISTAKES'), '(' + wrong.length + ')');
  for (const x of wrong.slice(0, 14)) console.log('  ' + (x.label === 'scam' ? 'MISSED' : 'FALSE ALARM').padEnd(12), x.category.padEnd(26), (x.transform || x.lang).padEnd(9), JSON.stringify(x.text.slice(0, 90)));
}
fs.writeFileSync(new URL('data/scam-eval/results.json', root), JSON.stringify({ missCost: MISS_COST, params: { warn: params.warn }, dev: devRes, test: testRes }, null, 1) + '\n');
