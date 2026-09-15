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
 *   1. http → https, www → без www, http://www → https без www — по одному
 *      скачку 301 на канонический адрес;
 *   2. главная — 200, `canonical` совпадает с адресом;
 *   3. robots.txt — 200, строка `Sitemap:` на канонический sitemap-index;
 *   4. sitemap-index.xml и sitemap-0.xml — 200; адресов в карте столько,
 *      сколько страниц в структуре без `/404/`;
 *   5. несуществующий адрес — статус 404 и наша страница («Nie ma takiej
 *      strony»), не заглушка хостера; `/404/` напрямую — 200;
 *   6. `Cache-Control` у HTML несёт `must-revalidate` (Apache видит HTML —
 *      измерение соседа 2026-08-26); `x-ray` печатается справочно.
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

const argHost = process.argv.indexOf('--host');
const canonical = new URL(argHost > 0 ? `https://${process.argv[argHost + 1]}` : structure.site.domain);
const host = canonical.host;
const base = `https://${host}`;

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
await hop(`https://www.${host}/`, `${base}/`, 'www → без www');
await hop(`http://www.${host}/`, `${base}/`, 'http://www → https без www');

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
const expected = structure.pages.filter((p) => p.url !== '/404/').length;
check('sitemap-0.xml: адресов', expected, (map.body.match(/<loc>/g) ?? []).length, 'страницы структуры без /404/');
check('sitemap-0.xml: без /404/', false, map.body.includes(`${base}/404/`), 'исключает интеграция sitemap');

/* 5 — 404 */
const missing = await get(`${base}/nie-ma-takiej-strony-proba-${Date.now()}/`);
check('несуществующий адрес: статус', 404, missing.status, 'ErrorDocument 404 /404/index.html');
check('несуществующий адрес: наша страница', true, missing.body.includes('Nie ma takiej strony'), 'не заглушка хостера');
const direct = await get(`${base}/404/`);
check('/404/ напрямую: статус', 200, direct.status, 'страница структуры, вне sitemap');

/* 6 — одна страница содержания */
const sample = structure.pages.find((p) => p.type === 'game');
if (sample) {
  const r = await get(`${base}${sample.url}`);
  check(`страница ${sample.url}: статус`, 200, r.status);
}

let failed = 0;
for (const c of cases) {
  const hit = c.ждём === c.факт;
  if (!hit) failed += 1;
  console.log(`${hit ? 'ok  ' : 'ŹLE '} ${c.имя.padEnd(40)} ждём ${c.ждём}  факт ${c.факт}${c.откуда ? `  — ${c.откуда}` : ''}`);
}
console.log(`\n${cases.length - failed}/${cases.length} проверок живого сайта ${host}`);
if (failed) process.exit(1);
