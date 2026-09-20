import { z } from 'zod';
import { compare, normalizeItems } from '@/lib/grocery.mjs';
import { claudeParse, claudeAvailable } from '@/lib/claude';
import { studentFrom } from '@/lib/api';
import { userPricesFor } from '@/lib/engine';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

const AdviceSchema = z.object({ advice: z.string() });

const SYSTEM = `You write short, friendly grocery advice for a college student. You are given facts as JSON that were already computed by code.
- Write 3 sentences at most, under 70 words in total.
- Use ONLY the numbers and names in the JSON. Never do your own math and never invent prices or products.
- Mention the cheapest store, and one healthier swap if there is one.
- No lecturing, no medical advice, no emoji.`;

function facts(r) {
  return {
    cheapestStore: r.cheapest,
    stores: r.stores.map((s) => ({ name: s.name, total: s.total, healthierBasketExtraCost: s.healthyExtra, carriesEverything: s.complete })),
    healthRatingNow: r.healthScore,
    healthRatingWithSwaps: r.healthierScore,
    swaps: r.swaps.slice(0, 3).map((w) => ({ from: w.from.name, to: w.to.name, extraCost: w.costDelta, healthPointsGained: w.healthGain })),
    budget: r.budget ? { amount: r.budget.amount, fits: r.budget.fits, over: r.budget.over } : null,
    splitTripSavings: r.split ? r.split.savings : null,
  };
}

function plainAdvice(r) {
  const parts = [];
  if (r.cheapest) parts.push(`${r.cheapest} is the cheapest for this list.`);
  const w = r.swaps[0];
  if (w) parts.push(`Swapping ${w.from.name.toLowerCase()} for ${w.to.name.toLowerCase()} raises the health rating by ${w.healthGain} points${w.costDelta === null ? '' : w.costDelta <= 0 ? ' and costs less' : ' for about $' + w.costDelta.toFixed(2) + ' more'}.`);
  if (r.budget && !r.budget.fits) parts.push(`You are $${r.budget.over.toFixed(2)} over your budget, so see the trimmed list.`);
  return parts.join(' ') || 'Add a few items to get advice.';
}

export async function POST(req) {
  if (!allow('gadvice:' + clientKey(req), 10, 60 * 1000)) return tooMany();
  const body = await req.json().catch(() => ({}));
  const s = await studentFrom(body.studentId);
  if (s.error) return s.error;

  const r = compare(normalizeItems(Array.isArray(body.items) ? body.items.slice(0, 40) : []), { budget: Number(body.budget) > 0 ? Number(body.budget) : null, userPrices: userPricesFor(s.id) });
  if (!r.items.length) return Response.json({ advice: 'Add a few items to get advice.', usedClaude: false });

  const f = facts(r);
  const c = await claudeParse({ system: SYSTEM, user: JSON.stringify(f), schema: AdviceSchema, maxTokens: 600, cacheKey: 'advice|' + JSON.stringify(f) });
  if (c.ok) return Response.json({ advice: c.data.advice, usedClaude: true });
  return Response.json({ advice: plainAdvice(r), usedClaude: false, reason: claudeAvailable() ? c.reason : 'no_key' });
}
