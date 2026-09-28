#!/usr/bin/env node
/**
 * СТОРОЖА ВЫКЛАДКИ 7thserpent.com — их зовёт `.github/workflows/deploy-7thserpent.yml` (П106, шаг 5): выкладка
 * GitHub Actions → FTPS по форме `deploy-ac4bf.yml` (П54 п. 4 и дополнение). Сторож — функция над тем, что
 * workflow уже получил (вывод `lftp`, скачанный `index.html`, ответы домена, `dist/`), и строка вердикта; код 0 —
 * проход, 1 — отказ (выкладка не идёт или не засчитана), 2 — ошибка входа. Сеть — только у сторожа домена
 * (`fetch`); к серверу FTP сторожа не ходят — это делает `lftp` в workflow. Значения секретов не печатаются.
 * «Судью судят», раунд 1 (SV1-O, SV1-Z — в пробах): папка робота — белым списком; «первая выкладка» — по входу
 * или по серверу; «не привязан» — только по положительным признакам; сверка сборки — с нормализацией cid ядра.
 *
 *   node tools/storozha-vykladki.mjs sekrety                 — секреты на месте (SERPENT_FTP_*, SERPENT_CORPUS_KEY);
 *                                                              логин и хост без знаков, ломающих команду lftp;
 *                                                              робот — не робот первого сайта (AC4BF_FTP_USER)
 *   node tools/storozha-vykladki.mjs pervaya [<index.html>]  — первая ли выкладка: вход SERPENT_FIRST=on или на
 *                                                              сервере нет нашего index.html; pervaya=on|off —
 *                                                              в GITHUB_OUTPUT, если он задан
 *   node tools/storozha-vykladki.mjs domen                   — «домен уже привязан?» (бэклог 46 п. 2); при первой
 *                                                              выкладке (SERPENT_PERVAYA=on) домен, который отвечает, — отказ
 *   node tools/storozha-vykladki.mjs papka <список> [<index.html>]  — папка робота (`cls -1 -a -F` в корне)
 *   node tools/storozha-vykladki.mjs indeks [<index.html>]   — удалённый index.html до `mirror`: только наш
 *   node tools/storozha-vykladki.mjs sverka-dist <dist> <список сборки>  — первая выкладка: dist CI = принятый
 *   node tools/storozha-vykladki.mjs pereschet <find> <dist> — после выкладки: файлы на сервере = dist
 *   node tools/storozha-vykladki.mjs spisok <dist> [<метка>] — список файлов и sha256 сборки (JSON в вывод);
 *                                                              так пишется gates/sborka-prinyataya.json — сборка,
 *                                                              принятая в сессии 22 (правка сайта до первой
 *                                                              выкладки — новый список, иначе первая выкладка — стоп)
 *
 * Пробы — `tools/testy/storozha-vykladki.test.mjs`: образцы вывода `lftp` и ответов домена, без сети.
 * Пределы: пересчёт после выкладки сверяет имена файлов, не размеры (формат длинного списка lftp у этого сервера
 * не измерен); запись файлов — через временное имя (`xfer:use-temp-file` в workflow).
 */

import { readFileSync, readdirSync, statSync, existsSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

export const KANON = 'https://www.7thserpent.com/';
export const HOSTY = ['www.7thserpent.com', '7thserpent.com'];
/** Файлы, без которых выкладка не засчитана, — как у первого сайта, плюс /privacy/. */
export const KLYUCHEVYE = ['index.html', 'robots.txt', '.htaccess', '404/index.html', 'privacy/index.html', 'sitemap-index.xml', 'sitemap-0.xml'];
/** Что может лежать в свежем каталоге сайта у хостера до первой выкладки: заглушка (её судит `indeks`) и служебные папки. */
const SVEZHIY_KATALOG = new Set(['index.html', '.well-known/', 'cgi-bin/']);

const itog = (ok, stroki) => ({ ok, stroki });

/* ---------- секреты ---------- */

/**
 * Секреты на месте; логин, хост и порт — без знаков, ломающих строку команды lftp (пароль в команду не идёт:
 * workflow отдаёт его через LFTP_PASSWORD и `open --env-password`); пользователь робота — не пользователь первого
 * сайта. Значения не печатаются.
 */
export function sekrety(env) {
  const imena = ['SERPENT_FTP_HOST', 'SERPENT_FTP_PORT', 'SERPENT_FTP_USER', 'SERPENT_FTP_PASSWORD', 'SERPENT_CORPUS_KEY'];
  const net = imena.filter((i) => !String(env[i] ?? '').trim());
  if (net.length) return itog(false, [`СТОП: нет секрета ${net.join(', ')} — выкладка не начата`]);
  if (!/^\d{1,5}$/.test(String(env.SERPENT_FTP_PORT).trim())) return itog(false, ['СТОП: SERPENT_FTP_PORT — не номер порта']);
  const lomayut = ['SERPENT_FTP_HOST', 'SERPENT_FTP_USER'].filter((i) => /["'\\\s;`$]/.test(String(env[i]).trim()));
  if (lomayut.length) return itog(false, [`СТОП: в ${lomayut.join(', ')} кавычка, пробел, «;», «\\», «\`» или «$» — строка команды lftp сломалась бы; проверь значение секрета`]);
  if (!String(env.AC4BF_FTP_USER ?? '').trim()) {
    return itog(false, ['СТОП: нет AC4BF_FTP_USER — не с чем сверить пользователя робота (робот первого сайта выкладывал бы в его корень)']);
  }
  const u = (s) => String(s).trim().toLowerCase();
  if (u(env.SERPENT_FTP_USER) === u(env.AC4BF_FTP_USER)) {
    return itog(false, ['СТОП: SERPENT_FTP_USER совпадает с AC4BF_FTP_USER — это робот первого сайта, его каталог — корень ac4bf-thewatch.com; нужен свой пользователь FTP с каталогом 7thserpent.com/www']);
  }
  return itog(true, ['секреты на месте (SERPENT_FTP_*, SERPENT_CORPUS_KEY); пользователь робота — не пользователь первого сайта']);
}

/* ---------- первая выкладка и домен ---------- */

/** Ссылки canonical документа. */
export function canonicalOf(html) {
  return [...String(html).matchAll(/<link\b([^>]*)>/gi)]
    .map((m) => Object.fromEntries([...m[1].matchAll(/([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map((a) => [a[1].toLowerCase(), a[2] ?? a[3] ?? a[4]])))
    .filter((a) => (a.rel ?? '').toLowerCase().split(/\s+/).includes('canonical'))
    .map((a) => a.href ?? '');
}
const nashIndex = (html) => {
  if (html === null || html === undefined) return false;
  const k = canonicalOf(html);
  return k.length === 1 && k[0] === KANON;
};

/**
 * Первая ли выкладка (SV1-O-2): вход SERPENT_FIRST=on — или на сервере нет нашего index.html (нет файла, заглушка,
 * чужой). Защита первой выкладки не держится на одном слове входа: ручной запуск со входом по умолчанию в пустой
 * каталог — тоже первая выкладка.
 */
export function pervayaVykladka(vkhod, indexHtml) {
  if (vkhod === 'on') return { pervaya: true, pochemu: 'вход SERPENT_FIRST=on' };
  if (!nashIndex(indexHtml)) return { pervaya: true, pochemu: indexHtml === null || indexHtml === undefined ? 'на сервере нет index.html' : 'index.html на сервере не наш' };
  return { pervaya: false, pochemu: 'на сервере наша сборка (index.html с canonical главной)' };
}

/** Запрос одним скачком: `{ status, location, telo }`; ошибка сети — `{ oshibka: код }`. */
export async function poluchitSetyu(url) {
  try {
    const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'factory-deploy-guard/1' } });
    return { status: r.status, location: r.headers.get('location') ?? '', telo: await r.text() };
  } catch (e) {
    return { oshibka: e.cause?.code ?? e.name };
  }
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * Что отвечает хост: идём по редиректам (не больше 5 скачков) до конечного ответа. «Не привязан» — только по
 * положительным признакам (SV1-O-3): имя хоста не разрешается (ENOTFOUND на первом запросе) или 404 с измеренной
 * заглушкой хостера «Website <этот хост> not configured» (доклад 2026-09-15, первый сайт). Всё прочее — «отвечает»:
 * наша сборка, чужая страница, пустой каталог (403, 404 сервера), редирект куда угодно; «не понять» — ошибки сети
 * и временные ошибки имени (EAI_AGAIN, таймаут, TLS) — при первой выкладке это стоп.
 */
export async function sostoyanieHosta(poluchit, host) {
  let url = `https://${host}/`;
  const put = [];
  for (let skachok = 0; skachok <= 5; skachok += 1) {
    const r = await poluchit(url);
    if (r.oshibka) {
      put.push(`${url} — сеть: ${r.oshibka}`);
      if (r.oshibka === 'ENOTFOUND' && skachok === 0) return { sostoyanie: 'не привязан', pochemu: 'имя не разрешается', put };
      if (r.oshibka === 'ENOTFOUND') return { sostoyanie: 'отвечает', pochemu: 'домен отвечает редиректом на имя, которого нет', put };
      return { sostoyanie: 'не понять', pochemu: `ошибка сети ${r.oshibka}`, put };
    }
    put.push(`${url} — ${r.status}`);
    if ([301, 302, 303, 307, 308].includes(r.status) && r.location) {
      url = new URL(r.location, url).href;
      continue;
    }
    const tekHost = new URL(url).host;
    if (r.status === 404 && new RegExp(`Website\\s+${esc(tekHost)}\\s+not\\s+configured`, 'i').test(r.telo) && HOSTY.includes(tekHost)) {
      return { sostoyanie: 'не привязан', pochemu: 'заглушка хостера «not configured»', put };
    }
    return { sostoyanie: 'отвечает', pochemu: `ответ ${r.status}`, put };
  }
  return { sostoyanie: 'отвечает', pochemu: 'больше 5 редиректов', put };
}

/** «Домен уже привязан?» по обоим хостам; `pervyi` — первая выкладка (признак `pervaya`). */
export async function domen({ poluchit, pervyi, hosty = HOSTY }) {
  const stroki = [];
  const sost = [];
  for (const h of hosty) {
    const s = await sostoyanieHosta(poluchit, h);
    sost.push(s.sostoyanie);
    stroki.push(`${h}: ${s.sostoyanie === 'не привязан' ? 'не привязан' : s.sostoyanie.toUpperCase()} — ${s.pochemu} (${s.put.join(' → ')})`);
  }
  if (sost.every((s) => s === 'не привязан')) return itog(true, [...stroki, 'домен не привязан: выкладка ляжет в каталог сайта, домен её не покажет']);
  if (!pervyi) return itog(true, [...stroki, 'домен отвечает: выкладка обновит живой сайт']);
  if (sost.includes('отвечает')) {
    return itog(false, [...stroki, 'СТОП: первая выкладка, а домен уже отвечает — выкладка сделала бы сайт живым раньше ящика (П52 п. 3). Сначала выясни, что отвечает, в панели и Cloudflare.']);
  }
  return itog(false, [...stroki, 'СТОП: первая выкладка, а не удалось узнать, отвечает ли домен (временная ошибка имени, таймаут или TLS) — повтори запуск; повторяется — проверь зону и NS в Cloudflare.']);
}

/* ---------- папка робота ---------- */

/** Строки `cls -1 -a -F`: имена; каталоги — с «/», ссылки — с «@»; `./` и `../` отброшены. */
export function razobratSpisok(tekst) {
  return String(tekst)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s && s !== './' && s !== '../' && s !== '.' && s !== '..');
}

/** Хост canonical первого сайта. */
const PERVYI_SAYT = /^https?:\/\/(www\.)?ac4bf-thewatch\.com(\/|$)/i;

/**
 * Папка робота — белым списком (SV1-O-1): отказ — папки с именами доменов (и кириллицей), `www` в любом регистре,
 * с косой и без, ссылки (`@`), `index.*` кроме ровно `index.html`, корень первого сайта; проход — пустой корень,
 * свежий каталог хостера (только `index.html` — его судит `indeks` — и служебные `.well-known/`, `cgi-bin/`) или
 * прежняя наша выкладка (`index.html` с canonical главной). Всё прочее — непустой каталог без нашей сборки: отказ,
 * потому что `mirror --delete` стёр бы его. Имена доменов аккаунта не печатаются — только их число.
 */
export function papka(spisokTekst, indexHtml) {
  const imena = razobratSpisok(spisokTekst);
  const bez = (s) => s.replace(/[/@]$/, '');
  const katalogi = imena.filter((s) => s.endsWith('/')).map(bez);
  const ssylki = imena.filter((s) => s.endsWith('@')).map(bez);
  const domeny = katalogi.filter((k) => /^[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+$/u.test(k) && !k.startsWith('.'));
  if (domeny.length) {
    return itog(false, [`СТОП: в корне робота папки с именами доменов (${domeny.length}) — робот видит аккаунт целиком, а не каталог сайта. Поправь «Каталог доступу» пользователя FTP на 7thserpent.com/www.`]);
  }
  if (imena.some((s) => bez(s).toLowerCase() === 'www')) {
    return itog(false, ['СТОП: в корне робота папка www — робот стоит в каталоге домена, а не в его корневом каталоге. Поправь «Каталог доступу» на 7thserpent.com/www.']);
  }
  if (ssylki.length) {
    return itog(false, [`СТОП: в корне робота ссылка (${ssylki.join(', ')}) — в сборке ссылок нет, mirror --delete заменил бы её; удали ссылку в файловом менеджере панели.`]);
  }
  const drugieIndex = imena.filter((s) => /^index\./i.test(bez(s)) && s !== 'index.html');
  if (drugieIndex.length) {
    return itog(false, [`СТОП: в корне робота ${drugieIndex.join(', ')} — страница чужого сайта или заглушка не той формы; mirror --delete стёр бы её. Удали в файловом менеджере, если это заглушка хостера.`]);
  }
  if (imena.includes('index.html')) {
    if (indexHtml === null || indexHtml === undefined) return itog(false, ['СТОП: index.html в корне есть, а его содержимого сторож не получил — не понять, чей это сайт.']);
    if (canonicalOf(indexHtml).some((h) => PERVYI_SAYT.test(h))) {
      return itog(false, ['СТОП: в корне робота — сайт ac4bf-thewatch.com (canonical его index.html). Это каталог первого сайта; mirror --delete стёр бы его.']);
    }
    if (nashIndex(indexHtml)) return itog(true, [`папка робота: наша сборка (index.html с canonical главной), записей ${imena.length}`]);
  }
  if (!imena.length) return itog(true, ['папка робота: пустой корень — первая выкладка']);
  const chuzhoe = imena.filter((s) => !SVEZHIY_KATALOG.has(s));
  if (chuzhoe.length) {
    return itog(false, [`СТОП: в корне робота непустой каталог без нашей сборки (${chuzhoe.length} записей, например ${chuzhoe.slice(0, 3).join(', ')}) — чужой сайт или не тот каталог; mirror --delete стёр бы его. Проверь «Каталог доступу» и содержимое 7thserpent.com/www.`]);
  }
  return itog(true, [`папка робота: свежий каталог хостера — ${imena.includes('index.html') ? 'заглушка index.html (её судит сторож index.html)' : ''}${imena.some((s) => s !== 'index.html') ? `${imena.includes('index.html') ? '; ' : ''}служебные папки ${imena.filter((s) => s !== 'index.html').join(', ')}` : ''}`]);
}

/** Удалённый index.html до `mirror`: нет — проход; есть — только с одним canonical, равным KANON. */
export function indeks(indexHtml) {
  if (indexHtml === null || indexHtml === undefined) return itog(true, ['index.html на сервере нет — первая выкладка в пустой каталог']);
  if (nashIndex(indexHtml)) return itog(true, [`index.html на сервере — наш (canonical ${KANON})`]);
  // Пуст или оборван (SV1-Z-6): пустой файл или страница, начатая как документ, но без `</html>`.
  if (!indexHtml.trim() || (/^\s*(<!doctype|<html)/i.test(indexHtml) && !/<\/html\s*>/i.test(indexHtml))) {
    return itog(false, ['СТОП: index.html на сервере пуст или оборван — прошлая выкладка не закончилась или файл повреждён; удали его в файловом менеджере панели и запусти выкладку снова.']);
  }
  const k = canonicalOf(indexHtml);
  if (!k.length) return itog(false, ['СТОП: index.html на сервере без canonical — заглушка хостера или чужая страница; если это заглушка хостера — удали её в файловом менеджере панели (mirror --delete заменил бы чужой сайт).']);
  return itog(false, [`СТОП: index.html на сервере не наш — canonical ${k.join(', ')} (ждём ровно ${KANON}). mirror --delete заменил бы чужой сайт.`]);
}

/* ---------- сборка ---------- */

const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const CID = /data-astro-cid-([a-z0-9]+)/g;
const CSS_IMYA = /(_astro\/[^/"'()\s]+?)\.[A-Za-z0-9_-]{8}\.css/g;
const TEKST = /\.(html|css|js|mjs|xml|txt|svg|json|webmanifest)$/i;

/**
 * Список файлов сборки: `{ fajlov, fajly: { путь: sha256 }, norm: { путь без хеша CSS: sha256 после нормализации } }`.
 * Нормализация (SV1-Z-1): значения `data-astro-cid-*` — порядковыми метками по первому появлению (файлы — по порядку
 * нормализованных путей), хеш в имени `_astro/*.css` — снят в путях и в ссылках. Причина: компилятор Astro считает
 * cid компонента от его пути, а для компонентов ядра (вне корня сайта) — от абсолютного пути, поэтому сборка CI
 * (`/home/runner/work/…`) отличается от принятой (`D:/SEO/cloud/…`) ровно этими значениями и именами CSS, чьё
 * содержимое их несёт. Всё прочее сверяется побайтно, в том числе порядок и число cid.
 */
export function spisokSborki(dist) {
  const puti = obhod(dist).map((x) => relative(dist, x).replace(/\\/g, '/'));
  const normPut = (p) => p.replace(CSS_IMYA, '$1.#.css');
  const poryadok = [...puti].sort((a, b) => (normPut(a) < normPut(b) ? -1 : normPut(a) > normPut(b) ? 1 : a < b ? -1 : 1));
  const cid = new Map();
  const fajly = {};
  const norm = {};
  for (const p of poryadok) {
    const b = readFileSync(join(dist, p));
    fajly[p] = sha(b);
    const n = TEKST.test(p)
      ? Buffer.from(
          b
            .toString('utf8')
            .replace(CID, (_, v) => {
              if (!cid.has(v)) cid.set(v, cid.size + 1);
              return `data-astro-cid-#${cid.get(v)}`;
            })
            .replace(CSS_IMYA, '$1.#.css'),
          'utf8'
        )
      : b;
    norm[normPut(p) in norm ? `${normPut(p)}#${p}` : normPut(p)] = sha(n);
  }
  const uporyad = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
  return { fajlov: puti.length, fajly: uporyad(fajly), norm: uporyad(norm) };
}

/** Сборка CI против принятой: те же пути и sha256 после нормализации cid ядра и хешей имён CSS (SV1-Z-1). */
export function sverkaDist(dist, prinyatyi) {
  if (!prinyatyi || typeof prinyatyi.norm !== 'object' || prinyatyi.norm === null) throw new Error('в списке принятой сборки нет поля norm');
  const ci = spisokSborki(dist);
  const [sei, prin] = [ci.norm, prinyatyi.norm];
  const net = Object.keys(prin).filter((f) => !(f in sei));
  const lishnie = Object.keys(sei).filter((f) => !(f in prin));
  const inye = Object.keys(prin).filter((f) => f in sei && sei[f] !== prin[f]);
  const syrye = Object.keys(prinyatyi.fajly ?? {}).filter((f) => ci.fajly[f] !== prinyatyi.fajly[f]).length;
  if (!net.length && !lishnie.length && !inye.length) {
    return itog(true, [`сборка CI = принятая (${prinyatyi.sborka ?? '—'}): ${ci.fajlov} файлов, sha256 те же${syrye ? `; побайтно иных ${syrye} — только значения data-astro-cid компонентов ядра и хеши имён CSS (путь ядра на раннере другой)` : ', побайтно'}`]);
  }
  const pokazat = (a) => (a.length ? `${a.length}: ${a.slice(0, 8).join(', ')}${a.length > 8 ? ', …' : ''}` : '0');
  return itog(false, [
    `СТОП: сборка CI не равна принятой (${prinyatyi.sborka ?? '—'}) — нет ${pokazat(net)}; лишние ${pokazat(lishnie)}; иные байты ${pokazat(inye)} (сверка — после нормализации cid ядра и хешей имён CSS). Сервер не тронут.`,
    'список сборки CI (для разбора; принять его вместо принятого — решение владельца):',
    JSON.stringify({ sborka: 'CI', ...ci }),
  ]);
}

/** Строки `find .` у lftp: файлы (без «/» на конце), путь — без «./». */
export function razobratFind(tekst) {
  return String(tekst)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s && !s.endsWith('/'))
    .map((s) => s.replace(/^\.\//, ''));
}

/** После выкладки: файлы на сервере = файлы dist (набором), ключевые — на месте; служебные файлы сервера — названы. */
export function pereschet(findTekst, dist) {
  const naServere = new Set(razobratFind(findTekst));
  const lokalno = new Set(Object.keys(spisokSborki(dist).fajly));
  const net = [...lokalno].filter((f) => !naServere.has(f));
  const lishnie = [...naServere].filter((f) => !lokalno.has(f));
  const sluzhebnye = lishnie.filter((f) => /(^|\/)(\.in\.|\.nfs)/.test(f));
  const klyuchi = KLYUCHEVYE.filter((f) => !naServere.has(f));
  if (!net.length && !lishnie.length && !klyuchi.length) return itog(true, [`на сервере ровно dist/: ${naServere.size} файлов, ключевые на месте`]);
  return itog(false, [
    `СТОП: на сервере не dist/ — файлов локально ${lokalno.size}, на сервере ${naServere.size}; нет на сервере: ${net.slice(0, 8).join(', ') || '—'}; лишние: ${lishnie.slice(0, 8).join(', ') || '—'}; ключевых нет: ${klyuchi.join(', ') || '—'}`,
    ...(sluzhebnye.length ? [`из лишних — служебные файлы сервера (.nfs, .in.: ${sluzhebnye.length}) — оборванная запись или файл, который сервер ещё держит; повтори пересчёт или выкладку через минуту`] : []),
  ]);
}

/* ---------- команда ---------- */

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [komanda, ...argi] = process.argv.slice(2);
  const prochest = (f) => (f && existsSync(f) ? readFileSync(f, 'utf8') : null);
  let r;
  try {
    if (komanda === 'sekrety' && argi.length === 0) r = sekrety(process.env);
    else if (komanda === 'pervaya' && argi.length <= 1) {
      const p = pervayaVykladka(process.env.SERPENT_FIRST ?? 'off', prochest(argi[0]));
      if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `pervaya=${p.pervaya ? 'on' : 'off'}\n`);
      r = itog(true, [`первая выкладка: ${p.pervaya ? 'да' : 'нет'} — ${p.pochemu}`]);
    } else if (komanda === 'domen' && argi.length === 0) r = await domen({ poluchit: poluchitSetyu, pervyi: process.env.SERPENT_PERVAYA !== 'off' });
    else if (komanda === 'papka' && (argi.length === 1 || argi.length === 2) && existsSync(argi[0])) r = papka(readFileSync(argi[0], 'utf8'), prochest(argi[1]));
    else if (komanda === 'indeks' && argi.length <= 1) r = indeks(prochest(argi[0]));
    else if (komanda === 'sverka-dist' && argi.length === 2 && existsSync(argi[0]) && existsSync(argi[1])) r = sverkaDist(argi[0], JSON.parse(readFileSync(argi[1], 'utf8')));
    else if (komanda === 'pereschet' && argi.length === 2 && existsSync(argi[0]) && existsSync(argi[1])) r = pereschet(readFileSync(argi[0], 'utf8'), argi[1]);
    else if (komanda === 'spisok' && (argi.length === 1 || argi.length === 2) && existsSync(argi[0])) {
      console.log(JSON.stringify({ ...(argi[1] ? { sborka: argi[1] } : {}), ...spisokSborki(argi[0]) }, null, 1));
      process.exit(0);
    } else {
      console.error('команды: sekrety | pervaya [<index.html>] | domen | papka <список> [<index.html>] | indeks [<index.html>] | sverka-dist <dist> <список> | pereschet <find> <dist> | spisok <dist> [<метка>]');
      process.exit(2);
    }
  } catch (e) {
    console.error(`сторож не смог прочесть вход: ${e.message}`);
    process.exit(2);
  }
  for (const s of r.stroki) console.log(s);
  process.exit(r.ok ? 0 : 1);
}
