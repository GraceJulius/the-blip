import { deobfuscate } from './scamNormalize.mjs';

// A small Naive Bayes text classifier on character n-grams. It runs locally in microseconds, needs no
// network, and works on other languages and on misspelled or disguised text, because it looks at letter
// patterns rather than a fixed keyword list. Score > 0 leans scam, score < 0 leans legit.

export const N_MIN = 2;
export const N_MAX = 5;

export function features(text) {
  const t = ' ' + deobfuscate(text).toLowerCase().replace(/https?:\/\/(?:www\.)?/g, ' URL ').replace(/\d/g, '0') + ' ';
  const set = new Set();
  for (let n = N_MIN; n <= N_MAX; n++) for (let i = 0; i + n <= t.length; i++) set.add(t.slice(i, i + n));
  return [...set];
}

export function train(rows, alpha = 0.5, keepTop = Infinity) {
  const counts = { scam: new Map(), legit: new Map() };
  const docs = { scam: 0, legit: 0 };
  for (const r of rows) {
    const c = counts[r.label];
    docs[r.label]++;
    for (const f of features(r.text)) c.set(f, (c.get(f) || 0) + 1);
  }
  const vocab = new Set([...counts.scam.keys(), ...counts.legit.keys()]);
  const weights = {};
  const ds = docs.scam + 2 * alpha, dl = docs.legit + 2 * alpha;
  for (const f of vocab) {
    const ps = ((counts.scam.get(f) || 0) + alpha) / ds;
    const pl = ((counts.legit.get(f) || 0) + alpha) / dl;
    const w = Math.log(ps / pl);
    if (Math.abs(w) > 0.35) weights[f] = Math.round(w * 1000) / 1000;      // keep only informative n-grams
  }
  let kept = weights;
  if (keepTop < Infinity) kept = Object.fromEntries(Object.entries(weights).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, keepTop));
  return { weights: kept, prior: Math.log((docs.scam + 1) / (docs.legit + 1)), n: rows.length };
}

// Average evidence per n-gram (so long and short messages are comparable), plus the class prior.
export function score(model, text) {
  const f = features(text);
  if (!f.length) return 0;
  let s = 0, hit = 0;
  for (const g of f) { const w = model.weights[g]; if (w !== undefined) { s += w; hit++; } }
  return (hit ? (s / Math.sqrt(hit)) : 0) + model.prior * 0.5;
}
