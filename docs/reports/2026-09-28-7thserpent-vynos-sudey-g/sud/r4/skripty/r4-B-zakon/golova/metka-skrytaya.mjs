// Раунд 4, блок Б: шапка exceptions.mjs после B3-2 — что засчитывается из скрытой метки ряда.
// Метка с атрибутом hidden / display:none — метка (засчитывается), метка и её текст в <noscript> — нет.
// node metka-skrytaya.mjs
import { ryadStroki } from 'file:///D:/SEO/cloud/site-generator/core/gates/exceptions.mjs';
import { razobrat, elementy, imya } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';

const sluchai = {
  'метка видимая': '<p class="t-label">Game · 2001</p>',
  'метка hidden': '<p class="t-label" hidden>Game · 2001</p>',
  'метка style="display:none"': '<p class="t-label" style="display:none">Game · 2001</p>',
  'метка в <noscript> (B2-11)': '<noscript><p class="t-label">Game · 2001</p></noscript>',
  'текст метки в <noscript> (B3-2)': '<p class="t-label"><noscript>Game · 2001</noscript></p>',
};
for (const [k, metka] of Object.entries(sluchai)) {
  const doc = razobrat(`<!doctype html><html><body><main><section class="layer" id="r3">${metka}<p id="s">Replika</p></section></main></body></html>`);
  const p = elementy(doc).find((u) => imya(u) === 'p' && u.attrs.some((a) => a.name === 'id' && a.value === 's'));
  const r = ryadStroki({ uzel: p.childNodes[0] }, doc);
  console.log(`${k}: метка «${r.metka}»`);
}
