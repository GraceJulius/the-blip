import fs from 'fs';
import { checkRules } from '../lib/scamRules.mjs';

const samples = JSON.parse(fs.readFileSync(new URL('../data/scam-samples.json', import.meta.url), 'utf8'));
let tp = 0, fp = 0, tn = 0, fn = 0;
const misses = [];
for (const s of samples) {
  const flagged = checkRules(s.text).level !== 'no_flags';
  if (s.label === 'scam' && flagged) tp++;
  else if (s.label === 'scam' && !flagged) { fn++; misses.push(['missed scam', s.text]); }
  else if (s.label === 'legit' && flagged) { fp++; misses.push(['false alarm', s.text]); }
  else tn++;
}
const total = samples.length;
console.log('Samples:', total);
console.log('Accuracy:', ((tp + tn) / total * 100).toFixed(1) + '%');
console.log('Caught scams (recall):', (tp / Math.max(tp + fn, 1) * 100).toFixed(1) + '%');
console.log('Precision:', (tp / Math.max(tp + fp, 1) * 100).toFixed(1) + '%');
console.log('Confusion: TP', tp, 'FP', fp, 'TN', tn, 'FN', fn);
for (const [k, t] of misses) console.log('-', k + ':', t);
