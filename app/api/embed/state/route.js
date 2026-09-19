import { ready, db } from '@/lib/store';
import { verifyEmbed } from '@/lib/orgs';
import { getState } from '@/lib/engine';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await ready();
  if (!allow('embed:' + clientKey(req), 120, 60 * 1000)) return tooMany();
  const v = verifyEmbed(new URL(req.url).searchParams.get('token'));
  if (!v) return Response.json({ error: 'This link is invalid or has expired.' }, { status: 401 });
  const s = db().students[v.studentId];
  if (!s || s.orgId !== v.org.id) return Response.json({ error: 'Student not found.' }, { status: 404 });
  const st = getState(v.studentId);
  return Response.json({ org: { name: v.org.name, accent: v.org.brand.accent }, points: st.points, level: st.level, locked: st.locked, quests: st.quests.map((q) => ({ id: q.id, title: q.title, points: q.points, done: q.done })) });
}
