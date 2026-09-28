// CL2-P-5: «страницы без X-Robots-Tag noindex» ищет в заголовке только слова noindex|none. Не видит:
//   • X-Robots-Tag: unavailable_after: <прошедшая дата> — Google перестаёт показывать страницу после даты
//     (правило индексации, как noindex, только с датой);
//   • тот же запрет в HTML: <meta name="robots" content="noindex"> или <meta name="googlebot" content="none">.
// robots.txt обещает: «Every page is open to indexing».
//   node p5-noindex.mjs
import { progon, zamenit, sZag, B, STRANICY, stroka, vyvesti } from './obshchee.mjs';

const vyvod = [];
const log = (...a) => vyvod.push(a.join(' '));
const IMYA = 'страницы без X-Robots-Tag noindex';
const vsem = (f) => (k) => { for (const p of STRANICY) zamenit(k, `${B}${p.url}`, f); };
const OBRAZCY = [
  ['X-Robots-Tag: unavailable_after: 2020-01-01 на всех страницах', vsem((o) => sZag(o, { 'x-robots-tag': 'unavailable_after: 2020-01-01' }))],
  ['X-Robots-Tag: googlebot: unavailable_after: 1 Jan 2021 00:00:00 GMT', vsem((o) => sZag(o, { 'x-robots-tag': 'googlebot: unavailable_after: 1 Jan 2021 00:00:00 GMT' }))],
  ['<meta name="robots" content="noindex"> в <head> всех страниц', vsem((o) => ({ ...o, telo: o.telo.replace('</head>', '<meta name="robots" content="noindex"></head>') }))],
  ['<meta name="googlebot" content="none"> в <head> всех страниц', vsem((o) => ({ ...o, telo: o.telo.replace('</head>', '<meta name="googlebot" content="none"></head>') }))],
];
for (const [imya, f] of OBRAZCY) {
  const r = await progon(f);
  log(`${imya}: ${r.itog}; ${stroka(r.najti(IMYA))}`);
}
const kontrol = await progon(vsem((o) => sZag(o, { 'x-robots-tag': 'noindex' })));
log(`контроль (X-Robots-Tag: noindex): ${kontrol.itog}; ${stroka(kontrol.najti(IMYA)).slice(0, 120)}…`);
vyvesti('p5-noindex', vyvod);
