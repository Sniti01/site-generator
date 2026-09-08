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
 * **Источник истины — колонки Google.** WS-колонки в выгрузке оставлены
 * для сравнения и в решениях не используются; так сказано на листе
 * «Легенда» и повторено в `docs/04_STRUCTURE_DECISIONS.md`. Адаптер их
 * отдаёт, но рядом с `google`, чтобы расхождение было видно, а не чтобы
 * по нему считать.
 *
 * Зависимостей нет: xlsx — это zip с XML, читается своим кодом. Тот же
 * приём заперт внутри `tools/fetch-corpus.mjs` сайта: тот скрипт на импорте
 * начинает качать корпус, и позвать его функции нельзя. Свести оба в один —
 * работа после приёмки дерева; перенос сюда её не делает и не отменяет.
 */

import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';

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

function sharedStrings(files) {
  const out = [];
  const ss = files.get('xl/sharedStrings.xml');
  if (!ss) return out; // в этой выгрузке значения записаны прямо в ячейках
  for (const m of ss.toString('utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    out.push([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => unesc(t[1])).join(''));
  }
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

function rowsOf(files, path, shared) {
  const xml = files.get(path).toString('utf8');
  const rows = [];
  for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    for (const cm of rm[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = (cm[1].match(/r="([A-Z]+)\d+"/) || [])[1];
      if (!ref) continue;
      const type = (cm[1].match(/t="([^"]+)"/) || [])[1];
      if (type === 'inlineStr') {
        cells[ref] = [...cm[2].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => unesc(t[1])).join('');
      } else {
        const v = (cm[2].match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        cells[ref] = type === 's' ? (shared[Number(v)] ?? '') : v === undefined ? '' : unesc(v);
      }
    }
    rows.push(cells);
  }
  return rows;
}

/** Строки листа как объекты «заголовок → значение»; заголовок — первая строка. */
function tableOf(rows) {
  const head = rows[0] || {};
  const col = {};
  for (const [letter, title] of Object.entries(head)) if (title) col[title] = letter;
  const list = rows.slice(1).map((cells) => {
    const o = {};
    for (const [title, letter] of Object.entries(col)) o[title] = (cells[letter] ?? '').trim();
    return o;
  });
  list.columns = Object.keys(col);
  return list;
}

/* ---------------------------------------------------------------- *
 * Разбор выгрузки
 * ---------------------------------------------------------------- */

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

/** Строка «Некластеризовано» — не кластер, а мешок одиночных фраз. */
export const UNCLUSTERED = 'Некластеризовано';

const num = (v) => {
  const n = Number(String(v).replace(/\s+/g, '').replace(',', '.'));
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
  for (const name of Object.values(SHEET)) {
    if (!paths.has(name)) throw new Error(`в выгрузке нет листа «${name}»`);
  }
  const sheet = (name) => tableOf(rowsOf(files, paths.get(name), shared));

  const phraseRows = sheet(SHEET.phrases);
  for (const c of PHRASE_COLUMNS) {
    if (!phraseRows.columns.includes(c)) throw new Error(`на листе «${SHEET.phrases}» нет колонки «${c}»`);
  }
  const clusterRows = sheet(SHEET.clusters);
  for (const c of CLUSTER_COLUMNS) {
    if (!clusterRows.columns.includes(c)) throw new Error(`на листе «${SHEET.clusters}» нет колонки «${c}»`);
  }

  const phrases = phraseRows.map((r) => ({
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
  for (const cells of rowsOf(files, paths.get(SHEET.unmatched), shared)) {
    const phrase = (cells.A || '').trim();
    const cluster = (cells.B || '').trim();
    if (!phrase || !known.has(cluster)) continue;
    unmatched.push({ phrase, cluster, ws: num(cells.C) });
  }

  const legend = rowsOf(files, paths.get(SHEET.legend), shared)
    .map((c) => (c.A || '').trim())
    .filter((s) => s && s !== 'Пояснение');

  return {
    meta: {
      source: path.replace(/\\/g, '/').split('/').slice(-1)[0],
      sha256: createHash('sha256').update(buf).digest('hex'),
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
