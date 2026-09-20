import crypto from 'crypto';
import { claudeParse, claudeAvailable } from '@/lib/claude';
import { ReceiptSchema, RECEIPT_SYSTEM, cleanReceipt } from '@/lib/receipt.mjs';
import { validateUpload, visionContent } from '@/lib/vision';
import { studentFrom } from '@/lib/api';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!allow('receipt:' + clientKey(req), 6, 60 * 1000)) return tooMany('Too many uploads. Wait a minute and try again.');
  const body = await req.json().catch(() => ({}));
  const s = await studentFrom(body.studentId);
  if (s.error) return s.error;
  const problem = validateUpload(body.mediaType, body.data);
  if (problem) return Response.json({ error: problem }, { status: 400 });
  if (!claudeAvailable()) return Response.json({ error: 'Reading a receipt needs Claude, which is not set up here.' }, { status: 503 });

  const hash = crypto.createHash('sha256').update(body.data).digest('hex');
  const r = await claudeParse({ system: RECEIPT_SYSTEM, user: visionContent(body.mediaType, body.data, 'List the products on this grocery receipt.'), schema: ReceiptSchema, maxTokens: 3500, cacheKey: 'receipt|' + hash });
  if (!r.ok) return Response.json({ error: r.reason === 'budget' ? 'Claude is busy right now. Try again in a few minutes.' : 'We could not read that receipt. Try a flatter, brighter photo.' }, { status: r.reason === 'budget' ? 429 : 502 });

  const receipt = cleanReceipt(r.data);
  if (receipt.lines.length === 0) return Response.json({ error: 'We could not find any products on that receipt. Try a clearer photo of the whole receipt.' }, { status: 422 });
  return Response.json({ receipt, privacy: 'Your photo was read once and not saved.' });
}
