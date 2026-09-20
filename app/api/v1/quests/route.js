import { authenticate } from '@/lib/partnerApi';
import { orgQuests } from '@/lib/orgs';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const a = await authenticate(req);
  if (a.error) return a.error;
  return Response.json({ quests: orgQuests(a.org.id).map((q) => ({ id: q.id, title: q.title, event: q.event, points: q.points, category: q.category })) });
}
