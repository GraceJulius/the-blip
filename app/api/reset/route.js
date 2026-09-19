import { reset } from '@/lib/store';
import { allow, clientKey, tooMany, checkAdmin } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const tenMin = 10 * 60 * 1000;
  if (!allow('reset:' + clientKey(req), 10, tenMin) || !allow('reset:all', 40, tenMin)) return tooMany('Too many reset attempts. Wait a few minutes.');

  const body = await req.json().catch(() => ({}));
  const auth = checkAdmin(body.password || req.headers.get('x-admin-password'));
  if (auth.disabled) return Response.json({ error: 'Reset is disabled on this server. Set ADMIN_PASSWORD to turn it on.' }, { status: 403 });
  if (!auth.ok) return Response.json({ error: 'Wrong password.' }, { status: 401 });

  reset();
  return Response.json({ ok: true });
}
