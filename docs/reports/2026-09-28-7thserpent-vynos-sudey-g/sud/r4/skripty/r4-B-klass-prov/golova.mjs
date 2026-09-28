// B3-1, B3-3 (свои члены) и R4-B-K-6 на синтетике head.test.mjs и на настоящей /max-payne-3/guide/.
import { readFileSync } from 'node:fs';
import { sudit } from 'file:///D:/SEO/cloud/site-generator/core/gates/head.mjs';

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
  spisok([['Home', '/'], ['Page A', '/a/'], ['Page B', '/a/b/']]) +
  '</head><body>' +
  (dop.telo ?? '') +
  `<nav class="crumbs" ${dop.imyaNav ?? 'aria-label="Breadcrumbs"'}><ol><li><a class="crumbs__link" href="/">Home</a></li><li><a class="crumbs__link" href="/a/">Page A</a></li>` +
  `<li><span class="crumbs__current" aria-current="page">Page B</span></li></ol>${dop.vNav ?? ''}</nav><main><h1>x</h1></main></body></html>`;
const zam = (h, iz, na) => {
  if (!h.includes(iz)) throw new Error(`порча не применилась: ${iz}`);
  return h.replace(iz, () => na);
};
const otkazy = (html, url = '/a/b/') => sudit(url, html, struktura, ozhidanie).map((o) => `${o.vid}: ${o.chto.slice(0, 70)}`);
const B = stranicaB();
const sluchai = {
  'контроль': B,
  // B3-1, свои члены
  'B3-1: часть ярлыка текущего звена в <noscript> («Page » + <noscript>B</noscript>)': zam(B, 'aria-current="page">Page B<', 'aria-current="page">Page <noscript>B</noscript><'),
  'B3-1: цель aria-labelledby вынесена из <noscript> разборщиком (<p><noscript><p id>)': stranicaB({ imyaNav: 'aria-labelledby="im"', telo: '<p><noscript><p id="im">Crumbs</noscript></p>' }),
  'B3-1: ярлык ссылки в <noscript> внутри <b> внутри ссылки': zam(B, 'href="/a/">Page A<', 'href="/a/"><b><noscript>Page A</noscript></b><'),
  'B3-1: ярлык ссылки — ссылка, вынесенная из <noscript> (<p><noscript><p><a>…)': zam(B, '<li><a class="crumbs__link" href="/a/">Page A</a></li>', '<li><p><noscript><p><a class="crumbs__link" href="/a/">Page A</a></noscript></p></li>'),
  // B3-3, свои члены — элементы только у читателя без скриптов, состав звеньев тот же
  'B3-3: <noscript><img></noscript> после текущего звена': zam(B, '</span></li></ol>', '</span><noscript><img src="/p.gif" alt=""></noscript></li></ol>'),
  'B3-3: вынесенный <p> без ярлыков между звеньями (<li><p><noscript><p>x</noscript></p></li>)': zam(B, '<li><span class', '<li><p><noscript><p>&nbsp;</noscript></p></li><li><span class'),
  'B3-3: <noscript><style></style></noscript> внутри текущего звена': zam(B, 'aria-current="page">Page B<', 'aria-current="page">Page B<noscript><style>.x{}</style></noscript><'),
  'B3-3: <noscript> с <span> (не current) внутри ссылки': zam(B, 'href="/">Home<', 'href="/">Home<noscript><span></span></noscript><'),
  // R4-B-K-6
  'K-6: ярлык ссылки «Home» в <span hidden>': zam(B, 'href="/">Home<', 'href="/"><span hidden>Home</span><'),
  'K-6: ярлык текущего звена в <span hidden>': zam(B, 'aria-current="page">Page B<', 'aria-current="page"><span hidden>Page B</span><'),
  'K-6: ярлык ссылки в <span style="display:none">': zam(B, 'href="/">Home<', 'href="/"><span style="display:none">Home</span><'),
};
for (const [k, h] of Object.entries(sluchai)) console.log(`${k}\n   ${JSON.stringify(otkazy(h))}`);

// Настоящая страница сборки.
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const S = JSON.parse(readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/structure/structure.json', 'utf8'));
const { ozhidanie: O } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/head.mjs');
const g = readFileSync(`${DIST}/max-payne-3/guide/index.html`, 'utf8');
const m = g.match(/<a[^>]*class="crumbs__link"[^>]*>Home<\/a>/);
console.log('настоящая: ссылка Home в крошках —', m ? m[0].slice(0, 120) : 'не найдена');
const nast = (h) => sudit('/max-payne-3/guide/', h, S, O).map((o) => o.vid);
console.log('настоящая контроль:', JSON.stringify(nast(g)));
if (m) {
  console.log('настоящая K-6 hidden:', JSON.stringify(nast(g.replace(m[0], m[0].replace('>Home<', '><span hidden>Home</span><')))));
  console.log('настоящая B3-1 noscript:', JSON.stringify(nast(g.replace(m[0], m[0].replace('>Home<', '><noscript>Home</noscript><')))));
}
