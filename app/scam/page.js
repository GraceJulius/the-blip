'use client';
import { useEffect, useState } from 'react';
import { post } from '../useBlip';
import ReadAloud from '../ReadAloud';
import Translated from '../Translated';
import { LangSelect } from '../lang';
import { useT } from '../i18n';
import { T } from '@/lib/i18n.mjs';
import { METHODS, WHO, SITUATIONS, LEVEL_LABEL } from '@/lib/paymentRules.mjs';

const SAMPLES = [
  'TOLL NOTICE: Your E-ZPass balance is overdue. Pay $6.99 now at ezpass-tollpay.top to avoid a $50 fine.',
  'You are owed a $312 refund. Confirm your card number at bank-refund-secure.com within 24 hours.',
  'Your statement is ready. Open the app to view it.',
];
const TEXT = { likely_scam: T('Likely scam'), suspicious: T('Suspicious'), probably_fine: T('Probably fine'), no_flags: T('No red flags found') };

function MessageCheck() {
  const t = useT();
  const [message, setMessage] = useState('');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(report) {
    setErr(''); setInfo('');
    if (!message.trim()) { setErr(t('Paste a message first')); return; }
    setBusy(true);
    const r = await post('/api/scam-check', { message, report });
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setRes(r);
    if (report) setInfo(r.award ? r.award.message + (r.award.awarded ? ' +' + r.award.awarded + ' ' + t('points') : '') : t('Nothing to report: no red flags found.'));
  }

  const risky = res && (res.level === 'likely_scam' || res.level === 'suspicious');
  const cls = res ? (res.level === 'likely_scam' ? 'bad' : res.level === 'suspicious' ? 'warn' : 'good') : '';
  return (
    <>
      <div className="card">
        <label htmlFor="scam-message" className="note">{t('Paste a suspicious message')}</label>
        <textarea id="scam-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('Paste a suspicious message')} style={{ marginTop: 6 }} />
        <p><button disabled={busy} onClick={() => run(false)}>{busy ? t('Checking…') : t('Check message')}</button> <span className="err" role="alert">{err}</span>{busy && <span className="note" role="status"> {t('The model can take a few seconds when it is busy.')}</span>}</p>
      </div>
      {res && (
        <>
        <Translated parts={[TEXT[res.level], ...res.flags.map((f) => f.label), ...(res.model && res.model.explanation ? [res.model.explanation] : []), ...(risky ? [T('Do not tap the link. Open your bank app directly. You can forward scam texts to 7726.')] : [])]} />
        <div className={'card ' + cls} role="status">
          <h2>{t(TEXT[res.level])}</h2>
          {res.flags.length > 0 && <ul>{res.flags.map((f) => <li key={f.id}>{f.label}</li>)}</ul>}
          {res.model && res.model.explanation && <p>{res.model.explanation}</p>}
          {risky && <p className="note">{t('Do not tap the link. Open your bank app directly. You can forward scam texts to 7726.')}</p>}
          {res.verified === false && <p className="note">{t('The AI double-check was not available, so this is a first-pass check only.')}</p>}
          {res.level === 'probably_fine' && <p className="note">{t('One thing looked odd, but the model reads it as a normal message. Still open links and accounts from the official app, not from the message.')}</p>}
          {risky && <button onClick={() => run(true)}>{t('Report this scam (+25 points)')}</button>}{' '}
          <ReadAloud text={TEXT[res.level] + '. ' + res.flags.map((f) => f.label).join('. ') + '. ' + (res.model && res.model.explanation ? res.model.explanation : '')} />
          {info && <p>{info}</p>}
        </div>
        </>
      )}
    </>
  );
}

const EXAMPLES = [
  { amount: 600, method: 'gift_card', who: 'business', situations: ['before_seeing', 'pressure'], note: 'The landlord says I must send the deposit today or lose the apartment.' },
  { amount: 45, method: 'card', who: 'known', situations: [], note: '' },
];

function PaymentCheck({ init = {} }) {
  const t = useT();
  const [amount, setAmount] = useState(init.amount || '');
  const [method, setMethod] = useState(init.method || 'bank');
  const [who, setWho] = useState(init.who || 'known');
  const [situations, setSituations] = useState([]);
  const [note, setNote] = useState(init.note || '');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  function toggle(id) { setSituations((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])); }
  function fill(ex) { setAmount(String(ex.amount)); setMethod(ex.method); setWho(ex.who); setSituations(ex.situations); setNote(ex.note); setRes(null); setErr(''); }

  async function run() {
    setErr('');
    if (!(Number(amount) > 0)) { setErr(t('Enter the amount they want')); return; }
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
        <p className="note" style={{ marginBottom: 12 }}>{t('Someone is asking you for money. Tell us how, and we point out the warning signs before you pay. Never enter an account number, card number or password here.')}</p>
        <div className="row"><label htmlFor="pay-amount">{t('Amount')}</label><input id="pay-amount" type="number" min="1" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('For example 200')} style={{ maxWidth: 160 }} /></div>
        <div className="row"><label htmlFor="pay-method">{t('How they want it')}</label><select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m.id} value={m.id}>{t(m.label)}</option>)}</select></div>
        <div className="row"><label htmlFor="pay-who">{t('Who is asking')}</label><select id="pay-who" value={who} onChange={(e) => setWho(e.target.value)}>{WHO.map((m) => <option key={m.id} value={m.id}>{t(m.label)}</option>)}</select></div>
        <fieldset style={{ border: 0, padding: 0, margin: '12px 0' }}>
          <legend className="note" style={{ marginBottom: 8 }}>{t('Does any of this fit?')}</legend>
          {SITUATIONS.map((x) => (
            <label key={x.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={situations.includes(x.id)} onChange={() => toggle(x.id)} style={{ marginTop: 3 }} />
              <span>{t(x.label)}</span>
            </label>
          ))}
        </fieldset>
        <label htmlFor="pay-note" className="note">{t('What did they say? (optional, paste it)')}</label>
        <textarea id="pay-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('For example: I overpaid you, please send back the difference')} style={{ marginTop: 6 }} />
        <p>
          <button disabled={busy} onClick={run}>{busy ? t('Checking…') : t('Check this payment')}</button>{' '}
          <button className="ghost" onClick={() => fill(EXAMPLES[0])}>{t('Try a risky example')}</button>{' '}
          <button className="ghost" onClick={() => fill(EXAMPLES[1])}>{t('Try a safe example')}</button>{' '}
          <span className="err" role="alert">{err}</span>
        </p>
      </div>
      {res && (
        <>
        <Translated parts={[LEVEL_LABEL[res.level], ...res.flags.map((f) => f.label + '. ' + f.advice), ...res.next]} />
        <div className={'card ' + cls} aria-live="polite">
          <h2>{t(LEVEL_LABEL[res.level])}</h2>
          {res.flags.length > 0 && <ul>{res.flags.map((f) => <li key={f.id}><b>{f.label}.</b> {f.advice}</li>)}</ul>}
          <p style={{ margin: '12px 0 4px' }}><b>{t('What to do')}</b></p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>{res.next.map((n, i) => <li key={i}>{n}</li>)}</ol>
          <ReadAloud text={LEVEL_LABEL[res.level] + ' ' + res.flags.map((f) => f.label).join('. ') + '. ' + res.next.join(' ')} />
          <p className="note" style={{ marginTop: 12 }}>{t('This is general guidance from common scam patterns. It cannot prove a request is safe or unsafe. Nothing you entered is stored.')}</p>
        </div>
        </>
      )}
    </>
  );
}

export default function Scam() {
  const t = useT();
  const [mode, setMode] = useState('message');
  const [init, setInit] = useState({});
  // The bank sandbox links here with the payment already filled in.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('tab') === 'payment') {
      const ok = (v, list) => list.some((x) => x.id === v);
      setInit({ amount: String(Number(q.get('amount')) || ''), method: ok(q.get('method'), METHODS) ? q.get('method') : 'bank', who: ok(q.get('who'), WHO) ? q.get('who') : 'known', note: (q.get('note') || '').slice(0, 300) });
      setMode('payment');
    }
  }, []);
  return (
    <>
      <h1>{t('Scam check')}</h1>
      <p className="sub">{mode === 'message' ? t('Paste a text or email. We do not store the message.') : t('Check a request for money before you send it. We do not store anything.')}</p>
      <div className="seg" role="group" aria-label={t('What to check')}>
        <button aria-pressed={mode === 'message'} className={mode === 'message' ? 'on' : ''} onClick={() => setMode('message')}>{t('A message')}</button>
        <button aria-pressed={mode === 'payment'} className={mode === 'payment' ? 'on' : ''} onClick={() => setMode('payment')}>{t('Before you send money')}</button>
      </div>
      <p style={{ margin: '0 0 14px' }}><LangSelect /></p>
      {mode === 'message' ? <MessageCheck /> : <PaymentCheck key={JSON.stringify(init)} init={init} />}
    </>
  );
}
