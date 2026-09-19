'use client';
import { useState } from 'react';
import { post } from '../useBlip';

const SAMPLES = [
  'TOLL NOTICE: Your E-ZPass balance is overdue. Pay $6.99 now at ezpass-tollpay.top to avoid a $50 fine.',
  'You are owed a $312 refund. Confirm your card number at bank-refund-secure.com within 24 hours.',
  'Your statement is ready. Open the app to view it.',
];
const TEXT = { likely_scam: 'Likely scam', suspicious: 'Suspicious', probably_fine: 'Probably fine', no_flags: 'No red flags found' };

export default function Scam() {
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
      <h1>Scam message check</h1>
      <p className="sub">Paste a text or email. We do not store the message.</p>
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
