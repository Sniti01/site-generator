// V3-7: встречная проверка «каждый *.html сборки — страница файла содержания». Копия сборки без _astro — в своей папке;
// в неё кладётся страница с другим расширением, которое статический хостинг отдаёт как text/html.
import { cpSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { sverkaSborki, SAYT } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
import { DIST, OBYAZATELNA } from './obshchee.mjs';

const KOPIYA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-V-klass/dist-kopiya';
rmSync(KOPIYA, { recursive: true, force: true });
cpSync(DIST, KOPIYA, { recursive: true, filter: (p) => !/[\\/]_astro([\\/]|$)/.test(p.slice(DIST.length)) });
const chuzhaya = readFileSync(join(DIST, 'remake/index.html'), 'utf8');
const zamechaniya = () => sverkaSborki(KOPIYA, SAYT, { obyazatelnaPodpis: OBYAZATELNA }).zamechaniya;
console.log('контроль, копия как есть:', JSON.stringify(zamechaniya()));
for (const [put, opis] of [
  ['remake-old.htm', '.htm в корне'],
  ['staroe/index.htm', 'index.htm папки (хостинг отдаёт /staroe/ по index.htm не везде, по адресу файла — везде)'],
  ['remake-old.xhtml', '.xhtml в корне'],
  ['kontrol-404.html', 'контроль: .html (ждём замечание)'],
]) {
  mkdirSync(join(KOPIYA, put, '..'), { recursive: true });
  writeFileSync(join(KOPIYA, put), chuzhaya);
  const z = zamechaniya().filter((x) => x.url.includes(put.split('/').at(-1).split('.')[0]) || x.url.includes(put));
  console.log(`${opis}: ${z.length ? 'ОТКАЗ ' + JSON.stringify(z) : 'МОЛЧИТ'}`);
  rmSync(join(KOPIYA, put), { force: true });
}
rmSync(KOPIYA, { recursive: true, force: true });
