// CL3-P-5: строгость к блоку хостера (CL2-P-1: «любая группа блока для *, Googlebot*, Bingbot*, msnbot с непустым
// Disallow — отказ») держится, только пока у правил блока есть своя строка User-agent. Блок после нашего файла без
// User-agent продолжает нашу группу `User-agent: *` (группы — по всему файлу, как у robots.cc; CL1-P-10), а
// razobratRobots.ogranicheniya разбирает блок отдельно — правила до первого User-agent блока выброшены. Закрытые пути —
// вне путей сборки (адреса с параметрами, будущие разделы) — «поисковики не закрыты» их не видит.
import { progon, vyvesti, stroka, zamenit, nashRobots, MIMO, BEZ, CL, B } from './obshchee.mjs';
import { google } from './google.mjs';

const VNE = 'robots.txt: вне нашего файла — только блок хостера';
const POISK = 'robots.txt: поисковики не закрыты';
const BEZ_P = 'robots.txt без параметра (его берут роботы)';
const blok = (pravila) => `\n# BEGIN adm.tools Managed content\n${pravila}\n# END adm.tools Managed content\n`;
const out = [];
for (const [imya, telo] of [
  ['блок после нашего файла без User-agent: «Disallow: /*?» и «Disallow: /wp-admin/»', nashRobots + blok('Disallow: /*?\nDisallow: /wp-admin/')],
  ['контроль — те же правила со своей строкой «User-agent: *»', nashRobots + blok('User-agent: *\nDisallow: /*?\nDisallow: /wp-admin/')],
]) {
  const r = await progon((k) => {
    zamenit(k, MIMO, (o) => ({ ...o, telo }));
    zamenit(k, BEZ, (o) => ({ ...o, telo }));
  });
  out.push(`— ${imya} —`);
  out.push(`итог инструмента: ${r.itog}`);
  out.push(stroka(r.najti(VNE)));
  out.push(stroka(r.najti(POISK)));
  out.push(stroka(r.najti(BEZ_P)));
  out.push(`razobratRobots(…).ogranicheniya = ${JSON.stringify(CL.razobratRobots(telo, nashRobots).ogranicheniya)}`);
  for (const put of ['/movie/?utm_source=youtube', '/?fbclid=abc', '/wp-admin/']) out.push(`Google (robots.cc) Googlebot ${put}: ${google(telo, 'googlebot', put) ? 'открыт' : 'ЗАКРЫТ'}`);
}
vyvesti('p5-blok-bez-ua', out);
