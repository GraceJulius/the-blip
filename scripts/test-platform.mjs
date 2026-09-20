import * as p from '../lib/platform.mjs';
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { console.log((c ? '  PASS ' : '  FAIL ') + n + (c ? '' : ' ' + x)); c ? pass++ : fail++; };
const NUL = String.fromCharCode(0);
const SNOW = String.fromCharCode(0x2603);

const k = p.newApiKey();
ok('a key has a recognisable prefix and is long', k.key.startsWith('blip_live_') && k.key.length > 30);
ok('only a hash is derived for storage, not the key itself', k.hash !== k.key && k.hash.length === 64 && p.sha256(k.key) === k.hash);
ok('two keys never collide', p.newApiKey().key !== k.key);
ok('hash comparison accepts the right key and rejects a wrong one', p.safeEqualHex(k.hash, p.sha256(k.key)) && !p.safeEqualHex(k.hash, p.sha256(k.key + 'x')));
ok('hash comparison survives garbage', !p.safeEqualHex('zz', 'zz') && !p.safeEqualHex(undefined, k.hash) && !p.safeEqualHex('', ''));

ok('a simple external id maps readably', p.internalId('acme', 'user-42') === 'acme__user-42');
ok('an id with strange characters is hashed, never used raw', /^acme__[0-9a-f]{16}$/.test(p.internalId('acme', 'a b/../c')));
ok('a long id is hashed to fit', p.internalId('acme', 'x'.repeat(60)).length <= 40);
ok('the same external id always maps to the same internal id', p.internalId('acme', 'a b') === p.internalId('acme', 'a b'));
ok('different orgs never share a student id', p.internalId('acme', 'u1') !== p.internalId('zeta', 'u1'));
ok('the internal id always passes the app id rule', /^[A-Za-z0-9_-]{1,40}$/.test(p.internalId('acme-bank', 'weird id ' + SNOW + ' <script>')));
ok('external id validation', p.validExternalId('abc') && !p.validExternalId('') && !p.validExternalId('x'.repeat(65)) && !p.validExternalId(5) && !p.validExternalId('a' + NUL + 'b'));

const now = Date.now();
const t = p.signToken({ o: 'acme', s: 'acme__u1', e: Math.floor(now / 1000) + 600 }, 'secret-A');
ok('a valid token verifies and returns its contents', p.verifyToken(t, 'secret-A', now)?.s === 'acme__u1');
ok('a token signed with a different secret is rejected', p.verifyToken(t, 'secret-B', now) === null);
ok('an expired token is rejected', p.verifyToken(p.signToken({ o: 'a', s: 'b', e: Math.floor(now / 1000) - 5 }, 'secret-A'), 'secret-A', now) === null);
const sig = t.split('.')[1];
const forged = Buffer.from(JSON.stringify({ o: 'acme', s: 'acme__SOMEONE_ELSE', e: Math.floor(now / 1000) + 600 })).toString('base64url') + '.' + sig;
ok('changing the student inside a token breaks the signature', p.verifyToken(forged, 'secret-A', now) === null);
ok('a token with no expiry is rejected', p.verifyToken(p.signToken({ o: 'a', s: 'b' }, 's'), 's', now) === null);
ok('garbage tokens are rejected without crashing', [null, '', 'abc', 'a.b.c', '.', 'x.y', undefined].every((g) => p.verifyToken(g, 's', now) === null));

const sg = p.signWebhook('shh', '1700000000', '{"a":1}');
ok('webhook signature is stable and depends on time, body and secret', sg === p.signWebhook('shh', '1700000000', '{"a":1}') && sg !== p.signWebhook('shh', '1700000001', '{"a":1}') && sg !== p.signWebhook('shh', '1700000000', '{"a":2}') && sg !== p.signWebhook('nope', '1700000000', '{"a":1}') && sg.startsWith('sha256='));

const safe = (u, o) => p.isSafeWebhookUrl(u, o).ok;
ok('a normal https address is allowed', safe('https://hooks.example.com/blip'));
ok('http is refused by default', !safe('http://hooks.example.com/blip'));
ok('http is allowed only when explicitly enabled', safe('http://hooks.example.com/blip', { allowInsecure: true }));
ok('localhost and private names are refused', ['https://localhost/x', 'https://app.localhost/x', 'https://db.internal/x', 'https://printer.local/x'].every((u) => !safe(u)));
ok('private, loopback and cloud-metadata IPs are refused', ['https://127.0.0.1/x', 'https://10.0.0.5/x', 'https://192.168.1.1/x', 'https://172.16.0.1/x', 'https://172.31.255.255/x', 'https://169.254.169.254/latest/meta-data', 'https://0.0.0.0/x', 'https://100.64.0.1/x'].every((u) => !safe(u)));
ok('a public IP is allowed', safe('https://8.8.8.8/x') && safe('https://172.32.0.1/x'));
ok('IPv6 loopback and private ranges are refused', ['https://[::1]/x', 'https://[fd00::1]/x', 'https://[fe80::1]/x', 'https://[::ffff:127.0.0.1]/x'].every((u) => !safe(u)));
ok('tricky number formats are refused', ['https://2130706433/x', 'https://0x7f000001/x'].every((u) => !safe(u)));
ok('credentials in the address are refused', !safe('https://user:pass@hooks.example.com/x'));
ok('junk and other schemes are refused', ['', 'not a url', 'ftp://a.com/x', 'file:///etc/passwd', 'javascript:alert(1)'].every((u) => !safe(u)));
ok('single-label hostnames are refused', !safe('https://intranet/x'));
ok('private addresses can be allowed only with the explicit test switch', safe('https://127.0.0.1/x', { allowPrivate: true }) && !safe('https://127.0.0.1/x', {}))
ok('the test switch still refuses credentials', !safe('https://user:pw@127.0.0.1/x', { allowPrivate: true }))
ok('slug makes safe identifiers', p.slug('Pay Rent On Time!') === 'pay_rent_on_time' && p.slug('  ') === '');

console.log(fail ? `\n${fail} FAILED, ${pass} passed` : `\nall ${pass} checks passed`); process.exit(fail ? 1 : 0);
