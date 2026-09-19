import { handleEvent, getState } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { studentId = 's1', type } = body;
  if (!type) return Response.json({ error: 'type is required' }, { status: 400 });
  const result = handleEvent(studentId, type);
  return Response.json({ ...result, state: getState(studentId) });
}
