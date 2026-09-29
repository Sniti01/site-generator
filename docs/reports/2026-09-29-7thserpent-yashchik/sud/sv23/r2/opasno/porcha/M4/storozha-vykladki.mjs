#!/usr/bin/env node
/**
 * СТОРОЖА ВЫКЛАДКИ 7thserpent.com — их зовёт `.github/workflows/deploy-7thserpent.yml` (П106, шаг 5): выкладка
 * GitHub Actions → FTPS по форме `deploy-ac4bf.yml` (П54 п. 4 и дополнение). Сторож — функция над тем, что
 * workflow уже получил (вывод `lftp`, скачанный `index.html`, ответы домена, `dist/`), и строка вердикта; код 0 —
 * проход, 1 — отказ (выкладка не идёт или не засчитана), 2 — ошибка входа. Сеть — только у сторожа домена
 * (`fetch`); к серверу FTP сторожа не ходят — это делает `lftp` в workflow. Значения секретов не печатаются.
 * «Судью судят», раунды 1–3 (SV1-*, SV2-*, SV3-* — в пробах): папка робота — белым списком по первому уровню
 * сборки и карте прежней выкладки, глубина — по `find .` после суда корня; «первая выкладка» — по входу или по
 * серверу (наш index.html и все ключевые файлы; index.html workflow кладёт последним); «не привязан» — только по
 * положительным признакам; сверка сборки — с нормализацией cid и имён CSS по содержимому с метками HTML, битые
 * ссылки и метки cid — отказ. Сессия 23 (П108): вход SERPENT_DOMAIN_BOUND («домен привязан — согласен») у сторожа
 * домена — при первой выкладке он печатает, что отвечает домен, и не останавливает, если домен отвечает по обоим
 * именам с этого хоста (раунд 1 «судью судят» — SV23-O-1, O-2, Z-1); вход действует только в первой попытке запуска
 * (github.run_attempt, SV23-O-6); строки ответа в журнал — без управляющих знаков и команд раннера (SV23-O-3).
 *
 *   node tools/storozha-vykladki.mjs sekrety                 — секреты на месте (SERPENT_FTP_*, SERPENT_CORPUS_KEY);
 *                                                              логин, хост и порт — без знаков, ломающих команду lftp;
 *                                                              робот — не робот первого сайта (AC4BF_FTP_USER)
 *   node tools/storozha-vykladki.mjs pervaya [<index.html> [<find>]]  — первая ли выкладка: вход SERPENT_FIRST=on
 *                                                              или на сервере нет нашей завершённой выкладки;
 *                                                              pervaya=on|off — в GITHUB_OUTPUT
 *   node tools/storozha-vykladki.mjs domen                   — «домен уже привязан?» (бэклог 46 п. 2); SERPENT_PERVAYA=on|off
 *                                                              обязателен; при первой выкладке домен, который отвечает
 *                                                              или не проверяется, — отказ, а при SERPENT_DOMAIN_BOUND=on
 *                                                              (владелец согласен, П108) и ответе обоих имён с этого
 *                                                              хоста — строки ответа, выкладка идёт
 *   node tools/storozha-vykladki.mjs papka <список> [<index.html> [<dist> [<карта>]]]  — папка робота (`cls -1 -a -F`
 *                                                              в корне; первый уровень dist и принятого списка,
 *                                                              карта — sitemap-0.xml прежней выкладки)
 *   node tools/storozha-vykladki.mjs indeks [<index.html>]   — удалённый index.html до `mirror`: только наш
 *   node tools/storozha-vykladki.mjs glubina <find> <index.html> <dist> [<карта> [<ошибки find>]]  — внутри папок
 *                                                              сайта чужого нет (после papka и indeks)
 *   node tools/storozha-vykladki.mjs sverka-dist <dist> <список сборки>  — первая выкладка: dist CI = принятый
 *   node tools/storozha-vykladki.mjs pereschet <find> <dist> — после выкладки: файлы на сервере = dist
 *   node tools/storozha-vykladki.mjs spisok <dist> [<метка>] — список файлов и sha256 сборки (JSON в вывод);
 *                                                              так пишется gates/sborka-prinyataya.json — сборка,
 *                                                              принятая сессией (правка сайта до первой выкладки —
 *                                                              новый список, иначе первая выкладка — стоп)
 *
 * Пробы — `tools/testy/storozha-vykladki.test.mjs`: образцы вывода `lftp` и ответов домена, без сети.
 * Пределы: пересчёт после выкладки сверяет имена файлов, не размеры (формат длинного списка lftp у этого сервера
 * не измерен); запись файлов — через временное имя (`xfer:use-temp-file` в workflow). Прямые файлы `_astro/`
 * на сервере глубина считает ассетами прежних сборок, не сверяя. Два файла CSS, различные только значением cid,
 * которого нет в HTML, получают одно имя после нормализации — сверка тогда различает их по сырому пути (ложный
 * отказ, не пропуск). Поведение lftp (`-X`, `-x`, код `mirror` при ошибке файла, stderr `find`) здесь не измерено.
 */

import { readFileSync, readdirSync, statSync, existsSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SAYT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const KANON = 'https://www.7thserpent.com/';
export const HOSTY = ['www.7thserpent.com', '7thserpent.com'];
/** Файлы, без которых выкладка не засчитана, — как у первого сайта, плюс /privacy/. */
export const KLYUCHEVYE = ['index.html', 'robots.txt', '.htaccess', '404/index.html', 'privacy/index.html', 'sitemap-index.xml', 'sitemap-0.xml'];

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
  // Значения — как их подставит workflow, без обрезки краёв (SV2-Z-7): пробел или перевод строки по краям тоже ломают вход.
  if (!/^\d{1,5}$/.test(String(env.SERPENT_FTP_PORT))) return itog(false, ['СТОП: SERPENT_FTP_PORT — не номер порта (только цифры, без пробелов и переводов строки по краям)']);
  if (!/^[A-Za-z0-9.-]+$/.test(String(env.SERPENT_FTP_HOST))) {
    return itog(false, ['СТОП: SERPENT_FTP_HOST — не имя хоста: только буквы, цифры, «.» и «-», без схемы ftp://, логина и порта — из строки доступа панели вставь часть между «@» и «:»']);
  }
  if (!/^[A-Za-z0-9._@-]+$/.test(String(env.SERPENT_FTP_USER))) {
    return itog(false, ['СТОП: SERPENT_FTP_USER — в логине кавычка, пробел, перевод строки или другой знак, ломающий строку команды lftp; вставь логин из строки доступа панели (до «@») без пробелов по краям']);
  }
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
 * Первая ли выкладка (SV1-O-2, SV2-O-3): вход SERPENT_FIRST=on — или на сервере нет нашей завершённой выкладки: нет
 * нашего index.html (нет файла, заглушка, чужой) или нет хоть одного ключевого файла (`find .` до выкладки; первая
 * выкладка, оборванная после index.html, — всё ещё первая). Защита первой выкладки не держится на одном слове входа.
 */
export function pervayaVykladka(vkhod, indexHtml, findTekst) {
  if (vkhod === 'on') return { pervaya: true, pochemu: 'вход SERPENT_FIRST=on' };
  if (!nashIndex(indexHtml)) return { pervaya: true, pochemu: indexHtml === null || indexHtml === undefined ? 'на сервере нет index.html' : 'index.html на сервере не наш' };
  if (findTekst === null || findTekst === undefined) return { pervaya: true, pochemu: 'списка файлов сервера нет — не понять, закончена ли прежняя выкладка' };
  const naServere = new Set(razobratFind(findTekst));
  const net = KLYUCHEVYE.filter((f) => !naServere.has(f));
  if (net.length) return { pervaya: true, pochemu: `на сервере нет ключевых файлов (${net.join(', ')}) — прежняя выкладка не закончена` };
  return { pervaya: false, pochemu: 'на сервере наша завершённая выкладка (index.html с canonical главной и все ключевые файлы)' };
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
/** Коды ошибок сертификата и TLS у fetch Node (SV23-O-1, Z-1): такое имя браузер откроет только с предупреждением. */
const SERTIFIKAT = /^(ERR_TLS_|ERR_SSL_|CERT_|DEPTH_ZERO_|SELF_SIGNED_|UNABLE_TO_|HOSTNAME_MISMATCH)/;
/** Знак кода по его номеру; вне Юникода — «�». */
const znak = (n) => (Number.isInteger(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '�');
const IMENOVANNYE = { laquo: '«', raquo: '»', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…' };
/**
 * `<title>` ответа одной строкой (П108: при согласии владельца сторож печатает ответ домена; SV23-Z-5): вне комментариев,
 * скриптов, стилей и `<svg>`, до `</title>`, сущности раскрыты, пробелы сжаты, обрез по кодовым точкам с «…».
 */
function zagolovokOtveta(telo) {
  const t = String(telo).replace(/<!--[\s\S]*?(-->|$)/g, ' ').replace(/<(script|style|svg|template|noscript)\b[\s\S]*?<\/\1\s*>/gi, ' ');
  const m = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(t);
  if (!m) return '';
  const s = m[1]
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => znak(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => znak(Number(d)))
    .replace(/&([a-z]+);/gi, (v, i) => IMENOVANNYE[i.toLowerCase()] ?? v)
    .replace(/\s+/g, ' ')
    .trim();
  const z = [...s];
  return z.length > 100 ? `${z.slice(0, 100).join('')}…` : s;
}
/** Строка в публичный журнал GitHub (SV23-O-3): без управляющих и невидимых знаков, без начала команд раннера `##[` и `::`. */
const bezopasno = (s) => String(s).replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/##\[/, '# #[').replace(/::/g, ': :');

/**
 * Что отвечает хост: идём по редиректам (не больше 5 скачков) до конечного ответа. «Не привязан» — только по
 * положительным признакам (SV1-O-3): имя хоста не разрешается (ENOTFOUND на первом запросе) или 404 с измеренной
 * заглушкой хостера «Website <этот хост> not configured» (доклад 2026-09-15, первый сайт). Всё прочее — «отвечает»:
 * наша сборка, чужая страница, пустой каталог (403, 404 сервера), редирект куда угодно, в том числе на негодный адрес
 * (SV23-Z-4 — строка, а не код 2); «не понять» — ошибки сети и временные ошибки имени (EAI_AGAIN, таймаут) и ошибки
 * сертификата (отдельная причина, SV23-Z-1) — при первой выкладке это стоп. `svoy` — ответ пришёл с имени сайта и без
 * чужого canonical: только такой ответ покрывает согласие владельца (SV23-O-2).
 */
export async function sostoyanieHosta(poluchit, host) {
  let url = `https://${host}/`;
  const put = [];
  for (let skachok = 0; skachok <= 5; skachok += 1) {
    const r = await poluchit(url);
    if (r.oshibka) {
      put.push(`${url} — сеть: ${r.oshibka}`);
      if (r.oshibka === 'ENOTFOUND' && skachok === 0) return { sostoyanie: 'не привязан', pochemu: 'имя не разрешается', put };
      if (r.oshibka === 'ENOTFOUND') return { sostoyanie: 'отвечает', pochemu: 'домен отвечает редиректом на имя, которого нет', put, svoy: false };
      if (SERTIFIKAT.test(r.oshibka)) return { sostoyanie: 'не понять', pochemu: `ошибка сертификата ${r.oshibka} — https по этому имени браузер откроет только с предупреждением`, put, sertifikat: true };
      return { sostoyanie: 'не понять', pochemu: `ошибка сети ${r.oshibka}`, put };
    }
    put.push(`${url} — ${r.status}`);
    if ([301, 302, 303, 307, 308].includes(r.status) && r.location) {
      try {
        url = new URL(r.location, url).href;
      } catch {
        return { sostoyanie: 'отвечает', pochemu: `редирект ${r.status} на негодный адрес «${String(r.location).slice(0, 100)}»`, put, svoy: false };
      }
      continue;
    }
    // Заглушка — в тексте тела без тегов и с неразрывными пробелами как пробелами (SV2-Z-6); имя — любое наше.
    const tekHost = new URL(url).host;
    const tekst = String(r.telo).replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;|&#xa0;| /gi, ' ');
    const imena = HOSTY.map(esc).join('|');
    if (r.status === 404 && HOSTY.includes(tekHost) && new RegExp(`Website\\s+(?:${imena})\\s+not\\s+configured`, 'i').test(tekst)) {
      return { sostoyanie: 'не привязан', pochemu: 'заглушка хостера «not configured»', put };
    }
    const zagolovok = zagolovokOtveta(r.telo);
    const chuzhoyKanon = canonicalOf(r.telo).find((h) => {
      try {
        return !HOSTY.includes(new URL(h, url).host);
      } catch {
        return true;
      }
    });
    const svoyKhost = HOSTY.includes(tekHost);
    return {
      sostoyanie: 'отвечает',
      pochemu: `ответ ${r.status}${zagolovok ? ` — «${zagolovok}»` : ''}${chuzhoyKanon === undefined ? '' : `, canonical чужого сайта ${chuzhoyKanon}`}${svoyKhost ? '' : `, конечный хост ${tekHost} — не имя сайта`}`,
      put,
      svoy: svoyKhost && chuzhoyKanon === undefined,
    };
  }
  return { sostoyanie: 'отвечает', pochemu: 'больше 5 редиректов', put, svoy: false };
}

/**
 * Вход «домен привязан — согласен» (SERPENT_DOMAIN_BOUND, П108): `on` — владелец знает, что домен привязан, и согласен
 * на первую выкладку в домен, который уже отвечает; `off`, пусто или нет входа — нет; иное — `null` (ошибка входа).
 */
export function soglasieIzVkhoda(znachenie) {
  if (znachenie === undefined || znachenie === '' || znachenie === 'off') return false;
  if (znachenie === 'on') return true;
  return null;
}

const SERT_V_PANELI = 'выпусти сертификат Let\'s Encrypt в панели хостера для обоих имён — .htaccess ведёт всех на https, без сертификата сайт не откроется; затем запусти снова';
/**
 * «Домен уже привязан?» по обоим хостам; `pervyi` — первая выкладка (признак `pervaya`); `soglasen` — вход
 * SERPENT_DOMAIN_BOUND=on (П108). Согласие покрывает домен, который отвечает по обоим именам с этого хоста (SV23-O-1, O-2,
 * Z-1): тогда первая выкладка идёт, ответ напечатан. Ошибка сети или сертификата, неразрешимое имя, чужой конечный хост
 * или canonical, петля, негодный редирект — стоп и со входом, с причиной. Без входа — стоп, как до сессии 23; вход
 * предлагается, только когда домен отвечает. Строки — через `bezopasno` (журнал GitHub публичный, SV23-O-3).
 */
export async function domen({ poluchit, pervyi, soglasen = false, hosty = HOSTY }) {
  const stroki = [];
  const vse = [];
  for (const h of hosty) {
    const s = await sostoyanieHosta(poluchit, h);
    vse.push(s);
    stroki.push(bezopasno(`${h}: ${s.sostoyanie === 'не привязан' ? 'не привязан' : s.sostoyanie.toUpperCase()} — ${s.pochemu} (${s.put.join(' → ')})`));
  }
  const sost = vse.map((s) => s.sostoyanie);
  if (sost.every((s) => s === 'не привязан')) return itog(true, [...stroki, 'домен не привязан: выкладка ляжет в каталог сайта, домен её не покажет']);
  if (!pervyi) {
    if (!sost.includes('отвечает')) return itog(true, [...stroki, 'не удалось узнать, отвечает ли домен; выкладка не первая — идёт']);
    return itog(true, [...stroki, 'домен отвечает: выкладка обновит живой сайт']);
  }
  const sertifikat = vse.some((s) => s.sertifikat);
  if (soglasen) {
    if (vse.every((s) => s.sostoyanie === 'отвечает' && s.svoy)) {
      return itog(true, [...stroki, 'первая выкладка: владелец согласен, что домен привязан (вход SERPENT_DOMAIN_BOUND = on, П108), оба имени отвечают с этого хоста (что — в строках выше) — выкладка идёт']);
    }
    const prichina = sertifikat
      ? `https — с ошибкой сертификата: ${SERT_V_PANELI}`
      : sost.includes('не понять')
        ? 'по имени не удалось получить ответ (сеть, таймаут) — повтори запуск; повторяется — проверь записи DNS домена в панели хостера'
        : sost.includes('не привязан')
          ? 'одно из имён не привязано — привяжи оба имени к сайту в панели хостера'
          : 'домен ведёт не на этот сайт (конечный хост, canonical или редирект — в строках выше) — проверь привязку в панели хостера';
    return itog(false, [...stroki, `СТОП: первая выкладка со входом SERPENT_DOMAIN_BOUND = on, но согласие покрывает только домен, который отвечает по обоим именам с этого хоста: ${prichina}.`]);
  }
  if (sost.includes('отвечает')) {
    return itog(false, [...stroki, 'СТОП: первая выкладка, а домен уже отвечает — выкладка сразу сделает сайт живым (П52 п. 3). Выясни в панели хостера, что отвечает; если домен привязан намеренно и ты согласен — новый запуск кнопкой Run workflow (не Re-run: повтор согласия не несёт) со входом SERPENT_DOMAIN_BOUND = on (П108).']);
  }
  return itog(false, [...stroki, sertifikat ? `СТОП: первая выкладка, а https домена — с ошибкой сертификата: ${SERT_V_PANELI}.` : 'СТОП: первая выкладка, а не удалось узнать, отвечает ли домен (временная ошибка имени или таймаут) — повтори запуск; повторяется — проверь записи DNS домена в панели хостера.']);
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

/** Служебные папки хостера: их не стирает `mirror` (исключения в workflow), не считает пересчёт; папкой или ссылкой. */
export const SLUZHEBNYE = ['.well-known', 'cgi-bin'];
const pokhozheNaDomen = (s) => /^[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+$/u.test(s) && !s.startsWith('.');
/** Расширения файлов, которые не домены верхнего уровня (SV3-Z-3): такие имена в строке отказа печатаются. */
const FAJL = /\.(html?|php\d?|png|jpe?g|gif|svg|ico|webp|avif|css|js|mjs|map|txt|xml|json|webmanifest|log|bak|old|orig|tmp|ini|conf|pdf|gz|tar|sql)$/i;
/** Имена для строки отказа: имена доменов аккаунта не печатаются — только их число. */
const pokazatImena = (a) => {
  const vidno = a.filter((x) => !pokhozheNaDomen(x) || FAJL.test(x));
  const skryto = a.length - vidno.length;
  return [vidno.slice(0, 3).join(', '), skryto ? `${skryto} с именами доменов` : ''].filter(Boolean).join(' и ');
};

/** Страницы карты сайта прежней выкладки на нашем хосте: пути `<loc>` (`/max-payne-4/`). */
export function stranitsyKarty(karta) {
  if (karta === null || karta === undefined) return [];
  return [...String(karta).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)]
    .map((m) => {
      try {
        const u = new URL(m[1]);
        return u.origin === new URL(KANON).origin ? decodeURIComponent(u.pathname) : null;
      } catch {
        return null;
      }
    })
    .filter((p) => p && p !== '/');
}

/**
 * Папка робота — белым списком (SV1-O-1, SV2-O-1): отказ — папки с именами доменов (и кириллицей), `www` в любом
 * регистре, с косой и без, ссылки (`@`, кроме служебных), `index.*` кроме ровно `index.html`, корень первого сайта,
 * служебная папка хостера в самой сборке (SV3-Z-6: mirror её не выложит). Проход — пустой корень; свежий каталог
 * хостера (только `index.html` — его судит `indeks` — и служебные папки); прежняя наша выкладка (`index.html`
 * с canonical главной), в которой каждая запись корня — имя первого уровня сборки (`verkh`: `dist/` и принятый
 * список), папка страницы из карты сайта прежней выкладки (`karta` — её `sitemap-0.xml`, SV3-Z-1), служебная папка
 * или временный файл lftp для файла сборки (`.in.<имя>.`, SV3-O-2). Только имена сборки без index.html — оборванная
 * первая выкладка или файлы хостера с теми же именами: отказ со своей причиной (SV2-Z-1, SV3-Z-2). Всё прочее —
 * непустой каталог без нашей сборки: отказ, потому что `mirror --delete` стёр бы его.
 */
export function papka(spisokTekst, indexHtml, verkh = [], karta = null) {
  const imena = razobratSpisok(spisokTekst);
  const bez = (s) => s.replace(/[/@]$/, '');
  const sluzhVSborke = verkh.filter((n) => SLUZHEBNYE.includes(n));
  if (sluzhVSborke.length) {
    return itog(false, [`СТОП: в сборке служебная папка хостера (${sluzhVSborke.join(', ')}) — mirror её не выкладывает и не стирает (исключена, чтобы не тронуть папку хостера), пересчёт её не считает; такая сборка на сервер целиком не ляжет. Убери её из public/ сайта или вынеси владельцу, как её выкладывать.`]);
  }
  const katalogi = imena.filter((s) => s.endsWith('/')).map(bez);
  const ssylki = imena.filter((s) => s.endsWith('@')).map(bez).filter((s) => !SLUZHEBNYE.includes(s));
  const domeny = katalogi.filter(pokhozheNaDomen);
  if (domeny.length) {
    return itog(false, [`СТОП: в корне робота папки с именами доменов (${domeny.length}) — робот видит аккаунт целиком, а не каталог сайта. Поправь «Каталог доступу» пользователя FTP на 7thserpent.com/www.`]);
  }
  if (imena.some((s) => bez(s).toLowerCase() === 'www')) {
    return itog(false, ['СТОП: в корне робота папка www — робот стоит в каталоге домена, а не в его корневом каталоге. Поправь «Каталог доступу» на 7thserpent.com/www.']);
  }
  if (ssylki.length) {
    return itog(false, [`СТОП: в корне робота ссылка (${pokazatImena(ssylki)}) — в сборке ссылок нет, mirror --delete заменил бы её; удали ссылку в файловом менеджере панели.`]);
  }
  const drugieIndex = imena.filter((s) => /^index\./i.test(bez(s)) && s !== 'index.html');
  if (drugieIndex.length) {
    return itog(false, [`СТОП: в корне робота ${drugieIndex.join(', ')} — страница чужого сайта или заглушка не той формы; mirror --delete стёр бы её. Удали в файловом менеджере, если это заглушка хостера.`]);
  }
  const vse = imena.map(bez);
  const nashVerkh = new Set([...verkh, ...SLUZHEBNYE]);
  const nash = nashIndex(indexHtml);
  // Папки страниц прежней выкладки — только из её карты и только при нашем index.html.
  const staryePapki = new Set(nash ? stranitsyKarty(karta).map((p) => p.split('/')[1]).filter(Boolean) : []);
  const svoyo = (s) => {
    const n = bez(s);
    if (nashVerkh.has(n)) return true;
    if (s.endsWith('/') && staryePapki.has(n)) return true;
    // Временный файл lftp (`xfer:temp-file-name` по умолчанию `.in.*.`) — только файлом и только для имени сборки.
    const vr = /^\.in\.(.+)\.$/.exec(s);
    return Boolean(vr && verkh.includes(vr[1]));
  };
  const vneSborki = imena.filter((s) => !svoyo(s)).map(bez);
  if (imena.includes('index.html')) {
    if (indexHtml === null || indexHtml === undefined) return itog(false, ['СТОП: index.html в корне есть, а его содержимого сторож не получил — не понять, чей это сайт.']);
    if (canonicalOf(indexHtml).some((h) => PERVYI_SAYT.test(h))) {
      return itog(false, ['СТОП: в корне робота — сайт ac4bf-thewatch.com (canonical его index.html). Это каталог первого сайта; mirror --delete стёр бы его.']);
    }
    if (nash) {
      if (vneSborki.length) {
        return itog(false, [`СТОП: рядом с нашей сборкой записи, которых нет ни в этой сборке, ни в карте сайта прежней выкладки (${vneSborki.length}: ${pokazatImena(vneSborki)}) — mirror --delete стёр бы их. Если это наши старые файлы — удали их в файловом менеджере панели; если чужие — проверь «Каталог доступу» и содержимое 7thserpent.com/www.`]);
      }
      return itog(true, [`папка робота: наша сборка (index.html с canonical главной), записей ${imena.length}, чужих нет`]);
    }
  }
  if (!imena.length) return itog(true, ['папка робота: пустой корень — первая выкладка']);
  if (vse.every((s) => s === 'index.html' || SLUZHEBNYE.includes(s))) {
    return itog(true, [`папка робота: свежий каталог хостера — ${[imena.includes('index.html') && 'заглушка index.html (её судит сторож index.html)', vse.some((s) => s !== 'index.html') && `служебные папки ${vse.filter((s) => s !== 'index.html').join(', ')}`].filter(Boolean).join('; ')}`]);
  }
  if (!imena.includes('index.html') && vneSborki.length === 0) {
    return itog(false, [`СТОП: в корне робота только имена нашей сборки, без index.html (${vse.length} записей) — оборванная первая выкладка или файлы хостера с теми же именами (.htaccess, favicon.ico); чьи они — не понять. Удали содержимое 7thserpent.com/www в файловом менеджере панели и запусти выкладку снова (вход SERPENT_FIRST=on).`]);
  }
  return itog(false, [`СТОП: в корне робота непустой каталог без нашей сборки (${vse.length} записей, например ${pokazatImena(vneSborki.length ? vneSborki : vse)}) — чужой сайт, не тот каталог или файлы хостера (.htaccess, favicon.ico — удали их в файловом менеджере панели); mirror --delete стёр бы его. Проверь «Каталог доступу» и содержимое 7thserpent.com/www.`]);
}

/** Удалённый index.html до `mirror`: нет — проход; есть — только с одним canonical, равным KANON. */
export function indeks(indexHtml) {
  if (indexHtml === null || indexHtml === undefined) return itog(true, ['index.html на сервере нет — первая выкладка в пустой каталог']);
  if (nashIndex(indexHtml)) return itog(true, [`index.html на сервере — наш (canonical ${KANON})`]);
  // Пуст или без `</html>` и без canonical (SV1-Z-6, SV2-Z-3): не наша сборка — заглушка хостера или повреждённый файл
  // (наша выкладка пишет через временное имя и обрубка под настоящим именем не оставляет).
  const k = canonicalOf(indexHtml);
  if (!indexHtml.trim() || (!k.length && /^\s*(<!doctype|<html)/i.test(indexHtml) && !/<\/html\s*>/i.test(indexHtml))) {
    return itog(false, ['СТОП: index.html на сервере пуст или без </html> и без canonical — не наша сборка (заглушка хостера или повреждённый файл); удали его в файловом менеджере панели и запусти выкладку снова.']);
  }
  if (!k.length) return itog(false, ['СТОП: index.html на сервере без canonical — заглушка хостера или чужая страница; если это заглушка хостера — удали её в файловом менеджере панели (mirror --delete заменил бы чужой сайт).']);
  return itog(false, [`СТОП: index.html на сервере не наш — canonical ${k.join(', ')} (ждём ровно ${KANON}). mirror --delete заменил бы чужой сайт.`]);
}

/**
 * Глубина (SV3-O-3): корень судит `papka` по `cls`, а `mirror --delete` стирает и то, что лежит внутри наших папок.
 * `find .` сервера — после суда корня (SV3-O-4); каждый файл глубже корня — файл сборки (`fajly`), прямой файл
 * `_astro/` (ассеты прежних сборок), содержимое служебной папки хостера, временный файл lftp для файла сборки
 * (`<папка>/.in.<имя>.`), служебный файл NFS (`.nfs…`) или `index.html` страницы из карты сайта прежней выкладки (при
 * нашем index.html). Прочее — отказ: чужое внутри наших папок. Ошибки `find` (их текст workflow пишет в файл, не
 * в журнал) — отказ: список сервера неполон. Файлы корня здесь не судятся.
 */
export function glubina(findTekst, indexHtml, fajly, karta = null, oshibki = '') {
  if (String(oshibki ?? '').trim()) {
    const s = String(oshibki).trim().split(/\r?\n/);
    return itog(false, [`СТОП: find . на сервере закончился с ошибками (${s.length} строк; первая: ${s[0].slice(0, 200)}) — список файлов сервера неполон, глубину не проверить. Повтори запуск; повторяется — проверь права пользователя FTP на 7thserpent.com/www.`]);
  }
  const est = new Set(fajly);
  const stranitsy = new Set(nashIndex(indexHtml) ? stranitsyKarty(karta).map((p) => `${p.replace(/^\/|\/$/g, '')}/index.html`) : []);
  const chuzhie = razobratFind(findTekst).filter((f) => {
    if (!f.includes('/') || est.has(f)) return false;
    if (SLUZHEBNYE.some((s) => f.startsWith(`${s}/`))) return false;
    if (/^_astro\/[^/]+$/.test(f)) return false;
    const imya = f.slice(f.lastIndexOf('/') + 1);
    const papkaF = f.slice(0, f.lastIndexOf('/') + 1);
    const vr = /^\.in\.(.+)\.$/.exec(imya);
    if (vr && est.has(papkaF + vr[1])) return false;
    if (/^\.nfs[0-9A-Za-z]+$/.test(imya)) return false;
    return !stranitsy.has(f);
  });
  if (chuzhie.length) {
    return itog(false, [`СТОП: внутри папок сайта файлы, которых нет ни в этой сборке, ни в карте сайта прежней выкладки (${chuzhie.length}: ${chuzhie.slice(0, 5).join(', ')}${chuzhie.length > 5 ? ', …' : ''}) — mirror --delete стёр бы их. Если это наши старые файлы — удали их в файловом менеджере панели; если чужие — выясни, откуда они.`]);
  }
  return itog(true, ['глубина: внутри папок сайта чужого нет (файлы сборки, прежние ассеты _astro/, страницы карты прежней выкладки, служебное)']);
}

/* ---------- сборка ---------- */

const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const CID = /data-astro-cid-([a-z0-9]+)/g;
const CSS_S_KHESHEM = /^(_astro\/.+)\.[A-Za-z0-9_-]{8}\.css$/;
const TEKST = /\.(html|css|js|mjs|xml|txt|svg|json|webmanifest)$/i;
const SSYLKA_ASTRO = /\/_astro\/[^"'\s)<>?#,*$]+/g;
/** Текст, где ищутся ссылки (SV3-Z-5): без комментариев; robots.txt и прочие .txt — шаблоны путей, не ссылки. */
const mestaSsylok = (p, t) => {
  if (/\.txt$/i.test(p)) return '';
  if (/\.(html|xml|svg)$/i.test(p)) return t.replace(/<!--[\s\S]*?-->/g, '');
  if (/\.css$/i.test(p)) return t.replace(/\/\*[\s\S]*?\*\//g, '');
  return t;
};

/**
 * Список файлов сборки: `{ fajlov, fajly: { путь: sha256 }, norm: { путь после нормализации: sha256 после
 * нормализации }, bityeSsylki, metkiCid }`. Нормализация (SV1-Z-1, раунды 2–3 — SV2-O-5, SV2-O-6, SV2-Z-2, SV3-O-6,
 * SV3-Z-4): компилятор Astro считает `data-astro-cid` компонента от его пути, а для компонентов ядра (вне корня
 * сайта) — от абсолютного пути, поэтому сборка CI (`/home/runner/work/…`) отличается от принятой (`D:/SEO/cloud/…`)
 * значениями cid и именами CSS, чей хеш считается от содержимого с ними. Поэтому:
 *   - значения cid — порядковыми метками по первому появлению в HTML (по порядку путей), затем в прочих текстах
 *     по нормализованным путям (все cid, с точностью до согласованного переименования);
 *   - имя `_astro/<имя>.<хеш>.css` → `_astro/<имя>.#<sha256 содержимого, где cid — метки HTML>.css` (cid, которого
 *     в HTML нет, — `*`): два файла CSS, различные только значением cid, получают разные имена, и перестановка
 *     ссылок между ними видна (SV3-O-6); в текстах заменяются только точные имена этих файлов (ссылка на файл,
 *     которого нет, остаётся сырой и даёт расхождение);
 * всё прочее сверяется побайтно. `bityeSsylki` — ссылки `/_astro/…` на файлы, которых в сборке нет (в HTML, XML,
 * SVG и CSS — без комментариев; в .txt не ищутся); `metkiCid` — тексты, где буквально стоит `data-astro-cid-#`
 * (метка нормализации в сырой сборке) — оба — отказ сверки и код 1 у `spisok`.
 */
export function spisokSborki(dist) {
  const puti = obhod(dist).map((x) => relative(dist, x).replace(/\\/g, '/')).sort();
  const est = new Set(puti);
  const baity = new Map(puti.map((p) => [p, readFileSync(join(dist, p))]));
  const cid = new Map();
  const metka = (v) => {
    if (!cid.has(v)) cid.set(v, cid.size + 1);
    return cid.get(v);
  };
  for (const p of puti) if (p.endsWith('.html')) for (const m of baity.get(p).toString('utf8').matchAll(CID)) metka(m[1]);
  const izHtml = new Set(cid.keys());
  const imyaCss = new Map();
  for (const p of puti) {
    const m = CSS_S_KHESHEM.exec(p);
    if (!m) continue;
    const t = baity.get(p).toString('utf8').replace(CID, (_, v) => `data-astro-cid-${izHtml.has(v) ? `#${cid.get(v)}` : '*'}`);
    imyaCss.set(p, `${m[1]}.#${sha(Buffer.from(t)).slice(0, 12)}.css`);
  }
  const normPut = (p) => imyaCss.get(p) ?? p;
  const zamenaCss = (t) => [...imyaCss].reduce((s, [a, b]) => s.split(a).join(b), t);
  const poryadok = [...puti].sort((a, b) => {
    const [ha, hb] = [a.endsWith('.html') ? 0 : 1, b.endsWith('.html') ? 0 : 1];
    if (ha !== hb) return ha - hb;
    return normPut(a) < normPut(b) ? -1 : normPut(a) > normPut(b) ? 1 : 0;
  });
  const fajly = {};
  const norm = {};
  const bityeSsylki = [];
  const metkiCid = [];
  for (const p of poryadok) {
    const b = baity.get(p);
    fajly[p] = sha(b);
    let n = b;
    if (TEKST.test(p)) {
      const t = b.toString('utf8');
      if (t.includes('data-astro-cid-#')) metkiCid.push(p);
      for (const m of mestaSsylok(p, t).matchAll(SSYLKA_ASTRO)) if (!est.has(m[0].slice(1))) bityeSsylki.push(`${p} → ${m[0]}`);
      n = Buffer.from(zamenaCss(t).replace(CID, (_, v) => `data-astro-cid-#${metka(v)}`), 'utf8');
    }
    const kl = normPut(p);
    norm[kl in norm ? `${kl}~${p}` : kl] = sha(n);
  }
  const uporyad = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
  return { fajlov: puti.length, fajly: uporyad(fajly), norm: uporyad(norm), bityeSsylki: [...new Set(bityeSsylki)], metkiCid };
}

/** Сборка CI против принятой: те же пути и sha256 после нормализации cid и имён CSS; битых ссылок и меток нет. */
export function sverkaDist(dist, prinyatyi) {
  if (!prinyatyi || typeof prinyatyi.norm !== 'object' || prinyatyi.norm === null) throw new Error('в списке принятой сборки нет поля norm');
  const ci = spisokSborki(dist);
  const [sei, prin] = [ci.norm, prinyatyi.norm];
  const net = Object.keys(prin).filter((f) => !(f in sei));
  const lishnie = Object.keys(sei).filter((f) => !(f in prin));
  const inye = Object.keys(prin).filter((f) => f in sei && sei[f] !== prin[f]);
  const syrye = Object.keys(prinyatyi.fajly ?? {}).filter((f) => ci.fajly[f] !== prinyatyi.fajly[f]).length;
  if (!net.length && !lishnie.length && !inye.length && !ci.bityeSsylki.length && !ci.metkiCid.length) {
    return itog(true, [`сборка CI = принятая (${prinyatyi.sborka ?? '—'}): ${ci.fajlov} файлов, sha256 те же${syrye ? `; побайтно иных ${syrye} — только значения data-astro-cid (все, с точностью до согласованного переименования) и хеши имён CSS: путь ядра на раннере другой` : ', побайтно'}`]);
  }
  const pokazat = (a) => (a.length ? `${a.length}: ${a.slice(0, 8).join(', ')}${a.length > 8 ? ', …' : ''}` : '0');
  return itog(false, [
    `СТОП: сборка CI не равна принятой (${prinyatyi.sborka ?? '—'}) — нет ${pokazat(net)}; лишние ${pokazat(lishnie)}; иные байты ${pokazat(inye)}; битые ссылки /_astro/ ${pokazat(ci.bityeSsylki)}; метки cid в сырой сборке ${pokazat(ci.metkiCid)} (сверка — после нормализации cid и имён CSS). Сервер не тронут.`,
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

/** После выкладки: файлы на сервере = файлы dist (набором), ключевые — на месте; служебные файлы сервера — названы;
 *  служебные папки хостера (`.well-known/`, `cgi-bin/` — их mirror не трогает, SV2-O-2) не считаются ни на сервере,
 *  ни в dist (SV3-Z-6; служебную папку в сборке останавливает сторож папки до выкладки). */
export function pereschet(findTekst, dist) {
  const neSluzh = (f) => !SLUZHEBNYE.some((s) => f === s || f.startsWith(`${s}/`));
  const naServere = new Set(razobratFind(findTekst).filter(neSluzh));
  const lokalno = new Set(Object.keys(spisokSborki(dist).fajly).filter(neSluzh));
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
    else if (komanda === 'pervaya' && argi.length <= 2) {
      // На GitHub признак обязан попасть в выход шага: без GITHUB_OUTPUT — ошибка входа, а не «да» без выхода (SV2-O-4).
      if (process.env.GITHUB_ACTIONS === 'true' && !process.env.GITHUB_OUTPUT) {
        console.error('нет GITHUB_OUTPUT — признак первой выкладки некуда записать');
        process.exit(2);
      }
      const p = pervayaVykladka(process.env.SERPENT_FIRST ?? 'off', prochest(argi[0]), prochest(argi[1]));
      if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `pervaya=${p.pervaya ? 'on' : 'off'}\n`);
      r = itog(true, [`первая выкладка: ${p.pervaya ? 'да' : 'нет'} — ${p.pochemu}`]);
    } else if (komanda === 'domen' && argi.length === 0) {
      // Признак первой выкладки обязателен (SV2-Z-5): без него «первая» или «нет» — догадка.
      if (!['on', 'off'].includes(process.env.SERPENT_PERVAYA ?? '')) {
        console.error('не задан признак первой выкладки: SERPENT_PERVAYA=on|off (выход шага «Первая выкладка?»)');
        process.exit(2);
      }
      // Вход «домен привязан — согласен» (П108): только on, off или пусто — иное — ошибка входа до сети.
      const soglasen = soglasieIzVkhoda(process.env.SERPENT_DOMAIN_BOUND);
      if (soglasen === null) {
        console.error('SERPENT_DOMAIN_BOUND — только on или off (вход «домен привязан — согласен»)');
        process.exit(2);
      }
      r = await domen({ poluchit: poluchitSetyu, pervyi: process.env.SERPENT_PERVAYA === 'on', soglasen });
    } else if (komanda === 'papka' && argi.length >= 1 && argi.length <= 4 && existsSync(argi[0])) {
      // Первый уровень сборки: dist (третий аргумент) и принятый список сайта (SV2-O-1); карта прежней выкладки — четвёртый.
      const verkh = new Set();
      if (argi[2] && existsSync(argi[2])) for (const n of readdirSync(argi[2])) verkh.add(n);
      const prin = join(SAYT, 'gates/sborka-prinyataya.json');
      if (existsSync(prin)) for (const f of Object.keys(JSON.parse(readFileSync(prin, 'utf8')).fajly ?? {})) verkh.add(f.split('/')[0]);
      r = papka(readFileSync(argi[0], 'utf8'), prochest(argi[1]), [...verkh], prochest(argi[3]));
    } else if (komanda === 'glubina' && argi.length >= 3 && argi.length <= 5 && existsSync(argi[0]) && existsSync(argi[2])) {
      r = glubina(readFileSync(argi[0], 'utf8'), prochest(argi[1]), Object.keys(spisokSborki(argi[2]).fajly), prochest(argi[3]), prochest(argi[4]));
    }
    else if (komanda === 'indeks' && argi.length <= 1) r = indeks(prochest(argi[0]));
    else if (komanda === 'sverka-dist' && argi.length === 2 && existsSync(argi[0]) && existsSync(argi[1])) r = sverkaDist(argi[0], JSON.parse(readFileSync(argi[1], 'utf8')));
    else if (komanda === 'pereschet' && argi.length === 2 && existsSync(argi[0]) && existsSync(argi[1])) r = pereschet(readFileSync(argi[0], 'utf8'), argi[1]);
    else if (komanda === 'spisok' && (argi.length === 1 || argi.length === 2) && existsSync(argi[0])) {
      const s = spisokSborki(argi[0]);
      console.log(JSON.stringify({ ...(argi[1] ? { sborka: argi[1] } : {}), ...s }, null, 1));
      // Список битой сборки принятым не пишется (SV3-Z-5): его сверка отказала бы на CI.
      if (s.bityeSsylki.length || s.metkiCid.length) {
        console.error(`СТОП: в сборке битые ссылки /_astro/ (${s.bityeSsylki.length}) или метки cid (${s.metkiCid.length}) — список не годится в принятые`);
        process.exit(1);
      }
      process.exit(0);
    } else {
      console.error('команды: sekrety | pervaya [<index.html> [<find>]] | domen | papka <список> [<index.html> [<dist> [<карта>]]] | glubina <find> <index.html> <dist> [<карта> [<ошибки find>]] | indeks [<index.html>] | sverka-dist <dist> <список> | pereschet <find> <dist> | spisok <dist> [<метка>]');
      process.exit(2);
    }
  } catch (e) {
    console.error(`сторож не смог прочесть вход: ${e.message}`);
    process.exit(2);
  }
  for (const s of r.stroki) console.log(s);
  process.exit(r.ok ? 0 : 1);
}
