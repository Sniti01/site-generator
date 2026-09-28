// Пробы ветвей пачки 1 — `cta-band` и кадр ряда (прежние — `proby-p1.mjs` в папке доклада пачки 1,
// Q1–Q9, правили файлы сайта на месте) — на копии сайта (П102 блок В). Сверка `dist/` пачки 1
// (призыв, кадры рядов, нота) — теперь сторож сборки `tools/sverka.mjs`, её пробы — `sverka.test.mjs`.
// Q8 и Q9 были ожидаемыми ПЛОХО: заменяли `blocks[]` `/pc/` целиком, и когда `/pc/` получила героя,
// проба падала на «поле без блока», а не своей проверкой. Здесь они правят настоящие `blocks[]`
// страницы: роль у вхождения `cta-band` (Q8), `cta-band` перед `link-list` (Q9).
//   npm run proverki
import { test } from 'node:test';
import { proba, pravit, struktura, bloki } from './proba.mjs';

const STEND = 'src/content/tresc/404.md';
const PC = 'src/content/tresc/pc.md';
const MEDIA = 'src/content/tresc/media.md';

const PROBY = [
  ['Q1', 'поле cta в содержании, а блока cta-band у страницы нет', { izmenit: (k) => pravit(k, STEND, 'related:\n', 'cta:\n  title: Proba\n  lead: Proba lead.\n  href: /\n  label: Proba\nrelated:\n'), zhdem: ['Поле без блока', '`cta`', '`cta-band`'] }],
  ['Q2', 'cta-band объявлен, поля cta в содержании нет', { izmenit: (k) => struktura(k, { '/404/': (p) => { p.blocks = bloki('story-row', 'link-list', 'cta-band'); } }), zhdem: ['blocks[] и печать разошлись', 'без содержания: cta-band (нет поля cta в содержании)'] }],
  ['Q3', 'href призыва «/\\host/» — схема', { izmenit: (k) => pravit(k, PC, '  href: /mods/\n', '  href: /\\evil.example/\n'), zhdem: ['pc.md data does not match collection schema', 'cta.href'] }],
  ['Q4', 'href призыва «//host/» — схема', { izmenit: (k) => pravit(k, PC, '  href: /mods/\n', '  href: //evil.example/x\n'), zhdem: ['pc.md data does not match collection schema', 'cta.href'] }],
  ['Q5', 'href призыва «http://» — схема', { izmenit: (k) => pravit(k, PC, '  href: /mods/\n', '  href: http://evil.example/\n'), zhdem: ['pc.md data does not match collection schema', 'cta.href'] }],
  ['Q6', 'кадр ряда с неизвестным ключом — разрешатель kadr()', { izmenit: (k) => pravit(k, MEDIA, '    art: mp2-k01\n', '    art: mp9-k99\n'), zhdem: ['Кадр "mp9-k99"'] }],
  ['Q7', 'ключ кадра не kebab — схема', { izmenit: (k) => pravit(k, MEDIA, '    art: mp2-k01\n', '    art: Mp2_K01\n'), zhdem: ['media.md data does not match collection schema', '.art'] }],
  [
    'Q8',
    'вхождение cta-band с ролью — ROLE_UMIE',
    {
      izmenit: (k) =>
        struktura(k, {
          '/pc/': (p) => {
            const b = p.blocks.find((x) => x.block === 'cta-band');
            if (!b) throw new Error('проба: у /pc/ нет cta-band');
            b.role = 'proba';
          },
        }),
      zhdem: ['Вхождение блока с ролью', 'cta-band#proba'],
    },
  ],
  [
    'Q9',
    'порядок: cta-band перед link-list в blocks[]',
    {
      izmenit: (k) =>
        struktura(k, {
          '/pc/': (p) => {
            const i = p.blocks.findIndex((x) => x.block === 'link-list');
            const j = p.blocks.findIndex((x) => x.block === 'cta-band');
            if (i < 0 || j < 0 || j < i) throw new Error('проба: у /pc/ нет link-list перед cta-band');
            [p.blocks[i], p.blocks[j]] = [p.blocks[j], p.blocks[i]];
          },
        }),
      zhdem: ['blocks[] и печать разошлись', 'разошёлся только порядок'],
    },
  ],
];

for (const [id, imya, p] of PROBY) test(`${id}: ${imya}`, () => proba({ kod: 'не 0', ...p }));
