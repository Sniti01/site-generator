#!/usr/bin/env node
/**
 * Анатомия корпуса — стадия S3 (`docs/05_STRUCTURE_TASK.md`, пункт 1 бэклога).
 *
 *   node tools/anatomy-s3.mjs            — считает и пишет structure/s3-anatomy.json
 *   node tools/anatomy-s3.mjs --dry-run  — только печатает сводку
 *
 * Два прохода по одному корпусу, как велит бэклог.
 * **Проход 1 — план содержания:** медиана объёма и коридор ±15 %, число
 * заголовков, дерево тем. **Проход 2 — анатомия:** из чего страница сделана —
 * крошки, оглавление, FAQ, блок похожего, таблицы, галерея, видео, разметка.
 * Решает не глаз, а документная частота: элемент у 7 документов из 10 —
 * норма жанра.
 *
 * **Извлекается структура, не текст.** Ни одной формулировки конкурента
 * в выходе нет и быть не должно (`docs/BACKLOG.md`, «Что извлекается и что
 * не извлекается никогда»). Заголовки узнаются словарём и записываются нашим
 * именем темы; заголовок, которого словарь не узнал, идёт числом и адресами —
 * **примером служит документ, а не фраза.**
 *
 * **Маркетплейсы из корпуса анатомии исключены.** Карточка товара устроена
 * как карточка товара; посчитав её вместе с обзорами и вики, мы объявили бы
 * нормой ниши корзину покупок. Список тот же, что у разведки S0.
 *
 * Корпус — только чтение: файлы открываются, ничего не пишется рядом.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const declPath = join(root, 'structure/pages-s2.json');
const rulesPath = join(root, 'structure/rules-s3.json');
const rules0Path = join(root, 'structure/rules-s0.json');
const reconPath = join(root, 'structure/s0-recon.json');
const manifestPath = join(root, 'input/corpus/manifest.jsonl');
const runPath = join(root, 'input/corpus/run.json');
const outPath = join(root, 'structure/s3-anatomy.json');

const dryRun = process.argv.includes('--dry-run');

const decl = JSON.parse(readFileSync(declPath, 'utf8'));
const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
const rules0 = JSON.parse(readFileSync(rules0Path, 'utf8'));
const recon = JSON.parse(readFileSync(reconPath, 'utf8'));
const manifest = readFileSync(manifestPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const run = existsSync(runPath) ? JSON.parse(readFileSync(runPath, 'utf8')) : null;

const shops = new Set(rules0['магазинный_интент']['маркетплейсы']);
const basket = new Map(recon['кластеры'].map((c) => [c['кластер'], c['корзина']]));

/* ---------------------------------------------------------------- *
 * Разбор документа: только структура и мера.
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
const hasClassWord = (html, words) => {
  const lower = html.toLowerCase();
  return words.some((w) => lower.includes(w.toLowerCase()));
};

/** Элементы страницы по словарю признаков `rules-s3.json`. */
function elements(html) {
  const found = {};
  const lower = html.toLowerCase();
  for (const [name, spec] of Object.entries(rules['элементы'])) {
    if (name === 'почему_так') continue;
    let hit = false;
    if (spec['разметка'] && has(html, spec['разметка'])) hit = true;
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

/** Тема заголовка по словарю; null — словарь не узнал. */
// Пояснения в словаре — строки, темы — списки слов; берём только списки,
// чтобы новое пояснение не роняло инструмент.
const themeDict = Object.entries(rules['темы_заголовков']).filter(([, v]) => Array.isArray(v));
const serviceWords = rules['служебные_заголовки']['слова'];

function themeOf(text) {
  if (serviceWords.some((w) => text.includes(w))) return '__служебный__';
  for (const [theme, words] of themeDict) if (words.some((w) => text.includes(w))) return theme;
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

function readDoc(rec) {
  const path = join(root, 'input/corpus', rec.file.replace(/^raw\//, 'raw/'));
  if (!existsSync(path)) return null;
  const html = gunzipSync(readFileSync(path)).toString('utf8');
  const body = contentRoot(html);
  const text = norm(strip(body));
  const hs = headings(body);
  return {
    url: rec.url,
    host: rec.host,
    znaki: text.replace(/ /g, '').length,
    h2: hs.filter((h) => h.level === 2).length,
    h3: hs.filter((h) => h.level === 3).length,
    темы: hs.filter((h) => h.level >= 2).map((h) => themeOf(h.text)),
    элементы: elements(html),
  };
}

const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

/* ---------------------------------------------------------------- *
 * Корпус страницы: документы её кластеров, без маркетплейсов.
 * ---------------------------------------------------------------- */

const byCluster = new Map();
for (const r of manifest) {
  for (const g of r.groups ?? []) {
    if (!byCluster.has(g)) byCluster.set(g, []);
    byCluster.get(g).push(r);
  }
}

const fateClusters = new Map();
for (const c of recon['кластеры']) {
  const f = c['судьба'];
  if (!fateClusters.has(f)) fateClusters.set(f, []);
  fateClusters.get(f).push(c['кластер']);
}

let shopSkipped = 0;
const cache = new Map();
const pages = [];

for (const p of decl['страницы']) {
  const clusters = [
    p.cluster,
    ...(p['слияния'] ?? []),
    ...(p['возвращено_из_no_page'] ?? []),
    ...(p['судьбы'] ?? []).flatMap((f) => fateClusters.get(f) ?? []),
  ].filter(Boolean);

  const seen = new Map();
  for (const c of clusters) {
    for (const r of byCluster.get(c) ?? []) {
      if (r.outcome !== 'ok') continue;
      if (shops.has(r.host)) {
        shopSkipped += 1;
        continue;
      }
      seen.set(r.url, r);
    }
  }

  const docs = [];
  for (const r of seen.values()) {
    if (!cache.has(r.url)) cache.set(r.url, readDoc(r));
    const d = cache.get(r.url);
    if (d) docs.push(d);
  }

  const korzyna = p.cluster ? basket.get(p.cluster) ?? '—' : '—';
  const enough = docs.length >= rules['анатомия']['минимум_документов'];
  const anatomyAllowed = enough && !(rules['корзины']['low_только_план'] && korzyna === 'low');

  const el = {};
  for (const name of Object.keys(rules['элементы'])) {
    if (name === 'почему_так') continue;
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
    .sort((a, b) => b.документов - a.документов);

  const lengths = docs.map((d) => d.znaki).filter((x) => x > 0);
  const med = median(lengths);
  const tol = rules['план_содержания']['коридор'];
  const scarce = docs.length < rules['план_содержания']['минимум_документов'];

  pages.push({
    url: p.url,
    cluster: p.cluster ?? null,
    корзина: korzyna,
    документов: docs.length,
    хостов: new Set(docs.map((d) => d.host)).size,
    план: {
      медиана_знаков: med,
      коридор: med ? [Math.round(med * (1 - tol)), Math.round(med * (1 + tol))] : [0, 0],
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

/* ---------------------------------------------------------------- *
 * Ниша целиком — она же запасная медиана для страниц с малым корпусом.
 * ---------------------------------------------------------------- */

const allDocs = [...cache.values()].filter(Boolean);
const nicheMedian = median(allDocs.map((d) => d.znaki).filter((x) => x > 0));
const nicheElements = {};
for (const name of Object.keys(rules['элементы'])) {
  if (name === 'почему_так') continue;
  const n = allDocs.filter((d) => d.элементы[name]).length;
  nicheElements[name] = { документов: n, из: allDocs.length, доля: Number((n / (allDocs.length || 1)).toFixed(2)) };
}

for (const p of pages) {
  if (p.план.ориентир) {
    p.план.медиана_знаков = nicheMedian;
    p.план.коридор = [
      Math.round(nicheMedian * (1 - rules['план_содержания']['коридор'])),
      Math.round(nicheMedian * (1 + rules['план_содержания']['коридор'])),
    ];
  }
}

const out = {
  инструмент: 'tools/anatomy-s3.mjs',
  правила: 'structure/rules-s3.json',
  статус: 'измерение S3 — пороги применены, имена блоков не назначены',
  корпус: {
    манифест: 'input/corpus/manifest.jsonl',
    // Корпус без даты и запроса — не данные, а мнение (`docs/BACKLOG.md`,
    // «Воспроизводимость»). Дата снимка выдачи и дата забора берутся
    // из `run.json` и переносятся сюда, чтобы измерение было привязано ко дню.
    снимок_выдачи: run?.serp_snapshot_date ?? null,
    забор: run ? [run.first_fetch_at, run.last_fetch_at] : null,
    выгрузка: run?.source ?? null,
    выгрузка_sha256: run?.source_sha256 ?? null,
    документов_в_манифесте: manifest.length,
    скачано_ok: manifest.filter((r) => r.outcome === 'ok').length,
    разобрано: allDocs.length,
    пропущено_маркетплейсов: shopSkipped,
  },
  ниша: {
    медиана_знаков: nicheMedian,
    коридор: [
      Math.round(nicheMedian * (1 - rules['план_содержания']['коридор'])),
      Math.round(nicheMedian * (1 + rules['план_содержания']['коридор'])),
    ],
    элементы: nicheElements,
  },
  страницы: pages,
};

if (!dryRun) writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');

/* ---------------------------------------------------------------- *
 * Сводка в консоль.
 * ---------------------------------------------------------------- */

console.log(`корпус: ${out.корпус.скачано_ok} скачано, ${allDocs.length} разобрано, ${shopSkipped} пропусков маркетплейсов`);
console.log(`медиана ниши: ${nicheMedian} знаков без пробелов, коридор ${out.ниша.коридор[0]}–${out.ниша.коридор[1]}`);
console.log('');
console.log('элементы по всей нише (документная частота):');
for (const [name, v] of Object.entries(nicheElements).sort((a, b) => b[1].доля - a[1].доля)) {
  console.log(`  ${name.padEnd(14)} ${String(Math.round(v.доля * 100)).padStart(3)} %  (${v.документов} из ${v.из})`);
}
console.log('');
console.log('страницы:');
for (const p of pages) {
  const must = Object.entries(p.элементы).filter(([, v]) => v.вердикт === 'обязателен').map(([k]) => k);
  const ask = Object.entries(p.элементы).filter(([, v]) => v.вердикт === 'на решение').map(([k]) => k);
  console.log(
    `  ${String(p.документов).padStart(2)} док.  ${String(p.план.медиана_знаков).padStart(6)} зн.${p.план.ориентир ? '*' : ' '}  ` +
      `${p.корзина.padEnd(4)} ${p.url}`
  );
  if (must.length) console.log(`        обязателен: ${must.join(', ')}`);
  if (ask.length) console.log(`        на решение: ${ask.join(', ')}`);
}
console.log('');
console.log('* — своих документов меньше четырёх, медиана взята по всей нише и является ориентиром, а не нормой страницы');
const unknownTotal = pages.reduce((s, p) => s + p.неопознанных_заголовков, 0);
console.log(`неопознанных заголовков: ${unknownTotal} — в выходе только счёт и адреса документов, ни одной чужой формулировки`);
if (!dryRun) console.log('записано: structure/s3-anatomy.json');
