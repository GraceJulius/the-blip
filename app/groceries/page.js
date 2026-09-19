'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import FoodTabs from '../FoodTabs';
import { post } from '../useBlip';
import { CATALOG, TEMPLATES } from '@/lib/grocery.mjs';

const money = (n) => '$' + Number(n).toFixed(2);
const tone = (h) => (h >= 75 ? 'ok' : h >= 45 ? 'warn' : 'bad');

export default function Groceries() {
  const [items, setItems] = useState([]);
  const [budget, setBudget] = useState('');
  const [ask, setAsk] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [note, setNote] = useState('');
  const [award, setAward] = useState(0);
  const [search, setSearch] = useState('');
  const [advice, setAdvice] = useState(null);
  const [adviceBusy, setAdviceBusy] = useState(false);
  const seq = useRef(0);
  const skip = useRef(false);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    if (items.length === 0) { setRes(null); setAdvice(null); return; }
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      const r = await post('/api/groceries/plan', { items, budget: budget ? Number(budget) : undefined });
      if (mine === seq.current && !r.error) { setRes(r); if (r.questAward > 0) setAward(r.questAward); }
    }, 300);
    return () => clearTimeout(t);
  }, [items, budget]);

  const qtyOf = (id) => (items.find((i) => i.id === id) || {}).qty || 0;
  const add = (id) => { setAdvice(null); setItems((p) => (p.some((i) => i.id === id) ? p.map((i) => (i.id === id ? { ...i, qty: Math.min(10, i.qty + 1) } : i)) : [...p, { id, qty: 1 }])); };
  const bump = (id, d) => { setAdvice(null); setItems((p) => p.map((i) => (i.id === id ? { ...i, qty: Math.max(0, Math.min(10, i.qty + d)) } : i)).filter((i) => i.qty > 0)); };
  const useTemplate = (t) => { setAdvice(null); setNote(''); setBudget(String(t.budget)); setItems(t.items.map((i) => ({ ...i }))); };

  async function build() {
    if (!ask.trim()) { setNote('Describe what you need first, for example: healthy dinners for a week under $40.'); return; }
    setBusy(true); setNote(''); setAdvice(null);
    const r = await post('/api/groceries/plan', { request: ask, budget: budget ? Number(budget) : undefined });
    setBusy(false);
    if (r.error) { setNote(r.error); return; }
    skip.current = true;
    setItems(r.items.map(({ id, qty }) => ({ id, qty })));
    if (!budget && r.budget) setBudget(String(r.budget.amount));
    setRes(r);
    if (r.questAward > 0) setAward(r.questAward);
    const bits = [];
    if (r.items.length === 0) bits.push('I could not match that to anything in the catalog. Try adding items below.');
    if (r.usedClaude) bits.push('Claude read your request.');
    if (r.claudeNote) bits.push(r.claudeNote);
    if (r.unmatched && r.unmatched.length) bits.push('Not in the catalog: ' + r.unmatched.join(', ') + '.');
    setNote(bits.join(' '));
  }

  function swap(s) { setAdvice(null); setItems((p) => { const q = (p.find((i) => i.id === s.from.id) || {}).qty || 0; const rest = p.filter((i) => i.id !== s.from.id); const ex = rest.find((i) => i.id === s.to.id); return ex ? rest.map((i) => (i.id === s.to.id ? { ...i, qty: Math.min(10, i.qty + q) } : i)) : [...rest, { id: s.to.id, qty: q }]; }); }
  function swapAll() { if (!res) return; let next = items.map((i) => ({ ...i })); for (const s of res.swaps) { const q = (next.find((i) => i.id === s.from.id) || {}).qty || 0; if (!q) continue; next = next.filter((i) => i.id !== s.from.id); const ex = next.find((i) => i.id === s.to.id); if (ex) ex.qty = Math.min(10, ex.qty + q); else next.push({ id: s.to.id, qty: q }); } setAdvice(null); setItems(next); }
  function trim() { if (res && res.budget && res.budget.trim) { setAdvice(null); setItems(res.budget.trim.items.map(({ id, qty }) => ({ id, qty }))); } }

  async function getAdvice() {
    setAdviceBusy(true);
    const r = await post('/api/groceries/advice', { items, budget: budget ? Number(budget) : undefined });
    setAdviceBusy(false);
    setAdvice(r.error ? { text: r.error, claude: false } : { text: r.advice, claude: r.usedClaude });
  }

  const matches = CATALOG.filter((c) => !search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, search.trim() ? 12 : 10);
  const byId = Object.fromEntries(CATALOG.map((c) => [c.id, c]));

  return (
    <>
      <h1>Compare groceries</h1>
      <p className="sub">Build a list, see what it costs at each store, and find healthier swaps that will not wreck your budget.</p>
      <FoodTabs />

      {award > 0 && <div className="card good" style={{ padding: '12px 16px' }}><b>Quest complete: +{award} points</b> for comparing a grocery basket.</div>}

      <div className="card">
        <h2>Tell us what you need</h2>
        <textarea rows={2} value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="For example: healthy dinners for a week under $40, or oats, eggs and 3 cans of black beans" />
        <div className="actions">
          <button disabled={busy} onClick={build}>{busy ? 'Building…' : 'Build my list'}</button>
          <span className="note">Claude reads your request when it is available. Otherwise a simple matcher does.</span>
        </div>
        {note && <p className="note" style={{ marginTop: 10 }}>{note}</p>}
        <div className="chips" style={{ marginTop: 12 }}>
          {TEMPLATES.map((t) => <button key={t.id} className="ghost small" onClick={() => useTemplate(t)}>{t.label}</button>)}
        </div>
      </div>

      <div className="card">
        <h2>Your list {items.length > 0 && <span className="note">({items.reduce((n, i) => n + i.qty, 0)} items)</span>}</h2>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items to add, like eggs or rice" />
        <div className="chips" style={{ margin: '10px 0 14px' }}>
          {matches.map((c) => <button key={c.id} className="ghost small" onClick={() => add(c.id)}>+ {c.name}{qtyOf(c.id) ? ' (' + qtyOf(c.id) + ')' : ''}</button>)}
          {matches.length === 0 && <span className="note">Nothing matches that. Try another word.</span>}
        </div>
        {items.length === 0 ? <p className="note">Your list is empty. Add items above, pick a starter list, or describe what you need.</p> : (
          <div className="list">
            {items.map((i) => { const c = byId[i.id]; return (
              <div className="item" key={i.id}>
                <span><span className={'dot ' + tone(c.health)} title={c.why} />{c.name} <span className="note">{c.unit} · health {c.health}</span></span>
                <span className="qty">
                  <button className="ghost small" aria-label={'Fewer ' + c.name} onClick={() => bump(i.id, -1)}>−</button>
                  <b>{i.qty}</b>
                  <button className="ghost small" aria-label={'More ' + c.name} onClick={() => bump(i.id, 1)}>+</button>
                </span>
              </div>); })}
          </div>
        )}
        <div className="row" style={{ marginTop: 14 }}>
          <label htmlFor="budget">Weekly budget (optional)</label>
          <input id="budget" type="number" min="0" step="1" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 40" style={{ maxWidth: 140 }} />
        </div>
      </div>

      {res && res.items.length > 0 && (
        <>
          <h2 className="section">Where to shop</h2>
          <div className="stores">
            {res.stores.map((s) => (
              <div key={s.id} className={'store' + (s.badges.includes('Cheapest') ? ' best' : '')}>
                <div className="store-head"><b>{s.name}</b>{s.badges.map((b) => <span key={b} className={'pill' + (b === 'Cheapest' ? '' : ' ok')}>{b}</span>)}</div>
                <div className="tot">{money(s.total)}{!s.complete && <span className="note"> partial</span>}</div>
                {s.complete ? <div className="note">Carries everything on your list</div> : <div className="note warnText">Does not carry: {s.missing.join(', ')}</div>}
                {res.swaps.length > 0 && s.healthyComplete && <div className="sub2">With healthier swaps: <b>{money(s.healthyTotal)}</b> <span className="note">({s.healthyExtra >= 0 ? '+' : '−'}{money(Math.abs(s.healthyExtra))})</span></div>}
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Health rating</h2>
            <div className="two">
              <div><div className="note">Your list now</div><div className={'big ' + tone(res.healthScore)}>{res.healthScore}<span className="note"> / 100</span></div></div>
              <div><div className="note">With healthier swaps</div><div className={'big ' + tone(res.healthierScore)}>{res.healthierScore}<span className="note"> / 100</span></div></div>
            </div>
            <div className="prog"><div style={{ width: res.healthScore + '%' }} /></div>
          </div>

          {res.swaps.length > 0 && (
            <div className="card">
              <div className="place-head"><h2>Healthier swaps</h2><button className="ghost small" onClick={swapAll}>Swap all</button></div>
              <div className="list">
                {res.swaps.map((s) => (
                  <div className="item" key={s.from.id}>
                    <span>{s.from.name} → <b>{s.to.name}</b> <span className="pill ok">+{s.healthGain} health</span><div className="note">{s.why} {s.costDelta !== null && (s.costDelta <= 0 ? 'Costs ' + money(Math.abs(s.costDelta)) + ' less at ' + s.atStore + '.' : 'About ' + money(s.costDelta) + ' more at ' + s.atStore + '.')}</div></span>
                    <button className="ghost small" onClick={() => swap(s)}>Swap</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {res.split && (
            <div className="card">
              <h2>Split the trip and save {money(res.split.savings)}</h2>
              <p className="note">Buying each item where it is cheapest across two stores comes to {money(res.split.total)}. It costs you an extra stop, so it is worth it only if the stores are close.</p>
              {res.split.trips.map((t) => <p key={t.store} style={{ margin: '8px 0' }}><b>{t.store}:</b> {t.items.map((x) => x.name + (x.qty > 1 ? ' ×' + x.qty : '')).join(', ')}</p>)}
            </div>
          )}

          {res.budget && (
            <div className={'card ' + (res.budget.fits ? 'good' : 'warn')}>
              <h2>{res.budget.fits ? 'Within your ' + money(res.budget.amount) + ' budget' : money(res.budget.over) + ' over your ' + money(res.budget.amount) + ' budget'}</h2>
              <p className="note" style={{ color: 'inherit' }}>{res.budget.fits ? 'At ' + res.budget.cheapestStore + ' your list is ' + money(res.budget.cheapestTotal) + '.' : 'Cheapest is ' + res.budget.cheapestStore + ' at ' + money(res.budget.cheapestTotal) + '.'}</p>
              {!res.budget.fits && res.budget.trim && (
                <>
                  <p style={{ margin: '8px 0' }}>To fit, you could drop: <b>{[...new Set(res.budget.trim.removed)].join(', ')}</b>.</p>
                  <div className="actions"><button className="ghost small" onClick={trim}>Trim my list</button><Link className="btn small" href="/food">Free food nearby</Link></div>
                </>
              )}
            </div>
          )}

          <div className="card">
            <h2>Advice</h2>
            {advice ? <p style={{ margin: 0 }}>{advice.text}</p> : <p className="note" style={{ margin: 0 }}>Get a short plain-language summary of your options.</p>}
            <div className="actions"><button className="ghost small" disabled={adviceBusy} onClick={getAdvice}>{adviceBusy ? 'Thinking…' : advice ? 'Refresh advice' : 'Get advice'}</button>{advice && <span className="note">{advice.claude ? 'Written by Claude. All numbers come from the comparison above.' : 'Written from the comparison above.'}</span>}</div>
          </div>
          <p className="note">{res.priceNote} {res.healthNote}</p>
        </>
      )}
    </>
  );
}
