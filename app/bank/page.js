'use client';
import { useState } from 'react';
import { post } from '../useBlip';

const EVENTS = [
  ['autopay_enabled', 'Student enabled autopay'],
  ['payment_on_time', 'Payment posted before due date'],
  ['utilization_under_30', 'Utilization dropped under 30%'],
  ['emergency_fund_started', 'Emergency fund started'],
  ['credit_report_checked', 'Credit report checked'],
  ['basket_compared', 'Grocery basket compared'],
  ['card_frozen', 'Card frozen (recovery step)'],
];

export default function Bank() {
  const [log, setLog] = useState([]);
  async function fire(type) {
    const r = await post('/api/events', { type });
    setLog([{ type, message: r.message, awarded: r.awarded, blocked: r.blocked }, ...log].slice(0, 8));
  }
  async function reset() {
    let password = '';
    try { password = sessionStorage.getItem('blipAdmin') || ''; } catch {}
    if (!password) {
      password = window.prompt('Admin password to reset the demo data (leave empty on your own computer):');
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
        {EVENTS.map(([t, label]) => (
          <div className="q" key={t}><span>{label} <code className="note">{t}</code></span><button onClick={() => fire(t)}>Send event</button></div>
        ))}
      </div>
      <div className="card">
        <h2>API responses</h2>
        {log.length === 0 && <p className="note">Nothing sent yet.</p>}
        {log.map((l, i) => <p key={i} className="note"><code>{l.type}</code> → {l.blocked ? 'blocked: ' : ''}{l.message}{l.awarded ? ' (+' + l.awarded + ')' : ''}</p>)}
        <button className="ghost" onClick={reset}>Reset demo data</button>
      </div>
    </>
  );
}
