import { getState } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const id = new URL(req.url).searchParams.get('studentId') || 's1';
  return Response.json(getState(id));
}
