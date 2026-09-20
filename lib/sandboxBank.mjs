// Sandbox bank feed. Everything here is synthetic: a made-up student with a made-up
// checking and savings balance. It stands in for the events a real bank would send.
// TheBlip reads each transaction and decides what to tell the student. No model, no
// real accounts, nothing stored except the alert text.

export const START = { checking: 412.3, savings: 60 };

export const SCENARIOS = [
  { id: 'paycheck', label: 'Paycheck arrives', tx: { kind: 'deposit', desc: 'Campus job paycheck', amount: 620, hour: 9 } },
  { id: 'odd_hours', label: 'Big purchase at 2 AM', tx: { kind: 'card', desc: 'ELECTRO-DEAL ONLINE (out of state)', amount: -389, hour: 2 } },
  { id: 'new_payee', label: 'Payment to a new person', tx: { kind: 'transfer', desc: 'Transfer to first-time payee "QuickCash Help"', amount: -500, hour: 15, newPayee: true, memo: 'processing fee to release your prize' } },
  { id: 'gift_cards', label: 'Gift cards bought', tx: { kind: 'card', desc: 'Gift cards x4 (retail store)', amount: -400, hour: 17, giftCards: true } },
  { id: 'rent', label: 'Rent autopay runs', tx: { kind: 'card', desc: 'Rent autopay', amount: -380, hour: 6 } },
  { id: 'card_payment', label: 'Card bill paid early', tx: { kind: 'card_payment', desc: 'Credit card payment (due in 5 days)', amount: -120, hour: 10, daysBeforeDue: 5 } },
];

const LOW = 75;
const money = (n) => '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

function round5(n) { return Math.max(20, Math.round(n / 5) * 5); }

// Apply a transaction to an account. A debit never takes checking below zero.
export function applyTransaction(account, tx) {
  const checking = Math.max(0, Number(account.checking) || 0);
  const savings = Math.max(0, Number(account.savings) || 0);
  let amount = tx.amount;
  if (amount < 0) amount = -Math.min(-amount, checking);
  const after = { checking: Math.round((checking + amount) * 100) / 100, savings };
  return { tx: { ...tx, amount }, account: after };
}

// Decide what TheBlip says about a transaction. Returns { severity, title, message, actions, event }.
export function analyze(tx, account) {
  const out = Math.abs(tx.amount);

  if (tx.giftCards) {
    return { severity: 'alert', title: 'Gift cards are a scam signal', message: 'Only scammers ask to be paid in gift cards. If someone told you to buy these, stop, keep the receipt, and call your bank.',
      actions: [{ kind: 'check_payment', label: 'Check this payment', params: { amount: out, method: 'gift_card', who: 'bank_claim' } }, { kind: 'freeze', label: 'Freeze my card' }] };
  }
  if (tx.newPayee && out >= 200) {
    const fee = /fee|release|clearance|processing|prize|unlock|verify/i.test(tx.memo || '');
    return { severity: 'alert', title: fee ? 'This looks like an advance-fee scam' : 'First payment to a new person', message: fee
      ? 'You paid ' + money(out) + ' to someone new for a "fee" to get something. Real prizes and refunds never cost money first. Call your bank now: a fast report gives you the best chance.'
      : 'You sent ' + money(out) + ' to someone you have not paid before. Make sure you know them, because transfers between people are hard to undo.',
      actions: [{ kind: 'check_payment', label: 'Check this payment', params: { amount: out, method: 'bank', who: 'stranger', note: tx.memo || '' } }] };
  }
  if (tx.kind === 'card' && out >= 200 && tx.hour >= 0 && tx.hour <= 5) {
    return { severity: 'alert', title: 'Large purchase at an unusual hour', message: money(out) + ' at ' + tx.desc + ' around ' + (tx.hour === 0 ? 'midnight' : tx.hour + ' AM') + '. If this was not you, freeze the card now and tell your bank.',
      actions: [{ kind: 'freeze', label: 'Freeze my card' }] };
  }
  if (tx.kind === 'deposit') {
    const suggest = round5(tx.amount * 0.1);
    return { severity: 'good', title: 'Paycheck landed. Save a little first?', message: money(tx.amount) + ' came in. Moving ' + money(suggest) + ' to savings now takes it out of reach of everyday spending.',
      actions: [{ kind: 'save', label: 'Move ' + money(suggest) + ' to savings', params: { amount: suggest } }] };
  }
  if (tx.kind === 'card_payment' && tx.daysBeforeDue >= 1) {
    return { severity: 'good', title: 'Paid early. Nice.', message: 'Your card payment posted ' + tx.daysBeforeDue + ' days before the due date. Paying on time protects your credit.', actions: [], event: 'payment_on_time' };
  }
  if (account.checking < LOW) {
    return { severity: 'warn', title: 'Low balance heads-up', message: 'Checking is down to ' + money(account.checking) + '. Hold off on extras and check what is due in the next few days so nothing bounces.', actions: [] };
  }
  return { severity: 'info', title: 'Nothing unusual', message: tx.desc + ' looks normal for this account.', actions: [] };
}

// Moving money to savings. Returns the new account and, once savings reach $100, the quest event.
export function moveToSavings(account, amount) {
  const checking = Math.max(0, Number(account.checking) || 0);
  const savings = Math.max(0, Number(account.savings) || 0);
  const move = Math.max(0, Math.min(Number(amount) || 0, checking));
  const after = { checking: Math.round((checking - move) * 100) / 100, savings: Math.round((savings + move) * 100) / 100 };
  return { account: after, moved: move, event: savings < 100 && after.savings >= 100 ? 'emergency_fund_started' : null };
}
