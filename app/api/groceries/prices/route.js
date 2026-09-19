import { STORES } from '@/lib/grocery.mjs';
import { validPriceEntry } from '@/lib/receipt.mjs';
import { savePrices, clearPrices, handleEvent } from '@/lib/engine';
import { studentFrom } from '@/lib/api';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!allow('prices:' + clientKey(req), 20, 60 * 1000)) return tooMany();
  const body = await req.json().catch(() => ({}));
  const s = await studentFrom(body.studentId);
  if (s.error) return s.error;

  if (body.clear === true) { clearPrices(s.id); return Response.json({ ok: true, cleared: true }); }

  if (!STORES.some((x) => x.id === body.storeId)) return Response.json({ error: 'Pick which store this receipt is from.' }, { status: 400 });
  const entries = (Array.isArray(body.prices) ? body.prices.slice(0, 80) : []).filter(validPriceEntry);
  if (entries.length === 0) return Response.json({ error: 'Choose at least one price to save.' }, { status: 400 });

  const saved = savePrices(s.id, body.storeId, entries);
  const questAward = saved >= 3 ? handleEvent(s.id, 'receipt_saved').awarded || 0 : 0;
  return Response.json({ ok: true, saved, questAward });
}
