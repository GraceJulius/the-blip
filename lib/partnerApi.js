import { ready } from './store';
import { findOrgByKey } from './orgs';
import { allow, clientKey } from './guard';

export function baseUrl(req) {
  const h = req.headers;
  const host = h.get('x-forwarded-host') || h.get('host') || new URL(req.url).host;
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return proto.split(',')[0].trim() + '://' + host.split(',')[0].trim();
}

export function apiError(status, code, message, extra = {}) {
  return Response.json({ error: { code, message, ...extra } }, { status });
}

export async function authenticate(req) {
  await ready();
  const ip = clientKey(req);
  if (!allow('v1ip:' + ip, 600, 60 * 1000)) return { error: apiError(429, 'rate_limited', 'Too many requests from this address. Slow down.') };
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(\S+)$/i);
  if (!m) return { error: apiError(401, 'missing_key', 'Send your API key as: Authorization: Bearer YOUR_KEY') };
  const found = findOrgByKey(m[1]);
  if (!found) {
    if (!allow('v1bad:' + ip, 20, 10 * 60 * 1000)) return { error: apiError(429, 'rate_limited', 'Too many invalid keys. Wait a few minutes.') };
    return { error: apiError(401, 'invalid_key', 'That API key is not valid or was revoked.') };
  }
  if (!allow('v1key:' + found.key.id, 300, 60 * 1000)) return { error: apiError(429, 'rate_limited', 'This key exceeded 300 requests a minute.') };
  return { org: found.org, key: found.key };
}
