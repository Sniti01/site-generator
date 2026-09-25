#!/usr/bin/env node
/**
 * Пробы договора содержания — схема (`src/content.config.ts`) и маршрут
 * (`src/pages/[...slug].astro`) второго сайта (пачка 0, П85: «отрицательные
 * пробы схемы и маршрута»). Форма — `sites/ac4bf-thewatch.com/tools/proby-tresci.mjs`
 * (бэклог 44 + 28, П52 п. 5): судья, которого никто не видел падающим, — обещание,
 * а не проверка.
 *
 *   node tools/proby-tresci.mjs          — все пробы; ok/ПЛОХО построчно, exit 1 при любой ПЛОХО
 *   node tools/proby-tresci.mjs N1 P3    — только названные (неизвестное имя — exit 2)
 *   … --pokazat                          — строки отказа и у прошедших проб
 *   … --vyvod <папка>                    — полный вывод каждой сборки в <папка>/<id>.log
 *
 * КАК УСТРОЕНО. Проба ПИШЕТ НА ДИСК подменённые файлы (стенд
 * `src/content/tresc/404.md`, временный файл или папку содержания,
 * `structure/structure.json`, изредка — саму схему), запускает `astro build`
 * в отдельную папку `.astro/dist-proba` (в `.gitignore`; `dist/` сайта
 * не трогается) и в `finally` возвращает исходные байты — каждый файл своей
 * записью, — удаляет созданное и сверяет sha256 каждого тронутого файла
 * с исходным. Не сошлось — стоп с кодом 2 и именем файла.
 * Сборка — только `astro build`: гейты источников (`npm run gates`) ни при чём,
 * а сторожа результата (`h1`, `anchors`, `links`, `corridor`) — интеграции
 * и работают и здесь.
 *
 * ИСХОДНИК — ТО, ЧТО В ИНДЕКСЕ GIT. На старте тронутые пробами файлы
 * обязаны совпадать с индексом (`git diff --quiet`), а временных файлов быть
 * не должно: иначе прерванный прогон (Ctrl+C посреди сборки, снятый процесс)
 * оставил бы подмену, и следующий принял бы её за исходник («судью судят»,
 * раунд 1, R1-PROBY-1). Свою правку этих файлов — `git add` до запуска.
 * Ctrl+C и SIGTERM не обрывают пробу: текущая сборка кончается, файлы
 * возвращаются, прогон выходит с кодом 130. Снятый без сигнала процесс
 * возврата не сделает — его остаток поймает сверка следующего старта.
 * Пока идут пробы, сборку, `tree:check`, `glowa` и коммиты параллельно
 * не запускать: файлы на диске на время сборки подменены.
 *
 * ОТРИЦАТЕЛЬНАЯ проба ждёт ненулевой код и все строки своей проверки в выводе;
 * ПОЛОЖИТЕЛЬНАЯ — код 0, свои строки в выводе и свои проверки собранного HTML.
 *
 * ПОЧЕМУ ПРАВИТСЯ СТРУКТУРА. Ветви маршрута, до которых стенд `/404/`
 * не дотягивается (вхождение с ролью, блок без ветви, пропуск `video`,
 * порядок, страницы второго и третьего уровня с крошками, приговор коридора),
 * достижимы только другим `blocks[]` — страницы дерева, кроме `/404/`,
 * объявляют блоки, ветвей которых у маршрута пачки 0 нет. Правка структуры
 * собирается в памяти, на время сборки пишется на диск и возвращается
 * побайтно; в коммит она не попадает.
 *
 * ЧЕГО ПРОБЫ НЕ СУДЯТ: вид страницы (это глаза владельца на стенде); сторожей
 * ядра сами по себе (их батарея — `core/accept/selftest.mjs`); отказ сторожа
 * `links` на этом сайте недостижим содержанием — адреса ссылок маршрута идут
 * из структуры через `getPage`, который бросает раньше.
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
  papka404: join(root, 'src/content/tresc/404'),
  struktura: join(root, 'structure/structure.json'),
  skhema: join(root, 'src/content.config.ts'),
};
const OTSLEZHIVAEMYE = ['src/content/tresc/404.md', 'structure/structure.json', 'src/content.config.ts'];
const sha = (b) => createHash('sha256').update(b).digest('hex');

/* — сверка старта: подмен и остатков прерванного прогона нет — */
const git = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
const diff = git(['diff', '--quiet', '--', ...OTSLEZHIVAEMYE]);
if (diff.status !== 0) {
  console.error(
    `файлы проб отличаются от индекса git: ${git(['diff', '--name-only', '--', ...OTSLEZHIVAEMYE]).stdout.trim().replace(/\n/g, ', ')}\n` +
      'это или ваша правка (git add до запуска), или остаток прерванного прогона (git diff и git checkout -- <файл>)'
  );
  process.exit(2);
}
for (const f of [P.vremenny, P.papka404]) {
  if (existsSync(f)) {
    console.error(`временный путь уже есть: ${f} — остался от прерванного прогона; уберите его и сверьте git status`);
    process.exit(2);
  }
}

const stend = readFileSync(P.stend, 'utf8');
const strukturaTekst = readFileSync(P.struktura, 'utf8');
const skhemaTekst = readFileSync(P.skhema, 'utf8');

/** Точная замена с проверкой единственного вхождения — проба не должна «промахнуться» молча. */
function zamena(tekst, iz, na) {
  const n = tekst.split(iz).length - 1;
  if (n !== 1) throw new Error(`проба: «${iz.slice(0, 50)}» встречается ${n} раз, а нужен один`);
  return tekst.replace(iz, () => na);
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

/** Звенья BreadcrumbList собранной страницы — для положительных проб крошек. */
const zvenyev = (h) => (h.match(/"@type":"ListItem"/g) ?? []).length;

/**
 * Пробы: имя, проверка, что подменить, чего ждать.
 * `fajly` — путь → текст; `papka` — создать папку `src/content/tresc/404/`
 * с файлом `index.md` (текст); `zhdem` — строки, которые обязаны быть
 * в выводе; `kod` — 'не 0' или 0; `html` — для положительных: проверки
 * собранных страниц; `glowa` — судья «головы» по сборке пробы.
 */
const PROBY = [
  // — схема (строки — сообщения zod в выводе Astro: «tresc → <файл> data does not match collection schema» и путь поля) —
  { id: 'N1', imya: 'неизвестный ключ `title` в содержании', sudya: '.strict() схемы', fajly: { [P.stend]: stendS(['title: Proba']) }, zhdem: ['tresc → 404.md data does not match collection schema', 'Unrecognized key: "title"'], kod: 'не 0' },
  { id: 'N2', imya: 'неизвестный ключ внутри ряда', sudya: '.strict() ряда', fajly: { [P.stend]: zamena(stend, '    year: Error 404\n', '    year: Error 404\n    subtitle: Proba\n') }, zhdem: ['tresc → 404.md data does not match collection schema', 'rows.0: Unrecognized key: "subtitle"'], kod: 'не 0' },
  { id: 'N3', imya: 'пустая роль ряда', sudya: 'role.min(1) схемы', fajly: { [P.stend]: zamena(stend, '    year: Error 404\n', "    year: Error 404\n    role: ''\n") }, zhdem: ['tresc → 404.md data does not match collection schema', 'rows.0.role: Too small'], kod: 'не 0' },
  { id: 'N4', imya: 'id ряда не kebab', sudya: 'regex id схемы', fajly: { [P.stend]: zamena(stend, 'id: not-found', 'id: Not Found') }, zhdem: ['tresc → 404.md data does not match collection schema', 'rows.0.id: Invalid string'], kod: 'не 0' },
  { id: 'N5', imya: 'адрес без слэша на конце', sudya: 'url.endsWith схемы', fajly: { [P.stend]: zamena(stend, 'url: /404/', 'url: /404') }, zhdem: ['tresc → 404.md data does not match collection schema', 'url: Invalid string: must end with "/"'], kod: 'не 0' },
  { id: 'N23', imya: 'заголовок `related` пустой', sudya: 'tekst() схемы', fajly: { [P.stend]: zamena(stend, '  title: Where to go from here', "  title: ''") }, zhdem: ['tresc → 404.md data does not match collection schema', 'related.title: Too small'], kod: 'не 0' },
  { id: 'N24', imya: 'мета ряда из одних пробелов', sudya: 'tekst() схемы', fajly: { [P.stend]: zamena(stend, '    meta: A mistyped link or an address that is not on this site', "    meta: '   '") }, zhdem: ['tresc → 404.md data does not match collection schema', 'rows.0.meta: Too small'], kod: 'не 0' },
  // — маршрут, по порядку проверок —
  { id: 'N6', imya: 'адрес мимо структуры', sudya: 'getPage — адрес мимо структуры', fajly: { [P.stend]: zamena(stend, 'url: /404/', 'url: /nie-ma-takiej/') }, zhdem: ['Адреса /nie-ma-takiej/ нет в structure.json'], kod: 'не 0' },
  { id: 'N7', imya: 'два файла на один адрес', sudya: 'getStaticPaths', fajly: { [P.vremenny]: vremenny('/404/', ['related:', '  title: Proba']) }, zhdem: ['Два файла содержания на один адрес', '/404/: '], kod: 'не 0' },
  { id: 'N22', imya: '404.md и 404/index.md — один слаг, два файла', sudya: 'getStaticPaths (id — путь файла)', papka: vremenny('/404/', ['related:', '  title: Proba']), zhdem: ['Два файла содержания на один адрес', '404.md', '404/index.md'], kod: 'не 0' },
  { id: 'N8', imya: 'файл содержания с адресом «/»', sudya: 'getStaticPaths', fajly: { [P.vremenny]: vremenny('/') }, zhdem: ['с адресом «/»', 'главная — свой шаблон'], kod: 'не 0' },
  { id: 'N21', imya: 'текст под фронтматтером файла', sudya: 'getStaticPaths (тело файла)', fajly: { [P.stend]: stend + 'Stray paragraph under the frontmatter.\n' }, zhdem: ['Текст под фронтматтером в 404.md'], kod: 'не 0' },
  { id: 'N9', imya: 'вхождение блока дважды', sudya: 'повтор ключа', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row', 'story-row', 'link-list'); } }) }, zhdem: ['Вхождение блока объявлено дважды', 'story-row'], kod: 'не 0' },
  { id: 'N10', imya: 'поле схемы без места в карте', sudya: 'POLE_BLOKA / POLYA_STRANITSY', fajly: { [P.skhema]: zamena(skhemaTekst, '        url: z.string()', '        dopisannoe: z.string().optional(),\n        url: z.string()'), [P.stend]: stendS(['dopisannoe: Proba']) }, zhdem: ['без места в карте POLE_BLOKA', '`dopisannoe`'], kod: 'не 0' },
  { id: 'N11', imya: 'поле `related` без блока `link-list`', sudya: 'поле без блока', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row'); } }) }, zhdem: ['Поле без блока', '`related`', '`link-list`'], kod: 'не 0' },
  { id: 'N12', imya: 'роль у блока вне ROLE_UMIE', sudya: 'ROLE_UMIE', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row', 'link-list#proba'); } }) }, zhdem: ['Вхождение блока с ролью, которого маршрут ещё не умеет', 'link-list#proba'], kod: 'не 0' },
  { id: 'N13', imya: 'ряд с ролью, которой страница не объявляет', sudya: 'ряд без вхождения', fajly: { [P.stend]: zamena(stend, '    year: Error 404\n', '    year: Error 404\n    role: mobile\n') }, zhdem: ['Ряды без своего вхождения story-row', '«mobile»'], kod: 'не 0' },
  { id: 'N14', imya: 'блок ядра без ветви маршрута (cta-band)', sudya: 'ветви нет', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row', 'link-list', 'cta-band'); } }) }, zhdem: ['ветви маршрута для него нет', 'cta-band'], kod: 'не 0' },
  { id: 'N15', imya: 'тип страницы без приписки вида', sudya: 'VID', fajly: { [P.struktura]: strukturaS({ '/max-payne-1/': (p) => { p.type = 'proba'; } }) }, zhdem: ['Тип «proba»', 'без приписки в VID'], kod: 'не 0' },
  { id: 'N16', imya: 'вхождение с ролью без своих рядов', sudya: '«blocks[] = напечатанному»', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row', 'story-row#proba', 'link-list'); } }) }, zhdem: ['blocks[] и печать разошлись', 'без содержания: story-row#proba'], kod: 'не 0' },
  { id: 'N17', imya: 'link-list без заголовка в содержании', sudya: '«blocks[] = напечатанному»', fajly: { [P.stend]: zamena(stend, 'related:\n  title: Where to go from here\n', '') }, zhdem: ['blocks[] и печать разошлись', 'без содержания: link-list\n'], kod: 'не 0' },
  { id: 'N20', imya: 'related структуры пуст при объявленном link-list', sudya: '«blocks[] = напечатанному»', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.related = []; } }) }, zhdem: ['blocks[] и печать разошлись', 'без содержания: link-list (related структуры пуст)'], kod: 'не 0' },
  { id: 'N18', imya: 'порядок blocks[] против порядка шаблона', sudya: '«blocks[] = напечатанному»', fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('link-list', 'story-row'); } }) }, zhdem: ['blocks[] и печать разошлись', 'разошёлся только порядок'], kod: 'не 0' },
  {
    id: 'N19', imya: 'короткий текст на странице с коридором — приговор сторожа', sudya: 'corridor ядра на этом сайте',
    fajly: {
      [P.struktura]: strukturaS({ '/max-payne-3/guide/': (p) => { p.blocks = bloki('story-row', 'link-list'); } }),
      [P.vremenny]: vremenny('/max-payne-3/guide/', ['related:', '  title: Proba related']),
    },
    zhdem: ['Długość poza umową', '/max-payne-3/guide/:', 'korytarz 3174–4294 — za krótko'], kod: 'не 0',
  },
  // — положительные —
  {
    id: 'P1', imya: 'video объявлен — громкий пропуск, страница собирается', sudya: 'пропуск нереализованного',
    fajly: { [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row', 'video', 'link-list'); } }) },
    zhdem: ['/404/ — блоки объявлены, но в ядре не реализованы, пропуск: video'], kod: 0,
    // Следов видео нет по построению — у маршрута нет ветви video; доказывает строка журнала.
    html: { '/404/': (h) => (!/<video|youtube/i.test(h) ? null : 'на странице следы видео') },
  },
  {
    // Порядок вхождений (роль — первой) против порядка рядов в файле (ряд с ролью —
    // вторым): печать по вхождениям ставит ряд роли первым, печать «рядами файла»
    // — вторым («судью судят», раунд 1, R1-PROBY-4).
    id: 'P2', imya: 'вхождения story-row по роли — ряды печатаются по вхождениям', sudya: 'ROLE_UMIE (story-row)',
    fajly: {
      [P.struktura]: strukturaS({ '/404/': (p) => { p.blocks = bloki('story-row#proba', 'story-row', 'link-list'); } }),
      [P.stend]: zamena(stend, 'related:\n', '  - id: proba-rola\n    role: proba\n    year: Proba\n    title: Proba role row\n    meta: Proba meta\n    body:\n      - Proba body.\nrelated:\n'),
    },
    zhdem: [], kod: 0,
    html: {
      '/404/': (h) => {
        const a = h.indexOf('id="proba-rola"');
        const b = h.indexOf('id="not-found"');
        const c = h.indexOf('id="related-title"');
        return a > 0 && b > a && c > b ? null : `порядок: proba-rola ${a}, not-found ${b}, related-title ${c} — ждали по вхождениям`;
      },
    },
  },
  {
    id: 'P3', imya: 'страница третьего уровня: крошки и BreadcrumbList по договору', sudya: 'Base.astro + tools/glowa.mjs',
    fajly: {
      [P.struktura]: strukturaS({ '/max-payne-3/guide/': (p) => { p.blocks = bloki('story-row', 'link-list'); p.corridor = null; } }),
      [P.vremenny]: vremenny('/max-payne-3/guide/', ['related:', '  title: Proba related']),
    },
    zhdem: [], kod: 0, glowa: true,
    html: { '/max-payne-3/guide/': (h) => (zvenyev(h) === 3 ? null : `звеньев BreadcrumbList ${zvenyev(h)}, ждали 3`) },
  },
  {
    id: 'P4', imya: 'страница второго уровня: крошки и BreadcrumbList по договору', sudya: 'Base.astro + tools/glowa.mjs',
    fajly: {
      [P.struktura]: strukturaS({ '/pc/': (p) => { p.blocks = bloki('story-row', 'link-list'); p.corridor = null; } }),
      [P.vremenny]: vremenny('/pc/', ['related:', '  title: Proba related']),
    },
    zhdem: [], kod: 0, glowa: true,
    html: { '/pc/': (h) => (zvenyev(h) === 2 ? null : `звеньев BreadcrumbList ${zvenyev(h)}, ждали 2`) },
  },
];

/* ------------------------------------------------------------------ */

const argi = process.argv.slice(2);
const imena = argi.filter((a) => !a.startsWith('--') && argi[argi.indexOf(a) - 1] !== '--vyvod');
const neizvestnye = imena.filter((a) => !PROBY.some((p) => p.id === a.toUpperCase()));
if (neizvestnye.length) {
  console.error(`неизвестные пробы: ${neizvestnye.join(', ')} — есть ${PROBY.map((p) => p.id).join(', ')}`);
  process.exit(2);
}
const proby = imena.length ? PROBY.filter((p) => imena.some((a) => a.toUpperCase() === p.id)) : PROBY;
if (!proby.length) {
  console.error('проб к прогону нет — «ok» о пустом наборе не выдаётся');
  process.exit(2);
}
const iskhodnye = new Map([P.stend, P.struktura, P.skhema].map((f) => [f, sha(readFileSync(f))]));

// Ctrl+C и SIGTERM — не обрыв: текущая проба доходит до возврата файлов.
let prervano = null;
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { prervano = sig; });

/** Возврат: каждый файл своей записью — сбой одной не отменяет остальные. */
function vernut() {
  const oshibki = [];
  const shag = (imya, f) => {
    try {
      f();
    } catch (e) {
      oshibki.push(`${imya}: ${e.message}`);
    }
  };
  shag(P.stend, () => writeFileSync(P.stend, stend));
  shag(P.struktura, () => writeFileSync(P.struktura, strukturaTekst));
  shag(P.skhema, () => writeFileSync(P.skhema, skhemaTekst));
  shag(P.vremenny, () => existsSync(P.vremenny) && unlinkSync(P.vremenny));
  shag(P.papka404, () => rmSync(P.papka404, { recursive: true, force: true }));
  return oshibki;
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
    for (const [f, t] of Object.entries(p.fajly ?? {})) writeFileSync(f, t);
    if (p.papka) {
      mkdirSync(P.papka404, { recursive: true });
      writeFileSync(join(P.papka404, 'index.md'), p.papka);
    }
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
    const oshibki = vernut();
    if (oshibki.length) {
      console.error(`возврат файлов не удался:\n  ${oshibki.join('\n  ')}\nверните их из git`);
      process.exit(2);
    }
  }
  for (const [f, s] of iskhodnye) {
    if (sha(readFileSync(f)) !== s) {
      console.error(`файл ${f} не восстановлен побайтово — верните его из git`);
      process.exit(2);
    }
  }
  for (const f of [P.vremenny, P.papka404]) {
    if (existsSync(f)) {
      console.error(`временный путь ${f} не удалён`);
      process.exit(2);
    }
  }

  const iVyvod = argi.indexOf('--vyvod');
  if (iVyvod >= 0 && argi[iVyvod + 1]) writeFileSync(join(argi[iVyvod + 1], `${p.id}.log`), out);
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
  console.log(`${ok ? 'ok   ' : 'ПЛОХО'} ${p.id.padEnd(4)} ${p.imya.padEnd(64)} код ${kod} — проверка: ${p.sudya}`);
  if (!ok || argi.includes('--pokazat')) {
    for (const z of zamechaniya) console.log(`      ${z}`);
    for (const l of out.trim().split('\n').filter((l) => /Error|error|Ошибк|Адрес|Поле|Вхожд|Ряды|Блок|blocks\[\]|Два файла|Тип|пропуск|Текст под|Długość|Unrecognized|Too small|Invalid/.test(l)).slice(-8)) console.log(`      | ${l.slice(0, 220)}`);
  }
  if (prervano) {
    console.error(`\nпрервано (${prervano}) после пробы ${p.id}: файлы возвращены и сверены побайтово`);
    process.exit(130);
  }
}
rmSync(join(root, OUT), { recursive: true, force: true });
console.log(`\n${proby.length - plokho}/${proby.length} проб: отрицательные отказывают своей проверкой, положительные собираются; файлы возвращены и сверены побайтово`);
if (plokho) process.exit(1);
