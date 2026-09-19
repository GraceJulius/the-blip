import { authenticate, apiError } from '@/lib/partnerApi';
import { orgQuests, partnerStudent } from '@/lib/orgs';
import { validExternalId } from '@/lib/platform.mjs';
import { handleEvent, getState, checkStudent } from '@/lib/engine';
import { internalId } from '@/lib/platform.mjs';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const a = await authenticate(req);
  if (a.error) return a.error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return apiError(400, 'invalid_json', 'Send a JSON body like {"studentId":"user-42","type":"autopay_enabled"}.');
  if (!validExternalId(body.studentId)) return apiError(400, 'invalid_student_id', 'studentId must be a string of 1 to 64 characters.');
  const valid = [...orgQuests(a.org.id).map((q) => q.event), 'card_frozen'];
  if (typeof body.type !== 'string' || !valid.includes(body.type)) return apiError(400, 'unknown_event', 'That event type is not recognized for your program.', { validEvents: valid });

  const c = checkStudent(internalId(a.org.id, body.studentId));
  if (!c.ok) return apiError(c.status, 'capacity', c.error);
  const s = partnerStudent(a.org.id, body.studentId);
  const r = handleEvent(s.id, body.type);
  const st = getState(s.id);
  return Response.json({ awarded: r.awarded, questId: r.questId, blocked: r.blocked, message: r.message, student: { id: body.studentId, points: st.points, level: { index: st.level.index + 1, name: st.level.name } } });
}
