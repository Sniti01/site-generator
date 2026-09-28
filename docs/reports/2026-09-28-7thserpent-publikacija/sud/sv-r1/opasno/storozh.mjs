#!/usr/bin/env node
/**
 * СТОРОЖА ВЫКЛАДКИ 7thserpent.com — их зовёт `.github/workflows/deploy-7thserpent.yml` (П106, шаг 5): выкладка
 * GitHub Actions → FTPS по форме `deploy-ac4bf.yml` (П54 п. 4 и дополнение). Сторож — функция над тем, что
 * workflow уже получил (вывод `lftp`, скачанный `index.html`, ответы домена, `dist/`), и строка вердикта; код 0 —
 * проход, 1 — отказ (выкладка не идёт или не засчитана), 2 — ошибка входа. Сеть — только у сторожа домена
 * (`fetch`); к серверу FTP сторожа не ходят — это делает `lftp` в workflow. Значения секретов не печатаются.
 *
 *   node tools/storozha-vykladki.mjs sekrety                 — секреты SERPENT_FTP_* на месте; пользователь
 *                                                              робота не тот, что у первого сайта (AC4BF_FTP_USER)
 *   node tools/storozha-vykladki.mjs domen                   — «домен уже привязан?» (бэклог 46 п. 2); SERPENT_FIRST=on
 *                                                              — первая выкладка: домен, который отвечает, — отказ
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
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

export const KANON = 'https://www.7thserpent.com/';
export const HOSTY = ['www.7thserpent.com', '7thserpent.com'];
/** Файлы, без которых выкладка не засчитана, — как у первого сайта, плюс /privacy/. */
export const KLYUCHEVYE = ['index.html', 'robots.txt', '.htaccess', '404/index.html', 'privacy/index.html', 'sitemap-index.xml', 'sitemap-0.xml'];

const itog = (ok, stroki) => ({ ok, stroki });

/* ---------- секреты ---------- */

/** Секреты робота на месте и пользователь робота — не пользователь первого сайта. Значения не печатаются. */
export function sekrety(env) {
  const imena = ['SERPENT_FTP_HOST', 'SERPENT_FTP_PORT', 'SERPENT_FTP_USER', 'SERPENT_FTP_PASSWORD'];
  const net = imena.filter((i) => !String(env[i] ?? '').trim());
  if (net.length) return itog(false, [`СТОП: нет секрета ${net.join(', ')} — выкладка не начата`]);
  if (!/^\d{1,5}$/.test(String(env.SERPENT_FTP_PORT).trim())) return itog(false, ['СТОП: SERPENT_FTP_PORT — не номер порта']);
  if (!String(env.AC4BF_FTP_USER ?? '').trim()) {
    return itog(false, ['СТОП: нет AC4BF_FTP_USER — не с чем сверить пользователя робота (робот первого сайта выкладывал бы в его корень)']);
  }
  const u = (s) => String(s).trim().toLowerCase();
  if (u(env.SERPENT_FTP_USER) === u(env.AC4BF_FTP_USER)) {
    return itog(false, ['СТОП: SERPENT_FTP_USER совпадает с AC4BF_FTP_USER — это робот первого сайта, его каталог — корень ac4bf-thewatch.com; нужен свой пользователь FTP с каталогом 7thserpent.com/www']);
  }
  return itog(true, ['четыре секрета SERPENT_FTP_* есть; пользователь робота — не пользователь первого сайта']);
}

/* ---------- домен ---------- */

/** Ссылки canonical документа. */
export function canonicalOf(html) {
  return [...String(html).matchAll(/<link\b([^>]*)>/gi)]
    .map((m) => Object.fromEntries([...m[1].matchAll(/([^\s=/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map((a) => [a[1].toLowerCase(), a[2] ?? a[3] ?? a[4]])))
    .filter((a) => (a.rel ?? '').toLowerCase().split(/\s+/).includes('canonical'))
    .map((a) => a.href ?? '');
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

/**
 * Что отвечает хост: идём по редиректам (не больше 5 скачков) до конечного ответа.
 * «не привязан» — имя не разрешается (ENOTFOUND), заглушка хостера «not configured» (404) или 404 не нашей
 * сборки («404 хостера»); всё прочее — «отвечает» (наша сборка, чужая страница, ошибка TLS, таймаут, 403, 5xx):
 * при первой выкладке это стоп — выкладка сделала бы домен живым раньше ящика (П52 п. 3).
 */
export async function sostoyanieHosta(poluchit, host) {
  let url = `https://${host}/`;
  const put = [];
  for (let skachok = 0; skachok <= 5; skachok += 1) {
    const r = await poluchit(url);
    if (r.oshibka) {
      put.push(`${url} — сеть: ${r.oshibka}`);
      return r.oshibka === 'ENOTFOUND' ? { privyazan: false, pochemu: 'имя не разрешается', put } : { privyazan: true, pochemu: `ошибка сети ${r.oshibka} — не понять, что за доменом`, put };
    }
    put.push(`${url} — ${r.status}`);
    if ([301, 302, 303, 307, 308].includes(r.status) && r.location) {
      url = new URL(r.location, url).href;
      continue;
    }
    if (r.status === 404 && /not configured/i.test(r.telo)) return { privyazan: false, pochemu: 'заглушка хостера «not configured»', put };
    if (r.status === 404 && !canonicalOf(r.telo).some((h) => /^https?:\/\/(www\.)?7thserpent\.com\//i.test(h))) return { privyazan: false, pochemu: '404 не нашей сборки (хостер)', put };
    return { privyazan: true, pochemu: `ответ ${r.status}`, put };
  }
  return { privyazan: true, pochemu: 'больше 5 редиректов', put };
}

/** «Домен уже привязан?» по обоим хостам; `pervyi` — первая выкладка (SERPENT_FIRST=on). */
export async function domen({ poluchit, pervyi, hosty = HOSTY }) {
  const stroki = [];
  let otvechaet = false;
  for (const h of hosty) {
    const s = await sostoyanieHosta(poluchit, h);
    otvechaet ||= s.privyazan;
    stroki.push(`${h}: ${s.privyazan ? 'ОТВЕЧАЕТ' : 'не привязан'} — ${s.pochemu} (${s.put.join(' → ')})`);
  }
  if (!otvechaet) return itog(true, [...stroki, 'домен не привязан: выкладка ляжет в каталог сайта, домен её не покажет']);
  if (pervyi) return itog(false, [...stroki, 'СТОП: первая выкладка (SERPENT_FIRST=on), а домен уже отвечает — выкладка сделала бы сайт живым раньше ящика (П52 п. 3). Сначала выясни, что отвечает, в панели и Cloudflare.']);
  return itog(true, [...stroki, 'домен отвечает: выкладка обновит живой сайт']);
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
 * Папка робота: корень аккаунта с папками доменов — отказ; папка домена с `www/` — отказ; корень первого сайта
 * (`index.html` с canonical ac4bf-thewatch.com) — отказ; `index.html` в списке, а содержимого нет — отказ;
 * пустой корень, заглушка хостера или прежняя выкладка — проход (что делать с `index.html`, решает сторож `indeks`).
 */
export function papka(spisokTekst, indexHtml) {
  const imena = razobratSpisok(spisokTekst);
  const katalogi = imena.filter((s) => /[/@]$/.test(s)).map((s) => s.slice(0, -1));
  const domeny = katalogi.filter((k) => /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(k));
  if (domeny.length) {
    return itog(false, [`СТОП: в корне робота папки с именами доменов (${domeny.join(', ')}) — робот видит аккаунт целиком, а не каталог сайта. Поправь «Каталог доступу» пользователя FTP на 7thserpent.com/www.`]);
  }
  if (katalogi.some((k) => k.toLowerCase() === 'www')) {
    return itog(false, ['СТОП: в корне робота папка www — робот стоит в каталоге домена, а не в его корневом каталоге. Поправь «Каталог доступу» на 7thserpent.com/www.']);
  }
  if (imena.includes('index.html')) {
    if (indexHtml === null || indexHtml === undefined) return itog(false, ['СТОП: index.html в корне есть, а его содержимого сторож не получил — не понять, чей это сайт.']);
    if (canonicalOf(indexHtml).some((h) => PERVYI_SAYT.test(h))) {
      return itog(false, ['СТОП: в корне робота — сайт ac4bf-thewatch.com (canonical его index.html). Это каталог первого сайта; mirror --delete стёр бы его.']);
    }
  }
  return itog(true, [`папка робота: записей ${imena.length}, папок доменов и www нет, первого сайта нет`]);
}

/** Удалённый index.html до `mirror`: нет — проход; есть — только с одним canonical, равным KANON. */
export function indeks(indexHtml) {
  if (indexHtml === null || indexHtml === undefined) return itog(true, ['index.html на сервере нет — первая выкладка в пустой каталог']);
  const k = canonicalOf(indexHtml);
  if (k.length === 1 && k[0] === KANON) return itog(true, [`index.html на сервере — наш (canonical ${KANON})`]);
  return itog(false, [`СТОП: index.html на сервере не наш — canonical ${k.length ? k.join(', ') : 'нет'} (ждём ровно ${KANON}). mirror --delete заменил бы чужой сайт или заглушку; если это заглушка хостера — удали её в файловом менеджере панели.`]);
}

/* ---------- сборка ---------- */

const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));

/** Список файлов сборки и их sha256: `{ fajlov, fajly: { путь: sha256 } }`, пути — с «/», по порядку. */
export function spisokSborki(dist) {
  const fajly = {};
  for (const f of obhod(dist).map((x) => relative(dist, x).replace(/\\/g, '/')).sort()) {
    fajly[f] = createHash('sha256').update(readFileSync(join(dist, f))).digest('hex');
  }
  return { fajlov: Object.keys(fajly).length, fajly };
}

/** Сборка CI против принятой: те же пути и те же sha256. */
export function sverkaDist(dist, prinyatyi) {
  if (!prinyatyi || typeof prinyatyi.fajly !== 'object' || prinyatyi.fajly === null) throw new Error('в списке принятой сборки нет поля fajly');
  const sei = spisokSborki(dist).fajly;
  const prin = prinyatyi.fajly;
  const net = Object.keys(prin).filter((f) => !(f in sei));
  const lishnie = Object.keys(sei).filter((f) => !(f in prin));
  const inye = Object.keys(prin).filter((f) => f in sei && sei[f] !== prin[f]);
  if (!net.length && !lishnie.length && !inye.length) {
    return itog(true, [`сборка CI = принятая (${prinyatyi.sborka ?? '—'}): ${Object.keys(sei).length} файлов, sha256 те же`]);
  }
  const pokazat = (a) => (a.length ? `${a.length}: ${a.slice(0, 8).join(', ')}${a.length > 8 ? ', …' : ''}` : '0');
  return itog(false, [`СТОП: сборка CI не равна принятой (${prinyatyi.sborka ?? '—'}) — нет ${pokazat(net)}; лишние ${pokazat(lishnie)}; иные байты ${pokazat(inye)}`]);
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

/** После выкладки: файлы на сервере = файлы dist (набором), ключевые — на месте. */
export function pereschet(findTekst, dist) {
  const naServere = new Set(razobratFind(findTekst));
  const lokalno = new Set(Object.keys(spisokSborki(dist).fajly));
  const net = [...lokalno].filter((f) => !naServere.has(f));
  const lishnie = [...naServere].filter((f) => !lokalno.has(f));
  const klyuchi = KLYUCHEVYE.filter((f) => !naServere.has(f));
  if (!net.length && !lishnie.length && !klyuchi.length) return itog(true, [`на сервере ровно dist/: ${naServere.size} файлов, ключевые на месте`]);
  return itog(false, [`СТОП: на сервере не dist/ — файлов локально ${lokalno.size}, на сервере ${naServere.size}; нет на сервере: ${net.slice(0, 8).join(', ') || '—'}; лишние: ${lishnie.slice(0, 8).join(', ') || '—'}; ключевых нет: ${klyuchi.join(', ') || '—'}`]);
}

/* ---------- команда ---------- */

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [komanda, ...argi] = process.argv.slice(2);
  const prochest = (f) => (f && existsSync(f) ? readFileSync(f, 'utf8') : null);
  let r;
  try {
    if (komanda === 'sekrety' && argi.length === 0) r = sekrety(process.env);
    else if (komanda === 'domen' && argi.length === 0) r = await domen({ poluchit: poluchitSetyu, pervyi: process.env.SERPENT_FIRST === 'on' });
    else if (komanda === 'papka' && (argi.length === 1 || argi.length === 2) && existsSync(argi[0])) r = papka(readFileSync(argi[0], 'utf8'), prochest(argi[1]));
    else if (komanda === 'indeks' && argi.length <= 1) r = indeks(prochest(argi[0]));
    else if (komanda === 'sverka-dist' && argi.length === 2 && existsSync(argi[0]) && existsSync(argi[1])) r = sverkaDist(argi[0], JSON.parse(readFileSync(argi[1], 'utf8')));
    else if (komanda === 'pereschet' && argi.length === 2 && existsSync(argi[0]) && existsSync(argi[1])) r = pereschet(readFileSync(argi[0], 'utf8'), argi[1]);
    else if (komanda === 'spisok' && (argi.length === 1 || argi.length === 2) && existsSync(argi[0])) {
      console.log(JSON.stringify({ ...(argi[1] ? { sborka: argi[1] } : {}), ...spisokSborki(argi[0]) }, null, 1));
      process.exit(0);
    } else {
      console.error('команды: sekrety | domen | papka <список> [<index.html>] | indeks [<index.html>] | sverka-dist <dist> <список> | pereschet <find> <dist> | spisok <dist> [<метка>]');
      process.exit(2);
    }
  } catch (e) {
    console.error(`сторож не смог прочесть вход: ${e.message}`);
    process.exit(2);
  }
  for (const s of r.stroki) console.log(s);
  process.exit(r.ok ? 0 : 1);
}
