import { startRecovery, confirmStep, submitQuiz, getState } from '@/lib/engine';
import { studentFrom } from '@/lib/api';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!allow('recovery:' + clientKey(req), 60, 60 * 1000)) return tooMany();
  const body = await req.json().catch(() => ({}));
  const { studentId: rawId, action } = body;
  const s = await studentFrom(rawId);
  if (s.error) return s.error;
  const studentId = s.id;
  let result = { ok: false, error: 'Unknown action' };
  if (action === 'start') result = startRecovery(studentId, body.description || '');
  if (action === 'step') result = confirmStep(studentId, body.stepId);
  if (action === 'quiz') result = submitQuiz(studentId, body.answers || []);
  return Response.json({ ...result, state: getState(studentId) });
}
