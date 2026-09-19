import { reset } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST() {
  reset();
  return Response.json({ ok: true });
}
