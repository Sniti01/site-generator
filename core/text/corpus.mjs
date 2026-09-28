/**
 * УКАЗАТЕЛЬ КОРПУСА — все скачанные документы корпуса сайта, 8-граммы в двух режимах
 * (П102 блок А; прежний — `ukazatel` сторожа брифов второго сайта).
 *
 * КОРПУС — `input/corpus/` сайта: `manifest.jsonl` (последняя запись адреса — действующая; порядок
 * документов — порядок первого появления адреса) и сырые файлы `raw/**` вне git. Документ — запись
 * с `outcome: ok` и файлом. ГРОМКО (`OshibkaKorpusa`): нет манифеста или строка его не читается
 * (с номером строки); нет папки `raw/` или хоть одного файла, который манифест называет скачанным;
 * документы есть, а 8-грамм в них ноль (извлечение сломалось или корпус из пустых оболочек). Судья
 * без корпуса или с половиной корпуса сказал бы «чужих фраз нет» о том, чего не видел; выключателя
 * нет (П102: «без корпуса сторож 8 слов громко отказывает»).
 *
 * ТЕКСТ ДОКУМЕНТА — `izvlechDokument` (одно извлечение с текстом страниц): `<title>` и строки
 * `<body>`, два прочтения строчных тегов; оба идут в указатель. Слова — по строке, как у страницы
 * (адреса пробелом, имена сайта одним словом), затем строки сводятся в один поток. Кодировка —
 * BOM, затем `charset` записи манифеста (метка WHATWG: `iso-8859-1` — это windows-1252); без метки —
 * валидный UTF-8 как UTF-8, иначе `<meta charset>` головы, иначе windows-1252 (`tekstSyrya`). Прежний
 * довод предела «`<meta charset>` не читается — у корпуса три документа с `iso-8859-1`, байтов выше
 * 0x7F в них нет» был неверен: проверялись только документы с меткой в HTTP, а документ blu-ray.com
 * без метки — windows-1252 с `<meta http-equiv>`, и его фраза с «façades» не ловилась (раунд 3, A3-1).
 *
 * СТРОЕНИЕ. Хеши 8-грамм — отсортированный `Float64Array` на режим (поиск делением пополам)
 * и рядом — номер первого документа с этой 8-граммой. Совпадение хеша ПОДТВЕРЖДАЕТСЯ словами этого
 * документа: документ читается и извлекается заново (только на совпадении, их единицы на странице),
 * так что столкновение хешей находкой не становится. ПРЕДЕЛ: подтверждается только первый документ
 * хеша — если 8-грамма `g` есть в документе d2, а её 53-битный хеш совпал с другой 8-граммой
 * документа d1 < d2, находки не будет (пар-столкновений в корпусе около n²/2^54 ≈ 6·10⁻⁵ на режим
 * при n ≈ 10⁶; прежний указатель проверял все документы).
 *
 * КЕШ. Извлечение parse5 по 612 документам второго сайта — около 30 секунд, а указатель нужен
 * каждой сборке и каждой пробе на копии сайта. Готовые хеши кладутся в кеш вне git (по умолчанию —
 * временная папка системы, `site-generator-ukazatel/`); ключ — SHA-256 байтов манифеста, байтов
 * каждого сырого файла (в порядке документов), имён сайта (JSON), исходников `core/text/*.mjs`
 * на момент загрузки модуля, версий parse5 и `entities`, версии Node и её таблиц Юникода; ключ лежит
 * и внутри файла. Испорченный или несогласованный файл кеша (чужой ключ, пустой режим, длины, порядок
 * хешей, номера документов) — пересчёт, не вечный отказ и не ложное «чисто»; ошибка записи кеша судью
 * не роняет (указатель уже посчитан), временный файл при перехваченной ошибке убирается сразу,
 * брошенный убитым процессом — уборкой через час; сырьё, сменившееся во время построения, и исходники
 * `core/text`, сменившиеся после загрузки, в кеш не пишутся. Имя файла начинается отпечатком
 * настоящего пути папки корпуса (ссылка копии сайта ведёт к тому же кешу): после записи убираются
 * старые файлы только этого корпуса и файлы прежнего формата (раунды 2 и 3 «судью судят», A2-5…A2-10,
 * A3-2…A3-5).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync, unlinkSync, realpathSync, statSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { izvlechDokument } from './extract.mjs';
import { N_GRAM, REZHIMY, slova, imenaSlovami, bezImen, vRezhime, hesh, bezAdresov } from './words.mjs';

/** Ошибка корпуса: судить не по чему (итог судьи не выдаётся). */
export class OshibkaKorpusa extends Error {}

/** Манифест: байты (для ключа кеша) и действующие записи по адресу в порядке первого появления. */
function chitatManifest(papka) {
  const man = join(papka, 'manifest.jsonl');
  if (!existsSync(man)) throw new OshibkaKorpusa(`нет манифеста корпуса ${man}`);
  const bajty = readFileSync(man);
  const posl = new Map();
  bajty
    .toString('utf8')
    .split('\n')
    .forEach((s, i) => {
      if (!s.trim()) return;
      let r;
      try {
        r = JSON.parse(s);
      } catch (e) {
        throw new OshibkaKorpusa(`манифест ${man}: строка ${i + 1} не читается (${e.message})`);
      }
      posl.set(r.url, r);
    });
  return { man, bajty, zapisi: [...posl.values()] };
}

/**
 * Документы корпуса: `[{ url, fajl, charset }]` по последним записям манифеста со скачанным файлом.
 * Бросает `OshibkaKorpusa`, если манифеста, папки `raw/` или хоть одного файла нет.
 */
export function dokumentyKorpusa(papka) {
  return proverennye(papka, chitatManifest(papka));
}

function proverennye(papka, { man, zapisi }) {
  const docs = zapisi
    .filter((r) => r.outcome === 'ok' && r.file)
    .map((r) => ({ url: r.url, fajl: join(papka, r.file), charset: /charset=([^;\s]+)/i.exec(r.content_type ?? '')?.[1] ?? null }));
  if (!docs.length) throw new OshibkaKorpusa(`в манифесте ${man} нет ни одного скачанного документа`);
  if (!existsSync(join(papka, 'raw'))) {
    throw new OshibkaKorpusa(`нет папки ${join(papka, 'raw')} — сырой корпус вне git; соберите его (npm run corpus) — без корпуса сторож не судит`);
  }
  const net = docs.filter((d) => !existsSync(d.fajl));
  if (net.length) {
    throw new OshibkaKorpusa(
      `корпус неполон: нет ${net.length} из ${docs.length} файлов, скачанных по манифесту (${net.slice(0, 3).map((d) => d.fajl).join(', ')}…) — соберите корпус заново`
    );
  }
  return docs;
}

/** Байты сырого документа (gzip — если имя кончается на `.gz`). */
const bajtySyrya = (fajl) => {
  const b = readFileSync(fajl);
  return fajl.endsWith('.gz') ? gunzipSync(b) : b;
};

/** Декодер по метке WHATWG или `null` (метка неизвестна). */
const dekoder = (metka) => {
  try {
    return new TextDecoder(metka.toLowerCase().replace(/^["']|["']$/g, ''));
  } catch {
    return null;
  }
};

/**
 * Текст сырого документа: BOM главнее метки (WHATWG «decode», раунд 2, A2-4), затем `charset` записи
 * (метка WHATWG). Без метки или с неизвестной (раунд 3, A3-1: документ blu-ray.com корпуса второго
 * сайта — windows-1252 без метки в HTTP, с `<meta http-equiv>`): байты — валидный UTF-8 — UTF-8
 * (строже браузера, который поверил бы `<meta>`: намеренный текст документа); иначе `<meta charset>`
 * или `http-equiv` головы (до `<body>` в первых 8 КБ); иначе windows-1252 (запасная браузера для
 * латинской локали).
 */
function tekstSyrya(bajty, charset) {
  if (bajty[0] === 0xef && bajty[1] === 0xbb && bajty[2] === 0xbf) return new TextDecoder('utf-8').decode(bajty);
  if (bajty[0] === 0xfe && bajty[1] === 0xff) return new TextDecoder('utf-16be').decode(bajty);
  if (bajty[0] === 0xff && bajty[1] === 0xfe) return new TextDecoder('utf-16le').decode(bajty);
  const poMetke = charset ? dekoder(charset) : null;
  if (poMetke) return poMetke.decode(bajty);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bajty);
  } catch {
    // не UTF-8 — ищем метку в голове
  }
  const golova = bajty.subarray(0, 8192).toString('latin1').split(/<body\b/i)[0];
  const m = /<meta\b[^>]*?charset\s*=\s*["']?\s*([-\w.:]+)/i.exec(golova);
  const poMeta = m ? dekoder(m[1]) : null;
  return (poMeta ?? new TextDecoder('windows-1252')).decode(bajty);
}

/** Текст документа корпуса (`{ fajl, charset }` из `dokumentyKorpusa`) — как его читает указатель. */
export const tekstDokumentaKorpusa = (d) => tekstSyrya(bajtySyrya(d.fajl), d.charset);

/**
 * Слова документа в двух прочтениях: строки делятся на слова по одной (адреса пробелом, имена
 * одним словом — как строка страницы), затем сводятся в поток. `t.vplotnuyu` и `t.cherezProbel` —
 * списки строк или одна строка.
 */
const slovaDokumenta = (t, imSl) => [t.vplotnuyu, t.cherezProbel].map((p) => [p].flat().flatMap((s) => bezImen(slova(bezAdresov(s)), imSl)));

/**
 * Хеши и первые документы по режимам: `{ tochno: { h: Float64Array, d: Uint32Array }, srez: …,
 * pustyh }` (`pustyh` — документов без единой 8-граммы, A2-14). Документы идут по одному
 * (`slovaPoNomeru(d)` — слова двух прочтений), слова не копятся.
 */
function postroitHeshi(n, slovaPoNomeru) {
  const vse = Object.fromEntries(REZHIMY.map((r) => [r, []]));
  let pustyh = 0;
  for (let d = 0; d < n; d++) {
    const prochteniya = slovaPoNomeru(d);
    for (const r of REZHIMY) {
      // Повторы внутри документа (два прочтения почти всюду равны) снимаются сразу — пар меньше.
      const svoi = new Set();
      for (const ws0 of prochteniya) {
        const ws = vRezhime(ws0, r);
        for (let i = 0; i + N_GRAM <= ws.length; i++) svoi.add(hesh(ws.slice(i, i + N_GRAM).join(' ')));
      }
      if (r === 'tochno' && !svoi.size) pustyh += 1;
      for (const x of svoi) vse[r].push([x, d]);
    }
  }
  const out = { pustyh };
  for (const r of REZHIMY) {
    const pary = vse[r];
    pary.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const h = [];
    const dd = [];
    for (const [x, d] of pary) {
      if (h.length && h[h.length - 1] === x) continue;
      h.push(x);
      dd.push(d);
    }
    out[r] = { h: Float64Array.from(h), d: Uint32Array.from(dd) };
  }
  return out;
}

/** Номер первого документа с хешем или -1. */
function poisk({ h, d }, x) {
  let lo = 0;
  let hi = h.length - 1;
  while (lo <= hi) {
    const m = (lo + hi) >>> 1;
    if (h[m] === x) return d[m];
    if (h[m] < x) lo = m + 1;
    else hi = m - 1;
  }
  return -1;
}

/**
 * Указатель из хешей и способа достать слова документа по номеру (для подтверждения).
 * `nayti(g, rezhim)` — адрес документа, где 8-грамма `g` (слова через пробел, уже в режиме) есть,
 * или `null`. Пустой указатель — громкий отказ.
 */
function ukazatel(urls, heshi, slovaPoNomeru) {
  if (REZHIMY.every((r) => heshi[r].h.length === 0)) {
    throw new OshibkaKorpusa(`в корпусе ${urls.length} документов, а 8-грамм — ни одной: извлечение сломалось или документы — пустые оболочки`);
  }
  const pamyat = new Map();
  const normy = (d) => {
    if (!pamyat.has(d)) {
      const pr = slovaPoNomeru(d);
      pamyat.set(d, Object.fromEntries(REZHIMY.map((r) => [r, pr.map((ws) => ` ${vRezhime(ws, r).join(' ')} `)])));
    }
    return pamyat.get(d);
  };
  return {
    dokumentov: urls.length,
    pustyh: heshi.pustyh,
    vosmigramm: Object.fromEntries(REZHIMY.map((r) => [r, heshi[r].h.length])),
    nayti(g, rezhim) {
      const d = poisk(heshi[rezhim], hesh(g));
      if (d < 0) return null;
      return normy(d)[rezhim].some((n) => n.includes(` ${g} `)) ? urls[d] : null;
    },
  };
}

/**
 * Указатель по готовым текстам (для проб и тестов): `teksty` — `[{ url, vplotnuyu, cherezProbel }]`
 * (строки документов, как у `izvlechDokument`, или по одной строке), `imena` — имена сайта.
 */
export function ukazatelIzTekstov(teksty, { imena = [] } = {}) {
  const imSl = imenaSlovami(imena);
  const slovaPoNomeru = (d) => slovaDokumenta(teksty[d], imSl);
  return ukazatel(
    teksty.map((t) => t.url),
    postroitHeshi(teksty.length, slovaPoNomeru),
    slovaPoNomeru
  );
}

/**
 * Версия извлечения для ключа кеша: исходники `core/text/*.mjs`, parse5, entities, Node и Юникод.
 * Ключ берёт версию, снятую при загрузке модуля (`VERSIYA`): указатель строит загруженный код, а не
 * исходники на диске; сменились исходники после загрузки — кеш не пишется (раунд 3, A3-5).
 */
function versiya() {
  const zdes = dirname(fileURLToPath(import.meta.url));
  const h = createHash('sha256');
  for (const f of readdirSync(zdes).filter((x) => x.endsWith('.mjs') && !x.endsWith('.test.mjs')).sort()) h.update(f).update(readFileSync(join(zdes, f)));
  const req = createRequire(import.meta.url);
  const p5 = join(dirname(req.resolve('parse5')), '..');
  h.update(readFileSync(join(p5, 'package.json')));
  const ent = createRequire(join(p5, 'package.json')).resolve('entities');
  for (let d = dirname(ent); d !== dirname(d); d = dirname(d)) {
    if (existsSync(join(d, 'package.json')) && JSON.parse(readFileSync(join(d, 'package.json'), 'utf8')).name === 'entities') {
      h.update(readFileSync(join(d, 'package.json')));
      break;
    }
  }
  h.update(`${process.version} ${process.versions.unicode ?? ''} ${process.versions.icu ?? ''}`);
  return h.digest('hex');
}
const VERSIYA = versiya();

/** Папка кеша по умолчанию — временная папка системы. */
export const KESH_PO_UMOLCHANIYU = join(tmpdir(), 'site-generator-ukazatel');

/**
 * Хеши из кеша, проверенные на согласованность (раунд 2, A2-6; раунд 3, A3-2): ключ внутри файла —
 * ключ этого корпуса; у каждого режима 8-граммы есть, длины `h` и `d` равны, `h` строго растёт,
 * номер документа меньше их числа; `pustyh` — целое от 0 до числа документов — иначе `null` (пересчёт).
 */
function heshiIzKesha(k, n, klyuch) {
  if (k?.klyuch !== klyuch) return null;
  const iz = (b64, T) => new T(new Uint8Array(Buffer.from(String(b64), 'base64')).buffer);
  if (!Number.isInteger(k.pustyh) || k.pustyh < 0 || k.pustyh > n) return null;
  const heshi = { pustyh: k.pustyh };
  for (const r of REZHIMY) {
    const h = iz(k[r]?.h ?? '', Float64Array);
    const d = iz(k[r]?.d ?? '', Uint32Array);
    if (!h.length || h.length !== d.length) return null;
    for (let i = 0; i < h.length; i++) if (d[i] >= n || (i && !(h[i] > h[i - 1]))) return null;
    heshi[r] = { h, d };
  }
  return heshi;
}

/**
 * Указатель корпуса сайта: папка `input/corpus`, имена сайта. Ошибки корпуса — громко.
 * `kesh` — папка кеша (`null` — без кеша). Возвращает и `izKesha` — был ли указатель в кеше,
 * `oshibkaKesha` — текст ошибки чтения, записи или уборки кеша (судья её печатает, но не падает).
 * Файл кеша — `<отпечаток папки корпуса>-<ключ>.json.gz`: уборка трогает только файлы своего
 * корпуса, кеш второго сайта в общей папке не вытесняется (A2-5). `chitat` — чтение сырого файла
 * (шов для теста смены сырья во время построения, A2-10).
 */
export function ukazatelKorpusa(papka, { imena = [], kesh = KESH_PO_UMOLCHANIYU, chitat = readFileSync } = {}) {
  const manifest = chitatManifest(papka);
  const docs = proverennye(papka, manifest);
  const imSl = imenaSlovami(imena);
  const slovaIz = (b, d) => slovaDokumenta(izvlechDokument(tekstSyrya(docs[d].fajl.endsWith('.gz') ? gunzipSync(b) : b, docs[d].charset)), imSl);
  const slovaPoNomeru = (d) => slovaIz(chitat(docs[d].fajl), d);
  const otpechatki = docs.map((d) => createHash('sha256').update(chitat(d.fajl)).digest('hex'));
  // Имена — JSON: одно имя с переводом строки и два имени — разные ключи (A3-3).
  const klyuch = createHash('sha256').update(manifest.bajty).update(otpechatki.join('')).update('\0' + JSON.stringify(imena) + '\0' + VERSIYA).digest('hex');
  // Отпечаток папки — по настоящему пути: копия сайта со ссылкой на корпус берёт кеш корпуса (A3-4).
  const put = realpathSync(resolve(papka));
  const prefiks = createHash('sha256').update(process.platform === 'win32' ? put.toLowerCase() : put).digest('hex').slice(0, 16);
  const fajlKesha = kesh ? join(kesh, `${prefiks}-${klyuch}.json.gz`) : null;
  const urls = docs.map((d) => d.url);
  const oshibki = [];
  if (fajlKesha && existsSync(fajlKesha)) {
    try {
      const heshi = heshiIzKesha(JSON.parse(gunzipSync(readFileSync(fajlKesha)).toString('utf8')), docs.length, klyuch);
      if (heshi) return { ...ukazatel(urls, heshi, slovaPoNomeru), izKesha: true, oshibkaKesha: null };
      oshibki.push(`кеш ${fajlKesha} несогласован — пересчёт`);
    } catch (e) {
      oshibki.push(`кеш ${fajlKesha} не читается (${e.message}) — пересчёт`);
    }
  }
  // Указатель строится по тем же байтам сырья, что вошли в ключ: сырьё сменилось во время построения
  // (npm run corpus параллельно) — кеш не пишется (A2-10).
  let syryoMenyalos = false;
  const heshi = postroitHeshi(docs.length, (d) => {
    const b = chitat(docs[d].fajl);
    if (createHash('sha256').update(b).digest('hex') !== otpechatki[d]) syryoMenyalos = true;
    return slovaIz(b, d);
  });
  const uk = ukazatel(urls, heshi, slovaPoNomeru);
  if (fajlKesha && syryoMenyalos) oshibki.push('сырьё корпуса менялось во время построения указателя — кеш не записан');
  else if (fajlKesha && versiya() !== VERSIYA) oshibki.push('исходники core/text менялись после загрузки судьи — кеш не записан');
  else if (fajlKesha) {
    const vremennyi = `${fajlKesha}.${process.pid}.tmp`;
    try {
      mkdirSync(kesh, { recursive: true });
      const b64 = (a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
      writeFileSync(vremennyi, gzipSync(JSON.stringify({ klyuch, pustyh: heshi.pustyh, ...Object.fromEntries(REZHIMY.map((r) => [r, { h: b64(heshi[r].h), d: b64(heshi[r].d) }])) })));
      renameSync(vremennyi, fajlKesha);
      // Уборка: прежние файлы этого корпуса, файлы прежнего формата (без отпечатка папки) и временные
      // файлы этого корпуса старше часа (убитый процесс, A3-4).
      try {
        for (const f of readdirSync(kesh)) {
          const p = join(kesh, f);
          const svoy = f.startsWith(`${prefiks}-`);
          if ((svoy && /\.json\.gz$/.test(f) && p !== fajlKesha) || /^[0-9a-f]{64}\.json\.gz$/.test(f)) unlinkSync(p);
          else if (svoy && /\.tmp$/.test(f) && Date.now() - statSync(p).mtimeMs > 3600 * 1000) unlinkSync(p);
        }
      } catch (e) {
        oshibki.push(`старые файлы кеша не убраны (${e.message})`);
      }
    } catch (e) {
      oshibki.push(`кеш не записан (${e.message})`);
      try {
        if (existsSync(vremennyi)) unlinkSync(vremennyi);
      } catch {
        // временный файл уберёт следующая запись
      }
    }
  }
  return { ...uk, izKesha: false, oshibkaKesha: oshibki.length ? oshibki.join('; ') : null };
}
