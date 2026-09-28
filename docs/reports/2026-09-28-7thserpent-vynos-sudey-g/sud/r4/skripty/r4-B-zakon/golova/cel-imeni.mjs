// Раунд 4, блок Б: B3-1 «текст цели имени — без <noscript>» — вход, на котором нынешний судья отказывает, а мутант
// MH-B3-1-cel-imeni (цель имени читается с содержимым <noscript>) молчит; тесты head.test.mjs мутанта не видят.
// node cel-imeni.mjs
import { sudit } from 'file:///D:/SEO/cloud/site-generator/core/gates/head.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const { sudit: suditMutant } = await import(pathToFileURL(join(ZDES, 'MH-B3-1-cel-imeni', 'head.mjs')).href);

// Та же страница, что stranicaB в head.test.mjs (структура /, /a/, /a/b/).
const struktura = {
  site: { domain: 'https://example.com' },
  pages: [
    { url: '/', h1: 'Example', parent: null },
    { url: '/a/', h1: 'Page A', parent: '/' },
    { url: '/a/b/', h1: 'Page B', parent: '/a/' },
  ],
};
const ozhidanie = { imya: 'Example', alternativnoe: 'example.com', kontekst: 'https://schema.org', bezSpiska: ['/'] };
const ld = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com/' },
    { '@type': 'ListItem', position: 2, name: 'Page A', item: 'https://example.com/a/' },
    { '@type': 'ListItem', position: 3, name: 'Page B', item: 'https://example.com/a/b/' },
  ],
});
const stranica = (telo) =>
  `<!doctype html><html><head><link rel="canonical" href="https://example.com/a/b/"><meta property="og:site_name" content="Example"><script type="application/ld+json">${ld}</script></head><body>${telo}<nav class="crumbs" aria-labelledby="im"><ol><li><a class="crumbs__link" href="/">Home</a></li><li><a class="crumbs__link" href="/a/">Page A</a></li><li><span class="crumbs__current" aria-current="page">Page B</span></li></ol></nav><main><h1>Page B</h1></main></body></html>`;

const sluchai = {
  'цель имени с текстом (контроль)': stranica('<span id="im">Crumbs</span>'),
  'текст цели имени только в <noscript> внутри цели': stranica('<span id="im"><noscript>Crumbs</noscript></span>'),
};
for (const [imya, html] of Object.entries(sluchai)) {
  const v = (f) => JSON.stringify(f('/a/b/', html, struktura, ozhidanie).map((o) => `${o.vid}: ${o.chto}`));
  console.log(`${imya}\n  нынешний: ${v(sudit)}\n  мутант:   ${v(suditMutant)}`);
}
