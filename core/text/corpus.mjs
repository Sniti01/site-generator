/**
 * УКАЗАТЕЛЬ КОРПУСА — все скачанные документы корпуса сайта, 8-граммы в двух режимах
 * (П102 блок А; прежний — `ukazatel` сторожа брифов второго сайта).
 *
 * КОРПУС — `input/corpus/` сайта: `manifest.jsonl` (последняя запись адреса — действующая)
 * и сырые файлы `raw/**` вне git. Документ — запись с `outcome: ok` и файлом. ГРОМКО:
 * нет манифеста, нет папки `raw/` или нет хоть одного файла, который манифест называет
 * скачанным, — ошибка с числом и первыми именами. Судья без корпуса или с половиной корпуса
 * сказал бы «чужих фраз нет» о том, чего не видел; выключателя нет (П102: «без корпуса сторож
 * 8 слов громко отказывает»).
 *
 * ТЕКСТ ДОКУМЕНТА — `izvlechDokument` (одно извлечение с текстом страниц): `<title>` и видимый
 * текст `<body>`, два прочтения строчных тегов; оба идут в указатель.
 *
 * СТРОЕНИЕ. Хеши 8-грамм — отсортированный `Float64Array` на режим (поиск делением пополам)
 * и рядом — номер первого документа с этой 8-граммой (порядок манифеста). Совпадение хеша
 * ПОДТВЕРЖДАЕТСЯ словами этого документа: документ читается и извлекается заново (только на
 * совпадении, их единицы на странице) — столкновение хешей находкой не становится.
 *
 * КЕШ. Извлечение parse5 по 612 документам второго сайта — около 30 секунд, а указатель нужен
 * каждой сборке и каждой пробе на копии сайта. Готовые хеши кладутся в кеш вне git (по умолчанию —
 * временная папка системы, `site-generator-ukazatel/`); ключ — SHA-256 манифеста, имён сайта,
 * исходников `core/text/*.mjs` и версии parse5. Новый снимок корпуса, другие имена или правка
 * извлечения — другой ключ и пересчёт. ПРЕДЕЛ: подменённый сырой файл без правки манифеста ключ
 * не меняет (сырьё пишет только `fetch-corpus.mjs`, и он же пишет манифест с SHA-256 файла);
 * подтверждение совпадения читает сырьё заново и тогда видит правду.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { izvlechDokument } from './extract.mjs';
import { N_GRAM, REZHIMY, slova, imenaSlovami, bezImen, vRezhime, hesh } from './words.mjs';

/** Ошибка корпуса: судить не по чему (итог судьи не выдаётся). */
export class OshibkaKorpusa extends Error {}

/**
 * Документы корпуса: `[{ url, fajl }]` по последним записям манифеста со скачанным файлом.
 * Бросает `OshibkaKorpusa`, если манифеста, папки `raw/` или хоть одного файла нет.
 */
export function dokumentyKorpusa(papka) {
  const man = join(papka, 'manifest.jsonl');
  if (!existsSync(man)) throw new OshibkaKorpusa(`нет манифеста корпуса ${man}`);
  const posl = new Map();
  for (const s of readFileSync(man, 'utf8').split('\n')) {
    if (!s.trim()) continue;
    const r = JSON.parse(s);
    posl.set(r.url, r);
  }
  const docs = [...posl.values()].filter((r) => r.outcome === 'ok' && r.file).map((r) => ({ url: r.url, fajl: join(papka, r.file) }));
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

/** Текст сырого документа: gzip, если имя кончается на `.gz`. */
const syroy = (fajl) => {
  const b = readFileSync(fajl);
  return (fajl.endsWith('.gz') ? gunzipSync(b) : b).toString('utf8');
};

/** Слова документа в двух прочтениях, со свёрнутыми именами. */
const slovaDokumenta = (t, imSl) => [t.vplotnuyu, t.cherezProbel].map((p) => bezImen(slova(p), imSl));

/**
 * Хеши и первые документы по режимам: `{ tochno: { h: Float64Array, d: Uint32Array }, srez: … }`.
 * Документы идут по одному (`slovaPoNomeru(d)` — слова двух прочтений), слова не копятся.
 */
function postroitHeshi(n, slovaPoNomeru) {
  const vse = Object.fromEntries(REZHIMY.map((r) => [r, []]));
  for (let d = 0; d < n; d++) {
    const prochteniya = slovaPoNomeru(d);
    for (const r of REZHIMY) {
      // Повторы внутри документа (два прочтения почти всюду равны) снимаются сразу — пар меньше.
      const svoi = new Set();
      for (const ws0 of prochteniya) {
        const ws = vRezhime(ws0, r);
        for (let i = 0; i + N_GRAM <= ws.length; i++) svoi.add(hesh(ws.slice(i, i + N_GRAM).join(' ')));
      }
      for (const x of svoi) vse[r].push([x, d]);
    }
  }
  const out = {};
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
 * или `null`.
 */
function ukazatel(urls, heshi, slovaPoNomeru) {
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
    nayti(g, rezhim) {
      const d = poisk(heshi[rezhim], hesh(g));
      if (d < 0) return null;
      return normy(d)[rezhim].some((n) => n.includes(` ${g} `)) ? urls[d] : null;
    },
  };
}

/**
 * Указатель по готовым текстам (для проб и тестов): `teksty` — `[{ url, vplotnuyu, cherezProbel }]`
 * (потоки документов, как у `izvlechDokument`), `imena` — имена сайта.
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

/** Версия извлечения для ключа кеша: исходники `core/text/*.mjs` и версия parse5. */
function versiya() {
  const zdes = dirname(fileURLToPath(import.meta.url));
  const h = createHash('sha256');
  for (const f of readdirSync(zdes).filter((x) => x.endsWith('.mjs') && !x.endsWith('.test.mjs')).sort()) h.update(f).update(readFileSync(join(zdes, f)));
  const req = createRequire(import.meta.url);
  h.update(JSON.parse(readFileSync(join(dirname(req.resolve('parse5')), '..', 'package.json'), 'utf8')).version);
  return h.digest('hex');
}

/** Папка кеша по умолчанию — временная папка системы. */
export const KESH_PO_UMOLCHANIYU = join(tmpdir(), 'site-generator-ukazatel');

/**
 * Указатель корпуса сайта: папка `input/corpus`, имена сайта. Ошибки корпуса — громко.
 * `kesh` — папка кеша (`null` — без кеша). Возвращает и `izKesha` — был ли указатель в кеше.
 */
export function ukazatelKorpusa(papka, { imena = [], kesh = KESH_PO_UMOLCHANIYU } = {}) {
  const docs = dokumentyKorpusa(papka);
  const imSl = imenaSlovami(imena);
  const slovaPoNomeru = (d) => slovaDokumenta(izvlechDokument(syroy(docs[d].fajl)), imSl);
  const klyuch = createHash('sha256')
    .update(readFileSync(join(papka, 'manifest.jsonl')))
    .update('\0' + imena.join('\n') + '\0' + versiya())
    .digest('hex');
  const fajlKesha = kesh ? join(kesh, `${klyuch}.json.gz`) : null;
  if (fajlKesha && existsSync(fajlKesha)) {
    const k = JSON.parse(gunzipSync(readFileSync(fajlKesha)).toString('utf8'));
    const iz = (b64, T) => new T(new Uint8Array(Buffer.from(b64, 'base64')).buffer);
    const heshi = Object.fromEntries(REZHIMY.map((r) => [r, { h: iz(k[r].h, Float64Array), d: iz(k[r].d, Uint32Array) }]));
    if (k.urls.length === docs.length && k.urls.every((u, i) => u === docs[i].url)) return { ...ukazatel(k.urls, heshi, slovaPoNomeru), izKesha: true };
  }
  const heshi = postroitHeshi(docs.length, slovaPoNomeru);
  const urls = docs.map((d) => d.url);
  if (fajlKesha) {
    mkdirSync(kesh, { recursive: true });
    const b64 = (a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
    const vremennyi = `${fajlKesha}.${process.pid}.tmp`;
    writeFileSync(vremennyi, gzipSync(JSON.stringify({ urls, ...Object.fromEntries(REZHIMY.map((r) => [r, { h: b64(heshi[r].h), d: b64(heshi[r].d) }])) })));
    renameSync(vremennyi, fajlKesha);
  }
  return { ...ukazatel(urls, heshi, slovaPoNomeru), izKesha: false };
}
