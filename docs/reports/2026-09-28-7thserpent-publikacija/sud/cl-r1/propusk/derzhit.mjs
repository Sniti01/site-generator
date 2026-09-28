// Где проверка check-live держит класс: порчи, которые ДОЛЖНЫ краснеть, — краснеют ли. Сети нет.
//   node derzhit.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const { proverit } = await import(pathToFileURL(join(SAYT, 'tools/check-live.mjs')).href);
const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
const nashRobots = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
const dist = (p) => readFileSync(join(SAYT, 'dist', p), 'utf8');
const HOST = 'www.7thserpent.com';
const B = `https://${HOST}`;
const otvet = (status, telo = '', zag = {}, location = '') => ({ status, location, telo, zag, zagolovok: (i) => zag[i.toLowerCase()] ?? '' });
const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'cf-cache-status': 'DYNAMIC' };
const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n# END adm.tools Managed content\n\n';
const STRANICY = new Map(struktura.pages.filter((p) => p.url !== '/404/').map((p) => [p.url, p.url === '/' ? 'index.html' : `${p.url.slice(1)}index.html`]));
function zdorovyy(url) {
  const u = new URL(url);
  if (u.protocol === 'http:' || u.host !== HOST) return otvet(301, '', {}, `${B}${u.pathname}${u.search}`);
  if (u.pathname === '/robots.txt') return otvet(200, HOSTER + nashRobots, { 'cf-cache-status': u.search ? 'MISS' : 'HIT' });
  if (u.pathname === '/sitemap-index.xml' || u.pathname === '/sitemap-0.xml') return otvet(200, dist(u.pathname.slice(1)));
  if (u.pathname === '/404/') return otvet(200, dist('404/index.html'), HTML);
  if (STRANICY.has(u.pathname)) return otvet(200, dist(STRANICY.get(u.pathname)), HTML);
  return otvet(404, dist('404/index.html'), HTML);
}
const zam = (put, f) => (url) => (url === put ? f(zdorovyy(url)) : zdorovyy(url));
const karta0 = dist('sitemap-0.xml');
const PORCHI = [
  ['308 вместо 301 (http://www)', zam(`http://${HOST}/`, (o) => ({ ...o, status: 308 }))],
  ['Location относительный «/» с голого https', zam('https://7thserpent.com/', (o) => ({ ...o, location: '/' }))],
  ['два скачка: http://голый → http://www', zam('http://7thserpent.com/', (o) => ({ ...o, location: `http://${HOST}/` }))],
  ['Location с портом', zam('https://7thserpent.com/', (o) => ({ ...o, location: `${B}:443/` }))],
  ['http://www отвечает 200 без редиректа', zam(`http://${HOST}/`, () => otvet(200, dist('index.html'), HTML))],
  ['главная — сборка первого сайта (canonical чужой)', zam(`${B}/`, (o) => ({ ...o, telo: o.telo.replace(`href="${B}/"`, 'href="https://www.ac4bf-thewatch.com/"') }))],
  ['главная без canonical', zam(`${B}/`, (o) => ({ ...o, telo: o.telo.replace(/<link[^>]*rel="canonical"[^>]*>/, '') }))],
  ['главная — 301 на /index.html', zam(`${B}/`, () => otvet(301, '', {}, `${B}/index.html`))],
  ['Cache-Control без заголовка', zam(`${B}/`, (o) => ({ ...o, zagolovok: (i) => (i === 'cache-control' ? '' : o.zagolovok(i)) }))],
  ['мягкая 404: 302 на /404/', zam(`${B}/net-takoy-stranicy-m1/`, () => otvet(302, '', {}, `${B}/404/`))],
  ['мягкая 404: 200 с главной', zam(`${B}/net-takoy-stranicy-m1/`, () => otvet(200, dist('index.html'), HTML))],
  ['404 с title «Page not found» без имени сайта', zam(`${B}/net-takoy-stranicy-m1/`, () => otvet(404, '<html><head><title>Page not found</title></head></html>'))],
  ['индекс карты ведёт на две карты', zam(`${B}/sitemap-index.xml`, (o) => ({ ...o, telo: o.telo.replace('</sitemapindex>', `<sitemap><loc>${B}/sitemap-1.xml</loc></sitemap></sitemapindex>`) }))],
  ['карта на голом хосте', zam(`${B}/sitemap-0.xml`, () => otvet(200, karta0.replaceAll(B, 'https://7thserpent.com')))],
  ['карта с http://', zam(`${B}/sitemap-0.xml`, () => otvet(200, karta0.replaceAll(B, `http://${HOST}`)))],
  ['robots.txt: наш файл без строки Sitemap', (url) => (new URL(url).pathname === '/robots.txt' ? otvet(200, HOSTER + nashRobots.replace(/^Sitemap:.*$/m, ''), { 'cf-cache-status': 'MISS' }) : zdorovyy(url))],
  ['robots.txt: блок Cloudflare без меток (голый текст Content-Signal)', (url) => (new URL(url).pathname === '/robots.txt' ? otvet(200, 'User-agent: *\nContent-Signal: search=yes,ai-train=no\nAllow: /\n\n' + HOSTER + nashRobots, { 'cf-cache-status': 'MISS' }) : zdorovyy(url))],
  ['robots.txt: блок хостера закрывает Bingbot', (url) => (new URL(url).pathname === '/robots.txt' ? otvet(200, HOSTER.replace('User-agent: AhrefsBot', 'User-agent: AhrefsBot\nUser-agent: bingbot') + nashRobots, { 'cf-cache-status': 'MISS' }) : zdorovyy(url))],
  ['robots.txt: блок хостера «User-agent: *» + «Disallow: /wp-admin/»', (url) => (new URL(url).pathname === '/robots.txt' ? otvet(200, HOSTER.replace('User-agent: AhrefsBot\nDisallow: /', 'User-agent: *\nDisallow: /wp-admin/') + nashRobots, { 'cf-cache-status': 'MISS' }) : zdorovyy(url))],
  ['/privacy/: только скрипт email-decode (адрес в mailto)', zam(`${B}/privacy/`, (o) => ({ ...o, telo: o.telo.replace('</body>', '<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script></body>') }))],
  ['Set-Cookie на /privacy/ (cf_clearance)', zam(`${B}/privacy/`, (o) => ({ ...o, zagolovok: (i) => (i === 'set-cookie' ? 'cf_clearance=x; path=/' : o.zagolovok(i)) }))],
];
const vyvod = [];
const zdorov = await proverit({ poluchit: async (u) => zdorovyy(u), host: HOST, struktura, nashRobots, metka: 'm1' });
vyvod.push(`здоровый: ${zdorov.proverki.filter((c) => c.ok).length}/${zdorov.proverki.length}`);
for (const [imya, server] of PORCHI) {
  const r = await proverit({ poluchit: async (u) => server(u), host: HOST, struktura, nashRobots, metka: 'm1' });
  const plokho = r.proverki.filter((c) => !c.ok).map((c) => c.imya);
  vyvod.push(`${plokho.length ? 'КРАСНЕЕТ' : 'ЛОЖНЫЙ OK'} ${imya}: ${plokho.join(' | ') || '—'}`);
}
console.log(vyvod.join('\n'));
writeFileSync(new URL('./vyvod-derzhit.txt', import.meta.url), vyvod.join('\n') + '\n');
