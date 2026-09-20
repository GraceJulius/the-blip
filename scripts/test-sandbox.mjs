import { SCENARIOS, START, applyTransaction, analyze, moveToSavings } from '../lib/sandboxBank.mjs';
import { clampText, ttsConfig, synthesize, MAX_CHARS } from '../lib/tts.mjs';

let fails = 0;
const check = (n, c) => { if (!c) { fails++; console.log('FAIL', n); } };
const run = (id, account = START) => {
  const sc = SCENARIOS.find((s) => s.id === id);
  const a = applyTransaction(account, sc.tx);
  return { ...a, alert: analyze(a.tx, a.account) };
};

// each scenario reacts the way a careful bank would
check('paycheck is a good nudge to save', run('paycheck').alert.severity === 'good' && run('paycheck').alert.actions[0].kind === 'save');
check('paycheck adds money', run('paycheck').account.checking === 1032.3);
check('2 AM purchase is an alert with freeze', run('odd_hours').alert.severity === 'alert' && run('odd_hours').alert.actions.some((a) => a.kind === 'freeze'));
check('new payee fee is an advance-fee alert', /advance-fee/.test(run('new_payee', { checking: 900, savings: 0 }).alert.title));
check('new payee links to the payment check', run('new_payee', { checking: 900, savings: 0 }).alert.actions[0].kind === 'check_payment');
check('gift cards alert', run('gift_cards', { checking: 900, savings: 0 }).alert.severity === 'alert');
check('rent from a small balance warns low balance', run('rent').alert.severity === 'warn');
check('early card payment triggers the quest event', run('card_payment').alert.event === 'payment_on_time');

// money math
check('debit cannot overdraw checking', applyTransaction({ checking: 100, savings: 0 }, { kind: 'card', desc: 'x', amount: -500, hour: 12 }).account.checking === 0);
check('debit recorded at what was applied', applyTransaction({ checking: 100, savings: 0 }, { kind: 'card', desc: 'x', amount: -500, hour: 12 }).tx.amount === -100);
check('junk balances become zero', applyTransaction({ checking: 'abc', savings: -5 }, { kind: 'deposit', desc: 'x', amount: 10, hour: 9 }).account.checking === 10);
const big = analyze({ kind: 'card', desc: 'Groceries', amount: -30, hour: 14 }, { checking: 500, savings: 0 });
check('ordinary purchase is quiet', big.severity === 'info');
check('daytime large purchase is not the night alert', analyze({ kind: 'card', desc: 'Laptop', amount: -700, hour: 14 }, { checking: 900, savings: 0 }).severity !== 'alert');

// savings
const s1 = moveToSavings({ checking: 500, savings: 60 }, 50);
check('moving to savings updates both', s1.account.checking === 450 && s1.account.savings === 110);
check('crossing $100 fires emergency fund event', s1.event === 'emergency_fund_started');
check('under $100 no event', moveToSavings({ checking: 500, savings: 10 }, 20).event === null);
check('cannot move more than you have', moveToSavings({ checking: 30, savings: 0 }, 500).moved === 30);
check('already past $100 does not fire again', moveToSavings({ checking: 500, savings: 150 }, 20).event === null);

// copy rule: no em dashes or exclamation marks
const copy = JSON.stringify(SCENARIOS.map((s) => run(s.id, { checking: 900, savings: 0 }).alert));
check('no em dashes', !copy.includes(String.fromCharCode(8212)));
check('no exclamation marks', !copy.includes('!'));

// read-aloud
check('text is cleaned and capped', clampText('a  b\n c') === 'a b c' && clampText('x'.repeat(5000)).length === MAX_CHARS && clampText(null) === '');
check('config has a default voice', ttsConfig({}).voice.length > 5 && ttsConfig({}).key === '');
const off = await synthesize('hello', { key: '', voice: 'v', model: 'm' });
check('no key means fall back', !off.ok && off.reason === 'voice_off' && off.status === 503);
check('empty text rejected', (await synthesize('   ', { key: 'k', voice: 'v', model: 'm' })).status === 400);
let seen;
const fake = async (url, opts) => { seen = { url, opts }; return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }; };
const ok = await synthesize('Stop. Do not send this.', { key: 'k', voice: 'voice1', model: 'model1' }, fake);
check('calls the provider correctly', ok.ok && seen.url.includes('/text-to-speech/voice1') && seen.opts.headers['xi-api-key'] === 'k' && JSON.parse(seen.opts.body).model_id === 'model1');
const bad = await synthesize('hi', { key: 'k', voice: 'v', model: 'm' }, async () => ({ ok: false }));
check('provider error handled', !bad.ok && bad.status === 502);
const boom = await synthesize('hi', { key: 'k', voice: 'v', model: 'm' }, async () => { throw new Error('down'); });
check('network failure handled', !boom.ok && boom.status === 502);

if (fails) { console.log(fails + ' checks failed'); process.exit(1); }
console.log('all sandbox and voice checks passed');
