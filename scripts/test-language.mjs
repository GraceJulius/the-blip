import { LANGS, langById, isLang, ttsModelFor, cleanTexts, validateTranslation } from '../lib/languages.mjs';

let fails = 0;
const check = (n, c) => { if (!c) { fails++; console.log('FAIL', n); } };

check('English is first and the fallback', LANGS[0].id === 'en' && langById('zz').id === 'en' && langById(undefined).id === 'en');
check('ids are unique', new Set(LANGS.map((l) => l.id)).size === LANGS.length);
check('isLang works', isLang('yo') && isLang('en') && !isLang('xx') && !isLang(null) && !isLang({}));
check('every language has a name, native name and locale', LANGS.every((l) => l.name && l.native && /^[a-z]{2}-[A-Z]{2}$/.test(l.bcp)));

// voice model choice
check('English uses the standard model', ttsModelFor('en', {}) === 'eleven_multilingual_v2');
check('Hausa uses v3', ttsModelFor('ha', {}) === 'eleven_v3');
check('Spanish uses the standard model', ttsModelFor('es', {}) === 'eleven_multilingual_v2');
check('Igbo has no voice', ttsModelFor('ig', {}) === null);
check('model names can be overridden', ttsModelFor('ha', { ELEVENLABS_MODEL_V3: 'x3' }) === 'x3' && ttsModelFor('es', { ELEVENLABS_MODEL: 'x2' }) === 'x2');
check('Yoruba voice can be turned off', ttsModelFor('yo', {}) === 'eleven_v3' && ttsModelFor('yo', { ELEVENLABS_VOICE_OFF_LANGS: 'yo' }) === null && ttsModelFor('yo', { ELEVENLABS_VOICE_OFF_LANGS: ' ha , yo ' }) === null);
check('turning one off leaves the others', ttsModelFor('ha', { ELEVENLABS_VOICE_OFF_LANGS: 'yo' }) === 'eleven_v3');
check('Yoruba is flagged experimental', langById('yo').experimental === true);

// cleaning input
check('cleanTexts drops junk', JSON.stringify(cleanTexts(['a', '', '  ', 5, null, ' b '])) === '["a","b"]');
check('cleanTexts caps length and count', cleanTexts(['x'.repeat(5000)])[0].length === 600 && cleanTexts(Array(100).fill('a')).length === 30);
check('cleanTexts handles non-arrays', cleanTexts('x').length === 0 && cleanTexts(undefined).length === 0);

// only well-formed translations are accepted
check('matching translation accepted', validateTranslation(['a', 'b'], ['x', 'y']));
check('wrong length rejected', !validateTranslation(['a', 'b'], ['x']) && !validateTranslation(['a'], ['x', 'y']));
check('empty item rejected', !validateTranslation(['a'], ['  ']));
check('non-string rejected', !validateTranslation(['a'], [5]) && !validateTranslation(['a'], null));

if (fails) { console.log(fails + ' checks failed'); process.exit(1); }
console.log('all language checks passed');
