const DAY = 24 * 60 * 60 * 1000;
const dayKey = (t) => new Date(t).toISOString().slice(0, 10);

export function computeAnalytics({ students, ledger, scamSignals = [], orgId, includeSim = false, days = 14, now = Date.now() }) {
  const inOrg = (id) => {
    const s = students[id];
    return s && s.orgId === orgId && (includeSim || !s.synthetic);
  };
  const ids = Object.keys(students).filter(inOrg);
  const set = new Set(ids);
  const simulated = Object.values(students).filter((s) => s.orgId === orgId && s.synthetic).length;

  const dayKeys = [];
  for (let i = days - 1; i >= 0; i--) dayKeys.push(dayKey(now - i * DAY));
  const zero = () => Object.fromEntries(dayKeys.map((k) => [k, 0]));
  const completions = zero();
  const points = zero();
  const reports = zero();

  const per = {};
  for (const id of ids) per[id] = { quests: 0, xp: 0, awarded: 0 };
  const questCounts = {};
  let pointsIssued = 0, pointsRedeemed = 0, redemptions = 0, scamReports = 0, incidents = 0, recovered = 0;

  for (const l of ledger) {
    if (!set.has(l.studentId)) continue;
    const p = per[l.studentId];
    p.xp += l.xp || 0;
    if (l.delta > 0) { p.awarded += 1; pointsIssued += l.delta; }
    if (l.delta < 0) { pointsRedeemed += -l.delta; redemptions += 1; }
    if (l.questId) { p.quests += 1; questCounts[l.questId] = (questCounts[l.questId] || 0) + 1; }
    if (l.type === 'scam_reported') scamReports += 1;
    if (l.type === 'incident_reported') incidents += 1;
    if (l.type === 'recovery_completed') recovered += 1;
    const k = dayKey(new Date(l.ts).getTime());
    if (k in completions) {
      if (l.questId) completions[k] += 1;
      if (l.delta > 0) points[k] += l.delta;
      if (l.type === 'scam_reported') reports[k] += 1;
    }
  }

  const enrolled = ids.length;
  const activated = ids.filter((id) => per[id].awarded > 0).length;
  const engaged = ids.filter((id) => per[id].quests >= 3).length;
  const advanced = ids.filter((id) => per[id].xp >= 400).length;

  const flagCounts = {};
  const cutoff = now - days * DAY;
  for (const sg of scamSignals) {
    if (sg.orgId !== orgId) continue;
    if (sg.synthetic && !includeSim) continue;
    if (new Date(sg.ts).getTime() < cutoff) continue;
    for (const f of sg.flags || []) flagCounts[f] = (flagCounts[f] || 0) + 1;
  }

  return {
    orgId,
    days: dayKeys,
    series: {
      completions: dayKeys.map((k) => completions[k]),
      points: dayKeys.map((k) => points[k]),
      reports: dayKeys.map((k) => reports[k]),
    },
    totals: { enrolled, activated, engaged, advanced, pointsIssued, pointsRedeemed, redemptions, scamReports, incidents, recovered, questCompletions: Object.values(questCounts).reduce((a, b) => a + b, 0) },
    funnel: [
      { label: 'Enrolled', value: enrolled },
      { label: 'Earned points', value: activated },
      { label: 'Finished 3+ quests', value: engaged },
      { label: 'Reached level 3', value: advanced },
    ],
    quests: Object.entries(questCounts).map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
    signals: Object.entries(flagCounts).map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
    simulated,
    includesSimulated: includeSim,
  };
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildCohort({ orgId, n = 240, now = Date.now(), seed = 7, quests, flags = ['link', 'urgency', 'threat', 'money', 'private'] }) {
  const r = rng(seed);
  const students = {};
  const ledger = [];
  const scamSignals = [];
  const weights = { link: 0.9, urgency: 0.7, threat: 0.35, private: 0.5, money: 0.4 };
  const when = () => {
    const back = Math.floor(Math.pow(r(), 1.15) * 14);
    return new Date(now - back * DAY - Math.floor(r() * 12) * 3600000).toISOString();
  };
  for (let i = 0; i < n; i++) {
    const id = 'sim_' + orgId + '_' + i;
    students[id] = { id, orgId, name: 'Simulated student', synthetic: true, locked: false, recovery: null };
    if (r() > 0.62) continue;
    const count = Math.min(quests.length, 1 + Math.floor(Math.log(1 - r()) / Math.log(0.55)));
    const pool = [...quests].sort(() => r() - 0.5).slice(0, count);
    let pts = 0;
    for (const q of pool) { ledger.push({ studentId: id, type: 'quest', delta: q.points, xp: q.points, questId: q.id, ts: when() }); pts += q.points; }
    if (r() < 0.18) {
      const k = 1 + Math.floor(r() * 3);
      for (let j = 0; j < k; j++) {
        const ts = when();
        ledger.push({ studentId: id, type: 'scam_reported', delta: 25, xp: 25, questId: null, ts });
        pts += 25;
        const fl = flags.filter((f) => r() < weights[f]);
        scamSignals.push({ orgId, ts, level: fl.length >= 2 ? 'likely_scam' : 'suspicious', flags: fl.length ? fl : ['link'], synthetic: true });
      }
    }
    if (r() < 0.04) {
      ledger.push({ studentId: id, type: 'incident_reported', delta: 25, xp: 25, questId: null, ts: when() });
      if (r() < 0.6) ledger.push({ studentId: id, type: 'recovery_completed', delta: 100, xp: 100, questId: null, ts: when() });
    }
    if (pts >= 300 && r() < 0.3) ledger.push({ studentId: id, type: 'redeem', delta: -300, xp: 0, questId: null, ts: when() });
  }
  return { students, ledger, scamSignals };
}
