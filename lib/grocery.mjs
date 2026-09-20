export const STORES = [
  { id: 'gianteagle', name: 'Giant Eagle' },
  { id: 'aldi', name: 'Aldi' },
  { id: 'traderjoes', name: "Trader Joe's" },
  { id: 'walmart', name: 'Walmart' },
];

export const PRICE_NOTE = 'Prices are typical sample prices for the demo, not live prices. Real prices from receipts will replace them.';
export const HEALTH_NOTE = 'The 0 to 100 health rating is a simple estimate based on general guidance (fiber, protein, added sugar, salt, and how processed the food is). It is not medical advice.';

const P = (gianteagle, aldi, traderjoes, walmart) => ({ gianteagle, aldi, traderjoes, walmart });

export const CATALOG = [
  { id: 'brown_rice', name: 'Brown rice', unit: '2 lb', health: 82, why: 'Whole grain with fiber.', keywords: ['brown rice'], prices: P(3.99, 2.65, 3.29, 2.78) },
  { id: 'white_rice', name: 'White rice', unit: '2 lb', health: 55, why: 'Refined grain, little fiber.', keywords: ['white rice', 'rice'], swap: 'brown_rice', prices: P(2.99, 1.89, 2.99, 1.98) },
  { id: 'pasta_wg', name: 'Whole wheat pasta', unit: '16 oz', health: 78, why: 'More fiber than regular pasta.', keywords: ['whole wheat pasta', 'wheat pasta'], prices: P(2.19, 1.29, 1.99, 1.48) },
  { id: 'pasta', name: 'Pasta', unit: '16 oz', health: 50, why: 'Refined grain.', keywords: ['pasta', 'spaghetti', 'noodles'], swap: 'pasta_wg', prices: P(1.79, 1.09, 1.69, 1.18) },
  { id: 'oats', name: 'Rolled oats', unit: '42 oz', health: 92, why: 'Whole grain, lots of fiber, no added sugar.', keywords: ['oats', 'oatmeal'], prices: P(5.29, 3.49, 3.99, 3.68) },
  { id: 'cereal', name: 'Sugary cereal', unit: 'box', health: 25, why: 'High in added sugar.', keywords: ['sugary cereal', 'cereal'], swap: 'oats', prices: P(4.49, 2.99, 3.99, 3.48) },
  { id: 'bread_wg', name: 'Whole wheat bread', unit: 'loaf', health: 70, why: 'Whole grain, more fiber.', keywords: ['whole wheat bread', 'wheat bread'], prices: P(3.49, 2.29, 3.29, 2.68) },
  { id: 'bread', name: 'White sandwich bread', unit: 'loaf', health: 40, why: 'Refined flour, low fiber.', keywords: ['white bread', 'bread'], swap: 'bread_wg', prices: P(2.49, 1.69, 2.49, 1.58) },
  { id: 'ramen', name: 'Instant ramen', unit: '6 pack', health: 20, why: 'Very high in salt, low in nutrients.', keywords: ['ramen', 'instant noodles'], swap: 'pasta_wg', prices: P(2.99, 2.19, null, 1.98) },
  { id: 'eggs', name: 'Eggs', unit: 'dozen', health: 85, why: 'Protein and vitamins, barely processed.', keywords: ['eggs', 'egg'], prices: P(3.99, 2.79, 3.49, 2.98) },
  { id: 'milk', name: 'Milk (2%)', unit: '1 gal', health: 72, why: 'Protein and calcium.', keywords: ['milk'], prices: P(4.29, 3.09, 3.79, 3.28) },
  { id: 'yogurt', name: 'Plain Greek yogurt', unit: '32 oz', health: 88, why: 'High protein, no added sugar.', keywords: ['greek yogurt', 'plain yogurt'], prices: P(5.99, 4.29, 4.99, 4.68) },
  { id: 'yogurt_sweet', name: 'Flavored yogurt', unit: '4 pack', health: 45, why: 'Added sugar.', keywords: ['flavored yogurt', 'yogurt'], swap: 'yogurt', prices: P(3.29, 2.29, 2.99, 2.48) },
  { id: 'cheese', name: 'Cheddar cheese', unit: '8 oz', health: 55, why: 'Protein but high in saturated fat and salt.', keywords: ['cheese', 'cheddar'], prices: P(3.49, 2.49, 2.99, 2.68) },
  { id: 'chicken', name: 'Chicken breast', unit: '1 lb', health: 85, why: 'Lean protein.', keywords: ['chicken'], prices: P(4.99, 3.49, 4.49, 3.98) },
  { id: 'turkey', name: 'Ground turkey', unit: '1 lb', health: 78, why: 'Lean protein.', keywords: ['turkey'], prices: P(5.49, 3.99, 4.99, 4.68) },
  { id: 'tuna', name: 'Canned tuna', unit: '5 oz', health: 82, why: 'Lean protein and omega-3s.', keywords: ['tuna'], prices: P(1.49, 0.99, 1.49, 1.18) },
  { id: 'beans', name: 'Black beans (canned)', unit: '15 oz', health: 92, why: 'Protein and fiber, very cheap.', keywords: ['black beans', 'beans'], prices: P(1.49, 0.95, 1.29, 0.98) },
  { id: 'lentils', name: 'Dry lentils', unit: '1 lb', health: 96, why: 'Protein and fiber, very cheap.', keywords: ['lentils'], prices: P(2.29, 1.59, 1.99, 1.68) },
  { id: 'pb', name: 'Peanut butter', unit: '16 oz', health: 75, why: 'Protein and healthy fats. Pick one with no added sugar.', keywords: ['peanut butter'], prices: P(3.99, 2.49, 2.99, 2.78) },
  { id: 'hummus', name: 'Hummus', unit: '10 oz', health: 78, why: 'Chickpeas and olive oil.', keywords: ['hummus'], prices: P(3.99, 2.79, 2.99, 2.98) },
  { id: 'bananas', name: 'Bananas', unit: '1 lb', health: 88, why: 'Fruit with fiber and potassium.', keywords: ['bananas', 'banana'], prices: P(0.79, 0.55, 0.69, 0.58) },
  { id: 'apples', name: 'Apples', unit: '3 lb bag', health: 90, why: 'Fruit with fiber.', keywords: ['apples', 'apple'], prices: P(5.99, 3.99, 4.49, 4.28) },
  { id: 'spinach', name: 'Spinach', unit: '10 oz', health: 95, why: 'Leafy green, packed with nutrients.', keywords: ['spinach'], prices: P(3.49, 2.49, 2.99, 2.68) },
  { id: 'broccoli', name: 'Broccoli', unit: '1 lb', health: 95, why: 'Vegetable with fiber and vitamins.', keywords: ['broccoli'], prices: P(2.29, 1.79, 1.99, 1.88) },
  { id: 'carrots', name: 'Carrots', unit: '2 lb', health: 92, why: 'Vegetable with fiber and vitamin A.', keywords: ['carrots', 'carrot'], prices: P(2.49, 1.59, 1.99, 1.78) },
  { id: 'onions', name: 'Yellow onions', unit: '3 lb', health: 88, why: 'Vegetable that stretches any meal.', keywords: ['onions', 'onion'], prices: P(3.49, 2.19, 2.99, 2.68) },
  { id: 'potatoes', name: 'Potatoes', unit: '5 lb', health: 65, why: 'Filling with potassium, best baked or boiled.', keywords: ['potatoes', 'potato'], prices: P(4.49, 3.29, 3.99, 3.48) },
  { id: 'frozen_veg', name: 'Frozen mixed vegetables', unit: '12 oz', health: 88, why: 'Frozen right after picking, keeps well.', keywords: ['frozen vegetables', 'frozen veg'], prices: P(1.99, 1.29, 1.69, 1.28) },
  { id: 'tomatoes', name: 'Canned tomatoes', unit: '28 oz', health: 80, why: 'Vegetable base for sauces and soups.', keywords: ['tomatoes', 'tomato'], prices: P(2.49, 1.65, 1.99, 1.98) },
  { id: 'olive_oil', name: 'Olive oil', unit: '16 oz', health: 80, why: 'Healthy fats for cooking.', keywords: ['olive oil'], prices: P(7.99, 5.49, 6.99, 6.18) },
  { id: 'granola_bar', name: 'Granola bars', unit: '6 count', health: 45, why: 'Often high in added sugar.', keywords: ['granola bars', 'granola bar'], swap: 'bananas', prices: P(3.49, 2.19, 2.99, 2.68) },
  { id: 'chips', name: 'Potato chips', unit: 'bag', health: 15, why: 'High in salt and fat, low in nutrients.', keywords: ['chips'], swap: 'apples', prices: P(4.29, 2.29, 3.49, 3.28) },
  { id: 'oj', name: 'Orange juice', unit: '52 oz', health: 45, why: 'Vitamin C but a lot of sugar without the fiber.', keywords: ['orange juice', 'juice'], prices: P(4.99, 3.49, 3.99, 3.68) },
  { id: 'soda', name: 'Soda', unit: '12 pack', health: 5, why: 'Sugar with no nutrients.', keywords: ['soda', 'pop'], prices: P(8.99, 6.49, null, 6.98) },
];

export const BY_ID = Object.fromEntries(CATALOG.map((c) => [c.id, c]));
export const CATALOG_IDS = CATALOG.map((c) => c.id);

export const TEMPLATES = [
  { id: 'ramen', label: 'Upgrade my ramen week', budget: 35, items: [{ id: 'ramen', qty: 2 }, { id: 'white_rice', qty: 1 }, { id: 'bread', qty: 1 }, { id: 'cereal', qty: 1 }, { id: 'chips', qty: 1 }, { id: 'soda', qty: 1 }, { id: 'yogurt_sweet', qty: 1 }] },
  { id: 'healthy40', label: 'Healthy week under $40', budget: 40, items: [{ id: 'oats', qty: 1 }, { id: 'eggs', qty: 1 }, { id: 'brown_rice', qty: 1 }, { id: 'beans', qty: 3 }, { id: 'lentils', qty: 1 }, { id: 'chicken', qty: 1 }, { id: 'spinach', qty: 1 }, { id: 'broccoli', qty: 1 }, { id: 'bananas', qty: 2 }, { id: 'carrots', qty: 1 }] },
  { id: 'prep', label: 'Meal prep basics', budget: 45, items: [{ id: 'chicken', qty: 2 }, { id: 'brown_rice', qty: 1 }, { id: 'frozen_veg', qty: 2 }, { id: 'eggs', qty: 1 }, { id: 'onions', qty: 1 }, { id: 'tomatoes', qty: 2 }, { id: 'olive_oil', qty: 1 }, { id: 'pasta_wg', qty: 1 }] },
];

const round2 = (n) => Math.round(n * 100) / 100;
const clampQty = (q) => Math.max(1, Math.min(10, Math.round(Number(q) || 1)));

export function normalizeItems(items) {
  const m = new Map();
  for (const it of Array.isArray(items) ? items : []) {
    if (!it || !BY_ID[it.id]) continue;
    m.set(it.id, Math.min(10, (m.get(it.id) || 0) + clampQty(it.qty)));
  }
  return [...m].map(([id, qty]) => ({ id, qty }));
}

export function priceOf(id, storeId, userPrices) {
  const u = userPrices && userPrices[id] && userPrices[id][storeId];
  if (typeof u === 'number' && u > 0) return u;
  const p = BY_ID[id].prices[storeId];
  return typeof p === 'number' ? p : null;
}

export function basketTotal(items, storeId, userPrices) {
  let total = 0;
  const missing = [];
  for (const it of items) {
    const p = priceOf(it.id, storeId, userPrices);
    if (p === null) missing.push(it.id);
    else total += p * it.qty;
  }
  return { total: round2(total), missing };
}

export function healthScore(items) {
  const q = items.reduce((n, i) => n + i.qty, 0);
  if (!q) return 0;
  return Math.round(items.reduce((n, i) => n + BY_ID[i.id].health * i.qty, 0) / q);
}

export function findSwaps(items) {
  const out = [];
  for (const it of items) {
    const c = BY_ID[it.id];
    if (!c.swap) continue;
    const t = BY_ID[c.swap];
    if (t.health - c.health >= 15) out.push({ from: c.id, to: t.id, qty: it.qty, healthGain: t.health - c.health });
  }
  return out;
}

export function applySwaps(items, swaps) {
  const m = new Map(items.map((i) => [i.id, i.qty]));
  for (const s of swaps) {
    const q = m.get(s.from);
    if (!q) continue;
    m.delete(s.from);
    m.set(s.to, Math.min(10, (m.get(s.to) || 0) + q));
  }
  return [...m].map(([id, qty]) => ({ id, qty }));
}

function bestSplit(items, userPrices, singleBest) {
  let best = null;
  for (let a = 0; a < STORES.length; a++) {
    for (let b = a + 1; b < STORES.length; b++) {
      const pair = [STORES[a], STORES[b]];
      let total = 0;
      const plan = { [pair[0].id]: [], [pair[1].id]: [] };
      let ok = true;
      for (const it of items) {
        const cands = pair.map((s) => ({ s, p: priceOf(it.id, s.id, userPrices) })).filter((x) => x.p !== null);
        if (!cands.length) { ok = false; break; }
        cands.sort((x, y) => x.p - y.p);
        total += cands[0].p * it.qty;
        plan[cands[0].s.id].push({ name: BY_ID[it.id].name, qty: it.qty, price: round2(cands[0].p) });
      }
      if (!ok) continue;
      total = round2(total);
      if (!best || total < best.total) best = { pair, total, plan };
    }
  }
  if (!best || !singleBest) return null;
  const savings = round2(singleBest.total - best.total);
  if (savings < 2) return null;
  const used = best.pair.filter((s) => best.plan[s.id].length > 0);
  if (used.length < 2) return null;
  return { total: best.total, savings, trips: used.map((s) => ({ store: s.name, items: best.plan[s.id] })) };
}

function trimToBudget(items, storeId, budget, userPrices) {
  const list = items.map((i) => ({ ...i }));
  const removed = [];
  let guard = 0;
  while (guard++ < 200) {
    const { total } = basketTotal(list, storeId, userPrices);
    if (total <= budget || list.length === 0) break;
    list.sort((a, b) => BY_ID[a.id].health - BY_ID[b.id].health || (priceOf(b.id, storeId, userPrices) || 0) - (priceOf(a.id, storeId, userPrices) || 0));
    const first = list[0];
    first.qty -= 1;
    removed.push(BY_ID[first.id].name);
    if (first.qty <= 0) list.shift();
  }
  return { items: list, removed };
}

export function compare(rawItems, opts = {}) {
  const items = normalizeItems(rawItems);
  const userPrices = opts.userPrices || null;
  const swaps = findSwaps(items);
  const healthier = applySwaps(items, swaps);

  const stores = STORES.map((s) => {
    const base = basketTotal(items, s.id, userPrices);
    const healthy = basketTotal(healthier, s.id, userPrices);
    return {
      id: s.id,
      name: s.name,
      total: base.total,
      missing: base.missing.map((id) => BY_ID[id].name),
      complete: base.missing.length === 0,
      healthyTotal: healthy.total,
      healthyExtra: round2(healthy.total - base.total),
      yours: items.filter((i) => userPrices && userPrices[i.id] && userPrices[i.id][s.id] > 0).length,
      healthyComplete: healthy.missing.length === 0,
      badges: [],
    };
  }).sort((a, b) => Number(b.complete) - Number(a.complete) || a.total - b.total);

  const complete = stores.filter((s) => s.complete);
  const pool = complete.length ? complete : stores;
  const cheapest = items.length ? pool.reduce((m, s) => (s.total < m.total ? s : m), pool[0]) : null;
  const healthyPool = stores.filter((s) => s.healthyComplete);
  const cheapestHealthy = items.length && healthyPool.length ? healthyPool.reduce((m, s) => (s.healthyTotal < m.healthyTotal ? s : m), healthyPool[0]) : null;
  if (cheapest) stores.find((s) => s.id === cheapest.id).badges.push('Cheapest');
  if (cheapestHealthy) stores.find((s) => s.id === cheapestHealthy.id).badges.push('Cheapest healthier basket');

  const swapView = swaps.map((s) => {
    const at = cheapest || stores[0];
    const from = priceOf(s.from, at.id, userPrices);
    const to = priceOf(s.to, at.id, userPrices);
    return {
      from: { id: s.from, name: BY_ID[s.from].name },
      to: { id: s.to, name: BY_ID[s.to].name },
      qty: s.qty,
      healthGain: s.healthGain,
      why: BY_ID[s.to].why,
      costDelta: from !== null && to !== null ? round2((to - from) * s.qty) : null,
      atStore: at.name,
    };
  }).sort((a, b) => (a.costDelta ?? 99) - (b.costDelta ?? 99));

  let budget = null;
  const amount = Number(opts.budget);
  if (amount > 0 && cheapest) {
    const fits = cheapest.total <= amount;
    budget = { amount: round2(amount), cheapestStore: cheapest.name, cheapestTotal: cheapest.total, fits, over: fits ? 0 : round2(cheapest.total - amount), trim: null };
    if (!fits) {
      const t = trimToBudget(items, cheapest.id, amount, userPrices);
      budget.trim = { removed: t.removed, items: t.items };
    }
  }

  return {
    items: items.map((i) => ({ id: i.id, name: BY_ID[i.id].name, unit: BY_ID[i.id].unit, qty: i.qty, health: BY_ID[i.id].health, why: BY_ID[i.id].why })),
    healthScore: healthScore(items),
    healthierScore: healthScore(healthier),
    swaps: swapView,
    stores,
    cheapest: cheapest ? cheapest.name : null,
    cheapestHealthy: cheapestHealthy ? cheapestHealthy.name : null,
    split: items.length && cheapest ? bestSplit(items, userPrices, cheapest) : null,
    budget,
    priceNote: PRICE_NOTE,
    healthNote: HEALTH_NOTE,
    yourPriceCount: stores.reduce((n, s) => n + s.yours, 0),
  };
}

export function parseRequest(text) {
  let t = ' ' + String(text || '').toLowerCase() + ' ';
  const found = new Map();
  const ordered = [...CATALOG].sort((a, b) => Math.max(...b.keywords.map((k) => k.length)) - Math.max(...a.keywords.map((k) => k.length)));
  for (const c of ordered) {
    for (const k of [...c.keywords].sort((a, b) => b.length - a.length)) {
      const re = new RegExp('(?:(\\d+)\\s*(?:x|lbs?|bags?|cans?|packs?|boxes|loaves|dozen)?\\s+(?:of\\s+)?)?\\b' + k.replace(/\s+/g, '\\s+') + '(?:s|es)?\\b');
      const m = t.match(re);
      if (m) {
        found.set(c.id, (found.get(c.id) || 0) + (m[1] ? Number(m[1]) : 1));
        t = t.replace(re, ' ');
        break;
      }
    }
  }
  const b = String(text || '').match(/\$\s?(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:dollars|bucks)/i);
  return { items: normalizeItems([...found].map(([id, qty]) => ({ id, qty }))), budget: b ? Number(b[1] || b[2]) : null };
}
