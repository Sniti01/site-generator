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

import { readFileSync, writeFileSync } from 'node:fs';
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
const docPath = join(root, 'structure/structure.json');

const dryRun = process.argv.includes('--dry-run');

const decl = JSON.parse(readFileSync(declPath, 'utf8'));
const recon = JSON.parse(readFileSync(reconPath, 'utf8'));
const doc = JSON.parse(readFileSync(docPath, 'utf8'));
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
  for (const c of [p.cluster, ...(p['слияния'] ?? [])].filter(Boolean)) claim(pageByCluster, c, p.url, 'кластер');
  for (const f of p['судьбы'] ?? []) claim(pageByFate, f, p.url, 'судьба');
  for (const t of p['темы'] ?? []) claim(pageByTheme, t, p.url, 'тема');
  for (const k of p['ключи'] ?? []) claim(pageByKey, k, p.url, 'ключ');
}

const clusterFate = new Map(recon['кластеры'].map((c) => [c['кластер'], c]));
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
  } else if (fate === 'no_page') {
    noPage.push({ query: phrase.phrase, reason: row['причина'] });
    seen.set(phrase.phrase, 'no_page');
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
    const url = pageByFate.get(fate);
    usedFates.add(fate);
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
    blocks: (defaults ?? []).map((block) => ({ block, source: 'type-default', confidence: 'low' })),
    wave: p.wave,
    status: p.status ?? 'planned',
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
