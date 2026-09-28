// V3-5, V3-6: «связанные» — на что указывает aria-labelledby="related-title" в браузере (первый элемент с этим id
// в документе), и что видят сверка и сторож якорей ядра (anchors.mjs, дубль id — регуляркой по id="…").
import { po, sverit } from './obshchee.mjs';
import { ocenKotwice } from 'file:///D:/SEO/cloud/site-generator/core/gates/anchors.mjs';
import { razobrat, pervyi, atr, tekstVsego } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';

const rm = po('/remake/');
const SPAN = (kav) => `<span ${kav} hidden>Sponsored links</span>`;
const PERECHEN = [
  { imya: 'id="related-title" раньше в шапке (двойные кавычки)', html: rm.html.replace('<nav class="hdr__nav"', () => SPAN('id="related-title"') + '<nav class="hdr__nav"') },
  { imya: "id='related-title' раньше в шапке (одинарные кавычки)", html: rm.html.replace('<nav class="hdr__nav"', () => SPAN("id='related-title'") + '<nav class="hdr__nav"') },
  { imya: 'ID="related-title" прописными раньше в шапке', html: rm.html.replace('<nav class="hdr__nav"', () => SPAN('ID="related-title"') + '<nav class="hdr__nav"') },
  { imya: 'id=related-title без кавычек раньше в шапке', html: rm.html.replace('<nav class="hdr__nav"', () => SPAN('id=related-title') + '<nav class="hdr__nav"') },
];
for (const c of PERECHEN) {
  if (c.html === rm.html) {
    console.log(`!! ${c.imya}: порча не применилась`);
    continue;
  }
  const doc = razobrat(c.html);
  const cel = pervyi(doc, (u) => atr(u, 'id') === 'related-title');
  const z = sverit(rm, c.html);
  const k = ocenKotwice(c.html);
  console.log(`${c.imya}\n  имя раздела у браузера (первый id): «${tekstVsego(cel).trim()}»\n  сверка: ${z.length ? 'ОТКАЗ ' + z.join(' || ') : 'МОЛЧИТ'}\n  сторож якорей: ${k.length ? 'ОТКАЗ ' + JSON.stringify(k) : 'МОЛЧИТ'}`);
}
