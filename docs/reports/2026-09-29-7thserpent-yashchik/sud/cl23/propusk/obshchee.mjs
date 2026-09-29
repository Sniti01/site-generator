// Общая часть образцов скептика CL23-P. Построение ответов — копия проб check-live.test.mjs коммита 30b3730:
// здоровый образец без Cloudflare (SRV), образец с Cloudflare (sCloudflare), порча, прогон. Инструмент — копия
// sites/7thserpent.com/tools/check-live.mjs этой папки (git show 30b3730:...).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-cl23-p';
const SAYT = join(PAPKA, 'sites/7thserpent.com');
const CL = await import(pathToFileURL(join(SAYT, 'tools/check-live.mjs')).href);
export const { proverit, razobratRobots, sborkaIzDist } = CL;
export const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
export const nashRobots = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
export const HOST = 'www.7thserpent.com';
export const B = `https://${HOST}`;
export const METKA = 'm1';
export const YASHCHIK = 'contact@7thserpent.com';

export const otvet = (status, telo = '', zag = {}, location = '') => ({
  status,
  location,
  telo,
  zagolovok: (i) => zag[i.toLowerCase()] ?? '',
});
export const title404 = struktura.pages.find((p) => p.url === '/404/').title;
export const igra = struktura.pages.find((p) => p.type === 'game').url;
export const stranica = (url, title = 'x', telo = '<p>text</p>', golova = '') =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="canonical" href="${B}${url}">${golova}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/_astro/index.Cz6femgl.css"><script type="module">document.querySelector('.hdr__burger')</script></head><body><header class="hdr" data-astro-cid-m3tnyskv></header><main>${telo}<img src="/_astro/hero.webp" alt="x" srcset="/_astro/hero.webp 1200w"></main></body></html>`;
export const CF = { 'cf-ray': '8c1a2b3c4d5e6f70-WAW', server: 'cloudflare' };
export const SRV = { server: 'nginx' };
export const HTML = { 'cache-control': 'public, max-age=0, must-revalidate', 'x-ray': 'p542:wal', 'content-type': 'text/html', ...SRV };
export const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
export const CLOUDFLARE =
  '# BEGIN Cloudflare Managed content\n# As a condition of accessing this website, you agree to abide by the following content signals:\nUser-agent: *\nContent-Signal: search=yes,ai-train=no\nAllow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n# END Cloudflare Managed Content\n\n';
export const urlset = (urls) => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`;
export const STRANICY = struktura.pages.filter((p) => p.url !== '/404/');
export const KARTA = STRANICY.map((p) => `${B}${p.url}`);
export const PRIVACY = stranica('/privacy/', 'Privacy policy — 7thserpent.com', `<p>Requests about the hosting logs go to ${YASHCHIK}.</p>`);
export const PUTI_SBORKI = [...struktura.pages.map((p) => p.url), '/_astro/index.Cz6femgl.css', '/_astro/hero.webp', '/favicon.svg', '/robots.txt', '/sitemap-index.xml', '/sitemap-0.xml'];

export function zdorovyy() {
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
  k.set(`${B}/sitemap-0.xml`, otvet(200, urlset(KARTA), SRV));
  k.set(`${B}/net-takoy-stranicy-${METKA}/`, otvet(404, stranica('/404/', title404), HTML));
  k.set(`${B}/404/`, otvet(200, stranica('/404/', title404), HTML));
  return k;
}

export const sZag = (o, zag) => ({ ...o, zagolovok: (i) => (i.toLowerCase() in zag ? zag[i.toLowerCase()] : o.zagolovok(i)) });
export const vTelo = (iz, na) => (o) => ({ ...o, telo: o.telo.replace(iz, na) });
export const zamenit = (karta, url, f) => karta.set(url, f(karta.get(url)));
export const MIMO = `${B}/robots.txt?live-check=${METKA}`;
export const BEZ = `${B}/robots.txt`;
export const oba = (f) => (k) => {
  zamenit(k, MIMO, f);
  zamenit(k, BEZ, f);
};

export function sCloudflare(k) {
  for (const [u, o] of k) {
    const zag = { ...CF };
    if (/^text\/html/.test(o.zagolovok('content-type')) || u === MIMO) zag['cf-cache-status'] = 'DYNAMIC';
    if (u === BEZ) Object.assign(zag, { 'cf-cache-status': 'HIT', age: '120' });
    k.set(u, sZag(o, zag));
  }
}

function sborkaIz(k) {
  return { stranica: (put) => k.get(`${B}${put}`)?.telo ?? null, puti: PUTI_SBORKI };
}

export async function progon(izmenit = () => {}, { vse, vSborke, cf } = {}) {
  const chistyy = zdorovyy();
  if (vSborke) vSborke(chistyy);
  const sborka = sborkaIz(chistyy);
  const karta = zdorovyy();
  if (vSborke) vSborke(karta);
  if (cf) sCloudflare(karta);
  izmenit(karta);
  const zaprosy = [];
  const poluchit = async (url) => {
    zaprosy.push(url);
    if (vse) return vse(url);
    if (!karta.has(url)) throw new Error(`запрос вне образца: ${url}`);
    const o = karta.get(url);
    return Array.isArray(o) ? (o.length > 1 ? o.shift() : o[0]) : o;
  };
  const r = await proverit({ poluchit, host: HOST, struktura, nashRobots, metka: METKA, sborka });
  return {
    ...r,
    zaprosy,
    plokho: r.proverki.filter((c) => !c.ok).map((c) => c.imya).sort(),
  };
}

/** Строки отчёта по прогону: итог, ПЛОХО, выбранные строки проверок (имя или шаблон по «имя факт откуда») и справки. */
export function otchet(imya, r, { stroki = [], spravki = null } = {}) {
  const ok = r.proverki.filter((c) => c.ok).length;
  const out = [`== ${imya}`, `итог: ${ok}/${r.proverki.length}`, `ПЛОХО: ${r.plokho.length ? r.plokho.join(' ; ') : '—'}`];
  for (const c of r.proverki) {
    const tekst = `${c.imya} ${c.fakt} ${c.otkuda}`;
    if (stroki.some((s) => (s instanceof RegExp ? s.test(tekst) : c.imya === s))) out.push(`  ${c.ok ? 'ok   ' : 'ПЛОХО'} ${c.imya}: ${c.fakt} — ${c.otkuda}`);
  }
  for (const s of r.spravki) if (spravki && spravki.test(s)) out.push(`  справка: ${s}`);
  return out.join('\n');
}

export const zapisat = (imya, tekst) => writeFileSync(join(PAPKA, imya), tekst + '\n');
