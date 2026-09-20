import crypto from 'crypto';
import { db, persist } from './store';
import { QUESTS } from './quests';
import { newApiKey, sha256, safeEqualHex, ORG_RE, internalId, signToken, verifyToken, readTokenPayload, isSafeWebhookUrl, slug } from './platform.mjs';
import { computeAnalytics, buildCohort } from './analytics.mjs';

const RESERVED_EVENTS = new Set(['scam_reported', 'quiz_bonus', 'card_frozen', ...QUESTS.map((q) => q.event)]);

function defaultOrg(id, name) {
  return { id, name, brand: { accent: '#9b7bff' }, embedSecret: crypto.randomBytes(24).toString('hex'), apiKeys: [], webhook: { url: '', secret: '' }, pointsBudget: 0, customQuests: [], createdAt: new Date().toISOString() };
}

export function getOrg(id = 'demo', create = true) {
  const d = db();
  d.orgs = d.orgs || {};
  if (!d.orgs[id] && create && id === 'demo') { d.orgs.demo = defaultOrg('demo', 'Demo Bank'); persist(); }
  return d.orgs[id] || null;
}

export function createOrg(id, name) {
  const d = db();
  d.orgs = d.orgs || {};
  if (!ORG_RE.test(String(id))) return { error: 'The id can use lowercase letters, numbers and dashes (2 to 20 characters).' };
  if (d.orgs[id]) return { error: 'An organization with that id already exists.' };
  if (Object.keys(d.orgs).length >= 10) return { error: 'This demo allows at most 10 organizations.' };
  const n = String(name || '').trim();
  if (n.length < 2 || n.length > 40) return { error: 'The name must be 2 to 40 characters.' };
  d.orgs[id] = defaultOrg(id, n);
  persist();
  return { ok: true, id };
}

export function listOrgs() {
  return Object.values(db().orgs || {}).map((o) => ({ id: o.id, name: o.name }));
}

export function orgQuests(orgId) {
  const o = (db().orgs || {})[orgId];
  return o && o.customQuests && o.customQuests.length ? [...QUESTS, ...o.customQuests] : QUESTS;
}

export function orgIssued(orgId) {
  const d = db();
  let n = 0;
  for (const l of d.ledger) {
    if (l.delta <= 0) continue;
    const s = d.students[l.studentId];
    if (s && s.orgId === orgId && !s.synthetic) n += l.delta;
  }
  return n;
}

export function budgetAllows(orgId, points) {
  const o = (db().orgs || {})[orgId];
  if (!o || !(o.pointsBudget > 0)) return true;
  return orgIssued(orgId) + points <= o.pointsBudget;
}

export function findOrgByKey(token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
  const h = sha256(token);
  for (const o of Object.values(db().orgs || {})) {
    for (const k of o.apiKeys) if (!k.revoked && safeEqualHex(k.hash, h)) { k.lastUsedAt = new Date().toISOString(); return { org: o, key: k }; }
  }
  return null;
}

export function publicOrg(o) {
  return {
    id: o.id,
    name: o.name,
    brand: o.brand,
    pointsBudget: o.pointsBudget,
    pointsIssued: orgIssued(o.id),
    customQuests: o.customQuests,
    webhook: { url: o.webhook.url, hasSecret: Boolean(o.webhook.secret) },
    apiKeys: o.apiKeys.map((k) => ({ id: k.id, label: k.label, prefix: k.prefix, createdAt: k.createdAt, lastUsedAt: k.lastUsedAt || null, revoked: Boolean(k.revoked) })),
  };
}

export function createKey(orgId, label) {
  const o = getOrg(orgId);
  if (!o) return { error: 'Unknown organization.' };
  if (o.apiKeys.filter((k) => !k.revoked).length >= 5) return { error: 'You can have at most 5 active keys. Revoke one first.' };
  const k = newApiKey();
  const rec = { id: 'k_' + crypto.randomBytes(4).toString('hex'), label: String(label || 'Key').slice(0, 40), hash: k.hash, prefix: k.prefix, createdAt: new Date().toISOString(), revoked: false };
  o.apiKeys.push(rec);
  persist();
  return { key: k.key, id: rec.id };
}

export function revokeKey(orgId, keyId) {
  const o = getOrg(orgId);
  const k = o && o.apiKeys.find((x) => x.id === keyId);
  if (!k) return { error: 'Key not found.' };
  k.revoked = true;
  persist();
  return { ok: true };
}

export function updateOrg(orgId, patch) {
  const o = getOrg(orgId);
  if (!o) return { error: 'Unknown organization.' };
  if (patch.name !== undefined) {
    const n = String(patch.name).trim();
    if (n.length < 2 || n.length > 40) return { error: 'The name must be 2 to 40 characters.' };
    o.name = n;
  }
  if (patch.accent !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(String(patch.accent))) return { error: 'The color must look like #9b7bff.' };
    o.brand.accent = String(patch.accent).toLowerCase();
  }
  if (patch.pointsBudget !== undefined) {
    const b = Number(patch.pointsBudget);
    if (!Number.isFinite(b) || b < 0 || b > 10000000) return { error: 'The points budget must be a number from 0 to 10,000,000. Use 0 for no limit.' };
    o.pointsBudget = Math.round(b);
  }
  if (patch.webhookUrl !== undefined) {
    const u = String(patch.webhookUrl).trim();
    if (u === '') { o.webhook.url = ''; }
    else {
      const safe = isSafeWebhookUrl(u, { allowInsecure: process.env.WEBHOOK_ALLOW_INSECURE === '1', allowPrivate: process.env.WEBHOOK_ALLOW_PRIVATE === '1' });
      if (!safe.ok) return { error: safe.reason };
      o.webhook.url = u;
    }
  }
  persist();
  return { ok: true };
}

export function rotateWebhookSecret(orgId) {
  const o = getOrg(orgId);
  if (!o) return { error: 'Unknown organization.' };
  o.webhook.secret = 'whsec_' + crypto.randomBytes(24).toString('base64url');
  persist();
  return { secret: o.webhook.secret };
}

export function addQuest(orgId, q) {
  const o = getOrg(orgId);
  if (!o) return { error: 'Unknown organization.' };
  const title = String(q.title || '').trim();
  const event = String(q.event || '').trim();
  const points = Math.round(Number(q.points));
  if (title.length < 3 || title.length > 60) return { error: 'The title must be 3 to 60 characters.' };
  if (!/^[a-z0-9_]{3,40}$/.test(event)) return { error: 'The event name can use lowercase letters, numbers and underscores (3 to 40 characters).' };
  if (RESERVED_EVENTS.has(event) || o.customQuests.some((x) => x.event === event)) return { error: 'That event name is already used.' };
  if (!(points >= 10 && points <= 1000)) return { error: 'Points must be between 10 and 1,000.' };
  if (o.customQuests.length >= 20) return { error: 'You can have at most 20 custom quests.' };
  let id = 'c_' + (slug(title) || 'quest');
  while (QUESTS.some((x) => x.id === id) || o.customQuests.some((x) => x.id === id)) id += '_2';
  o.customQuests.push({ id, title, event, points, category: 'custom' });
  persist();
  return { ok: true, id };
}

export function removeQuest(orgId, id) {
  const o = getOrg(orgId);
  if (!o) return { error: 'Unknown organization.' };
  const n = o.customQuests.length;
  o.customQuests = o.customQuests.filter((x) => x.id !== id);
  persist();
  return n === o.customQuests.length ? { error: 'Quest not found.' } : { ok: true };
}

export function mintEmbed(orgId, studentInternalId, ttlSeconds = 3600) {
  const o = getOrg(orgId);
  const ttl = Math.max(60, Math.min(86400, Math.round(Number(ttlSeconds) || 3600)));
  const exp = Math.floor(Date.now() / 1000) + ttl;
  return { token: signToken({ o: orgId, s: studentInternalId, e: exp }, o.embedSecret), expiresAt: new Date(exp * 1000).toISOString() };
}

export function verifyEmbed(token) {
  const p = readTokenPayload(token);
  if (!p || typeof p.o !== 'string' || !ORG_RE.test(p.o)) return null;
  const o = (db().orgs || {})[p.o];
  if (!o) return null;
  const v = verifyToken(token, o.embedSecret);
  return v ? { org: o, studentId: v.s } : null;
}

export function partnerStudent(orgId, externalId) {
  const d = db();
  const id = internalId(orgId, externalId);
  if (!d.students[id]) d.students[id] = { id, orgId, externalId, name: 'Student', locked: false, recovery: null };
  return d.students[id];
}

export function recordScamSignal(orgId, level, flags) {
  const d = db();
  d.scamSignals = d.scamSignals || [];
  d.scamSignals.push({ orgId: orgId || 'demo', ts: new Date().toISOString(), level, flags: (flags || []).slice(0, 8) });
  if (d.scamSignals.length > 5000) d.scamSignals = d.scamSignals.slice(-5000);
  persist();
}

export function analyticsFor(orgId, opts = {}) {
  const d = db();
  return computeAnalytics({ students: d.students, ledger: d.ledger, scamSignals: d.scamSignals || [], orgId, includeSim: Boolean(opts.includeSim), days: opts.days || 14 });
}

export function seedSimulated(orgId, n = 240) {
  const d = db();
  clearSimulated(orgId);
  const c = buildCohort({ orgId, n: Math.max(10, Math.min(1000, n)), quests: orgQuests(orgId) });
  Object.assign(d.students, c.students);
  d.ledger.push(...c.ledger);
  d.scamSignals = (d.scamSignals || []).concat(c.scamSignals);
  persist();
  return { students: Object.keys(c.students).length, rows: c.ledger.length };
}

export function clearSimulated(orgId) {
  const d = db();
  const ids = new Set(Object.values(d.students).filter((s) => s.orgId === orgId && s.synthetic).map((s) => s.id));
  for (const id of ids) delete d.students[id];
  d.ledger = d.ledger.filter((l) => !ids.has(l.studentId));
  d.scamSignals = (d.scamSignals || []).filter((s) => !(s.orgId === orgId && s.synthetic));
  persist();
  return ids.size;
}
