// Ложный отказ V3-3: законная иконка словаря сайта (src/data/icons.ts) с атрибутом style у элемента — Icon.astro ядра
// печатает её как есть (set:html), сверка иконки (V3-1, V3-8) печать и словарь сравнивает и находит равными, а правило
// «style у потомка героя / у прочих элементов <main>» (V3-3) роняет страницу. Зеркало входов — в своей папке.
import { readFileSync, mkdirSync, cpSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import * as tek from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';

const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-V-zakon';
const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const OB = new Set(['/remake/', '/movie/']);
const DOWN = '<path d="m6 9 6 6 6-6"/>';
const RIGHT = '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>';

const SLUCHAI = [
  ['arrow-down (главная кнопка героя /remake/)', 'arrow-down', DOWN, '<path d="m6 9 6 6 6-6" style="stroke-dasharray: 2 2"/>'],
  ['arrow-right (кнопка призыва /remake/)', 'arrow-right', RIGHT, '<path d="M4 12h15" style="stroke-dasharray: 2 2"/><path d="m13 6 6 6-6 6"/>'],
];
for (const [chto, kl, iz, na] of SLUCHAI) {
  const k = join(ZDES, 'zerkalo', 'ikona-style-' + kl);
  rmSync(k, { recursive: true, force: true });
  for (const p of ['structure/structure.json', 'src/data/game-art.json', 'src/data/icons.ts', 'src/content/tresc']) {
    mkdirSync(dirname(join(k, p)), { recursive: true });
    cpSync(join(SAYT, p), join(k, p), { recursive: true });
  }
  const f = join(k, 'src/data/icons.ts');
  const byl = readFileSync(f, 'utf8');
  const stal = byl.replace(`'${kl}': '${iz}'`, `'${kl}': '${na}'`);
  if (stal === byl) throw new Error('правка icons.ts не применилась');
  writeFileSync(f, stal);
  const V = tek.vhody(k);
  const page = V.struktura.pages.find((p) => p.url === '/remake/');
  const dane = V.soderzhanie.find((s) => s.dane?.url === '/remake/').dane;
  const h0 = readFileSync(`${DIST}/remake/index.html`, 'utf8');
  const h = h0.replaceAll(iz, na); // печать Icon.astro: разметка словаря как есть
  if (h === h0) throw new Error('порча не применилась');
  const z = tek.sverkaStranicy({ page, dane, html: h, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB });
  console.log(`${chto}\n  замечания: ${z.length ? z.join(' | ') : 'нет'}`);
}
