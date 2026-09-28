// Законная печать всех страниц маршрута: есть ли то, что правки находок сделали бы замечанием
// (ложный отказ правки): <style>/<link rel=stylesheet> в <body>, <script> и on*-атрибуты в <main>, svg в кнопках,
// кроме иконки, повтор id related-title, «Games»/«License» вне p.ft__art-note, файлы не *.html в сборке.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { razobrat, elementy, imya, atr, klassy, chasti, tekstVsego } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';
import { V, po, DIST } from './obshchee.mjs';

for (const s of V.soderzhanie) {
  const x = po(s.dane.url);
  const doc = razobrat(x.html);
  const { body } = chasti(doc);
  const main = elementy(doc, (u) => imya(u) === 'main')[0];
  const stiliBody = elementy(body, (u) => imya(u) === 'style' || (imya(u) === 'link' && /stylesheet/i.test(atr(u, 'rel') ?? ''))).length;
  const skriptyMain = elementy(main, (u) => imya(u) === 'script' || (u.attrs ?? []).some((a) => /^on/.test(a.name))).length;
  const knopki = elementy(main, (u) => imya(u) === 'a' && (klassy(u).has('btn-secondary') || klassy(u).has('cta__btn') || klassy(u).has('btn-primary')));
  const svgVKnopkah = knopki.map((k) => `${[...klassy(k)].find((c) => c.startsWith('btn-') || c === 'cta__btn')}:${elementy(k, (u) => imya(u) === 'svg').length}`).join(' ');
  const tekstyVKnopkah = knopki.flatMap((k) => elementy(k, (u) => ['text', 'foreignobject', 'input', 'template'].includes(imya(u)))).length;
  const idRel = elementy(doc, (u) => atr(u, 'id') === 'related-title').length;
  const vneNot = elementy(body, (u) => imya(u) === 'p' && !klassy(u).has('ft__art-note') && /games\s*:|license\s*class/i.test(tekstVsego(u))).length;
  console.log(`${s.dane.url.padEnd(26)} style/link в body ${stiliBody}, script/on* в main ${skriptyMain}, svg в кнопках [${svgVKnopkah}], text/foreignObject/input/template в кнопках ${tekstyVKnopkah}, id related-title ${idRel}, Games/License вне нот ${vneNot}`);
}
const ne = [];
const obhod = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) obhod(join(d, e.name));
    else if (!/\.(html|webp|jpg|png|svg|ico|css|js|xml|avif)$/i.test(e.name)) ne.push(join(d, e.name));
  }
};
obhod(DIST);
console.log('файлы сборки с иным расширением:', JSON.stringify(ne));
