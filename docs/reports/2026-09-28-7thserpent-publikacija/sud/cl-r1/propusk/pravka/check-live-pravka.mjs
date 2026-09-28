// Набросок правок к sites/7thserpent.com/tools/check-live.mjs (45052d0) — только для проверки предложений
// скептика раунда 1 (линза «ложный ok»); в репозиторий не идёт. Разбор robots.txt и canonical — из инструмента.
import { pathToFileURL } from 'node:url';

const { canonicalOf, razobratRobots } = await import(pathToFileURL('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/check-live.mjs').href);
const norm = (s) => s.replace(/\r\n?/g, '\n');
const suschnosti = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&mdash;/g, '—').replace(/&amp;/g, '&');
const IZ_KESHA = /^(HIT|STALE|UPDATING)$/i;

/** Запреты для `*`, Googlebot, Bingbot по всему файлу — правилами разбора Google (robots.cc): ключ без двоеточия
 *  (ровно два слова), «user agent»/«useragent», опечатки Disallow; группа тянется через Sitemap, комментарии и метки блоков. */
export function zapretyPoiskovikam(txt) {
  const out = [];
  let agenty = [];
  let pravilaIdut = false;
  for (const raw of norm(txt).split('\n')) {
    const s = raw.replace(/#.*$/, '').trim();
    if (!s) continue;
    const c = s.indexOf(':');
    let key, val;
    if (c >= 0) { key = s.slice(0, c).trim(); val = s.slice(c + 1).trim(); }
    else { const ch = s.split(/[ \t]+/); if (ch.length !== 2) continue; [key, val] = ch; }
    const k = key.toLowerCase();
    if (/^user[- ]?agent/.test(k)) {
      if (pravilaIdut) agenty = [];
      pravilaIdut = false;
      agenty.push(val.toLowerCase());
    } else if (/^(allow|disallow|dissallow|dissalow|disalow|diasllow|disallaw)/.test(k)) {
      pravilaIdut = true;
      if (k.startsWith('allow') || !val) continue;
      const p = agenty.filter((a) => a === '*' || a.startsWith('googlebot') || a.startsWith('bingbot'));
      if (p.length) out.push(`${p.join(', ')} — ${key}: ${val}`);
    }
  }
  return out;
}

export async function proverit({ poluchit, host, struktura, nashRobots, metka }) {
  const base = `https://${host}`;
  const drugoy = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
  const proverki = [];
  const spravki = [];
  const check = (imya, zhdem, fakt, otkuda = '') => proverki.push({ imya, zhdem: String(zhdem), fakt: String(fakt), otkuda, ok: String(zhdem) === String(fakt) });
  const telo200 = (r) => (r.status === 200 ? r.telo : null);
  const igra = struktura.pages.find((p) => p.type === 'game');
  const vse = [];
  const zapros = async (url) => { const r = await poluchit(url); vse.push([url, r]); return r; };
  const svoyCanonical = (imya, r, url) => check(`${imya}: canonical`, url, r.status === 200 ? canonicalOf(r.telo).join(' ') || '—' : `ответ ${r.status}`);

  /* 1 — редиректы одним скачком; П-5: и с путём */
  for (const put of ['/', ...(igra ? [igra.url] : [])]) {
    for (const [otkuda, imya] of [[`http://${host}${put}`, 'http → https'], [`https://${drugoy}${put}`, `${drugoy} → ${host}`], [`http://${drugoy}${put}`, `http://${drugoy} → https ${host}`]]) {
      const r = await zapros(otkuda);
      check(`${imya}${put === '/' ? '' : ` ${put}`}: статус`, 301, r.status, otkuda);
      check(`${imya}${put === '/' ? '' : ` ${put}`}: Location`, `${base}${put}`, r.location || '—', 'один скачок на канонический адрес');
    }
  }

  /* 2 — главная */
  const glavnaya = await zapros(`${base}/`);
  check('главная: статус', 200, glavnaya.status, `${base}/`);
  const kan = telo200(glavnaya) === null ? [] : canonicalOf(glavnaya.telo);
  check('главная: canonical', `${base}/`, kan.length === 1 ? kan[0] : `${kan.length} шт.`, 'Base.astro от Astro.site');
  const cc = glavnaya.zagolovok('cache-control');
  // П-3: max-age ровно один и равен 0
  check('главная: Cache-Control у HTML', true, glavnaya.status === 200 && /must-revalidate/i.test(cc) && (cc.toLowerCase().match(/max-age=\d+/g) ?? []).join() === 'max-age=0', `пришло: «${cc || '—'}»`);
  // П-4: HTML не с края Cloudflare
  check('главная: HTML не из кэша Cloudflare', true, !IZ_KESHA.test(glavnaya.zagolovok('cf-cache-status')), `Cf-Cache-Status «${glavnaya.zagolovok('cf-cache-status') || '—'}», Age «${glavnaya.zagolovok('age') || '—'}»`);

  /* 3 — robots.txt */
  const mimo = await zapros(`${base}/robots.txt?live-check=${metka}`);
  const izKesha = await zapros(`${base}/robots.txt`);
  check('robots.txt: статус (мимо кэша)', 200, mimo.status);
  // П-2: «мимо кэша» — на деле
  check('robots.txt: мимо кэша на деле', true, !IZ_KESHA.test(mimo.zagolovok('cf-cache-status')), `Cf-Cache-Status «${mimo.zagolovok('cf-cache-status') || '—'}»`);
  const rb = mimo.status === 200 ? razobratRobots(mimo.telo, nashRobots) : null;
  check('robots.txt: наш файл целиком', true, rb ? rb.nashCelikom : `ответ ${mimo.status}`);
  const cf = rb ? rb.bloki.filter((b) => b.vid === 'cloudflare') : [];
  check('robots.txt: блока Cloudflare нет', true, rb ? cf.length === 0 : `ответ ${mimo.status}`);
  // П-9, П-10: запреты поисковикам — по всему файлу правилами Google, не по блокам по отдельности
  const chuzhie = rb ? [...rb.chuzhoyTekst, ...rb.bloki.filter((b) => b.vid === 'чужой').map((b) => `блок «${b.imya}»`), ...zapretyPoiskovikam(mimo.telo)] : [];
  check('robots.txt: вне нашего файла — только блок хостера', true, rb ? chuzhie.length === 0 : `ответ ${mimo.status}`, chuzhie.slice(0, 3).join(' | '));
  check('robots.txt: Sitemap', true, mimo.status === 200 && norm(mimo.telo).split('\n').some((s) => s.trim() === `Sitemap: ${base}/sitemap-index.xml`));
  // П-1: файл, который берут роботы, — судится; расхождение — «кэш» только при HIT/STALE/UPDATING
  const zapretyRoboty = izKesha.status === 200 ? zapretyPoiskovikam(izKesha.telo) : [`ответ ${izKesha.status}`];
  check('robots.txt без параметра (его берут роботы): 200, поисковики не закрыты', true, zapretyRoboty.length === 0, zapretyRoboty.slice(0, 3).join(' | '));
  const raznitsa = izKesha.status !== mimo.status || norm(izKesha.telo) !== norm(mimo.telo);
  check('robots.txt без параметра: расхождение — только кэш', true, !raznitsa || IZ_KESHA.test(izKesha.zagolovok('cf-cache-status')), `Cf-Cache-Status «${izKesha.zagolovok('cf-cache-status') || '—'}»`);
  if (raznitsa && IZ_KESHA.test(izKesha.zagolovok('cf-cache-status'))) spravki.push('robots.txt из кэша не равен ответу мимо кэша — кэш Cloudflare');

  /* 4 — карта сайта; П-14: каждый адрес карты — 200 и свой canonical */
  const indeks = await zapros(`${base}/sitemap-index.xml`);
  check('sitemap-index.xml: статус', 200, indeks.status);
  const karty = indeks.status === 200 ? [...indeks.telo.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1]) : [];
  check('sitemap-index.xml: ведёт на sitemap-0.xml', `${base}/sitemap-0.xml`, karty.length ? karty.join(' ') : '—');
  const karta = await zapros(`${base}/sitemap-0.xml`);
  check('sitemap-0.xml: статус', 200, karta.status);
  const zhdem = struktura.pages.filter((p) => p.url !== '/404/').map((p) => `${base}${p.url}`).sort();
  const locs = karta.status === 200 ? [...karta.telo.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1]).sort() : [];
  check('sitemap-0.xml: адресов', zhdem.length, karta.status === 200 ? locs.length : `ответ ${karta.status}`);
  check('sitemap-0.xml: адреса = структура', true, karta.status === 200 && locs.join('\n') === zhdem.join('\n'));
  const plokhieAdresa = [];
  for (const u of locs) { const r = await zapros(u); if (r.status !== 200 || canonicalOf(r.telo).join(' ') !== u) plokhieAdresa.push(`${u.slice(base.length)} ${r.status}`); }
  check('адреса карты: 200 и свой canonical', 0, plokhieAdresa.length, plokhieAdresa.slice(0, 3).join(', '));

  /* 5 — 404 */
  const nichego = await zapros(`${base}/net-takoy-stranicy-${metka}/`);
  check('несуществующий адрес: статус', 404, nichego.status);
  const t404 = struktura.pages.find((p) => p.url === '/404/')?.title ?? '—';
  const zagl = /<title>([^<]*)<\/title>/i.exec(nichego.telo)?.[1];
  check('несуществующий адрес: наша страница', t404, zagl === undefined ? '—' : suschnosti(zagl));
  const pryamo = await zapros(`${base}/404/`);
  check('/404/ напрямую: статус', 200, pryamo.status);
  svoyCanonical('/404/ напрямую', pryamo, `${base}/404/`); // П-7

  /* 6 — страница игры; П-7: и её canonical */
  const igraR = igra ? await zapros(`${base}${igra.url}`) : null;
  if (igra) { check(`страница ${igra.url}: статус`, 200, igraR.status); svoyCanonical(`страница ${igra.url}`, igraR, `${base}${igra.url}`); }

  /* 7 — /privacy/; П-7 canonical; П-8 адрес на месте; П-6 правка HTML краем Cloudflare */
  const priv = await zapros(`${base}/privacy/`);
  check('/privacy/: статус', 200, priv.status);
  svoyCanonical('/privacy/', priv, `${base}/privacy/`);
  check('/privacy/: адрес ящика напечатан (mailto:)', true, priv.status === 200 && /href="mailto:[^"@]+@[^"]+"/.test(priv.telo), 'без адреса обфускацию не видно');
  const metki = ['/cdn-cgi/', 'cloudflareinsights', '__cf_email__', 'data-cfemail', 'email-decode'];
  const pravkaKraem = [['главная', glavnaya], ['/privacy/', priv], ...(igraR ? [[igra.url, igraR]] : [])].flatMap(([i, r]) => (r.status === 200 ? metki.filter((m) => r.telo.includes(m)).map((m) => `${i}: ${m}`) : [`${i}: ответ ${r.status}`]));
  check('HTML без вставок Cloudflare (почта, аналитика, JS detections)', 0, pravkaKraem.length, pravkaKraem.slice(0, 3).join(', '));

  /* 8 — cookies (П-12: во всех ответах) и индексация (П-13) */
  const kuki = vse.filter(([, r]) => r.zagolovok('set-cookie')).map(([u, r]) => `${u}: ${r.zagolovok('set-cookie').split('=')[0]}`);
  check('все ответы: без Set-Cookie', 0, kuki.length, kuki.slice(0, 3).join('; '));
  const noindex = vse.filter(([, r]) => /noindex|none/i.test(r.zagolovok('x-robots-tag'))).map(([u]) => u);
  check('все ответы: X-Robots-Tag без noindex', 0, noindex.length, noindex.slice(0, 3).join(', '));

  return { proverki, spravki };
}
