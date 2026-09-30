#!/usr/bin/env node
/**
 * Проверка живого сайта после привязки домена — шаг «проверка https» порядка запуска П52 п. 3
 * (ящик → привязка домена → проверка https → Search Console). Форма — `tools/check-live.mjs` первого
 * сайта (П54 п. 7, П55) с бэклогом 46 п. 1 и П106; «судью судят», раунды 1–3 (находки CL1-*, CL2-*, CL3-* —
 * в пробах; раунд 3 — последний, пределы — тестами todo). Сессия 23 (П108): Cloudflare на сайте нет (DNS и почта —
 * у хостера) — проверка 11 наоборот, подсказки — под сайт без него; «судью судят» этой правки — находки CL23-*.
 * Сессия 25 (П113): `public/robots.txt` — правила владельца (11 роботов закрыты, Googlebot — `Allow: /`; отступление
 * от П106 его словом); логика проверок та же, подсказки и справка блока хостера — под них; «судью судят» — находки CL25-*.
 *
 *   npm run live:check                          — домен из structure.json (site.domain); сборка — dist/ сайта
 *   npm run live:check -- --host example.test   — другой хост (например, до переключения DNS)
 *
 * Что проверяет — только то, что обещают `public/.htaccess`, `public/robots.txt`, сборка и `/privacy/`;
 * ничего не чинит и ничего не отправляет, кроме запросов GET (один запрос на адрес за прогон):
 *   1. http → https, второй хост → канонический (у канонического с `www` — голый, П62 п. 4), http://второй →
 *      https канонический — по одному скачку 301 и с тем же путём, для главной и страницы игры;
 *   2. главная — 200, `canonical` один и равен адресу; `x-ray` хостера — справочно;
 *   3. robots.txt мимо кэша (свой параметр запроса, бэклог 46 п. 1; Cloudflare на сайте нет — П108; кэша хостера на пути
 *      по замерам сессий 24–25 не видно — с параметром и без одно тело): 200; обход кэша на деле сработал
 *      (не HIT/STALE/UPDATING; REVALIDATED —
 *      сверено с сервером); наш файл (`public/robots.txt`) целиком, отдельными строками (иначе — первая
 *      расходящаяся строка); блока Cloudflare нет (Cloudflare на сайте нет, П108: блок значит, что его включили
 *      с управляемым robots.txt); вне нашего файла — только блок хостера «# BEGIN adm.tools Managed content … # END …»
 *      (чужой управляемый блок — отказ, блок Cloudflare — своя проверка; комментарии вне блоков — справка), и ни одно
 *      правило блока в группе для `*`,
 *      Googlebot, Bingbot или msnbot (группы по всему файлу — правило блока без своего User-agent продолжает
 *      предыдущую) не запрещает путь сборки (запрет вне сборки — справка); Googlebot, Googlebot-Image и Bingbot
 *      (следует группе msnbot) по правилам Google (разбор как у robots.cc: ключи по началу слова и с опечатками,
 *      без двоеточия — два слова, `*` с пробелом — общая группа; длиннейшее правило, Allow при равенстве; `*`
 *      и `$`) не закрыты ни от одного пути сборки (без файлов с точкой); строка `Sitemap:` на канонический
 *      sitemap-index;
 *   4. robots.txt без параметра — тот, что берут роботы: 200, блока Cloudflare, вредного чужого текста
 *      и ограничений нет, поисковики не закрыты; равен ответу мимо кэша — или пришёл из кэша Cloudflare (разница
 *      без вреда — прежняя редакция нашего файла, справка «кэш», не отказ; решения ботов копии с нашим файлом
 *      не сверяются — предел CL25-P-6); ответ мимо кэша не пришёл — судится сам;
 *      без кэша Cloudflare любая разница двух ответов — ПЛОХО с первой расходящейся строкой (пределы CL23-Z-1, CL23-Z-2 —
 *      безвредная разница блока хостера и пробелов — тестами todo);
 *   5. sitemap-index.xml ведёт ровно на sitemap-0.xml; в sitemap-0.xml адреса = страницы структуры без
 *      `/404/` (набором, не счётом), и каждый отвечает 200 со своим `canonical` (из `<head>`, не из комментария);
 *   6. несуществующий адрес страницы — 404 и наша страница (её `<title>` из структуры); `/404/` напрямую —
 *      200 и свой `canonical`; страница игры — 200 и свой `canonical`;
 *   7. `/privacy/` — 200, свой `canonical`, без обфускации почты Cloudflare (П77 п. 6), адрес ящика на домене
 *      сайта — в видимом тексте `<body>` (без `<title>`, `<noscript>`, `hidden`; ящик и строка адреса — до
 *      привязки домена, П52 п. 3, П43 п. 4);
 *   8. HTML каждой полученной страницы (ответ 200 и наша 404) равен сборке `dist/` — побайтно или после
 *      нормализации сборки другой машины (значения cid и хеши имён CSS, как у сторожа выкладки: сайт выложен
 *      сборкой раннера) — справкой; Content-Type — text/html, utf-8; вставки Cloudflare, чужие ресурсы и скрипты,
 *      `<base>`, `<meta robots>` — ПЛОХО с первым расхождением и «N из M» (`/privacy/` обещает: два своих скрипта,
 *      запросов наружу нет); причина — переключатель Cloudflare по маркеру вставки, Cloudflare — при его следах
 *      (проверка 11), иначе «вставка на пути или dist/ не из выложенного коммита»;
 *   9. HTML: `Cache-Control` — `must-revalidate`, все `max-age` и `s-maxage` = 0 (разбор директив, кавычки
 *      принимаются), `CDN-Cache-Control` — нет или 0; не из кэша Cloudflare без сверки (HIT/STALE/UPDATING — отказ;
 *      MISS/EXPIRED — один повторный запрос страницы: повтор из кэша — отказ; REVALIDATED — справка); все —
 *      у каждой страницы прогона; кэш не Cloudflare (Age, X-Cache) не виден — предел CL23-P-3, тест todo;
 *  10. страницы — без запрета индексации (`noindex`, `none`, `unavailable_after` в `X-Robots-Tag` и в `<meta>`
 *      robots, googlebot, bingbot; только ответы 200; директива после префикса чужого бота без своего префикса —
 *      строго запрет: fetch склеивает поля заголовка);
 *  11. запросы не идут через Cloudflare (П108): ни у одного ответа прогона нет следа Cloudflare — `cf-ray`,
 *      `server: cloudflare`, `cf-cache-status`, `cf-mitigated` (иначе — адреса со следами); `/privacy/` обещает,
 *      что страница не шлёт запросов никому, кроме сервера сайта;
 *  12. ни один ответ прогона — без `Set-Cookie` (`/privacy/` обещает, что сайт cookies не ставит).
 * Проверка, которая читает тело, при ответе не 200 — ПЛОХО, а не «в пустом теле ничего нет»; причина
 * ответа (вызов Cloudflare, коды 52x, сеть) — в строке. Код 1 при любом ПЛОХО, 2 — ошибка входа. Сеть —
 * `fetch` без редиректов (`redirect: 'manual'`): скачки считаются, а не прячутся; таймаут 15 с на запрос.
 * Сборка — `dist/` сайта (в workflow — только что выложенная); её нет — проверки 3 и 8 судят без неё громко.
 * Пробы — `tools/testy/check-live.test.mjs` на подставных ответах, без сети: `proverit()` принимает функцию
 * запроса и сборку аргументами. Образцы живого сервера в пробах — байтами: сессия 24 — блок хостера «adm.tools» перед
 * прежним файлом (`tools/testy/obrazec-khostera.json`; законная форма, судится своими байтами), сессия 25 — файл
 * владельца без блока (`tools/testy/obrazec-vladelca.json`); подставной блок хостера здорового образца проб — по именам
 * из доклада первой выкладки первого сайта. Пределы: 404 статики (nginx) не проверяется — обещание сайта о 404 —
 * для адресов страниц; процентная запись путей в robots.txt не раскрывается (как у robots.cc). Сессия 23: след
 * Cloudflare в теле без его заголовков (маяк Web Analytics, вставленный руками) ловит проверка 8, не 11; адрес ящика —
 * любой на домене сайта (contact@ не закреплён); прочие CDN (Via, Surrogate-Control) и сторонние запросы из заголовков
 * (Link, NEL, Report-To) не судятся; Cloudflare только в DNS или почте по HTTP не виден. Сессия 25 (тесты todo CL25-*):
 * блок хостера поверх файла владельца меняет решения ботов (закрыл бы GPTBot) — 44 из 44 со справкой (CL25-P-1, вопрос
 * владельцу); блок, который открывает закрытого нашим файлом бота или несёт Sitemap на чужой хост, не судится (P-2);
 * разбор снимает пробелы шире robots.cc — NBSP, BOM внутри файла, \v (P-5); копия из кэша Cloudflare, которая открывает
 * закрытого бота, — «безвредная» (P-6); при блоке хостера указатель расхождения может уйти в блок, а положение блока при
 * файле не целиком — «после» (Z-1); приписка встык после файла без перевода строки клеится к строке Sitemap (Z-2);
 * разница только пробелами — «undefined» в подсказке (Z-5); ключ Sitemap сверяется буквально (Z-6).
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, relative } from 'node:path';

export const SAYT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Один запрос без редиректов: `{ status, location, zagolovok(имя), telo, baity }`; ошибка сети — `status` «сеть: КОД».
 *  Тело — байтами (`baity`) и текстом UTF-8 (`telo`): равенство сборке судится по байтам (CL3-P-4). */
export async function poluchitSetyu(url) {
  try {
    const r = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': 'factory-check-live/2' },
    });
    const baity = Buffer.from(await r.arrayBuffer());
    return { status: r.status, location: r.headers.get('location') ?? '', zagolovok: (i) => r.headers.get(i) ?? '', telo: baity.toString('utf8'), baity };
  } catch (e) {
    return { status: `сеть: ${e.cause?.code ?? e.name}`, location: '', zagolovok: () => '', telo: '' };
  }
}

/** Сборка `dist/`: HTML страницы по адресу (`/x/` → `x/index.html`) и пути файлов как адреса — без файлов и папок
 *  с точкой в начале имени (`.htaccess` сервер роботам не отдаёт, CL3-Z-4). */
export function sborkaIzDist(dist) {
  if (!existsSync(join(dist, 'index.html'))) return null;
  const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));
  const fajly = obhod(dist).map((f) => relative(dist, f).replace(/\\/g, '/')).filter((f) => !f.split('/').some((s) => s.startsWith('.')));
  return {
    stranica: (put) => {
      const f = join(dist, put.replace(/^\/+/, ''), 'index.html');
      return existsSync(f) ? readFileSync(f, 'utf8') : null;
    },
    puti: [...new Set(fajly.flatMap((f) => (f.endsWith('index.html') ? [`/${f.slice(0, -'index.html'.length)}`] : [`/${f}`])))],
  };
}

const norm = (s) => s.replace(/\r\n?/g, '\n').replace(/^﻿/, '');
const IZ_KESHA = /^(HIT|STALE|UPDATING)$/i;
const OSHIBKI_CF = {
  520: 'неизвестная ошибка сервера за Cloudflare',
  521: 'сервер хостера не отвечает Cloudflare',
  522: 'соединение Cloudflare с сервером — таймаут',
  523: 'сервер недоступен для Cloudflare',
  524: 'сервер не ответил Cloudflare вовремя',
  525: 'TLS между Cloudflare и сервером не установлен',
  526: 'Cloudflare не принял сертификат сервера (Full (strict) без сертификата в панели)',
};
const COOKIE_CF = /^(__cf_bm|cf_clearance|_cfuvid|__cflb|__cfruid|__cfseq|__cfwaitingroom|cf_chl_\w+|cf_ob_info|cf_use_ob)$/i;
/** Вставки Cloudflare: маркер → переключатель, который её даёт. */
const VSTAVKI_CF = [
  ['cloudflareinsights', 'Web Analytics (Cloudflare)'],
  ['challenge-platform/scripts/jsd', 'JavaScript detections (Security → Bots)'],
  ['challenge-platform', 'вызов Cloudflare (Bot Fight Mode или WAF)'],
  ['__cf_email__', 'Email Address Obfuscation (Scrape Shield)'],
  ['email-decode', 'Email Address Obfuscation (Scrape Shield)'],
  ['data-cfemail', 'Email Address Obfuscation (Scrape Shield)'],
  ['rocket-loader', 'Rocket Loader'],
  ['/cdn-cgi/zaraz', 'Zaraz'],
  ['/cdn-cgi/', 'вставка Cloudflare (/cdn-cgi/)'],
];

/** Причина ответа, если её видно: сеть, вызов Cloudflare, коды 52x. */
function prichina(r) {
  if (typeof r.status === 'string') return r.status;
  if (r.zagolovok('cf-mitigated')) return `вызов Cloudflare (cf-mitigated: ${r.zagolovok('cf-mitigated')}) — Bot Fight Mode или правило WAF; сайт за ним не проверен`;
  if (OSHIBKI_CF[r.status]) return `${r.status}: ${OSHIBKI_CF[r.status]}`;
  return '';
}
const sPrichinoy = (r, tekst = '') => [tekst, prichina(r)].filter(Boolean).join('; ');

/** Атрибуты тегов `<imya …>` документа: массив объектов «имя атрибута → значение». */
function tegi(html, imya) {
  const re = new RegExp(`<${imya}\\b([^>]*)>`, 'gi');
  return [...html.matchAll(re)].map((m) => Object.fromEntries([...m[1].matchAll(/([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map((a) => [a[1].toLowerCase(), a[2] ?? a[3] ?? a[4]])));
}
const bezKommentariev = (html) => html.replace(/<!--[\s\S]*?(-->|$)/g, '');
/** Голова документа: до `</head>` (нет его — весь документ), без комментариев. */
const golova = (html) => {
  const h = bezKommentariev(html);
  const k = h.search(/<\/head\s*>/i);
  return k < 0 ? h : h.slice(0, k);
};
/** Ссылки canonical из `<head>` (не из комментария и не из `<body>`: Google их там не берёт, CL2-P-8). */
export const canonicalOf = (html) => tegi(golova(html), 'link').filter((a) => (a.rel ?? '').toLowerCase().split(/\s+/).includes('canonical')).map((a) => a.href);

const suschnosti = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘').replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
/** Видимый текст: только `<body>` (после `</head>`, без `<title>`), без комментариев, скриптов, стилей, шаблонов,
 *  `<noscript>` и элементов с `hidden` (CL3-P-6; вложенные одноимённые элементы — предел), теги сняты, сущности раскрыты. */
const vidimyyTekst = (html) => {
  const h = bezKommentariev(html);
  const k = h.search(/<\/head\s*>/i);
  return suschnosti(
    (k < 0 ? h : h.slice(k))
      .replace(/<(script|style|template|noscript|title)\b[\s\S]*?<\/\1\s*>/gi, ' ')
      .replace(/<([a-z][a-z0-9-]*)\b[^>]*\shidden(?=[\s=>/])[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  );
};

/** Директивы заголовка кэша: имя → все значения (токен или строка в кавычках — без кавычек); CL3-P-7. */
function direktivy(znachenie) {
  const out = new Map();
  for (const t of String(znachenie).split(',')) {
    const m = /^\s*([A-Za-z-]+)\s*(?:=\s*(?:"([^"]*)"|([^\s,]*)))?\s*$/.exec(t);
    const [imya, v] = m ? [m[1].toLowerCase(), m[2] ?? m[3] ?? ''] : [`?${t.trim()}`, ''];
    out.set(imya, [...(out.get(imya) ?? []), v]);
  }
  return out;
}

/** HTML после нормализации сборки другой машины (CL3-Z-1, SV1-Z-1): значения `data-astro-cid` — порядковыми метками
 *  внутри страницы, хеш снят в ссылках `/_astro/<имя>.<хеш>.css`. */
function normHtml(t) {
  const cid = new Map();
  return t
    .replace(/data-astro-cid-([a-z0-9]+)/g, (_, v) => {
      if (!cid.has(v)) cid.set(v, cid.size + 1);
      return `data-astro-cid-#${cid.get(v)}`;
    })
    .replace(/(\/_astro\/[^"'\s)<>?#,]+?)\.[A-Za-z0-9_-]{8}\.css/g, '$1.#.css');
}
/** Первое расхождение двух текстов: знак и окрестности. */
function pervoeRaskhozhdenie(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  const kus = (s) => s.slice(Math.max(0, i - 20), i + 40).replace(/\s+/g, ' ');
  return `с знака ${i}: сборка «${kus(a)}», сайт «${kus(b)}»`;
}
/** Первая расходящаяся строка двух ответов robots.txt (после CR и BOM), CL23-Z-3: «№ n: с параметром «…», без «…»». */
function pervayaStroka(a, b) {
  const [x, y] = [norm(a).split('\n'), norm(b).split('\n')];
  const i = x.findIndex((s, k) => s !== y[k]);
  const k = i < 0 ? x.length : i;
  const kus = (s) => (s === undefined ? 'конец файла' : `«${s.slice(0, 60)}»`);
  return `№ ${k + 1}: с параметром ${kus(x[k])}, без ${kus(y[k])}`;
}
/** Поля кэша Cloudflare — только когда заголовок есть (CL23-Z-4): на сайте без Cloudflare их нет. */
const keshCf = (r) => (r.zagolovok('cf-cache-status') ? `Cf-Cache-Status ${r.zagolovok('cf-cache-status')}, Age ${r.zagolovok('age') || '—'}` : '');

/* ---------- robots.txt по правилам Google (robots.cc) ---------- */

const OPECHATKI_DISALLOW = ['disallow', 'dissallow', 'dissalow', 'disalow', 'diasllow', 'disallaw'];
function klyuch(k) {
  const x = k.toLowerCase();
  if (x.startsWith('user-agent') || x.startsWith('useragent') || x.startsWith('user agent')) return 'ua';
  if (OPECHATKI_DISALLOW.some((p) => x.startsWith(p))) return 'disallow';
  if (x.startsWith('allow')) return 'allow';
  return 'drugoe';
}
/** Группы файла как у robots.cc: подряд идущие User-agent, затем правила до следующего User-agent после правила;
 *  комментарии, пустые строки, Sitemap и прочие ключи групп не рвут; правило до первого User-agent не действует.
 *  `otkuda(nomerStroki)` — происхождение строки (наш файл, блок, чужой текст): правило помнит, откуда оно (CL3-P-5). */
function gruppy(telo, otkuda = () => null) {
  const out = [];
  let tek = null;
  let pravilo = false;
  for (const [nomer, s0] of norm(telo).split('\n').entries()) {
    const s = s0.replace(/#.*$/, '').trim();
    if (!s) continue;
    let k;
    let v;
    const d = s.indexOf(':');
    if (d >= 0) [k, v] = [s.slice(0, d).trim(), s.slice(d + 1).trim()];
    else {
      const slova = s.split(/\s+/);
      if (slova.length !== 2) continue;
      [k, v] = slova;
    }
    const vid = klyuch(k);
    if (vid === 'ua') {
      if (!tek || pravilo) {
        tek = { agenty: [], pravila: [] };
        out.push(tek);
        pravilo = false;
      }
      const obshchiy = v.startsWith('*') && (v.length === 1 || /\s/.test(v[1]));
      tek.agenty.push(obshchiy ? '*' : (/^[A-Za-z_-]+/.exec(v)?.[0] ?? '').toLowerCase());
    } else if (vid === 'allow' || vid === 'disallow') {
      pravilo = true;
      if (tek) tek.pravila.push({ allow: vid === 'allow', put: v, otkuda: otkuda(nomer) });
    }
  }
  return out;
}
const sovpadaet = (obrazec, put) => {
  const konec = obrazec.endsWith('$');
  const telo = (konec ? obrazec.slice(0, -1) : obrazec).split('*').map((c) => c.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${telo}${konec ? '$' : ''}`).test(put);
};
/** Цепочка групп бота: своё имя, для googlebot-image — затем googlebot, bingbot следует группе msnbot (CL3-Z-3);
 *  в конце — `*`. */
const TSEPOCHKA = { googlebot: ['googlebot'], 'googlebot-image': ['googlebot-image', 'googlebot'], bingbot: ['bingbot', 'msnbot'] };
function razreshen(gr, bot, put) {
  let svoi = [];
  for (const imya of TSEPOCHKA[bot]) {
    svoi = gr.filter((g) => g.agenty.includes(imya));
    if (svoi.length) break;
  }
  if (!svoi.length) svoi = gr.filter((g) => g.agenty.includes('*'));
  let luchshee = null;
  for (const p of svoi.flatMap((g) => g.pravila)) {
    if (p.put === '' || !sovpadaet(p.put, put)) continue;
    if (!luchshee || p.put.length > luchshee.put.length || (p.put.length === luchshee.put.length && p.allow)) luchshee = p;
  }
  return !luchshee || luchshee.allow;
}
/** Что закрыто поисковикам: «бот путь» для Googlebot, Googlebot-Image и Bingbot по путям `puti`. */
export function zakrytoPoiskovikam(telo, puti) {
  const gr = gruppy(telo);
  return Object.keys(TSEPOCHKA).flatMap((bot) => puti.filter((p) => !razreshen(gr, bot, p)).map((p) => `${bot} ${p}`));
}

/**
 * robots.txt живого сервера против нашего файла: `{ nashCelikom, raskhozhdenie, bloki, chuzhoyTekst, kommentarii,
 * ogranicheniya }`. Наш файл — одним куском, от начала строки до конца строки; иначе `raskhozhdenie` — первая строка
 * нашего файла, которой в ответе нет на своём месте. Остаток — строки вне нашего файла: управляемые блоки по меткам
 * BEGIN/END, комментарии вне блоков (справка) и прочее непустое — чужой текст (строки, которые есть в нашем файле,
 * при повреждённом файле чужими не считаются). Незакрытый блок — чужой текст. `ogranicheniya` — непустые Disallow из
 * строк блоков (кроме Cloudflare — у него своя проверка) в группах для `*`, Googlebot*, Bingbot* или msnbot — группы
 * по всему файлу, как у robots.cc (правило блока без своего User-agent продолжает предыдущую группу, CL3-P-5), — только
 * совпадающие хоть с одним путём `puti` (сборки); запреты вне сборки — `zapretyVneSborki`, справкой (CL3-Z-3).
 */
export function razobratRobots(telo, nash, puti = ['/']) {
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
  const nashiStroki = new Set(n.split('\n').map((s) => s.trim()).filter(Boolean));
  let raskhozhdenie = '';
  if (i < 0) {
    const tt = t.split('\n').map((s) => s.trim());
    const nn = n.split('\n').map((s) => s.trim());
    const start = tt.indexOf(nn[0]);
    const k = start < 0 ? 0 : nn.findIndex((s, x) => tt[start + x] !== s);
    raskhozhdenie = start < 0 ? `нет первой строки «${nn[0]}»` : `«${nn[k]}» (в ответе: «${tt[start + k] ?? '—'}»)`;
  }
  const do_ = i >= 0 ? t.slice(0, i).split('\n') : [];
  const posle = (i >= 0 ? t.slice(i + n.length) : t).split('\n');
  const bloki = [];
  const chuzhoyTekst = [];
  const kommentarii = [];
  for (const [polozhenie, stroki] of [['перед нашим файлом', do_], ['после нашего файла', posle]]) {
    let tek = null;
    for (const stroka of stroki) {
      const s = stroka.trim();
      const nachalo = /^#\s*BEGIN\s+(.+?)\s+Managed\s+content\s*$/i.exec(s);
      const konec = /^#\s*END\s+(.+?)\s+Managed\s+content\s*$/i.exec(s);
      if (!tek && nachalo) tek = { imya: nachalo[1], stroki: [], polozhenie };
      else if (tek && konec && konec[1].toLowerCase() === tek.imya.toLowerCase()) {
        bloki.push(tek);
        tek = null;
      } else if (tek) tek.stroki.push(s);
      else if (!s || (i < 0 && nashiStroki.has(s))) continue;
      else if (s.startsWith('#')) kommentarii.push(s);
      else chuzhoyTekst.push(s);
    }
    if (tek) chuzhoyTekst.push(`# BEGIN ${tek.imya} Managed content (без END)`, ...tek.stroki.filter(Boolean));
  }
  const vid = (imya) => (/cloudflare/i.test(imya) ? 'cloudflare' : /^adm\.tools$/i.test(imya) ? 'хостер' : 'чужой');
  // Происхождение каждой строки файла: наш файл, блок (имя), прочее.
  const stroki = t.split('\n');
  const nashOt = i >= 0 ? t.slice(0, i).split('\n').length - 1 : -1;
  const nashDo = i >= 0 ? nashOt + n.split('\n').length : -1;
  const proiskhozhdenie = [];
  let blok = null;
  for (const [nomer, s0] of stroki.entries()) {
    const s = s0.trim();
    if (nomer >= nashOt && nomer < nashDo) {
      proiskhozhdenie.push({ vid: 'наш' });
      continue;
    }
    const nachalo = /^#\s*BEGIN\s+(.+?)\s+Managed\s+content\s*$/i.exec(s);
    const konec = /^#\s*END\s+(.+?)\s+Managed\s+content\s*$/i.exec(s);
    if (!blok && nachalo) blok = nachalo[1];
    proiskhozhdenie.push(blok ? { vid: 'блок', imya: blok } : { vid: 'прочее' });
    if (blok && konec && konec[1].toLowerCase() === blok.toLowerCase()) blok = null;
  }
  const ogranicheniya = [];
  const zapretyVneSborki = [];
  for (const g of gruppy(t, (nomer) => proiskhozhdenie[nomer])) {
    const komu = g.agenty.filter((a) => a === '*' || /^(googlebot|bingbot|msnbot)/.test(a));
    if (!komu.length) continue;
    for (const p of g.pravila.filter((x) => !x.allow && x.put !== '' && x.otkuda?.vid === 'блок' && vid(x.otkuda.imya) !== 'cloudflare')) {
      const zapis = `«${p.otkuda.imya}»: ${komu.join(', ')} — Disallow: ${p.put}`;
      (puti.some((put) => sovpadaet(p.put, put)) ? ogranicheniya : zapretyVneSborki).push(zapis);
    }
  }
  return {
    nashCelikom: i >= 0,
    raskhozhdenie,
    bloki: bloki.map((b) => ({ imya: b.imya, vid: vid(b.imya), strok: b.stroki.filter(Boolean).length, polozhenie: b.polozhenie })),
    chuzhoyTekst,
    kommentarii,
    ogranicheniya,
    zapretyVneSborki,
  };
}

/* ---------- запрет индексации ---------- */

const DIREKTIVY_S_ZNACHENIEM = /^(unavailable_after|max-snippet|max-image-preview|max-video-preview)$/i;
/** Запреты индексации в значении `X-Robots-Tag` или `<meta content>`: noindex, none, unavailable_after — для всех
 *  или для googlebot/bingbot (префикс «бот:»); `otKogo` — имя meta (robots/googlebot/bingbot) или '' у заголовка. */
function zapretyIndeksacii(znachenie, otKogo = '') {
  const out = [];
  let bot = otKogo === 'robots' ? '' : otKogo;
  for (const t0 of znachenie.split(',')) {
    let t = t0.trim().toLowerCase();
    let svoy = false;
    const m = /^([a-z0-9_-]+)\s*:\s*(.*)$/.exec(t);
    if (m && !DIREKTIVY_S_ZNACHENIEM.test(m[1])) {
      bot = m[1];
      t = m[2].trim();
      svoy = true;
    }
    const zapret = t === 'noindex' || t === 'none' || t.startsWith('unavailable_after');
    if (!zapret) continue;
    if (!bot || /^(googlebot|bingbot)/.test(bot)) out.push(`${bot ? bot + ': ' : ''}${t}`);
    // Директива без своего префикса после префикса чужого бота: fetch склеивает поля X-Robots-Tag через запятую, и
    // «otherbot: noarchive» + отдельное поле «noindex» не различить — строго, как запрет (CL3-P-3).
    else if (!svoy && !otKogo) out.push(`${t} (после «${bot}:» — поля X-Robots-Tag склеены, не различить)`);
  }
  return out;
}

/* ---------- проверки ---------- */

/**
 * Все проверки живого сайта. `poluchit(url)` — запрос одним скачком (в тестах — подставной; прогон просит каждый
 * адрес один раз); `host` — канонический хост; `struktura` — `structure.json`; `nashRobots` — текст `public/robots.txt`;
 * `metka` — значение параметра обхода кэша; `sborka` — `{ stranica(путь), puti }` (`sborkaIzDist`) или null.
 * Возвращает `{ proverki: [{ imya, zhdem, fakt, otkuda, ok }], spravki }`.
 */
export async function proverit({ poluchit: poluchitOdin, host, struktura, nashRobots, metka, sborka }) {
  const base = `https://${host}`;
  const golyy = host.replace(/^www\./, '');
  const drugoy = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
  const proverki = [];
  const spravki = [];
  const otvety = new Map();
  const poluchit = async (url) => {
    if (!otvety.has(url)) otvety.set(url, await poluchitOdin(url));
    return otvety.get(url);
  };
  const check = (imya, zhdem, fakt, otkuda = '') => proverki.push({ imya, zhdem: String(zhdem), fakt: String(fakt), otkuda, ok: String(zhdem) === String(fakt) });
  const igra = struktura.pages.find((p) => p.type === 'game')?.url ?? '/';
  const iskh = (r) => (r.status === 200 ? '' : `ответ ${r.status}`);

  /* 1 — редиректы одним скачком, с путём */
  for (const put of ['/', igra]) {
    for (const [otkuda, imya] of [
      [`http://${host}${put}`, 'http → https'],
      [`https://${drugoy}${put}`, 'голый → www'],
      [`http://${drugoy}${put}`, 'http голый → https www'],
    ]) {
      const r = await poluchit(otkuda);
      check(`${imya} ${put}: статус`, 301, r.status, sPrichinoy(r, otkuda));
      const zhdem = `${base}${put}`;
      const always = otkuda.startsWith('http://') && r.location === otkuda.replace('http://', 'https://') && r.location !== zhdem;
      check(`${imya} ${put}: Location`, zhdem, r.location || '—', always ? 'второй скачок: http → https того же хоста делает не .htaccess, а сервер перед ним — переадресация на https в панели хостера (или Always Use HTTPS, если включили Cloudflare); выключить' : 'один скачок на канонический адрес с тем же путём');
    }
  }

  /* 2 — главная */
  const glavnaya = await poluchit(`${base}/`);
  check('главная: статус', 200, glavnaya.status, sPrichinoy(glavnaya, `${base}/`));
  const kan = glavnaya.status === 200 ? canonicalOf(glavnaya.telo) : [];
  check('главная: canonical', `${base}/`, kan.length === 1 ? kan[0] : `${kan.length} шт.${kan.length ? ': ' + kan.join(' ') : ''}`, 'Base.astro от Astro.site');
  if (glavnaya.zagolovok('x-ray')) spravki.push(`x-ray ${glavnaya.zagolovok('x-ray')} — сегмент «wa» значит, что HTML обслужил Apache`);

  /* 3 — robots.txt мимо кэша */
  const karta0 = await poluchit(`${base}/sitemap-0.xml`);
  const locs = karta0.status === 200 ? [...karta0.telo.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1]).sort() : [];
  const PUTI = sborka ? sborka.puti : [...new Set(['/', igra, '/privacy/', '/_astro/', ...locs.map((u) => u.replace(base, ''))])];
  const poPutyam = sborka ? `все ${PUTI.length} путей сборки` : `пути карты (сборки нет — ${PUTI.length} путей)`;
  const mimo = await poluchit(`${base}/robots.txt?live-check=${metka}`);
  const cfMimo = mimo.zagolovok('cf-cache-status');
  const izKeshaMimo = IZ_KESHA.test(cfMimo);
  const pochemuMimo = izKeshaMimo ? `ответ из кэша Cloudflare (${cfMimo}, Age ${mimo.zagolovok('age') || '—'}) — обход не удался: строка запроса вне ключа кэша; Purge by URL и повторить` : '';
  check('robots.txt мимо кэша: статус', 200, mimo.status, sPrichinoy(mimo, 'параметр запроса — мимо кэша'));
  check('robots.txt мимо кэша: обход кэша сработал', true, mimo.status === 200 && !izKeshaMimo, mimo.status !== 200 ? sPrichinoy(mimo, `ответ ${mimo.status}`) : cfMimo ? `Cf-Cache-Status ${cfMimo}${pochemuMimo ? ' — ' + pochemuMimo : ''}` : 'заголовка кэша нет — ответ сервера');
  const rb = mimo.status === 200 ? razobratRobots(mimo.telo, nashRobots, PUTI) : null;
  const neChitan = (tekst) => [rb ? tekst : sPrichinoy(mimo, iskh(mimo)), pochemuMimo].filter(Boolean).join('; ');
  check('robots.txt: наш файл целиком', true, rb ? rb.nashCelikom : iskh(mimo), neChitan(rb && !rb.nashCelikom ? `public/robots.txt; первая расходящаяся строка: ${rb.raskhozhdenie}` : 'public/robots.txt одним куском, отдельными строками'));
  const cf = rb ? rb.bloki.filter((b) => b.vid === 'cloudflare') : [];
  check('robots.txt: блока Cloudflare нет', true, rb ? cf.length === 0 : iskh(mimo), neChitan(cf.length ? `«${cf.map((b) => b.imya).join('», «')} Managed content» — robots.txt отдаёт Cloudflare со своим управляемым блоком: его включили, а на сайте его быть не должно (П108)` : 'управляемого блока Cloudflare нет (Cloudflare на сайте быть не должно, П108)'));
  const chuzhie = rb ? [...rb.chuzhoyTekst, ...rb.bloki.filter((b) => b.vid === 'чужой').map((b) => `блок «${b.imya}»`), ...rb.ogranicheniya] : [];
  check('robots.txt: вне нашего файла — только блок хостера', true, rb ? chuzhie.length === 0 : iskh(mimo), neChitan(chuzhie.length ? `чужое или запрет: ${chuzhie.slice(0, 3).join(' | ')} — наш файл — правила владельца (П113): вне него — только блок хостера (adm.tools) без запретов поисковикам` : 'вне нашего файла — блок хостера (adm.tools) без запретов поисковикам и комментарии'));
  const zakryto = mimo.status === 200 ? zakrytoPoiskovikam(mimo.telo, PUTI) : [];
  check('robots.txt: поисковики не закрыты', true, mimo.status === 200 ? zakryto.length === 0 : iskh(mimo), neChitan(zakryto.length ? `закрыто: ${zakryto.slice(0, 4).join(', ')}${zakryto.length > 4 ? ` и ещё ${zakryto.length - 4}` : ''}` : `Googlebot, Googlebot-Image и Bingbot: ${poPutyam} — открыты`));
  check('robots.txt: строка Sitemap', true, mimo.status === 200 && norm(mimo.telo).split('\n').some((s) => s.trim() === `Sitemap: ${base}/sitemap-index.xml`), neChitan('строка на канонический sitemap-index'));
  if (cfMimo) spravki.push(`robots.txt мимо кэша: Cf-Cache-Status ${cfMimo}`);
  for (const b of rb ? rb.bloki.filter((x) => x.vid === 'хостер') : []) spravki.push(`robots.txt: блок хостера «${b.imya} Managed content» ${b.polozhenie}, строк ${b.strok} — не наш: его приписывает хостер при отдаче, отключается в панели хостера (П113)`);
  for (const k of rb ? rb.kommentarii : []) spravki.push(`robots.txt: комментарий вне нашего файла и блоков — «${k}» (правил не несёт)`);
  for (const z of rb ? rb.zapretyVneSborki : []) spravki.push(`robots.txt: блок запрещает путь вне сборки — ${z} (страниц сайта не касается)`);

  /* 4 — robots.txt без параметра: его берут роботы */
  const bez = await poluchit(`${base}/robots.txt`);
  const cfBez = bez.zagolovok('cf-cache-status');
  if (cfBez) spravki.push(`robots.txt без параметра: ${keshCf(bez)}`);
  const ravny = mimo.status === 200 && bez.status === 200 && norm(bez.telo) === norm(mimo.telo);
  let bezFakt = true;
  let bezOtkuda = 'как ответ мимо кэша';
  if (bez.status !== 200) [bezFakt, bezOtkuda] = [false, sPrichinoy(bez, `ответ ${bez.status} — роботы robots.txt не получают`)];
  else if (!ravny) {
    const rbBez = razobratRobots(bez.telo, nashRobots, PUTI);
    // Безвредные строки копии (CL3-Z-5): прежняя редакция нашего файла — User-agent, Allow, пустой Disallow, Sitemap
    // на хост сайта. Есть вредная строка — чужой текст печатается целиком (иначе теряется, кому она адресована).
    const bezvredna = (s) =>
      /^user-?agent\s*:/i.test(s) || /^allow\s*:/i.test(s) || /^disallow\s*:\s*$/i.test(s.replace(/#.*$/, '')) || new RegExp(`^sitemap\\s*:\\s*https?://(www\\.)?${golyy.replace(/\./g, '\\.')}/`, 'i').test(s);
    const vred = [
      ...rbBez.bloki.filter((b) => b.vid === 'cloudflare').map((b) => `блок «${b.imya}»`),
      ...(rbBez.chuzhoyTekst.every(bezvredna) ? [] : rbBez.chuzhoyTekst),
      ...rbBez.bloki.filter((b) => b.vid === 'чужой').map((b) => `блок «${b.imya}»`),
      ...rbBez.ogranicheniya,
      ...zakrytoPoiskovikam(bez.telo, PUTI).map((z) => `закрыто: ${z}`),
    ];
    const keshBez = IZ_KESHA.test(cfBez) || /^REVALIDATED$/i.test(cfBez);
    if (vred.length) [bezFakt, bezOtkuda] = [false, `роботы видят: ${vred.slice(0, 3).join(' | ')}${keshBez ? ` (из кэша Cloudflare, ${cfBez} — Purge by URL)` : ''}`];
    else if (mimo.status === 200 && !keshBez) [bezFakt, bezOtkuda] = [false, `не равен ответу мимо кэша${cfBez ? ` и не из кэша Cloudflare (Cf-Cache-Status ${cfBez})` : ''}; первая расходящаяся строка ${pervayaStroka(mimo.telo, bez.telo)} — другой сервер, кэш или фронт хостера на пути; повторить прогон`];
    else if (mimo.status !== 200) bezOtkuda = `сверить не с чем: мимо кэша — ${sPrichinoy(mimo, `ответ ${mimo.status}`)}; судится сам — вреда нет`;
    else {
      bezOtkuda = 'безвредная копия из кэша';
      spravki.push(`robots.txt без параметра (${cfBez}) не равен ответу мимо кэша — это кэш Cloudflare, не отказ: вреда нет, роботы видят кэш до его истечения или очистки`);
    }
  }
  check('robots.txt без параметра (его берут роботы)', true, bezFakt, bezOtkuda);

  /* 5 — карта сайта */
  const indeks = await poluchit(`${base}/sitemap-index.xml`);
  check('sitemap-index.xml: статус', 200, indeks.status, sPrichinoy(indeks));
  const karty = indeks.status === 200 ? [...indeks.telo.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1]) : [];
  check('sitemap-index.xml: ведёт на sitemap-0.xml', `${base}/sitemap-0.xml`, karty.length ? karty.join(' ') : '—', indeks.zagolovok('cf-cache-status') ? `Cf-Cache-Status ${indeks.zagolovok('cf-cache-status')}` : '');
  const karta = karta0;
  const kartaKesh = keshCf(karta) ? `; ${keshCf(karta)}` : '';
  check('sitemap-0.xml: статус', 200, karta.status, sPrichinoy(karta));
  const zhdem = struktura.pages.filter((p) => p.url !== '/404/').map((p) => `${base}${p.url}`).sort();
  check('sitemap-0.xml: адресов', zhdem.length, karta.status === 200 ? locs.length : `ответ ${karta.status}`, `страницы структуры без /404/${kartaKesh}`);
  const lishnie = locs.filter((u) => !zhdem.includes(u));
  const netu = zhdem.filter((u) => !locs.includes(u));
  check('sitemap-0.xml: адреса = структура', true, karta.status === 200 && lishnie.length === 0 && netu.length === 0 && new Set(locs).size === locs.length, `лишние: ${lishnie.slice(0, 3).join(', ') || '—'}; нет: ${netu.slice(0, 3).join(', ') || '—'}${kartaKesh}`);
  const mertvye = [];
  for (const u of [...new Set(locs)]) {
    const r = await poluchit(u);
    const k = r.status === 200 ? canonicalOf(r.telo) : [];
    if (r.status !== 200 || k.length !== 1 || k[0] !== u) mertvye.push(`${u.slice(base.length)} (${r.status !== 200 ? sPrichinoy(r, `ответ ${r.status}`) : `canonical ${k.join(' ') || '—'}`})`);
  }
  check('sitemap-0.xml: адреса отвечают 200 со своим canonical', true, karta.status === 200 && locs.length > 0 && mertvye.length === 0, mertvye.length ? `${mertvye.length} из ${locs.length}: ${mertvye.slice(0, 3).join(', ')}` : `адресов карты ${locs.length}`);

  /* 6 — 404, /404/, страница игры */
  const nichego = await poluchit(`${base}/net-takoy-stranicy-${metka}/`);
  check('несуществующий адрес: статус', 404, nichego.status, sPrichinoy(nichego, 'ErrorDocument 404 /404/index.html'));
  const t404 = struktura.pages.find((p) => p.url === '/404/')?.title ?? '—';
  const zagl = (t) => {
    const z = /<title>([^<]*)<\/title>/i.exec(golova(t))?.[1];
    return z === undefined ? '—' : suschnosti(z).trim();
  };
  check('несуществующий адрес: наша страница', t404, zagl(nichego.telo), 'title /404/ из структуры, не заглушка хостера');
  const pryamo = await poluchit(`${base}/404/`);
  check('/404/ напрямую: статус', 200, pryamo.status, sPrichinoy(pryamo, 'страница структуры, вне карты'));
  check('/404/ напрямую: canonical', `${base}/404/`, canonicalOf(pryamo.telo).join(' ') || '—', iskh(pryamo) || 'своя страница, не список каталога');
  const rIgra = await poluchit(`${base}${igra}`);
  check(`страница ${igra}: статус`, 200, rIgra.status, sPrichinoy(rIgra));
  check(`страница ${igra}: canonical`, `${base}${igra}`, rIgra.status === 200 ? canonicalOf(rIgra.telo).join(' ') || '—' : `ответ ${rIgra.status}`, 'своя страница, не список каталога');

  /* 7 — /privacy/ */
  const priv = await poluchit(`${base}/privacy/`);
  check('/privacy/: статус', 200, priv.status, sPrichinoy(priv));
  check('/privacy/: canonical', `${base}/privacy/`, priv.status === 200 ? canonicalOf(priv.telo).join(' ') || '—' : `ответ ${priv.status}`);
  const obfuskaciya = priv.status === 200 ? ['__cf_email__', 'email-decode', 'data-cfemail', '/cdn-cgi/l/email-protection'].filter((m) => priv.telo.includes(m)) : [];
  check('/privacy/: без обфускации почты Cloudflare', true, priv.status === 200 ? obfuskaciya.length === 0 : `ответ ${priv.status}`, obfuskaciya.length ? `найдено: ${obfuskaciya.join(', ')} — Scrape Shield → Email Address Obfuscation включена (П77 п. 6)` : 'маркеров обфускации нет');
  const reAdres = new RegExp(`[A-Za-z0-9._%+-]+@${golyy.replace(/\./g, '\\.')}(?![A-Za-z0-9-]|\\.[A-Za-z0-9])`, 'i');
  const adres = priv.status === 200 ? reAdres.exec(vidimyyTekst(priv.telo))?.[0] : undefined;
  check(
    '/privacy/: адрес ящика открытым текстом',
    true,
    Boolean(adres),
    priv.status !== 200
      ? `ответ ${priv.status}`
      : adres
        ? `адрес на странице: ${adres}`
        : obfuskaciya.length
          ? 'адрес скрыт обфускацией Cloudflare — см. строку об обфускации'
          : `адреса ящика @${golyy} в тексте страницы нет — порядок П52 п. 3: ящик и строка адреса (П43 п. 4) до привязки домена`
  );

  /* 8–12 — страницы: равенство сборке, кэш, индексация, Cloudflare, cookies */
  const osnova = glavnaya.status === 200 ? '' : sPrichinoy(glavnaya, `главная — ответ ${glavnaya.status}`);
  const stranicy = [...otvety].filter(([u]) => u.startsWith(`${base}/`) && !/\.(txt|xml)(\?|$)/.test(new URL(u).pathname + new URL(u).search));
  const svoi = stranicy.filter(([, r]) => r.status === 200 || (r.status === 404 && zagl(r.telo) === t404));
  const kratko = (u) => u.slice(base.length) || '/';
  // Cloudflare на сайте нет (П108): след Cloudflare у любого ответа прогона (редиректы обоих хостов, robots.txt, карты,
  // 404) — ПЛОХО проверки 11 с адресом (CL3-P-2 — наоборот); он же — причина вставки в проверке 8 (CL23-P-1).
  const sledCf = (r) => [r.zagolovok('cf-ray') && 'cf-ray', /cloudflare/i.test(r.zagolovok('server')) && 'server: cloudflare', r.zagolovok('cf-cache-status') && 'cf-cache-status', r.zagolovok('cf-mitigated') && 'cf-mitigated'].filter(Boolean);
  const sCf = [...otvety].filter(([, r]) => typeof r.status === 'number' && sledCf(r).length).map(([u, r]) => `${u} (${r.status}; ${sledCf(r).join(', ')})`);

  // HTML = сборка: байты (или текст, если байтов нет); иначе — после нормализации сборки другой машины (CL3-Z-1:
  // сайт выложен сборкой раннера, а сверка идёт с dist этой машины); Content-Type — text/html, charset utf-8 или нет (CL3-P-4).
  const raznye = [];
  let normRavny = 0;
  const neSudimy = stranicy.filter(([, r]) => !svoi.some(([, x]) => x === r)).map(([u, r]) => `${kratko(u)} — ${sPrichinoy(r, `ответ ${r.status}`)}`);
  for (const [u, r] of svoi) {
    const put = r.status === 404 ? '/404/' : new URL(u).pathname;
    const nasha = sborka ? sborka.stranica(put) : null;
    const ct = r.zagolovok('content-type');
    if (!/^text\/html\s*(;\s*charset\s*=\s*"?utf-8"?\s*)?$/i.test(ct.trim())) {
      raznye.push(`${kratko(u)}: Content-Type «${ct || '—'}» — ждём text/html (utf-8): браузер прочтёт или покажет иначе`);
      continue;
    }
    if (nasha !== null && (r.baity ? r.baity.equals(Buffer.from(nasha, 'utf8')) : nasha === r.telo)) continue;
    if (nasha !== null && normHtml(nasha) === normHtml(r.telo)) {
      normRavny += 1;
      continue;
    }
    const vstavka = VSTAVKI_CF.find(([m]) => r.telo.includes(m) && !(nasha ?? '').includes(m));
    raznye.push(`${kratko(u)}: ${nasha === null ? 'в сборке такой страницы нет' : vstavka ? `${vstavka[1]}; ${pervoeRaskhozhdenie(normHtml(nasha), normHtml(r.telo))}` : pervoeRaskhozhdenie(normHtml(nasha), normHtml(r.telo))}`);
  }
  if (normRavny) spravki.push(`HTML: страниц, равных сборке после нормализации cid и имён CSS (сайт выложен сборкой другой машины), — ${normRavny}`);
  check(
    'HTML страниц = сборка (dist)',
    true,
    !osnova && Boolean(sborka) && raznye.length === 0,
    osnova ||
      (!sborka
        ? 'сборки dist/ нет — сверять не с чем; собери сайт из выложенного коммита (main) перед live:check'
        : raznye.length
          ? `${raznye.length} из ${svoi.length} страниц: ${raznye.slice(0, 2).join(' | ')} — вставка на пути${sCf.length ? ' (Cloudflare: его следы — в строке «запросы не идут через Cloudflare»)' : ''} или dist/ собран не из выложенного коммита; /privacy/ обещает: два своих скрипта, запросов наружу нет`
          : `страниц ${svoi.length}${neSudimy.length ? `; не судились (не наши ответы): ${neSudimy.slice(0, 2).join(', ')}` : ''}`)
  );

  const sto = svoi.filter(([, r]) => r.status === 200);
  // Cache-Control и CDN-заголовки — одним разбором директив: все max-age и s-maxage — «0», значение в кавычках
  // принимается, неразобранное — отказ (CL3-P-7).
  const plokhoCC = [];
  for (const [u, r] of sto) {
    const cc = direktivy(r.zagolovok('cache-control'));
    const cdnZ = [r.zagolovok('cdn-cache-control'), r.zagolovok('cloudflare-cdn-cache-control')].filter(Boolean).join(', ');
    const cdn = cdnZ ? direktivy(cdnZ) : new Map();
    const ne0 = (d, imya) => (d.get(imya) ?? []).filter((v) => v !== '0');
    const oshibki = [
      !cc.has('must-revalidate') && 'нет must-revalidate',
      (!cc.has('max-age') || ne0(cc, 'max-age').length) && `max-age: ${(cc.get('max-age') ?? ['—']).join(' ')}`,
      ne0(cc, 's-maxage').length && `s-maxage: ${cc.get('s-maxage').join(' ')}`,
      [...cc.keys()].some((k) => k.startsWith('?')) && 'директива не разобрана',
      cdnZ && (ne0(cdn, 'max-age').length || ne0(cdn, 's-maxage').length || [...cdn.keys()].some((k) => k.startsWith('?'))) && `CDN-Cache-Control: ${cdnZ}`,
    ].filter(Boolean);
    if (oshibki.length) plokhoCC.push(`${kratko(u)}: ${oshibki.join(', ')} (пришло «${r.zagolovok('cache-control') || '—'}»)`);
  }
  check('HTML: Cache-Control (max-age=0, must-revalidate)', true, !osnova && plokhoCC.length === 0, osnova || (plokhoCC.length ? `${plokhoCC.slice(0, 2).join(' | ')} — .htaccess обещает: правка доходит до читателя при следующем заходе` : `страниц ${sto.length}`));
  // Кэш HTML: HIT/STALE/UPDATING — отказ; MISS/EXPIRED — «положено в кэш»: один повторный запрос той же страницы
  // (исключение из «одного запроса на адрес», CL3-P-1) — повтор из кэша без сверки — отказ.
  const keshHtml = [];
  const sverka = [];
  for (const [u, r] of sto) {
    const st = r.zagolovok('cf-cache-status');
    if (IZ_KESHA.test(st)) keshHtml.push(`${kratko(u)} (${st}, Age ${r.zagolovok('age') || '—'})`);
    else if (/^(MISS|EXPIRED)$/i.test(st)) {
      const povtor = await poluchitOdin(u);
      const st2 = povtor.zagolovok('cf-cache-status');
      if (IZ_KESHA.test(st2)) keshHtml.push(`${kratko(u)} (${st} → повтор ${st2}, Age ${povtor.zagolovok('age') || '—'})`);
      else sverka.push(`${kratko(u)} ${st} → повтор ${st2 || '—'}`);
    } else if (/^REVALIDATED$/i.test(st)) sverka.push(`${kratko(u)} ${st}`);
  }
  if (sverka.length) spravki.push(`Cloudflare кладёт HTML в кэш, повтор — не из кэша без сверки: ${sverka.slice(0, 3).join(', ')} — правило кэша зоны проверить`);
  check('HTML не из кэша Cloudflare', true, !osnova && keshHtml.length === 0, osnova || (keshHtml.length ? `${keshHtml.slice(0, 3).join(', ')} — правило кэша Cloudflare (Edge TTL) держит HTML; правка не дойдёт до читателя` : `страниц ${sto.length}`));

  const zaprety = [];
  for (const [u, r] of sto) {
    const iz = [
      ...zapretyIndeksacii(r.zagolovok('x-robots-tag')).map((z) => `X-Robots-Tag ${z}`),
      ...tegi(golova(r.telo), 'meta').filter((a) => /^(robots|googlebot|bingbot)$/i.test(a.name ?? '')).flatMap((a) => zapretyIndeksacii(a.content ?? '', a.name.toLowerCase()).map((z) => `<meta ${a.name}> ${z}`)),
    ];
    if (iz.length) zaprety.push(`${kratko(u)}: ${iz.join(', ')}`);
  }
  check('страницы без запрета индексации', true, !osnova && zaprety.length === 0, osnova || (zaprety.length ? `${zaprety.slice(0, 3).join(' | ')} — robots.txt открывает страницы Google и Bing (П113): запрет индексации их закрыл бы` : `страниц ${sto.length}`));

  // Проверка 11 (П108): следы Cloudflare — выше, у проверки 8; /privacy/ обещает, что страница не шлёт запросов никому,
  // кроме сервера сайта.
  check('запросы не идут через Cloudflare', true, !osnova && sCf.length === 0, osnova || (sCf.length ? `через Cloudflare: ${sCf.slice(0, 3).join(', ')}${sCf.length > 3 ? ` и ещё ${sCf.length - 3}` : ''} — /privacy/ обещает: страница не шлёт запросов никому, кроме сервера сайта; Cloudflare на сайте быть не должно (П108)` : `ответов ${otvety.size}, следов Cloudflare нет`));

  const kuki = [];
  for (const [u, r] of otvety) {
    const sc = r.zagolovok('set-cookie');
    if (!sc) continue;
    const gde = u === `${base}/` ? 'главная' : u.startsWith(`${base}/`) ? kratko(u) : `${u} — ${r.status}`;
    for (const c of sc.split(/,\s*(?=[^;=\s,]+=)/)) {
      const imya = c.split('=')[0].trim();
      kuki.push(`${imya} (${gde}${COOKIE_CF.test(imya) ? ', Cloudflare — защита от ботов или вызов' : ''})`);
    }
  }
  check('ответы без Set-Cookie', true, !osnova && kuki.length === 0, osnova || (kuki.length ? `ставят: ${[...new Set(kuki)].slice(0, 4).join('; ')} — /privacy/ обещает, что сайт cookies не ставит` : `ответов ${otvety.size}`));

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
  const sborka = sborkaIzDist(join(SAYT, 'dist'));
  const { proverki, spravki } = await proverit({ poluchit: poluchitSetyu, host, struktura, nashRobots, metka: Date.now(), sborka });
  for (const c of proverki) console.log(`${c.ok ? 'ok   ' : 'ПЛОХО'} ${c.imya.padEnd(56)} ждём ${c.zhdem}  факт ${c.fakt}${c.otkuda ? `  — ${c.otkuda}` : ''}`);
  for (const s of spravki) console.log(`  справка: ${s}`);
  const plokho = proverki.filter((c) => !c.ok).length;
  console.log(`\n${proverki.length - plokho}/${proverki.length} проверок живого сайта ${host}`);
  process.exit(plokho ? 1 : 0);
}
