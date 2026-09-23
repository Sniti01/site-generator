#!/usr/bin/env node
/**
 * Анатомия корпуса — стадия S3 (`docs/05_STRUCTURE_TASK.md`), второй сайт.
 *
 *   node tools/anatomy-s3.mjs            — считает и пишет structure/s3-anatomy.json
 *   node tools/anatomy-s3.mjs --dry-run  — печатает сводку и сверяет её с записанным файлом
 *   node tools/anatomy-s3.mjs --selftest — пробы на фикстуре structure/fixtures/anatomy-s3.json
 *
 * Копия `sites/ac4bf-thewatch.com/tools/anatomy-s3.mjs` (S3 первого сайта,
 * `c4848ad`; документ — `docs/09_S3_ANATOMIA.md`). Два прохода по одному
 * корпусу, как велит бэклог. **Проход 1 — план содержания:** медиана объёма
 * и коридор ±15 %, число заголовков, дерево тем. **Проход 2 — анатомия:** из
 * чего страница сделана — крошки, оглавление, FAQ, блок похожего, таблицы,
 * галерея, видео, разметка. Решает не глаз, а документная частота: элемент
 * у 7 документов из 10 — норма жанра.
 *
 * **Линейка объёма** (тело статьи, теги сняты, сущности раскрыты, пробелы
 * сжаты и убраны) — байт в байт та же, что у первого сайта. С гейтом коридора
 * `core/gates/corridor.mjs` она НЕ тождественна: гейт снимает теги с учётом
 * кавычек, раскрывает `&amp;` последним и меряет только единственный `<main>`
 * нашей страницы, а здесь у конкурента берётся наибольший `<article>`, иначе
 * `<main>`, иначе документ без обвязки (вместе с `<title>`). Одна линейка
 * на ядро — бэклог 55; здесь линейка не менялась.
 *
 * Что здесь иначе, чем у первого сайта (П70, `structure/rules-s3.json`):
 *
 *   1. **Корпус страницы — по фразам, не по кластерам** (бэклог 54 п. 3).
 *      Страница забирает фразы ещё и парами «тема @ игра» и ключами, а якорь
 *      четырёх тематических страниц — кластер корзины low с 1–3 документами
 *      при живом корпусе тем. Корпус страницы — объединение адресов выдачи
 *      всех её фраз: раскладка `build-tree` (`buildTree` без анатомии — не
 *      файл `structure.json`) → `keywords` → `input/corpus/queries.json` →
 *      манифест, последняя запись по адресу. Адреса у кластерной фразы — выдача
 *      её кластера (колонка «URLs группы» выгрузки): ключ из чужого кластера
 *      приносит всю выдачу того кластера, веса по спросу нет.
 *   2. **Корзина страницы — по числу живых документов её корпуса** тем же
 *      правилом, что корзина кластера в `run.json` (high ≥ 7, mid 4–6,
 *      low ≤ 3); `корзины.по_корпусу_страницы: false` возвращает корзину
 *      кластера-якоря, как у первого сайта; корзина якоря печатается рядом.
 *   3. **Оболочки** (бэклог 53 п. 4): документ, у которого в теле статьи
 *      меньше порога знаков, — JS-оболочка (YouTube, TikTok, витрина
 *      rockstargames.com), в корпус страницы не идёт, считается отдельно
 *      вместе с хостами — по уникальным документам.
 *   4. **Маркетплейсы — по суффиксу хоста**, как `recon-s0` (`amazon.com`
 *      в списке, `www.amazon.com` в манифесте); список и площадки платформ
 *      берутся из `rules-s0.json` по пути, названному в правилах.
 *   5. **Переходы и дубли:** адрес, чей переход увёл на стенку (проверка
 *      возраста, согласие, вызов) или на корень раздела, — не документ
 *      выдачи; два адреса одного документа (общий канонический адрес или
 *      адрес перехода без языковых и меточных параметров) считаются один раз.
 *   6. **Сторож чужого текста:** каждая строка выхода сверяется с закрытым
 *      множеством наших строк (адреса, хосты, имена кластеров, тем, элементов,
 *      вердикты, константы); значения шапки из `run.json` — по форме; чужая
 *      строка — отказ, файл не пишется, текст чужого ключа не печатается.
 *   7. **Элементы узнаются по видимым узлам разметки** (`элементы.узлы`):
 *      классы и id ищутся у узлов тела после выреза кода, стилей, шаблонов,
 *      векторных иконок и головы документа, не у иконок, полей формы
 *      и скрытых узлов; слово класса — по границам слова, camelCase
 *      разбирается; разметка schema.org — разобранный JSON-LD и микроданные,
 *      а не строка в кавычках где угодно. У первого сайта обе сверки шли
 *      подстрокой по всему документу.
 *   8. **Темы заголовков — по самому длинному совпавшему слову,** не по
 *      первой теме файла; `^` в начале слова — «только в начале заголовка».
 *   9. **`--dry-run` сверяет** посчитанное с записанным `s3-anatomy.json`:
 *      устаревший файл, из которого `build-tree` берёт блоки и коридоры, —
 *      отказ, а не молчание.
 *  10. **`--selftest`** гоняет тот же код на фикстуре сайта.
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

/** Порядок строк — по кодам символов, не по локали машины: выход один на любой машине. */
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/* ---------------------------------------------------------------- *
 * Разбор документа: только структура и мера. Линейка — байт в байт
 * та же, что у первого сайта (с гейтом коридора не тождественна —
 * см. шапку).
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

/**
 * Слово по границам: `story` не узнаёт `history`, `toc` — `octocat` и `stock`,
 * `cast` — `podcast`. Граница — всё, что не латинская буква и не цифра
 * (пробел, дефис, подчёркивание, скобка, начало и конец строки). `^` в начале
 * слова словаря — только в начале строки. Отклонение от первого сайта, где
 * сверка шла подстрокой (`rules-s3.json`, `почему_так`).
 */
const wordRe = new Map();
const wordHit = (text, w) => {
  const key = w.toLowerCase();
  if (!wordRe.has(key)) {
    const anchored = key.startsWith('^');
    const body = (anchored ? key.slice(1) : key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    wordRe.set(key, new RegExp(`${anchored ? '^' : '(?:^|[^a-z0-9])'}${body}(?![a-z0-9])`));
  }
  return wordRe.get(key).test(text);
};
const wordLength = (w) => (w.startsWith('^') ? w.length - 1 : w.length);

/* ---------------------------------------------------------------- *
 * Узлы разметки: начальные теги с атрибутами. Кавычки в атрибутах
 * учитываются (`title="a>b"` — один тег), значения — в двойных,
 * одинарных кавычках или без них.
 * ---------------------------------------------------------------- */

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const ATTR_RE = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function attrsOf(s) {
  const a = {};
  for (const m of s.matchAll(ATTR_RE)) {
    const k = m[1].toLowerCase();
    if (!(k in a)) a[k] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return a;
}

function nodesOf(html) {
  const out = [];
  for (const m of html.matchAll(TAG_RE)) {
    out.push({ tag: m[1].toLowerCase(), a: attrsOf(m[2]), end: m.index + m[0].length, selfClosing: m[2].trimEnd().endsWith('/') });
  }
  return out;
}

/** Код, стили, шаблоны, векторные иконки и голова документа — не разметка страницы. */
function cutCode(html, tags) {
  let s = html.replace(/<!--[\s\S]*?-->/g, ' ');
  for (const t of tags) s = s.replace(new RegExp(`<${t}\\b[\\s\\S]*?<\\/${t}\\s*>`, 'gi'), ' ');
  return s;
}

const countTag = (html, tag) => (html.match(new RegExp(`<${tag}(?=[\\s>/])`, 'gi')) ?? []).length;

/** Внутренность узла до его закрывающего тега (вложенность того же тега учтена). */
function innerOf(html, node, limit = 200000) {
  if (node.selfClosing) return '';
  const re = new RegExp(`<(/?)${node.tag}(?=[\\s>/])[^>]*>`, 'gi');
  re.lastIndex = node.end;
  let depth = 1;
  for (let m = re.exec(html); m && m.index - node.end < limit; m = re.exec(html)) {
    if (m[1]) {
      depth -= 1;
      if (!depth) return html.slice(node.end, m.index);
    } else if (!m[0].endsWith('/>')) depth += 1;
  }
  return html.slice(node.end, node.end + limit);
}

const hidden = (a) => 'hidden' in a || a['aria-hidden'] === 'true' || /display\s*:\s*none|visibility\s*:\s*hidden/i.test(a.style ?? '');

/**
 * Слова классов и id видимого узла: camelCase разобран (`GuideTableOfContents` →
 * `guide-table-of-contents`), иконки (`fa-comments`, `octicon-…`, `iconochive-…`)
 * отброшены, у узлов без классов по природе (поле формы, картинка, иконка `<i>`)
 * и у скрытых узлов слов нет.
 */
function tokensOf(node, u) {
  if (u['теги_без_классов'].includes(node.tag) || hidden(node.a)) return [];
  const out = [];
  for (const k of ['class', 'id']) {
    const v = node.a[k];
    if (!v || v.length > u['длина_атрибута_до']) continue;
    for (const raw of v.split(/\s+/)) {
      if (!raw) continue;
      const t = raw.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      const segs = t.split(/[-_]+/);
      if (segs.some((s) => s.includes(u['иконки']['подстрока'])) || u['иконки']['префиксы'].includes(segs[0])) continue;
      out.push(t);
    }
  }
  return out;
}

const classHit = (tokens, spec) =>
  tokens.some((t) => spec['классы'].some((w) => wordHit(t, w)) && !(spec['не_в_контексте'] ?? []).some((c) => wordHit(t, c)));

/* ---------------------------------------------------------------- *
 * Разметка schema.org: разобранный JSON-LD и микроданные.
 * ---------------------------------------------------------------- */

const typeName = (t) => t.split(/[/#:]/).pop();

/** Объекты JSON-LD документа: типы, верхний ли уровень (корень или `@graph`), словарь `@id`. */
function ldObjects(html) {
  const objects = [];
  const byId = new Map();
  let broken = 0;
  for (const m of html.matchAll(/<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    const txt = m[1]
      .trim()
      .replace(/^<!--|-->$/g, '')
      .replace(/^\/\/\s*<!\[CDATA\[|\/\/\s*\]\]>$/g, '')
      .trim();
    let data;
    try {
      data = JSON.parse(txt);
    } catch {
      broken += 1;
      continue;
    }
    const walk = (v, top) => {
      if (Array.isArray(v)) {
        for (const x of v) walk(x, top);
        return;
      }
      if (!v || typeof v !== 'object') return;
      const types = [].concat(v['@type'] ?? []).filter((t) => typeof t === 'string').map(typeName);
      objects.push({ types, obj: v, top });
      if (typeof v['@id'] === 'string') byId.set(v['@id'], v);
      for (const [k, x] of Object.entries(v)) walk(x, k === '@graph' && top);
    };
    walk(data, true);
  }
  return { objects, byId, broken };
}

/** Автор — человек: строка с именем или объект `Person` (в том числе по ссылке `@id`). */
function personAuthor(obj, byId) {
  return [].concat(obj.author ?? []).some((a) => {
    if (typeof a === 'string') return a.trim() !== '';
    if (!a || typeof a !== 'object') return false;
    const ref = !a['@type'] && typeof a['@id'] === 'string' ? (byId.get(a['@id']) ?? a) : a;
    return [].concat(ref['@type'] ?? []).some((t) => typeof t === 'string' && typeName(t) === 'Person');
  });
}

/** Микроданные: типы (`itemtype`), типы верхнего уровня (без `itemprop`), свойства. */
function microdata(nodes) {
  const types = new Set();
  const top = new Set();
  const props = new Set();
  for (const n of nodes) {
    if (n.a.itemtype) {
      for (const t of n.a.itemtype.split(/\s+/).filter(Boolean)) {
        types.add(typeName(t));
        if (!('itemprop' in n.a)) top.add(typeName(t));
      }
    }
    if (n.a.itemprop) for (const p of n.a.itemprop.split(/\s+/).filter(Boolean)) props.add(p);
  }
  return { types, top, props };
}

function markupHit(m, ld, md) {
  const hasType = (o, list) => o.types.some((t) => list.includes(t));
  if (m['типы'] && (ld.objects.some((o) => hasType(o, m['типы'])) || m['типы'].some((t) => md.types.has(t)))) return true;
  if (m['верхние_типы'] && (ld.objects.some((o) => o.top && hasType(o, m['верхние_типы'])) || m['верхние_типы'].some((t) => md.top.has(t)))) return true;
  if (m['свойства']) {
    const hit = ld.objects.some(
      (o) =>
        (!m['у_типов'] || hasType(o, m['у_типов'])) &&
        m['свойства'].some((p) => Object.hasOwn(o.obj, p)) &&
        (!m['автор_человек'] || personAuthor(o.obj, ld.byId))
    );
    if (hit) return true;
  }
  // Микроданные — только у документа, где есть тип из `у_типов`: у приложения
  // в магазине тоже бывают `author` и `datePublished`, но это не подпись статьи.
  return Boolean(m['микроданные']?.some((p) => md.props.has(p)) && (!m['у_типов'] || m['у_типов'].some((t) => md.types.has(t))));
}

/** Оглавление без класса: ссылки на якоря этой же страницы в первой трети тела. */
function anchorToc(cut, body, spec) {
  const ids = new Set();
  for (const m of cut.matchAll(/\s(?:id|name)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))/gi)) ids.add(m[1] ?? m[2] ?? m[3]);
  const skip = new Set((spec['якоря_кроме'] ?? []).map((x) => x.toLowerCase()));
  const head = body.slice(0, Math.ceil(body.length / 3));
  const targets = new Set();
  for (const m of head.matchAll(/<a\b(?:[^>"']|"[^"]*"|'[^']*')*?\shref\s*=\s*(?:"#([^"]+)"|'#([^']+)')/gi)) {
    const t = m[1] ?? m[2];
    if (!skip.has(t.toLowerCase()) && ids.has(t)) targets.add(t);
  }
  return targets.size >= spec['якоря_от'];
}

/** Имена элементов правил: всё, что описано объектом, кроме настроек узлов. */
export const elementNamesOf = (rules) =>
  Object.entries(rules['элементы'])
    .filter(([k, v]) => k !== 'узлы' && v && typeof v === 'object' && !Array.isArray(v))
    .map(([k]) => k);

/** Элементы страницы по словарю признаков `rules-s3.json`. */
function elements(html, rules) {
  const u = rules['элементы']['узлы'];
  const cut = cutCode(html, u['вырезать']);
  const lowerCut = cut.toLowerCase();
  const lowerRaw = html.toLowerCase();
  const nodes = nodesOf(cut);
  const body = contentRoot(cut);
  const bodyNodes = nodesOf(body);
  const ld = ldObjects(html);
  const md = microdata(nodes);
  const found = {};
  for (const name of elementNamesOf(rules)) {
    const spec = rules['элементы'][name];
    let hit = false;
    if (spec['разметка']) hit = markupHit(spec['разметка'], ld, md);
    if (!hit && spec['признаки']) hit = spec['признаки'].some((s) => lowerCut.includes(s.toLowerCase()));
    if (!hit && spec['признаки_в_коде']) hit = spec['признаки_в_коде'].some((s) => lowerRaw.includes(s.toLowerCase()));
    if (!hit && spec['ссылки_rel']) {
      hit = nodes.some((n) => n.tag === 'a' && (n.a.rel ?? '').toLowerCase().split(/\s+/).some((r) => spec['ссылки_rel'].includes(r)));
    }
    if (!hit && spec['классы']) {
      const [src, list] = spec['в_теле'] ? [body, bodyNodes] : [cut, nodes];
      for (const n of list) {
        if (!classHit(tokensOf(n, u), spec)) continue;
        if (spec['картинок_внутри_от'] && countTag(innerOf(src, n), 'img') + countTag(innerOf(src, n), 'picture') < spec['картинок_внутри_от']) continue;
        hit = true;
        break;
      }
    }
    if (!hit && spec['тег']) hit = countTag(spec['в_теле'] ? body : cut, spec['тег']) >= (spec['минимум'] ?? 1);
    if (!hit && spec['тег_details_от']) hit = countTag(cut, 'details') >= spec['тег_details_от'];
    if (!hit && spec['якоря_от']) hit = anchorToc(cut, body, spec);
    found[name] = hit;
  }
  return found;
}

/**
 * Тема заголовка по словарю; null — словарь не узнал. Служебный заголовок
 * (слово обвязки или шаблон `{{…}}`) — мимо тем. Среди тем побеждает самое
 * длинное совпавшее слово («console commands» — cheats, а не versions через
 * «console»), при равенстве — тема раньше в файле. Типографский апостроф
 * приравнивается к прямому.
 */
function themeOf(text, rules) {
  const t = text.replace(/[‘’]/g, "'");
  const service = rules['служебные_заголовки'];
  if (service['шаблон'] && new RegExp(service['шаблон']).test(t)) return '__служебный__';
  if (service['слова'].some((w) => wordHit(t, w))) return '__служебный__';
  let best = null;
  let bestLength = 0;
  for (const [theme, words] of Object.entries(rules['темы_заголовков'])) {
    if (!Array.isArray(words)) continue;
    for (const w of words) {
      if (wordLength(w) > bestLength && wordHit(t, w)) {
        best = theme;
        bestLength = wordLength(w);
      }
    }
  }
  return best;
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

/** Маркетплейс и площадка — по суффиксу хоста, как `recon-s0.mjs` (isMarketplace). */
export const hostIn = (host, list) => list.has(host) || [...list].some((m) => host.endsWith('.' + m));

const hostOf = (u) => {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return '';
  }
};

/**
 * Адрес документа без хвостов, которые страницу не меняют: фрагмента,
 * параметров языка и меток (`переходы.параметры_без_смысла`, `utm_*`),
 * конечного слэша. Хост — строчными.
 */
export function docKey(u, dropParams) {
  let x;
  try {
    x = new URL(u);
  } catch {
    return u;
  }
  x.hash = '';
  for (const k of [...x.searchParams.keys()]) {
    if (dropParams.some((p) => (p.endsWith('*') ? k.startsWith(p.slice(0, -1)) : k === p))) x.searchParams.delete(k);
  }
  x.hostname = x.hostname.toLowerCase();
  return x.toString().replace(/\/(?=\?|$)/, '');
}

/**
 * Кто этот документ: канонический адрес того же сайта, если он не корень,
 * иначе адрес перехода, иначе адрес выдачи — без хвостов (`docKey`).
 */
function identityOf(rec, html, dropParams) {
  const bare = (h) => h.replace(/^www\./, '');
  const link = html.match(/<link\b(?=[^>]*\brel\s*=\s*["']?canonical\b)[^>]*\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  if (link) {
    try {
      const c = new URL(link, rec.final_url ?? rec.url);
      if (bare(c.hostname.toLowerCase()) === bare(hostOf(rec.final_url ?? rec.url)) && c.pathname !== '/') return docKey(c.toString(), dropParams);
    } catch {
      /* кривой канонический адрес — как если бы его не было */
    }
  }
  return docKey(rec.final_url ?? rec.url, dropParams);
}

/**
 * Переход, который увёл не туда: на стенку (`переходы.стенки` — сегмент пути
 * адреса перехода) или на корень сайта или раздела (путь без сегментов,
 * кроме языкового, при непустом пути адреса выдачи). Такой документ — не тот,
 * что стоит в выдаче.
 */
export function wallOf(rec, rules) {
  if (!rec.final_url || rec.final_url === rec.url) return null;
  let a;
  let b;
  try {
    a = new URL(rec.url);
    b = new URL(rec.final_url);
  } catch {
    return null;
  }
  const segs = (x) => x.split('/').filter(Boolean);
  if (segs(b.pathname.toLowerCase()).some((s) => rules['переходы']['стенки'].includes(s))) return 'стенка';
  const meaningful = (x) => segs(x).filter((s) => !/^[a-z]{2}(?:-[a-z]{2})?$/i.test(s));
  if (!meaningful(b.pathname).length && meaningful(a.pathname).length) return 'корень';
  return null;
}

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
 * @param {Set<string>} in_.platforms — площадки платформ из `rules-s0.json` (печать доли)
 * @param {Map<string, string>} in_.anchorBasket — корзина кластера по разведке (печать рядом)
 * @param {(rec: object) => string|null} in_.htmlOf — HTML документа по записи манифеста; null — файла нет
 */
export function anatomy({ pages, queries, manifest, rules, shops, platforms = new Set(), anchorBasket, htmlOf }) {
  const problems = [];
  const last = new Map();
  for (const r of manifest) last.set(r.url, r);

  const minShell = rules['оболочки']['минимум_знаков'];
  const bucketOf = (n) => (n >= rules['корзины']['high_от'] ? 'high' : n >= rules['корзины']['mid_от'] ? 'mid' : 'low');
  const elementNames = elementNamesOf(rules);
  const video = new Set(rules['видео_площадки']['хосты']);
  const dropParams = rules['переходы']['параметры_без_смысла'];

  // Кэш документов по адресу: один адрес — одна мера, сколько бы страниц его ни делили.
  const cache = new Map();
  const readDoc = (rec) => {
    if (cache.has(rec.url)) return cache.get(rec.url);
    const html = htmlOf(rec);
    let doc = null;
    if (html !== null && html !== undefined) {
      const m = measureDoc(html, rules);
      doc = { url: rec.url, host: rec.host, key: identityOf(rec, html, dropParams), shell: m.znaki < minShell, ...m };
    }
    cache.set(rec.url, doc);
    return doc;
  };

  const out = [];
  const serpUrls = new Set();
  const videoPhrases = new Set();
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
      if (q.urls.some((u) => hostIn(hostOf(u), video))) videoPhrases.add(k);
    }
    for (const u of urls) serpUrls.add(u);
    if (missing.length) problems.push(`${p.url}: фраз без строки в queries.json — ${missing.length} («${missing[0]}»); корпус собран не с этой выгрузки`);

    const skipped = { не_в_манифесте: 0, не_скачано: 0, маркетплейсов: 0, переходов: 0, нет_файла: 0, дублей: 0, оболочек: 0 };
    const shellsHere = new Map();
    const docs = [];
    const seen = new Set();
    for (const u of [...urls].sort(cmp)) {
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
      if (wallOf(rec, rules)) {
        skipped.переходов += 1;
        continue;
      }
      const d = readDoc(rec);
      if (!d) {
        skipped.нет_файла += 1;
        continue;
      }
      if (seen.has(d.key)) {
        skipped.дублей += 1;
        continue;
      }
      seen.add(d.key);
      if (d.shell) {
        skipped.оболочек += 1;
        shellsHere.set(d.host, (shellsHere.get(d.host) ?? 0) + 1);
        continue;
      }
      docs.push(d);
    }
    if (skipped.не_в_манифесте) problems.push(`${p.url}: адресов выдачи нет в манифесте — ${skipped.не_в_манифесте}; корпус собран не с этой выгрузки`);
    if (skipped.нет_файла) problems.push(`${p.url}: документов без файла в raw/ — ${skipped.нет_файла}; корпус пересобирается npm run corpus`);

    const korzyna = rules['корзины']['по_корпусу_страницы'] === false ? (anchorBasket.get(p.cluster) ?? 'low') : bucketOf(docs.length);
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
      .sort((a, b) => b.документов - a.документов || cmp(a.тема, b.тема));

    const lengths = docs.map((d) => d.znaki).filter((x) => x > 0);
    const med = median(lengths);
    const tol = rules['план_содержания']['коридор'];
    const scarce = docs.length < rules['план_содержания']['минимум_документов'];

    const byHost = new Map();
    for (const d of docs) byHost.set(d.host, (byHost.get(d.host) ?? 0) + 1);
    const top = [...byHost.entries()].sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]))[0];
    const offPlatform = docs.filter((d) => !hostIn(d.host, platforms));

    out.push({
      url: p.url,
      cluster: p.cluster ?? null,
      корзина: korzyna,
      корзина_якоря: p.cluster ? (anchorBasket.get(p.cluster) ?? '—') : '—',
      фраз: p.keywords.length,
      адресов: urls.size,
      пропущено: skipped,
      оболочки_по_хостам: Object.fromEntries([...shellsHere.entries()].sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]))),
      документов: docs.length,
      хостов: byHost.size,
      крупнейший_хост: top ? { хост: top[0], документов: top[1] } : null,
      площадки_платформ: { документов: docs.length - offPlatform.length, медиана_без_них: median(offPlatform.map((d) => d.znaki).filter((x) => x > 0)) },
      видео_в_выдаче: { адресов: [...urls].filter((u) => hostIn(hostOf(u), video)).length, из: urls.size },
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
      неопознанное_документов: unknownUrls.size,
      неопознанное_у: [...unknownUrls].sort(cmp).slice(0, 6),
    });
  }

  /* -------------------------------------------------------------- *
   * Ниша целиком — она же запасная медиана для страниц с малым корпусом.
   * Документ считается один раз, сколько бы адресов и страниц его ни несли.
   * -------------------------------------------------------------- */

  const unique = new Map();
  for (const d of cache.values()) if (d && !unique.has(d.key)) unique.set(d.key, d);
  const allDocs = [...unique.values()].filter((d) => !d.shell);
  const shellDocs = [...unique.values()].filter((d) => d.shell);
  const shellHosts = new Map();
  for (const d of shellDocs) shellHosts.set(d.host, (shellHosts.get(d.host) ?? 0) + 1);
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

  // Короткие документы по сотням знаков (0–99, 100–199, … 500–599) — основание
  // порога оболочки; заголовки тела по трём исходам — по уникальным документам.
  const short = [0, 0, 0, 0, 0, 0];
  for (const d of unique.values()) if (d.znaki < 600) short[Math.floor(d.znaki / 100)] += 1;
  const heads = { узнано: 0, служебных: 0, неопознанных: 0 };
  for (const d of allDocs) {
    for (const t of d.темы) {
      if (t === '__служебный__') heads.служебных += 1;
      else if (t === null) heads.неопознанных += 1;
      else heads.узнано += 1;
    }
  }
  const shopUrls = [...serpUrls].filter((u) => hostIn(hostOf(u), shops));

  return {
    страницы: out,
    ниша: {
      медиана_знаков: nicheMedian,
      коридор: corridorOf(nicheMedian, tol),
      элементы: nicheElements,
    },
    корпус: {
      разобрано: allDocs.length,
      оболочек: shellDocs.length,
      оболочки_по_хостам: Object.fromEntries([...shellHosts.entries()].sort((a, b) => b[1] - a[1] || cmp(a[0], b[0]))),
      короткие_по_сотням: short,
      заголовков: heads,
      выдача: {
        фраз: pages.reduce((s, p) => s + p.keywords.length, 0),
        фраз_с_видео: videoPhrases.size,
        адресов: serpUrls.size,
        видео_адресов: [...serpUrls].filter((u) => hostIn(hostOf(u), video)).length,
        маркетплейсов: shopUrls.length,
        маркетплейсов_скачанных: shopUrls.filter((u) => last.get(u)?.outcome === 'ok').length,
      },
    },
    problems,
  };
}

/**
 * Сторож чужого текста: каждая строка выхода обязана быть из закрытого
 * множества наших строк. Возвращает пути к чужим строкам — не сами строки:
 * у чужого ключа в пути стоит метка с номером, а не его текст, чтобы и
 * в консоль чужая формулировка не попала.
 */
export function foreignStrings(value, allowed, path = '$') {
  if (typeof value === 'string') return allowed.has(value) ? [] : [path];
  if (Array.isArray(value)) return value.flatMap((v, i) => foreignStrings(v, allowed, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v], i) => {
      const own = allowed.has(k);
      const here = own ? `${path}.${k}` : `${path}.{ключ#${i}}`;
      return [...(own ? [] : [here]), ...foreignStrings(v, allowed, here)];
    });
  }
  return [];
}

/** Ключи выхода и константы — одно место для анатомии, шапки и проб. */
const OUTPUT_KEYS = [
  'url', 'cluster', 'корзина', 'корзина_якоря', 'фраз', 'адресов', 'пропущено', 'оболочки_по_хостам', 'документов', 'хостов', 'план', 'темы', 'элементы',
  'крупнейший_хост', 'хост', 'площадки_платформ', 'медиана_без_них', 'видео_в_выдаче',
  'неопознанных_заголовков', 'неопознанное_документов', 'неопознанное_у', 'медиана_знаков', 'коридор', 'ориентир', 'h2_медиана', 'h3_медиана', 'тема', 'из', 'доля', 'вердикт',
  'не_в_манифесте', 'не_скачано', 'маркетплейсов', 'переходов', 'нет_файла', 'дублей', 'оболочек', 'страницы', 'ниша', 'корпус', 'разобрано',
  'короткие_по_сотням', 'заголовков', 'узнано', 'служебных', 'неопознанных', 'выдача', 'фраз_с_видео', 'видео_адресов', 'маркетплейсов_скачанных',
  'high', 'mid', 'low', '—', 'не считается', 'обязателен', 'на решение', 'не норма', 'обязательна', 'гэп', 'редкая',
];

/** Множество наших строк: ключи выхода, вердикты, имена из правил, адреса и хосты корпуса. */
export function allowedStrings({ rules, pages, manifest, extra = [] }) {
  return new Set([
    ...OUTPUT_KEYS,
    ...Object.keys(rules['элементы']),
    ...Object.keys(rules['темы_заголовков']),
    ...pages.map((p) => p.url),
    ...pages.map((p) => p.cluster).filter(Boolean),
    ...manifest.map((r) => r.url),
    ...manifest.map((r) => r.host),
    ...extra,
  ]);
}

/** Константы шапки выхода: пишет инструмент, не корпус. */
const HEADER = {
  инструмент: 'tools/anatomy-s3.mjs',
  правила: 'structure/rules-s3.json',
  статус: 'измерение S3 — пороги применены; имена блоков — по словарю имена_блоков правил, видео без имени до слова владельца',
  манифест: 'input/corpus/manifest.jsonl',
  запросы: 'input/corpus/queries.json',
};
const HEADER_KEYS = ['инструмент', 'правила', 'статус', 'манифест', 'запросы', 'снимок_выдачи', 'забор', 'выгрузка', 'выгрузка_sha256', 'адресов_в_манифесте', 'скачано_ok', 'пропущено_маркетплейсов'];

/**
 * Значения шапки из `run.json` сторож пропускает не потому, что они там стоят,
 * а по форме: дата, два момента ISO, путь выгрузки, названной структурой,
 * sha256. Что не по форме — остаётся чужим, и выход не пишется.
 */
export function headerValues(k, semantics) {
  const ok = [];
  if (typeof k.снимок_выдачи === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k.снимок_выдачи)) ok.push(k.снимок_выдачи);
  for (const t of k.забор ?? []) if (typeof t === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(t)) ok.push(t);
  if (typeof k.выгрузка === 'string' && basename(k.выгрузка) === basename(semantics) && /^[\w./-]+\.xlsx$/.test(k.выгрузка)) ok.push(k.выгрузка);
  if (typeof k.выгрузка_sha256 === 'string' && /^[0-9a-f]{64}$/.test(k.выгрузка_sha256)) ok.push(k.выгрузка_sha256);
  return ok;
}

/** Список из файла правил по пути `ключ.подключ` — источник назван в `rules-s3.json`, а не в коде. */
const listFrom = (root, ref) => ref['ключ'].split('.').reduce((o, k) => o?.[k], readJson(join(root, ref['файл']))) ?? [];

/* ---------------------------------------------------------------- *
 * Прогон на сайте: чтение входов, печать, запись.
 * ---------------------------------------------------------------- */

function run(root, { dryRun }) {
  const rules = readJson(join(root, 'structure/rules-s3.json'));
  const recon = readJson(join(root, 'structure/s0-recon.json'));
  const decl = readJson(join(root, 'structure/pages-s2.json'));
  const doc = readJson(join(root, 'structure/structure.json'));
  const manifest = readFileSync(join(root, 'input/corpus/manifest.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const queriesFile = readJson(join(root, 'input/corpus/queries.json'));
  const runPath = join(root, 'input/corpus/run.json');
  const corpusRun = existsSync(runPath) ? readJson(runPath) : null;
  const typeBlocks = readJson(corePath('structure/type-blocks.json'));
  const data = readClustering(join(root, doc.site.semantics));

  // Корпус, разведка и читаемая выгрузка обязаны быть одним файлом: иначе
  // адреса выдачи и фразы раскладки не сойдутся, и корпус страницы будет
  // собран с чужого снимка. Сверяется сумма файла, который читается сейчас.
  const problems = [];
  const read = data.meta.sha256;
  if (corpusRun && corpusRun.source_sha256 !== read) problems.push(`корпус собран с выгрузки ${String(corpusRun.source_sha256).slice(0, 12)}…, читается ${read.slice(0, 12)}…; пересобери корпус`);
  if (recon['выгрузка']?.sha256 && recon['выгрузка'].sha256 !== read) problems.push(`разведка — с выгрузки ${recon['выгрузка'].sha256.slice(0, 12)}…, читается ${read.slice(0, 12)}…; пересчитай разведку`);
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

  const shops = new Set(listFrom(root, rules['исключить_хосты']));
  const platforms = new Set(listFrom(root, rules['площадки_платформ']));
  if (!shops.size) problems.push(`список маркетплейсов пуст: ${rules['исключить_хосты']['файл']}, ${rules['исключить_хосты']['ключ']}`);
  if (!platforms.size) problems.push(`список площадок пуст: ${rules['площадки_платформ']['файл']}, ${rules['площадки_платформ']['ключ']}`);
  const anchorBasket = new Map(recon['кластеры'].map((c) => [c['кластер'], c['корзина']]));
  const htmlOf = (rec) => {
    const path = join(root, 'input/corpus', rec.file);
    return existsSync(path) ? gunzipSync(readFileSync(path)).toString('utf8') : null;
  };

  const r = anatomy({ pages, queries: queriesFile.phrases, manifest, rules, shops, platforms, anchorBasket, htmlOf });
  problems.push(...r.problems);

  const last = new Map();
  for (const rec of manifest) last.set(rec.url, rec);
  const out = {
    ...HEADER,
    корпус: {
      манифест: HEADER.манифест,
      запросы: HEADER.запросы,
      // Корпус без даты и запроса — не данные, а мнение (`docs/BACKLOG.md`,
      // «Воспроизводимость»). Дата снимка выдачи и дата забора берутся
      // из `run.json` и переносятся сюда, чтобы измерение было привязано ко дню.
      снимок_выдачи: corpusRun?.serp_snapshot_date ?? null,
      забор: corpusRun ? [corpusRun.first_fetch_at, corpusRun.last_fetch_at] : null,
      выгрузка: corpusRun?.source ?? null,
      выгрузка_sha256: corpusRun?.source_sha256 ?? null,
      адресов_в_манифесте: last.size,
      скачано_ok: [...last.values()].filter((x) => x.outcome === 'ok').length,
      ...r.корпус,
      пропущено_маркетплейсов: r.страницы.reduce((s, p) => s + p.пропущено.маркетплейсов, 0),
    },
    ниша: r.ниша,
    страницы: r.страницы,
  };
  delete out.манифест;
  delete out.запросы;

  // Сторож чужого текста — по всему выходу, включая шапку.
  const allowed = allowedStrings({ rules, pages, manifest, extra: [...HEADER_KEYS, ...Object.values(HEADER), ...headerValues(out.корпус, doc.site.semantics)] });
  const foreign = foreignStrings(out, allowed);
  if (foreign.length) problems.push(`чужих строк в выходе: ${foreign.length} — ${foreign.slice(0, 5).join(', ')}; файл не записан`);

  /* -------------------------------------------------------------- *
   * Сводка в консоль.
   * -------------------------------------------------------------- */

  const k = out.корпус;
  console.log(`корпус: ${k.скачано_ok} скачано, ${k.разобрано} разобрано в корпусах страниц, ${k.оболочек} оболочек, ${k.пропущено_маркетплейсов} пропусков маркетплейсов (по страницам; уникальных адресов маркетплейсов в выдаче ${k.выдача.маркетплейсов}, из них скачано ${k.выдача.маркетплейсов_скачанных})`);
  const shellTop = Object.entries(k.оболочки_по_хостам).slice(0, 5).map(([h, n]) => `${h} ${n}`).join(', ');
  if (shellTop) console.log(`оболочки по хостам (уникальные документы): ${shellTop}`);
  console.log(`короткие документы по сотням знаков (0–99 … 500–599): ${k.короткие_по_сотням.join(' / ')}`);
  console.log(`выдача страниц: фраз ${k.выдача.фраз}, из них с видео-площадкой в топе ${k.выдача.фраз_с_видео}; адресов ${k.выдача.адресов}, из них видео-площадок ${k.выдача.видео_адресов}`);
  console.log(`медиана ниши: ${out.ниша.медиана_знаков} знаков без пробелов, коридор ${out.ниша.коридор[0]}–${out.ниша.коридор[1]}`);
  console.log('');
  console.log('элементы по всей нише (документная частота):');
  for (const [name, v] of Object.entries(out.ниша.элементы).sort((a, b) => b[1].доля - a[1].доля || cmp(a[0], b[0]))) {
    console.log(`  ${name.padEnd(14)} ${String(Math.round(v.доля * 100)).padStart(3)} %  (${v.документов} из ${v.из})`);
  }
  console.log('');
  console.log('страницы (док. — живых документов корпуса страницы; корзина страницы / корзина якоря):');
  for (const p of out.страницы) {
    const must = Object.entries(p.элементы).filter(([, v]) => v.вердикт === 'обязателен').map(([n, v]) => `${n} ${v.документов}/${v.из}`);
    const ask = Object.entries(p.элементы).filter(([, v]) => v.вердикт === 'на решение').map(([n, v]) => `${n} ${v.документов}/${v.из}`);
    const s = p.пропущено;
    console.log(
      `  ${String(p.документов).padStart(3)} док.  ${String(p.план.медиана_знаков).padStart(6)} зн.${p.план.ориентир ? '*' : ' '}  ` +
        `${p.корзина.padEnd(4)}/${p.корзина_якоря.padEnd(4)} ${p.url}  (фраз ${p.фраз}, адресов ${p.адресов}, оболочек ${s.оболочек}, не скачано ${s.не_скачано}, переходов ${s.переходов}, дублей ${s.дублей})`
    );
    if (must.length) console.log(`        обязателен: ${must.join(', ')}`);
    if (ask.length) console.log(`        на решение: ${ask.join(', ')}`);
  }
  console.log('');
  console.log('* — своих документов меньше четырёх, медиана взята по всей нише и является ориентиром, а не нормой страницы');
  const unknownTotal = out.страницы.reduce((s, p) => s + p.неопознанных_заголовков, 0);
  console.log(`заголовки тела по уникальным документам: узнано ${k.заголовков.узнано}, служебных ${k.заголовков.служебных}, неопознанных ${k.заголовков.неопознанных} (по страницам, с повторами общих документов: ${unknownTotal}) — в выходе только счёт и адреса документов`);

  const text = JSON.stringify(out, null, 1) + '\n';
  const outPath = join(root, 'structure/s3-anatomy.json');
  if (dryRun && existsSync(outPath) && readFileSync(outPath, 'utf8') !== text) {
    const was = readJson(outPath);
    const pagesDiff = out.страницы.filter((p) => JSON.stringify(p) !== JSON.stringify(was.страницы?.find((x) => x.url === p.url))).map((p) => p.url);
    problems.push(`structure/s3-anatomy.json расходится с посчитанным (страниц: ${pagesDiff.length}${pagesDiff.length ? ' — ' + pagesDiff.slice(0, 5).join(', ') : ''}${JSON.stringify(was.корпус) !== JSON.stringify(out.корпус) ? '; шапка корпуса' : ''}); блоки и коридоры дерева стоят на устаревшем измерении — npm run anatomy, затем npm run tree`);
  }

  if (problems.length) {
    console.error('');
    console.error(`несходимости (${problems.length}):`);
    for (const p of problems) console.error(`  ${p}`);
    console.error('');
    console.error(dryRun ? 'сверка не прошла.' : 'измерение не записано.');
    return false;
  }
  if (!dryRun) {
    writeFileSync(outPath, text);
    console.log('записано: structure/s3-anatomy.json');
  } else if (existsSync(outPath)) {
    console.log('structure/s3-anatomy.json совпадает с посчитанным');
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
  const s2 = fx['сценарий_2'];
  const base2 = () => ({
    pages: structuredClone(s2['страницы']),
    queries: structuredClone(s2['queries']),
    manifest: structuredClone(s2['манифест']),
    rules: structuredClone(rules),
    shops: new Set(s2['маркетплейсы']),
    platforms: new Set(s2['площадки']),
    anchorBasket: new Map(Object.entries(s2['корзина_якоря'])),
    htmlOf: (rec) => s2['документы'][rec.file] ?? null,
  });
  const measure = (input) => anatomy(input);

  const cases = [];
  const check = (имя, ждём, факт, откуда) =>
    cases.push({ имя, ждём: JSON.stringify(ждём), факт: JSON.stringify(факт), откуда });
  const page = (r, url) => r.страницы.find((p) => p.url === url);
  const problemsAbout = (r, text) => r.problems.filter((p) => p.includes(text)).length;
  const doc = (file) => measureDoc(fx['документы'][file], rules);
  const el = (file) => doc(file).элементы;
  const allElements = elementNamesOf(rules);
  const only = (names) => Object.fromEntries(allElements.map((k) => [k, names.includes(k)]));

  // Ноль: фикстура сама сходится.
  const ok = measure(base());
  check('фикстура: несходимостей', 0, ok.problems.length, ok.problems.join(' | ') || 'корпус собран');
  check('фикстура: страниц в выходе', ['/', '/one/', '/theme/', '/thin/', '/mid/'], ok.страницы.map((p) => p.url), 'служебная /privacy/ без фраз — не в выходе');

  // Пороги правил — литералом: правка числа в rules-s3.json роняет пробу, а не проходит молча.
  check('правила: пороги', { обязателен: 0.7, решение: 0.4, минимум: 4, high: 7, mid: 4, оболочка: 300, коридор: 0.15, план_минимум: 4 }, { обязателен: rules['анатомия']['обязателен_от'], решение: rules['анатомия']['решение_от'], минимум: rules['анатомия']['минимум_документов'], high: rules['корзины']['high_от'], mid: rules['корзины']['mid_от'], оболочка: rules['оболочки']['минимум_знаков'], коридор: rules['план_содержания']['коридор'], план_минимум: rules['план_содержания']['минимум_документов'] }, 'П70: пороги первого сайта; менять — решением, не правкой файла');

  // P — корпус страницы: объединение адресов всех фраз, адрес считается один раз.
  const theme = page(ok, '/theme/');
  const one = page(ok, '/one/');
  check('P: корпус страницы — по всем фразам, не по якорю', { адресов: 8, документов: 7, корзина: 'high', якорь: 'low' }, { адресов: theme.адресов, документов: theme.документов, корзина: theme.корзина, якорь: theme.корзина_якоря }, 'бэклог 54 п. 3: якорь low с одним документом, темы дают семь');
  check('P: общий адрес двух фраз — один адрес', 6, one.адресов, 'семь строк выдачи трёх фраз, shared у двух');
  check('P: фраз и хостов страницы', { фраз: 3, хостов: 2 }, { фраз: one.фраз, хостов: one.хостов }, 'три фразы /one/; живые документы на one.example и long.example');
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
  const byAnchor = base();
  byAnchor.rules['корзины']['по_корпусу_страницы'] = false;
  check('P: по_корпусу_страницы: false — корзина якоря', { корзина: 'low', вердикт: 'не считается' }, { корзина: page(measure(byAnchor), '/theme/').корзина, вердикт: page(measure(byAnchor), '/theme/').элементы.tabela.вердикт }, 'флаг живой: корзина кластера-якоря, как у первого сайта');

  // M — манифест: последняя запись по адресу побеждает; не «ok» не считается;
  // маркетплейс — по суффиксу хоста с точкой.
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
  const noShell = base();
  noShell.rules['оболочки']['минимум_знаков'] = 0;
  check('S: порог 0 — оболочек нет', { оболочек: 0, документов: 4 }, { оболочек: page(measure(noShell), '/thin/').пропущено.оболочек, документов: page(measure(noShell), '/thin/').документов }, 'порог живёт в правилах');

  // L — линейка объёма: тело статьи, теги, скрипты, комментарии, сущности.
  check('L: знаки без пробелов по телу <article>', 1000, doc('raw/one-anchor.html').znaki, '490 + 490 + три заголовка в article, 500 в nav снаружи');
  check('L: без <article>/<main> — минус header/footer/nav/aside', 2007, doc('raw/one-long.html').znaki, 'текст шапки, меню, aside и подвала не считается; <title> из <head> (7 знаков) считается — линейка первого сайта, гейт так не меряет (бэклог 55)');
  check('L: короткий <article> (< 400 байт HTML) — весь документ без обвязки', 359, doc('raw/thin-short-article.html').znaki, 'порог 400 байт разметки, как у первого сайта; 100 + 250 + <title> 9');
  check('L: script, style, комментарий — не текст; сущности — раскрыты', 6, doc('raw/entities.html').znaki, '«a&nbsp;b&amp;c» → ab&c, «&#x41;&#66;» → ab');
  check('L: noscript, комментарий с «>», &lt; &gt; &quot;', 503, doc('raw/det-ruler.html').znaki, '500 + «<>"»; 50 в noscript и 50 в комментарии с «>» не считаются');
  check('L: два <article> — наибольший по разметке', 600, doc('raw/det-two-articles.html').znaki, 'короткий блок в 100 знаков — не тело');
  check('L: <main> с <article> внутри — тело <article>', 600, doc('raw/det-main-article.html').znaki, 'aside внутри <main> (300) не считается: <article> раньше <main>');
  check('L: заголовки считаются по телу: h2 из nav не в счёте', { h2: 2, h3: 1 }, { h2: doc('raw/one-anchor.html').h2, h3: doc('raw/one-anchor.html').h3 }, 'два h2 и один h3 в article, ещё h2 в nav');
  check('L: без тела — заголовки обвязки не считаются', { h2: 0, h3: 0 }, { h2: doc('raw/one-long.html').h2, h3: doc('raw/one-long.html').h3 }, 'h2 в nav срезан');

  // E — элементы: каждый признак; узлы видимые; разметка разобранная.
  check('E: все двенадцать элементов узнаны', only(allElements), el('raw/one-anchor.html'), 'документ со всеми признаками: JSON-LD Article с автором-человеком, Review и AggregateRating верхнего уровня, figure×4 в теле');
  check('E: документ без признаков — ни одного', 0, Object.values(el('raw/one-long.html')).filter(Boolean).length, 'слово «related» в тексте — не элемент');
  check('E: класс в атрибуте, details×3 — FAQ, id — тоже атрибут', only(['breadcrumbs', 'spis-tresci', 'faq', 'podobne', 'galeria', 'komentarze']), el('raw/theme-classes.html'), 'breadcrumbs, article-toc, related-posts, gallery с тремя картинками в теле, id=comments');
  check('E: figure×3 — не галерея; octocat, stock — не toc', { galeria: false, 'spis-tresci': false }, { galeria: el('raw/theme-three-figures.html').galeria, 'spis-tresci': el('raw/theme-three-figures.html')['spis-tresci'] }, 'минимум 4; сверка класса по границам слова');
  check('E: код, стиль, иконки, поля формы, скрытые узлы — не элементы', only([]), el('raw/det-code-nodes.html'), 'style/script id, svg octicon, <i> fa-, iconochive, input, display:none, hidden, aria-hidden');
  check('E: BEM — автор комментария: комментарии, не подпись', { komentarze: true, 'autor-data': false }, { komentarze: el('raw/det-bem.html').komentarze, 'autor-data': el('raw/det-bem.html')['autor-data'] }, 'commentthread_comment_author, wpdiscuz-…-author: контекст комментариев');
  check('E: служебное сообщение цитаты — не комментарии', false, el('raw/det-citation.html').komentarze, 'citation-comment — контекст citation');
  check('E: подпись — дата у статьи с автором-человеком', { игра: false, организация: false, ссылка_id: true, битый: false }, { игра: el('raw/det-ld-videogame.html')['autor-data'], организация: el('raw/det-ld-org-author.html')['autor-data'], ссылка_id: el('raw/det-ld-person-ref.html')['autor-data'], битый: el('raw/det-ld-broken.html').ocena }, 'VideoGame — дата выхода; Organization — не подпись; Person по @id в @graph; битый JSON-LD — не разметка');
  check('E: оценка редакции — не подпись ссылки, не скрипт, не отзыв в товаре', { формы: false, вложенный: false, игроки: true }, { формы: el('raw/det-review-forms.html').ocena, вложенный: el('raw/det-review-nested.html').ocena, игроки: el('raw/det-review-nested.html')['oceny-graczy'] }, 'aria-label, title, href /Review, __typename; Review внутри Product — отзыв игрока; AggregateRating — оценки игроков');
  check('E: классы оценки — редакции, не игроков и не возраста', { ocena: true, 'oceny-graczy': true }, { ocena: el('raw/det-review-classes.html').ocena, 'oceny-graczy': el('raw/det-review-classes.html')['oceny-graczy'] }, 'review-score — редакция; user-score-slider — игроки; badge--rating — ничего');
  check('E: разметка — не голое слово в меню', false, el('raw/markup-bare.html').ocena, '«Review» и «Reviews» текстом ссылок');
  check('E: разметка — Review в JSON-LD и itemtype=…/Review', { ld: true, itemtype: true }, { ld: el('raw/markup-quoted.html').ocena, itemtype: el('raw/markup-itemtype.html').ocena }, 'Review верхнего уровня');
  check('E: оглавление — camelCase и якоря в первой трети тела', { camel: true, якоря: true, два: false, поздно: false }, { camel: el('raw/det-toc-camel.html')['spis-tresci'], якоря: el('raw/det-toc-anchors.html')['spis-tresci'], два: el('raw/det-toc-two.html')['spis-tresci'], поздно: el('raw/det-toc-late.html')['spis-tresci'] }, 'GuideTableOfContents; три якоря на разделы (#top не в счёте); два и ссылка в никуда — мало; список в конце тела — не оглавление');
  check('E: подпись — одинарные кавычки, itemprop у статьи, не у приложения; rel у a, не у link', { кавычки: true, статья: true, приложение: false, link: false, a: true }, { кавычки: el('raw/det-quotes.html')['autor-data'], статья: el('raw/det-itemprop-multi.html')['autor-data'], приложение: el('raw/det-itemprop-app.html')['autor-data'], link: el('raw/det-rel-link.html')['autor-data'], a: el('raw/det-rel-a.html')['autor-data'] }, "class='post-author'; itemprop=\"datePublished dateModified\" у BlogPosting; SoftwareApplication — не статья");
  check('E: правая граница, длинный атрибут, свой тег <video-…>', { podobne: false, wideo: false }, { podobne: el('raw/det-bounds.html').podobne, wideo: el('raw/det-bounds.html').wideo }, 'relatedposts; related в атрибуте длиннее 300; <video-progress>');
  check('E: <video> — видео', true, el('raw/det-video.html').wideo, 'тег с границей');
  check('E: галерея — в теле, три картинки, не ползунок', { тело: true, две: false, снаружи: false, ползунок: false }, { тело: el('raw/det-gallery-body.html').galeria, две: el('raw/det-gallery-two.html').galeria, снаружи: el('raw/det-gallery-outside.html').galeria, ползунок: el('raw/det-gallery-context.html').galeria }, 'картинок_внутри_от 3; в_теле; user/score — контекст');

  // T — темы заголовков: словарь → наше имя, служебные — мимо, неопознанное — счёт и адрес.
  check('T: темы узнаны нашими именами', ['plot', 'gameplay', 'gameplay'], doc('raw/one-anchor.html').темы, 'h2 Plot, h2 Gameplay, h3 Controls');
  check('T: служебный заголовок — мимо, неопознанный — null', ['plot', '__служебный__', null], doc('raw/theme-unknown.html').темы, 'h2 Plot, h2 Menu, h2 «zzqx wvut»');
  check('T: слово по границам — history не plot, games in order — series', ['series', 'series'], [...doc('raw/home-a.html').темы, ...doc('raw/home-b.html').темы], '«story» внутри «history» не считается');
  check('T: самое длинное слово, начало заголовка, апостроф, шаблон, h1 и пустой', ['cheats', 'series', 'about', null, 'about', '__служебный__', 'plot', 'plot'], doc('raw/det-themes.html').темы, 'console commands — cheats; release order — series; ^about только в начале; What’s new; {{title}}; h1 и пустой h2 — не темы');
  const reach = [];
  for (const [t, words] of Object.entries(rules['темы_заголовков'])) {
    if (!Array.isArray(words)) continue;
    for (const w of words) {
      const got = themeOf(w.replace(/^\^/, ''), rules);
      if (got !== t) reach.push(`${w} → ${got}`);
    }
  }
  check('T: каждое слово словаря узнаётся своей темой', [], reach, 'затенённых слов нет (рецензия 2026-09-23)');
  check('T: неопознанное — счёт и адрес, без текста', { n: 1, док: 1, urls: ['https://theme.example/unknown'] }, { n: theme.неопознанных_заголовков, док: theme.неопознанное_документов, urls: theme.неопознанное_у }, 'примером служит документ');
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
  check('N: медиана и коридор ниши — литералом', { медиана: 1259, коридор: [1070, 1448] }, { медиана: ok.ниша.медиана_знаков, коридор: ok.ниша.коридор }, '20 живых документов: 10-й и 11-й — 1207 и 1310');
  check('N: меньше четырёх документов — ориентир по нише', { ориентир: true, медиана: 1259, коридор: [1070, 1448] }, { ориентир: thin.план.ориентир, медиана: thin.план.медиана_знаков, коридор: thin.план.коридор }, 'три документа /thin/ — медиана ниши');
  check('N: четыре документа — своя медиана', false, mid.план.ориентир, 'минимум_документов 4');
  check('N: ниша — уникальные живые документы всех страниц', 20, ok.корпус.разобрано, 'общие адреса не удваиваются, оболочки и отказы не в счёте');
  check('N: ниша — доля элемента по всем документам', { документов: 15, из: 20 }, { документов: ok.ниша.элементы.tabela.документов, из: ok.ниша.элементы.tabela.из }, 'таблица у anchor, shared, theme×6, thin×3, mid×4');
  const tol = base();
  tol.rules['план_содержания']['коридор'] = 0.1;
  check('N: коридор — из правил', [2250, 2750], page(measure(tol), '/mid/').план.коридор, '±10 %');

  // W — второй сценарий: переходы, дубли, общая оболочка, порядок пропусков,
  // площадки, видео, пороги ровно на границе, медианы и округление.
  const w2 = measure(base2());
  const w = page(w2, '/w/');
  const ten = page(w2, '/ten/');
  const odd = page(w2, '/odd/');
  check('W: сценарий сходится', 0, w2.problems.length, w2.problems.join(' | ') || 'корпус собран');
  check('W: пропуски — стенка и корень, дубли по адресу перехода и канону, отказ маркетплейса — не скачано', { не_в_манифесте: 0, не_скачано: 2, маркетплейсов: 0, переходов: 2, нет_файла: 0, дублей: 2, оболочек: 1 }, w.пропущено, 'agecheck; /en/ — корень; ?l= и конечный слэш; канон /article и /article/; канон-корень — не дубль; www.shop.example с отказом — в не_скачано');
  check('W: живые документы /w/', { документов: 6, корзина: 'mid', медиана: 1450, хост: { хост: 'root.example', документов: 2 } }, { документов: w.документов, корзина: w.корзина, медиана: w.план.медиана_знаков, хост: w.крупнейший_хост }, 'notshop.example — не маркетплейс (суффикс без точки); два адреса с каноном-корнем — два документа');
  check('W: площадки платформ и медиана без них', { документов: 1, медиана_без_них: 1400 }, w.площадки_платформ, 'store.platform.example по суффиксу');
  check('W: видео-площадка в выдаче — при любом исходе забора', { адресов: 1, из: 13 }, w.видео_в_выдаче, 'www.youtube.com — robots, но в выдаче стоит');
  check('W: общая оболочка двух страниц — одна в нише', { по_страницам: 2, оболочек: 1, по_хостам: { 'shell.example': 1 } }, { по_страницам: w.пропущено.оболочек + page(w2, '/v/').пропущено.оболочек, оболочек: w2.корпус.оболочек, по_хостам: w2.корпус.оболочки_по_хостам }, 'сумма по хостам равна числу оболочек');
  check('W: выдача страниц', { фраз: 5, фраз_с_видео: 1, адресов: 32, видео_адресов: 1, маркетплейсов: 1, маркетплейсов_скачанных: 0 }, w2.корпус.выдача, 'уникальные адреса всех страниц');
  check('W: короткие по сотням и заголовки по уникальным документам', { короткие: [0, 1, 0, 0, 0, 1], заголовков: { узнано: 4, служебных: 0, неопознанных: 16 } }, { короткие: w2.корпус.короткие_по_сотням, заголовков: w2.корпус.заголовков }, 'оболочка 100 и документ 500; lore×2, plot×2 — узнано, zzqx×7 и три заголовка /odd/ ×3 — нет');
  check('W: ровно 0.7 — обязателен, ровно 0.4 — на решение', { tabela: 'обязателен', faq: 'на решение' }, { tabela: ten.элементы.tabela.вердикт, faq: ten.элементы.faq.вердикт }, 'table у 7 из 10, details×3 у 4 из 10');
  check('W: тема у двух — редкая, повтор в документе — один раз', { lore: 'редкая', plot: 'гэп', plotDocs: 1 }, { lore: ten.темы.find((t) => t.тема === 'lore')?.вердикт, plot: ten.темы.find((t) => t.тема === 'plot')?.вердикт, plotDocs: ten.темы.find((t) => t.тема === 'plot')?.документов }, 'n = 2 при доле 0.2; два h2 plot в одном документе');
  check('W: неопознанное — все документы счётом, первые шесть адресов по порядку', { n: 7, док: 7, urls: ['https://ten.example/00', 'https://ten.example/01', 'https://ten.example/02', 'https://ten.example/03', 'https://ten.example/04', 'https://ten.example/05'] }, { n: ten.неопознанных_заголовков, док: ten.неопознанное_документов, urls: ten.неопознанное_у }, 'неопознанное_у — первые шесть');
  check('W: медиана чётного ряда с нечётной суммой — округление, коридор', { медиана: 1501, коридор: [1276, 1726] }, { медиана: ten.план.медиана_знаков, коридор: ten.план.коридор }, '1001 + 2000 → 1500.5 → 1501; 1275.85 → 1276');
  check('W: медиана нечётного ряда разной разрядности, коридор', { медиана: 1505, коридор: [1279, 1731], h2: 2, h3: 1 }, { медиана: odd.план.медиана_знаков, коридор: odd.план.коридор, h2: odd.план.h2_медиана, h3: odd.план.h3_медиана }, '950 < 1001 < 1505 < 3000 < 4000 — числом, не строкой; 1730.75 → 1731');
  check('W: медиана ниши сценария', 1600, w2.ниша.медиана_знаков, '25 живых документов, 13-й');

  // G — сторож чужого текста.
  const allowed = allowedStrings({ rules, pages: fx['страницы'], manifest: fx['манифест'] });
  check('G: выход фикстуры — чужих строк нет', [], foreignStrings({ страницы: ok.страницы, ниша: ok.ниша, корпус: ok.корпус }, allowed), 'все строки — наши');
  const allowed2 = allowedStrings({ rules, pages: s2['страницы'], manifest: s2['манифест'] });
  check('G: выход второго сценария — чужих строк нет', [], foreignStrings({ страницы: w2.страницы, ниша: w2.ниша, корпус: w2.корпус }, allowed2), 'новые поля — в списке ключей');
  const leaked = structuredClone(ok.страницы);
  leaked[0].темы.push({ тема: 'zzqx wvut', документов: 1, из: 1, доля: 1, вердикт: 'гэп' });
  check('G: чужая строка — путь без текста', ['$[0].темы[1].тема'], foreignStrings(leaked, allowed), 'сторож называет место, не формулировку');
  check('G: чужой ключ — меткой, не текстом', ['$.{ключ#0}', '$.{ключ#0}.тема'], foreignStrings({ zzqx: { тема: 'wvut' } }, allowed), 'текст ключа в путь не попадает');
  check('G: чужая строка в массиве', ['$.неопознанное_у[0]'], foreignStrings({ неопознанное_у: ['https://elsewhere.example/'] }, allowed), 'адрес не из манифеста — чужой');
  check('G: шапка — по форме, не по значению', ['2026-09-18', '2026-09-18T10:00:00.000Z', 'input/x.xlsx', 'a'.repeat(64)], headerValues({ снимок_выдачи: '2026-09-18', забор: ['2026-09-18T10:00:00.000Z', 'не время'], выгрузка: 'input/x.xlsx', выгрузка_sha256: 'a'.repeat(64) }, 'input/x.xlsx'), 'строка не по форме остаётся чужой');
  check('G: шапка — чужая выгрузка и не-sha не проходят', [], headerValues({ снимок_выдачи: 'вчера', забор: null, выгрузка: 'input/y.xlsx', выгрузка_sha256: 'zz' }, 'input/x.xlsx'), 'путь не тот, что называет структура');

  // D — дубль по адресу: хвосты, которые страницу не меняют.
  check('D: адрес документа без языка, меток, фрагмента и конечного слэша', 'https://a.example/p?id=7', docKey('https://A.example/p/?id=7&l=english&utm_source=x#top', rules['переходы']['параметры_без_смысла']), 'id — смысловой параметр, остаётся');
  check('D: стенка и корень — переходы; язык в пути — нет', ['стенка', 'корень', null, null], [
    wallOf({ url: 'https://s.example/app/1', final_url: 'https://s.example/agecheck/app/1/' }, rules),
    wallOf({ url: 'https://s.example/news/x', final_url: 'https://s.example/en-us/' }, rules),
    wallOf({ url: 'https://s.example/p/x', final_url: 'https://s.example/pl/p/x' }, rules),
    wallOf({ url: 'https://s.example/p/x', final_url: 'https://s.example/p/x' }, rules),
  ], 'путь /pl/p/x — языковой вариант того же документа');

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
