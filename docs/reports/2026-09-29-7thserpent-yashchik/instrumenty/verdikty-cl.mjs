// Вердикты check-live на названных образцах (сессия 23, П108) — для доклада: здоровый сайт без Cloudflare, образец
// с Cloudflare (прежний здоровый: Cloudflare проксирует всё), домен не подключён, заглушка хостера на всех адресах.
// Образцы — копия zdorovyy() и sCloudflare() из tools/testy/check-live.test.mjs; сети нет.
//   node verdikty-cl.mjs <папка сайта>
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const sayt = process.argv[2];
const { proverit } = await import(pathToFileURL(join(sayt, 'tools/check-live.mjs')).href);
const struktura = JSON.parse(readFileSync(join(sayt, 'structure/structure.json'), 'utf8'));
const nashRobots = readFileSync(join(sayt, 'public/robots.txt'), 'utf8');
const HOST = 'www.7thserpent.com';
const B = `https://${HOST}`;
const METKA = 'm1';
const otvet = (status, telo = '', zag = {}, location = '') => ({ status, location, telo, zagolovok: (i) => zag[i.toLowerCase()] ?? '' });
const sZag = (o, zag) => ({ ...o, zagolovok: (i) => (i.toLowerCase() in zag ? zag[i.toLowerCase()] : o.zagolovok(i)) });
const title404 = struktura.pages.find((p) => p.url === '/404/').title;
const igra = struktura.pages.find((p) => p.type === 'game').url;
const stranica = (url, title = 'x', telo = '<p>text</p>') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${B}${url}"><link rel="stylesheet" href="/_astro/index.Cz6femgl.css"></head><body><main>${telo}</main></body></html>`;
const CF = { 'cf-ray': '8c1a2b3c4d5e6f70-WAW', server: 'cloudflare' };
const SRV = { server: 'nginx' };
const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal', 'content-type': 'text/html', ...SRV };
const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`;
const STRANICY = struktura.pages.filter((p) => p.url !== '/404/');
const PRIVACY = stranica('/privacy/', 'Privacy policy — 7thserpent.com', '<p>Any question or request about those logs can go to contact@7thserpent.com.</p>');

function zdorovyy() {
  const k = new Map();
  for (const put of ['/', igra]) {
    k.set(`http://${HOST}${put}`, otvet(301, '', SRV, `${B}${put}`));
    k.set(`https://7thserpent.com${put}`, otvet(301, '', SRV, `${B}${put}`));
    k.set(`http://7thserpent.com${put}`, otvet(301, '', SRV, `${B}${put}`));
  }
  for (const p of STRANICY) k.set(`${B}${p.url}`, otvet(200, stranica(p.url, p.title), HTML));
  k.set(`${B}/privacy/`, otvet(200, PRIVACY, HTML));
  k.set(`${B}/robots.txt?live-check=${METKA}`, otvet(200, HOSTER + nashRobots, SRV));
  k.set(`${B}/robots.txt`, otvet(200, HOSTER + nashRobots, SRV));
  k.set(`${B}/sitemap-index.xml`, otvet(200, `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${B}/sitemap-0.xml</loc></sitemap></sitemapindex>`, SRV));
  k.set(`${B}/sitemap-0.xml`, otvet(200, urlset(STRANICY.map((p) => `${B}${p.url}`)), SRV));
  k.set(`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, stranica('/404/', title404), HTML));
  k.set(`${B}/404/`, otvet(200, stranica('/404/', title404), HTML));
  return k;
}
function sCloudflare(k) {
  for (const [u, o] of k) {
    const zag = { ...CF };
    if (/^text\/html/.test(o.zagolovok('content-type')) || u === `${B}/robots.txt?live-check=${METKA}`) zag['cf-cache-status'] = 'DYNAMIC';
    if (u === `${B}/robots.txt`) Object.assign(zag, { 'cf-cache-status': 'HIT', age: '120' });
    k.set(u, sZag(o, zag));
  }
  return k;
}
const sborka = (() => {
  const k = zdorovyy();
  return { stranica: (put) => k.get(`${B}${put}`)?.telo ?? null, puti: [...struktura.pages.map((p) => p.url), '/_astro/index.Cz6femgl.css', '/robots.txt'] };
})();
const ZAGLUSHKA = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Поздравляем, сайт создан!</title></head><body><h1>Поздравляем, сайт создан!</h1></body></html>';
const OBRAZCY = [
  ['здоровый сайт без Cloudflare (П108)', (u) => zdorovyy().get(u)],
  ['образец с Cloudflare (прежний здоровый: Cloudflare проксирует всё)', (u) => sCloudflare(zdorovyy()).get(u)],
  ['домен не подключён (имя не разрешается)', () => otvet('сеть: ENOTFOUND')],
  ['заглушка хостера «Поздравляем, сайт создан!» на всех адресах (домен сейчас, до первой выкладки; заголовки — по замеру)', () => otvet(200, ZAGLUSHKA, { ...SRV, 'content-type': 'text/html', 'x-ray': 'wnp190:0.000/wn190:0.000/wa190:D=723' })],
];
for (const [imya, poluchit] of OBRAZCY) {
  const { proverki } = await proverit({ poluchit: async (u) => poluchit(u) ?? otvet(404, '', SRV), host: HOST, struktura, nashRobots, metka: METKA, sborka });
  const plokho = proverki.filter((c) => !c.ok);
  console.log(`\n${imya}: ok ${proverki.length - plokho.length} из ${proverki.length}`);
  for (const c of plokho.slice(0, 50)) console.log(`  ПЛОХО ${c.imya}: ${c.fakt} — ${c.otkuda}`);
  const c11 = proverki.find((c) => c.imya === 'запросы не идут через Cloudflare');
  if (c11.ok) console.log(`  ok    ${c11.imya}: ${c11.otkuda}`);
}
