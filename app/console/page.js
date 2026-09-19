'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { QUESTS } from '@/lib/quests';
import { BarChart, DayLabels, HBars } from './charts';

const SIGNALS = { link: 'Suspicious link', urgency: 'Pressure to act fast', threat: 'Threat if you do not respond', money: 'Unexpected money offer', private: 'Asks for private details' };
const POINT_VALUE = 5 / 300;
const money = (n) => '$' + Math.round(n).toLocaleString();
const when = (iso) => (iso ? new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'never');

export default function Console() {
  const [tab, setTab] = useState('overview');
  const [orgId, setOrgId] = useState('demo');
  const [orgs, setOrgs] = useState([{ id: 'demo', name: 'Demo Bank' }]);
  const [sim, setSim] = useState(false);
  const [a, setA] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [log, setLog] = useState([]);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [avoided, setAvoided] = useState(4);
  const [newKey, setNewKey] = useState(null);
  const [newSecret, setNewSecret] = useState(null);
  const [embed, setEmbed] = useState(null);
  const [f, setF] = useState({ name: '', accent: '#9b7bff', budget: '', hook: '', keyLabel: '', qTitle: '', qEvent: '', qPoints: '100', embedId: 'demo-student-1', newOrgId: '', newOrgName: '' });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const call = useCallback(async (action, extra = {}) => {
    let password = '';
    try { password = sessionStorage.getItem('blipAdmin') || ''; } catch {}
    const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, orgId, password, ...extra }) });
    const j = await res.json().catch(() => ({}));
    return { status: res.status, ...j };
  }, [orgId]);

  const loadAnalytics = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/analytics?org=' + orgId + '&sim=' + (sim ? 1 : 0), { cache: 'no-store' });
      if (r.ok) setA(await r.json());
    } catch {}
  }, [orgId, sim]);

  const adopt = useCallback((r) => {
    if (r.org) {
      setAdmin(r.org);
      setF((p) => ({ ...p, name: r.org.name, accent: r.org.brand.accent, budget: String(r.org.pointsBudget || ''), hook: r.org.webhook.url || '' }));
    }
    if (r.webhookLog) setLog(r.webhookLog);
  }, []);

  const unlock = useCallback(async (password, silent) => {
    try { sessionStorage.setItem('blipAdmin', password); } catch {}
    const r = await call('get');
    if (r.status === 200) {
      adopt(r);
      const l = await call('listOrgs');
      if (l.orgs) setOrgs(l.orgs);
      setMsg('');
      return true;
    }
    setAdmin(null);
    try { sessionStorage.removeItem('blipAdmin'); } catch {}
    if (!silent) setMsg(r.error || 'Could not unlock.');
    return false;
  }, [call, adopt]);

  useEffect(() => { loadAnalytics(); const t = setInterval(loadAnalytics, 5000); return () => clearInterval(t); }, [loadAnalytics]);
  useEffect(() => { let p = ''; try { p = sessionStorage.getItem('blipAdmin') || ''; } catch {} unlock(p, true); }, [unlock]);

  async function run(action, extra, okMsg) {
    setMsg('');
    const r = await call(action, extra);
    if (r.error) { setMsg(r.error); return r; }
    if (r.org) adopt(r);
    if (okMsg) setMsg(okMsg);
    loadAnalytics();
    return r;
  }

  const titleOf = (id) => {
    const q = QUESTS.find((x) => x.id === id) || (admin && admin.customQuests.find((x) => x.id === id));
    return q ? q.title : id;
  };
  const locked = !admin;
  const t = a ? a.totals : null;
  const cost = t ? t.pointsIssued * POINT_VALUE : 0;
  const saved = t ? t.questCompletions * avoided : 0;

  const unlockCard = (
    <div className="card">
      <h2>Unlock admin</h2>
      <p className="note" style={{ marginBottom: 10 }}>Program settings and integration need the admin password.</p>
      <div className="actions" style={{ marginTop: 0 }}>
        <input type="password" placeholder="Admin password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ maxWidth: 240 }} onKeyDown={(e) => { if (e.key === 'Enter') unlock(pw); }} />
        <button onClick={() => unlock(pw)}>Unlock</button>
      </div>
      {msg && <p className="err" style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );

  return (
    <>
      <div className="place-head" style={{ alignItems: 'center' }}>
        <div>
          <h1>{a ? a.org.name : 'Bank console'}</h1>
          <p className="sub" style={{ marginBottom: 12 }}>What the program is doing, what it costs, and how to connect it to your systems.</p>
        </div>
        {orgs.length > 1 && <select value={orgId} onChange={(e) => { setOrgId(e.target.value); setA(null); }}>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>}
      </div>

      <div className="seg">
        {[['overview', 'Overview'], ['program', 'Program'], ['integration', 'Integration']].map(([id, label]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => { setTab(id); setMsg(''); }}>{label}</button>)}
      </div>

      {tab === 'overview' && a && (
        <>
          <div className="card" style={{ padding: '12px 16px' }}>
            <div className="actions" style={{ marginTop: 0, justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                <input type="checkbox" checked={sim} onChange={(e) => setSim(e.target.checked)} /> Include simulated students {a.simulated > 0 && <span className="note">({a.simulated} loaded)</span>}
              </label>
              <span style={{ display: 'flex', gap: 8 }}>
                <button className="ghost small" onClick={async () => { if (locked) { setTab('program'); setMsg('Unlock admin to load a simulated cohort.'); return; } await run('seed', { n: 240 }, 'Loaded 240 simulated students.'); setSim(true); }}>Load simulated cohort</button>
                {a.simulated > 0 && <button className="ghost small" onClick={async () => { await run('clearSim', {}, 'Removed the simulated cohort.'); setSim(false); }}>Remove</button>}
              </span>
            </div>
            {sim && <p className="note" style={{ margin: '8px 0 0', color: 'var(--warn)' }}>Simulated: these numbers include generated demo students, not real users.</p>}
            {msg && <p className="note" style={{ margin: '8px 0 0' }}>{msg}</p>}
          </div>

          <div className="kpis">
            <div className="metric"><small>Enrolled students</small><b>{t.enrolled.toLocaleString()}</b></div>
            <div className="metric"><small>Earned points</small><b>{t.activated.toLocaleString()}</b><div className="note">{t.enrolled ? Math.round((t.activated / t.enrolled) * 100) : 0}% of enrolled</div></div>
            <div className="metric"><small>Quests completed</small><b>{t.questCompletions.toLocaleString()}</b></div>
            <div className="metric"><small>Points issued</small><b>{t.pointsIssued.toLocaleString()}</b></div>
            <div className="metric"><small>Scams reported</small><b>{t.scamReports.toLocaleString()}</b></div>
            <div className="metric"><small>Incidents recovered</small><b>{t.recovered}/{t.incidents}</b></div>
          </div>

          <div className="cols">
            <div className="card"><h2>Quests completed per day</h2><BarChart values={a.series.completions} labels={a.days} /><DayLabels labels={a.days} /></div>
            <div className="card"><h2>From sign-up to level 3</h2><HBars items={a.funnel.map((x) => ({ label: x.label, value: x.value }))} empty="No students yet." /></div>
            <div className="card"><h2>Most completed quests</h2><HBars items={a.quests.slice(0, 7).map((q) => ({ label: titleOf(q.id), value: q.count }))} empty="No quests completed yet." /></div>
            <div className="card"><h2>What students report as scams</h2><HBars items={a.signals.map((s) => ({ label: SIGNALS[s.id] || s.id, value: s.count }))} empty="No reports in this period." /><p className="note" style={{ margin: '10px 0 0' }}>Only the type of warning sign is kept, never the message.</p></div>
          </div>

          <div className="card">
            <h2>What it costs and what it could save</h2>
            <div className="grid" style={{ marginBottom: 12 }}>
              <div className="metric"><small>Points issued</small><b>{t.pointsIssued.toLocaleString()}</b></div>
              <div className="metric"><small>Cost if all redeemed</small><b>{money(cost)}</b></div>
              <div className="metric"><small>Already redeemed</small><b>{t.redemptions}</b></div>
              <div className="metric"><small>Return per $1</small><b>{cost > 0 ? '$' + (saved / cost).toFixed(2) : 'n/a'}</b></div>
            </div>
            <div className="row" style={{ marginTop: 0 }}>
              <label>Avoided loss per quest</label>
              <input type="range" min="0" max="10" step="0.5" value={avoided} onChange={(e) => setAvoided(+e.target.value)} style={{ '--track-fill': avoided * 10 + '%' }} />
              <span className="val">${avoided.toFixed(1)}</span>
            </div>
            <p className="note" style={{ margin: 0 }}>Illustrative. Cost assumes a $5 reward per 300 points. The avoided-loss figure is your assumption (late fees, fraud reimbursements, churn), so replace it with your own data in a pilot.</p>
          </div>
        </>
      )}

      {tab === 'overview' && !a && <p className="note">Loading…</p>}

      {tab === 'program' && (locked ? unlockCard : (
        <>
          {msg && <p className="note">{msg}</p>}
          <div className="card">
            <h2>Points budget</h2>
            <p className="note" style={{ marginBottom: 10 }}>Set a ceiling on the points the program can hand out. When it is reached, students keep their progress but earn nothing new. Use 0 for no limit.</p>
            <div className="actions" style={{ marginTop: 0 }}>
              <input type="number" min="0" placeholder="0" value={f.budget} onChange={(e) => set('budget', e.target.value)} style={{ maxWidth: 160 }} />
              <button onClick={() => run('update', { pointsBudget: Number(f.budget) || 0 }, 'Budget saved.')}>Save budget</button>
            </div>
            {admin.pointsBudget > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="prog"><div style={{ width: Math.min(100, (admin.pointsIssued / admin.pointsBudget) * 100) + '%' }} /></div>
                <div className="note">{admin.pointsIssued.toLocaleString()} of {admin.pointsBudget.toLocaleString()} points issued ({Math.round((admin.pointsIssued / admin.pointsBudget) * 100)}%)</div>
              </div>
            )}
          </div>

          <div className="card">
            <h2>Brand</h2>
            <div className="cols">
              <div>
                <div className="row" style={{ marginTop: 0 }}><label htmlFor="bn">Program name</label><input id="bn" type="text" value={f.name} onChange={(e) => set('name', e.target.value)} /></div>
                <div className="row"><label htmlFor="bc">Accent color</label><input id="bc" type="color" value={f.accent} onChange={(e) => set('accent', e.target.value)} style={{ width: 56, height: 36, padding: 2 }} /><span className="note">{f.accent}</span></div>
                <button onClick={() => run('update', { name: f.name, accent: f.accent }, 'Brand saved.')}>Save brand</button>
              </div>
              <div className="card" style={{ margin: 0, background: 'var(--surface-2)' }}>
                <div className="place-head"><b>{f.name || 'Your program'} rewards</b><span className="pill" style={{ background: f.accent + '29', color: f.accent }}>240 points</span></div>
                <div className="prog" style={{ margin: '12px 0' }}><div style={{ width: '60%', background: f.accent }} /></div>
                <p className="note" style={{ margin: 0 }}>Preview of the widget your students see.</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Custom quests</h2>
            <p className="note" style={{ marginBottom: 10 }}>Add a behavior your systems can report, like paying rent on time. Your app sends the event name to the API when it happens.</p>
            {admin.customQuests.length > 0 && (
              <table className="tbl" style={{ marginBottom: 14 }}>
                <thead><tr><th>Quest</th><th>Event name</th><th>Points</th><th /></tr></thead>
                <tbody>{admin.customQuests.map((q) => <tr key={q.id}><td>{q.title}</td><td><code>{q.event}</code></td><td>{q.points}</td><td><button className="ghost small" onClick={() => run('removeQuest', { id: q.id }, 'Quest removed.')}>Remove</button></td></tr>)}</tbody>
              </table>
            )}
            <div className="cols">
              <input type="text" placeholder="Title, for example Pay rent on time" value={f.qTitle} onChange={(e) => set('qTitle', e.target.value)} />
              <input type="text" placeholder="event_name, for example rent_paid" value={f.qEvent} onChange={(e) => set('qEvent', e.target.value)} />
              <input type="number" placeholder="Points" value={f.qPoints} onChange={(e) => set('qPoints', e.target.value)} />
            </div>
            <div className="actions"><button onClick={async () => { const r = await run('addQuest', { title: f.qTitle, event: f.qEvent, points: Number(f.qPoints) }, 'Quest added.'); if (!r.error) { set('qTitle', ''); set('qEvent', ''); } }}>Add quest</button></div>
          </div>

          <div className="card">
            <h2>Organizations</h2>
            <p className="note" style={{ marginBottom: 10 }}>Each organization has its own students, keys, quests and settings. Nothing is shared between them.</p>
            <div className="actions" style={{ marginTop: 0 }}>
              <input type="text" placeholder="id, like acme-bank" value={f.newOrgId} onChange={(e) => set('newOrgId', e.target.value)} style={{ maxWidth: 200 }} />
              <input type="text" placeholder="Name" value={f.newOrgName} onChange={(e) => set('newOrgName', e.target.value)} style={{ maxWidth: 220 }} />
              <button className="ghost" onClick={async () => { const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'createOrg', password: (() => { try { return sessionStorage.getItem('blipAdmin') || ''; } catch { return ''; } })(), newId: f.newOrgId, newName: f.newOrgName }) }); const j = await res.json(); if (j.error) setMsg(j.error); else { setOrgs(j.orgs); setMsg('Created. Use the switcher at the top to open it.'); set('newOrgId', ''); set('newOrgName', ''); } }}>Create</button>
            </div>
          </div>
        </>
      ))}

      {tab === 'integration' && (locked ? unlockCard : (
        <>
          {msg && <p className="note">{msg}</p>}
          <div className="card">
            <h2>API keys</h2>
            <p className="note" style={{ marginBottom: 10 }}>Use a key to call the API from your server. It is shown once when created. We keep only a fingerprint.</p>
            {newKey && <div className="card good" style={{ padding: 12 }}><b>Copy your new key now. It will not be shown again.</b><pre className="code" style={{ margin: '8px 0 0' }}><code>{newKey}</code></pre></div>}
            {admin.apiKeys.length > 0 && (
              <table className="tbl" style={{ marginBottom: 14 }}>
                <thead><tr><th>Label</th><th>Key</th><th>Last used</th><th /></tr></thead>
                <tbody>{admin.apiKeys.map((k) => <tr key={k.id}><td>{k.label}</td><td><code>{k.prefix}…</code></td><td>{when(k.lastUsedAt)}</td><td>{k.revoked ? <span className="note">Revoked</span> : <button className="ghost small" onClick={() => run('revokeKey', { keyId: k.id }, 'Key revoked.')}>Revoke</button>}</td></tr>)}</tbody>
              </table>
            )}
            <div className="actions" style={{ marginTop: 0 }}>
              <input type="text" placeholder="Label, like Production" value={f.keyLabel} onChange={(e) => set('keyLabel', e.target.value)} style={{ maxWidth: 220 }} />
              <button onClick={async () => { const r = await run('createKey', { label: f.keyLabel || 'Key' }); if (r.key) { setNewKey(r.key); set('keyLabel', ''); } }}>Create key</button>
            </div>
            <p className="note" style={{ marginTop: 12 }}>Try it: <code>curl {'-H "Authorization: Bearer YOUR_KEY"'} {typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/quests</code> · <Link href="/docs">Read the docs</Link></p>
          </div>

          <div className="card">
            <h2>Webhook</h2>
            <p className="note" style={{ marginBottom: 10 }}>We call this address when a student earns points. Requests are signed so you can verify they came from us.</p>
            <div className="actions" style={{ marginTop: 0 }}>
              <input type="text" placeholder="https://your-server.example.com/blip-webhook" value={f.hook} onChange={(e) => set('hook', e.target.value)} style={{ flex: 1, minWidth: 240 }} />
              <button onClick={() => run('update', { webhookUrl: f.hook }, 'Webhook address saved.')}>Save</button>
            </div>
            <div className="actions">
              <button className="ghost small" onClick={async () => { const r = await run('rotateSecret'); if (r.secret) setNewSecret(r.secret); }}>{admin.webhook.hasSecret ? 'Rotate signing secret' : 'Create signing secret'}</button>
              <button className="ghost small" onClick={async () => { const r = await call('testWebhook'); if (r.webhookLog) setLog(r.webhookLog); setMsg(r.ok ? 'Test delivered (HTTP ' + r.status + ').' : 'Test failed: ' + (r.error || 'HTTP ' + r.status)); }}>Send test event</button>
            </div>
            {newSecret && <div className="card good" style={{ padding: 12, marginTop: 12 }}><b>Copy your signing secret now. It will not be shown again.</b><pre className="code" style={{ margin: '8px 0 0' }}><code>{newSecret}</code></pre></div>}
            {log.length > 0 && (
              <table className="tbl" style={{ marginTop: 14 }}>
                <thead><tr><th>Time</th><th>Event</th><th>Result</th></tr></thead>
                <tbody>{log.map((l, i) => <tr key={i}><td>{when(l.ts)}</td><td>{l.type}</td><td>{l.ok ? 'HTTP ' + l.status : (l.error || 'Failed')}</td></tr>)}</tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h2>Embeddable widget</h2>
            <p className="note" style={{ marginBottom: 10 }}>Show a student's points, level and next quests inside your own app. In production your server mints the token with the API. Here you can try it.</p>
            <div className="actions" style={{ marginTop: 0 }}>
              <input type="text" placeholder="A student id from your system" value={f.embedId} onChange={(e) => set('embedId', e.target.value)} style={{ maxWidth: 260 }} />
              <button onClick={async () => { const r = await call('mintEmbed', { studentId: f.embedId }); if (r.error) setMsg(r.error); else { setEmbed(r); setMsg(''); } }}>Create widget</button>
            </div>
            {embed && (
              <div style={{ marginTop: 14 }}>
                <div className="cols">
                  <div>
                    <p className="note" style={{ marginBottom: 6 }}>Paste this into your page:</p>
                    <pre className="code"><code>{embed.script}</code></pre>
                    <p className="note">Expires {when(embed.expiresAt)}.</p>
                  </div>
                  <iframe title="Widget preview" src={embed.url} style={{ width: '100%', height: 300, border: 0 }} />
                </div>
              </div>
            )}
          </div>
        </>
      ))}
    </>
  );
}
