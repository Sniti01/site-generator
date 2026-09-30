// Общий стенд скептика «законные формы» (CL25-Z): здоровый подставной образец — по форме копии проб
// (kopiya/sites/7thserpent.com/tools/testy/check-live.test.mjs), инструмент — копия check-live.mjs коммита cbe35eb.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-cl25/zakon';
export const SAYT = `${PAPKA}/kopiya/sites/7thserpent.com`;
export const CL = await import(`file:///${SAYT}/tools/check-live.mjs`);
const { proverit } = CL;

export const struktura = JSON.parse(readFileSync(`${SAYT}/structure/structure.json`, 'utf8'));
export const nashRobots = readFileSync(`${SAYT}/public/robots.txt`, 'utf8');
export const HOST = 'www.7thserpent.com';
export const B = `https://${HOST}`;
export const METKA = 'm1';
export const MIMO = `${B}/robots.txt?live-check=${METKA}`;
export const BEZ = `${B}/robots.txt`;

/** Живой блок хостера сессии 24 — байты из образца obrazec-khostera.json (349 байт, перед прежним файлом). */
const OBRAZEC = JSON.parse(readFileSync(`${SAYT}/tools/testy/obrazec-khostera.json`, 'utf8'));
const teloS24 = OBRAZEC.otvety[`${B}/robots.txt?live-check=${OBRAZEC.metka}`].telo;
const KON = '# END adm.tools Managed content\n\n';
export const BLOK_ZHIVOY = teloS24.slice(0, teloS24.indexOf(KON) + KON.length);
export const PREZHNIY = teloS24.slice(BLOK_ZHIVOY.length);
export const sha = (t) => createHash('sha256').update(Buffer.from(t, 'utf8')).digest('hex');
export const VLADELEC = JSON.parse(readFileSync(`${SAYT}/tools/testy/obrazec-vladelca.json`, 'utf8'));

export const otvet = (status, telo = '', zag = {}, location = '') => ({ status, location, telo, zagolovok: (i) => zag[i.toLowerCase()] ?? '' });
const title404 = struktura.pages.find((p) => p.url === '/404/').title;
const igra = struktura.pages.find((p) => p.type === 'game').url;
const stranica = (url, title = 'x', telo = '<p>text</p>', golova = '') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${B}${url}">${golova}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/_astro/index.Cz6femgl.css"><script type="module">document.querySelector('.hdr__burger')</script></head><body><header class="hdr" data-astro-cid-m3tnyskv></header><main>${telo}<img src="/_astro/hero.webp" alt="x" srcset="/_astro/hero.webp 1200w"></main></body></html>`;
const SRV = { server: 'nginx' };
const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal', 'content-type': 'text/html', ...SRV };
/** Заголовки robots.txt живого образца владельца (nginx, text/plain). */
export const ROBOTS_ZAG = Object.fromEntries(VLADELEC.robotsPary[0].s.zagolovki);
const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`;
const STRANICY = struktura.pages.filter((p) => p.url !== '/404/');
const KARTA = STRANICY.map((p) => `${B}${p.url}`);
const PRIVACY = stranica('/privacy/', 'Privacy policy — 7thserpent.com', '<p>Requests about the hosting logs go to box@7thserpent.com.</p>');
export const PUTI_SBORKI = [...struktura.pages.map((p) => p.url), '/_astro/index.Cz6femgl.css', '/_astro/hero.webp', '/favicon.svg', '/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml'];

/** Здоровый образец без Cloudflare; robots.txt — `robots` (по умолчанию файл владельца, как на живом сервере сейчас). */
export function zdorovyy(robots = nashRobots) {
  const k = new Map();
  for (const put of ['/', igra]) {
    k.set(`http://${HOST}${put}`, otvet(301, '', SRV, `${B}${put}`));
    k.set(`https://7thserpent.com${put}`, otvet(301, '', SRV, `${B}${put}`));
    k.set(`http://7thserpent.com${put}`, otvet(301, '', SRV, `${B}${put}`));
  }
  for (const p of STRANICY) k.set(`${B}${p.url}`, otvet(200, stranica(p.url, p.title), HTML));
  k.set(`${B}/privacy/`, otvet(200, PRIVACY, HTML));
  k.set(MIMO, otvet(200, robots, ROBOTS_ZAG));
  k.set(BEZ, otvet(200, robots, ROBOTS_ZAG));
  k.set(`${B}/sitemap-index.xml`, otvet(200, `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${B}/sitemap-0.xml</loc></sitemap></sitemapindex>`, SRV));
  k.set(`${B}/sitemap-0.xml`, otvet(200, urlset(KARTA), SRV));
  k.set(`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, stranica('/404/', title404), HTML));
  k.set(`${B}/404/`, otvet(200, stranica('/404/', title404), HTML));
  return k;
}

/** Прогон на образце: `mimo`, `bez` — тела robots.txt (bez по умолчанию = mimo); `nash` — наш файл (по умолчанию файл владельца). */
export async function progon({ mimo = nashRobots, bez = mimo, nash = nashRobots, izmenit = () => {} } = {}) {
  const chistyy = zdorovyy();
  const sborka = { stranica: (put) => chistyy.get(`${B}${put}`)?.telo ?? null, puti: PUTI_SBORKI };
  const karta = zdorovyy();
  karta.set(MIMO, otvet(200, mimo, ROBOTS_ZAG));
  karta.set(BEZ, otvet(200, bez, ROBOTS_ZAG));
  izmenit(karta);
  const poluchit = async (url) => {
    if (!karta.has(url)) throw new Error(`запрос вне образца: ${url}`);
    return karta.get(url);
  };
  const r = await proverit({ poluchit, host: HOST, struktura, nashRobots: nash, metka: METKA, sborka });
  const plokho = r.proverki.filter((c) => !c.ok);
  return {
    vsego: r.proverki.length,
    okCount: r.proverki.length - plokho.length,
    plokho: plokho.map((c) => c.imya).sort(),
    stroki: plokho.map((c) => `ПЛОХО ${c.imya}: ${c.fakt} — ${c.otkuda}`),
    spravki: r.spravki,
    proverki: r.proverki,
  };
}

/** Строки отчёта одного варианта. */
export function otchet(imya, r) {
  return [`== ${imya} ==`, `итог ${r.okCount}/${r.vsego}; ПЛОХО: ${r.plokho.length ? r.plokho.join(' | ') : '—'}`, ...r.stroki.map((s) => `  ${s}`), ...r.spravki.filter((s) => s.startsWith('robots.txt')).map((s) => `  справка: ${s}`)];
}

export function zapisat(imya, stroki) {
  writeFileSync(`${PAPKA}/${imya}`, stroki.join('\n') + '\n');
}
