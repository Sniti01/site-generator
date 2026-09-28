#!/usr/bin/env node
/**
 * Проверка живого сайта после привязки домена — шаг «проверка https» порядка запуска П52 п. 3
 * (ящик → привязка домена → проверка https → Search Console). Форма — `tools/check-live.mjs` первого
 * сайта (П54 п. 7, П55) с бэклогом 46 п. 1 и П106; «судью судят», раунд 1 (находки CL1-P, CL1-Z — в пробах).
 *
 *   npm run live:check                          — домен из structure.json (site.domain)
 *   npm run live:check -- --host example.test   — другой хост (например, до переключения DNS)
 *
 * Что проверяет — только то, что обещают `public/.htaccess`, `public/robots.txt`, сборка и `/privacy/`;
 * ничего не чинит и ничего не отправляет, кроме запросов GET (один запрос на адрес за прогон):
 *   1. http → https, второй хост → канонический (у канонического с `www` — голый, П62 п. 4), http://второй →
 *      https канонический — по одному скачку 301 и с тем же путём, для главной и страницы игры
 *      (Always Use HTTPS на Cloudflare дал бы второй скачок — подсказка в строке);
 *   2. главная — 200, `canonical` один и равен адресу, `Cache-Control` HTML — `must-revalidate` и все
 *      `max-age` равны 0, HTML не из кэша Cloudflare (`Cf-Cache-Status` не HIT/STALE/UPDATING/REVALIDATED);
 *      `x-ray` хостера — справочно;
 *   3. robots.txt мимо кэша Cloudflare (свой параметр запроса, бэклог 46 п. 1): 200; обход кэша на деле
 *      сработал; наш файл (`public/robots.txt`) целиком, отдельными строками (иначе — первая расходящаяся
 *      строка); блока Cloudflare нет (управляемый robots.txt зоны снимает владелец, П106); вне нашего файла
 *      — только управляемые блоки «# BEGIN <имя> Managed content … # END …» (комментарии вне блоков —
 *      справка: правил они не несут); Googlebot и Bingbot по правилам Google (группы по всему файлу,
 *      длиннейшее правило, Allow при равенстве, `*` и `$`, ключи без двоеточия и с опечатками, как у
 *      открытого разборщика Google) не закрыты от главной, страницы игры, `/privacy/` и `/_astro/`;
 *      строка `Sitemap:` на канонический sitemap-index;
 *   4. robots.txt без параметра — тот, что берут роботы: 200, поисковики не закрыты, и он равен ответу мимо
 *      кэша — либо отличается, но пришёл из кэша Cloudflare (тогда справка «кэш», не отказ);
 *   5. sitemap-index.xml ведёт ровно на sitemap-0.xml; в sitemap-0.xml адреса = страницы структуры без
 *      `/404/` (набором, не счётом), и каждый отвечает 200 со своим `canonical`;
 *   6. несуществующий адрес страницы — 404 и наша страница (её `<title>` из структуры); `/404/` напрямую —
 *      200 и свой `canonical`; страница игры — 200 и свой `canonical`;
 *   7. `/privacy/` — 200, свой `canonical`, без обфускации почты Cloudflare (П77 п. 6) и адрес ящика —
 *      открытым текстом в ссылке `mailto:` (ящик заводится до привязки домена, П52 п. 3, П43 п. 4);
 *   8. HTML главной, игры, `/privacy/` и 404 — без вставок Cloudflare (`/cdn-cgi/`, Web Analytics, вызовы)
 *      и без чужих ресурсов (`src`/`href` ресурсов на другой хост): `/privacy/` обещает, что сторонних
 *      запросов нет;
 *   9. страницы — без `X-Robots-Tag` с `noindex`/`none` (robots.txt обещает: всё открыто для индекса);
 *  10. ни один ответ прогона — без `Set-Cookie` (`/privacy/` обещает, что сайт cookies не ставит).
 * Проверка, которая читает тело, при ответе не 200 — ПЛОХО, а не «в пустом теле ничего нет»; причина
 * ответа (вызов Cloudflare, коды 52x, сеть) — в строке. Код 1 при любом ПЛОХО, 2 — ошибка входа. Сеть —
 * `fetch` без редиректов (`redirect: 'manual'`): скачки считаются, а не прячутся; таймаут 15 с на запрос.
 * Пробы — `tools/testy/check-live.test.mjs` на подставных ответах, без сети: `proverit()` принимает функцию
 * запроса аргументом. Предел: образец блока хостера в пробах собран по именам из доклада первой выкладки
 * (байты живого блока не записаны); 404 статики (nginx) не проверяется — обещание сайта о 404 — для адресов
 * страниц.
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

const norm = (s) => s.replace(/\r\n?/g, '\n').replace(/^﻿/, '');
const KESH = /^(HIT|STALE|UPDATING|REVALIDATED)$/i;
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
const VSTAVKI_CF = ['/cdn-cgi/', 'cloudflareinsights', 'challenge-platform', '__cf_email__', 'data-cfemail', 'email-decode'];

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
export const canonicalOf = (html) => tegi(html, 'link').filter((a) => (a.rel ?? '').toLowerCase().split(/\s+/).includes('canonical')).map((a) => a.href);

const suschnosti = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘').replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/* ---------- robots.txt по правилам Google ---------- */

const KLYUCHI = {
  'user-agent': 'ua', useragent: 'ua', 'user agent': 'ua',
  allow: 'allow',
  disallow: 'disallow', dissallow: 'disallow', dissalow: 'disallow', disalow: 'disallow', diasllow: 'disallow', disallaw: 'disallow',
};
/** Группы файла как у разборщика Google: подряд идущие User-agent, затем правила до следующего User-agent после правила;
 *  комментарии и пустые строки групп не рвут, Sitemap и прочие ключи — тоже; правило до первого User-agent не действует. */
function gruppy(telo) {
  const out = [];
  let tek = null;
  let pravilo = false;
  for (const s0 of norm(telo).split('\n')) {
    const s = s0.replace(/#.*$/, '').trim();
    if (!s) continue;
    const m = /^([^:]+?)\s*:\s*(.*)$/.exec(s) ?? /^(\S+)\s+(.*)$/.exec(s);
    if (!m) continue;
    const k = KLYUCHI[m[1].trim().toLowerCase().replace(/\s+/g, ' ')];
    const v = m[2].trim();
    if (k === 'ua') {
      if (!tek || pravilo) {
        tek = { agenty: [], pravila: [] };
        out.push(tek);
        pravilo = false;
      }
      tek.agenty.push(v === '*' ? '*' : (/^[A-Za-z_-]+/.exec(v)?.[0] ?? '').toLowerCase());
    } else if (k === 'allow' || k === 'disallow') {
      pravilo = true;
      if (tek) tek.pravila.push({ allow: k === 'allow', put: v });
    }
  }
  return out;
}
const sovpadaet = (obrazec, put) => {
  const konec = obrazec.endsWith('$');
  const telo = (konec ? obrazec.slice(0, -1) : obrazec).split('*').map((c) => c.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${telo}${konec ? '$' : ''}`).test(put);
};
/** Разрешён ли путь боту: группы с его именем, иначе `*`; длиннейшее совпавшее правило, Allow при равенстве. */
function razreshen(gr, bot, put) {
  let svoi = gr.filter((g) => g.agenty.includes(bot));
  if (!svoi.length) svoi = gr.filter((g) => g.agenty.includes('*'));
  let luchshee = null;
  for (const p of svoi.flatMap((g) => g.pravila)) {
    if (p.put === '' || !sovpadaet(p.put, put)) continue;
    if (!luchshee || p.put.length > luchshee.put.length || (p.put.length === luchshee.put.length && p.allow)) luchshee = p;
  }
  return !luchshee || luchshee.allow;
}
/** Что закрыто поисковикам: «бот путь» для Googlebot и Bingbot по путям `puti`. */
export function zakrytoPoiskovikam(telo, puti) {
  const gr = gruppy(telo);
  return ['googlebot', 'bingbot'].flatMap((bot) => puti.filter((p) => !razreshen(gr, bot, p)).map((p) => `${bot} ${p}`));
}

/**
 * robots.txt живого сервера против нашего файла: `{ nashCelikom, raskhozhdenie, bloki, chuzhoyTekst, kommentarii }`.
 * Наш файл — одним куском, от начала строки до конца строки; иначе `raskhozhdenie` — первая строка нашего файла,
 * которой в ответе нет на своём месте. Остаток — строки вне нашего файла: управляемые блоки по меткам BEGIN/END,
 * комментарии вне блоков (справка) и прочее непустое — чужой текст (строки, которые есть в нашем файле, при
 * повреждённом файле чужими не считаются). Незакрытый блок — чужой текст. `polozhenie` блока — до или после нашего файла.
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
  return {
    nashCelikom: i >= 0,
    raskhozhdenie,
    bloki: bloki.map((b) => ({ imya: b.imya, vid: vid(b.imya), strok: b.stroki.filter(Boolean).length, polozhenie: b.polozhenie })),
    chuzhoyTekst,
    kommentarii,
  };
}

/* ---------- проверки ---------- */

/**
 * Все проверки живого сайта. `poluchit(url)` — запрос одним скачком (в тестах — подставной; прогон просит каждый
 * адрес один раз); `host` — канонический хост; `struktura` — `structure.json`; `nashRobots` — текст `public/robots.txt`;
 * `metka` — значение параметра обхода кэша. Возвращает `{ proverki: [{ imya, zhdem, fakt, otkuda, ok }], spravki }`.
 */
export async function proverit({ poluchit: poluchitOdin, host, struktura, nashRobots, metka }) {
  const base = `https://${host}`;
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
      const always = otkuda.startsWith('http://') && r.location === otkuda.replace('http://', 'https://');
      check(`${imya} ${put}: Location`, `${base}${put}`, r.location || '—', always ? 'Always Use HTTPS на Cloudflare включён — выключить (второй скачок)' : 'один скачок на канонический адрес с тем же путём');
    }
  }

  /* 2 — главная */
  const glavnaya = await poluchit(`${base}/`);
  check('главная: статус', 200, glavnaya.status, sPrichinoy(glavnaya, `${base}/`));
  const kan = glavnaya.status === 200 ? canonicalOf(glavnaya.telo) : [];
  check('главная: canonical', `${base}/`, kan.length === 1 ? kan[0] : `${kan.length} шт.${kan.length ? ': ' + kan.join(' ') : ''}`, 'Base.astro от Astro.site');
  const cc = glavnaya.zagolovok('cache-control');
  const maxAge = (cc.toLowerCase().match(/max-age\s*=\s*\d+/g) ?? []).map((x) => x.replace(/\s/g, ''));
  check('главная: Cache-Control у HTML (max-age=0, must-revalidate)', true, glavnaya.status === 200 && /must-revalidate/i.test(cc) && maxAge.length > 0 && maxAge.every((x) => x === 'max-age=0'), `.htaccess, mod_headers; пришло: «${cc || '—'}»`);
  const cfGl = glavnaya.zagolovok('cf-cache-status');
  check('главная: HTML не из кэша Cloudflare', true, glavnaya.status === 200 && !KESH.test(cfGl), `Cf-Cache-Status ${cfGl || '—'}${KESH.test(cfGl) ? ` (Age ${glavnaya.zagolovok('age') || '—'}) — правило кэша Cloudflare держит HTML; правка не дойдёт до читателя` : ''}`);
  if (glavnaya.zagolovok('x-ray')) spravki.push(`x-ray ${glavnaya.zagolovok('x-ray')} — сегмент «wa» значит, что HTML обслужил Apache`);

  /* 3 — robots.txt мимо кэша */
  const PUTI = ['/', igra, '/privacy/', '/_astro/'];
  const mimo = await poluchit(`${base}/robots.txt?live-check=${metka}`);
  const cfMimo = mimo.zagolovok('cf-cache-status');
  const izKeshaMimo = KESH.test(cfMimo);
  const pochemuMimo = izKeshaMimo ? `ответ из кэша Cloudflare (${cfMimo}, Age ${mimo.zagolovok('age') || '—'}) — обход не удался: строка запроса вне ключа кэша; Purge by URL и повторить` : '';
  check('robots.txt мимо кэша: статус', 200, mimo.status, sPrichinoy(mimo, 'параметр запроса мимо кэша Cloudflare'));
  check('robots.txt мимо кэша: обход кэша сработал', true, mimo.status === 200 && !izKeshaMimo, mimo.status !== 200 ? sPrichinoy(mimo, `ответ ${mimo.status}`) : `Cf-Cache-Status ${cfMimo || '—'}${pochemuMimo ? ' — ' + pochemuMimo : ''}`);
  const rb = mimo.status === 200 ? razobratRobots(mimo.telo, nashRobots) : null;
  const neChitan = (tekst) => [rb ? tekst : iskh(mimo), pochemuMimo].filter(Boolean).join('; ');
  check('robots.txt: наш файл целиком', true, rb ? rb.nashCelikom : iskh(mimo), neChitan(rb && !rb.nashCelikom ? `public/robots.txt; первая расходящаяся строка: ${rb.raskhozhdenie}` : 'public/robots.txt одним куском, отдельными строками'));
  const cf = rb ? rb.bloki.filter((b) => b.vid === 'cloudflare') : [];
  check('robots.txt: блока Cloudflare нет', true, rb ? cf.length === 0 : iskh(mimo), neChitan(cf.length ? `«${cf.map((b) => b.imya).join('», «')} Managed content» — управляемый robots.txt зоны не снят (Security → Bots)` : 'управляемый robots.txt Cloudflare снят (П106)'));
  const chuzhie = rb ? [...rb.chuzhoyTekst, ...rb.bloki.filter((b) => b.vid === 'чужой').map((b) => `блок «${b.imya}»`)] : [];
  check('robots.txt: вне нашего файла — только блок хостера', true, rb ? chuzhie.length === 0 : iskh(mimo), neChitan(chuzhie.length ? `чужое: ${chuzhie.slice(0, 3).join(' | ')}` : 'вне нашего файла — управляемые блоки и комментарии'));
  const zakryto = mimo.status === 200 ? zakrytoPoiskovikam(mimo.telo, PUTI) : [];
  check('robots.txt: поисковики не закрыты', true, mimo.status === 200 ? zakryto.length === 0 : iskh(mimo), neChitan(zakryto.length ? `закрыто: ${zakryto.join(', ')}` : `Googlebot и Bingbot: ${PUTI.join(', ')} — открыты`));
  check('robots.txt: строка Sitemap', true, mimo.status === 200 && norm(mimo.telo).split('\n').some((s) => s.trim() === `Sitemap: ${base}/sitemap-index.xml`), neChitan('строка на канонический sitemap-index'));
  spravki.push(`robots.txt мимо кэша: Cf-Cache-Status ${cfMimo || '—'}`);
  for (const b of rb ? rb.bloki.filter((x) => x.vid === 'хостер') : []) spravki.push(`robots.txt: блок хостера «${b.imya} Managed content» ${b.polozhenie}, строк ${b.strok} — не наш, не отключается`);
  for (const k of rb ? rb.kommentarii : []) spravki.push(`robots.txt: комментарий вне нашего файла и блоков — «${k}» (правил не несёт)`);

  /* 4 — robots.txt без параметра: его берут роботы */
  const bez = await poluchit(`${base}/robots.txt`);
  const cfBez = bez.zagolovok('cf-cache-status');
  const ravny = bez.status === mimo.status && norm(bez.telo) === norm(mimo.telo);
  const zakrytoBez = bez.status === 200 ? zakrytoPoiskovikam(bez.telo, PUTI) : [];
  const keshBez = KESH.test(cfBez);
  spravki.push(`robots.txt без параметра: Cf-Cache-Status ${cfBez || '—'}, Age ${bez.zagolovok('age') || '—'}`);
  check(
    'robots.txt без параметра (его берут роботы)',
    true,
    bez.status === 200 && zakrytoBez.length === 0 && (ravny || keshBez),
    sPrichinoy(bez, bez.status !== 200 ? `ответ ${bez.status} — роботы robots.txt не получают` : zakrytoBez.length ? `роботы видят закрытым: ${zakrytoBez.join(', ')}${keshBez ? ` (из кэша Cloudflare, ${cfBez} — очистить кэш robots.txt)` : ''}` : !ravny && !keshBez ? `не равен ответу мимо кэша и не из кэша (Cf-Cache-Status ${cfBez || '—'}) — отдаёт не наш сервер` : 'как ответ мимо кэша или безвредная копия из кэша'),
  );
  if (!ravny && keshBez && bez.status === 200 && zakrytoBez.length === 0) {
    spravki.push(`robots.txt без параметра (${cfBez}) не равен ответу мимо кэша — это кэш Cloudflare, не отказ: роботы видят кэш до его истечения или очистки`);
  }

  /* 5 — карта сайта */
  const indeks = await poluchit(`${base}/sitemap-index.xml`);
  check('sitemap-index.xml: статус', 200, indeks.status, sPrichinoy(indeks));
  const karty = indeks.status === 200 ? [...indeks.telo.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1]) : [];
  check('sitemap-index.xml: ведёт на sitemap-0.xml', `${base}/sitemap-0.xml`, karty.length ? karty.join(' ') : '—', `Cf-Cache-Status ${indeks.zagolovok('cf-cache-status') || '—'}`);
  const karta = await poluchit(`${base}/sitemap-0.xml`);
  const kartaKesh = `Cf-Cache-Status ${karta.zagolovok('cf-cache-status') || '—'}, Age ${karta.zagolovok('age') || '—'}`;
  check('sitemap-0.xml: статус', 200, karta.status, sPrichinoy(karta));
  const zhdem = struktura.pages.filter((p) => p.url !== '/404/').map((p) => `${base}${p.url}`).sort();
  const locs = karta.status === 200 ? [...karta.telo.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1]).sort() : [];
  check('sitemap-0.xml: адресов', zhdem.length, karta.status === 200 ? locs.length : `ответ ${karta.status}`, `страницы структуры без /404/; ${kartaKesh}`);
  const lishnie = locs.filter((u) => !zhdem.includes(u));
  const netu = zhdem.filter((u) => !locs.includes(u));
  check('sitemap-0.xml: адреса = структура', true, karta.status === 200 && lishnie.length === 0 && netu.length === 0 && new Set(locs).size === locs.length, `лишние: ${lishnie.slice(0, 3).join(', ') || '—'}; нет: ${netu.slice(0, 3).join(', ') || '—'}; ${kartaKesh}`);
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
  const zagl = /<title>([^<]*)<\/title>/i.exec(nichego.telo)?.[1];
  check('несуществующий адрес: наша страница', t404, zagl === undefined ? '—' : suschnosti(zagl).trim(), 'title /404/ из структуры, не заглушка хостера');
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
  const adresa = priv.status === 200 ? tegi(priv.telo, 'a').map((a) => /^mailto:([^?]+)/i.exec(a.href ?? '')?.[1]).filter(Boolean) : [];
  const otkrytye = adresa.filter((a) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a) && priv.telo.includes(`>${a}<`));
  check('/privacy/: адрес ящика открытым текстом', true, priv.status === 200 && otkrytye.length > 0, priv.status !== 200 ? `ответ ${priv.status}` : otkrytye.length ? `mailto: ${otkrytye.join(', ')}` : adresa.length ? `mailto есть, открытым текстом — нет: ${adresa.join(', ')}` : 'адреса ящика на странице нет — порядок П52 п. 3: ящик и строка адреса (П43 п. 4) до привязки домена');

  /* 8–10 — HTML без вставок, без noindex, ответы без cookies */
  const stranicy = [...otvety].filter(([u, r]) => u.startsWith(base) && !/\.(txt|xml)(\?|$)/.test(u) && r.status !== 301);
  const vstavki = [];
  for (const [u, r] of stranicy) {
    const naydeno = VSTAVKI_CF.filter((m) => r.telo.includes(m));
    // Ресурсы, которые браузер грузит сам: `src` у script/img/iframe/source/video/audio, `href` у link-ресурсов
    // (canonical и alternate — не запросы). Чужой — абсолютный адрес не на канонический хост.
    const RESURS_LINK = /\b(stylesheet|preload|modulepreload|prefetch|icon|apple-touch-icon|manifest)\b/i;
    const chuzhieResursy = ['script', 'link', 'img', 'iframe', 'source', 'video', 'audio'].flatMap((t) => tegi(r.telo, t).flatMap((a) => [a.src, t === 'link' && RESURS_LINK.test(a.rel ?? '') ? a.href : undefined]).filter((x) => x && /^(https?:)?\/\//i.test(x) && !x.replace(/^(https?:)?\/\//i, '').startsWith(`${host}/`)));
    if (naydeno.length || chuzhieResursy.length) vstavki.push(`${u.slice(base.length) || '/'}: ${[...naydeno, ...chuzhieResursy].slice(0, 3).join(', ')}`);
  }
  const osnova = glavnaya.status === 200 ? '' : `главная — ответ ${glavnaya.status}`;
  check('HTML без вставок Cloudflare и чужих ресурсов', true, !osnova && vstavki.length === 0, osnova || (vstavki.length ? `${vstavki.slice(0, 3).join(' | ')} — /privacy/ обещает: без сторонних запросов и чужих скриптов` : `страниц ${stranicy.length}`));
  const noindex = stranicy.filter(([, r]) => /noindex|none/i.test(r.zagolovok('x-robots-tag'))).map(([u, r]) => `${u.slice(base.length) || '/'}: ${r.zagolovok('x-robots-tag')}`);
  check('страницы без X-Robots-Tag noindex', true, !osnova && noindex.length === 0, osnova || (noindex.length ? `${noindex.slice(0, 3).join(' | ')} — robots.txt обещает: всё открыто для индекса` : `страниц ${stranicy.length}`));
  const kuki = [];
  for (const [u, r] of otvety) {
    const sc = r.zagolovok('set-cookie');
    if (!sc) continue;
    const gde = u === `${base}/` ? 'главная' : u.replace(/^https?:\/\//, '').replace(host, '') || u;
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
  const { proverki, spravki } = await proverit({ poluchit: poluchitSetyu, host, struktura, nashRobots, metka: Date.now() });
  for (const c of proverki) console.log(`${c.ok ? 'ok   ' : 'ПЛОХО'} ${c.imya.padEnd(56)} ждём ${c.zhdem}  факт ${c.fakt}${c.otkuda ? `  — ${c.otkuda}` : ''}`);
  for (const s of spravki) console.log(`  справка: ${s}`);
  const plokho = proverki.filter((c) => !c.ok).length;
  console.log(`\n${proverki.length - plokho}/${proverki.length} проверок живого сайта ${host}`);
  process.exit(plokho ? 1 : 0);
}
