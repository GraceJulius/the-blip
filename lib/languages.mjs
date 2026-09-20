// Languages for translated warnings and read-aloud.
// voice: 'v2' = ElevenLabs Multilingual v2, 'v3' = Eleven v3 (more languages), null = text only.
// Coverage comes from ElevenLabs' published model language lists. Yoruba, Igbo, Amharic and Haitian
// Creole are not on those lists, so they are text only. Yoruba was tried and its intonation was wrong.
// To try a text-only language anyway, add it to ELEVENLABS_VOICE_ON_LANGS (uses Eleven v3).

export const LANGS = [
  { id: 'en', name: 'English', native: 'English', bcp: 'en-US', voice: 'v2' },
  // Nigerian and other African languages
  { id: 'yo', name: 'Yoruba', native: 'Yorùbá', bcp: 'yo-NG', voice: null },
  { id: 'ha', name: 'Hausa', native: 'Hausa', bcp: 'ha-NG', voice: 'v3' },
  { id: 'ig', name: 'Igbo', native: 'Igbo', bcp: 'ig-NG', voice: null },
  { id: 'sw', name: 'Swahili', native: 'Kiswahili', bcp: 'sw-KE', voice: 'v3' },
  { id: 'so', name: 'Somali', native: 'Soomaali', bcp: 'so-SO', voice: 'v3' },
  { id: 'am', name: 'Amharic', native: 'አማርኛ', bcp: 'am-ET', voice: null },
  // Widely spoken languages with ElevenLabs voices
  { id: 'es', name: 'Spanish', native: 'Español', bcp: 'es-US', voice: 'v2' },
  { id: 'fr', name: 'French', native: 'Français', bcp: 'fr-FR', voice: 'v2' },
  { id: 'pt', name: 'Portuguese', native: 'Português', bcp: 'pt-BR', voice: 'v2' },
  { id: 'ar', name: 'Arabic', native: 'العربية', bcp: 'ar-SA', voice: 'v2', rtl: true },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी', bcp: 'hi-IN', voice: 'v2' },
  { id: 'bn', name: 'Bengali', native: 'বাংলা', bcp: 'bn-BD', voice: 'v3' },
  { id: 'ur', name: 'Urdu', native: 'اردو', bcp: 'ur-PK', voice: 'v3', rtl: true },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்', bcp: 'ta-IN', voice: 'v2' },
  { id: 'zh', name: 'Chinese (Mandarin)', native: '中文', bcp: 'zh-CN', voice: 'v2' },
  { id: 'ja', name: 'Japanese', native: '日本語', bcp: 'ja-JP', voice: 'v2' },
  { id: 'ko', name: 'Korean', native: '한국어', bcp: 'ko-KR', voice: 'v2' },
  { id: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', bcp: 'vi-VN', voice: 'v3' },
  { id: 'fil', name: 'Filipino', native: 'Filipino', bcp: 'fil-PH', voice: 'v2' },
  { id: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', bcp: 'id-ID', voice: 'v2' },
  { id: 'ru', name: 'Russian', native: 'Русский', bcp: 'ru-RU', voice: 'v2' },
  { id: 'uk', name: 'Ukrainian', native: 'Українська', bcp: 'uk-UA', voice: 'v2' },
  { id: 'pl', name: 'Polish', native: 'Polski', bcp: 'pl-PL', voice: 'v2' },
  { id: 'de', name: 'German', native: 'Deutsch', bcp: 'de-DE', voice: 'v2' },
  { id: 'it', name: 'Italian', native: 'Italiano', bcp: 'it-IT', voice: 'v2' },
  { id: 'nl', name: 'Dutch', native: 'Nederlands', bcp: 'nl-NL', voice: 'v2' },
  { id: 'tr', name: 'Turkish', native: 'Türkçe', bcp: 'tr-TR', voice: 'v2' },
  { id: 'ht', name: 'Haitian Creole', native: 'Kreyòl ayisyen', bcp: 'ht-HT', voice: null },
];

export function isRtl(id) {
  return Boolean(langById(id).rtl);
}

export function langById(id) {
  return LANGS.find((l) => l.id === id) || LANGS[0];
}

export function isLang(id) {
  return LANGS.some((l) => l.id === id);
}

// Which ElevenLabs model speaks this language, or null when there is no voice for it.
export function ttsModelFor(id, env = process.env) {
  const l = langById(id);
  const list = (v) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (list(env.ELEVENLABS_VOICE_OFF_LANGS).includes(l.id)) return null;
  if (l.voice === null && list(env.ELEVENLABS_VOICE_ON_LANGS).includes(l.id)) return env.ELEVENLABS_MODEL_V3 || 'eleven_v3';
  if (l.voice === 'v2') return env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
  if (l.voice === 'v3') return env.ELEVENLABS_MODEL_V3 || 'eleven_v3';
  return null;
}

const MAX_ITEMS = 30;
const MAX_LEN = 600;

// Keep only usable strings, capped in number and length.
export function cleanTexts(texts) {
  if (!Array.isArray(texts)) return [];
  return texts.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim().slice(0, MAX_LEN)).slice(0, MAX_ITEMS);
}

// A translation is only used when it lines up with the input, item for item.
export function validateTranslation(input, output) {
  if (!Array.isArray(output) || output.length !== input.length) return false;
  return output.every((o) => typeof o === 'string' && o.trim().length > 0);
}
