import fs from 'fs';
import { makeT, interpolate, extractStrings, placeholders, sameShape, T } from '../lib/i18n.mjs';
import { LANGS } from '../lib/languages.mjs';

let fails = 0;
const check = (n, c) => { if (!c) { fails++; console.log('FAIL', n); } };

// the translate function
const t = makeT({ Home: 'Ilé', '{n} points': 'àmì {n}', Empty: '  ' });
check('translates a known string', t('Home') === 'Ilé');
check('falls back to English', t('Unknown') === 'Unknown');
check('fills placeholders', t('{n} points', { n: 5 }) === 'àmì 5');
check('fills placeholders in English fallback', makeT(null)('{n} points', { n: 5 }) === '5 points');
check('blank translation falls back', t('Empty') === 'Empty');
check('missing variable is left visible, not "undefined"', interpolate('Hi {name}', {}) === 'Hi {name}' && interpolate('Hi {name}', { name: null }) === 'Hi {name}');
check('no dictionary is fine', makeT(undefined)('x') === 'x' && makeT('junk')('x') === 'x');
check('T marks and returns the text', T('abc') === 'abc');

// finding strings in source
check('extracts t() and T() strings', JSON.stringify(extractStrings("t('A'); T(\"B\"); const t = 1; split('x'); it('no')")) === '["A","B"]');
check('handles escaped quotes', extractStrings("t('It\\'s fine')")[0] === "It's fine");
check('ignores dynamic calls', extractStrings("t(variable); t(`x`)").length === 0);

// placeholders
check('placeholders are read', JSON.stringify(placeholders('{n} of {total}')) === '["n","total"]');
check('translation must keep placeholders', sameShape('{n} points', 'àmì {n}') && !sameShape('{n} points', 'àmì') && !sameShape('{n} points', 'àmì {x}') && !sameShape('a', ''));

// the generated dictionaries
const source = JSON.parse(fs.readFileSync(new URL('../data/i18n-source.json', import.meta.url), 'utf8'));
check('source strings exist', source.length > 150);
let missingFiles = [];
for (const l of LANGS.filter((x) => x.id !== 'en')) {
  let d;
  try { d = JSON.parse(fs.readFileSync(new URL('../public/i18n/' + l.id + '.json', import.meta.url), 'utf8')); } catch { missingFiles.push(l.id); continue; }
  const keys = Object.keys(d);
  check(l.id + ': no stale strings', keys.every((k) => source.includes(k)));
  check(l.id + ': placeholders kept', keys.every((k) => sameShape(k, d[k])));
  check(l.id + ': covers at least 95% of strings', keys.length >= source.length * 0.95);
  check(l.id + ': safety translations differ from English', d['Likely scam'] && d['Likely scam'] !== 'Likely scam');
}
check('every language has a dictionary file' + (missingFiles.length ? ' (missing: ' + missingFiles.join(', ') + ')' : ''), missingFiles.length === 0);

if (fails) { console.log(fails + ' checks failed'); process.exit(1); }
console.log('all i18n checks passed');
