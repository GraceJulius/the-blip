import { db, persist } from './store';
import { signWebhook, isSafeWebhookUrl } from './platform.mjs';

const allowInsecure = () => process.env.WEBHOOK_ALLOW_INSECURE === '1';
const allowPrivate = () => process.env.WEBHOOK_ALLOW_PRIVATE === '1';

function log(orgId, type, status, ok, error) {
  const d = db();
  d.webhookLog = d.webhookLog || [];
  d.webhookLog.push({ orgId, type, status: status || null, ok, error: error || null, ts: new Date().toISOString() });
  if (d.webhookLog.length > 60) d.webhookLog = d.webhookLog.slice(-60);
  persist();
}

export async function deliver(org, payload) {
  const w = org && org.webhook;
  if (!w || !w.url || !w.secret) return { ok: false, error: 'No webhook is configured.' };
  const safe = isSafeWebhookUrl(w.url, { allowInsecure: allowInsecure(), allowPrivate: allowPrivate() });
  if (!safe.ok) { log(org.id, payload.type, null, false, safe.reason); return { ok: false, error: safe.reason }; }

  const body = JSON.stringify(payload);
  const ts = String(Math.floor(Date.now() / 1000));
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(w.url, {
      method: 'POST',
      redirect: 'error',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'TheBlip-Webhooks/1', 'X-Blip-Timestamp': ts, 'X-Blip-Signature': signWebhook(w.secret, ts, body) },
      body,
    });
    log(org.id, payload.type, res.status, res.ok, res.ok ? null : 'HTTP ' + res.status);
    return { ok: res.ok, status: res.status };
  } catch (e) {
    const msg = e && e.name === 'AbortError' ? 'Timed out after 5 seconds.' : 'Could not reach the address.';
    log(org.id, payload.type, null, false, msg);
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

export function emit(orgId, payload) {
  const org = (db().orgs || {})[orgId];
  if (!org || !org.webhook || !org.webhook.url || !org.webhook.secret) return;
  deliver(org, payload).catch(() => {});
}
