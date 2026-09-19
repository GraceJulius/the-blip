import { handleEvent, getState } from '@/lib/engine';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!allow('events:' + clientKey(req), 120, 60 * 1000)) return tooMany();
  const body = await req.json().catch(() => ({}));
  const { studentId = 's1', type } = body;
  if (!type) return Response.json({ error: 'type is required' }, { status: 400 });
  const result = handleEvent(studentId, type);
  return Response.json({ ...result, state: getState(studentId) });
}
