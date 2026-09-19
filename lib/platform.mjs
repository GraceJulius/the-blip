import crypto from 'crypto';

export const ORG_RE = /^[a-z0-9-]{2,20}$/;

export function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

export function newApiKey() {
  const key = 'blip_live_' + crypto.randomBytes(24).toString('base64url');
  return { key, hash: sha256(key), prefix: key.slice(0, 16) };
}

export function safeEqualHex(a, b) {
  try {
    const A = Buffer.from(String(a), 'hex');
    const B = Buffer.from(String(b), 'hex');
    return A.length > 0 && A.length === B.length && crypto.timingSafeEqual(A, B);
  } catch {
    return false;
  }
}

export function internalId(orgId, external) {
  const ext = String(external);
  const safe = ext.replace(/[^A-Za-z0-9_-]/g, '_');
  const id = orgId + '__' + safe;
  if (safe === ext && id.length <= 40) return id;
  return orgId + '__' + crypto.createHash('sha1').update(ext).digest('hex').slice(0, 16);
}

export function validExternalId(v) {
  if (typeof v !== 'string' || v.length < 1 || v.length > 64) return false;
  for (let i = 0; i < v.length; i++) if (v.charCodeAt(i) < 32) return false;
  return true;
}

export function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + sig;
}

export function readTokenPayload(token) {
  try {
    const [body] = String(token).split('.');
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p && typeof p === 'object' ? p : null;
  } catch {
    return null;
  }
}

export function verifyToken(token, secret, now = Date.now()) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const expected = crypto.createHmac('sha256', secret).update(parts[0]).digest('base64url');
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const p = readTokenPayload(token);
  if (!p || typeof p.e !== 'number' || p.e * 1000 < now) return null;
  return p;
}

export function signWebhook(secret, timestamp, body) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(timestamp + '.' + body).digest('hex');
}

const PRIVATE_V4 = [/^0\./, /^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./];

export function isSafeWebhookUrl(raw, opts = {}) {
  let u;
  try { u = new URL(String(raw)); } catch { return { ok: false, reason: 'That is not a valid web address.' }; }
  const https = u.protocol === 'https:';
  if (!https && !(opts.allowInsecure && u.protocol === 'http:')) return { ok: false, reason: 'Webhook addresses must start with https://.' };
  const host = u.hostname.toLowerCase();
  if (u.username || u.password) return { ok: false, reason: 'Do not put a username or password in the address.' };
  if (opts.allowPrivate) return { ok: true };
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan')) return { ok: false, reason: 'That address points inside a private network.' };
  if (host.startsWith('[')) {
    const h = host.slice(1, -1);
    if (h === '::1' || h === '::' || /^f[cd]/.test(h) || /^fe[89ab]/.test(h) || h.startsWith('::ffff:')) return { ok: false, reason: 'That address points inside a private network.' };
    return { ok: true };
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) && PRIVATE_V4.some((re) => re.test(host))) return { ok: false, reason: 'That address points inside a private network.' };
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) return { ok: false, reason: 'That address format is not allowed.' };
  if (!host.includes('.')) return { ok: false, reason: 'Use a full domain name.' };
  return { ok: true };
}

export function slug(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
}
