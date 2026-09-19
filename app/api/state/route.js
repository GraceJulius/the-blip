import { getState } from '@/lib/engine';
import { studentFrom } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const s = await studentFrom(new URL(req.url).searchParams.get('studentId'));
  if (s.error) return s.error;
  return Response.json(getState(s.id));
}
