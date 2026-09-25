#!/usr/bin/env node
/**
 * Пробы договора содержания — схема (`src/content.config.ts`) и маршрут
 * (`src/pages/[...slug].astro`) второго сайта (пачка 0, П85: «отрицательные
 * пробы схемы и маршрута»). Форма — `sites/ac4bf-thewatch.com/tools/proby-tresci.mjs`
 * (бэклог 44 + 28, П52 п. 5): судья, которого никто не видел падающим, — обещание,
 * а не проверка.
 *
 *   node tools/proby-tresci.mjs          — все пробы; ok/ПЛОХО построчно, exit 1 при любой ПЛОХО
 *   node tools/proby-tresci.mjs N1 P3    — только названные
 *
 * КАК УСТРОЕНО. Проба подменяет файлы (стенд `src/content/tresc/404.md`,
 * временный файл содержания, `structure/structure.json`, изредка — саму
 * схему), запускает `astro build` в отдельную папку `.astro/dist-proba`
 * (в `.gitignore`; `dist/` сайта не трогается) и в `finally` возвращает
 * исходные байты, удаляет созданные файлы и сверяет sha256 каждого тронутого
 * файла с исходным. Не сошлось — стоп с кодом 2 и именем файла.
 * Сборка — только `astro build`: гейты источников (`npm run gates`) ни при чём,
 * а сторожа результата (`h1`, `anchors`, `links`, `corridor`) — интеграции
 * и работают и здесь.
 *
 * ОТРИЦАТЕЛЬНАЯ проба ждёт ненулевой код и все строки своего судьи в выводе;
 * ПОЛОЖИТЕЛЬНАЯ — код 0, свои строки в выводе и свои проверки собранного HTML.
 *
 * ПОЧЕМУ ПРАВИТСЯ СТРУКТУРА. Ветви маршрута, до которых стенд `/404/`
 * не дотягивается (вхождение с ролью, блок без ветви, пропуск `video`,
 * порядок, страница второго уровня с крошками), достижимы только другим
 * `blocks[]` — страницы дерева, кроме `/404/`, объявляют блоки, ветвей
 * которых у маршрута пачки 0 нет. Структура правится только в памяти пробы
 * и возвращается побайтно; в репозиторий правка не попадает.
 *
 * ЧЕГО ПРОБЫ НЕ СУДЯТ: вид страницы (это глаза владельца на стенде) и сторожей
 * ядра сами по себе (их батарея — `core/accept/selftest.mjs`).
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Папка сборки проб — относительным путём (так у первого сайта): `astro build`
// кладёт `.prerender` рядом и переносит ассеты `rename`, а он не умеет через границу диска.
const OUT = '.astro/dist-proba';
const P = {
  stend: join(root, 'src/content/tresc/404.md'),
  vremenny: join(root, 'src/content/tresc/proba-vremenny.md'),
  struktura: join(root, 'structure/structure.json'),
  skhema: join(root, 'src/content.config.ts'),
};
const sha = (b) => createHash('sha256').update(b).digest('hex');

const stend = readFileSync(P.stend, 'utf8');
const strukturaTekst = readFileSync(P.struktura, 'utf8');
const skhemaTekst = readFileSync(P.skhema, 'utf8');

/** Точная замена с проверкой единственного вхождения — проба не должна «промахнуться» молча. */
function zamena(tekst, iz, na) {
  const n = tekst.split(iz).length - 1;
  if (n !== 1) throw new Error(`проба: «${iz.slice(0, 50)}» встречается ${n} раз, а нужен один`);
  return tekst.replace(iz, na);
}
/** Стенд со вставкой строк после `url:`. */
const stendS = (stroki) => zamena(stend, 'url: /404/\n', 'url: /404/\n' + stroki.join('\n') + '\n');
/** Структура с правкой страницы по адресу. */
function strukturaS(pravki) {
  const o = JSON.parse(strukturaTekst);
  for (const [url, f] of Object.entries(pravki)) {
    const p = o.pages.find((x) => x.url === url);
    if (!p) throw new Error(`проба: страницы ${url} нет в структуре`);
    f(p);
  }
  return JSON.stringify(o, null, 1) + '\n';
}
const bloki = (...imena) => imena.map((b) => {
  const [block, role] = b.split('#');
  return { block, source: 'manual', confidence: 'high', ...(role ? { role } : {}) };
});

/** Минимальный файл содержания для временной страницы. */
const vremenny = (url, dop = []) =>
  ['---', `url: ${url}`, 'rows:', '  - id: proba-ryad', '    year: Proba', '    title: Proba row', '    meta: Proba meta', '    body:', '      - Proba body.', ...dop, '---', ''].join('\n');

/**
 * Пробы: имя, судья, что подменить, чего ждать.
 * `fajly` — путь → текст (null — удалить созданный файл после пробы);
 * `zhdem` — строки, которые обязаны быть в выводе; `kod` — 'не 0' или 0;
 * `html` — для положительных: проверки собранных страниц.
 */
const PROBY = [
  // — схема —
  // Строки — сообщения zod в выводе Astro («tresc → 404 data does not match collection schema» и путь поля).
  { id: 'N1', imya: 'неизвестный ключ `title` в содержании', sudya: '.strict() схемы', fajly: { [P.stend]: stendS(['title: Proba']) }, zhdem: ['tresc → 404 data does not match collection schema', 'Unrecognized key: "title"'], kod: 'не 0' },
  { id: 'N2', imya: 'неизвестный ключ внутри ряда', sudya: '.strict() ряда', fajly: { [P.stend]: zamena(stend, '    year: Error 404\n', '    year: Error 404\n    subtitle: Proba\n') }, zhdem: ['tresc → 404 data does not match collection schema', 'rows.0: Unrecognized key: "subtitle"'], kod: 'не 0' },
  { id: 'N3', imya: 'пустая роль ряда', sudya: 'role.min(1) схемы', fajly: { [P.stend]: zamena(stend, '    year: Error 404\n', "    year: Error 404\n    role: ''\n") }, zhdem: ['tresc → 404 data does not match collection schema', 'rows.0.role: Too small'], kod: 'не 0' },
  { id: 'N4', imya: 'id ряда не kebab', sudya: 'regex id схемы', fajly: { [P.stend]: zamena(stend, 'id: not-found', 'id: Not Found') }, zhdem: ['tresc → 404 data does not match collection schema', 'rows.0.id: Invalid string'], kod: 'не 0' },
  { id: 'N5', imya: 'адрес без слэша на конце', sudya: 'url.endsWith схемы', fajly: { [P.stend]: zamena(stend, 'url: /404/', 'url: /404') }, zhdem: ['tresc → 404 data does not match collection schema', 'url: Invalid string: must end with "/"'], kod: 'не 0' },
  // — маршрут, по порядку проверок —
  { id: 'N6', imya: 'адрес мимо структуры', sudya: 'getPage в getStaticPaths', fajly: { [P.stend]: zamena(stend, 'url: /404/', 'url: /nie-ma-takiej/') }, zhdem: ['Адреса /nie-ma-takiej/ нет в structure.json'], kod: 'не 0' },
  { id: 'N7', imya: 'два файла на один адрес', sudya: 'getStaticPaths', fajly: { [P.vremenny]: vremenny('/404/', ['related:', '  title: Proba']) }, zhdem: ['Два файла содержания на один адрес', '/404/'], kod: 'не 0' },
  { id: 'N8', imya: 'файл содержания с адресом «/»', sudya: 'getStaticPaths', fajly: { [P.vremenny]: vremenny('/') }, zhdem: ['с адресом «/»', 'главная — свой шаблон'], kod: 'не 0' },
  { id: 'N9', imya: 'вхождение блока дважды', sudya: 'повтор ключа', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row', 'story-row', 'link-list'); } }) }, zhdem: ['Вхождение блока объявлено дважды', 'story-row'], kod: 'не 0' },
  { id: 'N10', imya: 'поле схемы без места в карте', sudya: 'POLE_BLOKA / POLYA_STRANITSY', fajly: { [P.skhema]: zamena(skhemaTekst, '        url: z.string()', '        dopisannoe: z.string().optional(),\n        url: z.string()'), [P.stend]: stendS(['dopisannoe: Proba']) }, zhdem: ['без места в карте POLE_BLOKA', '`dopisannoe`'], kod: 'не 0' },
  { id: 'N11', imya: 'поле `related` без блока `link-list`', sudya: 'поле без блока', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row'); } }) }, zhdem: ['Поле без блока', '`related`', '`link-list`'], kod: 'не 0' },
  { id: 'N12', imya: 'роль у блока вне ROLE_UMIE', sudya: 'ROLE_UMIE', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row', 'link-list#proba'); } }) }, zhdem: ['Вхождение блока с ролью, которого маршрут ещё не умеет', 'link-list#proba'], kod: 'не 0' },
  { id: 'N13', imya: 'ряд с ролью, которой страница не объявляет', sudya: 'ряд без вхождения', fajly: { [P.stend]: zamena(stend, '    year: Error 404\n', '    year: Error 404\n    role: mobile\n') }, zhdem: ['Ряды без своего вхождения story-row', '«mobile»'], kod: 'не 0' },
  { id: 'N14', imya: 'блок ядра без ветви маршрута (cta-band)', sudya: 'ветви нет', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row', 'link-list', 'cta-band'); } }) }, zhdem: ['ветви маршрута для него нет', 'cta-band'], kod: 'не 0' },
  { id: 'N15', imya: 'тип страницы без приписки вида', sudya: 'VID', fajly: { [P.struktura]: strukturaS({ '/max-payne-1/': (p) => { p.type = 'proba'; } }) }, zhdem: ['Тип «proba»', 'без приписки в VID'], kod: 'не 0' },
  { id: 'N16', imya: 'вхождение с ролью без своих рядов', sudya: '«blocks[] = напечатанному»', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row', 'story-row#proba', 'link-list'); } }) }, zhdem: ['blocks[] и печать разошлись', 'без содержания: story-row#proba'], kod: 'не 0' },
  { id: 'N17', imya: 'link-list без заголовка в содержании', sudya: '«blocks[] = напечатанному»', fajly: { [P.stend]: zamena(stend, 'related:\n  title: Where to go from here\n', '') }, zhdem: ['blocks[] и печать разошлись', 'без содержания: link-list'], kod: 'не 0' },
  { id: 'N18', imya: 'порядок blocks[] против порядка шаблона', sudya: '«blocks[] = напечатанному»', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('link-list', 'story-row'); } }) }, zhdem: ['blocks[] и печать разошлись', 'разошёлся только порядок'], kod: 'не 0' },
  // — положительные —
  {
    id: 'P1', imya: 'video объявлен — громкий пропуск, страница собирается', sudya: 'пропуск нереализованного',
    fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row', 'video', 'link-list'); } }) },
    zhdem: ['/404/ — блоки объявлены, но в ядре не реализованы, пропуск: video'], kod: 0,
    html: { '/404/': (h) => (!/<video|youtube/i.test(h) ? null : 'на странице следы видео') },
  },
  {
    id: 'P2', imya: 'вхождения story-row по роли — ряды своих ролей, по порядку', sudya: 'ROLE_UMIE (story-row)',
    fajly: {
      [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row', 'story-row#proba', 'link-list'); } }),
      [P.stend]: zamena(stend, 'related:\n', '  - id: proba-rola\n    role: proba\n    year: Proba\n    title: Proba role row\n    meta: Proba meta\n    body:\n      - Proba body.\nrelated:\n'),
    },
    zhdem: [], kod: 0,
    html: {
      '/404/': (h) => {
        const a = h.indexOf('id="not-found"');
        const b = h.indexOf('id="proba-rola"');
        const c = h.indexOf('id="related-title"');
        return a > 0 && b > a && c > b ? null : `порядок рядов и списка: not-found ${a}, proba-rola ${b}, related-title ${c}`;
      },
    },
  },
  {
    id: 'P3', imya: 'страница второго уровня: крошки и BreadcrumbList по договору', sudya: 'Base.astro + tools/glowa.mjs',
    fajly: {
      [P.struktura]: strukturaS({ '/max-payne-3/guide/': (p) => { p.blocks = bloki('story-row', 'link-list'); p.corridor = null; } }),
      [P.vremenny]: vremenny('/max-payne-3/guide/', ['related:', '  title: Proba related']),
    },
    zhdem: [], kod: 0, glowa: true,
    html: {
      '/max-payne-3/guide/': (h) => {
        const n = (h.match(/"@type":"ListItem"/g) ?? []).length;
        return n === 3 ? null : `звеньев BreadcrumbList ${n}, ждали 3`;
      },
    },
  },
];

/* ------------------------------------------------------------------ */

const vybrany = process.argv.slice(2).filter((a) => /^[NP]\d+$/.test(a));
const proby = vybrany.length ? PROBY.filter((p) => vybrany.includes(p.id)) : PROBY;
const iskhodnye = new Map([P.stend, P.struktura, P.skhema].map((f) => [f, sha(readFileSync(f))]));
if (existsSync(P.vremenny)) {
  console.error(`временный файл уже лежит: ${P.vremenny} — остался от прерванного прогона; уберите его и сверьте git status`);
  process.exit(2);
}

mkdirSync(join(root, OUT), { recursive: true });
let plokho = 0;
for (const p of proby) {
  let out = '';
  let kod = null;
  const html = {};
  let glowa = null;
  try {
    rmSync(join(root, OUT), { recursive: true, force: true });
    for (const [f, t] of Object.entries(p.fajly)) writeFileSync(f, t);
    // `astro` — через `npm exec`: бинарник пакета не экспортируется подпутём.
    const r = spawnSync(`npm exec -- astro build --outDir ${OUT}`, {
      cwd: root,
      shell: true,
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    });
    out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
    kod = r.status;
    if (kod === 0) {
      for (const url of Object.keys(p.html ?? {})) {
        const f = join(root, OUT, url.slice(1), 'index.html');
        html[url] = existsSync(f) ? readFileSync(f, 'utf8') : null;
      }
      if (p.glowa) {
        const g = spawnSync(`node tools/glowa.mjs --dist ${OUT}`, { cwd: root, shell: true, encoding: 'utf8' });
        glowa = { kod: g.status, vyvod: `${g.stdout ?? ''}${g.stderr ?? ''}` };
      }
    }
  } finally {
    writeFileSync(P.stend, stend);
    writeFileSync(P.struktura, strukturaTekst);
    writeFileSync(P.skhema, skhemaTekst);
    if (existsSync(P.vremenny)) unlinkSync(P.vremenny);
  }
  for (const [f, s] of iskhodnye) {
    if (sha(readFileSync(f)) !== s) {
      console.error(`файл ${f} не восстановлен побайтово — верните его из git`);
      process.exit(2);
    }
  }
  if (existsSync(P.vremenny)) {
    console.error(`временный файл ${P.vremenny} не удалён`);
    process.exit(2);
  }

  const iVyvod = process.argv.indexOf('--vyvod');
  if (iVyvod > 0 && process.argv[iVyvod + 1]) writeFileSync(join(process.argv[iVyvod + 1], `${p.id}.log`), out);
  const net = p.zhdem.filter((s) => !out.includes(s));
  const zamechaniya = [];
  if (p.kod === 'не 0' && kod === 0) zamechaniya.push('сборка прошла, а ждали отказа');
  if (p.kod === 0 && kod !== 0) zamechaniya.push(`сборка упала (код ${kod}), а ждали прохода`);
  if (net.length) zamechaniya.push(`нет в выводе: ${net.map((s) => `«${s}»`).join(', ')}`);
  for (const [url, proverka] of Object.entries(p.html ?? {})) {
    if (kod !== 0) break;
    if (html[url] === null) zamechaniya.push(`${url}: страница не собрана`);
    else {
      const z = proverka(html[url]);
      if (z) zamechaniya.push(`${url}: ${z}`);
    }
  }
  if (p.glowa && kod === 0 && glowa?.kod !== 0) zamechaniya.push(`tools/glowa.mjs по сборке пробы — код ${glowa?.kod}: ${glowa?.vyvod.trim().split('\n').slice(-3).join(' | ')}`);
  const ok = zamechaniya.length === 0;
  if (!ok) plokho += 1;
  console.log(`${ok ? 'ok   ' : 'ПЛОХО'} ${p.id.padEnd(4)} ${p.imya.padEnd(62)} код ${kod} — судья: ${p.sudya}`);
  if (!ok || process.argv.includes('--pokazat')) {
    for (const z of zamechaniya) console.log(`      ${z}`);
    for (const l of out.trim().split('\n').filter((l) => /Error|error|Ошибк|Адрес|Поле|Вхожд|Ряды|Блок|blocks\[\]|Два файла|Тип|пропуск/.test(l)).slice(-8)) console.log(`      | ${l.slice(0, 220)}`);
  }
}
rmSync(join(root, OUT), { recursive: true, force: true });
console.log(`\n${proby.length - plokho}/${proby.length} проб: отрицательные отказывают с именем судьи, положительные собираются; файлы восстановлены побайтово`);
if (plokho) process.exit(1);
