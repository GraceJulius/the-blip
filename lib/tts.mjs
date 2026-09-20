// Read-aloud. Uses ElevenLabs when a key is set. Without one the browser's own voice is used,
// so the button always works. Nothing spoken is stored.

export const MAX_CHARS = 700;

export function clampText(text) {
  return String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
}

export function ttsConfig(env = process.env) {
  return {
    key: env.ELEVENLABS_API_KEY || '',
    voice: env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM',
    model: env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
  };
}

// Returns { ok: true, audio } or { ok: false, reason, status }.
export async function synthesize(text, cfg, fetchImpl = fetch) {
  const t = clampText(text);
  if (!t) return { ok: false, reason: 'empty', status: 400 };
  if (!cfg.key) return { ok: false, reason: 'voice_off', status: 503 };
  try {
    const res = await fetchImpl('https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(cfg.voice) + '?output_format=mp3_44100_128', {
      method: 'POST',
      headers: { 'xi-api-key': cfg.key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: t, model_id: cfg.model }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, reason: 'provider_error', status: 502 };
    return { ok: true, audio: await res.arrayBuffer() };
  } catch {
    return { ok: false, reason: 'provider_error', status: 502 };
  }
}
