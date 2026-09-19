import { computeAnalytics, buildCohort } from '../lib/analytics.mjs';
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { console.log((c ? '  PASS ' : '  FAIL ') + n + (c ? '' : ' ' + x)); c ? pass++ : fail++; };
const NOW = Date.parse('2026-09-19T12:00:00Z');
const iso = (daysAgo) => new Date(NOW - daysAgo * 86400000).toISOString();

const students = {
  a: { id: 'a', orgId: 'acme' }, b: { id: 'b', orgId: 'acme' }, c: { id: 'c', orgId: 'acme' },
  z: { id: 'z', orgId: 'other' }, s1: { id: 's1', orgId: 'acme', synthetic: true },
};
const ledger = [
  { studentId: 'a', type: 'quest', delta: 150, xp: 150, questId: 'autopay', ts: iso(0) },
  { studentId: 'a', type: 'quest', delta: 200, xp: 200, questId: 'on_time', ts: iso(1) },
  { studentId: 'a', type: 'quest', delta: 100, xp: 100, questId: 'payoff_plan', ts: iso(1) },
  { studentId: 'a', type: 'redeem', delta: -300, xp: 0, questId: null, ts: iso(0) },
  { studentId: 'b', type: 'quest', delta: 150, xp: 150, questId: 'autopay', ts: iso(2) },
  { studentId: 'b', type: 'scam_reported', delta: 25, xp: 25, questId: null, ts: iso(2) },
  { studentId: 'z', type: 'quest', delta: 150, xp: 150, questId: 'autopay', ts: iso(0) },
  { studentId: 's1', type: 'quest', delta: 150, xp: 150, questId: 'autopay', ts: iso(0) },
  { studentId: 'a', type: 'quest', delta: 100, xp: 100, questId: 'old', ts: iso(40) },
];
const signals = [
  { orgId: 'acme', ts: iso(2), flags: ['link', 'urgency'] },
  { orgId: 'acme', ts: iso(3), flags: ['link'] },
  { orgId: 'other', ts: iso(1), flags: ['threat'] },
  { orgId: 'acme', ts: iso(50), flags: ['money'] },
  { orgId: 'acme', ts: iso(1), flags: ['private'], synthetic: true },
];
let r = computeAnalytics({ students, ledger, scamSignals: signals, orgId: 'acme', now: NOW });
ok('only this organization counts (a, b, c; not the other org, not simulated)', r.totals.enrolled === 3, String(r.totals.enrolled));
ok('activated = students who earned something (a and b)', r.totals.activated === 2);
ok('engaged = 3 or more quests (only a; the 40-day-old one still counts toward the person)', r.totals.engaged === 1);
ok('points issued adds the positive rows of counted students', r.totals.pointsIssued === 150 + 200 + 100 + 100 + 150 + 25, String(r.totals.pointsIssued));
ok('redeemed points and redemptions are counted', r.totals.pointsRedeemed === 300 && r.totals.redemptions === 1);
ok('scam reports counted', r.totals.scamReports === 1);
ok('completions per day: today 1, yesterday 2, two days ago 1', r.series.completions.at(-1) === 1 && r.series.completions.at(-2) === 2 && r.series.completions.at(-3) === 1, JSON.stringify(r.series.completions.slice(-4)));
ok('a row older than the window is excluded from the daily series', r.series.completions.reduce((a, b) => a + b, 0) === 4);
ok('the window has exactly the requested number of days', r.days.length === 14 && r.days.at(-1) === '2026-09-19');
ok('the quest breakdown is sorted by count', r.quests[0].id === 'autopay' && r.quests[0].count === 2);
ok('scam signals: link appears twice, the old and other-org signals are ignored', r.signals[0].id === 'link' && r.signals[0].count === 2 && !r.signals.some((s) => s.id === 'threat' || s.id === 'money' || s.id === 'private'), JSON.stringify(r.signals));
ok('funnel numbers are in order and never increase', r.funnel.every((f, i) => i === 0 || f.value <= r.funnel[i - 1].value));
ok('the simulated count is reported separately', r.simulated === 1 && r.includesSimulated === false);

r = computeAnalytics({ students, ledger, scamSignals: signals, orgId: 'acme', includeSim: true, now: NOW });
ok('including the simulated cohort adds it', r.totals.enrolled === 4 && r.signals.some((s) => s.id === 'private'));
ok('an org with no students is safe', computeAnalytics({ students, ledger, orgId: 'nobody', now: NOW }).totals.enrolled === 0);
ok('empty data is safe', computeAnalytics({ students: {}, ledger: [], orgId: 'x', now: NOW }).funnel.every((f) => f.value === 0));

const quests = [{ id: 'q1', points: 100 }, { id: 'q2', points: 150 }, { id: 'q3', points: 200 }, { id: 'q4', points: 100 }];
const c1 = buildCohort({ orgId: 'acme', n: 240, now: NOW, seed: 7, quests });
const c2 = buildCohort({ orgId: 'acme', n: 240, now: NOW, seed: 7, quests });
ok('the simulated cohort is repeatable for the same seed', JSON.stringify(c1.ledger) === JSON.stringify(c2.ledger));
ok('every simulated student is flagged synthetic and belongs to the org', Object.values(c1.students).every((s) => s.synthetic && s.orgId === 'acme') && Object.keys(c1.students).length === 240);
ok('simulated ids pass the app id rule', Object.keys(c1.students).every((id) => /^[A-Za-z0-9_-]{1,40}$/.test(id)));
const ra = computeAnalytics({ students: c1.students, ledger: c1.ledger, scamSignals: c1.scamSignals, orgId: 'acme', includeSim: true, now: NOW });
const act = ra.totals.activated / ra.totals.enrolled;
ok('about 62% of the simulated students are activated', act > 0.5 && act < 0.72, act.toFixed(2));
ok('the funnel from the simulated data never increases', ra.funnel.every((f, i) => i === 0 || f.value <= ra.funnel[i - 1].value));
ok('nobody is charged for a quest that was not granted (no negative or zero points on awards)', c1.ledger.filter((l) => l.type === 'quest').every((l) => l.delta > 0));
ok('simulated data is hidden by default', computeAnalytics({ students: c1.students, ledger: c1.ledger, orgId: 'acme', now: NOW }).totals.enrolled === 0);
console.log(fail ? `\n${fail} FAILED, ${pass} passed` : `\nall ${pass} checks passed`); process.exit(fail ? 1 : 0);
