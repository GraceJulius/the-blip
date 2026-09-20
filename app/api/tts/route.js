import { synthesize, ttsConfig, clampText } from '@/lib/tts.mjs';
import { ttsModelFor, isLang } from '@/lib/languages.mjs';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

const cache = new Map();

// Spoken version of a verdict. Returns 503 when no voice key is set, and the page then uses the browser voice.
export async function POST(req) {
  if (!allow('tts:' + clientKey(req), 20, 60 * 1000)) return tooMany('Too many requests. Wait a minute and try again.');
  const { text, lang: rawLang } = await req.json().catch(() => ({}));
  const lang = isLang(rawLang) ? rawLang : 'en';
  const t = clampText(text);
  if (!t) return Response.json({ error: 'Nothing to read' }, { status: 400 });
  const cfg = ttsConfig();
  if (!cfg.key) return Response.json({ error: 'voice_off' }, { status: 503 });
  const model = ttsModelFor(lang);
  if (!model) return Response.json({ error: 'no_voice_for_language' }, { status: 503 });
  const ck = lang + '|' + t;
  if (cache.has(ck)) return new Response(cache.get(ck), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  const budget = Number(process.env.ELEVENLABS_CALLS_PER_10MIN) || 40;
  if (!allow('tts:all', budget, 10 * 60 * 1000)) return Response.json({ error: 'voice_busy' }, { status: 503 });
  const r = await synthesize(t, { ...cfg, model });
  if (!r.ok) return Response.json({ error: r.reason }, { status: r.status });
  if (cache.size >= 50) cache.delete(cache.keys().next().value);
  cache.set(ck, r.audio);
  return new Response(r.audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
}
