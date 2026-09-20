import { ready } from '@/lib/store';
import { getOrg, analyticsFor } from '@/lib/orgs';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await ready();
  if (!allow('analytics:' + clientKey(req), 90, 60 * 1000)) return tooMany();
  const q = new URL(req.url).searchParams;
  const orgId = /^[a-z0-9-]{2,20}$/.test(q.get('org') || '') ? q.get('org') : 'demo';
  const org = getOrg(orgId);
  if (!org) return Response.json({ error: 'Unknown organization.' }, { status: 404 });
  const a = analyticsFor(orgId, { includeSim: q.get('sim') === '1', days: Math.max(7, Math.min(60, Number(q.get('days')) || 14)) });
  return Response.json({ ...a, org: { id: org.id, name: org.name, accent: org.brand.accent, pointsBudget: org.pointsBudget } });
}
