import http from 'http';
const got = []; let mode = 'ok';
http.createServer((req, res) => {
  let b = ''; req.on('data', (c) => (b += c));
  req.on('end', () => {
    if (req.url === '/_received') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(got)); return; }
    if (req.url === '/_mode') { mode = b.trim(); res.end('ok'); return; }
    got.push({ url: req.url, headers: req.headers, body: b });
    res.statusCode = mode === 'fail' ? 500 : 200; res.end('ok');
  });
}).listen(4020);
