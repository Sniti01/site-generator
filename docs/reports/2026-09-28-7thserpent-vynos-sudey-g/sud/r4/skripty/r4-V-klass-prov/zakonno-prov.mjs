// Законная печать сборки 3b78f28: дали бы предложенные правки ложный отказ? Счёт по всем страницам маршрута.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { razobrat, elementy, imya, atr, klassy, predki, tekstVsego, chasti } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';
import { V, DIST } from './osnova.mjs';

const urls = V.soderzhanie.map((s) => s.dane.url);
console.log('страниц маршрута:', urls.length);
for (const url of urls) {
  const doc = razobrat(readFileSync(join(DIST, url.slice(1), 'index.html'), 'utf8'));
  const { body } = chasti(doc);
  const main = elementy(doc, (u) => imya(u) === 'main')[0];
  const vMain = elementy(main);
  const stiliBody = elementy(body, (u) => imya(u) === 'style' || (imya(u) === 'link' && /stylesheet/i.test(atr(u, 'rel') ?? ''))).length;
  const skriptMain = vMain.filter((u) => imya(u) === 'script' || (u.attrs ?? []).some((a) => /^on/i.test(a.name))).length;
  const idy = elementy(doc).map((u) => atr(u, 'id')).filter(Boolean);
  const dubli = idy.filter((x, i) => idy.indexOf(x) !== i);
  const heroH1 = elementy(doc, (u) => atr(u, 'id') === 'page-title')[0];
  const obertka = elementy(doc, (u) => imya(u) === 'div' && klassy(u).has('geroy'))[0];
  const cid = (u) => (u?.attrs ?? []).filter((a) => a.name.startsWith('data-astro-cid')).map((a) => a.name).join(',');
  const heroFoto = elementy(doc, (u) => klassy(u).has('hero__art'))[0];
  const fotoRoditel = heroFoto ? elementy(heroFoto, (u) => imya(u) === 'img').map((i) => imya(i.parentNode) + '.' + [...klassy(i.parentNode)].join('.') + (i.parentNode.parentNode === heroFoto ? '/прямо' : '/глубже')) : [];
  // «Games:» и «License class:» без учёта регистра по телу вне нот и в <main>
  const noty = new Set(elementy(doc, (u) => imya(u) === 'p' && klassy(u).has('ft__art-note')));
  const vneNot = elementy(body, (u) => !elementy(u).length && !noty.has(u) && !predki(u).some((p) => noty.has(p))).map(tekstVsego).join(' ');
  const gamesVne = (vneNot.match(/games\s*:/gi) ?? []).length + (vneNot.match(/license\s+class\s*:/gi) ?? []).length;
  const knopki = elementy(main, (u) => imya(u) === 'a' && ['btn-secondary', 'cta__btn', 'btn-primary'].some((k) => klassy(u).has(k)));
  const vKnopkah = knopki.flatMap((a) => elementy(a).map(imya)).filter((n) => !['svg', 'path', 'line', 'polyline'].includes(n));
  const svgBezIkony = knopki.map((a) => elementy(a, (u) => imya(u) === 'svg').length).join('');
  console.log(`${url.padEnd(24)} style/link в body ${stiliBody}; script/on* в main ${skriptMain}; дубли id ${dubli.length}; cid h1 ${cid(heroH1)} = обёртка ${cid(obertka)}; img героя в ${fotoRoditel.join(',')}; Games/License вне нот ${gamesVne}; в кнопках прочее [${vKnopkah.join(',')}]; svg в кнопках ${svgBezIkony}`);
}
