import { db, persist } from './store';
import { QUESTS, SCAM_REPORT, QUIZ_BONUS, INCIDENT_REPORT_POINTS, RECOVERY_COMPLETE_POINTS, REDEEM_COST, RECOVERY_STEPS, QUIZ } from './quests';
import { levelFor } from './levels';
import { orgQuests, budgetAllows, getOrg } from './orgs';
import { emit } from './webhooks';

const now = () => new Date().toISOString();

export const MAX_STUDENTS = Number(process.env.MAX_STUDENTS) || 5000;

export function checkStudent(id) {
  const d = db();
  if (d.students[id]) return { ok: true };
  if (Object.keys(d.students).length >= MAX_STUDENTS) return { ok: false, status: 503, error: 'The demo is full right now. Try again later.' };
  return { ok: true };
}

export function resetStudent(id) {
  const d = db();
  delete d.students[id];
  d.ledger = d.ledger.filter((l) => l.studentId !== id);
  d.events = d.events.filter((e) => e.studentId !== id);
  d.redemptions = d.redemptions.filter((r) => r.studentId !== id);
  if (d.prices) delete d.prices[id];
  persist();
}

export function userPricesFor(id) {
  const raw = (db().prices || {})[id] || {};
  const out = {};
  for (const [item, stores] of Object.entries(raw)) {
    out[item] = {};
    for (const [store, v] of Object.entries(stores)) out[item][store] = v.price;
  }
  return out;
}

export function savePrices(id, storeId, entries) {
  const d = db();
  d.prices = d.prices || {};
  d.prices[id] = d.prices[id] || {};
  let n = 0;
  for (const e of entries) {
    d.prices[id][e.itemId] = d.prices[id][e.itemId] || {};
    d.prices[id][e.itemId][storeId] = { price: Math.round(Number(e.price) * 100) / 100, ts: new Date().toISOString() };
    n++;
  }
  persist();
  return n;
}

export function clearPrices(id) {
  const d = db();
  if (d.prices) delete d.prices[id];
  persist();
}

export function orgOf(id) {
  const s = db().students[id];
  return (s && s.orgId) || 'demo';
}

export function ensure(id) {
  const d = db();
  if (!d.students[id]) d.students[id] = { id, orgId: 'demo', name: 'Demo student', locked: false, recovery: null };
  return d.students[id];
}

function add(studentId, entry) {
  const row = { studentId, type: '', delta: 0, xp: 0, questId: null, ts: now(), ...entry };
  db().ledger.push(row);
  if (row.delta > 0) {
    const s = db().students[studentId];
    if (s && !s.synthetic) emit(s.orgId || 'demo', { type: 'points.awarded', student: s.externalId || studentId, points: row.delta, reason: row.type, quest: row.questId, totalPoints: totals(studentId).points, ts: row.ts });
  }
}

function allowed(s, points) {
  return budgetAllows(s.orgId || 'demo', points);
}

export function totals(id) {
  let points = 0;
  let xp = 0;
  for (const l of db().ledger) {
    if (l.studentId === id) {
      points += l.delta;
      xp += l.xp;
    }
  }
  return { points, xp };
}

export function classifyIncident(text = '') {
  const t = text.toLowerCase();
  if (/card number|cvv|entered my card|gave my card/.test(t)) return 'shared_card';
  if (/sent money|paid|zelle|venmo|wire|gift card/.test(t)) return 'sent_money';
  if (/click|link|opened/.test(t)) return 'clicked_link';
  return 'other';
}

function quizBonusToday(studentId) {
  const today = now().slice(0, 10);
  return db().ledger.filter((l) => l.studentId === studentId && l.type === 'quiz_bonus' && l.ts.startsWith(today)).length;
}

export function handleEvent(studentId, type) {
  const s = ensure(studentId);
  const d = db();
  d.events.push({ studentId, type, ts: now() });
  const result = { awarded: 0, questId: null, blocked: false, message: '' };

  if (type === 'card_frozen' && s.recovery) {
    markStep(s, 'freeze_card');
    result.message = 'Recovery step done: card frozen.';
    persist();
    return result;
  }

  if (s.locked) {
    result.blocked = true;
    result.message = 'App is in recovery mode. Finish recovery first.';
    persist();
    return result;
  }

  if (type === 'scam_reported') {
    const today = now().slice(0, 10);
    const count = d.ledger.filter((l) => l.studentId === studentId && l.type === 'scam_reported' && l.ts.startsWith(today)).length;
    if (!allowed(s, SCAM_REPORT.points)) {
      result.message = 'This program has used its points budget.';
    } else if (count < SCAM_REPORT.dailyCap) {
      add(studentId, { type: 'scam_reported', delta: SCAM_REPORT.points, xp: SCAM_REPORT.points });
      result.awarded = SCAM_REPORT.points;
      result.message = 'Scam report counted.';
    } else {
      result.message = 'Daily report cap reached. Thanks for keeping an eye out.';
    }
    persist();
    return result;
  }

  if (type === 'quiz_bonus') {
    if (!allowed(s, QUIZ_BONUS.points)) {
      result.message = 'This program has used its points budget.';
    } else if (quizBonusToday(studentId) >= QUIZ_BONUS.dailyCap) {
      result.message = 'Daily quiz bonus limit reached. Come back tomorrow.';
    } else {
      add(studentId, { type: 'quiz_bonus', delta: QUIZ_BONUS.points, xp: QUIZ_BONUS.points });
      result.awarded = QUIZ_BONUS.points;
      result.message = 'Quiz bonus earned.';
    }
    persist();
    return result;
  }

  const quest = orgQuests(s.orgId || 'demo').find((q) => q.event === type);
  if (!quest) {
    result.message = 'Event recorded, no quest matched.';
    persist();
    return result;
  }
  const already = d.ledger.some((l) => l.studentId === studentId && l.questId === quest.id);
  if (already) {
    result.message = 'Quest already completed.';
  } else if (!allowed(s, quest.points)) {
    result.message = 'This program has used its points budget.';
  } else {
    add(studentId, { type: 'quest', delta: quest.points, xp: quest.points, questId: quest.id });
    result.awarded = quest.points;
    result.questId = quest.id;
    result.message = 'Quest completed: ' + quest.title;
  }
  persist();
  return result;
}

export function getState(id) {
  const s = ensure(id);
  const t = totals(id);
  const done = new Set(db().ledger.filter((l) => l.studentId === id && l.questId).map((l) => l.questId));
  return {
    student: { id: s.id, name: s.name },
    points: t.points,
    xp: t.xp,
    level: levelFor(t.xp),
    locked: s.locked,
    recovery: s.recovery,
    quests: orgQuests(s.orgId || 'demo').map((q) => ({ ...q, done: done.has(q.id) })),
    org: (() => { const o = getOrg(s.orgId || 'demo', false); return o ? { id: o.id, name: o.name, accent: o.brand.accent } : null; })(),
    redeemCost: REDEEM_COST,
    quizBonus: { points: QUIZ_BONUS.points, dailyCap: QUIZ_BONUS.dailyCap, leftToday: Math.max(0, QUIZ_BONUS.dailyCap - quizBonusToday(id)) },
    recent: db().ledger.filter((l) => l.studentId === id).slice(-8).reverse(),
  };
}

export function redeem(id) {
  ensure(id);
  const t = totals(id);
  if (t.points < REDEEM_COST) return { ok: false, error: 'You need ' + (REDEEM_COST - t.points) + ' more points.' };
  add(id, { type: 'redeem', delta: -REDEEM_COST, xp: 0 });
  const code = 'BLIP-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  db().redemptions.push({ studentId: id, code, ts: now() });
  persist();
  return { ok: true, code, note: 'Demo only. No real gift card or money moves.' };
}

function markStep(s, stepId) {
  if (s.recovery && !s.recovery.done.includes(stepId)) s.recovery.done.push(stepId);
  tryUnlock(s);
}

function tryUnlock(s) {
  const r = s.recovery;
  if (!r) return;
  const allSteps = RECOVERY_STEPS.every((st) => r.done.includes(st.id));
  if (allSteps && r.quizPassed && s.locked) {
    s.locked = false;
    if (r.rewarded) add(s.id, { type: 'recovery_completed', delta: RECOVERY_COMPLETE_POINTS, xp: RECOVERY_COMPLETE_POINTS });
    s.recovery = null;
  }
}

export function startRecovery(id, description) {
  const s = ensure(id);
  if (s.locked) return { ok: true, already: true };
  s.locked = true;
  const today = now().slice(0, 10);
  const rewarded = !db().ledger.some((l) => l.studentId === id && l.type === 'incident_reported' && l.ts.startsWith(today));
  s.recovery = { type: classifyIncident(description), startedAt: now(), done: [], quizPassed: false, rewarded };
  if (rewarded) add(id, { type: 'incident_reported', delta: INCIDENT_REPORT_POINTS, xp: INCIDENT_REPORT_POINTS });
  persist();
  return { ok: true, type: s.recovery.type };
}

export function confirmStep(id, stepId) {
  const s = ensure(id);
  const step = RECOVERY_STEPS.find((st) => st.id === stepId);
  if (!s.recovery || !step) return { ok: false, error: 'No active recovery or unknown step.' };
  markStep(s, stepId);
  persist();
  return { ok: true };
}

export function submitQuiz(id, answers) {
  const s = ensure(id);
  if (!s.recovery) return { ok: false, error: 'No active recovery.' };
  const score = QUIZ.reduce((n, q, i) => n + (Number(answers[i]) === q.answer ? 1 : 0), 0);
  const passed = score >= 2;
  if (passed) {
    s.recovery.quizPassed = true;
    tryUnlock(s);
  }
  persist();
  return { ok: true, score, total: QUIZ.length, passed, note: passed ? '' : 'No points lost. Read the tips and try again.' };
}
