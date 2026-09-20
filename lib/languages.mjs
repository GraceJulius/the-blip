// Languages for translated warnings and read-aloud.
// voice: 'v2' = ElevenLabs Multilingual v2, 'v3' = Eleven v3 (more languages), null = text only.
// Coverage comes from ElevenLabs' published model language lists. Yoruba is not on those lists,
// so its voice is marked experimental and can be turned off with ELEVENLABS_VOICE_OFF_LANGS=yo.

export const LANGS = [
  { id: 'en', name: 'English', native: 'English', bcp: 'en-US', voice: 'v2' },
  { id: 'yo', name: 'Yoruba', native: 'Yorùbá', bcp: 'yo-NG', voice: 'v3', experimental: true },
  { id: 'ha', name: 'Hausa', native: 'Hausa', bcp: 'ha-NG', voice: 'v3' },
  { id: 'ig', name: 'Igbo', native: 'Igbo', bcp: 'ig-NG', voice: null },
  { id: 'sw', name: 'Swahili', native: 'Kiswahili', bcp: 'sw-KE', voice: 'v3' },
  { id: 'es', name: 'Spanish', native: 'Español', bcp: 'es-US', voice: 'v2' },
  { id: 'fr', name: 'French', native: 'Français', bcp: 'fr-FR', voice: 'v2' },
  { id: 'pt', name: 'Portuguese', native: 'Português', bcp: 'pt-BR', voice: 'v2' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी', bcp: 'hi-IN', voice: 'v2' },
  { id: 'ar', name: 'Arabic', native: 'العربية', bcp: 'ar-SA', voice: 'v2' },
];

export function langById(id) {
  return LANGS.find((l) => l.id === id) || LANGS[0];
}

export function isLang(id) {
  return LANGS.some((l) => l.id === id);
}

// Which ElevenLabs model speaks this language, or null when there is no voice for it.
export function ttsModelFor(id, env = process.env) {
  const l = langById(id);
  const off = String(env.ELEVENLABS_VOICE_OFF_LANGS || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (off.includes(l.id)) return null;
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
