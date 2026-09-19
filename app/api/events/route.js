import { handleEvent, getState } from '@/lib/engine';
import { studentFrom } from '@/lib/api';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!allow('events:' + clientKey(req), 120, 60 * 1000)) return tooMany();
  const body = await req.json().catch(() => ({}));
  const { studentId, type } = body;
  if (!type) return Response.json({ error: 'type is required' }, { status: 400 });
  const s = await studentFrom(studentId);
  if (s.error) return s.error;
  const result = handleEvent(s.id, type);
  return Response.json({ ...result, state: getState(s.id) });
}
