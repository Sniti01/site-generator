// Раунд 4, блок Б, линза «класс или случай»: судья исключений (B3-2, и B2-11 того же класса) на /quotes/ сборки.
import { readFileSync } from 'node:fs';
import { sudStranicy } from 'file:///D:/SEO/cloud/site-generator/core/gates/phrases.mjs';
import { ukazatelKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';
import { razobrat, elementy, imya, klassy, predki, atr } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';
import { dannye, IMENA } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/phrases.mjs';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-B-klass';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const uk = ukazatelKorpusa('D:/SEO/cloud/site-generator/sites/7thserpent.com/input/corpus', { imena: IMENA, kesh: `${PAPKA}/kesh` });
const html = readFileSync(`${DIST}/quotes/index.html`, 'utf8');
const METKA = '<p class="t-label" data-astro-cid-n67f4zmd>Max Payne 3 · 2012</p>';
const zam = (na) => {
  if (!html.includes(METKA)) throw new Error('порча не применилась');
  return html.replace(METKA, () => na);
};

// Метка ряда max-payne-3 у читателя со скриптами: первый .t-label ряда в прочтении со скриптами, без <noscript>.
const metkaSoSkriptami = (h) => {
  const d = razobrat(h, { skripty: true });
  const sek = elementy(d).find((u) => imya(u) === 'section' && atr(u, 'id') === 'max-payne-3');
  const m = elementy(sek).find((u) => klassy(u).has('t-label') && !predki(u).some((p) => imya(p) === 'noscript'));
  const t = (u) => (u.childNodes ?? []).map((x) => (x.nodeName === '#text' ? x.value : x.tagName && imya(x) !== 'noscript' ? t(x) : '')).join('');
  return JSON.stringify(m ? t(m).trim() : null);
};

const sluchai = {
  'контроль: страница как есть': html,
  'B3-2 форма теста: текст метки только в <noscript> внутри .t-label': zam('<p class="t-label"><noscript>Max Payne 3 · 2012</noscript></p>'),
  'B3-2 член: текст метки в <noscript>, который разборщик без скриптов выносит из <noscript> (<p> закрывает <p>)': zam('<div class="t-label"><p><noscript><p>Max Payne 3 · 2012</noscript></p></div>'),
  'B3-2 член: то же, читатель со скриптами видит метку «Echoes»': zam('<div class="t-label"><p><noscript><p>Max Payne 3 · 2012</noscript> Echoes</p></div>'),
  'B3-2 член: то же через <li> (<li> закрывает <li>)': zam('<ul class="t-label"><li><noscript><li>Max Payne 3 · 2012</noscript></li></ul>'),
  'B2-11 член: элемент .t-label в <noscript>, вынесенный разборщиком; видимая метка — «Echoes»': zam('<div><p><noscript><p class="t-label">Max Payne 3 · 2012</noscript></p></div><p class="t-label">Echoes</p>'),
  'B2-11 член: то же через заголовок (<h2> закрывает <p>)': zam('<div><p><noscript><h2 class="t-label">Max Payne 3 · 2012</h2></noscript></p></div><p class="t-label">Echoes</p>'),
  'соседний класс (проза шапки): метка с атрибутом hidden': zam('<p class="t-label" hidden>Max Payne 3 · 2012</p>'),
};
for (const [k, h] of Object.entries(sluchai)) {
  const o = sudStranicy('/quotes/', h, uk, dannye).otkazy;
  console.log(`${k}\n   отказов ${o.length}${o.length ? ': ' + o.map((x) => x.slice(0, 110)).join(' | ') : ''}\n   метка ряда у читателя со скриптами: ${metkaSoSkriptami(h)}`);
}
