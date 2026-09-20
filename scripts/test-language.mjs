import { LANGS, langById, isLang, isRtl, ttsModelFor, cleanTexts, validateTranslation } from '../lib/languages.mjs';

let fails = 0;
const check = (n, c) => { if (!c) { fails++; console.log('FAIL', n); } };

check('English is first and the fallback', LANGS[0].id === 'en' && langById('zz').id === 'en' && langById(undefined).id === 'en');
check('ids are unique', new Set(LANGS.map((l) => l.id)).size === LANGS.length);
check('isLang works', isLang('yo') && isLang('en') && !isLang('xx') && !isLang(null) && !isLang({}));
check('every language has a name, native name and locale', LANGS.every((l) => l.name && l.native && /^[a-z]{2,3}-[A-Z]{2}$/.test(l.bcp)));

// voice model choice
check('English uses the standard model', ttsModelFor('en', {}) === 'eleven_multilingual_v2');
check('Hausa uses v3', ttsModelFor('ha', {}) === 'eleven_v3');
check('Spanish uses the standard model', ttsModelFor('es', {}) === 'eleven_multilingual_v2');
check('Igbo has no voice', ttsModelFor('ig', {}) === null);
check('model names can be overridden', ttsModelFor('ha', { ELEVENLABS_MODEL_V3: 'x3' }) === 'x3' && ttsModelFor('es', { ELEVENLABS_MODEL: 'x2' }) === 'x2');
check('Yoruba is text only by default', ttsModelFor('yo', {}) === null && langById('yo').voice === null);
check('a text-only language can be tried with the on switch', ttsModelFor('yo', { ELEVENLABS_VOICE_ON_LANGS: 'yo' }) === 'eleven_v3' && ttsModelFor('yo', { ELEVENLABS_VOICE_ON_LANGS: ' ha , yo ' }) === 'eleven_v3');
check('a voice can be turned off', ttsModelFor('ha', { ELEVENLABS_VOICE_OFF_LANGS: 'ha' }) === null && ttsModelFor('ha', { ELEVENLABS_VOICE_OFF_LANGS: ' es , ha ' }) === null);
check('turning one off leaves the others', ttsModelFor('ha', { ELEVENLABS_VOICE_OFF_LANGS: 'yo' }) === 'eleven_v3');
check('off wins over on', ttsModelFor('yo', { ELEVENLABS_VOICE_ON_LANGS: 'yo', ELEVENLABS_VOICE_OFF_LANGS: 'yo' }) === null);
check('Arabic and Urdu are right to left', isRtl('ar') && isRtl('ur') && !isRtl('en') && !isRtl('yo'));
check('the language list is wide', LANGS.length >= 25);
check('text-only languages are the ones ElevenLabs does not list', ['yo', 'ig', 'am', 'ht'].every((id) => langById(id).voice === null));

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
