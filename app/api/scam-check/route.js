import { decide } from '@/lib/scamCheck.mjs';
import { classifyWithNemotron } from '@/lib/nemotron.mjs';
import nbModel from '@/data/scam-nb.json';
import { handleEvent, getState, orgOf } from '@/lib/engine';
import { recordScamSignal } from '@/lib/orgs';
import { studentFrom } from '@/lib/api';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!allow('scam:' + clientKey(req), 20, 60 * 1000)) return tooMany('Too many checks. Wait a minute and try again.');
  const { message = '', report = false, studentId: rawId } = await req.json().catch(() => ({}));
  const s = await studentFrom(rawId);
  if (s.error) return s.error;
  const studentId = s.id;
  if (!message.trim()) return Response.json({ error: 'Paste a message first' }, { status: 400 });
  if (message.length > 5000) return Response.json({ error: 'That message is too long. Paste the part that worries you.' }, { status: 400 });

  // Rules and the local classifier settle most messages. The model is asked only about the unsettled ones.
  const modelBudget = Number(process.env.MODEL_CALLS_PER_10MIN) || 60;
  const askModel = async (text) => (allow('model:all', modelBudget, 10 * 60 * 1000) ? classifyWithNemotron(text) : null);
  const d = await decide(message, { nbModel, askModel });
  const { level, flags, model } = d;
  const rules = { flags };

  let award = null;
  if (report && (level === 'likely_scam' || level === 'suspicious')) {
    award = handleEvent(studentId, 'scam_reported');
    if (award && award.awarded > 0) recordScamSignal(orgOf(studentId), level, rules.flags.map((f) => f.id));
  }

  return Response.json({ level, flags: rules.flags, model, verified: d.verified, award, state: report ? getState(studentId) : undefined });
}
