// Раунд 3 «судью судят», линза «ложный ok (пропуск)» — общее для воспроизведений против
// sites/7thserpent.com/tools/check-live.mjs на 8308733. Сети нет: poluchit(url) — подставные ответы.
// Образец здорового сайта — как zdorovyy()/sborkaIz() проб (tools/testy/check-live.test.mjs на 8308733).
// Репозиторий только читается; вывод — файлами рядом со скриптами (<имя>.txt).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const REPO = 'D:/SEO/cloud/site-generator';
export const SAYT = join(REPO, 'sites/7thserpent.com');
export const CL = await import(pathToFileURL(join(SAYT, 'tools/check-live.mjs')).href);
export const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
export const nashRobots = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
export const HOST = 'www.7thserpent.com';
export const B = `https://${HOST}`;
export const METKA = 'm1';
export const YASHCHIK = 'box@7thserpent.com';
export const igra = struktura.pages.find((p) => p.type === 'game').url;
export const title404 = struktura.pages.find((p) => p.url === '/404/').title;

export const otvet = (status, telo = '', zag = {}, location = '') => ({ status, location, telo, zagolovok: (i) => zag[i.toLowerCase()] ?? '' });
export const stranica = (url, title = 'x', telo = '<p>text</p>', golova = '') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${B}${url}">${golova}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/_astro/index.Cz6femgl.css"><script type="module">document.querySelector('.hdr__burger')</script></head><body><main>${telo}<img src="/_astro/hero.webp" alt="x" srcset="/_astro/hero.webp 1200w"></main></body></html>`;
export const CF = { 'cf-ray': '8c1a2b3c4d5e6f70-WAW', server: 'cloudflare' };
export const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal', 'cf-cache-status': 'DYNAMIC', 'content-type': 'text/html', ...CF };
export const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`;
export const STRANICY = struktura.pages.filter((p) => p.url !== '/404/');
const KARTA = STRANICY.map((p) => `${B}${p.url}`);
export const PRIVACY = stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Requests about the hosting logs go to ${YASHCHIK}.</p>`);
export const PUTI_SBORKI = [...struktura.pages.map((p) => p.url), '/_astro/index.Cz6femgl.css', '/_astro/hero.webp', '/favicon.svg', '/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml'];
export const MIMO = `${B}/robots.txt?live-check=${METKA}`;
export const BEZ = `${B}/robots.txt`;

/** Образец здорового сайта: адрес → ответ (как zdorovyy() проб). */
export function zdorovyy() {
  const k = new Map();
  for (const put of ['/', igra]) {
    k.set(`http://${HOST}${put}`, otvet(301, '', CF, `${B}${put}`));
    k.set(`https://7thserpent.com${put}`, otvet(301, '', CF, `${B}${put}`));
    k.set(`http://7thserpent.com${put}`, otvet(301, '', CF, `${B}${put}`));
  }
  for (const p of STRANICY) k.set(`${B}${p.url}`, otvet(200, stranica(p.url, p.title), HTML));
  k.set(`${B}/privacy/`, otvet(200, PRIVACY, HTML));
  k.set(MIMO, otvet(200, HOSTER + nashRobots, { 'cf-cache-status': 'DYNAMIC', ...CF }));
  k.set(BEZ, otvet(200, HOSTER + nashRobots, { 'cf-cache-status': 'HIT', age: '120', ...CF }));
  k.set(`${B}/sitemap-index.xml`, otvet(200, `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${B}/sitemap-0.xml</loc></sitemap></sitemapindex>`, CF));
  k.set(`${B}/sitemap-0.xml`, otvet(200, urlset(KARTA), CF));
  k.set(`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, stranica('/404/', title404), HTML));
  k.set(`${B}/404/`, otvet(200, stranica('/404/', title404), HTML));
  return k;
}
/** Сборка из образца: HTML страниц по адресу и пути файлов (как sborkaIz() проб). */
export const sborkaIz = (k) => ({ stranica: (put) => k.get(`${B}${put}`)?.telo ?? null, puti: PUTI_SBORKI });
export const zamenit = (karta, url, f) => karta.set(url, f(karta.get(url)));
export const sZag = (o, zag) => ({ ...o, zagolovok: (i) => (i.toLowerCase() in zag ? zag[i.toLowerCase()] : o.zagolovok(i)) });

/**
 * Прогон инструмента: `izmenit(karta)` — порча живых ответов; `vSborke(k)` — правка и сборки, и живого (как в пробах);
 * `poluchitIz(karta)` — своя функция запроса (например, «первый запрос MISS, следующие HIT»).
 */
export async function progon(izmenit = () => {}, { vSborke, poluchitIz } = {}) {
  const chistyy = zdorovyy();
  if (vSborke) vSborke(chistyy);
  const sborka = sborkaIz(chistyy);
  const karta = zdorovyy();
  if (vSborke) vSborke(karta);
  izmenit(karta);
  const poluchit = poluchitIz
    ? poluchitIz(karta)
    : async (url) => {
        if (!karta.has(url)) throw new Error(`запрос вне образца: ${url}`);
        return karta.get(url);
      };
  const r = await CL.proverit({ poluchit, host: HOST, struktura, nashRobots, metka: METKA, sborka });
  const plokho = r.proverki.filter((c) => !c.ok);
  return { ...r, plokho, itog: `${r.proverki.length - plokho.length}/${r.proverki.length}`, najti: (imya) => r.proverki.find((c) => c.imya === imya) };
}

export const stroka = (c) => (c ? `${c.ok ? 'ok' : 'ПЛОХО'} «${c.imya}» — факт ${c.fakt}${c.otkuda ? ` — ${c.otkuda}` : ''}` : '—');

/** Вывод — в консоль и файлом рядом со скриптом. */
export function vyvesti(imya, stroki) {
  const tekst = stroki.join('\n') + '\n';
  writeFileSync(new URL(`./${imya}.txt`, import.meta.url), tekst);
  process.stdout.write(tekst);
}
