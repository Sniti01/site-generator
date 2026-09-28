// Пробы договора содержания — схема (`src/content.config.ts`) и маршрут (`src/pages/[...slug].astro`)
// на копии сайта (П102 блок В; прежние — `tools/proby-tresci.mjs` пачки 0, 33 пробы, правили файлы
// сайта на месте). Каждая проба — своя копия вне репозитория, правка копии, сборка копии.
// ОТРИЦАТЕЛЬНАЯ ждёт ненулевой код и все свои строки в выводе сборки; ПОЛОЖИТЕЛЬНАЯ — код 0 и свои
// проверки собранного HTML (в сборке копии работают все сторожа: голова, сверка dist, 8 слов…).
// СТЕНДЫ СНЯТЫ: N19 судил коридор на гайде, P3 — крошки третьего уровня на гайде, P4 — крошки
// второго уровня на `/story/`: пачки сделали эти страницы настоящими, и прежние пробы стали ПЛОХО
// (N19, P3) или заместителями (P4). На копии: N19 — коридор, которого `/404/` не достаёт, P3 и P4 —
// настоящие гайд и `/story/` в сборке без правок (судья головы — в сборке); P6 — своя страница
// `/proba-p6/` в структуре копии, N14 — свой блок `proba-blok` в словаре ядра копии (раунд 1 блока В, V1-11).
//   npm run proverki
import { test } from 'node:test';
import { proba, pravit, struktura, bloki, vremennyi, zvenyev } from './proba.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { zapisat, zapisatVYadro, prochest } from '../kopiya.mjs';

const STEND = 'src/content/tresc/404.md';
const VREMENNYI = 'src/content/tresc/proba-vremennyi.md';
const SKHEMA = 'src/content.config.ts';
const SKHEMA_NE = 'tresc → 404.md data does not match collection schema';
/** Стенд со вставкой строк после `url:`. */
const stendS = (k, stroki) => pravit(k, STEND, 'url: /404/\n', 'url: /404/\n' + stroki.join('\n') + '\n');
const blokiStranicy = (url, ...b) => (k) => struktura(k, { [url]: (p) => { p.blocks = bloki(...b); } });

const PROBY = [
  // — схема —
  ['N1', 'неизвестный ключ `title` в содержании', { izmenit: (k) => stendS(k, ['title: Proba']), kod: 'не 0', zhdem: [SKHEMA_NE, 'Unrecognized key: "title"'] }],
  ['N2', 'неизвестный ключ внутри ряда', { izmenit: (k) => pravit(k, STEND, '    year: Error 404\n', '    year: Error 404\n    subtitle: Proba\n'), kod: 'не 0', zhdem: [SKHEMA_NE, 'rows.0: Unrecognized key: "subtitle"'] }],
  ['N3', 'пустая роль ряда', { izmenit: (k) => pravit(k, STEND, '    year: Error 404\n', "    year: Error 404\n    role: ''\n"), kod: 'не 0', zhdem: [SKHEMA_NE, 'rows.0.role: Too small'] }],
  ['N4', 'id ряда не kebab', { izmenit: (k) => pravit(k, STEND, 'id: not-found', 'id: Not Found'), kod: 'не 0', zhdem: [SKHEMA_NE, 'rows.0.id: Invalid string'] }],
  ['N5', 'адрес без слэша на конце', { izmenit: (k) => pravit(k, STEND, 'url: /404/', 'url: /404'), kod: 'не 0', zhdem: [SKHEMA_NE, 'url: Invalid string: must end with "/"'] }],
  ['N23', 'заголовок `related` пустой', { izmenit: (k) => pravit(k, STEND, '  title: Where to go from here', "  title: ''"), kod: 'не 0', zhdem: [SKHEMA_NE, 'related.title: Too small'] }],
  ['N24', 'мета ряда из одних пробелов', { izmenit: (k) => pravit(k, STEND, '    meta: A mistyped link or an address that is not on this site', "    meta: '   '"), kod: 'не 0', zhdem: [SKHEMA_NE, 'rows.0.meta: Too small'] }],
  ['N25', 'надзаголовок ряда пустой', { izmenit: (k) => pravit(k, STEND, '    year: Error 404\n', "    year: ''\n"), kod: 'не 0', zhdem: [SKHEMA_NE, 'rows.0.year: Too small'] }],
  ['N26', 'заголовок ряда из пробелов', { izmenit: (k) => pravit(k, STEND, '    title: Nothing at this address\n', "    title: '  '\n"), kod: 'не 0', zhdem: [SKHEMA_NE, 'rows.0.title: Too small'] }],
  ['N27', 'пустой абзац ряда', { izmenit: (k) => pravit(k, STEND, '    body:\n', "    body:\n      - ''\n"), kod: 'не 0', zhdem: [SKHEMA_NE, 'rows.0.body.0: Too small'] }],
  // — маршрут, по порядку проверок —
  ['N6', 'адрес мимо структуры', { izmenit: (k) => pravit(k, STEND, 'url: /404/', 'url: /nie-ma-takiej/'), kod: 'не 0', zhdem: ['Адреса /nie-ma-takiej/ нет в structure.json'] }],
  ['N7', 'два файла на один адрес', { izmenit: (k) => zapisat(k, VREMENNYI, vremennyi('/404/', ['related:', '  title: Proba'])), kod: 'не 0', zhdem: ['Два файла содержания на один адрес', '/404/: '] }],
  ['N22', '404.md и 404/index.md — один слаг, два файла', { izmenit: (k) => zapisat(k, 'src/content/tresc/404/index.md', vremennyi('/404/', ['related:', '  title: Proba'])), kod: 'не 0', zhdem: ['Два файла содержания на один адрес', '404.md', '404/index.md'] }],
  ['N8', 'файл содержания с адресом «/»', { izmenit: (k) => zapisat(k, VREMENNYI, vremennyi('/')), kod: 'не 0', zhdem: ['с адресом «/»', 'главная — свой шаблон'] }],
  ['N21', 'текст под фронтматтером файла', { izmenit: (k) => zapisat(k, STEND, prochest(k, STEND) + 'Stray paragraph under the frontmatter.\n'), kod: 'не 0', zhdem: ['Текст под фронтматтером в 404.md'] }],
  ['N9', 'вхождение блока дважды', { izmenit: blokiStranicy('/404/', 'story-row', 'story-row', 'link-list'), kod: 'не 0', zhdem: ['Вхождение блока объявлено дважды', 'story-row'] }],
  [
    'N10',
    'поле схемы без места в карте',
    {
      izmenit: (k) => {
        pravit(k, SKHEMA, '        url: z.string()', '        dopisannoe: z.string().optional(),\n        url: z.string()');
        stendS(k, ['dopisannoe: Proba']);
      },
      kod: 'не 0',
      zhdem: ['без места в карте POLE_BLOKA', '`dopisannoe`'],
    },
  ],
  ['N11', 'поле `related` без блока `link-list`', { izmenit: blokiStranicy('/404/', 'story-row'), kod: 'не 0', zhdem: ['Поле без блока', '`related`', '`link-list`'] }],
  ['N12', 'роль у блока вне ROLE_UMIE', { izmenit: blokiStranicy('/404/', 'story-row', 'link-list#proba'), kod: 'не 0', zhdem: ['Вхождение блока с ролью, которого маршрут ещё не умеет', 'link-list#proba'] }],
  ['N13', 'ряд с ролью, которой страница не объявляет', { izmenit: (k) => pravit(k, STEND, '    year: Error 404\n', '    year: Error 404\n    role: mobile\n'), kod: 'не 0', zhdem: ['Ряды без своего вхождения story-row', '«mobile»'] }],
  // Блок ядра без ветви маршрута — свой блок `proba-blok`, реализованный в словаре ядра копии: стенда нет
  // (прежде verdict-box — проба сломалась бы, когда у него появится ветвь; раунд 1 блока В, V1-11).
  [
    'N14',
    'блок ядра без ветви маршрута (свой блок в словаре ядра копии)',
    {
      sYadrom: true,
      izmenit: (k) => {
        const s = JSON.parse(readFileSync(join(k.koren, 'core/structure/blocks.json'), 'utf8'));
        s['блоки']['proba-blok'] = { уровень: 'секция', файл: 'core/blocks/ProbaBlok.astro', реализован: true, примечание: 'проба N14 — блок без ветви маршрута' };
        zapisatVYadro(k, 'structure/blocks.json', JSON.stringify(s, null, 2) + '\n');
        blokiStranicy('/404/', 'story-row', 'link-list', 'proba-blok')(k);
      },
      kod: 'не 0',
      zhdem: ['ветви маршрута для него нет', 'proba-blok'],
    },
  ],
  ['N15', 'тип страницы без приписки вида', { izmenit: (k) => struktura(k, { '/max-payne-1/': (p) => { p.type = 'proba'; } }), kod: 'не 0', zhdem: ['Тип «proba»', 'без приписки в VID'] }],
  ['N16', 'вхождение с ролью без своих рядов', { izmenit: blokiStranicy('/404/', 'story-row', 'story-row#proba', 'link-list'), kod: 'не 0', zhdem: ['blocks[] и печать разошлись', 'без содержания: story-row#proba'] }],
  ['N17', 'link-list без заголовка в содержании', { izmenit: (k) => pravit(k, STEND, 'related:\n  title: Where to go from here\n', ''), kod: 'не 0', zhdem: ['blocks[] и печать разошлись', 'без содержания: link-list (нет заголовка related в содержании)'] }],
  ['N20', 'related структуры пуст при объявленном link-list', { izmenit: (k) => struktura(k, { '/404/': (p) => { p.related = []; } }), kod: 'не 0', zhdem: ['blocks[] и печать разошлись', 'без содержания: link-list (related структуры пуст)'] }],
  ['N18', 'порядок blocks[] против порядка шаблона', { izmenit: blokiStranicy('/404/', 'link-list', 'story-row'), kod: 'не 0', zhdem: ['blocks[] и печать разошлись', 'разошёлся только порядок'] }],
  // Стенд снят: коридор, которого текст /404/ не достаёт, — приговор сторожа коридора ядра.
  ['N19', 'короткий текст на странице с коридором — приговор сторожа', { izmenit: (k) => struktura(k, { '/404/': (p) => { p.corridor = [5000, 6000]; } }), kod: 'не 0', zhdem: ['Długość poza umową', '/404/: ', 'korytarz 5000–6000 — za krótko'] }],
  // — положительные —
  [
    'P1',
    'video объявлен — громкий пропуск, страница собирается',
    {
      izmenit: blokiStranicy('/404/', 'story-row', 'video', 'link-list'),
      kod: 0,
      zhdem: ['/404/ — блоки объявлены, но в ядре не реализованы, пропуск: video'],
      html: { '/404/': (h) => (!/<video|youtube/i.test(h) ? null : 'на странице следы видео') },
    },
  ],
  [
    // Порядок вхождений (роль — первой) против порядка рядов в файле (ряд с ролью — вторым).
    'P2',
    'вхождения story-row по роли — ряды печатаются по вхождениям',
    {
      izmenit: (k) => {
        blokiStranicy('/404/', 'story-row#proba', 'story-row', 'link-list')(k);
        pravit(k, STEND, 'related:\n', '  - id: proba-rola\n    role: proba\n    year: Proba\n    title: Proba role row\n    meta: Proba meta\n    body:\n      - Proba body.\nrelated:\n');
      },
      kod: 0,
      html: {
        '/404/': (h) => {
          const a = h.indexOf('id="proba-rola"');
          const b = h.indexOf('id="not-found"');
          const c = h.indexOf('id="related-title"');
          return a > 0 && b > a && c > b ? null : `порядок: proba-rola ${a}, not-found ${b}, related-title ${c} — ждали по вхождениям`;
        },
      },
    },
  ],
  // Стенды сняты: страницы третьего и второго уровня — настоящие гайд и /story/, сборка без правок;
  // голова и крошки по договору — судья головы в сборке (падение сборки — отказ пробы).
  [
    'P3, P4',
    'страницы третьего и второго уровня: крошки и BreadcrumbList по договору (одна сборка без правок)',
    {
      kod: 0,
      html: {
        '/max-payne-3/guide/': (h) => (zvenyev(h) === 3 ? null : `звеньев BreadcrumbList ${zvenyev(h)}, ждали 3`),
        '/story/': (h) => (zvenyev(h) === 2 ? null : `звеньев BreadcrumbList ${zvenyev(h)}, ждали 2`),
      },
    },
  ],
  [
    // Пустая роль вхождения в структуре — «без роли» и для рядов (гейт структуры '' у необязательного role пропускает).
    'P5',
    'вхождение story-row с role "" в структуре — ряды без роли',
    {
      izmenit: (k) => struktura(k, { '/404/': (p) => { p.blocks = [{ block: 'story-row', source: 'manual', confidence: 'high', role: '' }, ...bloki('link-list')]; } }),
      kod: 0,
      html: { '/404/': (h) => (h.includes('id="not-found"') ? null : 'ряда not-found на странице нет') },
    },
  ],
  [
    // Страница без link-list, в чьём related — страница типа без приписки: VID не спрашивается.
    // Своя страница `/proba-p6/` в структуре копии — не плановая `/privacy/` (стенд: когда у неё появится
    // свой файл, проба упала бы на «два файла на один адрес»; раунд 1 блока В, V1-11).
    'P6',
    'related без link-list: вид связанной страницы не спрашивается',
    {
      izmenit: (k) => {
        struktura(k, {
          '/404/': (p, o) => {
            p.type = 'proba';
            o.pages.push({
              url: '/proba-p6/', type: 'legal', h1: 'Proba P6', title: 'Proba P6 — 7thserpent.com', description: 'A probe page of the route: related without a link list.',
              cluster: null, keywords: [], parent: '/', related: ['/404/'], blocks: bloki('story-row'), wave: 1, corridor: null, volume: 0,
            });
          },
        });
        zapisat(k, VREMENNYI, vremennyi('/proba-p6/'));
      },
      kod: 0,
      html: { '/proba-p6/': (h) => (h.includes('id="proba-ryad"') ? null : 'ряда proba-ryad на странице нет') },
    },
  ],
];

for (const [id, imya, p] of PROBY) test(`${id}: ${imya}`, () => proba(p));
