// Пробы ветвей пачки 2 — `hero-key-art` и `byline` (прежние — `proby-p2.mjs` в папке доклада
// пачки 2, R1–R24, правили файлы сайта на месте) — на копии сайта (П102 блок В). Все отрицательные:
// ненулевой код и свои строки в выводе. Сверка `dist/` пачки 2 (герой, подпись, ряды, нота) —
// теперь сторож сборки `tools/sverka.mjs`, её пробы — `sverka.test.mjs`. R16 и R17 правят настоящие
// `blocks[]` страниц (роль у вхождения героя; подпись перед героем), а не заменяют их целиком.
//   npm run proverki
import { test } from 'node:test';
import { parse as yamlParse } from 'yaml';
import { proba, pravit, struktura, bloki } from './proba.mjs';
import { prochest } from '../kopiya.mjs';

const STEND = 'src/content/tresc/404.md';
const MP3 = 'src/content/tresc/max-payne-3.md';
const MP2 = 'src/content/tresc/max-payne-2.md';
const MP3_NE = 'max-payne-3.md data does not match collection schema';
const MP2_NE = 'max-payne-2.md data does not match collection schema';
const PRIMARY = '  href: "#where-to-play"\n  label: Where to play it today\nsecondary:';
const SECONDARY = '  href: /max-payne-3/guide/\n  label: The walkthrough\n';
const primary = (href) => (k) => pravit(k, MP3, PRIMARY, `  href: ${href}\n  label: Where to play it today\nsecondary:`);
// Дата подписи /max-payne-2/ меняется по замыслу: пробы берут её из файла копии, а не литералом (раунд 2 блока В, V2-11).
const bylineMp2 = (k) => yamlParse(prochest(k, MP2).match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]).byline;
const BYLINE = (k) => {
  const b = bylineMp2(k);
  return `  date: '${b.date}'\n  dateLabel: ${b.dateLabel}\n`;
};
const byline = (date, label) => (k) => pravit(k, MP2, BYLINE(k), `  date: '${date}'\n  dateLabel: ${label}\n`);

const PROBY = [
  ['R1', 'поле героя lead в содержании, а hero-key-art у страницы нет', (k) => pravit(k, STEND, 'related:\n', 'lead: Proba lead.\nrelated:\n'), ['Поле без блока', '`lead`', '`hero-key-art`']],
  ['R2', 'hero-key-art объявлен, в содержании нет art', (k) => pravit(k, MP3, 'art: mp3-art\n', ''), ['Блок hero-key-art объявлен на /max-payne-3/', 'нет: `art`.']],
  ['R3', 'hero-key-art объявлен, полей героя нет вовсе', (k) => struktura(k, { '/404/': (p) => { p.blocks = bloki('hero-key-art', 'story-row', 'link-list'); } }), ['Блок hero-key-art объявлен на /404/', 'нет: `lead`, `primary`, `secondary`, `art`.']],
  ['R4', 'ключ арта героя неизвестен — разрешатель kadr()', (k) => pravit(k, MP3, 'art: mp3-art\n', 'art: mp9-art\n'), ['Кадр "mp9-art"']],
  ['R5', 'ключ арта героя не kebab — схема', (k) => pravit(k, MP3, 'art: mp3-art\n', 'art: Mp3_Art\n'), [MP3_NE, 'art: Invalid string']],
  ['R6', 'кнопка героя «//host/» — схема', primary('//evil.example/x'), [MP3_NE, 'primary.href']],
  ['R7', 'кнопка героя «/\\host/» — схема', primary('/\\evil.example/'), [MP3_NE, 'primary.href']],
  ['R8', 'кнопка героя на внешний https — схема', primary('https://evil.example/'), [MP3_NE, 'primary.href']],
  ['R9', 'кнопка героя — якорь не kebab — схема', primary('"#Where-To-Play"'), [MP3_NE, 'primary.href']],
  ['R10', 'кнопка героя — якорь на раздел, которого нет — сторож anchors', primary('"#no-such-row"'), ['Kotwice bez celu', '/max-payne-3/', 'no-such-row']],
  ['R11', 'поле byline в содержании, а блока byline у страницы нет', (k) => pravit(k, MP3, 'rows:\n', "byline:\n  author: Proba\n  date: '2026-09-26'\n  dateLabel: September 26, 2026\nrows:\n"), ['Поле без блока', '`byline`']],
  ['R12', 'byline объявлен, поля byline нет', (k) => pravit(k, MP2, 'byline:\n  role: Written by\n  author: 7th Serpent\n' + BYLINE(k), ''), ['blocks[] и печать разошлись', 'без содержания: byline (нет поля byline в содержании)']],
  ['R13', 'дата подписи не календарная — схема', byline('2026-02-31', 'February 31, 2026'), [MP2_NE, 'byline.date', 'не календарная дата']],
  ['R14', 'лишний ключ в byline — .strict()', (k) => pravit(k, MP2, '  author: 7th Serpent\n', '  author: 7th Serpent\n  lishnee: Proba\n'), [MP2_NE, 'Unrecognized key: "lishnee"']],
  ['R15', 'пустой автор подписи — tekst() схемы', (k) => pravit(k, MP2, '  author: 7th Serpent\n', "  author: '  '\n"), [MP2_NE, 'byline.author: Too small']],
  [
    'R16',
    'вхождение hero-key-art с ролью — ROLE_UMIE',
    (k) =>
      struktura(k, {
        '/max-payne-3/': (p) => {
          const b = p.blocks.find((x) => x.block === 'hero-key-art');
          if (!b) throw new Error('проба: у /max-payne-3/ нет hero-key-art');
          b.role = 'proba';
        },
      }),
    ['Вхождение блока с ролью', 'hero-key-art#proba'],
  ],
  [
    'R17',
    'порядок: byline перед hero-key-art в blocks[]',
    (k) =>
      struktura(k, {
        '/max-payne-2/': (p) => {
          const i = p.blocks.findIndex((x) => x.block === 'hero-key-art');
          const j = p.blocks.findIndex((x) => x.block === 'byline');
          if (i < 0 || j < 0 || j < i) throw new Error('проба: у /max-payne-2/ нет hero-key-art перед byline');
          [p.blocks[i], p.blocks[j]] = [p.blocks[j], p.blocks[i]];
        },
      }),
    ['blocks[] и печать разошлись', 'разошёлся только порядок'],
  ],
  ['R18', 'artCaption на странице без героя — поле без блока', (k) => pravit(k, STEND, 'related:\n', 'artCaption: Proba\nrelated:\n'), ['Поле без блока', '`artCaption`', '`hero-key-art`']],
  ['R19', 'artFocus вне 0–100 % — схема', (k) => pravit(k, MP3, 'artFocus: 60% 50%\n', 'artFocus: 120% 50%\n'), [MP3_NE, 'artFocus: Invalid string']],
  ['R20', 'контурная кнопка «//host/» — схема', (k) => pravit(k, MP3, SECONDARY, '  href: //evil.example/x\n  label: The walkthrough\n'), [MP3_NE, 'secondary.href']],
  ['R21', 'кнопка героя — якорь на другой странице — схема', primary('/max-payne-1/#where-to-play'), [MP3_NE, 'primary.href']],
  ['R22', 'дата словами — не та же дата — схема', byline('2026-09-26', 'September 25, 2026'), [MP2_NE, 'byline.dateLabel', 'не та же дата словами']],
  ['R23', 'дата подписи позже дня сборки — схема', byline('2099-01-01', 'January 1, 2099'), [MP2_NE, 'byline.date', 'дата подписи 2099-01-01 позже дня сборки']],
  ['R24', 'дата подписи раньше 2000 года — схема', byline('1999-12-31', 'December 31, 1999'), [MP2_NE, 'byline.date', 'дата подписи раньше 2000 года']],
];

for (const [id, imya, izmenit, zhdem] of PROBY) test(`${id}: ${imya}`, () => proba({ izmenit, kod: 'не 0', zhdem }));
