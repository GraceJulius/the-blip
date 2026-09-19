import { cleanReceipt, matchStore, validPriceEntry } from '../lib/receipt.mjs';
import { compare } from '../lib/grocery.mjs';
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { console.log((c ? '  PASS ' : '  FAIL ') + n + (c ? '' : ' ' + x)); c ? pass++ : fail++; };

ok('store names are recognised', matchStore('GIANT EAGLE #6021') === 'gianteagle' && matchStore("Trader Joe's") === 'traderjoes' && matchStore('ALDI') === 'aldi' && matchStore('Wal-Mart Supercenter') === 'walmart');
ok('an unknown store is not guessed', matchStore('Corner Bodega') === null && matchStore(null) === null);

let r = cleanReceipt({ store: 'ALDI', date: '09/18/2026', lines: [
  { text: 'LARGE EGGS 12CT', quantity: 1, linePrice: 2.65, catalogId: 'eggs' },
  { text: 'BANANAS', quantity: 3, linePrice: 1.5, catalogId: 'bananas' },
  { text: 'MILK GAL', quantity: 1, linePrice: 2.99, catalogId: 'milk' },
  { text: 'CANDLE', quantity: 1, linePrice: 4.99, catalogId: null },
  { text: 'TAX', quantity: 1, linePrice: 0, catalogId: null },
  { text: 'FAKE', quantity: 1, linePrice: 3, catalogId: 'not_real' },
] });
ok('the store id is found', r.storeId === 'aldi');
ok('unit price = line price / quantity (3 bananas for $1.50 = $0.50)', r.lines.find((l) => l.itemId === 'bananas').unitPrice === 0.5);
ok('lines with a zero price are dropped', !r.lines.some((l) => l.text === 'TAX'));
ok('an id that is not in the catalog is ignored, not trusted', r.lines.find((l) => l.text === 'FAKE').itemId === null);
ok('only catalog items count as tracked', r.trackedCount === 3, String(r.trackedCount));

r = cleanReceipt({ store: 'X', lines: [{ text: 'EGGS', quantity: 1, linePrice: 2.5, catalogId: 'eggs' }, { text: 'EGGS ORGANIC', quantity: 1, linePrice: 6.9, catalogId: 'eggs' }] });
ok('a duplicate catalog item keeps only the first line', r.trackedCount === 1);
r = cleanReceipt({ store: 'X', lines: [{ text: 'EGGS 5DZ', quantity: 1, linePrice: 60, catalogId: 'eggs' }, { text: 'PENNY CANDY', quantity: 1, linePrice: 0.06, catalogId: 'oats' }] });
ok('an unrealistic price for the item is flagged as suspicious', r.lines.every((l) => l.suspicious), JSON.stringify(r.lines.map((l) => l.suspicious)));
ok('junk input does not crash', cleanReceipt(null).lines.length === 0 && cleanReceipt({ lines: 'nope' }).lines.length === 0);
ok('price entries are validated', validPriceEntry({ itemId: 'eggs', price: 2.5 }) && !validPriceEntry({ itemId: 'nope', price: 2 }) && !validPriceEntry({ itemId: 'eggs', price: -1 }) && !validPriceEntry({ itemId: 'eggs', price: 900 }) && !validPriceEntry(null));

const base = compare([{ id: 'eggs', qty: 2 }]);
const mine = compare([{ id: 'eggs', qty: 2 }], { userPrices: { eggs: { walmart: 1.5 } } });
ok('your receipt price changes the ranking', base.cheapest === 'Aldi' && mine.cheapest === 'Walmart');
ok('the store card counts your prices', mine.stores.find((s) => s.name === 'Walmart').yours === 1 && mine.yourPriceCount === 1 && base.yourPriceCount === 0);
console.log(fail ? `${fail} FAILED` : `all ${pass} checks passed`); process.exit(fail ? 1 : 0);
