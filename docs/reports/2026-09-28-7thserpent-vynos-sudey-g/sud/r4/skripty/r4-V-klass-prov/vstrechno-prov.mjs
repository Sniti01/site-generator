// K-9: встречная проверка на своей копии сборки (HTML без _astro) — .htm, .xhtml, .shtml; контроль .html.
import { cpSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { sverkaSborki, SAYT } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
import { DIST, OBYAZ } from './osnova.mjs';

const KOPIYA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-V-klass-prov/kopiya-dist';
const svezhaya = () => {
  if (existsSync(KOPIYA)) rmSync(KOPIYA, { recursive: true, force: true });
  cpSync(DIST, KOPIYA, { recursive: true, filter: (p) => !/[\\/]_astro([\\/]|$)/.test(p.slice(DIST.length)) });
};
const remake = readFileSync(join(DIST, 'remake/index.html'), 'utf8');
const sluchai = [
  ['контроль, копия как есть', null],
  ['remake-old.htm в корне', 'remake-old.htm'],
  ['old/index.htm в папке', 'old/index.htm'],
  ['remake.xhtml в корне', 'remake.xhtml'],
  ['REMAKE.HTM прописными', 'REMAKE.HTM'],
  ['контроль: remake-old.html', 'remake-old.html'],
];
for (const [imya, fajl] of sluchai) {
  svezhaya();
  if (fajl) {
    mkdirSync(join(KOPIYA, 'old'), { recursive: true });
    const p = join(KOPIYA, fajl);
    writeFileSync(p, remake.replace('Max Payne 1 &amp; 2 Remake:', 'OLD Remake:'));
  }
  const z = sverkaSborki(KOPIYA, SAYT, { obyazatelnaPodpis: OBYAZ }).zamechaniya;
  console.log(`${z.length ? 'ОТКАЗ ' : 'МОЛЧИТ'} | ${imya}${z.length ? ' | ' + JSON.stringify(z).slice(0, 200) : ''}`);
}
rmSync(KOPIYA, { recursive: true, force: true });
