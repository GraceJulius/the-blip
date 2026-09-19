import { checkRules } from '@/lib/scamRules.mjs';
import { classifyWithNemotron } from '@/lib/nemotron.mjs';
import { handleEvent, getState } from '@/lib/engine';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!allow('scam:' + clientKey(req), 20, 60 * 1000)) return tooMany('Too many checks. Wait a minute and try again.');
  const { message = '', report = false, studentId = 's1' } = await req.json().catch(() => ({}));
  if (!message.trim()) return Response.json({ error: 'Paste a message first' }, { status: 400 });
  if (message.length > 5000) return Response.json({ error: 'That message is too long. Paste the part that worries you.' }, { status: 400 });

  const rules = checkRules(message);
  let level = rules.level;
  let model = null;
  const modelBudget = Number(process.env.MODEL_CALLS_PER_10MIN) || 60;
  if (level === 'suspicious' && allow('model:all', modelBudget, 10 * 60 * 1000)) {
    model = await classifyWithNemotron(message);
    if (model && model.label === 'scam') level = 'likely_scam';
    if (model && model.label === 'legit') level = 'probably_fine';
  }

  let award = null;
  if (report && (level === 'likely_scam' || level === 'suspicious')) award = handleEvent(studentId, 'scam_reported');

  return Response.json({ level, flags: rules.flags, model, award, state: report ? getState(studentId) : undefined });
}
