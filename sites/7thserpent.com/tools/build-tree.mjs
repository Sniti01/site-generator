#!/usr/bin/env node
/**
 * Сборка дерева сайта — стадия S2 (`docs/05_STRUCTURE_TASK.md`), второй сайт.
 *
 *   node tools/build-tree.mjs            — пишет structure/structure.json
 *   node tools/build-tree.mjs --dry-run  — только считает и печатает
 *   node tools/build-tree.mjs --selftest — пробы на фикстуре structure/fixtures/build-tree.json
 *
 * Копия `sites/ac4bf-thewatch.com/tools/build-tree.mjs` (бэклог 45, П52 п. 4;
 * `total_queries` — `a93dba2`), параметризованная под судьбы разведки этого
 * сайта (П64, `tools/recon-s0.mjs`). Что здесь иначе, чем у первого сайта:
 *
 *   1. Судьба «тема» вместо нишевых судеб «карта_мест»/«люди_истории».
 *      Кластер с судьбой «тема» несёт `цель` (имя темы из `rules-s0.json`,
 *      `серийные_темы`) и `хаб` (кластер игры или null — тема серии). Фраза
 *      «Некластеризовано» с судьбой «новая_тема» несёт те же два поля.
 *      Страница забирает пару «тема @ игра» полем `темы`: строка `"cheats"`
 *      — тема серии (хаб null), строка `"cheats @ max payne 3"` — тема
 *      с игрой. Пара, не забранная никем, роняет прогон с перечислением;
 *      объявленная и никем не использованная — тоже.
 *   2. Хаб по фразам разведка называет и псевдо-хабом «max payne mobile»
 *      (`rules-s0.json`, `игры`), которого в выгрузке нет. Кластер с судьбой
 *      «слить_в_хаб» в такой хаб ложится только явным объявлением в
 *      `слияния` — так П65 п. 3 (мобильная версия — раздел хаба MP1) стоит
 *      в `pages-s2.json` строкой, а не угадывается инструментом.
 *   3. `no_page_ключи` — отдельные фразы, отправленные в `no_page`
 *      объявлением (S0 §4.4 и П65 п. 1: «max payne apk download» — `no_page`
 *      на S2, кластер «max payne apk» при этом — раздел MP1). Строка несёт
 *      причину и, если есть, адрес страницы, где тема упомянута.
 *   4. Судьбы «судьбы» (страница забирает судьбу целиком) и `rules-s3.json`
 *      с порядком блоков — как у первого сайта: первое здесь не нужно
 *      (тем нет судьбы-владельца), второе появится на S3.
 *
 * Инструмент **не решает, какие страницы существуют**: состав дерева объявлен
 * в `structure/pages-s2.json`, судьбы кластеров подтверждены владельцем (П65)
 * и лежат в `structure/s0-recon.json`. Здесь только раскладка: каждому запросу
 * выгрузки находится ровно одно место — страница, `exclusions` или `no_page`, —
 * и считается то, что руками не пишут (`volume`, `parent`, `blocks` умолчаний,
 * `site.total_queries`).
 *
 * **Тихих потерь не бывает.** Запрос, которому не нашлось места, роняет сборку
 * с перечислением: правило, которое молча теряет часть семантики, хуже
 * отсутствующего правила. То же на удвоение и на кластер, назначенный двум
 * страницам.
 *
 * Шапка `site` — объявление сайта, не счёт: инструмент читает её из
 * существующего `structure.json` и кладёт обратно как есть — кроме одного
 * поля. `total_queries` схема помечает «пишет: скрипт»: число берётся из
 * `meta.phrases` читалки — то самое, с которым гейт структуры сверяет поле.
 *
 * Чужой текст отсюда не извлекается: `title`, `h1` и `description` написаны
 * в `pages-s2.json` от руки, корпус конкурентов этот инструмент не открывает.
 *
 * `--selftest` гоняет тот же код, что и прогон, на фикстуре сайта
 * `structure/fixtures/build-tree.json`: по пробе на каждый класс расхождения
 * первого сайта (A умолчания, B страница вне выгрузки, C коридор) и на каждое
 * правило этого сайта (T темы, H псевдо-хаб, K ключи и судьбы, N `no_page`,
 * R сторожа пачек — no_page/exclusions не перекрываются слиянием и ключом,
 * W поля объявления — закрытый список). Рецензия 2026-09-18 (доклад сессии 5)
 * добавила R и W и пробы T на откат к теме серии и на жизнь пары через ключ.
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
 * Пара «тема @ игра» одной строкой — так она объявляется в `pages-s2.json`
 * и так печатается в отчёте прогона. Тема серии (хаб null) — просто имя темы.
 */
export const themeKey = (theme, game) => (game ? `${theme} @ ${game}` : theme);

/** Разбор объявленной строки: «cheats @ max payne 3» → { theme, game }. */
export function parseThemeKey(s) {
  const at = s.indexOf(' @ ');
  if (at < 0) return { theme: s.trim(), game: null };
  return { theme: s.slice(0, at).trim(), game: s.slice(at + 3).trim() || null };
}

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

  const problems = [];
  const fail = (msg) => problems.push(msg);
  // Страница без адреса — чистый отказ до раскладки: дальше `url` — ключ
  // всех словарей, и без него инструмент падал бы TypeError, а не строкой.
  const pages = (decl['страницы'] ?? []).filter((p) => {
    if (typeof p.url === 'string' && p.url) return true;
    fail(`страница без url: ${JSON.stringify(p).slice(0, 80)}…`);
    return false;
  });

  /* ---------------------------------------------------------------- *
   * Куда что уходит: словари, собранные из объявления страниц.
   * Порядок разбора — от частного к общему: `no_page`-ключ и явный ключ
   * сильнее кластера, кластер, названный страницей, сильнее судьбы,
   * судьба сильнее темы. Иначе одну фразу нельзя было бы вынуть из темы,
   * не переписав саму тему, а темы подтверждены владельцем.
   * ---------------------------------------------------------------- */

  const pageByCluster = new Map();
  const pageByTheme = new Map();
  const pageByKey = new Map();
  const noPageByKey = new Map();

  const claim = (map, key, url, what) => {
    if (map.has(key)) fail(`${what} «${key}» назначен двум страницам: ${map.get(key)} и ${url}`);
    map.set(key, url);
  };

  // Поля объявления — закрытый список: описка («ключ» вместо «ключи», «тема»
  // вместо «темы», поле первого сайта «судьбы») не должна молча оставлять
  // фразы в кластере, где их не ждали, при сходящемся учёте.
  const PAGE_FIELDS = new Set(['url', 'type', 'cluster', 'слияния', 'возвращено_из_no_page', 'темы', 'ключи', 'блоки', 'related', 'wave', 'h1', 'title', 'description', 'owner', 'template', 'вне_выгрузки']);
  const TOP_FIELDS = new Set(['версия', 'статус', 'источник', 'как_читать', 'почему_именно_эти_страницы', 'почему_слияния', 'страницы', 'no_page_ключи', 'чего_здесь_нет']);
  for (const k of Object.keys(decl)) if (!TOP_FIELDS.has(k)) fail(`объявление: неизвестное поле «${k}» верхнего уровня`);
  for (const p of pages) for (const k of Object.keys(p)) if (!PAGE_FIELDS.has(k)) fail(`${p.url}: неизвестное поле «${k}» — сверь имя`);

  // Страница вне выгрузки (служебная, П26 п. 2) спроса не имеет по определению:
  // ей нельзя назначать ни кластер, ни фразы — пометка, под которой стоит
  // маршрут запросов, лжёт, и падать надо здесь, а не в гейте структуры.
  const outside = [];
  for (const p of pages) {
    if (!p['вне_выгрузки']) continue;
    const routes = ['cluster', 'слияния', 'возвращено_из_no_page', 'темы', 'ключи'].filter(
      (k) => p[k] !== undefined && p[k] !== null && !(Array.isArray(p[k]) && p[k].length === 0)
    );
    if (routes.length) fail(`${p.url}: объявлена вне выгрузки, а несёт ${routes.join(', ')} — одно из двух`);
    outside.push({ url: p.url, reason: p['вне_выгрузки'] });
  }

  for (const p of pages) {
    const merges = [...(p['слияния'] ?? []), ...(p['возвращено_из_no_page'] ?? [])];
    for (const c of [p.cluster, ...merges].filter(Boolean)) claim(pageByCluster, c, p.url, 'кластер');
    for (const t of p['темы'] ?? []) {
      const { theme, game } = parseThemeKey(t);
      claim(pageByTheme, themeKey(theme, game), p.url, 'тема');
    }
    for (const k of p['ключи'] ?? []) claim(pageByKey, k, p.url, 'ключ');
  }

  // `no_page`-ключ — фраза, отправленная в `no_page` объявлением, поверх
  // судьбы кластера. Причина обязательна (контракт `no_page_item`); адрес
  // «упомянуто на» — по желанию, но только существующей страницы.
  const urlsDeclared = new Set(pages.map((p) => p.url));
  const clusterFate = new Map(recon['кластеры'].map((c) => [c['кластер'], c]));
  const phraseFate = new Map(recon['некластеризовано'].map((r) => [r['фраза'], r]));
  const clusterOfPhrase = new Map(data.phrases.map((x) => [x.phrase, x.cluster]));
  // Судьба фразы по разведке — тем же порядком, что раскладка: у кластерной
  // фразы — строка кластера, у «Некластеризовано» — своя строка; null, если
  // фразы в выгрузке нет. Кластер первым (F1, бэклог 54 п. 12, как `2304aba`
  // первого сайта): устаревшая строка `некластеризовано` на фразу, которую
  // новая выгрузка кластеризовала, иначе судила бы сторожа не тем порядком.
  const fateOfPhrase = (phrase) => {
    const cluster = clusterOfPhrase.get(phrase);
    if (!cluster) return null;
    const row = cluster === UNCLUSTERED ? phraseFate.get(phrase) : clusterFate.get(cluster);
    return row?.['судьба'] ?? null;
  };

  // Возвраты из `no_page` собираются до сторожей ключей: и ключ страницы,
  // и `no_page`-ключ на фразу возвращённого кластера должны называть возврат,
  // а не судьбу разведки.
  const returned = [];
  const returnedTo = new Map();
  for (const p of pages) {
    for (const c of p['возвращено_из_no_page'] ?? []) {
      const row = clusterFate.get(c);
      if (!row) fail(`возврат из no_page: кластера «${c}» нет в разведке`);
      else if (row['судьба'] !== 'no_page') fail(`возврат из no_page: у «${c}» судьба «${row['судьба']}», а не «no_page» — это обычное слияние`);
      else {
        returned.push({ cluster: c, url: p.url, reason: row['причина'] });
        returnedTo.set(c, p.url);
      }
    }
  }
  for (const row of decl['no_page_ключи'] ?? []) {
    const key = row['ключ'];
    if (!key || !row['причина']) {
      fail(`no_page_ключи: строка без «ключ» или «причина» — ${JSON.stringify(row)}`);
      continue;
    }
    // Пачки не перекрываются и отсюда: exclusions в no_page не переводится,
    // а фраза, уже стоящая в no_page по разведке, ключа не требует — второй
    // причины у неё быть не должно.
    const fate = fateOfPhrase(key);
    if (fate === 'exclusions') fail(`no_page_ключ «${key}»: фраза с судьбой exclusions — не по теме, в no_page не переводится`);
    if (fate === 'no_page') {
      const back = returnedTo.get(clusterOfPhrase.get(key));
      fail(back
        ? `no_page_ключ «${key}»: кластер «${clusterOfPhrase.get(key)}» возвращён из no_page целиком на ${back}; no_page_ключом не дробится`
        : `no_page_ключ «${key}»: фраза уже в no_page по разведке — ключ лишний, причину разведки не перекрывает`);
    }
    if (noPageByKey.has(key)) fail(`no_page_ключ «${key}» объявлен дважды`);
    if (pageByKey.has(key)) fail(`«${key}» объявлен и ключом страницы ${pageByKey.get(key)}, и no_page_ключом — одно из двух`);
    if (row['упомянуто_на'] && !urlsDeclared.has(row['упомянуто_на'])) {
      fail(`no_page_ключ «${key}»: «упомянуто_на» ${row['упомянуто_на']} — такой страницы нет в объявлении`);
    }
    noPageByKey.set(key, row);
  }

  // Возврат из `no_page` — не рядовое слияние: он отменяет строку пачки,
  // подтверждённой владельцем, поэтому объявляется отдельным полем, печатается
  // отдельной строкой и требует, чтобы у кластера действительно стояла судьба
  // «no_page». Разрешение на конкретные кластеры даёт владелец, не инструмент.
  // Обратное тоже сторожится: кластер с судьбой «no_page» в обычных «слияния»
  // или якорем — отмена решения без следа; кластер с судьбой «exclusions» —
  // не по теме, страницей не перекрывается; ключ на фразу с такой судьбой —
  // та же отмена в обход поля (рецензия 2026-09-18, находки 1–3).
  for (const p of pages) {
    const guard = (c, where) => {
      const fate = clusterFate.get(c)?.['судьба'];
      if (fate === 'no_page') {
        fail(where === 'якорь'
          ? `${p.url}: якорь «${c}» — кластер с судьбой no_page; якорем такой кластер не стоит, возврат — только полем «возвращено_из_no_page»`
          : `${p.url}: кластер «${c}» с судьбой no_page — возврат объявляется полем «возвращено_из_no_page», не «слияния»`);
      }
      if (fate === 'exclusions') fail(`${p.url}: ${where} «${c}» — кластер с судьбой exclusions, не по теме; страница его не перекрывает`);
    };
    if (p.cluster) guard(p.cluster, 'якорь');
    for (const c of p['слияния'] ?? []) guard(c, 'слияние');
    for (const k of p['ключи'] ?? []) {
      const fate = fateOfPhrase(k);
      if (fate === 'exclusions') fail(`${p.url}: ключ «${k}» — фраза с судьбой exclusions, не по теме; ключом на страницу не берётся`);
      if (fate === 'no_page') {
        const cluster = clusterOfPhrase.get(k);
        const back = cluster && returnedTo.get(cluster);
        // Возвращённый кластер возвращён целиком: ключом он не дробится —
        // возврат разрешён владельцем на кластер, а не на фразу. Ключ той же
        // страницы, что и возврат, просто лишний.
        fail(!back
          ? `${p.url}: ключ «${k}» — фраза с судьбой no_page; возврат ключом не объявляется (пачка П65)`
          : back === p.url
            ? `${p.url}: ключ «${k}» лишний — кластер «${cluster}» уже возвращён на эту страницу целиком`
            : `${p.url}: ключ «${k}» — кластер «${cluster}» возвращён из no_page целиком на ${back}; ключом не дробится`);
      }
    }
  }

  /* ---------------------------------------------------------------- *
   * Раскладка: каждой фразе выгрузки — ровно одно место.
   * ---------------------------------------------------------------- */

  const keywords = new Map(pages.map((p) => [p.url, []]));
  const exclusions = [];
  const noPage = [];
  const seen = new Map();
  const lost = [];
  const usedThemes = new Set();
  const carved = [];

  // Пара «тема @ игра» фразы по разведке — есть у кластера с судьбой «тема»
  // и у фразы «Некластеризовано» с судьбой «новая_тема»; у остальных нет.
  const pairOf = (phrase) => {
    const row = phrase.cluster === UNCLUSTERED ? phraseFate.get(phrase.phrase) : clusterFate.get(phrase.cluster);
    if (!row) return null;
    const fate = row['судьба'];
    if (fate !== 'тема' && fate !== 'новая_тема') return null;
    return themeKey(row['цель'], row['хаб'] ?? null);
  };

  const toPage = (url, phrase) => {
    if (!keywords.has(url)) {
      fail(`страницы «${url}» нет в объявлении, а на неё направлен запрос «${phrase.phrase}»`);
      return;
    }
    keywords.get(url).push(phrase);
    // Объявленная пара жива, если хоть одна её фраза легла на объявившую
    // страницу — любым путём: темой, кластером-якорем или ключом. Пара,
    // чей единственный кластер — якорь той же страницы, до маршрута темы
    // не доходит, но мёртвой не является.
    const key = pairOf(phrase);
    if (key && pageByTheme.get(key) === url) usedThemes.add(key);
  };

  // Тема — последняя инстанция для кластера и для фразы «Некластеризовано»:
  // пара «тема @ игра» должна быть забрана какой-то страницей поимённо.
  const toTheme = (phrase, theme, game) => {
    const key = themeKey(theme, game);
    const url = pageByTheme.get(key);
    if (!url) {
      lost.push(`${phrase.phrase} — тема «${key}», а страницы у пары нет: объяви её в «темы»`);
      return;
    }
    toPage(url, phrase);
    seen.set(phrase.phrase, url);
  };

  for (const phrase of data.phrases) {
    if (seen.has(phrase.phrase)) {
      fail(`запрос «${phrase.phrase}» встречается в выгрузке дважды`);
      continue;
    }

    const carve = noPageByKey.get(phrase.phrase);
    if (carve) {
      noPage.push({
        query: phrase.phrase,
        reason: carve['причина'],
        ...(carve['упомянуто_на'] ? { mentioned_on: carve['упомянуто_на'] } : {}),
      });
      seen.set(phrase.phrase, 'no_page');
      carved.push({ query: phrase.phrase, cluster: phrase.cluster, reason: carve['причина'] });
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
        toTheme(phrase, row['цель'], row['хаб'] ?? null);
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
    const claimed = pageByCluster.get(phrase.cluster);
    if (fate === 'exclusions') {
      exclusions.push({ query: phrase.phrase, reason: row['причина'] });
      seen.set(phrase.phrase, 'exclusions');
    } else if (fate === 'no_page' && !claimed) {
      noPage.push({ query: phrase.phrase, reason: row['причина'] });
      seen.set(phrase.phrase, 'no_page');
    } else if (fate === 'no_page') {
      // Сюда попадают только кластеры из `возвращено_из_no_page`: обычное
      // слияние такой судьбы не перекрывает — сторож в цикле объявлений выше
      // (no_page в «слияния» — несходимость) это гарантирует.
      toPage(claimed, phrase);
      seen.set(phrase.phrase, claimed);
    } else if (claimed) {
      // Кластер, названный страницей поимённо (`cluster` или `слияния`),
      // сильнее судьбы разведки: хаб там угадан по словам во фразах, а выдача
      // иногда называет другую игру («max payne ps4» — витрина и обзоры
      // первой части, не серии); тема, забранная кластером, — раздел
      // страницы, а не страница темы («max payne review» — обзоры 2001 года
      // на хабе MP1).
      toPage(claimed, phrase);
      seen.set(phrase.phrase, claimed);
    } else if (fate === 'главная' || fate === 'страница' || fate === 'волна_2') {
      lost.push(`${phrase.phrase} — кластер «${phrase.cluster}» (${fate}) не взят ни одной страницей`);
    } else if (fate === 'слить_в_хаб') {
      // Хаб разведки — только настоящий кластер, взятый страницей; псевдо-хаб
      // («max payne mobile») страницы не имеет, и кластер ложится в неё лишь
      // явным «слияния» (П65 п. 3).
      const url = pageByCluster.get(row['цель']);
      if (!url) lost.push(`${phrase.phrase} — слияние в «${row['цель']}», а страницы у хаба нет: объяви кластер «${phrase.cluster}» в «слияния»`);
      else {
        toPage(url, phrase);
        seen.set(phrase.phrase, url);
      }
    } else if (fate === 'тема') {
      toTheme(phrase, row['цель'], row['хаб'] ?? null);
    } else {
      lost.push(`${phrase.phrase} — судьба «${fate}» разложить нечем`);
    }
  }

  for (const [key, url] of pageByKey) {
    if (!seen.has(key)) fail(`ключ «${key}» (страница ${url}) в выгрузке не встречается — сверь знак в знак`);
    // Имена кластеров в этой выгрузке — те же строки, что фразы («max payne
    // cheats», «max payne 1»). Ключ, совпавший с именем кластера, почти
    // наверняка описка: хотели забрать кластер, а забрали одну фразу.
    // Кластер объявляют в «слияния».
    if (clusterFate.has(key)) fail(`ключ «${key}» (страница ${url}) совпадает с именем кластера — если нужен кластер целиком, объяви его в «слияния»`);
  }
  for (const key of noPageByKey.keys()) {
    if (!seen.has(key)) fail(`no_page_ключ «${key}» в выгрузке не встречается — сверь знак в знак`);
  }
  // Мёртвое объявление молчать не должно — тем же доводом, что и ключ с опиской.
  for (const [theme, url] of pageByTheme) {
    if (!usedThemes.has(theme)) fail(`тема «${theme}» (страница ${url}) не дала странице ни одной фразы: в разведке такой пары нет или все её фразы забраны другими страницами`);
  }
  for (const [c, url] of pageByCluster) {
    if (!clusterFate.has(c)) fail(`кластера «${c}» (страница ${url}) нет в разведке — сверь знак в знак`);
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
      // Доказательство — число контракта: не целое или «документов больше, чем из»
      // не переносится в structure.json молча, а останавливает прогон.
      const [n, of] = [measured['документов'], measured['из']];
      if (!Number.isInteger(n) || !Number.isInteger(of) || n < 0 || of < 1 || n > of) {
        fail(`${url}: блок ${block} — доказательство анатомии не число «документов/из» (${JSON.stringify(n)}/${JSON.stringify(of)}); s3-anatomy.json правлен руками или испорчен`);
        continue;
      }
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
   * из `rules-s3.json`, `порядок_на_странице`: общий `список` и свой список
   * `по_типу` у типа со своим шаблоном. До S3 файла нет — порядок объявления:
   * умолчания типа, затем анатомия, затем рука. Имя вне списка встаёт в конец,
   * сохраняя свой порядок. Расхождение с шаблоном инструмент не ловит — его
   * ловит сам шаблон при сборке.
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
  // Страницы, чей коридор анатомии — ориентир по нише (своих документов меньше
  // минимума): в контракт он идёт тем же числом, поэтому печатается отдельно.
  const orienteers = [];

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
    // видимым.
    let fromAnatomy = anatomyByUrl.get(p.url)?.['план']?.['коридор'] ?? null;
    if (fromAnatomy !== null && !(Array.isArray(fromAnatomy) && fromAnatomy.length === 2 && fromAnatomy.every(Number.isInteger) && fromAnatomy[0] > 0 && fromAnatomy[0] <= fromAnatomy[1])) {
      fail(`${p.url}: коридор анатомии не пара целых min ≤ max (${JSON.stringify(fromAnatomy)}); s3-anatomy.json правлен руками или испорчен`);
      fromAnatomy = null;
    }
    if (anatomyByUrl.get(p.url)?.['план']?.['ориентир']) orienteers.push({ url: p.url, corridor: fromAnatomy });
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
    // Один блок — один источник: имя (с ролью), пришедшее и умолчанием, и
    // анатомией, и рукой, встало бы на страницу дважды, и ни гейт, ни шаблон
    // этого не увидят.
    const seenBlocks = new Map();
    for (const b of page.blocks) {
      const key = `${b.block}#${b.role ?? ''}`;
      if (seenBlocks.has(key)) fail(`${p.url}: блок ${b.block}${b.role ? '#' + b.role : ''} дважды — ${seenBlocks.get(key)} и ${b.source}; два источника одного блока не складываются`);
      else seenBlocks.set(key, b.source);
    }
    return page;
  });

  // Анатомия и дерево — с одной раскладки: корпус страницы собран из её фраз
  // (бэклог 54 п. 3), поэтому правка объявления без нового измерения делает
  // анатомию устаревшей, и блоки с коридорами встали бы по чужому корпусу.
  if (anatomy) {
    const builtUrls = new Set(built.map((p) => p.url));
    for (const p of built) {
      const a = anatomyByUrl.get(p.url);
      if (p.keywords.length && !a) fail(`${p.url}: страница спроса без строки в s3-anatomy.json — анатомия отстала от дерева; npm run anatomy, затем npm run tree`);
      else if (a && a['фраз'] !== p.keywords.length) fail(`${p.url}: в s3-anatomy.json фраз ${a['фраз']}, на странице ${p.keywords.length} — анатомия отстала от дерева; npm run anatomy, затем npm run tree`);
    }
    for (const url of anatomyByUrl.keys()) if (!builtUrls.has(url)) fail(`s3-anatomy.json: страница ${url} — её нет в дереве; анатомия отстала от объявления`);
  }

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

  // Темы, разложенные по страницам, — для печати: видно, какая страница
  // какие пары забрала и сколько фраз это дало.
  const themesByPage = new Map();
  for (const [key, url] of pageByTheme) {
    if (!themesByPage.has(url)) themesByPage.set(url, []);
    themesByPage.get(url).push(key);
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
    carved,
    themesByPage,
    corridorsFromContract,
    orienteers,
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
  const { site, built, exclusions, noPage, problems, lost, returned, outside, carved, themesByPage, corridorsFromContract, orienteers, onPages, tally } = r;

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

  if (themesByPage.size) {
    console.log('');
    console.log(`темы по страницам (пар: ${[...themesByPage.values()].reduce((s, l) => s + l.length, 0)}):`);
    for (const [url, keys] of themesByPage) console.log(`  ${url}  ${keys.join(' · ')}`);
  }
  if (carved.length) {
    console.log('');
    console.log(`фраз, отправленных в no_page объявлением (no_page_ключи): ${carved.length}`);
    for (const c of carved) console.log(`  «${c.query}» из кластера «${c.cluster}»  — ${c.reason}`);
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
  if (anatomy) {
    // Сводка S3 — главный выход анатомии в контракте: блоки и коридоры видны
    // в печати, а не только в файле.
    const fromAnatomy = built.flatMap((p) => p.blocks.filter((b) => b.source === 'anatomy').map((b) => ({ url: p.url, ...b })));
    const byName = {};
    for (const b of fromAnatomy) byName[b.block] = { ...(byName[b.block] ?? {}), [b.confidence]: (byName[b.block]?.[b.confidence] ?? 0) + 1 };
    const sources = {};
    for (const p of built) for (const b of p.blocks) sources[b.source] = (sources[b.source] ?? 0) + 1;
    console.log('');
    console.log(`блоки: ${Object.values(sources).reduce((s, n) => s + n, 0)} — ${Object.entries(sources).map(([s, n]) => `${s} ${n}`).join(', ')}`);
    console.log(`блоки анатомии: ${Object.entries(byName).map(([n, v]) => `${n} ${Object.entries(v).map(([c, k]) => `${c} ${k}`).join(' + ')}`).join('; ') || 'нет'}`);
    for (const b of fromAnatomy) console.log(`  ${b.url}  ${b.block} ${b.confidence} ${b.evidence}`);
    const withCorridor = built.filter((p) => p.corridor !== null);
    console.log(`коридоры: ${withCorridor.length} числом, ${built.length - withCorridor.length} null`);
    for (const p of built) console.log(`  ${p.url}  ${JSON.stringify(p.corridor)}`);
    for (const o of orienteers) console.log(`  коридор-ориентир (медиана ниши, своих документов меньше минимума): ${o.url} ${JSON.stringify(o.corridor)} — в контракт идёт тем же числом, гейт судит его как норму`);
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

  const text = JSON.stringify({ site, pages: built, exclusions, no_page: noPage }, null, 1) + '\n';
  if (!dryRun) {
    writeFileSync(docPath, text);
    console.log('записано: structure/structure.json');
    return true;
  }
  // Сухой прогон сверяет построенное с записанным: structure.json, отставший
  // от объявления, анатомии или правил, — отказ, а не зелёная печать.
  if (readFileSync(docPath, 'utf8') !== text) {
    const was = new Map((doc.pages ?? []).map((p) => [p.url, JSON.stringify(p)]));
    const differ = built.filter((p) => was.get(p.url) !== JSON.stringify(p)).map((p) => p.url);
    console.error('');
    console.error(`structure/structure.json расходится с построенным (страниц: ${differ.length}${differ.length ? ' — ' + differ.slice(0, 6).join(', ') : ''}); npm run tree`);
    return false;
  }
  console.log('structure/structure.json совпадает с построенным');
  return true;
}

/* ---------------------------------------------------------------- *
 * Пробы: фикстура сайта, по классу расхождения на пробу.
 * Умолчания типов берутся из живого `type-blocks.json` ядра — проба класса A
 * проверяет именно те умолчания, с которыми идёт этот сайт.
 * ---------------------------------------------------------------- */

function selftest(root) {
  const fx = readJson(join(root, 'structure/fixtures/build-tree.json'));
  const typeBlocks = readJson(corePath('structure/type-blocks.json'));
  const data = { phrases: fx['семантика'], meta: { phrases: fx['семантика'].length } };
  const base = () => structuredClone(fx['вход']);
  const tree = (input) => buildTree({ ...input, typeBlocks, data });

  const cases = [];
  const check = (имя, ждём, факт, откуда) =>
    cases.push({ имя, ждём: JSON.stringify(ждём), факт: JSON.stringify(факт), откуда });
  const blocksOf = (r, url) => r.built.find((p) => p.url === url)?.blocks.map((b) => `${b.block}(${b.source[0]})${b.role ? '#' + b.role : ''}`);
  const kw = (r, url) => r.built.find((p) => p.url === url)?.keywords;
  const problemsAbout = (r, text) => r.problems.filter((p) => p.includes(text)).length;
  const lostAbout = (r, text) => r.lost.filter((p) => p.includes(text)).length;
  const page = (input, url) => input.decl['страницы'].find((p) => p.url === url);

  // Ноль: фикстура сама сходится — иначе пробы ниже меряют не то.
  const ok = tree(base());
  check('фикстура: несходимостей', 0, ok.problems.length, ok.problems.join(' | ') || 'учёт сходится');
  check('фикстура: запросов без места', 0, ok.lost.length, ok.lost.join(' | ') || 'все разложены');
  check('фикстура: учёт', data.meta.phrases, ok.tally, 'страницы + exclusions + no_page');

  // Шапка: `total_queries` — счёт из читалки, остальное — как объявлено.
  const staleHeader = base();
  staleHeader.doc.site.total_queries = 999;
  check('шапка: total_queries пишет инструмент', { ...fx['вход'].doc.site, total_queries: data.meta.phrases }, tree(staleHeader).site, 'бэклог 52 п. 3 — schema.json «пишет: скрипт»');

  // A — умолчания типов ядра (1.1) и порядок без rules-s3: умолчания, затем рука.
  check('A: game — умолчания + рука в конце', ['hero-key-art(t)', 'story-row(t)', 'link-list(t)', 'cta-band(t)', 'story-row(m)#mobile'], blocksOf(ok, '/one/'), 'type-blocks 1.1, rules-s3 нет — порядок объявления');
  check('A: topic — без card-rail, ручной hero', ['story-row(t)', 'link-list(t)', 'cta-band(t)', 'hero-key-art(m)'], blocksOf(ok, '/movie/'), 'прецедент /assassins-creed-rodowod/');
  check('A: home — умолчания + link-list с ролью', ['hero-key-art(t)', 'story-row(t)', 'band-quote(t)', 'card-rail(t)', 'link-columns(t)', 'cta-band(t)', 'link-list(m)#games-in-order'], blocksOf(ok, '/'), 'прецедент numeracja-serii');

  // B — страница вне выгрузки: ноль запросов — норма; без пометки — несходимость;
  // пометка вместе с маршрутом — несходимость.
  const legal = ok.built.find((p) => p.url === '/privacy/');
  check('B: legal воспроизведена', { keywords: 0, volume: 0, cluster: null, blocks: ['story-row(t)', 'byline(m)'] }, legal && { keywords: legal.keywords.length, volume: legal.volume, cluster: legal.cluster, blocks: blocksOf(ok, '/privacy/') }, 'П42/П54 — входом');
  check('B: вне выгрузки — в печати', ['/privacy/'], ok.outside.map((o) => o.url), 'строка прогона');
  const noMark = base();
  delete page(noMark, '/privacy/')['вне_выгрузки'];
  check('B: без пометки — несходимость', 1, problemsAbout(tree(noMark), 'ни одного запроса'), 'отрицательная проба');
  const withRoute = base();
  page(withRoute, '/privacy/')['темы'] = ['order'];
  check('B: пометка + темы — несходимость', 1, problemsAbout(tree(withRoute), 'вне выгрузки, а несёт'), 'отрицательная проба');

  // C — коридор: анатомии нет — `null`; существующая структура с числом или
  // `null` — именованное решение, инструмент сохраняет и называет.
  check('C: без анатомии — null', null, ok.built.find((p) => p.url === '/movie/').corridor, 'до S3');
  check('C: предохранитель сохранён', [100, 250], ok.built.find((p) => p.url === '/one/').corridor, 'П43 п. 2 — число из контракта');
  check('C: назван строкой', ['/one/'], ok.corridorsFromContract.map((c) => c.url), 'печать прогона');

  // T — темы: пара «тема @ игра» — страница; тема серии — своя страница;
  // фраза «Некластеризовано» с игрой — на страницу пары; пара без страницы —
  // потеря с именем пары; объявленная и неиспользованная — несходимость;
  // кластер темы, названный в «слияния», уходит туда, а не в тему.
  check('T: тема серии → страница темы', ['brand cheats', 'brand cheat codes', 'brand gba cheats'], kw(ok, '/cheats/'), 'cheats + cheats @ brand one');
  check('T: тема с игрой → своя страница', ['brand three guide', 'brand three chapter 4'], kw(ok, '/three/guide/'), 'guides @ brand three: кластер и фраза «Некластеризовано»');
  check('T: тема на хабе игры', true, kw(ok, '/three/').includes('brand three review'), 'reviews @ brand three — раздел хаба');
  check('T: темы по страницам — печать', ['cheats', 'cheats @ brand one'], ok.themesByPage.get('/cheats/'), 'печать прогона');
  const noPair = base();
  page(noPair, '/three/')['темы'] = [];
  const r1 = tree(noPair);
  check('T: пара без страницы — потеря с именем', 1, lostAbout(r1, 'тема «reviews @ brand three»'), 'отрицательная проба');
  check('T: …и несходимость', 1, problemsAbout(r1, 'запросов без места'), 'падение прогона');
  const deadPair = base();
  page(deadPair, '/')['темы'].push('history');
  check('T: мёртвая пара — несходимость', 1, problemsAbout(tree(deadPair), 'тема «history»'), 'мёртвое объявление молчать не должно');
  const claimedTheme = base();
  page(claimedTheme, '/one/')['слияния'].push('brand review');
  page(claimedTheme, '/three/')['темы'] = page(claimedTheme, '/three/')['темы'].filter((t) => t !== 'reviews');
  const r2 = tree(claimedTheme);
  check('T: кластер темы в «слияния» сильнее темы', true, kw(r2, '/one/').includes('brand review'), 'reviews → хаб /one/ явным слиянием');
  check('T: …пара «reviews» не нужна', 0, r2.problems.length + r2.lost.length, 'учёт сходится без объявления пары');
  check('T: пара из одного кластера-якоря жива', true, ok.themesByPage.get('/cheats/').includes('cheats') && problemsAbout(ok, 'тема «cheats»') === 0, 'единственный кластер пары «cheats» — якорь /cheats/');
  const stolenPair = base();
  page(stolenPair, '/three/')['слияния'] = ['brand games in order'];
  check('T: пара, чьи фразы ушли по кластеру, — несходимость', 1, problemsAbout(tree(stolenPair), 'тема «order» (страница /) не дала'), 'мёртвое объявление молчать не должно');
  const twoPages = base();
  page(twoPages, '/')['темы'].push('cheats');
  check('T: пара двум страницам — несходимость', 1, problemsAbout(tree(twoPages), 'тема «cheats» назначен двум'), 'отрицательная проба');
  const noFallback = base();
  page(noFallback, '/three/')['темы'] = ['reviews'];
  const r4 = tree(noFallback);
  check('T: пара с игрой не проваливается в тему серии', { lost: 1, onHub: false }, { lost: lostAbout(r4, 'тема «reviews @ brand three»'), onHub: kw(r4, '/three/').includes('brand three review') }, 'рецензия 2026-09-18: мутация с откатом к теме серии');
  const viaKey = base();
  page(viaKey, '/')['ключи'] = ['brand games in order'];
  check('T: пара жива через ключ', 0, problemsAbout(tree(viaKey), 'тема «order»'), 'единственная фраза пары ушла на ту же страницу ключом');

  // H — псевдо-хаб: «слить_в_хаб» в хаб, которого нет в выгрузке, — только
  // явным «слияния»; настоящий хаб — по цели разведки без объявления.
  check('H: псевдо-хаб через «слияния»', true, kw(ok, '/one/').includes('brand mobile'), 'П65 п. 3 — мобильная версия разделом /one/');
  const noMobile = base();
  page(noMobile, '/one/')['слияния'] = page(noMobile, '/one/')['слияния'].filter((c) => c !== 'brand apk');
  check('H: псевдо-хаб без объявления — потеря', 1, lostAbout(tree(noMobile), 'слияние в «brand mobile»'), 'отрицательная проба');
  check('H: настоящий хаб по цели разведки', true, kw(ok, '/three/').includes('brand three ps3'), '«слить_в_хаб» → «brand three» без строки в объявлении');
  check('H: «слияния» сильнее цели разведки', true, kw(ok, '/one/').includes('brand ps4'), 'brand ps4: разведка — серия, выдача — /one/');

  // K — ключи и судьбы: ключ вынимает фразу из кластера; ключ не из выгрузки
  // и ключ-кластер — несходимость; «к_кластеру» и «главная» — по кластеру
  // страницы; кластер без страницы — потеря; неизвестная судьба — потеря.
  check('K: ключ вынимает фразу из кластера', true, kw(ok, '/remake/').includes('brand 5') && !kw(ok, '/').includes('brand 5'), 'brand 5 → /remake/');
  const badKey = base();
  page(badKey, '/remake/')['ключи'].push('brand 6');
  check('K: ключ не из выгрузки — несходимость', 1, problemsAbout(tree(badKey), 'ключ «brand 6»'), 'сверь знак в знак');
  const clusterKey = base();
  page(clusterKey, '/remake/')['ключи'].push('brand ps4');
  check('K: ключ = имя кластера — несходимость', 1, problemsAbout(tree(clusterKey), 'совпадает с именем кластера'), 'описка: хотели «слияния»');
  check('K: «к_кластеру» → страница кластера', true, kw(ok, '/three/').includes('brand three steam'), 'фраза «Некластеризовано»');
  check('K: «главная» → страница с этим кластером', true, kw(ok, '/').includes('brand'), 'бренд-голова');
  const noWave2 = base();
  page(noWave2, '/three/')['слияния'] = [];
  check('K: кластер «волна_2» без страницы — потеря', 1, lostAbout(tree(noWave2), 'кластер «brand three brazil» (волна_2)'), 'отрицательная проба');
  const noRow = { ...base(), typeBlocks, data: { phrases: [...data.phrases, { phrase: 'brand zzz', cluster: 'brand zzz', google: 5 }, { phrase: 'brand yyy', cluster: 'Некластеризовано', google: 5 }], meta: { phrases: data.meta.phrases + 2 } } };
  const r5 = buildTree(noRow);
  check('K: фраза без строки разведки — потеря', 2, lostAbout(r5, 'без строки в разведке') + lostAbout(r5, 'нет строки в разведке'), 'кластерная и «Некластеризовано»');
  const noRemake = base();
  noRemake.decl['страницы'] = noRemake.decl['страницы'].filter((p) => p.url !== '/remake/');
  page(noRemake, '/')['ключи'] = [];
  check('K: кластер «страница» без страницы — потеря', 1, lostAbout(tree(noRemake), 'кластер «brand remake» (страница)'), 'отрицательная проба');
  const unknownFate = base();
  unknownFate.recon['кластеры'].find((c) => c['кластер'] === 'brand three ps3')['судьба'] = 'карта_мест';
  check('K: неизвестная судьба — потеря', 1, lostAbout(tree(unknownFate), 'судьба «карта_мест»'), 'судьбы первого сайта здесь не живут');
  const unknownCluster = base();
  page(unknownCluster, '/one/')['слияния'].push('brand psp');
  check('K: кластер не из разведки — несходимость', 1, problemsAbout(tree(unknownCluster), 'кластера «brand psp»'), 'сверь знак в знак');

  // N — `no_page`-ключи: фраза уходит в no_page с причиной и адресом; учёт
  // сходится; ключ не из выгрузки, без причины, дважды, или он же ключ
  // страницы — несходимость; чужой адрес — несходимость.
  const np = ok.noPage.find((r) => r.query === 'brand apk download');
  check('N: no_page-ключ — строка с причиной и адресом', { reason: 'пиратство', mentioned_on: '/one/' }, np && { reason: np.reason, mentioned_on: np.mentioned_on }, 'S0 §4.4 — apk download');
  check('N: …и не на странице', false, kw(ok, '/one/').includes('brand apk download'), 'кластер «brand apk» остаётся на /one/ без этой фразы');
  check('N: печать вырезанных', ['brand apk download'], ok.carved.map((c) => c.query), 'строка прогона');
  const badNp = base();
  badNp.decl['no_page_ключи'].push({ ключ: 'brand nonexistent', причина: 'x' });
  check('N: ключ не из выгрузки — несходимость', 1, problemsAbout(tree(badNp), 'no_page_ключ «brand nonexistent»'), 'сверь знак в знак');
  const noReason = base();
  noReason.decl['no_page_ключи'].push({ ключ: 'brand ps4' });
  check('N: без причины — несходимость', 1, problemsAbout(tree(noReason), 'без «ключ» или «причина»'), 'контракт no_page_item');
  const twiceNp = base();
  twiceNp.decl['no_page_ключи'].push({ ключ: 'brand apk download', причина: 'ещё раз' });
  check('N: no_page-ключ дважды — несходимость', 1, problemsAbout(tree(twiceNp), 'объявлен дважды'), 'второй дубль не перезапишет причину молча');
  const bothKeys = base();
  page(bothKeys, '/one/')['ключи'] = ['brand apk download'];
  const r9 = tree(bothKeys);
  check('N: и ключ, и no_page-ключ — несходимость', { problem: 1, inNoPage: true, onPage: false }, { problem: problemsAbout(r9, 'одно из двух'), inNoPage: r9.noPage.some((x) => x.query === 'brand apk download'), onPage: kw(r9, '/one/').includes('brand apk download') }, 'отрицательная проба; порядок no_page-ключ → ключ закреплён по месту фразы');
  const badUrl = base();
  badUrl.decl['no_page_ключи'][0]['упомянуто_на'] = '/nowhere/';
  check('N: чужой адрес — несходимость', 1, problemsAbout(tree(badUrl), 'такой страницы нет'), 'mentioned_on — только существующей');

  // R — возврат из no_page: только кластеру с судьбой no_page.
  const wrongReturn = base();
  page(wrongReturn, '/one/')['возвращено_из_no_page'] = ['brand ps4'];
  page(wrongReturn, '/one/')['слияния'] = page(wrongReturn, '/one/')['слияния'].filter((c) => c !== 'brand ps4');
  check('R: возврат не из no_page — несходимость', 1, problemsAbout(tree(wrongReturn), 'а не «no_page»'), 'отрицательная проба');
  const npMerge = base();
  page(npMerge, '/one/')['слияния'].push('brand shirt');
  check('R: no_page-кластер в «слияния» — несходимость', 1, problemsAbout(tree(npMerge), 'возврат объявляется полем'), 'рецензия 2026-09-18, находка 1');
  const exMerge = base();
  page(exMerge, '/one/')['слияния'].push('brand xxx');
  check('R: exclusions-кластер в «слияния» — несходимость', 1, problemsAbout(tree(exMerge), 'не по теме; страница его не перекрывает'), 'находка 2');
  const npAnchor = base();
  page(npAnchor, '/movie/').cluster = 'brand shirt';
  page(npAnchor, '/movie/')['слияния'] = ['brand film'];
  check('R: no_page-кластер якорем — несходимость', 1, problemsAbout(tree(npAnchor), 'якорем такой кластер не стоит'), 'раунд 2: сторож и на якорь');
  const exAnchor = base();
  page(exAnchor, '/movie/').cluster = 'brand xxx';
  page(exAnchor, '/movie/')['слияния'] = ['brand film'];
  check('R: exclusions-кластер якорем — несходимость', 1, problemsAbout(tree(exAnchor), 'якорь «brand xxx»'), 'раунд 2');
  const npKey = base();
  page(npKey, '/one/')['ключи'] = ['brand crack', 'brand xxx'];
  const r6 = tree(npKey);
  check('R: ключ на фразу no_page/exclusions — несходимость', { np: 1, ex: 1 }, { np: problemsAbout(r6, 'возврат ключом не объявляется'), ex: problemsAbout(r6, 'ключом на страницу не берётся') }, 'находка 3: «Некластеризовано» no_page и кластерная exclusions');
  const keyOnReturned = base();
  page(keyOnReturned, '/one/')['возвращено_из_no_page'] = ['brand shirt'];
  page(keyOnReturned, '/three/')['ключи'] = ['brand shirt'];
  check('R: ключ на фразу возвращённого кластера — не дробится', 1, problemsAbout(tree(keyOnReturned), 'возвращён из no_page целиком на /one/; ключом не дробится'), 'раунд 2: возврат — на кластер, не на фразу');
  const npKeyEx = base();
  npKeyEx.decl['no_page_ключи'].push({ ключ: 'brand strain', причина: 'x' }, { ключ: 'brand crack', причина: 'y' });
  const r7 = tree(npKeyEx);
  check('N: no_page-ключ на exclusions и на no_page — несходимость', { ex: 1, np: 1 }, { ex: problemsAbout(r7, 'в no_page не переводится'), np: problemsAbout(r7, 'ключ лишний') }, 'раунд 2: пачки не перекрываются и отсюда');
  const noUrl = base();
  noUrl.decl['страницы'].push(
    { type: 'topic', cluster: 'brand review', wave: 1, h1: 'x', title: 'y', description: 'z' },
    { url: '', type: 'topic', wave: 1, h1: 'x2', title: 'y2', description: 'z2' },
    { url: 123, type: 'topic', wave: 1, h1: 'x3', title: 'y3', description: 'z3' }
  );
  page(noUrl, '/three/')['темы'] = ['reviews @ brand three'];
  const r8 = tree(noUrl);
  check('W: страница без url — чистый отказ', { problem: 3, lost: 1 }, { problem: problemsAbout(r8, 'страница без url'), lost: lostAbout(r8, 'brand review') }, 'раунд 2–3: нет поля, пустая строка, число — строкой, не TypeError');
  const npKeyReturned = base();
  page(npKeyReturned, '/one/')['возвращено_из_no_page'] = ['brand shirt'];
  npKeyReturned.decl['no_page_ключи'].push({ ключ: 'brand shirt', причина: 'назад' });
  check('N: no_page-ключ на возвращённый кластер — не дробится', 1, problemsAbout(tree(npKeyReturned), 'no_page_ключом не дробится'), 'раунд 3: диагноз называет возврат, не судьбу разведки');
  const nonHead = base();
  page(nonHead, '/one/')['ключи'] = ['brand xxx video'];
  page(nonHead, '/three/')['возвращено_из_no_page'] = ['brand shirt'];
  page(nonHead, '/movie/')['ключи'] = ['brand shirt buy'];
  nonHead.decl['no_page_ключи'].push({ ключ: 'brand shirt buy', причина: 'назад' });
  const r10 = tree(nonHead);
  check('R: сторожа по кластеру фразы, не по имени', { ex: 1, key: 1, np: 1 }, { ex: problemsAbout(r10, 'ключ «brand xxx video» — фраза с судьбой exclusions'), key: problemsAbout(r10, 'ключ «brand shirt buy» — кластер «brand shirt» возвращён из no_page целиком на /three/'), np: problemsAbout(r10, 'no_page_ключ «brand shirt buy»: кластер «brand shirt» возвращён') }, 'раунд 4: фразы не совпадают с именем кластера');
  const ownKey = base();
  page(ownKey, '/one/')['возвращено_из_no_page'] = ['brand shirt'];
  page(ownKey, '/one/')['ключи'] = ['brand shirt'];
  check('R: ключ на свой же возвращённый кластер — лишний', 1, problemsAbout(tree(ownKey), 'ключ «brand shirt» лишний'), 'раунд 3');
  const typo = base();
  page(typo, '/one/')['ключ'] = ['brand one'];
  typo.decl['no_page_ключ'] = [];
  check('W: неизвестные поля — несходимость', 2, problemsAbout(tree(typo), 'неизвестное поле'), 'описка в имени поля не молчит');
  const goodReturn = base();
  page(goodReturn, '/one/')['возвращено_из_no_page'] = ['brand shirt'];
  const r3 = tree(goodReturn);
  check('R: возврат из no_page — на страницу и в печать', { onPage: true, printed: ['brand shirt'] }, { onPage: kw(r3, '/one/').includes('brand shirt'), printed: r3.returned.map((x) => x.cluster) }, 'решение владельца видно');
  // Устаревшая строка разведки на кластерную фразу: сторож ключа судит
  // кластером, как раскладка, — ни ложного пропуска no_page-фразы, ни ложного
  // падения на законном ключе (F1, бэклог 54 п. 12; образец — `staleRow`
  // первого сайта).
  const staleRow = base();
  staleRow.recon['некластеризовано'].push({ фраза: 'brand shirt buy', судьба: 'страница', причина: 'строка прежней выгрузки' }, { фраза: 'brand cheat codes', судьба: 'no_page', причина: 'строка прежней выгрузки' });
  page(staleRow, '/movie/')['ключи'] = ['brand shirt buy'];
  page(staleRow, '/one/')['ключи'] = ['brand cheat codes'];
  const r11 = tree(staleRow);
  check('R: судьбу кластерной фразы судит кластер, не устаревшая строка', { stale: 1, legit: 0, total: 1 }, { stale: problemsAbout(r11, '/movie/: ключ «brand shirt buy» — фраза с судьбой no_page; возврат ключом не объявляется (пачка П65)'), legit: problemsAbout(r11, 'brand cheat codes'), total: r11.problems.length }, 'F1: сторож ключа читает разведку тем же порядком, что раскладка');

  // S — анатомия S3: блоки с именем из `имена_блоков` получают `source: anatomy`,
  // `confidence` по вердикту и `evidence` «документов/из»; безымянный элемент,
  // «не норма» и «не считается» блоками не становятся; порядок — по правилам,
  // имя вне списка — в конец; коридор — из анатомии, при расхождении с
  // контрактом — из контракта и названо строкой.
  const withS3 = { ...base(), rulesS3: structuredClone(fx['проба_S3'].rulesS3), anatomy: structuredClone(fx['проба_S3'].anatomy) };
  const rS3 = tree(withS3);
  const blockOf = (r, url, name) => r.built.find((p) => p.url === url)?.blocks.find((b) => b.block === name);
  check('S: фикстура с анатомией сходится', 0, rS3.problems.length + rS3.lost.length, rS3.problems.join(' | ') || 'учёт прежний');
  check('S: game — умолчания + анатомия + рука в порядке правил', ['hero-key-art(t)', 'story-row(t)', 'story-row(m)#mobile', 'gallery(a)', 'verdict-box(a)', 'link-list(t)', 'cta-band(t)'], blocksOf(rS3, '/one/'), 'порядок_на_странице.список; безымянный wideo, «не норма» autor-data, «не считается» spis-tresci — не блоки');
  check('S: доказательство и уверенность', { verdict: { confidence: 'high', evidence: '6/7' }, gallery: { confidence: 'medium', evidence: '3/7' } }, { verdict: { confidence: blockOf(rS3, '/one/', 'verdict-box')?.confidence, evidence: blockOf(rS3, '/one/', 'verdict-box')?.evidence }, gallery: { confidence: blockOf(rS3, '/one/', 'gallery')?.confidence, evidence: blockOf(rS3, '/one/', 'gallery')?.evidence } }, 'обязателен → high, на решение → medium; evidence «документов/из»');
  check('S: источник анатомии отличим', 'anatomy', blockOf(rS3, '/one/', 'verdict-box')?.source, 'три источника не смешиваются');
  check('S: home — свой порядок, имя вне списка — в конец', ['hero-key-art(t)', 'byline(a)', 'story-row(t)', 'band-quote(t)', 'card-rail(t)', 'link-list(m)#games-in-order', 'link-columns(t)', 'cta-band(t)', 'data-table(a)'], blocksOf(rS3, '/'), 'по_типу.home: byline(a) вторым; data-table нет в списке — в конец');
  check('S: коридор из анатомии — страница без строки в структуре', [300, 400], rS3.built.find((p) => p.url === '/movie/').corridor, 'план.коридор S3');
  check('S: коридор из контракта при расхождении с анатомией', { corridor: [100, 250], named: [{ url: '/one/', corridor: [100, 250], anatomy: [100, 200] }] }, { corridor: rS3.built.find((p) => p.url === '/one/').corridor, named: rS3.corridorsFromContract.filter((c) => c.url === '/one/') }, 'П43 п. 2 — предохранитель переживает анатомию и назван строкой');
  check('S: null контракта против числа анатомии — null', { corridor: null, named: 1 }, { corridor: rS3.built.find((p) => p.url === '/').corridor, named: rS3.corridorsFromContract.filter((c) => c.url === '/').length }, 'именованный null главной — решение, не пропуск');
  const noDocS3 = { ...withS3, doc: { site: withS3.doc.site, pages: [] } };
  check('S: без строк структуры — коридор анатомии у всех', [[500, 600], [100, 200], [300, 400]], ['/', '/one/', '/movie/'].map((u) => tree(noDocS3).built.find((p) => p.url === u).corridor), 'переход S2 → S3: строки-заглушки сняты, числа — из анатомии');
  const noRulesS3 = { ...withS3, rulesS3: null };
  check('S: анатомия без правил — блоков анатомии нет', 0, tree(noRulesS3).built.reduce((s, p) => s + p.blocks.filter((b) => b.source === 'anatomy').length, 0), 'имя даёт словарь правил, не измерение');
  check('S: коридор-ориентир назван', [{ url: '/cheats/', corridor: [900, 1000] }], rS3.orienteers, 'медиана ниши идёт в контракт тем же числом — печатается отдельно');

  // Фикстура судит те же уверенность и порядок, что живые правила, а имена —
  // четыре имени П28: правка живых правил не проходит мимо проб молча.
  const live = readJson(join(root, 'structure/rules-s3.json'));
  const bare = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k.startsWith('почему') ? undefined : v)));
  check('S: уверенность и порядок фикстуры — как у живых правил', { уверенность: bare(live['уверенность']), порядок: bare(live['порядок_на_странице']) }, { уверенность: bare(fx['проба_S3'].rulesS3['уверенность']), порядок: bare(fx['проба_S3'].rulesS3['порядок_на_странице']) }, 'живой rules-s3.json');
  check('S: имена блоков живых правил — четыре имени П28', { ocena: 'verdict-box', galeria: 'gallery', 'autor-data': 'byline', 'spis-tresci': 'toc' }, Object.fromEntries(Object.entries(bare(live['имена_блоков'])).filter(([, v]) => v !== null)), 'остальные — null до слова владельца (П70 п. 1е)');

  // Анатомия, отставшая от дерева, — несходимость, а не тихий null и пропавшие блоки.
  const noAnatomyRow = { ...withS3, anatomy: { страницы: withS3.anatomy.страницы.filter((p) => p.url !== '/remake/') } };
  check('S: страница спроса без строки анатомии — несходимость', 1, problemsAbout(tree(noAnatomyRow), '/remake/: страница спроса без строки в s3-anatomy.json'), 'правка объявления без нового измерения');
  const staleCount = structuredClone(withS3);
  staleCount.anatomy.страницы.find((p) => p.url === '/one/')['фраз'] = 2;
  check('S: число фраз анатомии ≠ раскладке — несходимость', 1, problemsAbout(tree(staleCount), '/one/: в s3-anatomy.json фраз 2, на странице 3'), 'корпус страницы собран из других фраз');
  const orphan = structuredClone(withS3);
  orphan.anatomy.страницы.push({ url: '/gone/', фраз: 1, план: { коридор: [1, 2] }, элементы: {} });
  check('S: строка анатомии без страницы — несходимость', 1, problemsAbout(tree(orphan), 's3-anatomy.json: страница /gone/'), 'страницу сняли из объявления, измерение осталось');
  const twice = structuredClone(withS3);
  page(twice, '/')['блоки'] = [{ block: 'byline' }];
  check('S: один блок из двух источников — несходимость', 1, problemsAbout(tree(twice), '/: блок byline дважды — anatomy и manual'), 'рука и анатомия не складываются');
  const badEvidence = structuredClone(withS3);
  badEvidence.anatomy.страницы.find((p) => p.url === '/one/')['элементы'].ocena['документов'] = '6';
  badEvidence.anatomy.страницы.find((p) => p.url === '/one/')['элементы'].galeria['документов'] = 9;
  const rBad = tree(badEvidence);
  check('S: доказательство не число или больше «из» — несходимость, блок не переносится', { problems: 2, verdict: undefined, gallery: undefined }, { problems: problemsAbout(rBad, 'доказательство анатомии не число'), verdict: blockOf(rBad, '/one/', 'verdict-box'), gallery: blockOf(rBad, '/one/', 'gallery') }, '«6» строкой; 9 из 7');
  const badCorridor = structuredClone(withS3);
  badCorridor.anatomy.страницы.find((p) => p.url === '/movie/')['план']['коридор'] = [400, 300];
  check('S: коридор анатомии не пара min ≤ max — несходимость', 1, problemsAbout(tree(badCorridor), '/movie/: коридор анатомии не пара'), '[400, 300]');

  let failed = 0;
  for (const c of cases) {
    const hit = c.ждём === c.факт;
    if (!hit) failed += 1;
    console.log(`${hit ? 'ok  ' : 'ŹLE '} ${c.имя.padEnd(44)} ждём ${c.ждём} факт ${c.факт}  — ${c.откуда}`);
  }
  console.log(`\n${cases.length - failed}/${cases.length} проб build-tree сходятся`);
  return failed === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const ok = process.argv.includes('--selftest') ? selftest(root) : run(root, { dryRun: process.argv.includes('--dry-run') });
  if (!ok) process.exit(1);
}
