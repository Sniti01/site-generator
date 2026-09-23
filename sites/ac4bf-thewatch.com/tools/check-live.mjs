#!/usr/bin/env node
/**
 * Проверка живого сайта после привязки домена — шаг «проверка https»
 * порядка запуска П52 п. 3 (ящик → домен → https → Search Console).
 *
 *   node tools/check-live.mjs               — домен из structure.json (site.domain)
 *   node tools/check-live.mjs --host example.test   — другой хост (например, до переключения DNS)
 *
 * Что проверяет — только то, что обещают `public/.htaccess`, `public/robots.txt`
 * и сборка; ничего не чинит и ничего не отправляет:
 *   1. http → https, второй хост → канонический (с `www` ↔ без — по тому,
 *      что стоит в `site.domain`; П55: у нас с `www`), http://второй → https
 *      канонический — по одному скачку 301;
 *   2. главная — 200, `canonical` совпадает с адресом;
 *   3. robots.txt — 200, строка `Sitemap:` на канонический sitemap-index;
 *   4. sitemap-index.xml и sitemap-0.xml — 200; адресов в карте столько,
 *      сколько страниц в структуре без `/404/`;
 *   5. несуществующий адрес — статус 404 и наша страница (её `<title>` из
 *      структуры, с именем сайта; до П76 здесь стояла польская строка
 *      «Nie ma takiej strony»), не заглушка хостера; `/404/` напрямую — 200;
 *   6. `Cache-Control` у HTML несёт `must-revalidate` (Apache видит HTML —
 *      измерение соседа 2026-08-26); `x-ray` печатается справочно;
 *   7. переименованные страницы (П76, перевод на английский): с каждого
 *      `прежний_url` из `structure/pages-s2.json` — 301 одним скачком на новый
 *      канонический адрес со всех четырёх сочетаний схемы и хоста, а сам
 *      новый адрес отвечает 200. Sitemap (п. 4) сверяется набором адресов.
 *
 * Каждая проверка — строка `ok`/`ŹLE` с тем, что ждали и что пришло;
 * `exit 1` при любой `ŹLE`. Сеть — `fetch` без редиректов (`redirect:
 * 'manual'`), чтобы скачки считались, а не прятались; таймаут 15 с на запрос.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const structure = JSON.parse(readFileSync(join(root, 'structure/structure.json'), 'utf8'));
const declared = JSON.parse(readFileSync(join(root, 'structure/pages-s2.json'), 'utf8'));

const argHost = process.argv.indexOf('--host');
const canonical = new URL(argHost > 0 ? `https://${process.argv[argHost + 1]}` : structure.site.domain);
const host = canonical.host;
const base = `https://${host}`;
// Второй хост — тот, с которого сервер обязан вести на канонический:
// у канонического с `www` это голый домен, у голого — `www.` (П55: у нас с www).
const other = host.startsWith('www.') ? host.slice(4) : `www.${host}`;

const cases = [];
const check = (имя, ждём, факт, откуда = '') => cases.push({ имя, ждём: String(ждём), факт: String(факт), откуда });

async function get(url) {
  try {
    const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'factory-check-live/1' } });
    const body = await r.text();
    return { status: r.status, location: r.headers.get('location') ?? '', cache: r.headers.get('cache-control') ?? '', xray: r.headers.get('x-ray') ?? '', body };
  } catch (e) {
    return { status: `сеть: ${e.cause?.code ?? e.name}`, location: '', cache: '', xray: '', body: '' };
  }
}

const hop = async (from, to, имя) => {
  const r = await get(from);
  check(`${имя}: статус`, 301, r.status, from);
  check(`${имя}: Location`, to, r.location, 'один скачок на канонический адрес');
};

/* 1 — редиректы */
await hop(`http://${host}/`, `${base}/`, 'http → https');
await hop(`https://${other}/`, `${base}/`, `${other} → ${host}`);
await hop(`http://${other}/`, `${base}/`, `http://${other} → https ${host}`);

/* 2 — главная */
const home = await get(`${base}/`);
check('главная: статус', 200, home.status, `${base}/`);
check('главная: canonical', `${base}/`, /rel="canonical" href="([^"]*)"/.exec(home.body)?.[1] ?? '—', 'Base.astro от Astro.site');
check('главная: Cache-Control у HTML', true, /must-revalidate/.test(home.cache), `.htaccess, mod_headers; пришло: «${home.cache || '—'}»`);
if (home.xray) console.log(`  справочно: x-ray ${home.xray} — сегмент «wa» значит, что HTML обслужил Apache`);

/* 3 — robots.txt */
const robots = await get(`${base}/robots.txt`);
check('robots.txt: статус', 200, robots.status);
check('robots.txt: Sitemap', true, robots.body.includes(`Sitemap: ${base}/sitemap-index.xml`), 'строка на канонический sitemap-index');

/* 4 — sitemap */
const index = await get(`${base}/sitemap-index.xml`);
check('sitemap-index.xml: статус', 200, index.status);
const map = await get(`${base}/sitemap-0.xml`);
check('sitemap-0.xml: статус', 200, map.status);
const expected = structure.pages.filter((p) => p.url !== '/404/').map((p) => `${base}${p.url}`).sort();
const locs = [...map.body.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]).sort();
check('sitemap-0.xml: адресов', expected.length, locs.length, 'страницы структуры без /404/');
// Набор, а не счёт: старая карта с прежними адресами (П76) дала бы тот же счёт.
check('sitemap-0.xml: адреса = структура', true, expected.join('\n') === locs.join('\n'), `лишние: ${locs.filter((u) => !expected.includes(u)).slice(0, 3).join(', ') || '—'}; нет: ${expected.filter((u) => !locs.includes(u)).slice(0, 3).join(', ') || '—'}`);
check('sitemap-0.xml: без /404/', false, map.body.includes(`${base}/404/`), 'исключает интеграция sitemap');

/* 5 — 404 */
const missing = await get(`${base}/nie-ma-takiej-strony-proba-${Date.now()}/`);
check('несуществующий адрес: статус', 404, missing.status, 'ErrorDocument 404 /404/index.html');
// Маркер — `<title>` страницы 404 из структуры (с именем сайта: «Page not found»
// в h1 бывает и у заглушки хостера); сущности тела раскрываются.
const t404 = structure.pages.find((p) => p.url === '/404/')?.title ?? '—';
const plain = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘').replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const title404 = /<title>([^<]*)<\/title>/i.exec(missing.body)?.[1];
check('несуществующий адрес: наша страница', t404, title404 === undefined ? '—' : plain(title404), 'title /404/ из структуры, не заглушка хостера');
const direct = await get(`${base}/404/`);
check('/404/ напрямую: статус', 200, direct.status, 'страница структуры, вне sitemap');

/* 6 — одна страница содержания */
const sample = structure.pages.find((p) => p.type === 'game');
if (sample) {
  const r = await get(`${base}${sample.url}`);
  check(`страница ${sample.url}: статус`, 200, r.status);
}

/* 7 — прежние адреса переименованных страниц (П76): все четыре сочетания
   схемы и хоста — одним скачком на новый канонический; сам новый адрес — 200. */
for (const p of declared['страницы'].filter((x) => x['прежний_url'])) {
  const was = p['прежний_url'];
  for (const from of [`${base}${was}`, `https://${other}${was}`, `http://${host}${was}`, `http://${other}${was}`]) {
    await hop(from, `${base}${p.url}`, from);
  }
  const target = await get(`${base}${p.url}`);
  check(`${p.url}: статус`, 200, target.status, `цель 301 с ${was}`);
}

let failed = 0;
for (const c of cases) {
  const hit = c.ждём === c.факт;
  if (!hit) failed += 1;
  console.log(`${hit ? 'ok  ' : 'ŹLE '} ${c.имя.padEnd(40)} ждём ${c.ждём}  факт ${c.факт}${c.откуда ? `  — ${c.откуда}` : ''}`);
}
console.log(`\n${cases.length - failed}/${cases.length} проверок живого сайта ${host}`);
if (failed) process.exit(1);
