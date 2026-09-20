// Generates SYNTHETIC labeled messages for evaluating the scam check. Everything is invented:
// made-up brands' details, made-up domains, made-up numbers. Output: data/scam-eval/raw.json
//   node scripts/gen-scam-set.mjs
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

try {
  for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {}
const client = new Anthropic({ timeout: 180000, maxRetries: 2 });
const model = process.env.CLAUDE_MODEL || 'claude-opus-5';
const Schema = z.object({ messages: z.array(z.object({ text: z.string(), kind: z.enum(['sms', 'email', 'chat']), difficulty: z.enum(['easy', 'hard']) })) });

const SCAM = {
  toll_parking_fine: 'unpaid toll, parking or traffic fine text with a payment link',
  package_fee: 'undelivered package, customs or redelivery fee',
  bank_impersonation_code: 'someone posing as a bank fraud team asking for a one-time code or to move money',
  refund_overpayment: 'fake refund, or an overpayment where the target must send the difference back',
  job_check_equipment: 'fake job offer that sends a check or asks the student to buy equipment first',
  rental_deposit: 'fake rental listing asking for a deposit before viewing',
  friend_in_need: 'a hacked friend or relative account asking for urgent money or gift cards',
  prize_giveaway: 'a prize, giveaway or gift card win that needs a fee or personal details',
  crypto_investment: 'crypto or investment opportunity with guaranteed returns',
  tech_support: 'fake tech support, virus alert or subscription charge with a phone number to call',
  student_loan_fafsa: 'fake student loan forgiveness or financial aid that needs login or a fee',
  scholarship_fee: 'scholarship that asks for an application or processing fee',
  government_threat: 'fake tax agency, benefits or immigration threat demanding payment',
  utility_shutoff: 'fake utility or phone bill threatening a shutoff today',
  payment_app_request: 'fake Zelle, Venmo or Cash App payment request or "you received money" trap',
  gift_card_request: 'boss, professor or official asking the student to buy gift cards',
  account_unusual_activity: 'phishing about unusual sign-in or a locked account with a lookalike link',
  qr_code: 'message pushing the target to scan a QR code to fix a problem',
  fake_invoice_subscription: 'fake invoice or auto-renewal charge for a service the target never bought',
  romance_investment: 'wrong-number chat that turns friendly and then pushes an investment',
  task_scam: 'easy online task or app-rating job paid per task that later asks for deposits',
};
const LEGIT = {
  bank_alert_genuine: 'a genuine bank fraud or balance alert that does not ask for private details (may say never share your code)',
  otp_code: 'a one-time verification code text that warns never to share it',
  delivery_update: 'a genuine parcel tracking or delivery-window update with no payment request',
  university_admin: 'university messages: registration, financial aid, tuition due date, housing',
  landlord_maintenance: 'landlord or property manager messages about maintenance, rent reminders or lease',
  friend_split: 'a friend asking to split a bill or be paid back a few dollars, casual chat',
  appointment_reminder: 'doctor, dentist, advisor or haircut appointment reminder',
  order_receipt: 'an order confirmation or receipt from a shop',
  password_reset_requested: 'a password reset or sign-in notice for something the user just did',
  subscription_genuine: 'a genuine subscription renewal or price-change notice',
  employer_schedule: 'a manager or coworker about shifts, schedule, pay dates or onboarding paperwork',
  utility_bill_ready: 'a genuine utility, phone or internet bill-ready notice',
  family_check_in: 'a parent or relative checking in, sometimes mentioning sending money for groceries',
  professor_email: 'professor or TA emails about deadlines, grades, office hours',
  newsletter_promo: 'a real store or app promotional message with a sale and a link',
  payment_received: 'a genuine notification that a payment app transfer was sent or received',
};
const LANGS = { es: 'Spanish', fr: 'French', pt: 'Portuguese', yo: 'Yoruba', ha: 'Hausa', hi: 'Hindi', sw: 'Swahili', ar: 'Arabic' };

const SYSTEM = `You write SYNTHETIC test messages for a scam-detection evaluation that protects college students.

Rules:
- Every message is invented. Use invented brands' details, invented lookalike domains (for example tollpay-notice.top, secure-refund-center.com), and phone numbers in the 555-01xx style. Never use a real working URL or real phone number.
- Write messages the way people really receive them: varied length, tone and formatting, some sloppy, some polished, some with typos.
- Vary sender style: short texts, longer emails, chat messages.
- Set "difficulty" to "hard" when a careful human could hesitate (subtle scams, or legitimate messages that mention money, links, urgency or codes for good reasons) and "easy" otherwise.
- Do not add labels, explanations or placeholders like [name]. Only the message text.
- Do not try to make scams as persuasive as possible. Realistic, typical, and detectable by a careful reader.`;

async function ask(label, desc, n, lang) {
  const where = lang ? ` Write them in ${LANGS[lang]}, as a native speaker would.` : '';
  const what = label === 'scam' ? `${n} different SCAM messages: ${desc}.` : `${n} different LEGITIMATE (genuine, safe) messages: ${desc}.`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await client.messages.parse({ model, max_tokens: 6000, system: SYSTEM, messages: [{ role: 'user', content: what + where }], output_config: { effort: 'low', format: zodOutputFormat(Schema) } });
      const out = res.parsed_output && res.parsed_output.messages;
      if (Array.isArray(out) && out.length >= Math.ceil(n / 2)) return out;
    } catch (e) { console.log('retry', label, desc.slice(0, 30), String(e.message || e).slice(0, 80)); }
  }
  return [];
}

const jobs = [];
for (const [cat, d] of Object.entries(SCAM)) jobs.push({ label: 'scam', category: cat, desc: d, n: 8 });
for (const [cat, d] of Object.entries(LEGIT)) jobs.push({ label: 'legit', category: cat, desc: d, n: 10 });
for (const [lang] of Object.entries(LANGS)) {
  jobs.push({ label: 'scam', category: 'multilingual_scam', desc: 'common scams aimed at students and families: fees, prizes, fake bank calls, urgent money requests', n: 5, lang });
  jobs.push({ label: 'legit', category: 'multilingual_legit', desc: 'everyday genuine messages: family, bank alerts, deliveries, appointments, school', n: 5, lang });
}

const rows = [];
const queue = [...jobs];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const j = queue.shift();
    const out = await ask(j.label, j.desc, j.n, j.lang);
    for (const m of out) rows.push({ label: j.label, category: j.category, lang: j.lang || 'en', kind: m.kind, difficulty: m.difficulty, text: m.text.trim() });
    console.log((j.label + ' ' + j.category + (j.lang ? ' ' + j.lang : '')).padEnd(40), out.length);
  }
}));
const seen = new Set();
const uniq = rows.filter((r) => { const k = r.text.toLowerCase().replace(/\s+/g, ' '); if (seen.has(k) || r.text.length < 8) return false; seen.add(k); return true; });
fs.writeFileSync(new URL('../data/scam-eval/raw.json', import.meta.url), JSON.stringify(uniq, null, 1) + '\n');
console.log('total', uniq.length, 'scam', uniq.filter((r) => r.label === 'scam').length, 'legit', uniq.filter((r) => r.label === 'legit').length);
