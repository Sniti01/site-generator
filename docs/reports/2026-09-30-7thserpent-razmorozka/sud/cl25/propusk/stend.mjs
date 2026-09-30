// Стенд: здоровый подставной сайт по форме проб check-live.test.mjs (копия коммита cbe35eb) — ответы без Cloudflare,
// страницы = сборка; robots.txt с параметром и без — одно тело (без кэша на пути), его задаёт вызывающий.
import { readFileSync, writeFileSync } from 'node:fs';

export const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-cl25/propusk';
export const KOPIYA = `${PAPKA}/kopiya/sites/7thserpent.com`;
const CL = await import('file:///C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-cl25/propusk/kopiya/sites/7thserpent.com/tools/check-live.mjs');
export const { proverit, razobratRobots, zakrytoPoiskovikam, sborkaIzDist } = CL;
export const struktura = JSON.parse(readFileSync(`${KOPIYA}/structure/structure.json`, 'utf8'));
export const nashRobots = readFileSync(`${KOPIYA}/public/robots.txt`, 'utf8');
export const OBRAZEC24 = JSON.parse(readFileSync(`${KOPIYA}/tools/testy/obrazec-khostera.json`, 'utf8'));

export const HOST = 'www.7thserpent.com';
export const B = `https://${HOST}`;
export const METKA = 'm1';
export const MIMO = `${B}/robots.txt?live-check=${METKA}`;
export const BEZ = `${B}/robots.txt`;
export const VNE = 'robots.txt: вне нашего файла — только блок хостера';
export const POISK = 'robots.txt: поисковики не закрыты';
export const CELIKOM = 'robots.txt: наш файл целиком';

const otvet = (status, telo = '', zag = {}, location = '') => ({ status, location, telo, zagolovok: (i) => zag[i.toLowerCase()] ?? '' });
const title404 = struktura.pages.find((p) => p.url === '/404/').title;
const igra = struktura.pages.find((p) => p.type === 'game').url;
const stranica = (url, title = 'x', telo = '<p>text</p>') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${B}${url}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/_astro/index.Cz6femgl.css"><script type="module">document.querySelector('.hdr__burger')</script></head><body><header class="hdr" data-astro-cid-m3tnyskv></header><main>${telo}<img src="/_astro/hero.webp" alt="x" srcset="/_astro/hero.webp 1200w"></main></body></html>`;
const SRV = { server: 'nginx' };
const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal', 'content-type': 'text/html', ...SRV };
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`;
const STRANICY = struktura.pages.filter((p) => p.url !== '/404/');
const KARTA = STRANICY.map((p) => `${B}${p.url}`);
const PRIVACY = stranica('/privacy/', 'Privacy policy — 7thserpent.com', '<p>Requests about the hosting logs go to box@7thserpent.com.</p>');
export const PUTI_SBORKI = [...struktura.pages.map((p) => p.url), '/_astro/index.Cz6femgl.css', '/_astro/hero.webp', '/favicon.svg', '/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml'];

function zdorovyy(robots) {
  const k = new Map();
  for (const put of ['/', igra]) {
    k.set(`http://${HOST}${put}`, otvet(301, '', SRV, `${B}${put}`));
    k.set(`https://7thserpent.com${put}`, otvet(301, '', SRV, `${B}${put}`));
    k.set(`http://7thserpent.com${put}`, otvet(301, '', SRV, `${B}${put}`));
  }
  for (const p of STRANICY) k.set(`${B}${p.url}`, otvet(200, stranica(p.url, p.title), HTML));
  k.set(`${B}/privacy/`, otvet(200, PRIVACY, HTML));
  k.set(MIMO, otvet(200, robots, { 'content-type': 'text/plain', ...SRV }));
  k.set(BEZ, otvet(200, robots, { 'content-type': 'text/plain', ...SRV }));
  k.set(`${B}/sitemap-index.xml`, otvet(200, `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${B}/sitemap-0.xml</loc></sitemap></sitemapindex>`, SRV));
  k.set(`${B}/sitemap-0.xml`, otvet(200, urlset(KARTA), SRV));
  k.set(`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, stranica('/404/', title404), HTML));
  k.set(`${B}/404/`, otvet(200, stranica('/404/', title404), HTML));
  return k;
}

const CF = { 'cf-ray': '8c1a2b3c4d5e6f70-WAW', server: 'cloudflare' };
/** Прогон check-live на здоровом сайте, где robots.txt (с параметром и без) — `robots`; наш файл — `nash`;
 *  `bez` — другое тело robots.txt без параметра; `cf` — Cloudflare на пути (как sCloudflare проб: без параметра — HIT). */
export async function progon(robots, { nash = nashRobots, bez, cf = false } = {}) {
  const chistyy = zdorovyy(robots);
  const sborka = { stranica: (put) => chistyy.get(`${B}${put}`)?.telo ?? null, puti: PUTI_SBORKI };
  const karta = zdorovyy(robots);
  if (bez !== undefined) karta.set(BEZ, { ...karta.get(BEZ), telo: bez });
  if (cf) {
    for (const [u, o] of karta) {
      const zag = { ...CF };
      if (/^text\/html/.test(o.zagolovok('content-type')) || u === MIMO) zag['cf-cache-status'] = 'DYNAMIC';
      if (u === BEZ) Object.assign(zag, { 'cf-cache-status': 'HIT', age: '120' });
      karta.set(u, { ...o, zagolovok: (i) => (i.toLowerCase() in zag ? zag[i.toLowerCase()] : o.zagolovok(i)) });
    }
  }
  const poluchit = async (url) => {
    if (!karta.has(url)) throw new Error(`запрос вне образца: ${url}`);
    return karta.get(url);
  };
  const r = await proverit({ poluchit, host: HOST, struktura, nashRobots: nash, metka: METKA, sborka });
  const plokho = r.proverki.filter((c) => !c.ok).map((c) => c.imya).sort();
  return {
    ...r,
    plokho,
    itog: `${r.proverki.length - plokho.length} из ${r.proverki.length}`,
    otkuda: r.proverki.filter((c) => !c.ok).map((c) => `${c.imya}: ${c.fakt} — ${c.otkuda}`).join(' | '),
    robotsStroki: r.proverki.filter((c) => c.imya.startsWith('robots.txt')).map((c) => `${c.ok ? 'ok   ' : 'ПЛОХО'} ${c.imya}: ${c.fakt} — ${c.otkuda}`),
  };
}

/** Блок хостера живого образца сессии 24 (349 байт, байт в байт из obrazec-khostera.json). */
export const BLOK24 = (() => {
  const telo = OBRAZEC24.otvety[`${B}/robots.txt?live-check=${OBRAZEC24.metka}`].telo;
  const konec = '# END adm.tools Managed content\n\n';
  return telo.slice(0, telo.indexOf(konec) + konec.length);
})();

export const vyvod = (imya, stroki) => writeFileSync(`${PAPKA}/${imya}`, `${stroki.join('\n')}\n`);
