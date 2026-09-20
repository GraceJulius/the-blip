# End-to-end test of the partner platform (73 checks). It needs a running server and a webhook receiver:
#   node scripts/hook-receiver.mjs &
#   ADMIN_PASSWORD=pw-test WEBHOOK_ALLOW_INSECURE=1 WEBHOOK_ALLOW_PRIVATE=1 npm run dev -- -p 3100
#   python3 scripts/e2e-platform.py
# Use a scratch copy of the project: it creates organizations and resets data. The two WEBHOOK_ flags are for local testing only.

import json, urllib.request, urllib.error, hmac, hashlib, time, sys
B = 'http://localhost:3100'
P = 'pw-test'
res = {'pass': 0, 'fail': 0}
def ok(name, cond, extra=''):
    print(('  PASS ' if cond else '  FAIL ') + name + ('' if cond else '  ' + str(extra)))
    res['pass' if cond else 'fail'] += 1
def call(method, path, body=None, headers=None):
    h = {'Content-Type': 'application/json'}; h.update(headers or {})
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(B + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as r: return r.status, json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read() or b'{}')
        except Exception: return e.code, {}
def admin(action, **kw):
    return call('POST', '/api/admin', dict(action=action, password=P, **kw))
def api(method, path, key, body=None):
    return call(method, path, body, {'Authorization': 'Bearer ' + key} if key else {})

print('=== admin protection ===')
s, _ = call('POST', '/api/admin', dict(action='get')); ok('no password is refused', s == 401, s)
s, _ = call('POST', '/api/admin', dict(action='get', password='wrong')); ok('a wrong password is refused', s == 401, s)
s, d = admin('get'); ok('the right password works and shows the demo org', s == 200 and d['org']['id'] == 'demo', d)
ok('the org record never contains the embed secret or a key hash', 'embedSecret' not in json.dumps(d) and 'hash' not in json.dumps(d))

print('=== API keys ===')
s, d = admin('createKey', label='Test key'); key = d.get('key'); ok('a key is created and shown once', s == 200 and key and key.startswith('blip_live_'), d)
s, d = admin('get'); ok('after creation only a prefix is visible, never the key', key not in json.dumps(d) and d['org']['apiKeys'][0]['prefix'] == key[:16], d)
s, d = api('POST', '/api/v1/events', None, dict(studentId='u1', type='autopay_enabled')); ok('no key -> 401 missing_key', s == 401 and d['error']['code'] == 'missing_key', d)
s, d = api('POST', '/api/v1/events', 'blip_live_' + 'x' * 32, dict(studentId='u1', type='autopay_enabled')); ok('a wrong key -> 401 invalid_key', s == 401 and d['error']['code'] == 'invalid_key', d)

print('=== events through the public API ===')
s, d = api('POST', '/api/v1/events', key, dict(studentId='user-42', type='autopay_enabled'))
ok('a valid event awards points', s == 200 and d['awarded'] == 150 and d['student']['points'] == 150 and d['student']['id'] == 'user-42', d)
s, d = api('POST', '/api/v1/events', key, dict(studentId='user-42', type='autopay_enabled')); ok('the same quest is not awarded twice', s == 200 and d['awarded'] == 0 and 'already' in d['message'].lower(), d)
s, d = api('POST', '/api/v1/events', key, dict(studentId='user-42', type='scam_reported')); ok('internal events (scam_reported) cannot be sent by a partner', s == 400 and d['error']['code'] == 'unknown_event' and 'validEvents' in d['error'], d)
s, d = api('POST', '/api/v1/events', key, dict(studentId='user-42', type='nonsense')); ok('an unknown event lists the valid ones', s == 400 and 'autopay_enabled' in d['error']['validEvents'], d)
s, d = api('POST', '/api/v1/events', key, dict(studentId='', type='autopay_enabled')); ok('an empty student id is refused', s == 400 and d['error']['code'] == 'invalid_student_id', d)
s, d = api('POST', '/api/v1/events', key, dict(studentId='x' * 65, type='autopay_enabled')); ok('a 65-character student id is refused', s == 400, d)
s, d = api('POST', '/api/v1/events', key, dict(studentId='weird id/../<b>', type='payment_on_time')); ok('an id with odd characters is accepted safely', s == 200 and d['awarded'] == 200 and d['student']['id'] == 'weird id/../<b>', d)
req = urllib.request.Request(B + '/api/v1/events', data=b'not json', headers={'Authorization': 'Bearer ' + key}, method='POST')
try: urllib.request.urlopen(req)
except urllib.error.HTTPError as e: ok('a body that is not JSON -> 400', e.code == 400, e.code)
s, d = api('GET', '/api/v1/students/user-42', key); ok('reading a student returns points and quests', s == 200 and d['points'] == 150 and any(q['done'] for q in d['quests']), d)
s, d = api('GET', '/api/v1/students/never-seen', key); ok('an unknown student -> 404 (and is not created)', s == 404, d)
s, d = api('GET', '/api/v1/quests', key); ok('the quest list includes the event names', s == 200 and any(q['event'] == 'autopay_enabled' for q in d['quests']), d)
s, d = api('GET', '/api/v1/stats', key); ok('stats show one real, activated student pair', s == 200 and d['totals']['enrolled'] >= 2 and d['totals']['pointsIssued'] >= 350, d.get('totals'))

print('=== tenant isolation ===')
s, d = admin('createOrg', newId='rival', newName='Rival Credit Union'); ok('a second organization can be created', s == 200, d)
s, d = call('POST', '/api/admin', dict(action='createKey', password=P, orgId='rival', label='Rival')); rkey = d.get('key'); ok('the rival gets its own key', s == 200 and rkey and rkey != key, d)
s, d = api('GET', '/api/v1/students/user-42', rkey); ok("the rival cannot read our student", s == 404, d)
s, d = api('POST', '/api/v1/events', rkey, dict(studentId='user-42', type='autopay_enabled')); ok("the rival's event for the same external id makes a separate student", s == 200 and d['student']['points'] == 150, d)
s, d = api('GET', '/api/v1/stats', rkey); ok("the rival's stats only count its own student", d['totals']['enrolled'] == 1, d.get('totals'))
s, d = api('GET', '/api/v1/stats', key); ok('our stats are unchanged by the rival', d['totals']['enrolled'] == 2, d.get('totals'))
s, d = admin('createOrg', newId='rival', newName='Again'); ok('a duplicate organization id is refused', s == 400, d)
s, d = admin('createOrg', newId='BAD ID!', newName='Bad'); ok('an invalid organization id is refused', s == 400, d)

print('=== custom quests ===')
s, d = admin('addQuest', title='Pay rent on time', event='rent_paid', points=120); ok('a custom quest is added', s == 200 and any(q['event'] == 'rent_paid' for q in d['org']['customQuests']), d)
s, d = api('POST', '/api/v1/events', key, dict(studentId='user-42', type='rent_paid')); ok('the custom event now awards its points', s == 200 and d['awarded'] == 120, d)
s, d = api('POST', '/api/v1/events', rkey, dict(studentId='user-42', type='rent_paid')); ok("another organization does not get our custom quest", s == 400, d)
s, d = admin('addQuest', title='Dup', event='rent_paid', points=50); ok('a duplicate event name is refused', s == 400, d)
s, d = admin('addQuest', title='Sneaky', event='scam_reported', points=50); ok('a reserved event name is refused', s == 400, d)
s, d = admin('addQuest', title='Huge', event='huge_bonus', points=999999); ok('an absurd points value is refused', s == 400, d)
s, d = admin('addQuest', title='x', event='ok_event', points=50); ok('a too-short title is refused', s == 400, d)

print('=== points budget ===')
s, d = admin('update', pointsBudget=700)
s, d = api('POST', '/api/v1/events', key, dict(studentId='budget-kid', type='payment_on_time')); ok('within the budget, points are awarded', d['awarded'] == 200, d)
s, d = api('POST', '/api/v1/events', key, dict(studentId='budget-kid', type='utilization_under_30')); ok('over the budget, no points are given and it says why', d['awarded'] == 0 and 'budget' in d['message'].lower(), d)
s, d = admin('update', pointsBudget=0); s, d = api('POST', '/api/v1/events', key, dict(studentId='budget-kid', type='utilization_under_30')); ok('with the budget lifted, awards resume', d['awarded'] == 200, d)
s, d = admin('update', pointsBudget=-5); ok('a negative budget is refused', s == 400, d)

print('=== embed widget ===')
s, d = admin('mintEmbed', studentId='user-42'); url = d['url']; tok = url.split('token=')[1]
from urllib.parse import unquote
tok = unquote(tok)
s, d = call('GET', '/api/embed/state?token=' + urllib.request.quote(tok)); ok('a valid token loads that student', s == 200 and d['points'] >= 150 and d['org']['name'], d)
part = tok.split('.'); bad = part[0][:-2] + ('AA' if not part[0].endswith('AA') else 'BB') + '.' + part[1]
s, d = call('GET', '/api/embed/state?token=' + urllib.request.quote(bad)); ok('a tampered token is rejected', s == 401, d)
s, d = call('GET', '/api/embed/state?token=abc'); ok('a garbage token is rejected', s == 401, d)
s, d = call('GET', '/api/embed/state'); ok('a missing token is rejected', s == 401, d)
s, d = api('POST', '/api/v1/embed-token', key, dict(studentId='user-42')); ok('the API mints a token and a ready-to-paste script tag', s == 200 and d['token'] and '<script' in d['script'], d)
s, d = call('POST', '/api/admin', dict(action='createKey', password=P, orgId='rival', label='k2'))
rk2 = d.get('key')
rtok, = [api('POST', '/api/v1/embed-token', rkey, dict(studentId='rival-kid'))[1]['token']]
s, d = call('GET', '/api/embed/state?token=' + urllib.request.quote(rtok)); ok("the rival's token shows the rival's student, not ours", s == 200 and d['org']['name'] == 'Rival Credit Union', d)

print('=== key revocation ===')
s, d = admin('get'); kid = [k for k in d['org']['apiKeys'] if k['prefix'] == key[:16]][0]['id']
s, d = admin('revokeKey', keyId=kid); ok('a key can be revoked', s == 200, d)
s, d = api('POST', '/api/v1/events', key, dict(studentId='user-42', type='autopay_enabled')); ok('a revoked key stops working immediately', s == 401, d)
s, d = admin('createKey', label='Replacement'); key = d['key']; ok('a replacement key works', api('GET', '/api/v1/quests', key)[0] == 200)


print('=== webhooks ===')
def received():
    with urllib.request.urlopen('http://localhost:4020/_received') as r: return json.loads(r.read())
s, d = admin('update', webhookUrl='http://127.0.0.1:4020/hook'); ok('a webhook address can be saved', s == 200 and d['org']['webhook']['url'].endswith('/hook'), d)
s, d = admin('rotateSecret'); secret = d['secret']; ok('a signing secret is created and shown once', s == 200 and secret.startswith('whsec_'), d)
s, d = admin('get'); ok('the secret is never shown again', secret not in json.dumps(d) and d['org']['webhook']['hasSecret'] is True, d)
n0 = len(received())
s, d = api('POST', '/api/v1/events', key, dict(studentId='hook-kid', type='credit_report_checked')); ok('the event API still answers normally', s == 200 and d['awarded'] == 100, d)
time.sleep(1.5); got = received()[n0:]
ok('exactly one webhook was delivered for that award', len(got) == 1, len(got))
if got:
    g = got[0]; h = g['headers']; body = g['body']
    payload = json.loads(body)
    ok('the payload names the student and the points', payload['type'] == 'points.awarded' and payload['student'] == 'hook-kid' and payload['points'] == 100 and payload['totalPoints'] == 100, payload)
    exp = 'sha256=' + hmac.new(secret.encode(), (h['x-blip-timestamp'] + '.' + body).encode(), hashlib.sha256).hexdigest()
    ok('the signature verifies with the secret', hmac.compare_digest(exp, h['x-blip-signature']), h.get('x-blip-signature'))
    exp2 = 'sha256=' + hmac.new(secret.encode(), (h['x-blip-timestamp'] + '.' + body.replace('100', '999')).encode(), hashlib.sha256).hexdigest()
    ok('a changed body would NOT verify', not hmac.compare_digest(exp2, h['x-blip-signature']))
    ok('the timestamp is recent (replay protection is possible)', abs(time.time() - int(h['x-blip-timestamp'])) < 30)
s, d = api('POST', '/api/v1/events', key, dict(studentId='hook-kid', type='credit_report_checked')); time.sleep(1); ok('an award that gives no points sends no webhook', len(received()) == n0 + 1)
s, d = admin('testWebhook'); ok('the test button delivers a test event', s == 200 and d['ok'] is True and d['status'] == 200, d)
urllib.request.urlopen(urllib.request.Request('http://localhost:4020/_mode', data=b'fail', method='POST'))
t0 = time.time(); s, d = admin('testWebhook'); ok('a failing receiver is reported, not hidden', d['ok'] is False and d['status'] == 500 and any(w['ok'] is False for w in d['webhookLog']), d)
t0 = time.time(); s, d = api('POST', '/api/v1/events', key, dict(studentId='hook-kid2', type='autopay_enabled')); dt = time.time() - t0
ok('a failing receiver does not slow down or break the event API', s == 200 and d['awarded'] == 150 and dt < 2, (s, dt))
urllib.request.urlopen(urllib.request.Request('http://localhost:4020/_mode', data=b'ok', method='POST'))
s, d = admin('update', webhookUrl='not a url'); ok('a junk webhook address is refused', s == 400, d)
s, d = admin('seed', n=50); n1 = len(received()); time.sleep(1)
ok('simulated students never trigger webhooks', len(received()) == n1); admin('clearSim')

print('=== reset everyone keeps the partner setup ===')
s, d = call('POST', '/api/reset', dict(password=P)); ok('reset everyone works with the password', s == 200, d)
ok('after a reset the API key still works', api('GET', '/api/v1/quests', key)[0] == 200)
s, d = api('GET', '/api/v1/students/user-42', key); ok('but the students are gone', s == 404, d)
s, d = admin('get'); ok('and the organization, its quests and webhook are kept', s == 200 and d['org']['customQuests'] and d['org']['webhook']['url'], d)

print('=== simulated cohort ===')
s, d = admin('seed', n=240); ok('a simulated cohort is loaded', s == 200 and d['students'] == 240, d)
s, d = call('GET', '/api/admin/analytics?org=demo'); real = d['totals']['enrolled']; ok('by default the analytics hide simulated students', s == 200 and real < 20 and d['simulated'] == 240, d['totals'])
s, d = call('GET', '/api/admin/analytics?org=demo&sim=1'); ok('with the switch on, they are included', d['totals']['enrolled'] >= 240 + real - 1 and len(d['series']['completions']) == 14, d['totals'])
s, d = api('GET', '/api/v1/stats', key); ok('the partner API never counts simulated students', d['totals']['enrolled'] == real, d['totals'])
s, d = admin('clearSim'); ok('the simulated cohort can be removed', d['removed'] == 240, d)
s, d = call('GET', '/api/admin/analytics?org=demo&sim=1'); ok('and is gone', d['totals']['enrolled'] == real and d['simulated'] == 0, d['totals'])

print(('\nall %d checks passed' % res['pass']) if res['fail'] == 0 else ('\n%d FAILED, %d passed' % (res['fail'], res['pass'])))
sys.exit(1 if res['fail'] else 0)
