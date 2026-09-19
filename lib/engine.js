import { db, persist } from './store';
import { QUESTS, SCAM_REPORT, INCIDENT_REPORT_POINTS, RECOVERY_COMPLETE_POINTS, REDEEM_COST, RECOVERY_STEPS, QUIZ } from './quests';
import { levelFor } from './levels';

const now = () => new Date().toISOString();

export function ensure(id) {
  const d = db();
  if (!d.students[id]) d.students[id] = { id, name: 'Demo student', locked: false, recovery: null };
  return d.students[id];
}

function add(studentId, entry) {
  db().ledger.push({ studentId, type: '', delta: 0, xp: 0, questId: null, ts: now(), ...entry });
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
    if (count < SCAM_REPORT.dailyCap) {
      add(studentId, { type: 'scam_reported', delta: SCAM_REPORT.points, xp: SCAM_REPORT.points });
      result.awarded = SCAM_REPORT.points;
      result.message = 'Scam report counted.';
    } else {
      result.message = 'Daily report cap reached. Thanks for keeping an eye out.';
    }
    persist();
    return result;
  }

  const quest = QUESTS.find((q) => q.event === type);
  if (!quest) {
    result.message = 'Event recorded, no quest matched.';
    persist();
    return result;
  }
  const already = d.ledger.some((l) => l.studentId === studentId && l.questId === quest.id);
  if (already) {
    result.message = 'Quest already completed.';
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
    quests: QUESTS.map((q) => ({ ...q, done: done.has(q.id) })),
    redeemCost: REDEEM_COST,
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
