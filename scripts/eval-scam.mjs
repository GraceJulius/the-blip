import fs from 'fs';
import { checkRules } from '../lib/scamRules.mjs';
import { classifyWithNemotron } from '../lib/nemotron.mjs';

try {
  for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {}

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const models = (opt('--models', process.env.NEMOTRON_MODEL || '')).split(',').map((s) => s.trim()).filter(Boolean);
const runAll = flag('--all');
const delay = Number(opt('--delay', 1500));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const samples = JSON.parse(fs.readFileSync(new URL('../data/scam-samples.json', import.meta.url), 'utf8'));
const useModel = models.length > 0 && !!process.env.NVIDIA_API_KEY;

function tally(rows, pred) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const r of rows) {
    const p = pred(r);
    if (r.label === 'scam') p ? tp++ : fn++;
    else p ? fp++ : tn++;
  }
  const n = rows.length;
  return { acc: ((tp + tn) / n) * 100, caught: (tp / Math.max(tp + fn, 1)) * 100, fp, fn };
}

const rows = samples.map((s) => ({ ...s, ...checkRules(s.text), model: {} }));
const suspicious = rows.filter((r) => r.level === 'suspicious').length;
console.log('Samples:', rows.length, '(scams:', rows.filter((r) => r.label === 'scam').length + ', legit:', rows.filter((r) => r.label === 'legit').length + ')');
console.log('Messages with exactly one flag ("suspicious"):', suspicious);

if (useModel) {
  const jobs = rows.filter((r) => runAll || r.level === 'suspicious');
  console.log('Calling', models.length, 'model(s) on', jobs.length, 'message(s). About', Math.ceil((jobs.length * models.length * delay) / 1000), 'seconds.');
  for (const m of models) {
    for (const r of jobs) {
      r.model[m] = await classifyWithNemotron(r.text, { model: m });
      await sleep(delay);
    }
  }
} else {
  console.log('Model skipped: set NVIDIA_API_KEY and NEMOTRON_MODEL in .env.local (or pass --models a,b) to include it.');
}

const table = [];
const short = (m) => m.split('/').pop();
table.push(['Rules only: warn on any flag', tally(rows, (r) => r.level !== 'no_flags')]);
table.push(['Rules only: strong alert (2+ flags)', tally(rows, (r) => r.level === 'likely_scam')]);
if (useModel) {
  for (const m of models) {
    table.push(['Rules + ' + short(m) + ': strong alert', tally(rows, (r) => r.level === 'likely_scam' || (r.level === 'suspicious' && r.model[m] && r.model[m].label === 'scam'))]);
    if (runAll) table.push([short(m) + ' alone', tally(rows, (r) => r.model[m] && r.model[m].label === 'scam')]);
  }
}

const W = Math.max(46, ...table.map(([n]) => n.length + 2));
console.log('\n' + 'Method'.padEnd(W) + 'Accuracy  Caught scams  False alarms  Missed');
for (const [name, t] of table) {
  console.log(name.padEnd(W) + (t.acc.toFixed(1) + '%').padEnd(10) + (t.caught.toFixed(1) + '%').padEnd(14) + String(t.fp).padEnd(14) + t.fn);
}

if (useModel) {
  console.log('\nCases where the model changed the outcome or looked unsure:');
  let shown = 0;
  for (const r of rows) {
    for (const m of models) {
      const out = r.model[m];
      if (r.level === 'suspicious' && (!out || out.label !== 'legit') && shown < 12) {
        const verdict = !out ? 'no answer (rules only)' : out.label;
        const right = out && ((out.label === 'scam' && r.label === 'scam') || (out.label === 'legit' && r.label === 'legit'));
        console.log('-', short(m) + ':', verdict, out ? (right ? '[correct]' : '[wrong]') : '', '| truth:', r.label, '|', r.text.slice(0, 80));
        shown++;
      }
    }
  }
  fs.writeFileSync(new URL('../data/eval-results.json', import.meta.url), JSON.stringify({ ranAt: new Date().toISOString(), models, runAll, summary: table.map(([name, t]) => ({ name, ...t })) }, null, 2));
  console.log('\nSaved summary to data/eval-results.json');
}

console.log('\nNote: samples written to match the rules will score too well. Only quote results from a hard, self-written set.');
