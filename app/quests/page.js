'use client';
import { useState } from 'react';
import { useBlip, post } from '../useBlip';

export default function Quests() {
  const { state, refresh } = useBlip();
  const [note, setNote] = useState('');
  if (!state) return <p>Loading…</p>;

  async function redeem() {
    const r = await post('/api/redeem');
    setNote(r.ok ? 'Demo gift card code: ' + r.code + ' (' + r.note + ')' : r.error);
    refresh();
  }

  return (
    <>
      <h1>Quests</h1>
      <p className="sub">Points come from real safe habits reported by your bank, never from spending or opening cards.</p>
      <div className="card">
        <h2>{state.points} points · Level {state.level.index + 1} {state.level.name}</h2>
        <div className="prog"><div style={{ width: state.level.progress + '%' }} /></div>
        {state.quests.map((q) => (
          <div className="q" key={q.id}>
            <span>{q.done ? '✓ ' : ''}{q.title} <span className="note">({q.category})</span></span>
            <span className="pill">{q.done ? 'Done' : '+' + q.points}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>Rewards</h2>
        <p className="note">$5 gift card costs {state.redeemCost} points. Demo only.</p>
        <button onClick={redeem}>Redeem $5 gift card</button> {note && <span className="note">{note}</span>}
      </div>
      <p className="note">Quests complete when the bank sends an event. Use the Bank simulator tab to fire them.</p>
    </>
  );
}
