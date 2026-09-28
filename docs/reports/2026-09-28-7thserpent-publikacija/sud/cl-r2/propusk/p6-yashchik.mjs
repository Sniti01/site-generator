// CL2-P-6: «/privacy/: адрес ящика открытым текстом» принимает любой адрес любого домена, в том числе адрес
// первого сайта (форма /privacy/ списана с его страницы — П106; условие П43 п. 4 — «ящик существует на домене
// и его кто-то читает»), и адрес внутри HTML-комментария (читатель его не видит).
//   node p6-yashchik.mjs
import { progon, zamenit, B, YASHCHIK, stroka, vyvesti } from './obshchee.mjs';

const vyvod = [];
const log = (...a) => vyvod.push(a.join(' '));
const IMYA = '/privacy/: адрес ящика открытым текстом';
const zamena = (novoe) => (k) => zamenit(k, `${B}/privacy/`, (o) => ({ ...o, telo: o.telo.replace(`<a href="mailto:${YASHCHIK}">${YASHCHIK}</a>`, novoe) }));
const OBRAZCY = [
  ['ящик первого сайта (ac4bf-thewatch.com)', '<a href="mailto:jakub@ac4bf-thewatch.com">jakub@ac4bf-thewatch.com</a>'],
  ['ящик чужого домена с опечаткой в зоне (7thserpent.co)', '<a href="mailto:box@7thserpent.co">box@7thserpent.co</a>'],
  ['адрес только в HTML-комментарии', `<!-- <a href="mailto:${YASHCHIK}">${YASHCHIK}</a> -->`],
];
for (const [imya, novoe] of OBRAZCY) {
  const r = await progon(zamena(novoe));
  log(`${imya}: ${r.itog}; ${stroka(r.najti(IMYA))}`);
}
vyvesti('p6-yashchik', vyvod);
