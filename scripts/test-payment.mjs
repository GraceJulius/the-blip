import { checkPayment, METHODS, WHO, SITUATIONS } from '../lib/paymentRules.mjs';

let fails = 0;
function check(name, cond) { if (!cond) { fails++; console.log('FAIL', name); } }
const lv = (x) => checkPayment(x).level;

// obvious scams stop
check('gift cards stop', lv({ amount: 200, method: 'gift_card', who: 'bank_claim' }) === 'stop');
check('gift cards from anyone stop', lv({ amount: 20, method: 'gift_card', who: 'known' }) === 'stop');
check('crypto stops', lv({ amount: 300, method: 'crypto', who: 'stranger' }) === 'stop');
check('safe account stops', lv({ amount: 900, method: 'bank', who: 'bank_claim', situations: ['safe_account'] }) === 'stop');
check('secrecy stops', lv({ amount: 50, method: 'bank', who: 'known', situations: ['secrecy'] }) === 'stop');
check('send-back trick stops', lv({ amount: 400, method: 'bank', who: 'stranger', situations: ['reversal'] }) === 'stop');

// grey areas pause
check('stranger by bank transfer pauses', lv({ amount: 80, method: 'bank', who: 'stranger' }) === 'pause');
check('deposit before seeing pauses', lv({ amount: 150, method: 'bank', who: 'business', situations: ['before_seeing'] }) === 'pause');
check('pressure alone pauses', lv({ amount: 30, method: 'card', who: 'business', situations: ['pressure'] }) === 'pause');
check('large amount pauses', lv({ amount: 800, method: 'card', who: 'business' }) === 'pause');

// safe payments are ok
check('friend, small, card is ok', lv({ amount: 25, method: 'card', who: 'known' }) === 'ok');
check('friend, bank transfer is ok', lv({ amount: 40, method: 'bank', who: 'known' }) === 'ok');
check('ok has next steps', checkPayment({ amount: 10, method: 'card', who: 'known' }).next.length >= 1);

// several small flags add up
check('pressure + unsolicited + stranger stops', lv({ amount: 100, method: 'bank', who: 'stranger', situations: ['pressure', 'unsolicited'] }) === 'stop');

// text rules
check('overpay wording flagged', checkPayment({ amount: 100, method: 'bank', who: 'stranger', note: 'I overpaid you, please send back the difference' }).flags.some((f) => f.id === 'text_overpay'));
check('job equipment wording flagged', checkPayment({ amount: 100, method: 'bank', who: 'business', note: 'Deposit this check and buy your equipment from our vendor' }).flags.some((f) => f.id === 'text_job'));
check('lookalike link in note reuses message rules', checkPayment({ amount: 10, method: 'card', who: 'business', note: 'Pay at secure-pay.top now' }).flags.some((f) => f.id === 'link'));

// robustness: junk input never throws and never crashes the level
for (const junk of [undefined, null, {}, { amount: 'abc' }, { amount: -5 }, { amount: 1e99 }, { method: 'nope', who: 'nope', situations: 'x' }, { situations: ['nope', 42] }, { note: 12345 }]) {
  let r; try { r = checkPayment(junk); } catch (e) { r = null; }
  check('junk input ok: ' + JSON.stringify(junk), r && ['ok', 'pause', 'stop'].includes(r.level));
}
check('long note is capped', checkPayment({ note: 'x'.repeat(50000) }).level === 'ok');

// every flag explains itself and says what to do
const all = checkPayment({ amount: 900, method: 'gift_card', who: 'bank_claim', situations: SITUATIONS.map((s) => s.id), note: 'overpaid, verify your account at pay.top' });
check('every flag has label and advice', all.flags.every((f) => f.label && f.advice));
check('stop tells you to call the bank', all.next.some((n) => /bank/i.test(n)));
check('option lists are non-empty', METHODS.length && WHO.length && SITUATIONS.length);

// copy rule used across the app: no em dashes, no exclamation marks
const copy = JSON.stringify([all, METHODS, WHO, SITUATIONS]);
check('no em dashes', !copy.includes(String.fromCharCode(8212)));
check('no exclamation marks', !copy.includes('!'));

if (fails) { console.log(fails + ' checks failed'); process.exit(1); }
console.log('all payment checks passed');
