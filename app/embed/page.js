'use client';
import { useEffect, useRef, useState } from 'react';

function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const light = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  return { soft: `rgba(${r}, ${g}, ${b}, 0.16)`, on: light ? '#111111' : '#ffffff' };
}

export default function Embed() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const box = useRef(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    let alive = true;
    async function load() {
      try {
        const res = await fetch('/api/embed/state?token=' + encodeURIComponent(token), { cache: 'no-store' });
        const j = await res.json();
        if (!alive) return;
        if (!res.ok) { setErr(j.error || 'This widget could not load.'); return; }
        setData(j);
        const c = shade(j.org.accent);
        const root = document.documentElement.style;
        root.setProperty('--accent', j.org.accent);
        root.setProperty('--accent-soft', c.soft);
        root.setProperty('--on-accent', c.on);
      } catch { if (alive) setErr('This widget could not load.'); }
    }
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    const send = () => { try { window.parent.postMessage({ type: 'blip-height', height: Math.ceil(document.body.getBoundingClientRect().height) }, '*'); } catch {} };
    send();
    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, [data, err]);

  if (err) return <div className="card" style={{ margin: 0 }}><p className="note" style={{ margin: 0 }}>{err}</p></div>;
  if (!data) return <div className="card" style={{ margin: 0 }}><p className="note" style={{ margin: 0 }}>Loading…</p></div>;
  const open = data.quests.filter((q) => !q.done).slice(0, 3);
  const done = data.quests.filter((q) => q.done).length;
  return (
    <div ref={box} className="card" style={{ margin: 0 }}>
      <div className="place-head">
        <b>{data.org.name} rewards</b>
        <span className="pill">{data.points} points</span>
      </div>
      <div className="lvl" style={{ margin: '12px 0 8px' }}>
        <div className="num">{data.level.index + 1}</div>
        <div className="info">
          <div className="name">{data.level.name}</div>
          <div className="prog"><div style={{ width: data.level.progress + '%' }} /></div>
          <div className="note">{done} of {data.quests.length} quests done</div>
        </div>
      </div>
      {data.locked && <p className="note" style={{ color: 'var(--warn)' }}>Recovery mode is on. Quests are paused.</p>}
      {open.length > 0 && (
        <div className="list">
          {open.map((q) => <div className="item" key={q.id}><span>{q.title}</span><span className="pill">+{q.points}</span></div>)}
        </div>
      )}
      {open.length === 0 && <p className="note" style={{ margin: 0 }}>Every quest is done. Nice work.</p>}
    </div>
  );
}
