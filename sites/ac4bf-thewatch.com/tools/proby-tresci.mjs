#!/usr/bin/env node
/**
 * Пробы контракта содержания — три отрицательные (бэклог 44 + 28, П52 п. 5).
 *
 *   node tools/proby-tresci.mjs      — гоняет три пробы, печатает ok/ŹLE, exit 1 при любой ŹLE
 *
 * Схема (`src/content.config.ts`) и маршрут (`src/pages/[...slug].astro`) —
 * судьи содержания: судья, которого никто не видел падающим, — обещание,
 * а не проверка (тот же довод, что у `--selftest` гейта структуры). Пробы
 * делают ровно то, чего судьи обязаны не пропустить, и ждут отказа с именем:
 *
 *   1. неизвестный ключ во фронтматтере (`title`) — ловит `.strict()` схемы;
 *   2. поле блока, которого нет в `blocks[]` страницы (`verdict` без
 *      `verdict-box`) — ловит сверка «pole bez bloku» маршрута;
 *   3. страница с `hero-key-art` без `lead` — ловит проверка героя маршрута
 *      (отказ называет недостающее поле; общее «Blocks[] i druk rozeszły
 *      się» осталось вторым рубежом и до него дело не доходит).
 *
 * Как устроено. Файл-образец — `discovery.md` (страница с героем, без
 * `verdict-box`): его байты откладываются в память, на место пишется
 * искажённая копия, запускается `astro build` в отдельную папку
 * `.astro/dist-proba` (в `.gitignore`; `dist/` сайта не трогается), исходные
 * байты возвращаются в `finally` и сверяются побайтово. Сборка тут — только
 * `astro build`, без гейтов источников: они не при чём. Положительная проба —
 * обычная `npm run build` сайта: 30 файлов проходят, 31 страница строится.
 *
 * Почему подмена, а не второй файл с тем же `url`: маршрут проверяет каждую
 * запись при печати страницы, две записи на один адрес дали бы две сборки
 * одного пути — и отказ пришёл бы не от судьи, а от Astro.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sample = join(root, 'src/content/tresc/discovery.md');
// Папка сборки проб — относительным путём: `astro build` кладёт `.prerender`
// рядом и переносит ассеты `rename`, а он не умеет через границу диска.
const outDir = '.astro/dist-proba';

const original = readFileSync(sample);
const text = original.toString('utf8');
const eol = text.includes('\r\n') ? '\r\n' : '\n';
const lines = text.split(eol);
const after = (prefix) => lines.findIndex((l) => l.startsWith(prefix));

/** Копия образца с вставкой строк после строки `url:`. */
const withInserted = (extra) => {
  const i = after('url:');
  return [...lines.slice(0, i + 1), ...extra, ...lines.slice(i + 1)].join(eol);
};
/** Копия образца без поля `lead` (ключ и его отступленные строки). */
const withoutLead = () => {
  const i = after('lead:');
  let j = i + 1;
  while (j < lines.length && /^\s/.test(lines[j])) j += 1;
  return [...lines.slice(0, i), ...lines.slice(j)].join(eol);
};

const probes = [
  {
    имя: '1. неизвестный ключ `title`',
    файл: withInserted(['title: Próba — pole SEO nie mieszka w treści']),
    ждём: ['title', 'Unrecognized key'],
    судья: '.strict() схемы (бэклог 44)',
  },
  {
    имя: '2. поле `verdict` без блока `verdict-box`',
    файл: withInserted(['verdict:', '  label: Próba', '  body:', '    - Próba.']),
    ждём: ['Pole bez bloku', '`verdict`', '`verdict-box`'],
    судья: 'сверка «pole bez bloku» маршрута (бэклог 44)',
  },
  {
    имя: '3. `hero-key-art` без `lead`',
    файл: withoutLead(),
    ждём: ['Blok `hero-key-art` zadeklarowany', 'brak: `lead`'],
    судья: 'предикат hero (бэклог 28)',
  },
];

mkdirSync(join(root, outDir), { recursive: true });
let failed = 0;
for (const p of probes) {
  let out = '';
  let status = null;
  try {
    writeFileSync(sample, p.файл);
    // `astro` — через `npm exec`: бинарник пакета не экспортируется как
    // подпуть, а `node_modules/.bin` воркспейса лежит двумя уровнями выше.
    const r = spawnSync(`npm exec -- astro build --outDir ${outDir}`, {
      cwd: root,
      shell: true,
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    });
    out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
    status = r.status;
  } finally {
    writeFileSync(sample, original);
  }
  if (!readFileSync(sample).equals(original)) {
    console.error(`образец ${sample} не восстановлен побайтово — верни его из git`);
    process.exit(2);
  }
  const missing = p.ждём.filter((s) => !out.includes(s));
  const hit = status !== 0 && missing.length === 0;
  if (!hit) failed += 1;
  console.log(`${hit ? 'ok  ' : 'ŹLE '} ${p.имя.padEnd(48)} exit=${status}  отказ несёт ${p.ждём.map((s) => `«${s}»`).join(', ')}  — ${p.судья}`);
  if (!hit) {
    console.log(`     не найдено: ${missing.join(' | ') || '—'}; хвост вывода:`);
    for (const l of out.trim().split('\n').slice(-12)) console.log(`     ${l}`);
  }
}

console.log(`\n${probes.length - failed}/${probes.length} проб содержания — судьи отказывают с именем; образец восстановлен`);
if (failed) process.exit(1);
