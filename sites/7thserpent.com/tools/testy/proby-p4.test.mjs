// Пробы ветви `gallery` пачки 4 (прежние — `proby-p4.mjs` в папке доклада пачки 4, G1–G17, правили
// файлы сайта на месте) — на копии сайта (П102 блок В). Все отрицательные: ненулевой код и свои строки
// в выводе. Сверка `dist/` пачки 4 (галерея, нота) — теперь сторож сборки `tools/sverka.mjs`, её
// пробы — `sverka.test.mjs`.
//   npm run proverki
import { test } from 'node:test';
import { proba, pravit, struktura, bloki } from './proba.mjs';

const STEND = 'src/content/tresc/404.md';
const MP3 = 'src/content/tresc/max-payne-3.md';
const NE = '404.md data does not match collection schema';
/** Поле `gallery` для файла содержания: кадры — строки YAML списка `items`. */
const GAL = (items, dop = '') => 'gallery:\n  title: Proba gallery\n' + dop + '  items:\n' + items.join('');
const KADR = (art, caption = 'Proba caption') => `    - art: ${art}\n      caption: ${caption}\n`;
/** Стенд `/404/` с полем галереи перед `related`; `blocks` — вхождения `/404/` (без — как есть). */
const sGal = (tekst, ...blocks) => (k) => {
  pravit(k, STEND, 'related:\n', tekst + 'related:\n');
  if (blocks.length) struktura(k, { '/404/': (p) => { p.blocks = bloki(...blocks); } });
};
const S_GAL = ['story-row', 'gallery', 'link-list'];

const PROBY = [
  ['G1', 'поле gallery в содержании, а блока gallery у страницы нет', sGal(GAL([KADR('mp1-k11')])), ['Поле без блока', '`gallery`']],
  ['G2', 'gallery объявлен, поля gallery нет', (k) => struktura(k, { '/404/': (p) => { p.blocks = bloki(...S_GAL); } }), ['blocks[] и печать разошлись', 'без содержания: gallery (нет поля gallery в содержании)']],
  ['G3', 'ключ кадра галереи неизвестен — разрешатель kadr()', sGal(GAL([KADR('mp9-k99')]), ...S_GAL), ['Кадр "mp9-k99"']],
  ['G4', 'ключ кадра галереи не kebab — схема', sGal(GAL([KADR('Mp1_K11')]), ...S_GAL), [NE, 'gallery.items.0.art: Invalid string']],
  ['G5', 'подпись кадра из пробелов — tekst() схемы', sGal(GAL([KADR('mp1-k11', "'  '")]), ...S_GAL), [NE, 'gallery.items.0.caption: Too small']],
  ['G6', 'подписи кадра нет — схема', sGal(GAL(['    - art: mp1-k11\n']), ...S_GAL), [NE, 'gallery.items.0.caption']],
  ['G7', 'alt в кадре галереи — лишний ключ, .strict()', sGal(GAL([KADR('mp1-k11') + '      alt: Proba alt\n']), ...S_GAL), [NE, 'Unrecognized key: "alt"']],
  ['G8', 'пустой список кадров — схема', sGal('gallery:\n  title: Proba gallery\n  items: []\n', ...S_GAL), [NE, 'gallery.items: Too small']],
  ['G9', 'лишний ключ в gallery — .strict()', sGal(GAL([KADR('mp1-k11')], '  kolumny: 3\n'), ...S_GAL), [NE, 'Unrecognized key: "kolumny"']],
  ['G10', 'пустой заголовок галереи — tekst() схемы', sGal("gallery:\n  title: ''\n  items:\n" + KADR('mp1-k11'), ...S_GAL), [NE, 'gallery.title: Too small']],
  ['G11', 'один кадр дважды в галерее — отказ маршрута', sGal(GAL([KADR('mp1-k11'), KADR('mp1-k11', 'Proba second')]), ...S_GAL), ['Кадр галереи повторяет кадр этой страницы на /404/', 'mp1-k11']],
  [
    'G12',
    'кадр галереи = кадр ряда той же страницы — отказ маршрута',
    (k) => {
      sGal(GAL([KADR('mp1-k11')]), ...S_GAL)(k);
      pravit(k, STEND, '    year: Error 404\n', '    year: Error 404\n    art: mp1-k11\n');
    },
    ['Кадр галереи повторяет кадр этой страницы на /404/', 'mp1-k11'],
  ],
  ['G13', 'вхождение gallery с ролью — ROLE_UMIE', sGal(GAL([KADR('mp1-k11')]), 'story-row', 'gallery#proba', 'link-list'), ['Вхождение блока с ролью', 'gallery#proba']],
  ['G14', 'порядок: gallery перед story-row в blocks[]', sGal(GAL([KADR('mp1-k11')]), 'gallery', 'story-row', 'link-list'), ['blocks[] и печать разошлись', 'разошёлся только порядок']],
  ['G15', 'строка под заголовком из пробела — tekst() схемы', sGal(GAL([KADR('mp1-k11')], "  lead: ' '\n"), ...S_GAL), [NE, 'gallery.lead: Too small']],
  ['G17', 'ключа title у галереи нет — обязательность поля в схеме', sGal('gallery:\n  items:\n' + KADR('mp1-k11'), ...S_GAL), [NE, 'gallery.title']],
  [
    'G16',
    'кадр галереи = кадр героя той же страницы — отказ маршрута',
    (k) => {
      pravit(k, MP3, 'related:\n', GAL([KADR('mp3-art')]) + 'related:\n');
      struktura(k, {
        '/max-payne-3/': (p) => {
          const i = p.blocks.findIndex((b) => b.block === 'link-list');
          p.blocks.splice(i, 0, ...bloki('gallery'));
        },
      });
    },
    ['Кадр галереи повторяет кадр этой страницы на /max-payne-3/', 'mp3-art'],
  ],
];

for (const [id, imya, izmenit, zhdem] of PROBY) test(`${id}: ${imya}`, () => proba({ izmenit, kod: 'не 0', zhdem }));
