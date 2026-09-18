/**
 * Адаптер чтения кластеризации: xlsx конвейера семантики → разобранные листы.
 *
 * Модуль без побочных эффектов и без зависимостей. Живёт в ядре, потому что
 * формат выгрузки общий для фабрики, а не свойство одного сайта: тот же
 * читатель нужен и инструменту разведки сайта, и гейту структуры.
 * **Какой именно файл читать — данные сайта**, поле `site.semantics`
 * в его `structure/structure.json`; ядро держит счёт, сайт — объявление.
 * Тот же раздел ответственности, что у гейта ресурсов.
 *
 * **Два формата выгрузки, один выход.** Потребители — гейт структуры,
 * инструменты разведки и дерева — читают не xlsx, а выход адаптера:
 * `phrases[] {phrase, cluster, google, urls, …}`, `clusters[] {name, phrases,
 * google, topPhrase, …}`, `meta`. Какой формат прочитан, говорит
 * `meta.format`:
 *
 *   `google` — четыре листа («Clustering», «Кластеры», «Не сопоставлено»,
 *              «Легенда»); объём — колонка «Google, ср/мес»; сводная
 *              кластеров — с листа «Кластеры». Первый сайт (П25).
 *   `volume` — один лист «Clustering»; объём — колонка «Частотность»;
 *              сводной нет: `clusters[]` считается группировкой строк
 *              по «Название группы». Второй сайт (П62 п. 5, П63 п. 2).
 *
 * Формат опознаётся по наличию листа «Кластеры», не по имени файла.
 * Поле объёма зовётся `google` в обоих форматах — так его читают
 * потребители; чей это объём на самом деле, называет `meta.volumeColumn`
 * (у второго сайта — Ahrefs US, П63 п. 2). Переименование поля — правка
 * контракта, слово владельца (бэклог 52 п. 1).
 *
 * Форма выхода одна, смысл двух полей сводной — нет, и потребителю это
 * знать нужно: у формата `google` `clusters[].google` — сумма листа
 * «Кластеры» (с дедупликацией конвейера, она меньше суммы по строкам),
 * `topPhrase` — нормализованная фраза Google, часто не равная ни одной
 * фразе листа; у формата `volume` и то и другое считается по строкам.
 *
 * **Источник истины у формата `google` — колонки Google.** WS-колонки
 * в выгрузке оставлены для сравнения и в решениях не используются; так
 * сказано на листе «Легенда» и повторено в `docs/04_STRUCTURE_DECISIONS.md`.
 * Адаптер их отдаёт, но рядом с `google`, чтобы расхождение было видно,
 * а не чтобы по нему считать. У формата `volume` полей WS нет — нули.
 *
 * **Сводные колонки формата `volume` — не источник.** «Фраз в группе»
 * и «Частотность группы» — агрегаты кластеризатора, и в выгрузке
 * 2026-09-18 первая даёт 1 у «Некластеризовано» при 59 строках. Число
 * фраз и сумма объёма считаются по строкам; эти колонки требуются
 * (это и есть формат), но не читаются.
 *
 * **Читалка отказывает, а не молчит.** Пустой запрос, пустое имя группы,
 * повтор запроса, повтор заголовка колонки — отказ с номером строки листа
 * (по атрибуту `r`, не по счёту): каждое из них молча ушло бы в учёт гейта
 * структуры. Пустая строка листа (все ячейки пусты) — не данные, она
 * пропускается. Самозакрытые ячейки `<c …/>` и строки `<row …/>` — так
 * Excel пишет пустые стилевые ячейки при пересохранении — читаются как
 * пустые, а не глотают соседа (состязательная проверка 2026-09-18).
 *
 * Зависимостей нет: xlsx — это zip с XML, читается своим кодом. Тот же
 * приём заперт внутри `tools/fetch-corpus.mjs` первого сайта: тот скрипт
 * на импорте начинает качать корпус, и позвать его функции нельзя. Копия
 * инструмента у второго сайта читает через этот адаптер (бэклог 52 п. 6).
 *
 * Самопроверка: `node core/structure/clustering.mjs --selftest` собирает
 * мини-xlsx в памяти (по формату, с самозакрытыми ячейками, формулами
 * и составным текстом) и гоняет читалку по ним и по отказам. Читалка —
 * вход гейта структуры; судья без пробы — обещание, а не проверка.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { inflateRawSync, deflateRawSync, crc32 } from 'node:zlib';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/* ---------------------------------------------------------------- *
 * zip → карта «имя файла в архиве → буфер»
 * ---------------------------------------------------------------- */

function unzip(buf) {
  // Конец центрального каталога ищем с хвоста: комментарий бывает непустым.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65536; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('не найден конец центрального каталога zip');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);

  const files = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('битая запись каталога zip');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;

    // Локальный заголовок: длины полей имени и extra там свои.
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const chunk = buf.subarray(start, start + compSize);
    files.set(name, method === 0 ? chunk : inflateRawSync(chunk));
  }
  return files;
}

/* ---------------------------------------------------------------- *
 * XML листа → строки ячеек
 * ---------------------------------------------------------------- */

const unesc = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');

// `<t>` только парный: `<t/>` (пустой прогон составного текста) иначе
// проглатывал бы разметку до следующего `</t>`.
const TEXT_RE = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
const textOf = (xml) => [...xml.matchAll(TEXT_RE)].map((t) => unesc(t[1])).join('');

function sharedStrings(files) {
  const out = [];
  const ss = files.get('xl/sharedStrings.xml');
  if (!ss) return out; // в этой выгрузке значения записаны прямо в ячейках
  for (const m of ss.toString('utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)) out.push(textOf(m[1]));
  return out;
}

/** Имя листа → путь внутри архива: порядок `sheetN.xml` ничего не гарантирует. */
function sheetPaths(files) {
  const wb = files.get('xl/workbook.xml').toString('utf8');
  const rels = files.get('xl/_rels/workbook.xml.rels').toString('utf8');
  const target = new Map();
  for (const m of rels.matchAll(/<Relationship([^>]*)\/>/g)) {
    const id = (m[1].match(/Id="([^"]+)"/) || [])[1];
    const t = (m[1].match(/Target="([^"]+)"/) || [])[1];
    if (id && t) target.set(id, t.startsWith('/') ? t.slice(1) : `xl/${t.replace(/^\.\//, '')}`);
  }
  const out = new Map();
  for (const m of wb.matchAll(/<sheet([^>]*)\/>/g)) {
    const name = unesc((m[1].match(/name="([^"]+)"/) || [])[1] || '');
    const rid = (m[1].match(/r:id="([^"]+)"/) || [])[1];
    if (name && target.has(rid)) out.set(name, target.get(rid));
  }
  return out;
}

/** Номер строки листа у разобранной строки — для отказов с адресом. */
export const ROW = Symbol('row');

// Строка и ячейка бывают самозакрытыми (`<row r="5"/>`, `<c r="B2" s="1"/>`):
// шаблон с обязательным телом принимал бы `/>` за открывающий тег и склеивал
// две записи в одну.
const ROW_RE = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;
const CELL_RE = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;

/** @returns {{n: number, cells: Record<string, string>}[]} */
function rowsOf(files, path, shared) {
  const xml = files.get(path).toString('utf8');
  const rows = [];
  for (const rm of xml.matchAll(ROW_RE)) {
    const n = Number((rm[1].match(/\br="(\d+)"/) || [])[1]) || rows.length + 1;
    const cells = {};
    for (const cm of (rm[2] ?? '').matchAll(CELL_RE)) {
      const ref = (cm[1].match(/\br="([A-Z]+)\d+"/) || [])[1];
      if (!ref) continue;
      const type = (cm[1].match(/\bt="([^"]+)"/) || [])[1];
      const body = cm[2] ?? '';
      if (type === 'inlineStr') {
        cells[ref] = textOf(body);
      } else {
        const v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        cells[ref] = type === 's' ? (shared[Number(v)] ?? '') : v === undefined ? '' : unesc(v);
      }
    }
    rows.push({ n, cells });
  }
  return rows;
}

/**
 * Строки листа как объекты «заголовок → значение»; заголовок — первая
 * строка. Повтор заголовка — отказ: вторая колонка молча перекрыла бы первую.
 */
function tableOf(rows, sheetName) {
  const head = rows[0]?.cells || {};
  const col = {};
  for (const [letter, title] of Object.entries(head)) {
    if (!title) continue;
    if (col[title]) throw new Error(`на листе «${sheetName}» заголовок «${title}» повторён (колонки ${col[title]} и ${letter})`);
    col[title] = letter;
  }
  const list = rows.slice(1).map((row) => {
    const o = {};
    for (const [title, letter] of Object.entries(col)) o[title] = (row.cells[letter] ?? '').trim();
    o[ROW] = row.n;
    return o;
  });
  list.columns = Object.keys(col);
  return list;
}

/* ---------------------------------------------------------------- *
 * Разбор выгрузки
 * ---------------------------------------------------------------- */

/** Формат `google`: четыре листа, объём — колонки Google. */
const SHEET = {
  phrases: 'Clustering',
  clusters: 'Кластеры',
  unmatched: 'Не сопоставлено',
  legend: 'Легенда',
};

const PHRASE_COLUMNS = [
  'Поисковые запросы', 'Название группы', 'WS', 'Google, ср/мес',
  'Google: сумма кластера', 'Google: фраза', 'Сопоставление',
  'Google: год к году', 'Google: конкуренция', '% Агрегаторов',
  'Главных страниц', 'Топоним в запросе', 'URLs группы',
];
const CLUSTER_COLUMNS = [
  'Название группы', 'Фраз', 'WS: сумма', 'Google: сумма',
  'Ранг WS', 'Ранг Google', 'Топ-фраза (Google)',
];

/** Формат `volume`: один лист, объём — «Частотность», сводной нет. */
const VOLUME = {
  sheet: 'Clustering',
  volume: 'Частотность',
  columns: [
    'Поисковые запросы', 'Частотность', 'Частотность группы', 'Название группы',
    'Фраз в группе', '% Агрегаторов', 'Главных страниц', 'Топоним в запросе',
    'URLs группы',
  ],
};

/** Строка «Некластеризовано» — не кластер, а мешок одиночных фраз. */
export const UNCLUSTERED = 'Некластеризовано';

/**
 * Число из ячейки. Запятая — десятичная (польский экспорт «1,5»), кроме
 * записи с группами по три («1,300» — американская тысяча, не 1.3).
 * Нечисло — 0: пустая ячейка объёма у первого сайта законна (WS без Google).
 */
const num = (v) => {
  const s = String(v).replace(/\s+/g, '');
  const n = Number(/^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export function splitUrls(raw) {
  return (raw || '')
    .split(/[\s,]+/)
    .map((s) => s.replace(/[.,;]+$/, ''))
    .filter((s) => /^https?:\/\//i.test(s));
}

export function hostOf(url) {
  try { return new URL(url).host.toLowerCase(); } catch { return ''; }
}

/**
 * Сторож строки фраз, общий обоим форматам: пустая строка листа
 * пропускается, строка без запроса или без группы — отказ, повтор запроса —
 * отказ. Возвращает `false`, если строку нужно пропустить.
 */
function guardPhraseRow(r, sheetName, seen) {
  const phrase = r['Поисковые запросы'];
  const cluster = r['Название группы'];
  if (Object.values(r).every((v) => !v)) return false;
  if (!phrase) throw new Error(`лист «${sheetName}», строка ${r[ROW]}: пустой запрос у группы «${cluster}»`);
  if (!cluster) throw new Error(`лист «${sheetName}», строка ${r[ROW]}: пустое «Название группы» у запроса «${phrase}»`);
  if (seen.has(phrase)) throw new Error(`лист «${sheetName}», строка ${r[ROW]}: запрос «${phrase}» повторён (первый раз — строка ${seen.get(phrase)})`);
  seen.set(phrase, r[ROW]);
  return true;
}

/** Формат `google` — четыре листа, как у первого сайта. */
function readGoogle(files, paths, shared) {
  for (const name of Object.values(SHEET)) {
    if (!paths.has(name)) throw new Error(`в выгрузке нет листа «${name}»`);
  }
  const sheet = (name) => tableOf(rowsOf(files, paths.get(name), shared), name);

  const phraseRows = sheet(SHEET.phrases);
  for (const c of PHRASE_COLUMNS) {
    if (!phraseRows.columns.includes(c)) throw new Error(`на листе «${SHEET.phrases}» нет колонки «${c}»`);
  }
  const clusterRows = sheet(SHEET.clusters);
  for (const c of CLUSTER_COLUMNS) {
    if (!clusterRows.columns.includes(c)) throw new Error(`на листе «${SHEET.clusters}» нет колонки «${c}»`);
  }

  const seen = new Map();
  const phrases = phraseRows
    .filter((r) => guardPhraseRow(r, SHEET.phrases, seen))
    .map((r) => ({
      phrase: r['Поисковые запросы'],
      cluster: r['Название группы'],
      google: num(r['Google, ср/мес']),
      googlePhrase: r['Google: фраза'],
      match: r['Сопоставление'],
      yoy: r['Google: год к году'],
      competition: r['Google: конкуренция'],
      aggregatorsPct: num(r['% Агрегаторов']),
      mainPages: num(r['Главных страниц']),
      toponym: r['Топоним в запросе'],
      urls: splitUrls(r['URLs группы']),
      ws: num(r['WS']),
    }));

  const clusters = clusterRows.map((r) => ({
    name: r['Название группы'],
    phrases: num(r['Фраз']),
    google: num(r['Google: сумма']),
    rankGoogle: num(r['Ранг Google']),
    topPhrase: r['Топ-фраза (Google)'],
    ws: num(r['WS: сумма']),
    rankWs: num(r['Ранг WS']),
  }));

  // Лист «Не сопоставлено» — не таблица, а две таблицы под общей шапкой:
  // ниже идёт вторая с собственным заголовком. Отбираем по знакомому имени
  // кластера во второй колонке: разбор шапок по тексту ломается от правки
  // формулировки, принадлежность кластеру — нет.
  const known = new Set(clusters.map((c) => c.name));
  const unmatched = [];
  for (const { cells } of rowsOf(files, paths.get(SHEET.unmatched), shared)) {
    const phrase = (cells.A || '').trim();
    const cluster = (cells.B || '').trim();
    if (!phrase || !known.has(cluster)) continue;
    unmatched.push({ phrase, cluster, ws: num(cells.C) });
  }

  const legend = rowsOf(files, paths.get(SHEET.legend), shared)
    .map(({ cells }) => (cells.A || '').trim())
    .filter((s) => s && s !== 'Пояснение');

  return { volumeColumn: 'Google, ср/мес', phrases, clusters, unmatched, legend };
}

/**
 * Формат `volume` — один лист. Сводная кластеров считается по строкам:
 * число фраз — счётом, объём — суммой, топ-фраза — максимум объёма
 * (при равенстве — первая по алфавиту, как в `groupPhrases`), ранг —
 * по убыванию объёма, равные суммы делят ранг, как на листе «Кластеры»
 * первого формата. Полей WS нет — нули; `unmatched` и `legend` — пусто.
 */
function readVolume(files, paths, shared) {
  if (!paths.has(VOLUME.sheet)) {
    throw new Error(
      `формат выгрузки не опознан: нет ни листа «${SHEET.clusters}» (формат google), ни листа «${VOLUME.sheet}» (формат volume)`
    );
  }
  const rows = tableOf(rowsOf(files, paths.get(VOLUME.sheet), shared), VOLUME.sheet);
  for (const c of VOLUME.columns) {
    if (!rows.columns.includes(c)) {
      throw new Error(
        `на листе «${VOLUME.sheet}» нет колонки «${c}» — без листа «${SHEET.clusters}» ждём формат volume (один лист, объём в «${VOLUME.volume}»)`
      );
    }
  }

  const seen = new Map();
  const phrases = rows
    .filter((r) => guardPhraseRow(r, VOLUME.sheet, seen))
    .map((r) => ({
      phrase: r['Поисковые запросы'],
      cluster: r['Название группы'],
      google: num(r[VOLUME.volume]),
      googlePhrase: '',
      match: '',
      yoy: '',
      competition: '',
      aggregatorsPct: num(r['% Агрегаторов']),
      mainPages: num(r['Главных страниц']),
      toponym: r['Топоним в запросе'],
      urls: splitUrls(r['URLs группы']),
      ws: 0,
    }));

  const clusters = [...groupPhrases(phrases)].map(([name, list]) => ({
    name,
    phrases: list.length,
    google: list.reduce((s, p) => s + p.google, 0),
    rankGoogle: 0,
    topPhrase: list[0].phrase,
    ws: 0,
    rankWs: 0,
  }));
  clusters.sort((a, b) => b.google - a.google || a.name.localeCompare(b.name));
  clusters.forEach((c, i) => {
    c.rankGoogle = i > 0 && clusters[i - 1].google === c.google ? clusters[i - 1].rankGoogle : i + 1;
  });

  return { volumeColumn: VOLUME.volume, phrases, clusters, unmatched: [], legend: [] };
}

/**
 * Читает выгрузку целиком.
 *
 * @param {string} path путь к xlsx
 * @returns {{meta: object, phrases: object[], clusters: object[], unmatched: object[], legend: string[]}}
 */
export function readClustering(path) {
  const buf = readFileSync(path);
  const files = unzip(buf);
  const shared = sharedStrings(files);
  const paths = sheetPaths(files);

  const format = paths.has(SHEET.clusters) ? 'google' : 'volume';
  const { volumeColumn, phrases, clusters, unmatched, legend } =
    format === 'google' ? readGoogle(files, paths, shared) : readVolume(files, paths, shared);

  return {
    meta: {
      source: path.replace(/\\/g, '/').split('/').slice(-1)[0],
      sha256: createHash('sha256').update(buf).digest('hex'),
      format,
      volumeColumn,
      phrases: phrases.length,
      clusters: clusters.length,
      unmatched: unmatched.length,
    },
    phrases,
    clusters,
    unmatched,
    legend,
  };
}

/** Фразы по кластерам: имя → массив фраз в порядке убывания Google. */
export function groupPhrases(phrases) {
  const by = new Map();
  for (const p of phrases) {
    if (!by.has(p.cluster)) by.set(p.cluster, []);
    by.get(p.cluster).push(p);
  }
  for (const list of by.values()) {
    list.sort((a, b) => b.google - a.google || a.phrase.localeCompare(b.phrase));
  }
  return by;
}

/** Уникальные адреса снимка выдачи кластера. */
export function clusterUrls(list) {
  const set = new Set();
  for (const p of list) for (const u of p.urls) set.add(u);
  return [...set];
}

/* ---------------------------------------------------------------- *
 * Самопроверка: мини-xlsx в памяти, по одному на формат, и отказы.
 * ---------------------------------------------------------------- */

const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** zip как его читает `unzip`: локальные заголовки, каталог, конец каталога. */
function zipOf(entries) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name, 'utf8');
    const raw = Buffer.from(text, 'utf8');
    const packed = deflateRawSync(raw);
    const crc = crc32(raw) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // имена в UTF-8
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, packed);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(packed.length, 20);
    cd.writeUInt32LE(raw.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);
    offset += local.length + nameBuf.length + packed.length;
  }
  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(Object.keys(entries).length, 8);
  eocd.writeUInt16LE(Object.keys(entries).length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cdBuf, eocd]);
}

/**
 * Мини-xlsx: `sheets` — {имя листа: строки}, строка — массив ячеек.
 * Число пишется как `<v>`, строка — inlineStr, при `shared: true` — через
 * `sharedStrings.xml`. Диалекты, которых наш генератор сам не пишет,
 * а Excel и openpyxl пишут: при `excel: true` пустая ячейка — самозакрытая
 * `<c r=".." s="1"/>`, пустая строка — `<row r=".."/>`; значение вида
 * `{f: 300}` — формула с кэшем (`t="str"`, `<f>`), `{rich: [..]}` —
 * составной текст с пустым прогоном `<t/>`.
 */
function xlsxOf(sheets, { shared = false, excel = false } = {}) {
  const pool = [];
  const sid = (s) => {
    let i = pool.indexOf(s);
    if (i < 0) { pool.push(s); i = pool.length - 1; }
    return i;
  };
  const colLetter = (n) => (n < 26 ? '' : String.fromCharCode(64 + Math.floor(n / 26))) + String.fromCharCode(65 + (n % 26));
  const cell = (ref, v) => {
    if (v && typeof v === 'object' && 'f' in v) return `<c r="${ref}" t="str"><f>0+${v.f}</f><v>${v.f}</v></c>`;
    if (v && typeof v === 'object' && 'rich' in v) {
      return `<c r="${ref}" t="inlineStr"><is><r><rPr><b/></rPr><t/></r>${v.rich.map((s) => `<r><t>${xmlEsc(s)}</t></r>`).join('')}</is></c>`;
    }
    if (typeof v === 'number') return `<c r="${ref}"><v>${v}</v></c>`;
    if (v === null || v === undefined || v === '') return excel ? `<c r="${ref}" s="1"/>` : '';
    if (shared) return `<c r="${ref}" t="s"><v>${sid(String(v))}</v></c>`;
    return `<c r="${ref}" t="inlineStr"><is><t>${xmlEsc(v)}</t></is></c>`;
  };
  const entries = {};
  const names = Object.keys(sheets);
  entries['xl/workbook.xml'] =
    '<workbook>' +
    '<sheets>' + names.map((n, i) => `<sheet name="${xmlEsc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets>' +
    '</workbook>';
  entries['xl/_rels/workbook.xml.rels'] =
    '<Relationships>' +
    // Порядок нарочно обратный: путь листа берётся по r:id, не по номеру.
    names.map((_, i) => `<Relationship Id="rId${i + 1}" Target="worksheets/sheet${names.length - i}.xml"/>`).join('') +
    '</Relationships>';
  names.forEach((n, i) => {
    const rows = sheets[n]
      .map((r, ri) => {
        const empty = r.every((v) => v === null || v === undefined || v === '');
        if (empty && excel) return `<row r="${ri + 1}"/>`;
        return `<row r="${ri + 1}">${r.map((v, ci) => cell(`${colLetter(ci)}${ri + 1}`, v)).join('')}</row>`;
      })
      .join('');
    entries[`xl/worksheets/sheet${names.length - i}.xml`] = `<worksheet><sheetData>${rows}</sheetData></worksheet>`;
  });
  if (shared) {
    entries['xl/sharedStrings.xml'] = '<sst>' + pool.map((s) => `<si><t>${xmlEsc(s)}</t></si>`).join('') + '</sst>';
  }
  return zipOf(entries);
}

function selftest() {
  const dir = mkdtempSync(join(tmpdir(), 'clustering-selftest-'));
  const file = (name, buf) => { const p = join(dir, name); writeFileSync(p, buf); return p; };
  const cases = [];
  const check = (имя, ждём, факт, откуда) => cases.push({ имя, ждём: JSON.stringify(ждём), факт: JSON.stringify(факт), откуда });
  const refusal = (fn, text) => {
    try { fn(); return 'прошло без отказа'; } catch (e) { return e.message.includes(text) ? text : `другой отказ: ${e.message}`; }
  };
  const brief = (c) => [c.name, c.phrases, c.google, c.rankGoogle];

  try {
    /* — формат volume: один лист; сводные колонки нарочно врут;
     *   диалект Excel — самозакрытые пустые ячейки и строки — */
    const V = VOLUME.columns;
    const vRows = [
      V,
      // фраза, Частотность, Частотность группы, Название группы, Фраз в группе, % Агр., Главных, Топоним, URLs
      ['max payne 3 ps4', { f: 300 }, 999, 'max payne 3', 35, 0, 0, '-', 'https://a.example/1, https://b.example/2,'],
      [{ rich: ['hltb ', 'max payne 3'] }, 10, 999, 'max payne 3', 35, '', '', '-', 'https://a.example/1 https://c.example/3.'],
      ['max payne 3 pc', 10, 999, 'max payne 3', 35, 10, 1, '-', ''],
      ['', '', '', '', '', '', '', '', ''], // пустая строка листа — `<row r="5"/>`
      ['max payne 2', '1,000', 1000, 'max payne 2', 1, 0, 0, '-', 'https://d.example/4'],
      ['max payne film', 320, 320, 'max payne film', 1, 0, 0, '-', 'https://e.example/5'],
      ['max payne strain', 50, 70, UNCLUSTERED, 1, 0, 0, '-', 'https://f.example/6'],
      ['young nudy max payne', 20, 70, UNCLUSTERED, 1, 0, 0, '-', 'https://g.example/7'],
      ['b tie', 40, 80, 'max payne tie', 2, 0, 0, '-', ''],
      ['a tie', 40, 80, 'max payne tie', 2, 0, 0, '-', ''],
    ];
    const vol = readClustering(file('volume.xlsx', xlsxOf({ Clustering: vRows }, { excel: true })));
    check('volume: формат опознан', ['volume', 'Частотность'], [vol.meta.format, vol.meta.volumeColumn], 'нет листа «Кластеры»');
    check('volume: meta', { phrases: 9, clusters: 5, unmatched: 0, source: 'volume.xlsx' }, { phrases: vol.meta.phrases, clusters: vol.meta.clusters, unmatched: vol.meta.unmatched, source: vol.meta.source }, 'пустая строка листа — не фраза');
    check('volume: объём ← Частотность; формула с кэшем; «1,000» — тысяча', [300, 1000], [vol.phrases[0].google, vol.phrases[3].google], 'num(): запятая по три — разделитель тысяч');
    check('volume: составной текст с пустым прогоном', 'hltb max payne 3', vol.phrases[1].phrase, '`<t/>` не глотает разметку');
    check('volume: самозакрытые пустые ячейки не глотают соседа', [0, 0, '-', ['https://a.example/1', 'https://c.example/3']], [vol.phrases[1].aggregatorsPct, vol.phrases[1].mainPages, vol.phrases[1].toponym, vol.phrases[1].urls], 'проверка 2026-09-18: `<c …/>` принимался за открывающий тег');
    check('volume: фраза — форма первого формата', ['', '', '', '', 0, 10, 1, '-'], (({ googlePhrase, match, yoy, competition, ws, aggregatorsPct, mainPages, toponym }) => [googlePhrase, match, yoy, competition, ws, aggregatorsPct, mainPages, toponym])(vol.phrases[2]), 'потребители читают те же поля');
    check('volume: urls — запятые, пробелы, хвостовая точка', [['https://a.example/1', 'https://b.example/2'], ['https://a.example/1', 'https://c.example/3']], [vol.phrases[0].urls, vol.phrases[1].urls], 'splitUrls как в первом формате');
    check('volume: сводная по строкам, порядок по объёму', [['max payne 2', 1, 1000, 1], ['max payne 3', 3, 320, 2], ['max payne film', 1, 320, 2], ['max payne tie', 2, 80, 4], [UNCLUSTERED, 2, 70, 5]], vol.clusters.map(brief), '«Фраз в группе» 35 и «Частотность группы» 999 не читаются; равные суммы делят ранг');
    check('volume: топ-фраза — максимум объёма, при равенстве — по алфавиту', ['max payne 3 ps4', 'max payne strain', 'a tie'], [vol.clusters[1].topPhrase, vol.clusters[4].topPhrase, vol.clusters[3].topPhrase], 'groupPhrases: по убыванию, затем localeCompare');
    check('volume: WS, unmatched, legend — пусто', [0, 0, [], []], [vol.clusters[0].ws, vol.clusters[0].rankWs, vol.unmatched, vol.legend], 'полей WS в формате нет');

    /* — формат google: четыре листа, общие строки — */
    const gRows = [
      PHRASE_COLUMNS,
      // запрос, группа, WS, Google, Google сумма, Google фраза, Сопоставление, YoY, конкуренция, % Агр., Главных, Топоним, URLs
      ['assassin valhalla', 'assassin valhalla', 77709, 1300, 1300, 'assassin valhalla', 'точное', '0%', 'средняя', 0, 0, '-', 'https://a.example/1, https://b.example/2'],
      ['ac valhalla', 'assassin valhalla', 5, 0, 1300, '', '', '', '', 0, 0, '-', 'https://a.example/1'],
      ['', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['witcher2', UNCLUSTERED, 100, 50, 50, 'witcher2', 'точное', '0%', 'низкая', 0, 0, '-', 'https://x.example/9'],
    ];
    const cRows = [
      CLUSTER_COLUMNS,
      // группа, Фраз, WS сумма, Google сумма, Ранг WS, Ранг Google, Топ-фраза
      ['assassin valhalla', 2, 77714, 1300, 1, 1, 'assassin valhalla'],
      [UNCLUSTERED, 264, 100, 50, 2, 2, 'witcher2'],
    ];
    const uRows = [
      ['Запрос', 'Группа', 'WS'],
      ['ac valhala', 'assassin valhalla', 7],
      ['', '', ''],
      ['Запрос', 'Группа', 'WS'], // вторая таблица под своей шапкой
      ['чужой', 'нет такого кластера', 3],
    ];
    const lRows = [['Пояснение'], ['Источник 1: проба.'], ['']];
    const four = (phr) => ({ Clustering: phr, 'Кластеры': cRows, 'Не сопоставлено': uRows, 'Легенда': lRows });
    const goo = readClustering(file('google.xlsx', xlsxOf(four(gRows), { shared: true })));
    check('google: формат опознан', ['google', 'Google, ср/мес'], [goo.meta.format, goo.meta.volumeColumn], 'есть лист «Кластеры»');
    check('google: meta', { phrases: 3, clusters: 2, unmatched: 1 }, { phrases: goo.meta.phrases, clusters: goo.meta.clusters, unmatched: goo.meta.unmatched }, 'общие строки sharedStrings.xml; пустая строка листа пропущена');
    check('google: фраза — поля Google и WS', [1300, 77709, 'точное', '0%', 'средняя', ['https://a.example/1', 'https://b.example/2']], (({ google, ws, match, yoy, competition, urls }) => [google, ws, match, yoy, competition, urls])(goo.phrases[0]), 'как до второго формата');
    check('google: сводная — с листа, не по строкам', [[UNCLUSTERED, 264, 50, 2, 'witcher2']], goo.clusters.slice(1).map((c) => [...brief(c), c.topPhrase]), '264 при одной строке — лист «Кластеры» верит себе');
    check('google: «Не сопоставлено» — по знакомому кластеру', [{ phrase: 'ac valhala', cluster: 'assassin valhalla', ws: 7 }], goo.unmatched, 'вторая шапка и чужой кластер отброшены');
    check('google: легенда без «Пояснение» и пустых', ['Источник 1: проба.'], goo.legend, '');

    /* — отказы — */
    check('отказ: ни «Кластеры», ни «Clustering»', 'не опознан', refusal(() => readClustering(file('alien.xlsx', xlsxOf({ Data: [['a'], ['b']] }))), 'не опознан'), 'чужой файл не читается молча');
    const eight = V.filter((c) => c !== 'URLs группы');
    check('отказ: volume без последней из девяти колонок', 'нет колонки «URLs группы»', refusal(() => readClustering(file('nocol.xlsx', xlsxOf({ Clustering: [eight, eight.map(() => 'x')] }))), 'нет колонки «URLs группы»'), 'проверяются все девять, не первые две');
    const noGroup = vRows.map((r) => r.slice());
    noGroup[6][3] = '';
    check('отказ: volume, пустое имя группы — номер строки по атрибуту r', 'строка 7: пустое «Название группы»', refusal(() => readClustering(file('nogroup.xlsx', xlsxOf({ Clustering: noGroup }, { excel: true }))), 'строка 7: пустое «Название группы»'), 'после самозакрытой строки 5 счёт не сбит');
    const dupPhrase = vRows.map((r) => r.slice());
    dupPhrase[6][0] = 'max payne 3 ps4';
    check('отказ: volume, повтор запроса', 'запрос «max payne 3 ps4» повторён (первый раз — строка 2)', refusal(() => readClustering(file('dup.xlsx', xlsxOf({ Clustering: dupPhrase }))), 'запрос «max payne 3 ps4» повторён (первый раз — строка 2)'), 'запрос принадлежит одной группе');
    const dupHead = vRows.map((r) => r.slice());
    dupHead[0] = [...V, 'Частотность'];
    check('отказ: повтор заголовка колонки', 'заголовок «Частотность» повторён', refusal(() => readClustering(file('duphead.xlsx', xlsxOf({ Clustering: dupHead }))), 'заголовок «Частотность» повторён'), 'вторая колонка не перекрывает первую молча');
    const gNoPhrase = gRows.map((r) => r.slice());
    gNoPhrase[2][0] = '';
    check('отказ: google, пустой запрос', 'строка 3: пустой запрос у группы «assassin valhalla»', refusal(() => readClustering(file('gnophrase.xlsx', xlsxOf(four(gNoPhrase)))), 'строка 3: пустой запрос у группы «assassin valhalla»'), 'сторож общий обоим форматам');
    check('отказ: google без «Легенда»', 'нет листа «Легенда»', refusal(() => readClustering(file('nolegend.xlsx', xlsxOf({ Clustering: gRows, 'Кластеры': cRows, 'Не сопоставлено': uRows }))), 'нет листа «Легенда»'), 'как до второго формата');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  let failed = 0;
  for (const c of cases) {
    const hit = c.ждём === c.факт;
    if (!hit) failed += 1;
    console.log(`${hit ? 'ok  ' : 'ŹLE '} ${c.имя.padEnd(58)} ${hit ? '' : `ждём ${c.ждём} факт ${c.факт}  `}— ${c.откуда}`);
  }
  console.log(`\n${cases.length - failed}/${cases.length} проб читалки сходятся`);
  return failed === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href && process.argv.includes('--selftest')) {
  if (!selftest()) process.exit(1);
}
