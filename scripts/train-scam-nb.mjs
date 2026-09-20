// Trains the local classifier on the whole evaluation set and writes data/scam-nb.json.
// The cascade settings (clear-below, warn-above) come from data/scam-eval/results.json, which were tuned on the dev part only.
//   node scripts/train-scam-nb.mjs
import fs from 'fs';
import { train } from '../lib/scamNB.mjs';
const set = JSON.parse(fs.readFileSync(new URL('../data/scam-eval/set.json', import.meta.url), 'utf8'));
let params = { warn: 4.7 };
try { const r = JSON.parse(fs.readFileSync(new URL('../data/scam-eval/results.json', import.meta.url), 'utf8')); if (r.params && Number.isFinite(r.params.warn)) params = { warn: Math.round(r.params.warn * 100) / 100 }; } catch {}
const model = train(set, 0.5, 8000);
for (const k of Object.keys(model.weights)) model.weights[k] = Math.round(model.weights[k] * 100) / 100;
fs.writeFileSync(new URL('../data/scam-nb.json', import.meta.url), JSON.stringify({ ...model, params, trainedOn: set.length, note: 'Synthetic training data. See docs/SCAM-EVAL.md.' }) + '\n');
console.log('trained on', set.length, 'messages;', Object.keys(model.weights).length, 'weights; params', JSON.stringify(params));
