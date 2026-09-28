// Судья головы и крошек ядра на синтетике (П102 блок Б): node --test core/gates/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sudit, suditNabor, cepochka } from './head.mjs';

const struktura = {
  site: { domain: 'https://www.example.com' },
  pages: [
    { url: '/', h1: 'Home page' },
    { url: '/a/', h1: 'Page A', parent: '/' },
    { url: '/a/b/', h1: 'Page B', parent: '/a/' },
  ],
};
const ozhidanie = { imya: 'Example', alternativnoe: 'example.com', kontekst: 'https://schema.org', bezSpiska: ['/'] };
const glavnaya =
  '<!doctype html><html><head><title>t</title><link rel="canonical" href="https://www.example.com/"><meta property="og:site_name" content="Example">' +
  '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Example","alternateName":"example.com","url":"https://www.example.com/"}</script></head><body><main><h1>x</h1></main></body></html>';
const spisok = (zvenya) =>
  `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: zvenya.map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `https://www.example.com${u}` })) })}</script>`;
const stranicaB = (dop = {}) =>
  '<!doctype html><html><head><title>t</title><link rel="canonical" href="https://www.example.com/a/b/"><meta property="og:site_name" content="Example">' +
  (dop.golova ?? spisok([['Home', '/'], ['Page A', '/a/'], ['Page B', '/a/b/']])) +
  '</head><body>' +
  (dop.telo ?? '') +
  `<nav class="crumbs" ${dop.imyaNav ?? 'aria-label="Breadcrumbs"'}><ol><li><a class="crumbs__link" href="/">Home</a></li><li><a class="crumbs__link" href="/a/">Page A</a></li>` +
  `<li><span class="crumbs__current" aria-current="page">Page B</span></li></ol>${dop.vNav ?? ''}</nav><main><h1>x</h1></main></body></html>`;
const vidy = (url, html) => [...new Set(sudit(url, html, struktura, ozhidanie).map((o) => o.vid))].sort();

test('чистые главная и третий уровень — сверено', () => {
  assert.deepEqual(suditNabor([{ url: '/', html: glavnaya }, { url: '/a/b/', html: stranicaB() }], struktura, ozhidanie), []);
});

test('цепочка по parent; цикл — ошибка', () => {
  assert.deepEqual(cepochka(struktura, '/a/b/').map((z) => z.label), ['Home', 'Page A', 'Page B']);
  assert.throws(() => cepochka({ pages: [{ url: '/x/', parent: '/y/' }, { url: '/y/', parent: '/x/' }] }, '/x/'), /цикл/);
});

test('canonical, og:site_name, WebSite: подмены — свои виды отказа', () => {
  assert.deepEqual(vidy('/', glavnaya.replace('content="Example"', 'content="Other"')), ['og:site_name']);
  assert.deepEqual(vidy('/', glavnaya.replace('"name":"Example"', '"name":"Other"')), ['WebSite']);
  assert.deepEqual(vidy('/a/b/', stranicaB().replace('href="https://www.example.com/a/b/"', 'href="https://www.example.com/"')), ['canonical']);
});

test('разметка головы в noscript тела — отказ «noscript»', () => {
  assert.deepEqual(vidy('/a/b/', stranicaB({ telo: '<noscript><meta property="og:site_name" content="Example"></noscript>' })), ['noscript', 'og:site_name']);
});

test('BreadcrumbList: звенья по договору; перестановка — отказ', () => {
  assert.deepEqual(vidy('/a/b/', stranicaB({ golova: spisok([['Home', '/'], ['Page B', '/a/b/'], ['Page A', '/a/']]) })), ['BreadcrumbList']);
});

test('имя крошек: aria-labelledby на элемент с текстом — законно; висячий или пустой — отказ; вложенная nav — отказ', () => {
  assert.deepEqual(vidy('/a/b/', stranicaB({ imyaNav: 'aria-labelledby="im"', telo: '<span id="im" hidden>Crumbs</span>' })), []);
  assert.deepEqual(vidy('/a/b/', stranicaB({ imyaNav: 'aria-labelledby="net"' })), ['крошки']);
  assert.deepEqual(vidy('/a/b/', stranicaB({ imyaNav: 'aria-labelledby="pusto"', telo: '<span id="pusto"></span>' })), ['крошки']);
  assert.deepEqual(vidy('/a/b/', stranicaB({ vNav: '<nav>x</nav>' })), ['крошки']);
});

test('страница вне структуры; пустая сборка; сборка без главной', () => {
  assert.deepEqual(vidy('/net/', stranicaB()), ['вне структуры']);
  assert.equal(suditNabor([], struktura, ozhidanie)[0].vid, 'пусто');
  assert.ok(suditNabor([{ url: '/a/b/', html: stranicaB() }], struktura, ozhidanie).some((o) => o.vid === 'главной нет'));
});
