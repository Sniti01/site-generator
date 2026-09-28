// Настоящий судья: popover и классы скрытия у предков подписи — ловит ли (то, что мутанты klassy/popover снимают).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const S = await import(pathToFileURL(join(REPO, 'tools/sverka.mjs')).href);
const { OBYAZATELNAYA_PODPIS } = await import(pathToFileURL(join(REPO, 'gates/sverka.mjs')).href);
const V = S.vhody(REPO);
const PORCHI = [
  ['popover у section.hero', (h) => h.replace('<section class="hero"', '<section popover class="hero"')],
  ['popover у div.geroy', (h) => h.replace('<div class="geroy', '<div popover class="geroy')],
  ['класс sr-only у section.hero', (h) => h.replace('<section class="hero"', '<section class="hero sr-only"')],
  ['класс invisible у div.geroy', (h) => h.replace('<div class="geroy', '<div class="geroy invisible')],
  ['класс hidden у <main>', (h) => h.replace('<main id="content"', '<main class="hidden" id="content"')],
];
for (const url of OBYAZATELNAYA_PODPIS) {
  const page = V.struktura.pages.find((p) => p.url === url);
  const dane = V.soderzhanie.find((s) => s.dane?.url === url).dane;
  const h = readFileSync(join(REF, url.slice(1), 'index.html'), 'utf8');
  for (const [imya, f] of PORCHI) {
    const x = f(h);
    if (x === h) throw new Error(`${url} ${imya}: порча не применилась`);
    const z = S.sverkaStranicy({ page, dane, html: x, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: new Set(OBYAZATELNAYA_PODPIS) });
    console.log(`${url} ${imya}: ${z.some((y) => y.includes('скрыта предком')) ? 'ловит' : 'МОЛЧИТ'} — ${z.join(' | ').slice(0, 160)}`);
  }
}
