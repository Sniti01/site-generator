#!/usr/bin/env node
/**
 * Сборка дерева сайта — стадия S2 (`docs/05_STRUCTURE_TASK.md`).
 *
 *   node tools/build-tree.mjs            — пишет structure/structure.json
 *   node tools/build-tree.mjs --dry-run  — только считает и печатает
 *
 * Инструмент **не решает, какие страницы существуют**: состав дерева объявлен
 * в `structure/pages-s2.json`, судьбы кластеров подтверждены владельцем (П25)
 * и лежат в `structure/s0-recon.json`. Здесь только раскладка: каждому запросу
 * выгрузки находится ровно одно место — страница, `exclusions` или `no_page`, —
 * и считается то, что руками не пишут (`volume`, `parent`, `blocks` умолчаний).
 *
 * **Тихих потерь не бывает.** Запрос, которому не нашлось места, роняет сборку
 * с перечислением: правило, которое молча теряет часть семантики, хуже
 * отсутствующего правила. То же на удвоение и на кластер, назначенный двум
 * страницам.
 *
 * Шапка `site` не пересобирается: она объявление сайта, а не счёт. Инструмент
 * читает её из существующего `structure.json` и кладёт обратно как есть.
 *
 * Чужой текст отсюда не извлекается: `title`, `h1` и `description` написаны
 * в `pages-s2.json` от руки, корпус конкурентов этот инструмент не открывает.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readClustering, UNCLUSTERED } from '@factory/core/structure/clustering.mjs';

// Словарь умолчаний читается файлом, а не импортом: импорт json просит
// атрибут `with { type: 'json' }`, и механическая проверка сайта на него
// сегодня отвечает подсказкой. Путь спрашиваем у резолвера пакета.
const typeBlocks = JSON.parse(
  readFileSync(fileURLToPath(import.meta.resolve('@factory/core/structure/type-blocks.json')), 'utf8')
);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const declPath = join(root, 'structure/pages-s2.json');
const reconPath = join(root, 'structure/s0-recon.json');
const rulesS3Path = join(root, 'structure/rules-s3.json');
const anatomyPath = join(root, 'structure/s3-anatomy.json');
const docPath = join(root, 'structure/structure.json');

const dryRun = process.argv.includes('--dry-run');

const decl = JSON.parse(readFileSync(declPath, 'utf8'));
const recon = JSON.parse(readFileSync(reconPath, 'utf8'));
const doc = JSON.parse(readFileSync(docPath, 'utf8'));

// Анатомия — необязательный вход: до S3 её нет, и дерево собирается
// на одних умолчаниях типа. Появилась — блоки получают доказательство.
const rulesS3 = existsSync(rulesS3Path) ? JSON.parse(readFileSync(rulesS3Path, 'utf8')) : null;
const anatomy = existsSync(anatomyPath) ? JSON.parse(readFileSync(anatomyPath, 'utf8')) : null;
const anatomyByUrl = new Map((anatomy?.['страницы'] ?? []).map((p) => [p.url, p]));
// Именованные `corridor: null` существующей структуры (П43) переживают пересборку.
const existingCorridor = new Map((doc.pages ?? []).map((p) => [p.url, p.corridor]));
const data = readClustering(join(root, doc.site.semantics));

const pages = decl['страницы'];
const problems = [];
const fail = (msg) => problems.push(msg);

/* ---------------------------------------------------------------- *
 * Куда что уходит: четыре словаря, собранные из объявления страниц.
 * Порядок разбора — от частного к общему: явный ключ сильнее темы,
 * тема сильнее кластера. Иначе одну фразу нельзя было бы вынуть из темы,
 * не переписав саму тему, а темы подтверждены владельцем.
 * ---------------------------------------------------------------- */

const pageByCluster = new Map();
const pageByFate = new Map();
const pageByTheme = new Map();
const pageByKey = new Map();

const claim = (map, key, url, what) => {
  if (map.has(key)) fail(`${what} «${key}» назначен двум страницам: ${map.get(key)} и ${url}`);
  map.set(key, url);
};

for (const p of pages) {
  const merges = [...(p['слияния'] ?? []), ...(p['возвращено_из_no_page'] ?? [])];
  for (const c of [p.cluster, ...merges].filter(Boolean)) claim(pageByCluster, c, p.url, 'кластер');
  for (const f of p['судьбы'] ?? []) claim(pageByFate, f, p.url, 'судьба');
  for (const t of p['темы'] ?? []) claim(pageByTheme, t, p.url, 'тема');
  for (const k of p['ключи'] ?? []) claim(pageByKey, k, p.url, 'ключ');
}

const clusterFate = new Map(recon['кластеры'].map((c) => [c['кластер'], c]));

// Возврат из `no_page` — не рядовое слияние: он отменяет строку пачки,
// подтверждённой владельцем, поэтому объявляется отдельным полем, печатается
// отдельной строкой и требует, чтобы у кластера действительно стояла судьба
// «no_page». Разрешение на конкретные кластеры даёт владелец, не инструмент.
const returned = [];
for (const p of pages) {
  for (const c of p['возвращено_из_no_page'] ?? []) {
    const row = clusterFate.get(c);
    if (!row) fail(`возврат из no_page: кластера «${c}» нет в разведке`);
    else if (row['судьба'] !== 'no_page') fail(`возврат из no_page: у «${c}» судьба «${row['судьба']}», а не «no_page» — это обычное слияние`);
    else returned.push({ cluster: c, url: p.url, reason: row['причина'] });
  }
}
const phraseFate = new Map(recon['некластеризовано'].map((r) => [r['фраза'], r]));

/* ---------------------------------------------------------------- *
 * Раскладка: каждой фразе выгрузки — ровно одно место.
 * ---------------------------------------------------------------- */

const keywords = new Map(pages.map((p) => [p.url, []]));
const exclusions = [];
const noPage = [];
const seen = new Map();
const lost = [];
const usedThemes = new Set();
const usedFates = new Set();

const toPage = (url, phrase) => {
  if (!keywords.has(url)) {
    fail(`страницы «${url}» нет в объявлении, а на неё направлен запрос «${phrase.phrase}»`);
    return;
  }
  keywords.get(url).push(phrase);
};

for (const phrase of data.phrases) {
  if (seen.has(phrase.phrase)) {
    fail(`запрос «${phrase.phrase}» встречается в выгрузке дважды`);
    continue;
  }

  const explicit = pageByKey.get(phrase.phrase);
  if (explicit) {
    toPage(explicit, phrase);
    seen.set(phrase.phrase, explicit);
    continue;
  }

  if (phrase.cluster === UNCLUSTERED) {
    const row = phraseFate.get(phrase.phrase);
    if (!row) {
      lost.push(`${phrase.phrase} — нет строки в разведке`);
      continue;
    }
    const fate = row['судьба'];
    if (fate === 'exclusions') {
      exclusions.push({ query: phrase.phrase, reason: row['причина'] });
      seen.set(phrase.phrase, 'exclusions');
    } else if (fate === 'no_page') {
      noPage.push({ query: phrase.phrase, reason: row['причина'] });
      seen.set(phrase.phrase, 'no_page');
    } else if (fate === 'к_кластеру') {
      const url = pageByCluster.get(row['цель']);
      if (!url) lost.push(`${phrase.phrase} — к кластеру «${row['цель']}», а страницы у него нет`);
      else {
        toPage(url, phrase);
        seen.set(phrase.phrase, url);
      }
    } else if (fate === 'новая_тема') {
      const url = pageByTheme.get(row['цель']);
      usedThemes.add(row['цель']);
      if (!url) lost.push(`${phrase.phrase} — тема «${row['цель']}», а страницы у темы нет`);
      else {
        toPage(url, phrase);
        seen.set(phrase.phrase, url);
      }
    } else {
      lost.push(`${phrase.phrase} — судьба «${fate}» разложить нечем`);
    }
    continue;
  }

  const row = clusterFate.get(phrase.cluster);
  if (!row) {
    lost.push(`${phrase.phrase} — кластер «${phrase.cluster}» без строки в разведке`);
    continue;
  }
  const fate = row['судьба'];
  if (fate === 'exclusions') {
    exclusions.push({ query: phrase.phrase, reason: row['причина'] });
    seen.set(phrase.phrase, 'exclusions');
  } else if (fate === 'no_page' && !pageByCluster.has(phrase.cluster)) {
    noPage.push({ query: phrase.phrase, reason: row['причина'] });
    seen.set(phrase.phrase, 'no_page');
  } else if (fate === 'no_page') {
    // Сюда попадают только кластеры из `возвращено_из_no_page`: обычное
    // слияние такой судьбы не перекрывает — проверка выше это гарантирует.
    toPage(pageByCluster.get(phrase.cluster), phrase);
    seen.set(phrase.phrase, pageByCluster.get(phrase.cluster));
  } else if (fate === 'страница' || fate === 'волна_2') {
    const url = pageByCluster.get(phrase.cluster);
    if (!url) lost.push(`${phrase.phrase} — кластер «${phrase.cluster}» (${fate}) не взят ни одной страницей`);
    else {
      toPage(url, phrase);
      seen.set(phrase.phrase, url);
    }
  } else if (fate === 'слить_в_хаб') {
    // Кластер, названный в «слияния» страницы, сильнее хаба из разведки: хаб
    // там угадан по словам во фразах, а выдача иногда называет другую игру
    // (пример S2: «assassins creed psp» — весь топ про Bloodlines, не про AC1).
    const url = pageByCluster.get(phrase.cluster) ?? pageByCluster.get(row['цель']);
    if (!url) lost.push(`${phrase.phrase} — слияние в «${row['цель']}», а страницы у хаба нет`);
    else {
      toPage(url, phrase);
      seen.set(phrase.phrase, url);
    }
  } else {
    // Кластер, названный страницей поимённо, сильнее судьбы: так с карты мест
    // уходят запросы про дополнение и коллекционные издания, оставаясь при
    // этом в своей судьбе разведки (решение владельца от 2026-09-08, В4).
    usedFates.add(fate);
    const url = pageByCluster.get(phrase.cluster) ?? pageByFate.get(fate);
    if (!url) lost.push(`${phrase.phrase} — судьба «${fate}» ни на одну страницу не заведена`);
    else {
      toPage(url, phrase);
      seen.set(phrase.phrase, url);
    }
  }
}

for (const [key, url] of pageByKey) {
  if (!seen.has(key)) fail(`ключ «${key}» (страница ${url}) в выгрузке не встречается — сверь знак в знак`);
  // Имена кластеров в этой выгрузке — те же строки, что фразы («ezio auditore»,
  // «assassins 1»). Ключ, совпавший с именем кластера, почти наверняка описка:
  // хотели забрать кластер, а забрали одну фразу. Кластер объявляют в «слияния».
  if (clusterFate.has(key)) fail(`ключ «${key}» (страница ${url}) совпадает с именем кластера — если нужен кластер целиком, объяви его в «слияния»`);
}
// Мёртвое объявление молчать не должно — тем же доводом, что и ключ с опиской.
for (const [theme, url] of pageByTheme) {
  if (!usedThemes.has(theme)) fail(`тема «${theme}» (страница ${url}) в разведке никому не назначена`);
}
for (const [f, url] of pageByFate) {
  if (!usedFates.has(f)) fail(`судьба «${f}» (страница ${url}) в разведке ни у одного кластера не стоит`);
}

/* ---------------------------------------------------------------- *
 * Страницы: считаем то, чего руками не пишут.
 * ---------------------------------------------------------------- */

const parentOf = (url) => {
  if (url === '/') return null;
  const parts = url.split('/').filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join('/')}/` : '/';
};

/**
 * Блоки, подтверждённые анатомией корпуса (S3). Имя элементу даёт словарь
 * `имена_блоков` из `rules-s3.json`: элемент без имени в `blocks[]` не идёт —
 * назвать блок вправе только владелец. `evidence` — доля документов, из
 * которых вердикт получен, в том же виде, что просит контракт: «17/24».
 */
function anatomyBlocks(url) {
  if (!anatomy || !rulesS3) return [];
  const page = anatomyByUrl.get(url);
  if (!page) return [];
  const names = rulesS3['имена_блоков'] ?? {};
  const confidence = rulesS3['уверенность'] ?? {};
  const out = [];
  for (const [element, measured] of Object.entries(page['элементы'] ?? {})) {
    const block = names[element];
    if (!block) continue;
    const level = confidence[measured['вердикт']];
    if (!level) continue; // «не норма» и «не считается» блоками не становятся
    out.push({
      block,
      source: 'anatomy',
      confidence: level,
      evidence: `${measured['документов']}/${measured['из']}`,
    });
  }
  return out;
}

/**
 * Порядок в списке — порядок на странице (`core/structure/type-blocks.json`).
 * Анатомия места не мерила, поэтому порядок берётся редакторским умолчанием
 * из `rules-s3.json`; имя вне списка встаёт в конец, сохраняя свой порядок.
 */
function orderBlocks(blocks) {
  const order = rulesS3?.['порядок_на_странице']?.['список'] ?? [];
  const rank = (b) => {
    const i = order.indexOf(b.block);
    return i < 0 ? order.length : i;
  };
  return blocks.map((b, i) => ({ b, i })).sort((x, y) => rank(x.b) - rank(y.b) || x.i - y.i).map((x) => x.b);
}

const built = pages.map((p) => {
  const list = keywords
    .get(p.url)
    .slice()
    .sort((a, b) => b.google - a.google || a.phrase.localeCompare(b.phrase));
  const defaults = typeBlocks['умолчания'][p.type];
  if (!defaults) fail(`${p.url}: у типа «${p.type}» нет умолчаний в core/structure/type-blocks.json`);

  const page = {
    url: p.url,
    type: p.type,
    h1: p.h1,
    title: p.title,
    description: p.description,
    cluster: p.cluster ?? null,
    keywords: list.map((k) => k.phrase),
    parent: parentOf(p.url),
    related: p.related ?? [],
    // Умолчания типа задают скелет; анатомия корпуса прибавляет к нему то,
    // что оказалось нормой жанра, с доказательством; рука — то, что решено
    // человеком. Три источника не смешиваются: у каждого блока стоит свой
    // `source`, и умолчание всегда отличимо от измерения.
    blocks: orderBlocks([
      ...(defaults ?? []).map((block) => ({ block, source: 'type-default', confidence: 'low' })),
      ...anatomyBlocks(p.url),
      ...(p['блоки'] ?? []).map((b) => ({
        block: b.block,
        ...(b.role ? { role: b.role } : {}),
        source: 'manual',
        confidence: b.confidence ?? 'high',
      })),
    ]),
    wave: p.wave,
    // Коридор длины (П43) — число из анатомии S3 (`план.коридор`), в контракт.
    // Страница без анатомии получает `null`; `null` у страницы с анатомией —
    // именованное решение в `DECISIONS.md`, и инструмент его НЕ перепишет:
    // существующий `null` в structure.json сохраняется. Поля `status` тут нет
    // с 2026-09-11 — его никто не вёл, состояние выводит машина из наличия текста.
    corridor: existingCorridor.get(p.url) === null ? null : (anatomyByUrl.get(p.url)?.['план']?.['коридор'] ?? null),
    volume: list.reduce((s, k) => s + k.google, 0),
  };
  if (p.owner) page.owner = true;
  if (p.template) page.template = p.template;
  return page;
});

/* ---------------------------------------------------------------- *
 * Сходится ли учёт.
 * ---------------------------------------------------------------- */

const onPages = built.reduce((s, p) => s + p.keywords.length, 0);
const tally = onPages + exclusions.length + noPage.length;
if (lost.length) fail(`запросов без места: ${lost.length}`);
if (tally !== data.meta.phrases) fail(`учтено ${tally} запросов из ${data.meta.phrases}`);
for (const p of built.filter((x) => x.keywords.length === 0 && !x.owner)) {
  fail(`${p.url}: ни одного запроса, а страница не владельца`);
}

/* ---------------------------------------------------------------- *
 * Печать и запись.
 * ---------------------------------------------------------------- */

const wave1 = built.filter((p) => p.wave === 1);
const byType = {};
for (const p of built) byType[p.type] = (byType[p.type] ?? 0) + 1;

console.log(`объявлено страниц: ${built.length} (волна 1: ${wave1.length}, волна 2: ${built.length - wave1.length})`);
console.log(`типы: ${Object.entries(byType).map(([t, n]) => `${t} ${n}`).join(', ')}`);
console.log('');
console.log('страницы по объёму:');
for (const p of built.slice().sort((a, b) => b.volume - a.volume)) {
  console.log(
    `  ${String(p.volume).padStart(7)}/мес  ${String(p.keywords.length).padStart(3)} запр.  волна ${p.wave}  ${p.type.padEnd(6)} ${p.url}`
  );
}
console.log('');
console.log(
  `учёт: ${onPages} на страницах + ${exclusions.length} exclusions + ${noPage.length} no_page = ${tally} из ${data.meta.phrases}`
);

if (returned.length) {
  console.log('');
  console.log(`возвращено из no_page решением владельца: ${returned.length}`);
  for (const r of returned) console.log(`  «${r.cluster}» → ${r.url}  (было: ${r.reason})`);
}

if (lost.length) {
  console.error('');
  console.error(`запросы без места (${lost.length}):`);
  for (const l of lost.slice(0, 20)) console.error(`  ${l}`);
  if (lost.length > 20) console.error(`  … ещё ${lost.length - 20}`);
}
if (problems.length) {
  console.error('');
  console.error(`несходимости (${problems.length}):`);
  for (const p of problems) console.error(`  ${p}`);
  console.error('');
  console.error('дерево не записано.');
  process.exit(1);
}

if (!dryRun) {
  const out = {
    site: doc.site,
    pages: built,
    exclusions: exclusions.sort((a, b) => a.query.localeCompare(b.query)),
    no_page: noPage.sort((a, b) => a.query.localeCompare(b.query)),
  };
  writeFileSync(docPath, JSON.stringify(out, null, 1) + '\n');
  console.log('записано: structure/structure.json');
}
