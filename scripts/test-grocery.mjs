import * as g from '../lib/grocery.mjs';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { console.log((cond ? '  PASS ' : '  FAIL ') + name + (cond ? '' : ' ' + extra)); cond ? pass++ : fail++; };
const near = (a, b) => Math.abs(a - b) < 0.011;

// 1. totals, checked by hand
let r = g.compare([{ id: 'eggs', qty: 1 }, { id: 'milk', qty: 1 }]);
const byName = Object.fromEntries(r.stores.map((s) => [s.name, s.total]));
ok('eggs + milk at Giant Eagle = 3.99 + 4.29 = 8.28', near(byName['Giant Eagle'], 8.28), JSON.stringify(byName));
ok('eggs + milk at Aldi = 2.79 + 3.09 = 5.88', near(byName['Aldi'], 5.88));
ok("eggs + milk at Trader Joe's = 3.49 + 3.79 = 7.28", near(byName["Trader Joe's"], 7.28));
ok('eggs + milk at Walmart = 2.98 + 3.28 = 6.26', near(byName['Walmart'], 6.26));
ok('cheapest is Aldi', r.cheapest === 'Aldi');
ok('quantity multiplies: 3 eggs at Aldi = 8.37', near(g.compare([{ id: 'eggs', qty: 3 }]).stores.find((s) => s.name === 'Aldi').total, 8.37));

// 2. an item a store does not carry
r = g.compare([{ id: 'soda', qty: 1 }, { id: 'eggs', qty: 1 }]);
const tj = r.stores.find((s) => s.name === "Trader Joe's");
ok("Trader Joe's is marked incomplete for soda", tj.complete === false && tj.missing.includes('Soda'));
ok("an incomplete store is never called 'Cheapest'", !tj.badges.includes('Cheapest'));
ok('incomplete stores are sorted after complete ones', r.stores[r.stores.length - 1].name === "Trader Joe's");

// 3. swaps
r = g.compare([{ id: 'ramen', qty: 2 }, { id: 'white_rice', qty: 1 }]);
ok('ramen and white rice both get a swap suggestion', r.swaps.length === 2);
ok('health improves after swaps', r.healthierScore > r.healthScore, r.healthScore + ' -> ' + r.healthierScore);
const aldi = r.stores.find((s) => s.name === 'Aldi');
const expectHealthy = 2 * 1.29 + 1 * 2.65;
ok('healthier basket at Aldi = 2 x 1.29 + 2.65', near(aldi.healthyTotal, expectHealthy), aldi.healthyTotal + ' vs ' + expectHealthy);
ok('healthyExtra = healthy total - base total', near(aldi.healthyExtra, aldi.healthyTotal - aldi.total));
r = g.compare([{ id: 'pasta', qty: 1 }, { id: 'pasta_wg', qty: 1 }]);
ok('swap merges into an item already in the list', g.applySwaps(g.normalizeItems([{ id: 'pasta', qty: 1 }, { id: 'pasta_wg', qty: 1 }]), g.findSwaps(g.normalizeItems([{ id: 'pasta', qty: 1 }, { id: 'pasta_wg', qty: 1 }]))).find((i) => i.id === 'pasta_wg').qty === 2);
ok('a swap needs at least 15 health points of gain', g.findSwaps([{ id: 'oats', qty: 1 }]).length === 0);

// 4. budget
const tpl = g.TEMPLATES.find((t) => t.id === 'ramen');
r = g.compare(tpl.items, { budget: 8 });
ok('an impossible budget is reported as not fitting', r.budget && r.budget.fits === false && r.budget.over > 0);
const trimmedTotal = g.basketTotal(r.budget.trim.items, 'aldi').total;
ok('the trimmed list fits the budget (or is empty)', trimmedTotal <= 8 || r.budget.trim.items.length === 0, String(trimmedTotal));
ok('trimming removes the least healthy items first', r.budget.trim.removed[0] === 'Soda' || r.budget.trim.removed[0] === 'Potato chips', r.budget.trim.removed.join(','));
r = g.compare(tpl.items, { budget: 500 });
ok('a big budget fits and needs no trim', r.budget.fits === true && r.budget.trim === null);
ok('no budget means no budget block', g.compare(tpl.items).budget === null);

// 5. split trip
r = g.compare(g.TEMPLATES[1].items);
ok('a split plan is only offered when it saves at least $2', r.split === null || r.split.savings >= 2, JSON.stringify(r.split && r.split.savings));
if (r.split) ok('split total is below the best single store', r.split.total < r.stores[0].total);

// 6. keyword parsing
let p = g.parseRequest('2 eggs, milk and rice under $30');
ok('parse: eggs x2, milk, rice, budget 30', p.items.find((i) => i.id === 'eggs')?.qty === 2 && p.items.some((i) => i.id === 'milk') && p.items.some((i) => i.id === 'white_rice') && p.budget === 30, JSON.stringify(p));
p = g.parseRequest('brown rice and pasta');
ok('parse: "brown rice" is not also counted as white rice', p.items.some((i) => i.id === 'brown_rice') && !p.items.some((i) => i.id === 'white_rice'), JSON.stringify(p.items));
ok('parse: plain pasta is not whole wheat', p.items.some((i) => i.id === 'pasta') && !p.items.some((i) => i.id === 'pasta_wg'));
p = g.parseRequest('whole wheat pasta and 3 cans of black beans, 25 dollars');
ok('parse: 3 cans of black beans and a $25 budget', p.items.find((i) => i.id === 'beans')?.qty === 3 && p.budget === 25, JSON.stringify(p));
ok('parse: nonsense gives an empty list, not a crash', g.parseRequest('xyz qwerty').items.length === 0);

// 7. safety: bad input
r = g.compare([{ id: 'not_real', qty: 2 }, { id: 'eggs', qty: 999 }, null, { id: 'milk', qty: -5 }]);
ok('unknown ids are ignored, quantities are clamped to 1..10', r.items.length === 2 && r.items.find((i) => i.id === 'eggs').qty === 10 && r.items.find((i) => i.id === 'milk').qty === 1, JSON.stringify(r.items));
ok('an empty list is safe', g.compare([]).stores.every((s) => s.total === 0) && g.compare([]).cheapest === null);
ok('user receipt prices override the sample prices', near(g.compare([{ id: 'eggs', qty: 1 }], { userPrices: { eggs: { aldi: 1.99 } } }).stores.find((s) => s.name === 'Aldi').total, 1.99));

console.log(fail === 0 ? `\nall ${pass} checks passed` : `\n${fail} FAILED, ${pass} passed`);
process.exit(fail ? 1 : 0);
