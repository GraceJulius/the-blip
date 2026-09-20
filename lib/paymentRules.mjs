import { checkRules } from './scamRules.mjs';

// "Before you send money": a plain, rule-based check of a payment request.
// No model, no account data. The student describes the request; we look for the
// patterns that show up in most payment scams and say what to do instead.

export const METHODS = [
  { id: 'bank', label: 'Bank or payment app transfer' },
  { id: 'card', label: 'Card payment' },
  { id: 'gift_card', label: 'Gift cards' },
  { id: 'crypto', label: 'Crypto or a crypto ATM' },
  { id: 'wire', label: 'Wire transfer' },
];

export const WHO = [
  { id: 'known', label: 'Someone I know and can reach another way' },
  { id: 'business', label: 'A business or landlord I found myself' },
  { id: 'stranger', label: 'Someone I have not met' },
  { id: 'bank_claim', label: 'Someone saying they are my bank, a company or the government' },
];

export const SITUATIONS = [
  { id: 'pressure', label: 'They want it right now' },
  { id: 'secrecy', label: 'They told me not to tell anyone, or not to tell my bank' },
  { id: 'unsolicited', label: 'They contacted me first' },
  { id: 'reversal', label: 'They "sent too much" and want some sent back' },
  { id: 'safe_account', label: 'They say my account is hacked and I must move money' },
  { id: 'before_seeing', label: 'It is a deposit or fee before I have seen the thing (rental, job, tickets)' },
];

// weight 3 = stop on its own, 2 = strong, 1 = worth a pause
const CHECKS = [
  { id: 'safe_account', weight: 3, when: (i) => i.situations.includes('safe_account'), label: 'They say your account is in danger and you must move money', advice: 'Real banks never ask you to move money to keep it safe. Hang up and call the number on the back of your card.' },
  { id: 'gift_card', weight: 3, when: (i) => i.method === 'gift_card', label: 'Gift cards as payment', advice: 'Only scammers ask to be paid in gift cards. Real bills and offices never do.' },
  { id: 'crypto', weight: 3, when: (i) => i.method === 'crypto', label: 'Crypto or a crypto ATM as payment', advice: 'Money sent this way almost never comes back. Do not pay anyone who asks for it.' },
  { id: 'secrecy', weight: 3, when: (i) => i.situations.includes('secrecy'), label: 'You were told to keep it secret', advice: 'Secrecy is how scammers stop you from getting help. Tell a friend and your bank.' },
  { id: 'reversal', weight: 3, when: (i) => i.situations.includes('reversal'), label: 'They want money "sent back"', advice: 'A common trick: a fake payment or bad check arrives, then you send real money back. Wait until your bank confirms the money is truly yours.' },
  { id: 'bank_claim', weight: 2, when: (i) => i.who === 'bank_claim', label: 'Someone claiming to be your bank, a company or an agency', advice: 'Do not act on their message. Contact the real organisation using a number or app you already trust.' },
  { id: 'wire', weight: 2, when: (i) => i.method === 'wire', label: 'Wire transfer', advice: 'Wires are very hard to undo. Only send one to someone you have confirmed in person or by a number you looked up.' },
  { id: 'stranger_bank', weight: 2, when: (i) => i.who === 'stranger' && i.method === 'bank', label: 'Sending a bank transfer to someone you have not met', advice: 'Transfers between people are hard to reverse. Use a card or a marketplace with buyer protection for strangers.' },
  { id: 'before_seeing', weight: 2, when: (i) => i.situations.includes('before_seeing'), label: 'Paying before you have seen the rental, job or tickets', advice: 'See it in person or on a verified listing first. Fake rentals, jobs and tickets are common student scams.' },
  { id: 'unsolicited', weight: 1, when: (i) => i.situations.includes('unsolicited'), label: 'They contacted you first', advice: 'Look the person or company up yourself before paying.' },
  { id: 'pressure', weight: 1, when: (i) => i.situations.includes('pressure'), label: 'Pressure to pay right now', advice: 'Real requests can wait an hour. Take the time.' },
  { id: 'big', weight: 1, when: (i) => i.amount >= 500, label: 'A large amount', advice: 'For amounts this size, double check the person or company first.' },
];

const TEXT_RULES = [
  { id: 'text_overpay', label: 'The message mentions overpaying or sending back the difference', re: /overpa|over-pa|send back the (rest|difference|extra)|refund the (difference|extra)/i },
  { id: 'text_job', label: 'A job that starts with you buying equipment or depositing a check', re: /(buy|purchase|order) (your )?(equipment|supplies|laptop)|deposit (this|the) check|mobile deposit/i },
  { id: 'text_verify', label: 'They want you to "verify" or "unlock" something with a payment', re: /verify (your )?(account|identity)|unlock (your )?account|release fee|processing fee|clearance fee/i },
];

function clean(v, allowed, fallback) {
  return allowed.some((a) => a.id === v) ? v : fallback;
}

export function checkPayment(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const amount = Math.max(0, Math.min(1e7, Number(input.amount) || 0));
  const i = {
    amount,
    method: clean(input.method, METHODS, 'bank'),
    who: clean(input.who, WHO, 'known'),
    situations: (Array.isArray(input.situations) ? input.situations : []).filter((s) => SITUATIONS.some((x) => x.id === s)),
    note: typeof input.note === 'string' ? input.note.slice(0, 1000) : '',
  };

  const flags = CHECKS.filter((c) => c.when(i)).map((c) => ({ id: c.id, label: c.label, advice: c.advice, weight: c.weight }));
  for (const r of TEXT_RULES) {
    if (i.note && r.re.test(i.note)) flags.push({ id: r.id, label: r.label, advice: 'This wording shows up in known scams. Do not send anything yet.', weight: 2 });
  }
  if (i.note) {
    for (const f of checkRules(i.note).flags) {
      if (!flags.some((x) => x.id === f.id)) flags.push({ id: f.id, label: f.label, advice: 'Do not follow links from the request. Go to the official app or site yourself.', weight: 1 });
    }
  }

  const score = flags.reduce((n, f) => n + f.weight, 0);
  const anyStop = flags.some((f) => f.weight >= 3);
  const level = anyStop || score >= 4 ? 'stop' : score >= 1 ? 'pause' : 'ok';

  const next = level === 'stop'
    ? ['Do not send anything.', 'Contact your bank using the number on your card or in your bank app, and tell them what happened.', 'If you already sent money, call your bank right away. The sooner they know, the better the chance.', 'Report it at reportfraud.ftc.gov.']
    : level === 'pause'
      ? ['Pause and check one thing before you pay: is this person or company who they say they are?', 'Look them up yourself. Do not use links or numbers they sent you.', 'If you still feel unsure, ask a friend or your bank.']
      : ['Nothing here matches a common scam pattern.', 'Still confirm the name and account with the person, another way than the message that asked for the money.'];

  return { level, score, flags: flags.map(({ id, label, advice }) => ({ id, label, advice })), next };
}

export const LEVEL_LABEL = { stop: 'Stop. Do not send this.', pause: 'Pause. Check first.', ok: 'No warning signs found' };
