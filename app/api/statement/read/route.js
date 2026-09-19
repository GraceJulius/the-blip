import crypto from 'crypto';
import { claudeParse, claudeAvailable } from '@/lib/claude';
import { StatementSchema, STATEMENT_SYSTEM, cleanReading, analyze } from '@/lib/statement.mjs';
import { validateUpload, visionContent } from '@/lib/vision';
import { studentFrom } from '@/lib/api';
import { handleEvent } from '@/lib/engine';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!allow('statement:' + clientKey(req), 8, 60 * 1000)) return tooMany('Too many uploads. Wait a minute and try again.');
  const body = await req.json().catch(() => ({}));
  const s = await studentFrom(body.studentId);
  if (s.error) return s.error;

  const problem = validateUpload(body.mediaType, body.data);
  if (problem) return Response.json({ error: problem }, { status: 400 });
  if (!claudeAvailable()) return Response.json({ error: 'Reading a statement needs Claude, which is not set up here. You can still type your numbers in by hand.' }, { status: 503 });

  const hash = crypto.createHash('sha256').update(body.data).digest('hex');
  const r = await claudeParse({
    system: STATEMENT_SYSTEM,
    user: visionContent(body.mediaType, body.data, 'Extract the credit card numbers from this document.'),
    schema: StatementSchema,
    maxTokens: 1500,
    cacheKey: 'statement|' + hash,
  });
  if (!r.ok) {
    const msg = r.reason === 'budget' ? 'Claude is busy right now. Try again in a few minutes, or type your numbers in.' : 'We could not read that file. Try a clearer photo, or type your numbers in.';
    return Response.json({ error: msg }, { status: r.reason === 'budget' ? 429 : 502 });
  }

  const reading = cleanReading(r.data);
  if (!reading.readable) return Response.json({ error: 'That does not look like a credit card statement or offer we can read. Try a clearer photo of the page with the balance and APR.' }, { status: 422 });

  let questAward = 0;
  if (reading.documentType === 'card_statement' && reading.apr !== null && reading.balance !== null) questAward = handleEvent(s.id, 'statement_read').awarded || 0;
  return Response.json({ reading, analysis: analyze(reading), questAward, privacy: 'Your file was read once and not saved.' });
}
