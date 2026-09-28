#!/usr/bin/env node
/**
 * Проверка живого сайта после привязки домена — шаг «проверка https» порядка запуска П52 п. 3
 * (ящик → привязка домена → проверка https → Search Console). Форма — `tools/check-live.mjs` первого
 * сайта (П54 п. 7, П55) с бэклогом 46 п. 1 и П106.
 *
 *   npm run live:check                          — домен из structure.json (site.domain)
 *   npm run live:check -- --host example.test   — другой хост (например, до переключения DNS)
 *
 * Что проверяет — только то, что обещают `public/.htaccess`, `public/robots.txt` и сборка; ничего
 * не чинит и ничего не отправляет, кроме запросов GET:
 *   1. http → https, второй хост → канонический (у канонического с `www` — голый, П62 п. 4),
 *      http://второй → https канонический — по одному скачку 301 (Always Use HTTPS на Cloudflare
 *      дал бы второй скачок);
 *   2. главная — 200, `canonical` один и равен адресу, `Cache-Control` HTML несёт `must-revalidate`;
 *      `x-ray` хостера — справочно;
 *   3. robots.txt — в обход кэша Cloudflare (свой параметр запроса, бэклог 46 п. 1): 200; наш файл
 *      (`public/robots.txt`) целиком, отдельными строками; вне него — только управляемые блоки
 *      «# BEGIN <имя> Managed content … # END <имя> Managed content»: блок хостера (`adm.tools`) —
 *      справка (он не наш и не отключается; измерено на первом сайте), если не закрывает поисковик
 *      (`*`, Googlebot, Bingbot); блок Cloudflare — отказ (управляемый robots.txt зоны снимает владелец,
 *      П106); другой текст — отказ; строка `Sitemap:` на канонический sitemap-index. `Cf-Cache-Status`
 *      — в выводе. Ответ из кэша (без параметра) сверяется с ответом мимо кэша: расхождение — справка
 *      «кэш», не отказ (его видят роботы; истечёт или очищается в Cloudflare);
 *   4. sitemap-index.xml ведёт ровно на sitemap-0.xml; в sitemap-0.xml адреса = страницы структуры
 *      без `/404/` (набором, не счётом);
 *   5. несуществующий адрес — статус 404 и наша страница (её `<title>` из структуры), не заглушка
 *      хостера; `/404/` напрямую — 200;
 *   6. страница игры — 200;
 *   7. `/privacy/` — 200, без обфускации почты Cloudflare (`__cf_email__`, `email-decode`, П77 п. 6);
 *   8. главная и `/privacy/` — без `Set-Cookie`: `/privacy/` обещает, что сайт cookies не ставит (П106).
 * Проверка, которая читает тело, при ответе не 200 — ПЛОХО, а не «в пустом теле ничего нет».
 * Каждая проверка — строка `ok`/`ПЛОХО` с тем, что ждали и что пришло; код 1 при любом ПЛОХО, 2 —
 * ошибка входа. Сеть — `fetch` без редиректов (`redirect: 'manual'`): скачки считаются, а не прячутся;
 * таймаут 15 с на запрос. Пробы — `tools/testy/check-live.test.mjs` на подставных ответах, без сети:
 * `proverit()` принимает функцию запроса аргументом.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

export const SAYT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Один запрос без редиректов: `{ status, location, zagolovok(имя), telo }`; ошибка сети — `status` «сеть: КОД». */
export async function poluchitSetyu(url) {
  try {
    const r = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': 'factory-check-live/2' },
    });
    const telo = await r.text();
    return { status: r.status, location: r.headers.get('location') ?? '', zagolovok: (i) => r.headers.get(i) ?? '', telo };
  } catch (e) {
    return { status: `сеть: ${e.cause?.code ?? e.name}`, location: '', zagolovok: () => '', telo: '' };
  }
}

const norm = (s) => s.replace(/\r\n?/g, '\n');

/** Атрибуты тегов `<imya …>` документа: массив объектов «имя атрибута → значение». */
function tegi(html, imya) {
  const re = new RegExp(`<${imya}\\b([^>]*)>`, 'gi');
  return [...html.matchAll(re)].map((m) => Object.fromEntries([...m[1].matchAll(/([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map((a) => [a[1].toLowerCase(), a[2] ?? a[3] ?? a[4]])));
}
export const canonicalOf = (html) => tegi(html, 'link').filter((a) => (a.rel ?? '').toLowerCase().split(/\s+/).includes('canonical')).map((a) => a.href);

const suschnosti = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘').replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/**
 * robots.txt живого сервера против нашего файла: `{ nashCelikom, bloki, chuzhoyTekst, zakryvayut }`.
 * Наш файл — одним куском, от начала строки до конца строки; остаток — строки вне нашего файла:
 * управляемые блоки по меткам BEGIN/END (имя блока — между «BEGIN» и «Managed content»), всё прочее
 * непустое — чужой текст. Незакрытый блок — чужой текст. `zakryvayut` — группы блоков не нашего файла,
 * которые запрещают что-либо `*`, Googlebot или Bingbot.
 */
export function razobratRobots(telo, nash) {
  const t = norm(telo);
  const n = norm(nash).replace(/\n+$/, '');
  let i = -1;
  for (let j = t.indexOf(n); j >= 0; j = t.indexOf(n, j + 1)) {
    const kon = j + n.length;
    if ((j === 0 || t[j - 1] === '\n') && (kon === t.length || t[kon] === '\n')) {
      i = j;
      break;
    }
  }
  const ostatok = (i >= 0 ? t.slice(0, i) + '\n' + t.slice(i + n.length) : t).split('\n');
  const bloki = [];
  const chuzhoyTekst = [];
  let tekushchiy = null;
  for (const stroka of ostatok) {
    const s = stroka.trim();
    const nachalo = /^#\s*BEGIN\s+(.+?)\s+Managed\s+content\s*$/i.exec(s);
    const konec = /^#\s*END\s+(.+?)\s+Managed\s+content\s*$/i.exec(s);
    if (!tekushchiy && nachalo) {
      tekushchiy = { imya: nachalo[1], stroki: [] };
    } else if (tekushchiy && konec && konec[1].toLowerCase() === tekushchiy.imya.toLowerCase()) {
      bloki.push(tekushchiy);
      tekushchiy = null;
    } else if (tekushchiy) {
      tekushchiy.stroki.push(s);
    } else if (s) {
      chuzhoyTekst.push(s);
    }
  }
  if (tekushchiy) chuzhoyTekst.push(`# BEGIN ${tekushchiy.imya} Managed content (без END)`, ...tekushchiy.stroki.filter(Boolean));
  const vid = (imya) => (/cloudflare/i.test(imya) ? 'cloudflare' : /^adm\.tools$/i.test(imya) ? 'хостер' : 'чужой');
  // Группы правил вне нашего файла: подряд идущие User-agent, затем правила до следующего User-agent.
  const zakryvayut = [];
  for (const b of bloki) {
    let agenty = [];
    let pravilaIdut = false;
    for (const s of b.stroki) {
      const ua = /^user-agent\s*:\s*(.*?)\s*(?:#.*)?$/i.exec(s);
      const zapret = /^disallow\s*:\s*(\S.*?)\s*(?:#.*)?$/i.exec(s);
      if (ua) {
        if (pravilaIdut) agenty = [];
        pravilaIdut = false;
        agenty.push(ua[1].toLowerCase());
      } else if (/^[a-z-]+\s*:/i.test(s)) {
        pravilaIdut = true;
        if (zapret) {
          const poiskoviki = agenty.filter((a) => a === '*' || a.startsWith('googlebot') || a.startsWith('bingbot'));
          if (poiskoviki.length) zakryvayut.push(`${b.imya}: ${poiskoviki.join(', ')} — Disallow: ${zapret[1]}`);
        }
      }
    }
  }
  return { nashCelikom: i >= 0, bloki: bloki.map((b) => ({ imya: b.imya, vid: vid(b.imya), strok: b.stroki.filter(Boolean).length })), chuzhoyTekst, zakryvayut };
}

/**
 * Все проверки живого сайта. `poluchit(url)` — запрос одним скачком (в тестах — подставной);
 * `host` — канонический хост; `struktura` — `structure.json`; `nashRobots` — текст `public/robots.txt`;
 * `metka` — значение параметра обхода кэша. Возвращает `{ proverki: [{ imya, zhdem, fakt, otkuda, ok }], spravki }`.
 */
export async function proverit({ poluchit, host, struktura, nashRobots, metka }) {
  const base = `https://${host}`;
  const drugoy = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
  const proverki = [];
  const spravki = [];
  const check = (imya, zhdem, fakt, otkuda = '') => proverki.push({ imya, zhdem: String(zhdem), fakt: String(fakt), otkuda, ok: String(zhdem) === String(fakt) });
  const telo200 = (r) => (r.status === 200 ? r.telo : null);

  /* 1 — редиректы одним скачком */
  for (const [otkuda, imya] of [
    [`http://${host}/`, 'http → https'],
    [`https://${drugoy}/`, `${drugoy} → ${host}`],
    [`http://${drugoy}/`, `http://${drugoy} → https ${host}`],
  ]) {
    const r = await poluchit(otkuda);
    check(`${imya}: статус`, 301, r.status, otkuda);
    check(`${imya}: Location`, `${base}/`, r.location || '—', 'один скачок на канонический адрес');
  }

  /* 2 — главная */
  const glavnaya = await poluchit(`${base}/`);
  check('главная: статус', 200, glavnaya.status, `${base}/`);
  const kan = telo200(glavnaya) === null ? [] : canonicalOf(glavnaya.telo);
  check('главная: canonical', `${base}/`, kan.length === 1 ? kan[0] : `${kan.length} шт.${kan.length ? ': ' + kan.join(' ') : ''}`, 'Base.astro от Astro.site');
  const cc = glavnaya.zagolovok('cache-control');
  check('главная: Cache-Control у HTML', true, glavnaya.status === 200 && /must-revalidate/i.test(cc), `.htaccess, mod_headers; пришло: «${cc || '—'}»`);
  if (glavnaya.zagolovok('x-ray')) spravki.push(`x-ray ${glavnaya.zagolovok('x-ray')} — сегмент «wa» значит, что HTML обслужил Apache`);

  /* 3 — robots.txt мимо кэша и из кэша */
  const mimo = await poluchit(`${base}/robots.txt?live-check=${metka}`);
  const izKesha = await poluchit(`${base}/robots.txt`);
  spravki.push(`robots.txt мимо кэша: Cf-Cache-Status ${mimo.zagolovok('cf-cache-status') || '—'}; из кэша: Cf-Cache-Status ${izKesha.zagolovok('cf-cache-status') || '—'}, Age ${izKesha.zagolovok('age') || '—'}`);
  check('robots.txt: статус (мимо кэша)', 200, mimo.status, 'параметр запроса мимо кэша Cloudflare');
  const rb = mimo.status === 200 ? razobratRobots(mimo.telo, nashRobots) : null;
  check('robots.txt: наш файл целиком', true, rb ? rb.nashCelikom : `ответ ${mimo.status}`, 'public/robots.txt одним куском, отдельными строками');
  const cf = rb ? rb.bloki.filter((b) => b.vid === 'cloudflare') : [];
  check('robots.txt: блока Cloudflare нет', true, rb ? cf.length === 0 : `ответ ${mimo.status}`, cf.length ? `«${cf.map((b) => b.imya).join('», «')} Managed content» — управляемый robots.txt зоны не снят` : 'управляемый robots.txt Cloudflare снят (П106)');
  const chuzhie = rb ? [...rb.chuzhoyTekst, ...rb.bloki.filter((b) => b.vid === 'чужой').map((b) => `блок «${b.imya}»`), ...rb.zakryvayut] : [];
  check('robots.txt: вне нашего файла — только блок хостера', true, rb ? chuzhie.length === 0 : `ответ ${mimo.status}`, chuzhie.length ? `чужое: ${chuzhie.slice(0, 3).join(' | ')}` : 'блок хостера не закрывает поисковики');
  for (const b of rb ? rb.bloki.filter((x) => x.vid === 'хостер') : []) spravki.push(`robots.txt: блок хостера «${b.imya} Managed content» перед нашим файлом, строк ${b.strok} — не наш, не отключается`);
  check('robots.txt: Sitemap', true, mimo.status === 200 && norm(mimo.telo).split('\n').some((s) => s.trim() === `Sitemap: ${base}/sitemap-index.xml`), 'строка на канонический sitemap-index');
  if (izKesha.status !== mimo.status || norm(izKesha.telo) !== norm(mimo.telo)) {
    spravki.push(`robots.txt из кэша (${izKesha.status}) не равен ответу мимо кэша — это кэш Cloudflare, не отказ: роботы видят кэш до его истечения или очистки`);
  }

  /* 4 — карта сайта */
  const indeks = await poluchit(`${base}/sitemap-index.xml`);
  check('sitemap-index.xml: статус', 200, indeks.status);
  const karty = indeks.status === 200 ? [...indeks.telo.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1]) : [];
  check('sitemap-index.xml: ведёт на sitemap-0.xml', `${base}/sitemap-0.xml`, karty.length ? karty.join(' ') : '—');
  const karta = await poluchit(`${base}/sitemap-0.xml`);
  check('sitemap-0.xml: статус', 200, karta.status);
  const zhdem = struktura.pages.filter((p) => p.url !== '/404/').map((p) => `${base}${p.url}`).sort();
  const locs = karta.status === 200 ? [...karta.telo.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1]).sort() : [];
  check('sitemap-0.xml: адресов', zhdem.length, karta.status === 200 ? locs.length : `ответ ${karta.status}`, 'страницы структуры без /404/');
  const lishnie = locs.filter((u) => !zhdem.includes(u));
  const netu = zhdem.filter((u) => !locs.includes(u));
  check('sitemap-0.xml: адреса = структура', true, karta.status === 200 && lishnie.length === 0 && netu.length === 0 && new Set(locs).size === locs.length, `лишние: ${lishnie.slice(0, 3).join(', ') || '—'}; нет: ${netu.slice(0, 3).join(', ') || '—'}`);

  /* 5 — 404 */
  const nichego = await poluchit(`${base}/net-takoy-stranicy-${metka}/`);
  check('несуществующий адрес: статус', 404, nichego.status, 'ErrorDocument 404 /404/index.html');
  const t404 = struktura.pages.find((p) => p.url === '/404/')?.title ?? '—';
  const zagl = /<title>([^<]*)<\/title>/i.exec(nichego.telo)?.[1];
  check('несуществующий адрес: наша страница', t404, zagl === undefined ? '—' : suschnosti(zagl), 'title /404/ из структуры, не заглушка хостера');
  const pryamo = await poluchit(`${base}/404/`);
  check('/404/ напрямую: статус', 200, pryamo.status, 'страница структуры, вне карты');

  /* 6 — страница игры */
  const igra = struktura.pages.find((p) => p.type === 'game');
  if (igra) check(`страница ${igra.url}: статус`, 200, (await poluchit(`${base}${igra.url}`)).status);

  /* 7 — /privacy/ */
  const priv = await poluchit(`${base}/privacy/`);
  check('/privacy/: статус', 200, priv.status);
  const obfuskaciya = priv.status === 200 ? ['__cf_email__', 'email-decode', 'data-cfemail'].filter((m) => priv.telo.includes(m)) : [];
  check('/privacy/: без обфускации почты Cloudflare', true, priv.status === 200 ? obfuskaciya.length === 0 : `ответ ${priv.status}`, obfuskaciya.length ? `найдено: ${obfuskaciya.join(', ')} — Email Address Obfuscation включена (П77 п. 6)` : 'Scrape Shield → Email Address Obfuscation выключена');

  /* 8 — cookies */
  const kuki = [['главная', glavnaya], ['/privacy/', priv]].filter(([, r]) => r.zagolovok('set-cookie')).map(([i, r]) => `${i}: ${r.zagolovok('set-cookie').split('=')[0]}`);
  check('главная и /privacy/: без Set-Cookie', true, glavnaya.status === 200 && priv.status === 200 ? kuki.length === 0 : `ответы ${glavnaya.status} и ${priv.status}`, kuki.length ? `ставят: ${kuki.join('; ')} — /privacy/ обещает, что сайт cookies не ставит` : 'обещание /privacy/');

  return { proverki, spravki };
}

/* Команда — только при прямом запуске: тесты импортируют модуль без сети. */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const argi = process.argv.slice(2);
  const iHost = argi.indexOf('--host');
  const lishnie = argi.filter((a, i) => !(a === '--host' || (iHost >= 0 && i === iHost + 1)));
  if (lishnie.length || (iHost >= 0 && !argi[iHost + 1])) {
    console.error('npm run live:check [-- --host <хост>]');
    process.exit(2);
  }
  const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
  const nashRobots = readFileSync(join(SAYT, 'public/robots.txt'), 'utf8');
  const host = new URL(iHost >= 0 ? `https://${argi[iHost + 1]}` : struktura.site.domain).host;
  const { proverki, spravki } = await proverit({ poluchit: poluchitSetyu, host, struktura, nashRobots, metka: Date.now() });
  for (const c of proverki) console.log(`${c.ok ? 'ok   ' : 'ПЛОХО'} ${c.imya.padEnd(52)} ждём ${c.zhdem}  факт ${c.fakt}${c.otkuda ? `  — ${c.otkuda}` : ''}`);
  for (const s of spravki) console.log(`  справка: ${s}`);
  const plokho = proverki.filter((c) => !c.ok).length;
  console.log(`\n${proverki.length - plokho}/${proverki.length} проверок живого сайта ${host}`);
  process.exit(plokho ? 1 : 0);
}
