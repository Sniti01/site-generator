// Метка ряда (ryadStroki из репозитория) на формах: скрытая атрибутом и CSS, <noscript> в разных местах.
import { ryadStroki } from 'file:///D:/SEO/cloud/site-generator/core/gates/exceptions.mjs';
import { razobrat, elementy, atr } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';

const sluchai = {
  'метка hidden': '<p class="t-label" hidden>Game · 2001</p>',
  'метка style=display:none': '<p class="t-label" style="display:none">Game · 2001</p>',
  'метка: текст в <noscript> во вложенном span (член B3-2)': '<p class="t-label"><span><noscript>Game · 2001</noscript></span></p>',
  'метка: видимый текст и <noscript> с припиской (законно)': '<p class="t-label">Game · 2001<noscript> (без JS)</noscript></p>',
  'метка: <noscript><img> внутри (законно)': '<p class="t-label">Game<noscript><img src="/p.gif" alt="x"></noscript> · 2001</p>',
  'метка: часть текста в <noscript>': '<p class="t-label">Game<noscript> · 2001</noscript></p>',
};
for (const [ime, metka] of Object.entries(sluchai)) {
  const doc = razobrat(`<!doctype html><html><head><title>t</title></head><body><main><section class="layer" id="r1">${metka}<p id="st">Replika</p></section></main></body></html>`);
  const p = elementy(doc).find((u) => atr(u, 'id') === 'st');
  const r = ryadStroki({ uzel: p.childNodes[0] }, doc);
  console.log(`${ime}: метка «${r.metka}»`);
}
