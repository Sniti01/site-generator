// CL3-P-3: X-Robots-Tag двумя полями. Сервер (или прокси) шлёт `X-Robots-Tag: otherbot: noarchive` и отдельным полем
// `X-Robots-Tag: noindex`. Google (developers.google.com/search/docs/crawling-indexing/robots-meta-tag): директива без
// имени бота — для всех; поля заголовка независимы. fetch склеивает поля через «, » — `otherbot: noarchive, noindex`,
// и zapretyIndeksacii переносит имя бота на `noindex` следующего поля. Прогон — через poluchitSetyu самого инструмента.
import { progon, vyvesti, stroka, B, STRANICY } from './obshchee.mjs';
import { cherezSet } from './set.mjs';

const stranicy = new Set(STRANICY.map((p) => `${B}${p.url}`));
const out = [];
for (const [imya, pary] of [
  ['два поля: «otherbot: noarchive» и «noindex»', [['x-robots-tag', 'otherbot: noarchive'], ['x-robots-tag', 'noindex']]],
  ['два поля: «GPTBot: noindex» и «none»', [['x-robots-tag', 'GPTBot: noindex'], ['x-robots-tag', 'none']]],
  ['контроль — одно поле «noindex»', [['x-robots-tag', 'noindex']]],
]) {
  let sklejka = '';
  const r = await progon(() => {}, {
    poluchitIz: (karta) => {
      const f = cherezSet((url) => (stranicy.has(url) ? { pary } : {}))(karta);
      return async (url) => {
        const o = await f(url);
        if (url === `${B}/`) sklejka = o.zagolovok('x-robots-tag');
        return o;
      };
    },
  });
  out.push(`— ${imya} на всех ${stranicy.size} страницах —`);
  out.push(`poluchitSetyu → zagolovok('x-robots-tag') = «${sklejka}»`);
  out.push(`итог инструмента: ${r.itog}`);
  out.push(stroka(r.najti('страницы без запрета индексации')));
}
vyvesti('p3-x-robots-dva-polya', out);
