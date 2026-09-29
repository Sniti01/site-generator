// CL23-Z: robots.txt через настоящий fetch инструмента (poluchitSetyu) с локального сервера 127.0.0.1 — без сети наружу.
// Без параметра — gzip, с параметром — br и BOM, у ответов разный Content-Type (charset). Полученные ответы подставляются
// в здоровый образец проб вместо двух ответов robots.txt, прогон proverit — ждём 44 из 44.
import { createServer } from 'node:http';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-cl23-z';
const { proverit, poluchitSetyu, SAYT } = await import(pathToFileURL(`${PAPKA}/sites/7thserpent.com/tools/check-live.mjs`).href);
const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
const nashRobots = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const telo = Buffer.from(HOSTER + nashRobots, 'utf8');

const server = createServer((zapros, otvet) => {
  if (zapros.url === '/robots.txt') {
    otvet.writeHead(200, { 'content-type': 'text/plain', 'content-encoding': 'gzip', vary: 'Accept-Encoding', server: 'nginx/1.24.0', etag: '"a-1"', 'accept-ranges': 'bytes' });
    otvet.end(gzipSync(telo));
  } else if (zapros.url === '/robots.txt?live-check=m1') {
    otvet.writeHead(200, { 'content-type': 'text/plain; charset=windows-1251', 'content-encoding': 'br', server: 'nginx/1.24.0', 'last-modified': 'Tue, 29 Sep 2026 09:58:00 GMT' });
    otvet.end(brotliCompressSync(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), telo])));
  } else {
    otvet.writeHead(404);
    otvet.end();
  }
});
await new Promise((gotovo) => server.listen(0, '127.0.0.1', gotovo));
const port = server.address().port;
const bez = await poluchitSetyu(`http://127.0.0.1:${port}/robots.txt`);
const mimo = await poluchitSetyu(`http://127.0.0.1:${port}/robots.txt?live-check=m1`);
server.close();

/* ---------- здоровый образец проб (как в obrazcy.mjs), два ответа robots.txt — настоящие ---------- */
const HOST = 'www.7thserpent.com';
const B = `https://${HOST}`;
const otvetO = (status, t = '', zag = {}, location = '') => ({ status, location, telo: t, zagolovok: (i) => zag[i.toLowerCase()] ?? '' });
const title404 = struktura.pages.find((p) => p.url === '/404/').title;
const igra = struktura.pages.find((p) => p.type === 'game').url;
const stranica = (url, title = 'x', t = '<p>text</p>') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${B}${url}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/_astro/index.Cz6femgl.css"><script type="module">document.querySelector('.hdr__burger')</script></head><body><header class="hdr" data-astro-cid-m3tnyskv></header><main>${t}<img src="/_astro/hero.webp" alt="x" srcset="/_astro/hero.webp 1200w"></main></body></html>`;
const SRV = { server: 'nginx' };
const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal', 'content-type': 'text/html', ...SRV };
const STRANICY = struktura.pages.filter((p) => p.url !== '/404/');
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`;
const k = new Map();
for (const put of ['/', igra]) {
  k.set(`http://${HOST}${put}`, otvetO(301, '', SRV, `${B}${put}`));
  k.set(`https://7thserpent.com${put}`, otvetO(301, '', SRV, `${B}${put}`));
  k.set(`http://7thserpent.com${put}`, otvetO(301, '', SRV, `${B}${put}`));
}
for (const p of STRANICY) k.set(`${B}${p.url}`, otvetO(200, stranica(p.url, p.title), HTML));
k.set(`${B}/privacy/`, otvetO(200, stranica('/privacy/', 'Privacy policy — 7thserpent.com', '<p>Requests about the hosting logs go to box@7thserpent.com.</p>'), HTML));
k.set(`${B}/robots.txt?live-check=m1`, mimo);
k.set(`${B}/robots.txt`, bez);
k.set(`${B}/sitemap-index.xml`, otvetO(200, `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${B}/sitemap-0.xml</loc></sitemap></sitemapindex>`, SRV));
k.set(`${B}/sitemap-0.xml`, otvetO(200, urlset(STRANICY.map((p) => `${B}${p.url}`)), SRV));
k.set(`${B}/net-takoy-stranicy-m1/`, otvetO(404, stranica('/404/', title404), HTML));
k.set(`${B}/404/`, otvetO(200, stranica('/404/', title404), HTML));
const sborka = { stranica: (put) => k.get(`${B}${put}`)?.telo ?? null, puti: [...struktura.pages.map((p) => p.url), '/_astro/index.Cz6femgl.css', '/_astro/hero.webp', '/favicon.svg', '/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml'] };
const r = await proverit({ poluchit: async (u) => k.get(u), host: HOST, struktura, nashRobots, metka: 'm1', sborka });
const plokho = r.proverki.filter((c) => !c.ok);

const vyvod = [
  `без параметра (gzip): статус ${bez.status}, знаков ${bez.telo.length}, первый знак U+${bez.telo.charCodeAt(0).toString(16).toUpperCase()}`,
  `с параметром (br, BOM, charset=windows-1251): статус ${mimo.status}, знаков ${mimo.telo.length}, первый знак U+${mimo.telo.charCodeAt(0).toString(16).toUpperCase()}`,
  `прогон: ok ${r.proverki.length - plokho.length}/${r.proverki.length}${plokho.map((c) => `\n  ПЛОХО ${c.imya}: ${c.fakt} — ${c.otkuda}`).join('')}`,
].join('\n');
writeFileSync(`${PAPKA}/zapros-lokalno.txt`, vyvod + '\n');
console.log(vyvod);
