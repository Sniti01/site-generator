// CL2-P-1: «robots.txt: поисковики не закрыты» судит 2 бота × 4 пути-образца (/, страница игры, /privacy/, /_astro/).
// Блок хостера (adm.tools) терпится целиком, а закрыть он может любую другую страницу карты, CSS и картинки /_astro/,
// Googlebot-Image. Прежняя редакция (45052d0) ловила любое Disallow блока для * / googlebot* / bingbot* — правка
// раунда 1 сузила класс. Сверка — моделью разборщика Google (obshchee.mjs, перенос robots.cc).
//   node p1-puti.mjs
import { progon, prezhniy, zamenit, MIMO, BEZ, HOSTER, nashRobots, igra, google, googleVerdikt, stroka, CL, vyvesti } from './obshchee.mjs';

const vyvod = [];
const log = (...a) => vyvod.push(a.join(' '));

// 0. Модель Google сверена с утверждениями проб инструмента (tools/testy/check-live.test.mjs, «по правилам Google»).
const sverka = [
  [nashRobots, '/', true],
  ['User-agent: *\nDisallow: /\nAllow: /\n', '/', true],
  ['User-agent: *\nDisallow: /\n', '/', false],
  ['User-agent: *\nAllow: /\nDisallow: /*$\n', '/x/', false],
  ['Disallow: /\nUser-agent: *\nAllow: /\n', '/', true],
];
log('модель Google = пробы инструмента:', sverka.every(([t, p, zh]) => google(t, 'googlebot', p) === zh) ? 'да' : 'НЕТ');

const OBRAZCY = [
  ['a) блок хостера закрывает две страницы карты', 'User-agent: *\nDisallow: /movie/\nDisallow: /cheats/\n', ['/movie/', '/cheats/']],
  ['b) блок хостера закрывает CSS (Google рисует страницу без вёрстки)', 'User-agent: *\nDisallow: /*.css$\n', ['/_astro/index.DyC2kF5m.css']],
  ['c) блок хостера закрывает Googlebot-Image (картинки /_astro/)', 'User-agent: Googlebot-Image\nDisallow: /\n', ['/_astro/mp1-k09.BvX1.webp']],
];
const stary = await prezhniy();
for (const [imya, gruppa, puti] of OBRAZCY) {
  const blok = HOSTER.replace('# END adm.tools', gruppa + '# END adm.tools');
  const telo = blok + nashRobots;
  const r = await progon((k) => {
    zamenit(k, MIMO, (o) => ({ ...o, telo }));
    zamenit(k, BEZ, (o) => ({ ...o, telo }));
  });
  log(`\n${imya}\n  блок: ${JSON.stringify(gruppa)}`);
  log(`  инструмент 816ba46: ${r.itog}; ${stroka(r.najti('robots.txt: поисковики не закрыты'))}`);
  log(`  ${stroka(r.najti('robots.txt: вне нашего файла — только блок хостера'))}`);
  log(`  ${stroka(r.najti('robots.txt без параметра (его берут роботы)'))}`);
  log(`  модель Google: ${googleVerdikt(telo, 'googlebot', puti)}; ${googleVerdikt(telo, 'bingbot', puti)}${gruppa.includes('Image') ? `; ${googleVerdikt(telo, 'googlebot-image', puti)}` : ''}`);
  log(`  инструмент zakrytoPoiskovikam(те же пути): ${JSON.stringify(CL.zakrytoPoiskovikam(telo, puti))}`);
  const s = await progon((k) => {
    zamenit(k, MIMO, (o) => ({ ...o, telo }));
    zamenit(k, BEZ, (o) => ({ ...o, telo }));
  }, stary);
  const star = s.proverki.filter((c) => /robots/i.test(c.imya) && !c.ok);
  log(`  прежняя редакция 45052d0: ${s.itog}; красные robots: ${star.map((c) => `«${c.imya}» — ${c.fakt} — ${c.otkuda}`).join(' | ') || 'нет'}`);
}
log(`\nстраница игры в PUTI: ${igra}; пути-образцы инструмента: /, ${igra}, /privacy/, /_astro/`);
vyvesti('p1-puti', vyvod);
