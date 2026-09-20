'use client';
import { useEffect, useState } from 'react';
import { post, studentId } from '../useBlip';
import { SCENARIOS, START } from '@/lib/sandboxBank.mjs';
import ReadAloud from '../ReadAloud';
import Translated from '../Translated';
import { LangSelect } from '../lang';

const EVENTS = [
  ['autopay_enabled', 'Student enabled autopay'],
  ['payment_on_time', 'Payment posted before due date'],
  ['utilization_under_30', 'Utilization dropped under 30%'],
  ['emergency_fund_started', 'Emergency fund started'],
  ['credit_report_checked', 'Credit report checked'],
  ['basket_compared', 'Grocery basket compared'],
  ['card_frozen', 'Card frozen (recovery step)'],
];

const money = (n) => (n < 0 ? '-' : '') + '$' + (Math.abs(Math.round(n * 100) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const SEV = { alert: 'bad', warn: 'warn', good: 'good', info: '' };

export default function Bank() {
  const [acct, setAcct] = useState(START);
  const [feed, setFeed] = useState([]);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);
  const [sid, setSid] = useState('');
  useEffect(() => { setSid(studentId()); }, []);
  async function fire(type) {
    const r = await post('/api/events', { type });
    setLog([{ type, message: r.message, awarded: r.awarded, blocked: r.blocked }, ...log].slice(0, 8));
  }
  async function play(scenario) {
    setBusy(true);
    const r = await post('/api/sandbox-bank', { scenario, checking: acct.checking, savings: acct.savings });
    setBusy(false);
    if (r.error) return;
    setAcct(r.account);
    setFeed((f) => [{ tx: r.tx, alert: r.alert, award: r.award }, ...f].slice(0, 6));
  }
  async function act(a) {
    if (a.kind === 'save') {
      const r = await post('/api/sandbox-bank', { action: 'save', amount: a.params.amount, checking: acct.checking, savings: acct.savings });
      if (!r.error) { setAcct(r.account); setFeed((f) => [{ note: 'Moved ' + money(r.moved) + ' to savings.' + (r.award && r.award.awarded ? ' Quest complete: +' + r.award.awarded + ' points.' : '') }, ...f].slice(0, 6)); }
    } else if (a.kind === 'freeze') {
      const r = await post('/api/events', { type: 'card_frozen' });
      setFeed((f) => [{ note: 'Card frozen. ' + (r.message || '') }, ...f].slice(0, 6));
    } else if (a.kind === 'check_payment') {
      const q = new URLSearchParams({ tab: 'payment', amount: String(a.params.amount), method: a.params.method, who: a.params.who });
      if (a.params.note) q.set('note', a.params.note);
      window.location.href = '/scam?' + q.toString();
    }
  }
  async function resetMe() {
    await post('/api/reset', { scope: 'me' });
    setLog([]);
  }
  async function reset() {
    let password = '';
    try { password = sessionStorage.getItem('blipAdmin') || ''; } catch {}
    if (!password) {
      password = window.prompt('Admin password to reset everyone\'s demo data (leave empty on your own computer):');
      if (password === null) return;
    }
    const res = await fetch('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      try { sessionStorage.removeItem('blipAdmin'); } catch {}
      setLog([{ type: 'reset', message: d.error || 'Reset failed.' }, ...log].slice(0, 8));
      return;
    }
    try { sessionStorage.setItem('blipAdmin', password); } catch {}
    setLog([]);
  }
  return (
    <>
      <h1>Bank simulator</h1>
      <p className="sub">Stands in for the bank. Each button sends an event to the same API a real bank would call.</p>
      <div className="card">
        <h2>Acting as this student</h2>
        <p className="note" style={{ marginBottom: 8 }}>Events go to the student in this browser. To watch them arrive on a phone, open the student app there with this link:</p>
        <code style={{ display: 'block', overflowWrap: 'anywhere', padding: '8px 10px' }}>{sid ? window.location.origin + '/?student=' + sid : '…'}</code>
      </div>
      <div className="card">
        <h2>Sandbox bank feed</h2>
        <p className="note" style={{ marginBottom: 10 }}>A made-up student account with made-up money. Each button is something a real bank would send. TheBlip reads it and warns the student, and the warning shows on their Home screen. No real accounts or data.</p>
        <p style={{ margin: '0 0 8px' }}><LangSelect label="Language for alerts" /></p>
        <p style={{ margin: '0 0 12px' }}><b>Checking {money(acct.checking)}</b> &nbsp;·&nbsp; <b>Savings {money(acct.savings)}</b> &nbsp; <button className="ghost small" onClick={() => { setAcct(START); setFeed([]); }}>Reset sandbox</button></p>
        <div className="chips" style={{ marginBottom: 14 }}>
          {SCENARIOS.map((sc) => <button key={sc.id} className="ghost" disabled={busy} onClick={() => play(sc.id)}>{sc.label}</button>)}
        </div>
        {feed.length === 0 && <p className="note">Pick something above to see how TheBlip reacts.</p>}
        {feed.map((f, i) => f.note ? (
          <p key={i} className="note">{f.note}</p>
        ) : (
          <div key={i} className={'card ' + SEV[f.alert.severity]} style={{ margin: '0 0 10px' }} aria-live="polite">
            <p className="note" style={{ margin: 0 }}>{money(f.tx.amount)} · {f.tx.desc}</p>
            <h2 style={{ margin: '4px 0' }}>{f.alert.title}</h2>
            <p style={{ margin: '0 0 8px' }}>{f.alert.message}</p>
            {f.award && f.award.awarded > 0 && <p className="note"><b>+{f.award.awarded} points</b> for paying early.</p>}
            <div className="chips">
              {f.alert.actions.map((a) => <button key={a.kind} onClick={() => act(a)}>{a.label}</button>)}
              <ReadAloud text={f.alert.title + '. ' + f.alert.message} />
            </div>
            <Translated parts={[f.alert.title, f.alert.message]} />
          </div>
        ))}
      </div>
      <div className="card">
        <h2>Single events</h2>
        {EVENTS.map(([t, label]) => (
          <div className="q" key={t}><span>{label} <code className="note">{t}</code></span><button onClick={() => fire(t)}>Send event</button></div>
        ))}
      </div>
      <div className="card">
        <h2>API responses</h2>
        {log.length === 0 && <p className="note">Nothing sent yet.</p>}
        {log.map((l, i) => <p key={i} className="note"><code>{l.type}</code> → {l.blocked ? 'blocked: ' : ''}{l.message}{l.awarded ? ' (+' + l.awarded + ')' : ''}</p>)}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="ghost" onClick={resetMe}>Reset this student</button>
          <button className="ghost" onClick={reset}>Reset everyone (password)</button>
        </div>
      </div>
    </>
  );
}
