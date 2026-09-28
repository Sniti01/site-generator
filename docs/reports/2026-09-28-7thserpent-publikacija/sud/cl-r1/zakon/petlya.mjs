// Настоящий fetch инструмента (poluchitSetyu) против сервера на 127.0.0.1 — без внешней сети:
// redirect manual, повторы заголовков, регистр имён, gzip и br, BOM, CRLF в заголовках.
import http from 'node:http';
import zlib from 'node:zlib';
import { poluchitSetyu } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/check-live.mjs';

const srv = http.createServer((req, res) => {
  const p = req.url;
  if (p === '/r') {
    res.writeHead(301, { Location: 'https://www.7thserpent.com/', 'Content-Type': 'text/html' });
    return res.end('<p>moved</p>');
  }
  if (p === '/dva-cc') {
    res.setHeader('Cache-Control', ['public, max-age=0', 'must-revalidate']);
    res.setHeader('SET-COOKIE', ['a=1; path=/', 'b=2; path=/']);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end('<p>x</p>');
  }
  if (p === '/gz') {
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Encoding': 'gzip' });
    return res.end(zlib.gzipSync(Buffer.from('\uFEFFSitemap: https://www.7thserpent.com/sitemap-index.xml\r\n', 'utf8')));
  }
  if (p === '/br') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=windows-1251', 'Content-Encoding': 'br' });
    return res.end(zlib.brotliCompressSync(Buffer.from('# robots.txt — www\n', 'utf8')));
  }
  res.writeHead(404);
  res.end();
});
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${srv.address().port}`;
const r = await poluchitSetyu(`${base}/r`);
const d = await poluchitSetyu(`${base}/dva-cc`);
const g = await poluchitSetyu(`${base}/gz`);
const b = await poluchitSetyu(`${base}/br`);
srv.close();
console.log(`301 manual: status=${r.status} location=${r.location}`);
console.log(`два Cache-Control: «${d.zagolovok('cache-control')}» must-revalidate=${/must-revalidate/i.test(d.zagolovok('cache-control'))}; Set-Cookie: «${d.zagolovok('set-cookie')}»`);
console.log(`gzip + BOM + CRLF: ${JSON.stringify(g.telo)}`);
console.log(`br + charset=windows-1251 (тело в UTF-8): ${JSON.stringify(b.telo)}`);
