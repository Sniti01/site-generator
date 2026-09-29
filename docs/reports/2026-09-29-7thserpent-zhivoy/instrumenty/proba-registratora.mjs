// Проба регистратора без сети: локальный сервер отдаёт 301 с телом и 200 с телом и двумя Set-Cookie; запросы — как
// у poluchitSetyu check-live (redirect: 'manual', тело байтами). Тело, прочитанное «инструментом», должно быть целым.
import { createServer } from 'node:http';

const srv = createServer((req, res) => {
  if (req.url === '/r') {
    res.writeHead(301, { location: 'https://example.test/', server: 'nginx' });
    res.end('<html>moved</html>');
  } else {
    res.setHeader('set-cookie', ['a=1; path=/', 'b=2; path=/']);
    res.writeHead(200, { 'content-type': 'text/plain', age: '0' });
    res.end('User-agent: *\r\nAllow: /\r\n'.repeat(3000));
  }
});
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${srv.address().port}`;
for (const put of ['/r', '/robots.txt']) {
  const r = await fetch(`${base}${put}`, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const baity = Buffer.from(await r.arrayBuffer());
  console.log(put, r.status, r.headers.get('location') ?? '', baity.length);
}
srv.close();
