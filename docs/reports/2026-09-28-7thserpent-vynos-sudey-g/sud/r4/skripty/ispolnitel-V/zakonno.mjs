// Исполнитель блока В, раунд 4: факты законной печати всех страниц маршрута сборки 3b78f28 — что правки
// находок сделали бы замечанием.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { razobrat, elementy, pervyi, imya, atr, klassy, predki, chasti, tekstVsego } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';
import { vhody, SAYT } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';

const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const V = vhody(SAYT);
const cid = (u) => (u.attrs ?? []).filter((a) => a.name.startsWith('data-astro-cid')).map((a) => a.name).sort().join(',');
const vse = {};
const dobav = (k, v) => ((vse[k] ??= new Set()).add(v));
for (const s of [...V.soderzhanie.map((x) => x.dane.url), '/']) {
  const html = readFileSync(join(DIST, s.slice(1), 'index.html'), 'utf8');
  const doc = razobrat(html);
  const { html: H, head, body } = chasti(doc);
  const main = elementy(doc, (u) => imya(u) === 'main')[0];
  const vMain = (u) => u === main || predki(u).includes(main);
  dobav('атрибуты html', (H.attrs ?? []).map((a) => `${a.name}=${a.value}`).join(' '));
  dobav('атрибуты body', (body.attrs ?? []).map((a) => `${a.name}=${a.value}`).join(' ') || '(нет)');
  for (const u of elementy(body, (u) => !vMain(u) && atr(u, 'style') !== undefined)) {
    const svg = predki(u).find((p) => imya(p) === 'svg');
    dobav('style вне main', `${imya(u)} в ${svg ? 'svg.' + [...klassy(svg)].join('.') : '—'}: ${atr(u, 'style')}`);
  }
  dobav('style/link в body', String(elementy(body, (u) => imya(u) === 'style' || (imya(u) === 'link')).length));
  for (const u of elementy(body, (u) => imya(u) === 'script')) dobav('script в body', `${vMain(u) ? 'в main' : 'вне main'} ${(u.attrs ?? []).map((a) => `${a.name}=${a.value}`).join(' ')} текст ${tekstVsego(u).length}`);
  dobav('on* во всём документе', String(elementy(doc, (u) => (u.attrs ?? []).some((a) => /^on/i.test(a.name))).length));
  for (const u of elementy(head, (u) => ['style', 'link', 'script'].includes(imya(u)))) dobav('голова', `${imya(u)} ${(u.attrs ?? []).map((a) => `${a.name}=${a.value.slice(0, 40)}`).join(' ')}`);
  for (const id of ['page-title', 'related-title', 'gallery-title', 'cta-title']) {
    const els = elementy(doc, (u) => atr(u, 'id') === id);
    if (els.length) dobav('id ' + id, `${els.length}: ${els.map((u) => imya(u) + '.' + [...klassy(u)].join('.')).join(' ')}`);
  }
  dobav('повтор id в документе', String((() => { const c = {}; for (const u of elementy(doc, (u) => atr(u, 'id') !== undefined)) c[atr(u, 'id')] = (c[atr(u, 'id')] ?? 0) + 1; return Object.entries(c).filter(([, n]) => n > 1).map(([k]) => k).join(',') || '0'; })()));
  const hero = pervyi(main, (u) => imya(u) === 'section' && klassy(u).has('hero'));
  if (hero) {
    const h1 = pervyi(hero, (u) => imya(u) === 'h1');
    dobav('метки обёртки = h1', `${cid(hero.parentNode)} / ${cid(h1)} / ${cid(hero.parentNode) === cid(h1)}`);
    const art = pervyi(hero, (u) => klassy(u).has('hero__art'));
    const imgs = elementy(art, (u) => imya(u) === 'img');
    dobav('картинка героя', `${imgs.length} img, родитель ${imya(imgs[0].parentNode)}.${[...klassy(imgs[0].parentNode)].join('.')}, дед = art ${imgs[0].parentNode.parentNode === art}`);
    dobav('дети рамки .foto', (imgs[0].parentNode.childNodes ?? []).map((x) => x.nodeName).join(','));
    for (const k of elementy(hero, (u) => imya(u) === 'a' && klassy(u).has('btn'))) dobav('кнопка героя', `${[...klassy(k)].join('.')}: ${elementy(k).map(imya).join(',') || '(нет элементов)'}`);
  }
  for (const k of elementy(main, (u) => imya(u) === 'a' && klassy(u).has('cta__btn'))) dobav('кнопка призыва', `${atr(k, 'href')?.[0]}: ${elementy(k).map(imya).join(',')}`);
  dobav('template в документе', String(elementy(doc, (u) => imya(u) === 'template').length));
  const vneMain = (() => { let t = ''; const stek = [...body.childNodes].reverse(); while (stek.length) { const x = stek.pop(); if (x === main) continue; if (x.nodeName === '#text') t += x.value; else if (x.tagName && !['script', 'style'].includes(imya(x))) for (let i = x.childNodes.length - 1; i >= 0; i--) stek.push(x.childNodes[i]); } return t; })();
  dobav('Games/License вне main', `${s}: ${(vneMain.match(/games\s*[:：]/gi) ?? []).length}/${(vneMain.match(/license\s*class\s*[:：]/gi) ?? []).length}`);
  dobav('Games/License в main', String((tekstVsego(main).match(/games\s*[:：]|license\s*class\s*[:：]/gi) ?? []).length));
}
for (const [k, v] of Object.entries(vse)) console.log(`== ${k}\n  ${[...v].join('\n  ')}`);
