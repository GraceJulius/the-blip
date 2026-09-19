import crypto from 'crypto';

const buckets = (globalThis.__blipBuckets = globalThis.__blipBuckets || new Map());

export function clientKey(req) {
  const h = req.headers;
  const ip = h.get('cf-connecting-ip') || h.get('do-connecting-ip') || (h.get('x-forwarded-for') || '').split(',')[0].trim();
  return ip || 'local';
}

export function allow(key, limit, windowMs) {
  const now = Date.now();
  const recent = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > windowMs * 2) buckets.delete(k);
  }
  return true;
}

export function tooMany(message) {
  return Response.json({ error: message || 'Too many requests. Wait a minute and try again.' }, { status: 429 });
}

export function checkAdmin(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return process.env.NODE_ENV === 'production' ? { ok: false, disabled: true } : { ok: true };
  const a = Buffer.from(String(password || ''));
  const b = Buffer.from(expected);
  return { ok: a.length === b.length && crypto.timingSafeEqual(a, b) };
}
