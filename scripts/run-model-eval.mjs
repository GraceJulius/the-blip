// Asks a Nemotron model about every message in the evaluation set and caches the answers,
// so the evaluation can be re-run and tuned without more API calls.
//   node scripts/run-model-eval.mjs nvidia/nemotron-3-super-120b-a12b
import fs from 'fs';
import { classifyWithNemotron } from '../lib/nemotron.mjs';

try {
  for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {}
const model = process.argv[2] || process.env.NEMOTRON_MODEL;
const limit = Number(process.argv[3]) || Infinity;
if (!process.env.NVIDIA_API_KEY || !model) { console.log('Set NVIDIA_API_KEY in .env.local and pass a model name.'); process.exit(1); }
const set = JSON.parse(fs.readFileSync(new URL('../data/scam-eval/set.json', import.meta.url), 'utf8'));
const file = new URL('../data/scam-eval/model-' + model.split('/').pop() + '.json', import.meta.url);
let cache = {};
try { cache = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
const only = process.env.ONLY_SPLIT;                                     // e.g. ONLY_SPLIT=test to save time
const todo = set.filter((x) => !(x.id in cache) && (!only || x.split === only)).slice(0, limit);
console.log(model, ':', Object.keys(cache).length, 'cached,', todo.length, 'to do');
let done = 0, failed = 0;
const save = () => fs.writeFileSync(file, JSON.stringify(cache, null, 0) + '\n');
const gap = Number(process.env.EVAL_GAP_MS || 2200);                    // stay under the provider's rate limit
// One request at a time. When the provider says "slow down" (or answers nothing), wait and try again.
for (const x of todo) {
  let r = null;
  for (let attempt = 0; attempt < 5 && !r; attempt++) {
    if (attempt) await new Promise((res) => setTimeout(res, 4000 * attempt));
    const t0 = Date.now();
    r = await classifyWithNemotron(x.text, { model, timeoutMs: 40000, fresh: true });
    if (r) cache[x.id] = { label: r.label, why: r.explanation, ms: Date.now() - t0 };
  }
  if (!r) failed++;                                                     // not cached: a later run tries again
  if (++done % 20 === 0) { save(); console.log(done, 'done,', failed, 'gave up'); }
  await new Promise((res) => setTimeout(res, gap));
}
save();
const vals = Object.values(cache);
console.log('finished. answered', vals.length, 'of', set.length, '| gave up on', failed, '| median ms', vals.map((v) => v.ms).sort((a, b) => a - b)[Math.floor(vals.length / 2)]);
