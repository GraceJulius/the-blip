'use client';
import { useEffect, useState } from 'react';

export default function Console() {
  const [enrolled, setEnrolled] = useState(5000);
  const [avoided, setAvoided] = useState(4);
  const [s, setS] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const r = await fetch('/api/stats?enrolled=' + enrolled + '&avoided=' + avoided, { cache: 'no-store' });
      const j = await r.json();
      if (alive) setS(j);
    }
    load();
    const t = setInterval(load, 2000);
    return () => { alive = false; clearInterval(t); };
  }, [enrolled, avoided]);

  if (!s) return <p>Loading…</p>;
  const m = (label, v) => <div className="metric"><small>{label}</small><b>{v}</b></div>;
  return (
    <>
      <h1>Bank console</h1>
      <p className="sub">What the bank sees. Live numbers come from the demo student; the projection uses editable assumptions.</p>
      <div className="card">
        <h2>Live from the demo</h2>
        <div className="grid">
          {m('Quests completed', s.live.completions)}
          {m('Points issued', s.live.pointsIssued)}
          {m('Scams reported', s.live.scamReports)}
          {m('Incidents recovered', s.live.recovered + '/' + s.live.incidents)}
        </div>
      </div>
      <div className="card">
        <h2>Projected program results (illustrative)</h2>
        <div className="row"><label>Enrolled students</label><input type="range" min="1000" max="20000" step="500" value={enrolled} onChange={(e) => setEnrolled(+e.target.value)} /><span className="val">{enrolled.toLocaleString()}</span></div>
        <div className="row"><label>Avoided loss per quest</label><input type="range" min="0" max="10" step="0.5" value={avoided} onChange={(e) => setAvoided(+e.target.value)} /><span className="val">${avoided.toFixed(1)}</span></div>
        <div className="grid">
          {m('Quests completed', s.projection.completions.toLocaleString())}
          {m('Points cost', '$' + s.projection.cost.toLocaleString())}
          {m('Est. avoided loss', '$' + s.projection.avoidedLoss.toLocaleString())}
          {m('Return per $1', '$' + s.projection.returnPerDollar.toFixed(2))}
        </div>
        <p className="note">Assumes {Math.round(s.assumptions.completionRate * 100)}% of students finish {s.assumptions.questsEach} quests at ${s.assumptions.costPerQuest} points cost each. These are placeholders, not PNC data. Replace with the bank's own numbers in a pilot.</p>
      </div>
    </>
  );
}
