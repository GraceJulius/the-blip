import fs from 'fs';
import { deobfuscate } from '../lib/scamNormalize.mjs';
import { train, score, features } from '../lib/scamNB.mjs';
import { decide, rulesFlags } from '../lib/scamCheck.mjs';
import { parseAnswer } from '../lib/nemotron.mjs';

let fails = 0;
const check = (n, c) => { if (!c) { fails++; console.log('FAIL', n); } };
const C = (code) => String.fromCharCode(code);

// ---- removing disguises
check('spaced letters joined', deobfuscate('p a y  now') === 'pay now');
check('digits for letters fixed inside words', deobfuscate('r3fund and 0nline') === 'refund and online');
check('real numbers are left alone', deobfuscate('Pay $6.99 by 10/12, code 123456') === 'Pay $6.99 by 10/12, code 123456');
check('lookalike Cyrillic letters fixed', deobfuscate('V' + C(0x0435) + 'rify your ' + C(0x0430) + 'ccount') === 'Verify your account');
check('hidden zero-width characters removed', deobfuscate('ver' + C(0x200b) + 'ify') === 'verify');
check('defanged links restored', deobfuscate('hxxp://pay-now[.]top') === 'http://pay-now.top');
check('emoji removed', deobfuscate('⚠️ Pay now 💰') === 'Pay now');
check('plain text is unchanged', deobfuscate('Your statement is ready.') === 'Your statement is ready.');
check('non-English text is not damaged', deobfuscate('Jọ̀wọ́ san owó rẹ') === 'Jọ̀wọ́ san owó rẹ' && deobfuscate('Confirme su cuenta') === 'Confirme su cuenta');
check('junk input is safe', deobfuscate(null) === '' && deobfuscate(undefined) === '' && deobfuscate(12345) === '12345');
check('very long input is fast enough', (() => { const t0 = Date.now(); deobfuscate('a '.repeat(20000)); return Date.now() - t0 < 1500; })());

// rules see through the disguise
check('rules catch a disguised message the plain rules miss', rulesFlags('V' + C(0x0435) + 'rify y0ur p a s s w o r d n0w').length >= 2);

// ---- reading the model's answer
check('valid JSON', parseAnswer('{"label":"scam","explanation":"Asks for money."}').label === 'scam');
check('almost-JSON with unquoted explanation', (() => { const a = parseAnswer('{\n "label": "scam",\n "explanation": Pay now or lose it.\n}'); return a && a.label === 'scam' && /Pay now/.test(a.explanation); })());
check('JSON with extra words around it', parseAnswer('Sure! {"label": "legit", "explanation": "Fine."} Hope that helps').label === 'legit');
check('unknown label rejected', parseAnswer('{"label":"maybe"}') === null && parseAnswer('nothing') === null && parseAnswer(null) === null);

// ---- the local classifier
const mini = [];
for (let i = 0; i < 12; i++) mini.push({ label: 'scam', text: 'Your parcel fee is unpaid. Pay now at fast-pay' + i + '.top to avoid a fine. Confirm your card number.' });
for (let i = 0; i < 12; i++) mini.push({ label: 'legit', text: 'Hi, class notes are on the shared drive. See you at lunch on Thursday, ' + i + ' pm?' });
const m = train(mini);
check('classifier separates its training examples', score(m, 'Pay the parcel fee now at quick-pay.top and confirm your card number') > 0 && score(m, 'See you at lunch, notes are on the drive') < 0);
check('features are not empty and are bounded', features('hello there').length > 5 && features('x'.repeat(5000)).length < 40000);
check('empty text scores zero', score(m, '') === 0 || Number.isFinite(score(m, '')));
const pruned = train(mini, 0.5, 50);
check('pruning keeps at most the requested weights', Object.keys(pruned.weights).length <= 50);

// ---- the decision, with a fake model
let calls = 0;
const nb = JSON.parse(fs.readFileSync(new URL('../data/scam-nb.json', import.meta.url), 'utf8'));
const ask = (answer) => async () => { calls++; return answer; };
const SCAM = 'URGENT: your account is suspended. Verify your password now at secure-login-check.top';
const LEGIT = 'Hey, are we still on for study group at 4? I saved you a seat by the window.';
const run = async (text, answer, opts = {}) => { calls = 0; const d = await decide(text, { nbModel: opts.nb === null ? null : (opts.nb || nb), askModel: ask(answer) }); return { ...d, calls }; };

// the model looks at every message
let r = await run(LEGIT, { label: 'legit', explanation: 'Friends chatting.' });
check('every message is shown to the model', r.calls === 1 && r.level === 'no_flags' && r.verified === true);
r = await run(SCAM, { label: 'scam', explanation: 'Wants your password.' });
check('model says scam: likely scam, with reasons', r.level === 'likely_scam' && r.flags.length >= 1 && r.model.label === 'scam' && r.verified === true);
r = await run(SCAM, { label: 'legit', explanation: 'x' });
check('model says legit: not called a likely scam, but the flags stay visible', r.level === 'probably_fine' && r.flags.length >= 1);
r = await run(LEGIT, { label: 'scam', explanation: 'x' });
check('a scam with no rule flags still gets a reason (pattern match)', r.level === 'likely_scam' && r.flags.length === 1 && r.flags[0].id === 'pattern');
r = await run(LEGIT, { label: 'unsure', explanation: '?' });
check('unsure model answer: suspicious', r.level === 'suspicious' && r.verified === true);

// backup when the model gives no answer
r = await run(SCAM, null);
check('no model answer: rules and classifier agree, so likely scam, marked unverified', r.level === 'likely_scam' && r.verified === false && r.via === 'backup');
r = await run('Dinner at 7? I will bring the notes.', null);
check('no model answer: an ordinary message is not flagged', r.level === 'no_flags' && r.verified === false);
r = await run(SCAM, null, { nb: null });
check('no model and no classifier file: rules still work', r.level === 'likely_scam');
r = await run('Your refund of $40 is waiting', null, { nb: null });
check('no model, no classifier, one flag: suspicious', r.level === 'suspicious');
r = await run('', { label: 'scam', explanation: 'x' });
check('empty message is safe and not sent to the model', r.level === 'no_flags' && r.calls === 0);
r = await run('   \n  ', { label: 'scam', explanation: 'x' });
check('blank message is safe', r.level === 'no_flags' && r.calls === 0);

// disguised messages
r = await run('V' + C(0x0435) + 'rify y0ur p a s s w o r d n0w at secure-login[.]top', null);
check('a disguised scam is caught even with no model', r.level !== 'no_flags');

// the levels the screen knows about
const UI = ['likely_scam', 'suspicious', 'probably_fine', 'no_flags'];
for (const t of [SCAM, LEGIT, 'Your refund of $40 is waiting', 'aaaa', '\u26A0\uFE0F ' + SCAM, 'Verify h' + C(0x0435) + 'ere', 'x'.repeat(4000)]) {
  for (const answer of [null, { label: 'scam', explanation: '' }, { label: 'legit', explanation: '' }, { label: 'unsure', explanation: '' }]) {
    const d = await decide(t, { nbModel: nb, askModel: async () => answer });
    check('level is one the screen knows: ' + JSON.stringify(t.slice(0, 16)) + ' / ' + (answer ? answer.label : 'no answer'), UI.includes(d.level) && Array.isArray(d.flags) && typeof d.verified === 'boolean');
  }
}

// the shipped classifier file, checked against the evaluation set (it was trained on it, so this is a sanity check, not a benchmark)
check('shipped classifier file is sane', nb.weights && Object.keys(nb.weights).length > 1000 && Object.keys(nb.weights).length <= 8000 && Number.isFinite(nb.params.warn));
const set = JSON.parse(fs.readFileSync(new URL('../data/scam-eval/set.json', import.meta.url), 'utf8'));
let tp = 0, fn = 0, fp = 0, tn = 0;
for (const x of set) { const d = await decide(x.text, { nbModel: nb, askModel: async () => null }); const w = d.level !== 'no_flags'; if (x.label === 'scam') w ? tp++ : fn++; else w ? fp++ : tn++; }
check('backup mode catches at least 90% of the evaluation scams', tp / (tp + fn) >= 0.9);
check('backup mode flags at most 20% of the evaluation legitimate messages', fp / (fp + tn) <= 0.2);
check('evaluation set has a test split it never trains on for the reported numbers', set.some((x) => x.split === 'test') && set.some((x) => x.split === 'dev'));
check('a disguised copy stays in the same split as its original', set.filter((x) => x.transform).every((x) => set.find((o) => o.id === x.base).split === x.split));

if (fails) { console.log(fails + ' checks failed'); process.exit(1); }
console.log('all scam checks passed');
