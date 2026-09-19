import { db, ready } from '@/lib/store';
import { ASSUMPTIONS } from '@/lib/quests';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await ready();
  const q = new URL(req.url).searchParams;
  const enrolled = Number(q.get('enrolled')) || ASSUMPTIONS.enrolled;
  const avoided = q.has('avoided') ? Number(q.get('avoided')) : ASSUMPTIONS.avoidedPerQuest;
  const d = db();

  const completions = d.ledger.filter((l) => l.questId).length;
  const pointsIssued = d.ledger.filter((l) => l.delta > 0).reduce((n, l) => n + l.delta, 0);
  const scamReports = d.ledger.filter((l) => l.type === 'scam_reported').length;
  const incidents = d.ledger.filter((l) => l.type === 'incident_reported').length;
  const recovered = d.ledger.filter((l) => l.type === 'recovery_completed').length;

  const projCompletions = Math.round(enrolled * ASSUMPTIONS.completionRate * ASSUMPTIONS.questsEach);
  const projCost = Math.round(projCompletions * ASSUMPTIONS.costPerQuest);
  const projAvoided = Math.round(projCompletions * avoided);

  return Response.json({
    live: { completions, pointsIssued, scamReports, incidents, recovered },
    projection: { enrolled, completions: projCompletions, cost: projCost, avoidedLoss: projAvoided, returnPerDollar: projCost ? projAvoided / projCost : 0 },
    assumptions: { ...ASSUMPTIONS, avoidedPerQuest: avoided },
  });
}
