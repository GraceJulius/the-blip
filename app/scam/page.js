'use client';
import { useState } from 'react';
import { post } from '../useBlip';
import { METHODS, WHO, SITUATIONS, LEVEL_LABEL } from '@/lib/paymentRules.mjs';

const SAMPLES = [
  'TOLL NOTICE: Your E-ZPass balance is overdue. Pay $6.99 now at ezpass-tollpay.top to avoid a $50 fine.',
  'You are owed a $312 refund. Confirm your card number at bank-refund-secure.com within 24 hours.',
  'Your statement is ready. Open the app to view it.',
];
const TEXT = { likely_scam: 'Likely scam', suspicious: 'Suspicious', probably_fine: 'Probably fine', no_flags: 'No red flags found' };

function MessageCheck() {
  const [message, setMessage] = useState('');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(report) {
    setErr(''); setInfo('');
    if (!message.trim()) { setErr('Paste a message first'); return; }
    setBusy(true);
    const r = await post('/api/scam-check', { message, report });
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setRes(r);
    if (report) setInfo(r.award ? r.award.message + (r.award.awarded ? ' +' + r.award.awarded + ' points' : '') : 'Nothing to report: no red flags found.');
  }

  const risky = res && (res.level === 'likely_scam' || res.level === 'suspicious');
  const cls = res ? (res.level === 'likely_scam' ? 'bad' : res.level === 'suspicious' ? 'warn' : 'good') : '';
  return (
    <>
      <div className="card">
        <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Paste a suspicious message" />
        <p><button disabled={busy} onClick={() => run(false)}>{busy ? 'Checking…' : 'Check message'}</button> <span className="err">{err}</span>{busy && <span className="note"> The model can take a few seconds when it is busy.</span>}</p>
      </div>
      {res && (
        <div className={'card ' + cls}>
          <h2>{TEXT[res.level]}</h2>
          {res.flags.length > 0 && <ul>{res.flags.map((f) => <li key={f.id}>{f.label}</li>)}</ul>}
          {res.model && res.model.explanation && <p>{res.model.explanation}</p>}
          {risky && <p className="note">Do not tap the link. Open your bank app directly. You can forward scam texts to 7726.</p>}
          {res.level === 'probably_fine' && <p className="note">One thing looked odd, but the model reads it as a normal message. Still open links and accounts from the official app, not from the message.</p>}
          {risky && <button onClick={() => run(true)}>Report this scam (+25 points)</button>}
          {info && <p>{info}</p>}
        </div>
      )}
    </>
  );
}

const EXAMPLES = [
  { amount: 600, method: 'gift_card', who: 'business', situations: ['before_seeing', 'pressure'], note: 'The landlord says I must send the deposit today or lose the apartment.' },
  { amount: 45, method: 'card', who: 'known', situations: [], note: '' },
];

function PaymentCheck() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [who, setWho] = useState('known');
  const [situations, setSituations] = useState([]);
  const [note, setNote] = useState('');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function toggle(id) { setSituations((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])); }
  function fill(ex) { setAmount(String(ex.amount)); setMethod(ex.method); setWho(ex.who); setSituations(ex.situations); setNote(ex.note); setRes(null); setErr(''); }

  async function run() {
    setErr('');
    if (!(Number(amount) > 0)) { setErr('Enter the amount they want'); return; }
    setBusy(true);
    const r = await post('/api/payment-check', { amount: Number(amount), method, who, situations, note });
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setRes(r);
  }

  const cls = res ? (res.level === 'stop' ? 'bad' : res.level === 'pause' ? 'warn' : 'good') : '';
  return (
    <>
      <div className="card">
        <p className="note" style={{ marginBottom: 12 }}>Someone is asking you for money. Tell us how, and we point out the warning signs before you pay. Never enter an account number, card number or password here.</p>
        <div className="row"><label htmlFor="pay-amount">Amount</label><input id="pay-amount" type="number" min="1" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="For example 200" style={{ maxWidth: 160 }} /></div>
        <div className="row"><label htmlFor="pay-method">How they want it</label><select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></div>
        <div className="row"><label htmlFor="pay-who">Who is asking</label><select id="pay-who" value={who} onChange={(e) => setWho(e.target.value)}>{WHO.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></div>
        <fieldset style={{ border: 0, padding: 0, margin: '12px 0' }}>
          <legend className="note" style={{ marginBottom: 8 }}>Does any of this fit?</legend>
          {SITUATIONS.map((x) => (
            <label key={x.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={situations.includes(x.id)} onChange={() => toggle(x.id)} style={{ marginTop: 3 }} />
              <span>{x.label}</span>
            </label>
          ))}
        </fieldset>
        <label htmlFor="pay-note" className="note">What did they say? (optional, paste it)</label>
        <textarea id="pay-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: I overpaid you, please send back the difference" style={{ marginTop: 6 }} />
        <p>
          <button disabled={busy} onClick={run}>{busy ? 'Checking…' : 'Check this payment'}</button>{' '}
          <button className="ghost" onClick={() => fill(EXAMPLES[0])}>Try a risky example</button>{' '}
          <button className="ghost" onClick={() => fill(EXAMPLES[1])}>Try a safe example</button>{' '}
          <span className="err">{err}</span>
        </p>
      </div>
      {res && (
        <div className={'card ' + cls} aria-live="polite">
          <h2>{LEVEL_LABEL[res.level]}</h2>
          {res.flags.length > 0 && <ul>{res.flags.map((f) => <li key={f.id}><b>{f.label}.</b> {f.advice}</li>)}</ul>}
          <p style={{ margin: '12px 0 4px' }}><b>What to do</b></p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>{res.next.map((n, i) => <li key={i}>{n}</li>)}</ol>
          <p className="note" style={{ marginTop: 12 }}>This is general guidance from common scam patterns. It cannot prove a request is safe or unsafe. Nothing you entered is stored.</p>
        </div>
      )}
    </>
  );
}

export default function Scam() {
  const [mode, setMode] = useState('message');
  return (
    <>
      <h1>Scam check</h1>
      <p className="sub">{mode === 'message' ? 'Paste a text or email. We do not store the message.' : 'Check a request for money before you send it. We do not store anything.'}</p>
      <div className="seg" role="tablist" aria-label="What to check">
        <button role="tab" aria-selected={mode === 'message'} className={mode === 'message' ? 'on' : ''} onClick={() => setMode('message')}>A message</button>
        <button role="tab" aria-selected={mode === 'payment'} className={mode === 'payment' ? 'on' : ''} onClick={() => setMode('payment')}>Before you send money</button>
      </div>
      {mode === 'message' ? <MessageCheck /> : <PaymentCheck />}
    </>
  );
}
