#!/usr/bin/env node
/**
 * Анатомия корпуса — стадия S3 (`docs/05_STRUCTURE_TASK.md`), второй сайт.
 *
 *   node tools/anatomy-s3.mjs            — считает и пишет structure/s3-anatomy.json
 *   node tools/anatomy-s3.mjs --dry-run  — только печатает сводку
 *   node tools/anatomy-s3.mjs --selftest — пробы на фикстуре structure/fixtures/anatomy-s3.json
 *
 * Копия `sites/ac4bf-thewatch.com/tools/anatomy-s3.mjs` (S3 первого сайта,
 * `c4848ad`; документ — `docs/09_S3_ANATOMIA.md`). Два прохода по одному
 * корпусу, как велит бэклог. **Проход 1 — план содержания:** медиана объёма
 * и коридор ±15 %, число заголовков, дерево тем. **Проход 2 — анатомия:** из
 * чего страница сделана — крошки, оглавление, FAQ, блок похожего, таблицы,
 * галерея, видео, разметка. Решает не глаз, а документная частота: элемент
 * у 7 документов из 10 — норма жанра. Линейка объёма — та же, что у гейта
 * коридора `core/gates/corridor.mjs`: тело статьи, теги сняты, сущности
 * раскрыты, пробелы сжаты и убраны (`readDoc` первого сайта — не трогать).
 *
 * Что здесь иначе, чем у первого сайта (П70, `structure/rules-s3.json`):
 *
 *   1. **Корпус страницы — по фразам, не по кластерам** (бэклог 54 п. 3).
 *      Первый сайт брал документы кластеров страницы (якорь, слияния,
 *      судьбы); здесь страница забирает фразы ещё и парами «тема @ игра»
 *      и ключами, а якорь четырёх тематических страниц — кластер корзины
 *      low с 1–3 документами при живом корпусе тем. Корпус страницы —
 *      объединение адресов выдачи всех её фраз: раскладка `build-tree`
 *      (`buildTree` без анатомии — не файл `structure.json`, чтобы измерение
 *      не зависело от того, прогонялось ли дерево) → `keywords` →
 *      `input/corpus/queries.json` → манифест, последняя запись по адресу.
 *   2. **Корзина страницы — по числу живых документов её корпуса** тем же
 *      правилом, что корзина кластера в `run.json` (high ≥ 7, mid 4–6,
 *      low ≤ 3); корзина якоря печатается рядом для сверки с S2.
 *   3. **Оболочки** (бэклог 53 п. 4): документ, у которого в теле статьи
 *      меньше порога знаков, — JS-оболочка (YouTube, TikTok, витрина
 *      rockstargames.com), в корпус страницы не идёт, считается отдельно
 *      вместе с хостами.
 *   4. **Маркетплейсы — по суффиксу хоста**, как `recon-s0` (`amazon.com`
 *      в списке, `www.amazon.com` в манифесте).
 *   5. **Сторож чужого текста:** каждая строка выхода сверяется с закрытым
 *      множеством наших строк (адреса, хосты, имена кластеров, тем, элементов,
 *      вердикты, константы); чужая строка — отказ, файл не пишется.
 *   6. **Сверка слов — по границам слова** (`wordHit`): класс `octocat`
 *      (GitHub — пять документов этого корпуса) и `stock` не считаются
 *      оглавлением `toc`, заголовок «history» не ложится в `plot` через
 *      «story»; разметка schema.org узнаётся только строкой в кавычках или
 *      после слэша, а не голым словом «Review» в меню. У первого сайта обе
 *      сверки шли подстрокой.
 *   7. **`--selftest`** гоняет тот же код на фикстуре сайта: корпус страницы,
 *      манифест, оболочки, маркетплейсы, линейка объёма, элементы, темы,
 *      пороги, корзина, медианы, сторож чужого текста.
 *
 * **Извлекается структура, не текст.** Ни одной формулировки конкурента
 * в выходе нет и быть не должно (`docs/BACKLOG.md`, «Что извлекается и что
 * не извлекается никогда»). Заголовки узнаются словарём и записываются нашим
 * именем темы; заголовок, которого словарь не узнал, идёт числом и адресами —
 * **примером служит документ, а не фраза.**
 *
 * Корпус — только чтение: файлы открываются, ничего не пишется рядом.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { readClustering } from '@factory/core/structure/clustering.mjs';
import { buildTree } from './build-tree.mjs';

const corePath = (rel) => fileURLToPath(import.meta.resolve(`@factory/core/${rel}`));
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

/* ---------------------------------------------------------------- *
 * Разбор документа: только структура и мера. Линейка — байт в байт
 * та же, что у первого сайта и у гейта коридора.
 * ---------------------------------------------------------------- */

const strip = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ');

const unesc = (s) =>
  s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));

const norm = (s) => unesc(s).replace(/\s+/g, ' ').trim().toLowerCase();

/** Заголовки h1–h3: нужен только текст для узнавания темы, наружу он не идёт. */
function headings(html) {
  const out = [];
  for (const m of html.matchAll(/<h([1-3])\b[^>]*>([\s\S]{0,400}?)<\/h\1>/gi)) {
    const text = norm(strip(m[2]));
    if (text) out.push({ level: Number(m[1]), text });
  }
  return out;
}

const has = (html, needles) => needles.some((n) => html.includes(n));

/**
 * Слово по границам: `story` не узнаёт `history`, `toc` — `octocat` и `stock`,
 * `cast` — `podcast`. Граница — всё, что не латинская буква и не цифра
 * (пробел, дефис, подчёркивание, скобка, начало и конец строки). Отклонение
 * от первого сайта, где сверка шла подстрокой (`rules-s3.json`, `почему_так`).
 */
const wordRe = new Map();
const wordHit = (text, w) => {
  const key = w.toLowerCase();
  if (!wordRe.has(key)) wordRe.set(key, new RegExp(`(?:^|[^a-z0-9])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`));
  return wordRe.get(key).test(text);
};
const hasClassWord = (attr, words) => words.some((w) => wordHit(attr, w));

/**
 * Разметка — только строкой в кавычках или после слэша: `"@type":"Review"`,
 * `"ratingValue":`, `itemprop="datePublished"`, `schema.org/Review"`. Голое
 * слово «Review» в меню сайта разметкой не является.
 */
const hasMarkup = (html, names) => names.some((n) => html.includes(`"${n}"`) || html.includes(`/${n}"`));

/** Элементы страницы по словарю признаков `rules-s3.json`. */
function elements(html, rules) {
  const found = {};
  const lower = html.toLowerCase();
  for (const [name, spec] of Object.entries(rules['элементы'])) {
    if (name === 'почему_так') continue;
    let hit = false;
    if (spec['разметка'] && hasMarkup(html, spec['разметка'])) hit = true;
    if (!hit && spec['признаки'] && has(lower, spec['признаки'].map((s) => s.toLowerCase()))) hit = true;
    if (!hit && spec['свойства'] && has(lower, spec['свойства'].map((s) => s.toLowerCase()))) hit = true;
    if (!hit && spec['классы']) {
      // Имя класса ищем внутри атрибутов class/id, а не по всему документу:
      // слово «related» в тексте статьи элементом не является.
      for (const m of lower.matchAll(/\s(?:class|id)="([^"]{0,300})"/g)) {
        if (hasClassWord(m[1], spec['классы'])) {
          hit = true;
          break;
        }
      }
    }
    if (!hit && spec['тег']) {
      const n = (lower.match(new RegExp(`<${spec['тег']}\\b`, 'g')) ?? []).length;
      if (n >= (spec['минимум'] ?? 1)) hit = true;
    }
    if (!hit && spec['тег_details_от']) {
      const n = (lower.match(/<details\b/g) ?? []).length;
      if (n >= spec['тег_details_от']) hit = true;
    }
    found[name] = hit;
  }
  return found;
}

/**
 * Тема заголовка по словарю; null — словарь не узнал. Пояснения в словаре —
 * строки, темы — списки; порядок тем в файле — порядок проверки. Слова —
 * по границам (`wordHit`), формы множественного числа стоят в списках явно.
 */
function themeOf(text, rules) {
  if (rules['служебные_заголовки']['слова'].some((w) => wordHit(text, w))) return '__служебный__';
  for (const [theme, words] of Object.entries(rules['темы_заголовков'])) {
    if (Array.isArray(words) && words.some((w) => wordHit(text, w))) return theme;
  }
  return null;
}

/**
 * Тело статьи. Заголовки и объём считаются здесь, а не по всему документу:
 * на портале h2 меню и боковых лент больше, чем h2 самой статьи, и без этого
 * реза дерево тем показывает навигацию сайта, а не жанр страницы.
 * Элементы (крошки, разметка, комментарии) ищутся по всему документу —
 * они по природе живут вне тела статьи.
 */
function contentRoot(html) {
  const largest = (tag) => {
    let best = null;
    for (const m of html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi'))) {
      if (!best || m[1].length > best.length) best = m[1];
    }
    return best;
  };
  const found = largest('article') ?? largest('main');
  if (found && found.length > 400) return found;
  return html
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ');
}

/** Мера одного документа по его HTML: объём, заголовки, темы, элементы. */
export function measureDoc(html, rules) {
  const body = contentRoot(html);
  const text = norm(strip(body));
  const hs = headings(body);
  return {
    znaki: text.replace(/ /g, '').length,
    h2: hs.filter((h) => h.level === 2).length,
    h3: hs.filter((h) => h.level === 3).length,
    темы: hs.filter((h) => h.level >= 2).map((h) => themeOf(h.text, rules)),
    элементы: elements(html, rules),
  };
}

const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

const corridorOf = (med, tol) => (med ? [Math.round(med * (1 - tol)), Math.round(med * (1 + tol))] : [0, 0]);

/** Маркетплейс — по суффиксу хоста, как `recon-s0.mjs` (isMarketplace). */
export const hostIn = (host, list) => list.has(host) || [...list].some((m) => host.endsWith('.' + m));

/**
 * Измерение — от входов к выходу. Ничего не читает с диска и не печатает:
 * что печатать и падать ли, решает вызывающий по `problems`.
 *
 * @param {object} in_
 * @param {{url: string, type: string, cluster: string|null, keywords: string[]}[]} in_.pages — раскладка дерева
 * @param {Record<string, {group: string, urls: string[]}>} in_.queries — `queries.json`, поле `phrases`
 * @param {object[]} in_.manifest — строки `manifest.jsonl`; считается последняя запись по адресу
 * @param {object} in_.rules — `rules-s3.json`
 * @param {Set<string>} in_.shops — маркетплейсы из `rules-s0.json`
 * @param {Map<string, string>} in_.anchorBasket — корзина кластера по разведке (печать рядом)
 * @param {(rec: object) => string|null} in_.htmlOf — HTML документа по записи манифеста; null — файла нет
 */
export function anatomy({ pages, queries, manifest, rules, shops, anchorBasket, htmlOf }) {
  const problems = [];
  const last = new Map();
  for (const r of manifest) last.set(r.url, r);

  const minShell = rules['оболочки']['минимум_знаков'];
  const bucketOf = (n) => (n >= rules['корзины']['high_от'] ? 'high' : n >= rules['корзины']['mid_от'] ? 'mid' : 'low');
  const elementNames = Object.keys(rules['элементы']).filter((k) => k !== 'почему_так');

  // Кэш документов по адресу: один адрес — одна мера, сколько бы страниц его ни делили.
  const cache = new Map();
  const shellHosts = new Map();
  const readDoc = (rec) => {
    if (cache.has(rec.url)) return cache.get(rec.url);
    const html = htmlOf(rec);
    let doc = null;
    if (html !== null && html !== undefined) {
      const m = measureDoc(html, rules);
      doc = { url: rec.url, host: rec.host, shell: m.znaki < minShell, ...m };
    }
    cache.set(rec.url, doc);
    return doc;
  };

  const out = [];
  for (const p of pages) {
    // Страница без фраз (служебная, вне выгрузки) корпуса не имеет — её здесь нет:
    // коридор ей не считается, `null` в структуре остаётся именованным решением.
    if (!p.keywords.length) continue;

    const urls = new Set();
    const missing = [];
    for (const k of p.keywords) {
      const q = queries[k];
      if (!q) {
        missing.push(k);
        continue;
      }
      for (const u of q.urls) urls.add(u);
    }
    if (missing.length) problems.push(`${p.url}: фраз без строки в queries.json — ${missing.length} («${missing[0]}»); корпус собран не с этой выгрузки`);

    const skipped = { не_в_манифесте: 0, не_скачано: 0, маркетплейсов: 0, нет_файла: 0, оболочек: 0 };
    const shellsHere = new Map();
    const docs = [];
    for (const u of [...urls].sort()) {
      const rec = last.get(u);
      if (!rec) {
        skipped.не_в_манифесте += 1;
        continue;
      }
      if (rec.outcome !== 'ok') {
        skipped.не_скачано += 1;
        continue;
      }
      if (hostIn(rec.host, shops)) {
        skipped.маркетплейсов += 1;
        continue;
      }
      const d = readDoc(rec);
      if (!d) {
        skipped.нет_файла += 1;
        continue;
      }
      if (d.shell) {
        skipped.оболочек += 1;
        shellsHere.set(d.host, (shellsHere.get(d.host) ?? 0) + 1);
        shellHosts.set(d.host, (shellHosts.get(d.host) ?? 0) + 1);
        continue;
      }
      docs.push(d);
    }
    if (skipped.не_в_манифесте) problems.push(`${p.url}: адресов выдачи нет в манифесте — ${skipped.не_в_манифесте}; корпус собран не с этой выгрузки`);
    if (skipped.нет_файла) problems.push(`${p.url}: документов без файла в raw/ — ${skipped.нет_файла}; корпус пересобирается npm run corpus`);

    const korzyna = bucketOf(docs.length);
    const enough = docs.length >= rules['анатомия']['минимум_документов'];
    const anatomyAllowed = enough && !(rules['корзины']['low_только_план'] && korzyna === 'low');

    const el = {};
    for (const name of elementNames) {
      const n = docs.filter((d) => d.элементы[name]).length;
      const share = docs.length ? n / docs.length : 0;
      el[name] = {
        документов: n,
        из: docs.length,
        доля: Number(share.toFixed(2)),
        вердикт: !anatomyAllowed
          ? 'не считается'
          : share >= rules['анатомия']['обязателен_от']
            ? 'обязателен'
            : share >= rules['анатомия']['решение_от']
              ? 'на решение'
              : 'не норма',
      };
    }

    const themes = {};
    let unknown = 0;
    const unknownUrls = new Set();
    for (const d of docs) {
      const own = new Set();
      for (const t of d.темы) {
        if (t === '__служебный__') continue;
        if (t === null) {
          unknown += 1;
          unknownUrls.add(d.url);
          continue;
        }
        own.add(t);
      }
      for (const t of own) themes[t] = (themes[t] ?? 0) + 1;
    }
    const themeRows = Object.entries(themes)
      .map(([tema, n]) => ({
        тема: tema,
        документов: n,
        из: docs.length,
        доля: Number((n / (docs.length || 1)).toFixed(2)),
        вердикт: docs.length < rules['анатомия']['минимум_документов']
          ? 'не считается'
          : n / docs.length >= rules['анатомия']['обязателен_от']
            ? 'обязательна'
            : n / docs.length >= rules['анатомия']['решение_от']
              ? 'на решение'
              : n === 1
                ? 'гэп'
                : 'редкая',
      }))
      .sort((a, b) => b.документов - a.документов || a.тема.localeCompare(b.тема));

    const lengths = docs.map((d) => d.znaki).filter((x) => x > 0);
    const med = median(lengths);
    const tol = rules['план_содержания']['коридор'];
    const scarce = docs.length < rules['план_содержания']['минимум_документов'];

    out.push({
      url: p.url,
      cluster: p.cluster ?? null,
      корзина: korzyna,
      корзина_якоря: p.cluster ? (anchorBasket.get(p.cluster) ?? '—') : '—',
      фраз: p.keywords.length,
      адресов: urls.size,
      пропущено: skipped,
      оболочки_по_хостам: Object.fromEntries([...shellsHere.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
      документов: docs.length,
      хостов: new Set(docs.map((d) => d.host)).size,
      план: {
        медиана_знаков: med,
        коридор: corridorOf(med, tol),
        ориентир: scarce,
        h2_медиана: median(docs.map((d) => d.h2)),
        h3_медиана: median(docs.map((d) => d.h3)),
      },
      темы: themeRows,
      элементы: el,
      неопознанных_заголовков: unknown,
      неопознанное_у: [...unknownUrls].slice(0, 6),
    });
  }

  /* -------------------------------------------------------------- *
   * Ниша целиком — она же запасная медиана для страниц с малым корпусом.
   * -------------------------------------------------------------- */

  const allDocs = [...cache.values()].filter((d) => d && !d.shell);
  const shells = [...cache.values()].filter((d) => d && d.shell).length;
  const nicheMedian = median(allDocs.map((d) => d.znaki).filter((x) => x > 0));
  const tol = rules['план_содержания']['коридор'];
  const nicheElements = {};
  for (const name of elementNames) {
    const n = allDocs.filter((d) => d.элементы[name]).length;
    nicheElements[name] = { документов: n, из: allDocs.length, доля: Number((n / (allDocs.length || 1)).toFixed(2)) };
  }
  for (const p of out) {
    if (p.план.ориентир) {
      p.план.медиана_знаков = nicheMedian;
      p.план.коридор = corridorOf(nicheMedian, tol);
    }
  }

  return {
    страницы: out,
    ниша: {
      медиана_знаков: nicheMedian,
      коридор: corridorOf(nicheMedian, tol),
      элементы: nicheElements,
    },
    корпус: {
      разобрано: allDocs.length,
      оболочек: shells,
      оболочки_по_хостам: Object.fromEntries([...shellHosts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
    },
    problems,
  };
}

/**
 * Сторож чужого текста: каждая строка выхода обязана быть из закрытого
 * множества наших строк. Возвращает пути к чужим строкам — не сами строки,
 * чтобы и в консоль чужая формулировка не попала.
 */
export function foreignStrings(value, allowed, path = '$') {
  if (typeof value === 'string') return allowed.has(value) ? [] : [path];
  if (Array.isArray(value)) return value.flatMap((v, i) => foreignStrings(v, allowed, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => [
      ...(allowed.has(k) ? [] : [`${path}.${k}`]),
      ...foreignStrings(v, allowed, `${path}.${k}`),
    ]);
  }
  return [];
}

/** Множество наших строк: ключи выхода, вердикты, имена из правил, адреса и хосты корпуса. */
export function allowedStrings({ rules, pages, manifest, extra = [] }) {
  const allowed = new Set([
    'url', 'cluster', 'корзина', 'корзина_якоря', 'фраз', 'адресов', 'пропущено', 'оболочки_по_хостам', 'документов', 'хостов', 'план', 'темы', 'элементы',
    'неопознанных_заголовков', 'неопознанное_у', 'медиана_знаков', 'коридор', 'ориентир', 'h2_медиана', 'h3_медиана', 'тема', 'из', 'доля', 'вердикт',
    'не_в_манифесте', 'не_скачано', 'маркетплейсов', 'нет_файла', 'оболочек', 'страницы', 'ниша', 'корпус', 'разобрано',
    'high', 'mid', 'low', '—', 'не считается', 'обязателен', 'на решение', 'не норма', 'обязательна', 'гэп', 'редкая',
    ...Object.keys(rules['элементы']),
    ...Object.keys(rules['темы_заголовков']),
    ...pages.map((p) => p.url),
    ...pages.map((p) => p.cluster).filter(Boolean),
    ...manifest.map((r) => r.url),
    ...manifest.map((r) => r.host),
    ...extra,
  ]);
  return allowed;
}

/* ---------------------------------------------------------------- *
 * Прогон на сайте: чтение входов, печать, запись.
 * ---------------------------------------------------------------- */

function run(root, { dryRun }) {
  const rules = readJson(join(root, 'structure/rules-s3.json'));
  const rules0 = readJson(join(root, 'structure/rules-s0.json'));
  const recon = readJson(join(root, 'structure/s0-recon.json'));
  const decl = readJson(join(root, 'structure/pages-s2.json'));
  const doc = readJson(join(root, 'structure/structure.json'));
  const manifest = readFileSync(join(root, 'input/corpus/manifest.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const queriesFile = readJson(join(root, 'input/corpus/queries.json'));
  const runPath = join(root, 'input/corpus/run.json');
  const corpusRun = existsSync(runPath) ? readJson(runPath) : null;
  const typeBlocks = readJson(corePath('structure/type-blocks.json'));
  const data = readClustering(join(root, doc.site.semantics));

  // Корпус и разведка обязаны быть с одной выгрузки: иначе адреса выдачи
  // и фразы раскладки не сойдутся, и корпус страницы будет собран с чужого снимка.
  const problems = [];
  if (corpusRun && recon['выгрузка']?.sha256 && corpusRun.source_sha256 !== recon['выгрузка'].sha256) {
    problems.push(`корпус собран с выгрузки ${corpusRun.source_sha256.slice(0, 12)}…, разведка — с ${recon['выгрузка'].sha256.slice(0, 12)}…; пересобери одно из двух`);
  }
  if (corpusRun && basename(corpusRun.source) !== basename(doc.site.semantics)) {
    problems.push(`корпус собран с ${corpusRun.source}, структура называет ${doc.site.semantics}`);
  }

  // Раскладка — тем же кодом, что пишет дерево, без анатомии: фразы
  // страниц не зависят от неё, а несходимость объявления — стоп и здесь.
  const tree = buildTree({ decl, recon, doc, rulesS3: null, anatomy: null, typeBlocks, data });
  if (tree.problems.length || tree.lost.length) {
    console.error(`дерево не сходится (${tree.problems.length} несходимостей, ${tree.lost.length} без места) — сперва npm run tree:check`);
    for (const p of tree.problems.slice(0, 10)) console.error(`  ${p}`);
    return false;
  }
  const pages = tree.built.map((p) => ({ url: p.url, type: p.type, cluster: p.cluster, keywords: p.keywords }));

  const shops = new Set(rules0['магазинный_интент']['маркетплейсы']);
  const anchorBasket = new Map(recon['кластеры'].map((c) => [c['кластер'], c['корзина']]));
  const htmlOf = (rec) => {
    const path = join(root, 'input/corpus', rec.file);
    return existsSync(path) ? gunzipSync(readFileSync(path)).toString('utf8') : null;
  };

  const r = anatomy({ pages, queries: queriesFile.phrases, manifest, rules, shops, anchorBasket, htmlOf });
  problems.push(...r.problems);

  const last = new Map();
  for (const rec of manifest) last.set(rec.url, rec);
  const out = {
    инструмент: 'tools/anatomy-s3.mjs',
    правила: 'structure/rules-s3.json',
    статус: 'измерение S3 — пороги применены; имена блоков — по словарю имена_блоков правил, видео без имени до слова владельца',
    корпус: {
      манифест: 'input/corpus/manifest.jsonl',
      запросы: 'input/corpus/queries.json',
      // Корпус без даты и запроса — не данные, а мнение (`docs/BACKLOG.md`,
      // «Воспроизводимость»). Дата снимка выдачи и дата забора берутся
      // из `run.json` и переносятся сюда, чтобы измерение было привязано ко дню.
      снимок_выдачи: corpusRun?.serp_snapshot_date ?? null,
      забор: corpusRun ? [corpusRun.first_fetch_at, corpusRun.last_fetch_at] : null,
      выгрузка: corpusRun?.source ?? null,
      выгрузка_sha256: corpusRun?.source_sha256 ?? null,
      адресов_в_манифесте: last.size,
      скачано_ok: [...last.values()].filter((x) => x.outcome === 'ok').length,
      разобрано: r.корпус.разобрано,
      оболочек: r.корпус.оболочек,
      оболочки_по_хостам: r.корпус.оболочки_по_хостам,
      пропущено_маркетплейсов: r.страницы.reduce((s, p) => s + p.пропущено.маркетплейсов, 0),
    },
    ниша: r.ниша,
    страницы: r.страницы,
  };

  // Сторож чужого текста — по всему выходу, включая шапку.
  const allowed = allowedStrings({
    rules,
    pages,
    manifest,
    extra: [
      'инструмент', 'правила', 'статус', 'манифест', 'запросы', 'снимок_выдачи', 'забор', 'выгрузка', 'выгрузка_sha256', 'адресов_в_манифесте', 'скачано_ok', 'пропущено_маркетплейсов',
      out.инструмент, out.правила, out.статус, out.корпус.манифест, out.корпус.запросы,
      out.корпус.снимок_выдачи, ...(out.корпус.забор ?? []), out.корпус.выгрузка, out.корпус.выгрузка_sha256,
    ].filter((x) => typeof x === 'string'),
  });
  const foreign = foreignStrings(out, allowed);
  if (foreign.length) problems.push(`чужих строк в выходе: ${foreign.length} — ${foreign.slice(0, 5).join(', ')}; файл не записан`);

  /* -------------------------------------------------------------- *
   * Сводка в консоль.
   * -------------------------------------------------------------- */

  console.log(`корпус: ${out.корпус.скачано_ok} скачано, ${out.корпус.разобрано} разобрано в корпусах страниц, ${out.корпус.оболочек} оболочек, ${out.корпус.пропущено_маркетплейсов} пропусков маркетплейсов`);
  const shellTop = Object.entries(out.корпус.оболочки_по_хостам).slice(0, 5).map(([h, n]) => `${h} ${n}`).join(', ');
  if (shellTop) console.log(`оболочки по хостам: ${shellTop}`);
  console.log(`медиана ниши: ${out.ниша.медиана_знаков} знаков без пробелов, коридор ${out.ниша.коридор[0]}–${out.ниша.коридор[1]}`);
  console.log('');
  console.log('элементы по всей нише (документная частота):');
  for (const [name, v] of Object.entries(out.ниша.элементы).sort((a, b) => b[1].доля - a[1].доля)) {
    console.log(`  ${name.padEnd(14)} ${String(Math.round(v.доля * 100)).padStart(3)} %  (${v.документов} из ${v.из})`);
  }
  console.log('');
  console.log('страницы (док. — живых документов корпуса страницы; корзина страницы / корзина якоря):');
  for (const p of out.страницы) {
    const must = Object.entries(p.элементы).filter(([, v]) => v.вердикт === 'обязателен').map(([k]) => k);
    const ask = Object.entries(p.элементы).filter(([, v]) => v.вердикт === 'на решение').map(([k]) => k);
    console.log(
      `  ${String(p.документов).padStart(3)} док.  ${String(p.план.медиана_знаков).padStart(6)} зн.${p.план.ориентир ? '*' : ' '}  ` +
        `${p.корзина.padEnd(4)}/${p.корзина_якоря.padEnd(4)} ${p.url}  (фраз ${p.фраз}, адресов ${p.адресов}, оболочек ${p.пропущено.оболочек}, не скачано ${p.пропущено.не_скачано})`
    );
    if (must.length) console.log(`        обязателен: ${must.join(', ')}`);
    if (ask.length) console.log(`        на решение: ${ask.join(', ')}`);
  }
  console.log('');
  console.log('* — своих документов меньше четырёх, медиана взята по всей нише и является ориентиром, а не нормой страницы');
  const unknownTotal = out.страницы.reduce((s, p) => s + p.неопознанных_заголовков, 0);
  console.log(`неопознанных заголовков: ${unknownTotal} — в выходе только счёт и адреса документов, ни одной чужой формулировки`);

  if (problems.length) {
    console.error('');
    console.error(`несходимости (${problems.length}):`);
    for (const p of problems) console.error(`  ${p}`);
    console.error('');
    console.error('измерение не записано.');
    return false;
  }
  if (!dryRun) {
    writeFileSync(join(root, 'structure/s3-anatomy.json'), JSON.stringify(out, null, 1) + '\n');
    console.log('записано: structure/s3-anatomy.json');
  }
  return true;
}

/* ---------------------------------------------------------------- *
 * Пробы: фикстура сайта — синтетические документы, по пробе на каждое
 * правило измерения. Правила берутся живые (`structure/rules-s3.json`):
 * пробы судят те словари и пороги, с которыми идёт сайт.
 * ---------------------------------------------------------------- */

function selftest(root) {
  const fx = readJson(join(root, 'structure/fixtures/anatomy-s3.json'));
  const rules = readJson(join(root, 'structure/rules-s3.json'));
  const shops = new Set(fx['маркетплейсы']);
  const anchorBasket = new Map(Object.entries(fx['корзина_якоря']));
  const base = () => ({
    pages: structuredClone(fx['страницы']),
    queries: structuredClone(fx['queries']),
    manifest: structuredClone(fx['манифест']),
    rules: structuredClone(rules),
    shops,
    anchorBasket,
    htmlOf: (rec) => fx['документы'][rec.file] ?? null,
  });
  const measure = (input) => anatomy(input);

  const cases = [];
  const check = (имя, ждём, факт, откуда) =>
    cases.push({ имя, ждём: JSON.stringify(ждём), факт: JSON.stringify(факт), откуда });
  const page = (r, url) => r.страницы.find((p) => p.url === url);
  const problemsAbout = (r, text) => r.problems.filter((p) => p.includes(text)).length;
  const doc = (file) => measureDoc(fx['документы'][file], rules);
  const allElements = Object.keys(rules['элементы']).filter((k) => k !== 'почему_так');

  // Ноль: фикстура сама сходится.
  const ok = measure(base());
  check('фикстура: несходимостей', 0, ok.problems.length, ok.problems.join(' | ') || 'корпус собран');
  check('фикстура: страниц в выходе', ['/', '/one/', '/theme/', '/thin/', '/mid/'], ok.страницы.map((p) => p.url), 'служебная /privacy/ без фраз — не в выходе');

  // P — корпус страницы: объединение адресов всех фраз, адрес считается один раз.
  const theme = page(ok, '/theme/');
  const one = page(ok, '/one/');
  check('P: корпус страницы — по всем фразам, не по якорю', { адресов: 8, документов: 7, корзина: 'high', якорь: 'low' }, { адресов: theme.адресов, документов: theme.документов, корзина: theme.корзина, якорь: theme.корзина_якоря }, 'бэклог 54 п. 3: якорь low с одним документом, темы дают семь');
  check('P: общий адрес двух фраз — один адрес', 6, one.адресов, 'семь строк выдачи трёх фраз, shared у двух');
  check('P: страница без фраз — корпуса нет', undefined, page(ok, '/privacy/'), 'вне выгрузки — коридор null остаётся именованным');
  const stale = base();
  stale.pages.find((p) => p.url === '/thin/').keywords.push('brand missing');
  check('P: фраза без строки в queries.json — несходимость', 1, problemsAbout(measure(stale), 'фраз без строки в queries.json'), 'корпус не с этой выгрузки');
  const noRec = base();
  noRec.queries['brand thin'].urls.push('https://nowhere.example/x');
  check('P: адрес выдачи не в манифесте — несходимость', 1, problemsAbout(measure(noRec), 'нет в манифесте'), 'корпус не с этой выгрузки');
  const noFile = base();
  noFile.manifest.find((r) => r.url === 'https://thin.example/a').file = 'raw/missing.html.gz';
  check('P: документ без файла — несходимость', 1, problemsAbout(measure(noFile), 'без файла в raw/'), 'корпус пересобирается');

  // M — манифест: последняя запись по адресу побеждает; не «ok» не считается;
  // маркетплейс — по суффиксу хоста.
  check('M: последняя запись по адресу побеждает', { документов: 4, не_скачано: 1, маркетплейсов: 1 }, { документов: one.документов, не_скачано: one.пропущено.не_скачано, маркетплейсов: one.пропущено.маркетплейсов }, 'late: http-error → ok считается; dead: ok → http-error нет; www.shop.example при «shop.example»');
  const exactShop = base();
  exactShop.shops = new Set(['www.shop.example']);
  check('M: маркетплейс и точным хостом', 1, page(measure(exactShop), '/one/').пропущено.маркетплейсов, 'оба вида записи в списке');
  const noShop = base();
  noShop.shops = new Set(['other.example']);
  check('M: чужой суффикс — не маркетплейс', { маркетплейсов: 0, документов: 5 }, { маркетплейсов: page(measure(noShop), '/one/').пропущено.маркетплейсов, документов: page(measure(noShop), '/one/').документов }, 'отрицательная проба');

  // S — оболочки: короче порога — не в корпусе, посчитаны с хостом; ровно порог — живой.
  const thin = page(ok, '/thin/');
  check('S: оболочка короче порога — пропущена с хостом', { оболочек: 1, hosts: { 'video.example': 1 } }, { оболочек: thin.пропущено.оболочек, hosts: thin.оболочки_по_хостам }, `минимум_знаков ${rules['оболочки']['минимум_знаков']}`);
  check('S: ровно порог — живой документ', { znaki: rules['оболочки']['минимум_знаков'], документов: 3 }, { znaki: doc('raw/thin-edge.html').znaki, документов: thin.документов }, 'граница включительно');
  check('S: оболочки ниши — по хостам', { 'video.example': 1 }, ok.корпус.оболочки_по_хостам, 'счёт по уникальным адресам');
  const noShell = base();
  noShell.rules['оболочки']['минимум_знаков'] = 0;
  check('S: порог 0 — оболочек нет', { оболочек: 0, документов: 4 }, { оболочек: page(measure(noShell), '/thin/').пропущено.оболочек, документов: page(measure(noShell), '/thin/').документов }, 'порог живёт в правилах');

  // L — линейка объёма: тело статьи, теги, скрипты, комментарии, сущности.
  check('L: знаки без пробелов по телу <article>', 1000, doc('raw/one-anchor.html').znaki, '490 + 490 + три заголовка в article, 500 в nav снаружи');
  check('L: без <article>/<main> — минус header/footer/nav/aside', 2007, doc('raw/one-long.html').znaki, 'текст шапки, меню, aside и подвала не считается; <title> из <head> (7 знаков) считается — линейка первого сайта');
  check('L: короткий <article> (< 400 байт HTML) — весь документ без обвязки', 359, doc('raw/thin-short-article.html').znaki, 'порог 400 байт разметки, как у первого сайта; 100 + 250 + <title> 9');
  check('L: script, style, комментарий — не текст; сущности — раскрыты', 6, doc('raw/entities.html').znaki, '«a&nbsp;b&amp;c» → ab&c, «&#x41;&#66;» → ab');
  check('L: заголовки считаются по телу: h2 из nav не в счёте', { h2: 2, h3: 1 }, { h2: doc('raw/one-anchor.html').h2, h3: doc('raw/one-anchor.html').h3 }, 'два h2 и один h3 в article, ещё h2 в nav');
  check('L: без тела — заголовки обвязки не считаются', { h2: 0, h3: 0 }, { h2: doc('raw/one-long.html').h2, h3: doc('raw/one-long.html').h3 }, 'h2 в nav срезан');

  // E — элементы: каждый признак; класс — в атрибуте по границам слова; разметка — в кавычках.
  check('E: все одиннадцать элементов узнаны', Object.fromEntries(allElements.map((k) => [k, true])), doc('raw/one-anchor.html').элементы, 'документ со всеми признаками');
  check('E: документ без признаков — ни одного', 0, Object.values(doc('raw/one-long.html').элементы).filter(Boolean).length, 'слово «related» в тексте — не элемент');
  check('E: класс в атрибуте, details×3 — FAQ, id — тоже атрибут', Object.fromEntries(allElements.map((k) => [k, ['breadcrumbs', 'spis-tresci', 'faq', 'podobne', 'galeria', 'komentarze'].includes(k)])), doc('raw/theme-classes.html').элементы, 'breadcrumbs, article-toc, related-posts, gallery, id=comments; остальные пять — нет');
  check('E: figure×3 — не галерея; octocat, stock — не toc', { galeria: false, 'spis-tresci': false }, { galeria: doc('raw/theme-three-figures.html').элементы.galeria, 'spis-tresci': doc('raw/theme-three-figures.html').элементы['spis-tresci'] }, 'минимум 4; сверка класса по границам слова');
  check('E: разметка — не голое слово в меню', false, doc('raw/markup-bare.html').элементы.ocena, '«Review» и «Reviews» текстом ссылок');
  check('E: разметка — «@type»:«Review» и itemtype=…/Review', { quoted: true, itemtype: true }, { quoted: doc('raw/markup-quoted.html').элементы.ocena, itemtype: doc('raw/markup-itemtype.html').элементы.ocena }, 'JSON-строка и адрес типа');

  // T — темы заголовков: словарь → наше имя, служебные — мимо, неопознанное — счёт и адрес.
  check('T: темы узнаны нашими именами', ['plot', 'gameplay', 'gameplay'], doc('raw/one-anchor.html').темы, 'h2 Plot, h2 Gameplay, h3 Controls');
  check('T: служебный заголовок — мимо, неопознанный — null', ['plot', '__служебный__', null], doc('raw/theme-unknown.html').темы, 'h2 Plot, h2 Menu, h2 «zzqx wvut»');
  check('T: слово по границам — history не plot, games in order — series', ['series', 'series'], [...doc('raw/home-a.html').темы, ...doc('raw/home-b.html').темы], '«story» внутри «history» не считается');
  check('T: неопознанное — счёт и адрес, без текста', { n: 1, urls: ['https://theme.example/unknown'] }, { n: theme.неопознанных_заголовков, urls: theme.неопознанное_у }, 'примером служит документ');
  check('T: тема считается по документам, не по вхождениям', { plot: 7, lore: 1 }, Object.fromEntries(theme.темы.map((t) => [t.тема, t.документов])), 'h2 plot у семи документов, trivia у одного');
  check('T: 7 из 7 — обязательна, 1 из 7 — гэп', { plot: 'обязательна', lore: 'гэп' }, Object.fromEntries(theme.темы.map((t) => [t.тема, t.вердикт])), 'пороги 0.7 и n = 1');
  check('T: меньше четырёх документов — темы не считаются', ['не считается'], [...new Set(thin.темы.map((t) => t.вердикт))], '/thin/ — три документа');

  // V — вердикты элементов по порогам и корзине.
  check('V: 6/7 — обязателен, 3/7 — на решение, 1/7 — не норма', { tabela: 'обязателен', wideo: 'на решение', faq: 'не норма' }, { tabela: theme.элементы.tabela.вердикт, wideo: theme.элементы.wideo.вердикт, faq: theme.элементы.faq.вердикт }, 'пороги 0.7 / 0.4');
  check('V: evidence — документов/из', { документов: 3, из: 7, доля: 0.43 }, { документов: theme.элементы.wideo.документов, из: theme.элементы.wideo.из, доля: theme.элементы.wideo.доля }, 'то, что build-tree печатает «3/7»');
  check('V: корзина low — не считается', ['не считается'], [...new Set(Object.values(thin.элементы).map((e) => e.вердикт))], 'D.3: три документа — только план');
  const mid = page(ok, '/mid/');
  check('V: корзина mid — считается', { корзина: 'mid', документов: 4, вердикт: 'обязателен' }, { корзина: mid.корзина, документов: mid.документов, вердикт: mid.элементы.tabela.вердикт }, 'четыре документа с таблицей');
  const lowAllowed = base();
  lowAllowed.rules['корзины']['low_только_план'] = false;
  lowAllowed.rules['анатомия']['минимум_документов'] = 3;
  check('V: без правила low и с минимумом 3 — считается', 'обязателен', page(measure(lowAllowed), '/thin/').элементы.tabela.вердикт, 'оба порога живут в правилах');
  const lowOnly = base();
  lowOnly.rules['анатомия']['минимум_документов'] = 3;
  check('V: минимум 3, но корзина low — не считается', 'не считается', page(measure(lowOnly), '/thin/').элементы.tabela.вердикт, 'правило корзины само по себе');
  const bucketMoved = base();
  bucketMoved.rules['корзины']['high_от'] = 8;
  check('V: порог корзины — из правил', 'mid', page(measure(bucketMoved), '/theme/').корзина, 'high_от 8 при семи документах');
  const strict = base();
  strict.rules['анатомия']['обязателен_от'] = 0.9;
  strict.rules['анатомия']['решение_от'] = 0.5;
  check('V: пороги вердикта — из правил', { tabela: 'на решение', wideo: 'не норма' }, { tabela: page(measure(strict), '/theme/').элементы.tabela.вердикт, wideo: page(measure(strict), '/theme/').элементы.wideo.вердикт }, '0.86 < 0.9; 0.43 < 0.5');

  // N — медианы, коридор, ориентир, ниша.
  check('N: медиана чётного ряда — среднее двух средних, коридор ±15 %', { медиана: 2500, коридор: [2125, 2875] }, { медиана: mid.план.медиана_знаков, коридор: mid.план.коридор }, '1000, 2000, 3000, 4000');
  check('N: h2/h3 медианы', { h2: 1, h3: 1 }, { h2: one.план.h2_медиана, h3: one.план.h3_медиана }, 'h2 2/1/1/0, h3 1/1/1/0 по документам /one/');
  check('N: меньше четырёх документов — ориентир по нише', { ориентир: true, медиана: ok.ниша.медиана_знаков, коридор: ok.ниша.коридор }, { ориентир: thin.план.ориентир, медиана: thin.план.медиана_знаков, коридор: thin.план.коридор }, 'три документа /thin/');
  check('N: четыре документа — своя медиана', false, mid.план.ориентир, 'минимум_документов 4');
  check('N: ниша — уникальные живые документы всех страниц', 20, ok.корпус.разобрано, 'общие адреса не удваиваются, оболочки и отказы не в счёте');
  check('N: ниша — доля элемента по всем документам', { документов: 15, из: 20 }, { документов: ok.ниша.элементы.tabela.документов, из: ok.ниша.элементы.tabela.из }, 'таблица у anchor, shared, theme×6, thin×3, mid×4');
  const tol = base();
  tol.rules['план_содержания']['коридор'] = 0.1;
  check('N: коридор — из правил', [2250, 2750], page(measure(tol), '/mid/').план.коридор, '±10 %');

  // G — сторож чужого текста.
  const allowed = allowedStrings({ rules, pages: fx['страницы'], manifest: fx['манифест'] });
  check('G: выход фикстуры — чужих строк нет', [], foreignStrings({ страницы: ok.страницы, ниша: ok.ниша, корпус: ok.корпус }, allowed), 'все строки — наши');
  const leaked = structuredClone(ok.страницы);
  leaked[0].темы.push({ тема: 'zzqx wvut', документов: 1, из: 1, доля: 1, вердикт: 'гэп' });
  check('G: чужая строка — путь без текста', ['$[0].темы[1].тема'], foreignStrings(leaked, allowed), 'сторож называет место, не формулировку');
  check('G: чужой ключ — тоже', ['$.zzqx'], foreignStrings({ zzqx: 1 }, allowed), 'ключи проверяются наравне со значениями');
  check('G: чужая строка в массиве', ['$.неопознанное_у[0]'], foreignStrings({ неопознанное_у: ['https://elsewhere.example/'] }, allowed), 'адрес не из манифеста — чужой');

  let failed = 0;
  for (const c of cases) {
    const hit = c.ждём === c.факт;
    if (!hit) failed += 1;
    console.log(`${hit ? 'ok  ' : 'ŹLE '} ${c.имя.padEnd(64)} ждём ${c.ждём} факт ${c.факт}  — ${c.откуда}`);
  }
  console.log(`\n${cases.length - failed}/${cases.length} проб anatomy-s3 сходятся`);
  return failed === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const ok = process.argv.includes('--selftest') ? selftest(root) : run(root, { dryRun: process.argv.includes('--dry-run') });
  if (!ok) process.exit(1);
}
