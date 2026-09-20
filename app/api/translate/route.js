import { translateTexts } from '@/lib/translate';
import { cleanTexts, isLang } from '@/lib/languages.mjs';
import { allow, clientKey, tooMany } from '@/lib/guard';

export const dynamic = 'force-dynamic';

// Translates our own warnings into another language. Nothing is stored except a short in-memory cache.
export async function POST(req) {
  if (!allow('translate:' + clientKey(req), 30, 60 * 1000)) return tooMany('Too many requests. Wait a minute and try again.');
  const body = await req.json().catch(() => ({}));
  if (!isLang(body.lang)) return Response.json({ error: 'Pick a language from the list.' }, { status: 400 });
  const texts = cleanTexts(body.texts);
  if (texts.length === 0) return Response.json({ error: 'Nothing to translate.' }, { status: 400 });
  const r = await translateTexts(texts, body.lang);
  if (!r.ok) return Response.json({ error: 'translation_unavailable', reason: r.reason }, { status: 503 });
  return Response.json({ lang: body.lang, texts: r.texts });
}
