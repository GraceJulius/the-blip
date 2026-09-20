import { checkPayment } from '@/lib/paymentRules.mjs';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

// Rule-based, no model and no stored data: the request is checked and thrown away.
export async function POST(req) {
  if (!allow('pay:' + clientKey(req), 40, 60 * 1000)) return tooMany('Too many checks. Wait a minute and try again.');
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return Response.json({ error: 'Send the details of the payment request.' }, { status: 400 });
  return Response.json(checkPayment(body));
}
