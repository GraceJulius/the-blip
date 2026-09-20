import { SCENARIOS, START, applyTransaction, analyze, moveToSavings } from '@/lib/sandboxBank.mjs';
import { handleEvent, pushBankAlert, getState } from '@/lib/engine';
import { studentFrom } from '@/lib/api';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

// Synthetic bank feed. The account lives in the browser and is sent with each request, so the
// server keeps no bank data. Only the alert text is saved, so it shows on the student's Home screen.
export async function POST(req) {
  if (!allow('sandbox:' + clientKey(req), 60, 60 * 1000)) return tooMany();
  const body = await req.json().catch(() => ({}));
  const s = await studentFrom(body.studentId);
  if (s.error) return s.error;
  const account = { checking: Number(body.checking), savings: Number(body.savings) };
  if (!Number.isFinite(account.checking) || !Number.isFinite(account.savings)) Object.assign(account, START);

  if (body.action === 'save') {
    const r = moveToSavings(account, body.amount);
    const award = r.event ? handleEvent(s.id, r.event) : null;
    return Response.json({ account: r.account, moved: r.moved, award, state: getState(s.id) });
  }

  const sc = SCENARIOS.find((x) => x.id === body.scenario);
  if (!sc) return Response.json({ error: 'Unknown scenario' }, { status: 400 });
  const applied = applyTransaction(account, sc.tx);
  const alert = analyze(applied.tx, applied.account);
  pushBankAlert(s.id, alert);
  const award = alert.event ? handleEvent(s.id, alert.event) : null;
  return Response.json({ tx: applied.tx, account: applied.account, alert, award, state: getState(s.id) });
}
