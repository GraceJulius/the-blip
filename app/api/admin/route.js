import { ready, db } from '@/lib/store';
import { getOrg, publicOrg, createOrg, listOrgs, createKey, revokeKey, updateOrg, rotateWebhookSecret, addQuest, removeQuest, seedSimulated, clearSimulated, mintEmbed, partnerStudent } from '@/lib/orgs';
import { deliver } from '@/lib/webhooks';
import { checkAdmin } from '@/lib/guard';
import { allow, clientKey, tooMany, isBlocked, record } from '@/lib/guard';
import { validExternalId } from '@/lib/platform.mjs';
import { baseUrl } from '@/lib/partnerApi';

export const dynamic = 'force-dynamic';

const bad = (msg, status = 400) => Response.json({ error: msg }, { status });

export async function POST(req) {
  await ready();
  const ip = clientKey(req);
  if (!allow('admin:' + ip, 90, 60 * 1000)) return tooMany();
  const body = await req.json().catch(() => ({}));
  const tenMin = 10 * 60 * 1000;
  if (isBlocked('adminfail:' + ip, 10, tenMin) || isBlocked('adminfail:all', 60, tenMin)) return tooMany('Too many wrong passwords. Try again in a few minutes.');
  const auth = checkAdmin(body.password || req.headers.get('x-admin-password'));
  if (auth.disabled) return bad('Admin actions are disabled on this server. Set ADMIN_PASSWORD to turn them on.', 403);
  if (!auth.ok) {
    record('adminfail:' + ip, tenMin);
    record('adminfail:all', tenMin);
    return bad('Wrong password.', 401);
  }

  if (body.action === 'createOrg') {
    const r = createOrg(String(body.newId || ''), body.newName);
    return r.error ? bad(r.error) : Response.json({ ok: true, id: r.id, orgs: listOrgs() });
  }
  if (body.action === 'listOrgs') return Response.json({ orgs: listOrgs() });

  const orgId = typeof body.orgId === 'string' && /^[a-z0-9-]{2,20}$/.test(body.orgId) ? body.orgId : 'demo';
  const org = getOrg(orgId);
  if (!org) return bad('Unknown organization.', 404);
  const done = (r, extra = {}) => (r && r.error ? bad(r.error) : Response.json({ ok: true, ...(r || {}), ...extra, org: publicOrg(getOrg(orgId)) }));

  switch (body.action) {
    case 'get': return Response.json({ org: publicOrg(org), webhookLog: (db().webhookLog || []).filter((w) => w.orgId === orgId).slice(-10).reverse() });
    case 'update': return done(updateOrg(orgId, { name: body.name, accent: body.accent, pointsBudget: body.pointsBudget, webhookUrl: body.webhookUrl }));
    case 'createKey': return done(createKey(orgId, body.label));
    case 'revokeKey': return done(revokeKey(orgId, String(body.keyId || '')));
    case 'addQuest': return done(addQuest(orgId, body));
    case 'removeQuest': return done(removeQuest(orgId, String(body.id || '')));
    case 'rotateSecret': return done(rotateWebhookSecret(orgId));
    case 'testWebhook': {
      const r = await deliver(getOrg(orgId), { type: 'test', message: 'This is a test event from TheBlip.', ts: new Date().toISOString() });
      return Response.json({ ok: r.ok, status: r.status || null, error: r.error || null, webhookLog: (db().webhookLog || []).filter((w) => w.orgId === orgId).slice(-10).reverse() });
    }
    case 'seed': return done(seedSimulated(orgId, Number(body.n) || 240));
    case 'clearSim': return done({ removed: clearSimulated(orgId) });
    case 'mintEmbed': {
      if (!validExternalId(body.studentId)) return bad('Enter a student id of 1 to 64 characters.');
      const s = partnerStudent(orgId, body.studentId);
      const m = mintEmbed(orgId, s.id, 3600);
      const base = baseUrl(req);
      return Response.json({ ok: true, url: base + '/embed?token=' + encodeURIComponent(m.token), script: `<script src="${base}/embed.js" data-token="${m.token}"></script>`, expiresAt: m.expiresAt });
    }
    default: return bad('Unknown action.');
  }
}
