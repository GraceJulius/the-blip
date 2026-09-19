import { redeem, getState } from '@/lib/engine';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!allow('redeem:' + clientKey(req), 30, 60 * 1000)) return tooMany();
  const { studentId = 's1' } = await req.json().catch(() => ({}));
  const result = redeem(studentId);
  return Response.json({ ...result, state: getState(studentId) });
}
