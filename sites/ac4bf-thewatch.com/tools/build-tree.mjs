#!/usr/bin/env node
/**
 * Сборка дерева сайта — стадия S2 (`docs/05_STRUCTURE_TASK.md`).
 *
 *   node tools/build-tree.mjs            — пишет structure/structure.json
 *   node tools/build-tree.mjs --dry-run  — только считает и печатает
 *   node tools/build-tree.mjs --selftest — пробы на фикстуре ядра
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
 * **Инструмент воспроизводит структуру без остатка** (бэклог 45, П52 п. 4):
 * всё, что решено рукой, живёт во входе или названо в существующей структуре
 * и переживает прогон — блоки сверх умолчаний (`блоки`), страница без спроса
 * (`вне_выгрузки`), коридор из контракта (П43). До 2026-09-15 прогон
 * возвращал `card-rail` умолчанием, терял `/prywatnosc/` и переписывал
 * коридор-предохранитель — структура правилась руками, а шапка обещала
 * обратное.
 *
 * Шапка `site` — объявление сайта, не счёт: инструмент читает её из
 * существующего `structure.json` и кладёт обратно как есть — кроме одного
 * поля. `total_queries` схема помечает «пишет: скрипт» (`schema.json`), а до
 * 2026-09-18 его не писал никто (бэклог 52 п. 3, П63 п. 4): число берётся
 * из `meta.phrases` читалки — то самое, с которым гейт структуры сверяет поле.
 *
 * Чужой текст отсюда не извлекается: `title`, `h1` и `description` написаны
 * в `pages-s2.json` от руки, корпус конкурентов этот инструмент не открывает.
 *
 * Расчёт вынесен в `buildTree()` — чистую функцию от входов, — чтобы пробы
 * `--selftest` гоняли тот же код, что и прогон, на фикстуре
 * `core/structure/fixtures/build-tree.json`: по пробе на каждый класс
 * расхождения, найденный докладом-планом 2026-09-15.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readClustering, UNCLUSTERED } from '@factory/core/structure/clustering.mjs';

// Словарь умолчаний читается файлом, а не импортом: импорт json просит
// атрибут `with { type: 'json' }`, и механическая проверка сайта на него
// сегодня отвечает подсказкой. Путь спрашиваем у резолвера пакета.
const corePath = (rel) => fileURLToPath(import.meta.resolve(`@factory/core/${rel}`));
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const parentOf = (url) => {
  if (url === '/') return null;
  const parts = url.split('/').filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join('/')}/` : '/';
};

const sameCorridor = (a, b) =>
  a === b || (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]));

/**
 * Раскладка и счёт — от входов к дереву. Ничего не читает и не печатает:
 * что печатать и падать ли, решает вызывающий по `problems` и `lost`.
 *
 * @param {object} in_
 * @param {object} in_.decl      — `pages-s2.json`
 * @param {object} in_.recon     — `s0-recon.json`
 * @param {object} in_.doc       — существующий `structure.json` (шапка и именованные коридоры)
 * @param {object|null} in_.rulesS3 — `rules-s3.json` или null до S3
 * @param {object|null} in_.anatomy — `s3-anatomy.json` или null до S3
 * @param {object} in_.typeBlocks — `core/structure/type-blocks.json`
 * @param {{phrases: object[], meta: {phrases: number}}} in_.data — выгрузка семантики
 */
export function buildTree({ decl, recon, doc, rulesS3, anatomy, typeBlocks, data }) {
  const anatomyByUrl = new Map((anatomy?.['страницы'] ?? []).map((p) => [p.url, p]));
  // Коридоры существующей структуры (П43) переживают пересборку: и `null`,
  // и число, отличное от анатомии, — именованные решения, а не счёт.
  const existingCorridor = new Map((doc.pages ?? []).map((p) => [p.url, p.corridor]));

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

  // Страница вне выгрузки (служебная, П26 п. 2) спроса не имеет по определению:
  // ей нельзя назначать ни кластер, ни фразы — пометка, под которой стоит
  // маршрут запросов, лжёт, и падать надо здесь, а не в гейте структуры.
  const outside = [];
  for (const p of pages) {
    if (!p['вне_выгрузки']) continue;
    const routes = ['cluster', 'слияния', 'возвращено_из_no_page', 'судьбы', 'темы', 'ключи'].filter(
      (k) => p[k] !== undefined && p[k] !== null && !(Array.isArray(p[k]) && p[k].length === 0)
    );
    if (routes.length) fail(`${p.url}: объявлена вне выгрузки, а несёт ${routes.join(', ')} — одно из двух`);
    outside.push({ url: p.url, reason: p['вне_выгрузки'] });
  }

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
   * из `rules-s3.json`, `порядок_на_странице`: общий `список` — как `PORZADEK`
   * маршрута; тип со своим шаблоном (главная, П41) — свой список в `по_типу`.
   * Имя вне списка встаёт в конец, сохраняя свой порядок. Расхождение с
   * шаблоном инструмент не ловит — его ловит сам шаблон при сборке.
   */
  function orderBlocks(type, blocks) {
    const rules = rulesS3?.['порядок_на_странице'] ?? {};
    const order = rules['по_типу']?.[type] ?? rules['список'] ?? [];
    const rank = (b) => {
      const i = order.indexOf(b.block);
      return i < 0 ? order.length : i;
    };
    return blocks.map((b, i) => ({ b, i })).sort((x, y) => rank(x.b) - rank(y.b) || x.i - y.i).map((x) => x.b);
  }

  const corridorsFromContract = [];

  const built = pages.map((p) => {
    const list = keywords
      .get(p.url)
      .slice()
      .sort((a, b) => b.google - a.google || a.phrase.localeCompare(b.phrase));
    const defaults = typeBlocks['умолчания'][p.type];
    if (!defaults) fail(`${p.url}: у типа «${p.type}» нет умолчаний в core/structure/type-blocks.json`);

    // Коридор длины (П43) — число из анатомии S3 (`план.коридор`), в контракт.
    // Страница без анатомии получает `null`. Значение существующей структуры,
    // отличное от анатомии, — `null` или другое число (предохранитель П43
    // п. 2), — именованное решение: инструмент его сохраняет и называет
    // строкой при прогоне, чтобы решение не исчезло молча и не перестало быть
    // видимым. Поля `status` тут нет с 2026-09-11 — его никто не вёл,
    // состояние выводит машина из наличия текста.
    const fromAnatomy = anatomyByUrl.get(p.url)?.['план']?.['коридор'] ?? null;
    let corridor = fromAnatomy;
    if (existingCorridor.has(p.url) && !sameCorridor(existingCorridor.get(p.url), fromAnatomy)) {
      corridor = existingCorridor.get(p.url);
      corridorsFromContract.push({ url: p.url, corridor, anatomy: fromAnatomy });
    }

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
      blocks: orderBlocks(p.type, [
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
      corridor,
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
  const outsideUrls = new Set(outside.map((o) => o.url));
  for (const p of built.filter((x) => x.keywords.length === 0 && !x.owner && !outsideUrls.has(x.url))) {
    fail(`${p.url}: ни одного запроса, а страница не владельца и не объявлена вне выгрузки`);
  }

  return {
    site: { ...doc.site, total_queries: data.meta.phrases },
    built,
    exclusions: exclusions.sort((a, b) => a.query.localeCompare(b.query)),
    noPage: noPage.sort((a, b) => a.query.localeCompare(b.query)),
    problems,
    lost,
    returned,
    outside,
    corridorsFromContract,
    onPages,
    tally,
  };
}

/* ---------------------------------------------------------------- *
 * Прогон на сайте: чтение входов, печать, запись.
 * ---------------------------------------------------------------- */

function run(root, { dryRun }) {
  const declPath = join(root, 'structure/pages-s2.json');
  const reconPath = join(root, 'structure/s0-recon.json');
  const rulesS3Path = join(root, 'structure/rules-s3.json');
  const anatomyPath = join(root, 'structure/s3-anatomy.json');
  const docPath = join(root, 'structure/structure.json');

  const decl = readJson(declPath);
  const recon = readJson(reconPath);
  const doc = readJson(docPath);
  // Анатомия — необязательный вход: до S3 её нет, и дерево собирается
  // на одних умолчаниях типа. Появилась — блоки получают доказательство.
  const rulesS3 = existsSync(rulesS3Path) ? readJson(rulesS3Path) : null;
  const anatomy = existsSync(anatomyPath) ? readJson(anatomyPath) : null;
  const typeBlocks = readJson(corePath('structure/type-blocks.json'));
  const data = readClustering(join(root, doc.site.semantics));

  const r = buildTree({ decl, recon, doc, rulesS3, anatomy, typeBlocks, data });
  const { site, built, exclusions, noPage, problems, lost, returned, outside, corridorsFromContract, onPages, tally } = r;

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
  if (doc.site.total_queries !== site.total_queries) {
    console.log(`site.total_queries: в структуре ${doc.site.total_queries}, по выгрузке ${site.total_queries} — пишется по выгрузке`);
  }

  if (returned.length) {
    console.log('');
    console.log(`возвращено из no_page решением владельца: ${returned.length}`);
    for (const r of returned) console.log(`  «${r.cluster}» → ${r.url}  (было: ${r.reason})`);
  }
  if (outside.length) {
    console.log('');
    console.log(`страниц вне выгрузки (спроса нет по определению): ${outside.length}`);
    for (const o of outside) console.log(`  ${o.url}  — ${o.reason}`);
  }
  if (corridorsFromContract.length) {
    console.log('');
    console.log(`коридор из контракта, не из анатомии (именованные решения, П43): ${corridorsFromContract.length}`);
    for (const c of corridorsFromContract) {
      console.log(`  ${c.url}  ${JSON.stringify(c.corridor)}  (анатомия: ${JSON.stringify(c.anatomy)})`);
    }
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
    return false;
  }

  if (!dryRun) {
    const out = { site, pages: built, exclusions, no_page: noPage };
    writeFileSync(docPath, JSON.stringify(out, null, 1) + '\n');
    console.log('записано: structure/structure.json');
  }
  return true;
}

/* ---------------------------------------------------------------- *
 * Пробы: фикстура ядра, по классу расхождения на пробу (бэклог 45).
 * Умолчания типов берутся из живого `type-blocks.json` ядра — проба класса A
 * проверяет именно те умолчания, с которыми пойдёт второй сайт.
 * ---------------------------------------------------------------- */

function selftest() {
  const fx = readJson(corePath('structure/fixtures/build-tree.json'));
  const typeBlocks = readJson(corePath('structure/type-blocks.json'));
  const data = { phrases: fx['семантика'], meta: { phrases: fx['семантика'].length } };
  const base = () => structuredClone(fx['вход']);

  const cases = [];
  const check = (имя, ждём, факт, откуда) =>
    cases.push({ имя, ждём: JSON.stringify(ждём), факт: JSON.stringify(факт), откуда });
  const blocksOf = (r, url) => r.built.find((p) => p.url === url)?.blocks.map((b) => `${b.block}(${b.source[0]})${b.role ? '#' + b.role : ''}`);
  const problemsAbout = (r, text) => r.problems.filter((p) => p.includes(text)).length;

  // Ноль: фикстура сама сходится — иначе пробы ниже меряют не то.
  const ok = buildTree({ ...base(), typeBlocks, data });
  check('фикстура: несходимостей', 0, ok.problems.length, ok.problems.join(' | ') || 'учёт сходится');
  check('фикстура: запросов без места', 0, ok.lost.length, ok.lost.join(' | ') || 'все разложены');

  // Шапка: `total_queries` — счёт из читалки, остальное — как объявлено.
  const staleHeader = base();
  staleHeader.doc.site.total_queries = 999;
  check('шапка: total_queries пишет инструмент', { ...fx['вход'].doc.site, total_queries: 8 }, buildTree({ ...staleHeader, typeBlocks, data }).site, 'бэклог 52 п. 3 — schema.json «пишет: скрипт»');

  // A — умолчания типов (A1, П52 п. 4): у game/topic `link-list` есть, `card-rail` нет;
  // место `link-list` — после `verdict-box` анатомии, перед `cta-band`; главная —
  // свой порядок `по_типу.home`, ручной блок с ролью встаёт перед `gallery`.
  check('A: game — умолчания и порядок', ['hero-key-art(t)', 'story-row(t)', 'verdict-box(a)', 'link-list(t)', 'cta-band(t)'], blocksOf(ok, '/beta/'), 'type-blocks 1.1 + порядок маршрута');
  check('A: topic — без card-rail', ['story-row(t)', 'link-list(t)', 'cta-band(t)'], blocksOf(ok, '/gamma/'), 'П20: лента без содержания дублирует link-list');
  check('A: home — свой порядок, роль', ['hero-key-art(t)', 'story-row(t)', 'band-quote(t)', 'card-rail(t)', 'link-list(m)#numeracja', 'gallery(a)', 'link-columns(t)', 'cta-band(t)'], blocksOf(ok, '/'), 'по_типу.home = PORZADEK index.astro');
  check('A: card-rail нигде умолчанием у game/topic', 0, ok.built.filter((p) => ['game', 'topic'].includes(p.type) && p.blocks.some((b) => b.block === 'card-rail')).length, 'снятие П20 — умолчанием ядра');

  // B — страница вне выгрузки: заведена во входе, ноль запросов — норма;
  // без пометки — несходимость; пометка вместе с маршрутом запросов — несходимость.
  const legal = ok.built.find((p) => p.url === '/prywatnosc/');
  check('B: legal воспроизведена', { keywords: 0, volume: 0, cluster: null, blocks: ['byline(m)', 'story-row(t)'] }, legal && { keywords: legal.keywords.length, volume: legal.volume, cluster: legal.cluster, blocks: blocksOf(ok, '/prywatnosc/') }, 'П42 — руками, теперь входом');
  check('B: вне выгрузки — в печати', ['/prywatnosc/'], ok.outside.map((o) => o.url), 'строка прогона');
  const noMark = base();
  delete noMark.decl['страницы'].find((p) => p.url === '/prywatnosc/')['вне_выгрузки'];
  check('B: без пометки — несходимость', 1, problemsAbout(buildTree({ ...noMark, typeBlocks, data }), 'ни одного запроса'), 'отрицательная проба');
  const withRoute = base();
  withRoute.decl['страницы'].find((p) => p.url === '/prywatnosc/')['ключи'] = ['gamma sklep'];
  check('B: пометка + ключи — несходимость', 1, problemsAbout(buildTree({ ...withRoute, typeBlocks, data }), 'вне выгрузки, а несёт'), 'отрицательная проба');

  // C — коридор: анатомия даёт число; существующая структура с другим числом
  // или `null` — именованное решение, инструмент сохраняет и называет.
  check('C: коридор из анатомии', [100, 200], ok.built.find((p) => p.url === '/gamma/').corridor, 'план.коридор S3');
  check('C: предохранитель сохранён', [100, 250], ok.built.find((p) => p.url === '/beta/').corridor, 'П43 п. 2 — число из контракта');
  check('C: null сохранён', null, ok.built.find((p) => p.url === '/').corridor, 'П43 — именованный null');
  check('C: оба названы строкой', ['/', '/beta/'], ok.corridorsFromContract.map((c) => c.url), 'печать прогона');
  const noDoc = base();
  noDoc.doc.pages = [];
  check('C: без структуры — анатомия', [100, 200], buildTree({ ...noDoc, typeBlocks, data }).built.find((p) => p.url === '/beta/').corridor, 'отрицательная проба: нечего сохранять');

  let failed = 0;
  for (const c of cases) {
    const hit = c.ждём === c.факт;
    if (!hit) failed += 1;
    console.log(`${hit ? 'ok  ' : 'ŹLE '} ${c.имя.padEnd(40)} ждём ${c.ждём} факт ${c.факт}  — ${c.откуда}`);
  }
  console.log(`\n${cases.length - failed}/${cases.length} проб build-tree сходятся`);
  return failed === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const ok = process.argv.includes('--selftest') ? selftest() : run(root, { dryRun: process.argv.includes('--dry-run') });
  if (!ok) process.exit(1);
}
