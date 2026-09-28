// Раунд 4, блок Б, линза «класс или случай»: судья головы и крошек (B3-1, B3-3) на настоящей странице сборки.
import { readFileSync } from 'node:fs';
import { sudit } from 'file:///D:/SEO/cloud/site-generator/core/gates/head.mjs';
import { razobrat, elementy, imya, klassy, tekstVsego } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';
import { ozhidanie } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/head.mjs';

const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const struktura = JSON.parse(readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/structure/structure.json', 'utf8'));
const URL = '/max-payne-3/guide/';
const html = readFileSync(`${DIST}${URL}index.html`, 'utf8');
const zam = (iz, na) => {
  if (!html.includes(iz)) throw new Error(`порча не применилась: ${iz}`);
  return html.replace(iz, () => na);
};
const HOME = '<a class="crumbs__link" href="/" data-astro-cid-woptr46g>Home</a>';
const LI2 = '<li class="crumbs__item" data-astro-cid-woptr46g><a class="crumbs__link" href="/max-payne-3/"';

// Что видит читатель со скриптами на месте ярлыка «Home» (без скрытого атрибутом hidden — это делает браузер).
const vidimoSoSkriptami = (h) => {
  const d = razobrat(h, { skripty: true });
  const a = elementy(d).find((u) => imya(u) === 'a' && klassy(u).has('crumbs__link'));
  const t = (u) => {
    let s = '';
    for (const x of u.childNodes ?? []) {
      if (x.nodeName === '#text') s += x.value;
      else if (x.tagName && !['script', 'style', 'noscript', 'template'].includes(imya(x)) && !(x.attrs ?? []).some((p) => p.name === 'hidden')) s += t(x);
    }
    return s;
  };
  return JSON.stringify(t(a));
};

const sluchai = {
  'контроль: страница как есть': html,
  'B3-1 форма теста: «Home» только в <noscript> внутри ссылки': zam(HOME, '<a class="crumbs__link" href="/" data-astro-cid-woptr46g><noscript>Home</noscript></a>'),
  'B3-1 член: <noscript>, чьё содержимое разборщик без скриптов выносит (<p> закрывает <p>)': zam(HOME, '<a class="crumbs__link" href="/" data-astro-cid-woptr46g><p><noscript><p>Home</noscript></p></a>'),
  'B3-1 член: «Home» в <noscript> теневого корня ссылки': zam(HOME, '<a class="crumbs__link" href="/" data-astro-cid-woptr46g><template shadowrootmode="open"><noscript>Home</noscript></template></a>'),
  'B3-1 соседний класс: «Home» с атрибутом hidden (не видит никто)': zam(HOME, '<a class="crumbs__link" href="/" data-astro-cid-woptr46g><span hidden>Home</span></a>'),
  'B3-3 форма теста: <noscript><img> до <ol>': zam('<ol class="crumbs__list', '<noscript><img src="/p.gif" alt=""></noscript><ol class="crumbs__list'),
  'B3-3 член: <noscript><img> между звеньями': zam(LI2, '<noscript><img src="/p.gif" alt=""></noscript>' + LI2),
  'B3-3 член: <noscript><img> внутри ссылки': zam(HOME, '<a class="crumbs__link" href="/" data-astro-cid-woptr46g>Home<noscript><img src="/p.gif" alt=""></noscript></a>'),
  'B3-3 член: <noscript> с текстом в nav вне звеньев': zam('<ol class="crumbs__list', '<noscript>Static</noscript><ol class="crumbs__list'),
};
for (const [k, h] of Object.entries(sluchai)) {
  const o = sudit(URL, h, struktura, ozhidanie);
  console.log(`${k}\n   отказы: ${JSON.stringify(o.map((x) => x.vid))}   ярлык 1-го звена у читателя со скриптами: ${vidimoSoSkriptami(h)}`);
}
