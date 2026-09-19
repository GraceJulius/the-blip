'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

function Code({ children }) {
  return <pre className="code"><code>{children}</code></pre>;
}

export default function Docs() {
  const [base, setBase] = useState('https://your-site.example.com');
  useEffect(() => { setBase(window.location.origin); }, []);
  return (
    <>
      <h1>Partner API</h1>
      <p className="sub">Connect your app to TheBlip. Send us what a student did, and we return points, levels and an embeddable rewards widget. You never need to send raw transactions or personal details.</p>

      <div className="card">
        <h2>Quick start</h2>
        <ol style={{ margin: '0 0 8px', paddingLeft: 20 }}>
          <li>Ask your TheBlip admin for an API key (Console, then Integration).</li>
          <li>Send an event when a student does something worth rewarding.</li>
          <li>Show the result with the embeddable widget, or read it back from the API.</li>
        </ol>
        <Code>{`curl -X POST ${base}/api/v1/events \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"studentId":"user-42","type":"autopay_enabled"}'`}</Code>
        <Code>{`{
  "awarded": 150,
  "questId": "autopay",
  "blocked": false,
  "message": "Quest completed: Set up autopay",
  "student": { "id": "user-42", "points": 150, "level": { "index": 1, "name": "Rookie" } }
}`}</Code>
      </div>

      <div className="card">
        <h2>Authentication</h2>
        <p>Send your key on every request as a bearer token. Keys start with <code>blip_live_</code>. Keep them on your server and never put one in a web page or a mobile app. We store only a fingerprint of each key, so a lost key cannot be recovered. Create a new one and revoke the old one.</p>
        <Code>{`Authorization: Bearer blip_live_xxxxxxxxxxxxxxxx`}</Code>
        <p className="note">Limits: 300 requests a minute per key, 600 a minute per address, and 20 invalid keys in 10 minutes before an address is paused.</p>
      </div>

      <div className="card">
        <h2><span className="method">POST</span>/api/v1/events</h2>
        <p>Tell us a student did something. <code>studentId</code> is your own id for the student, 1 to 64 characters. We recommend an opaque id rather than an email or name. <code>type</code> must be one of your program's event names (see the quests endpoint). A student earns each quest once. Sending it again returns <code>awarded: 0</code>.</p>
        <Code>{`{ "studentId": "user-42", "type": "payment_on_time" }`}</Code>
        <p className="note">If the student is in recovery mode after a scam, quest events are paused and the response says <code>blocked: true</code>. If your program has used its points budget, no points are given and the message says so.</p>
      </div>

      <div className="card">
        <h2><span className="method">GET</span>/api/v1/students/:id</h2>
        <p>Read a student's points, level and quest progress. Returns 404 for a student we have not seen yet.</p>
        <Code>{`{
  "id": "user-42", "points": 350, "xp": 350,
  "level": { "index": 2, "name": "Watcher", "progress": 33 },
  "locked": false,
  "quests": [ { "id": "autopay", "title": "Set up autopay", "event": "autopay_enabled", "points": 150, "done": true } ]
}`}</Code>
      </div>

      <div className="card">
        <h2><span className="method">GET</span>/api/v1/quests</h2>
        <p>Your program's quests, including any custom ones your admin created, with the event name that completes each.</p>
      </div>

      <div className="card">
        <h2><span className="method">GET</span>/api/v1/stats?days=14</h2>
        <p>Program totals, a funnel from enrolled to level 3, a daily series, quest counts, and the most common scam signals students reported. Between 7 and 90 days. Simulated demo students are never included.</p>
      </div>

      <div className="card">
        <h2><span className="method">POST</span>/api/v1/embed-token</h2>
        <p>Create a short-lived, read-only token for one student, to show the rewards widget in your app. Tokens last 1 hour by default (60 seconds to 24 hours with <code>ttlSeconds</code>). Mint a fresh one each time you render the page, on your server.</p>
        <Code>{`curl -X POST ${base}/api/v1/embed-token \\
  -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json" \\
  -d '{"studentId":"user-42","ttlSeconds":3600}'`}</Code>
        <p>The response includes a <code>url</code> and a ready-made <code>script</code> tag.</p>
      </div>

      <div className="card">
        <h2>Embed the widget</h2>
        <p>Paste this where the widget should appear. It creates a responsive frame that resizes itself and uses your program's name and color.</p>
        <Code>{`<script src="${base}/embed.js" data-token="TOKEN_FROM_YOUR_SERVER"></script>`}</Code>
        <p className="note">Or use the frame yourself: <code>{`<iframe src="${base}/embed?token=TOKEN" style="width:100%;border:0"></iframe>`}</code>. The token only allows reading one student's progress. It cannot award points.</p>
      </div>

      <div className="card">
        <h2>Webhooks</h2>
        <p>We call your address when a student earns points, so you can update your own records or send a notification. Set the address and copy the signing secret in the Console. Addresses must be public <code>https://</code> URLs.</p>
        <Code>{`POST https://your-server.example.com/blip-webhook
X-Blip-Timestamp: 1790000000
X-Blip-Signature: sha256=9c1f...
Content-Type: application/json

{ "type": "points.awarded", "student": "user-42", "points": 150,
  "reason": "quest", "quest": "autopay", "totalPoints": 150, "ts": "2026-09-19T14:03:11.000Z" }`}</Code>
        <p>The signature is an HMAC-SHA256 of <code>timestamp + "." + rawBody</code> using your secret. Always verify it, and reject requests whose timestamp is more than a few minutes old.</p>
        <Code>{`// Node.js
import crypto from 'crypto';
function valid(secret, ts, rawBody, header) {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(ts + '.' + rawBody).digest('hex');
  return header.length === expected.length && crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}`}</Code>
        <Code>{`# Python
import hmac, hashlib
def valid(secret, ts, raw_body, header):
    expected = "sha256=" + hmac.new(secret.encode(), (ts + "." + raw_body).encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header)`}</Code>
        <p className="note">Answer with any 2xx status within 5 seconds. We do not retry yet, and we do not follow redirects. Recent deliveries and errors are listed in the Console.</p>
      </div>

      <div className="card">
        <h2>Errors</h2>
        <table className="tbl">
          <thead><tr><th>Status</th><th>Code</th><th>Meaning</th></tr></thead>
          <tbody>
            <tr><td>400</td><td><code>invalid_json</code>, <code>invalid_student_id</code>, <code>unknown_event</code></td><td>The request is malformed. <code>unknown_event</code> lists the valid events.</td></tr>
            <tr><td>401</td><td><code>missing_key</code>, <code>invalid_key</code></td><td>No key, or a key that is wrong or revoked.</td></tr>
            <tr><td>404</td><td><code>not_found</code></td><td>Student not seen yet.</td></tr>
            <tr><td>429</td><td><code>rate_limited</code></td><td>Slow down and retry.</td></tr>
            <tr><td>503</td><td><code>capacity</code></td><td>The program is full. Contact your admin.</td></tr>
          </tbody>
        </table>
        <Code>{`{ "error": { "code": "unknown_event", "message": "That event type is not recognized for your program.", "validEvents": ["autopay_enabled", "..."] } }`}</Code>
      </div>

      <div className="card">
        <h2>What we store</h2>
        <p style={{ margin: 0 }}>Your student id, the events you send, and the points and level that result. No names, emails or account numbers are needed. Points are earned only from behavior you report. There are no points for opening accounts or spending.</p>
      </div>

      <p className="note">Try it without writing code: open the <Link href="/console">Console</Link>, go to Integration, create a key and mint a widget.</p>
    </>
  );
}
