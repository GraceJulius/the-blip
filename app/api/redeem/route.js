import { redeem, getState } from '@/lib/engine';
import { studentFrom } from '@/lib/api';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!allow('redeem:' + clientKey(req), 30, 60 * 1000)) return tooMany();
  const { studentId } = await req.json().catch(() => ({}));
  const s = await studentFrom(studentId);
  if (s.error) return s.error;
  const result = redeem(s.id);
  return Response.json({ ...result, state: getState(s.id) });
}
