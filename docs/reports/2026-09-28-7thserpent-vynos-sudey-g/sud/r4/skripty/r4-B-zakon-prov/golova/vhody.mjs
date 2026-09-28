// Входы для B3-1 (цель имени) и новые члены класса B3-3 — на нынешнем судье и мутантах.
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const zagr = async (k) => (await import(pathToFileURL(join(TUT, 'var', `head-${k}.mjs`)).href)).sudit;

const struktura = {
  site: { domain: 'https://www.example.com' },
  pages: [
    { url: '/', h1: 'Home page' },
    { url: '/a/', h1: 'Page A', parent: '/' },
    { url: '/a/b/', h1: 'Page B', parent: '/a/' },
  ],
};
const ozhidanie = { imya: 'Example', alternativnoe: 'example.com', kontekst: 'https://schema.org', bezSpiska: ['/'] };
const spisok = (zvenya) =>
  `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: zvenya.map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `https://www.example.com${u}` })) })}</script>`;
const stranicaB = (dop = {}) =>
  '<!doctype html><html><head><title>t</title><link rel="canonical" href="https://www.example.com/a/b/"><meta property="og:site_name" content="Example">' +
  (dop.golova ?? spisok([['Home', '/'], ['Page A', '/a/'], ['Page B', '/a/b/']])) +
  '</head><body>' +
  (dop.telo ?? '') +
  `<nav class="crumbs" ${dop.imyaNav ?? 'aria-label="Breadcrumbs"'}><ol><li><a class="crumbs__link" href="/">Home</a></li><li><a class="crumbs__link" href="/a/">Page A</a></li>` +
  `<li><span class="crumbs__current" aria-current="page">Page B</span></li></ol>${dop.vNav ?? ''}</nav><main><h1>x</h1></main></body></html>`;

const sluchai = {
  // R4-B-Z-1
  'цель имени: текст только в <noscript> внутри цели': stranicaB({ imyaNav: 'aria-labelledby="im"', telo: '<span id="im"><noscript>Crumbs</noscript></span>' }),
  'цель имени: текст и в цели, и в <noscript> (контроль, законно)': stranicaB({ imyaNav: 'aria-labelledby="im"', telo: '<span id="im">Crumbs<noscript><img src="/p.gif" alt=""></noscript></span>' }),
  'цель имени: часть текста в <noscript>': stranicaB({ imyaNav: 'aria-labelledby="im"', telo: '<span id="im">Bread<noscript>crumbs</noscript></span>' }),
  // B3-3 — новые члены класса (законные формы)
  'B3-3: <noscript><img> между первой и второй ссылкой': stranicaB().replace('</a></li><li><a', '</a></li><noscript><img src="/p.gif" alt=""></noscript><li><a'),
  'B3-3: <noscript><img> внутри ссылки перед ярлыком': stranicaB().replace('href="/">Home<', 'href="/"><noscript><img src="/p.gif" alt=""></noscript>Home<'),
  'B3-3: <noscript><img> внутри текущего звена': stranicaB().replace('aria-current="page">Page B<', 'aria-current="page"><noscript><img src="/p.gif" alt=""></noscript>Page B<'),
  'B3-3: <noscript><span> после текущего внутри nav': stranicaB({ vNav: '<noscript><span class="x">z</span></noscript>' }),
  'B3-3: <noscript> с двумя элементами между звеньями и текущим': stranicaB().replace('</a></li><li><span', '</a></li><noscript><img src="/a.gif" alt=""><img src="/b.gif" alt=""></noscript><li><span'),
  'B3-3 (порча): ссылка после текущего, <noscript><img> в начале': stranicaB()
    .replace('<li><a class="crumbs__link" href="/a/">Page A</a></li><li><span class="crumbs__current" aria-current="page">Page B</span></li>', '<li><span class="crumbs__current" aria-current="page">Page B</span></li><li><a class="crumbs__link" href="/a/">Page A</a></li>')
    .replace('<ol>', '<noscript><img src="/p.gif" alt=""></noscript><ol>'),
  // B3-1 — ещё члены: <noscript> с картинкой без текста в звене у обоих — законно
  'B3-1: <noscript>Home</noscript> плюс Home видимый — ярлык HomeHome у читателя без скриптов': stranicaB().replace('href="/">Home<', 'href="/">Home<noscript>Home</noscript><'),
};
const varianty = ['nyne', 'cel-tekstVsego', 'b31-celikom', 'b33-syrye', 'b33-tekushchee-syroe'];
const sud = Object.fromEntries(await Promise.all(varianty.map(async (k) => [k, await zagr(k)])));
for (const [ime, html] of Object.entries(sluchai)) {
  console.log(`— ${ime}`);
  for (const k of varianty) console.log(`   ${k}: ${JSON.stringify(sud[k]('/a/b/', html, struktura, ozhidanie).map((o) => `${o.vid}: ${o.chto.slice(0, 60)}`))}`);
}
