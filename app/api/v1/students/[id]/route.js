import { authenticate, apiError } from '@/lib/partnerApi';
import { validExternalId, internalId } from '@/lib/platform.mjs';
import { getState } from '@/lib/engine';
import { db } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const a = await authenticate(req);
  if (a.error) return a.error;
  const ext = decodeURIComponent(params.id || '');
  if (!validExternalId(ext)) return apiError(400, 'invalid_student_id', 'That student id is not valid.');
  const id = internalId(a.org.id, ext);
  const s = db().students[id];
  if (!s || s.orgId !== a.org.id) return apiError(404, 'not_found', 'No student with that id has been seen yet.');
  const st = getState(id);
  return Response.json({ id: ext, points: st.points, xp: st.xp, level: { index: st.level.index + 1, name: st.level.name, progress: st.level.progress }, locked: st.locked, quests: st.quests.map((q) => ({ id: q.id, title: q.title, points: q.points, event: q.event, done: q.done })) });
}
