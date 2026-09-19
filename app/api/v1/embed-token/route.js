import { authenticate, apiError, baseUrl } from '@/lib/partnerApi';
import { mintEmbed, partnerStudent } from '@/lib/orgs';
import { validExternalId, internalId } from '@/lib/platform.mjs';
import { checkStudent } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const a = await authenticate(req);
  if (a.error) return a.error;
  const body = await req.json().catch(() => null);
  if (!body || !validExternalId(body.studentId)) return apiError(400, 'invalid_student_id', 'studentId must be a string of 1 to 64 characters.');
  const c = checkStudent(internalId(a.org.id, body.studentId));
  if (!c.ok) return apiError(c.status, 'capacity', c.error);
  const s = partnerStudent(a.org.id, body.studentId);
  const m = mintEmbed(a.org.id, s.id, body.ttlSeconds);
  const base = baseUrl(req);
  return Response.json({ token: m.token, expiresAt: m.expiresAt, url: base + '/embed?token=' + encodeURIComponent(m.token), script: `<script src="${base}/embed.js" data-token="${m.token}"></script>` });
}
