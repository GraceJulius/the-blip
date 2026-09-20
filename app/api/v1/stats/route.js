import { authenticate } from '@/lib/partnerApi';
import { analyticsFor } from '@/lib/orgs';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const a = await authenticate(req);
  if (a.error) return a.error;
  const days = Math.max(7, Math.min(90, Number(new URL(req.url).searchParams.get('days')) || 14));
  const r = analyticsFor(a.org.id, { includeSim: false, days });
  return Response.json({ days: r.days, totals: r.totals, funnel: r.funnel, series: r.series, quests: r.quests, scamSignals: r.signals });
}
