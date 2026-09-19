import { redeem, getState } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { studentId = 's1' } = await req.json().catch(() => ({}));
  const result = redeem(studentId);
  return Response.json({ ...result, state: getState(studentId) });
}
