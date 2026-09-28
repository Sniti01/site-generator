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

/* — «судью судят», блок Б, раунд 1 (B1-G-*) — */

test('B1-G-1: разметка головы в <noscript> головы — отказ, и когда разборщик выносит её из <noscript>', () => {
  const ws = glavnaya.match(/<script type="application\/ld\+json">[^<]*<\/script>/)[0];
  assert.deepEqual(vidy('/', glavnaya.replace(ws, `<noscript>${ws}</noscript>`)), ['noscript']);
  const g = '<link rel="canonical" href="https://www.example.com/a/b/"><meta property="og:site_name" content="Example">';
  assert.deepEqual(vidy('/a/b/', stranicaB().replace(g, `<noscript><script></script>${g}</noscript>`)), ['noscript']);
});

test('B1-G-2: ярлык текущего звена ≠ h1 — ровно этот отказ', () => {
  const o = sudit('/a/b/', stranicaB().replace('aria-current="page">Page B<', 'aria-current="page">Page C<'), struktura, ozhidanie);
  assert.deepEqual(o.map((x) => x.chto), ['текущее звено: ярлык «Page C» ≠ «Page B»']);
});

test('B1-G-3: ссылка после текущего при верном числе ссылок — ровно этот отказ', () => {
  const html = stranicaB().replace(
    '<li><a class="crumbs__link" href="/a/">Page A</a></li><li><span class="crumbs__current" aria-current="page">Page B</span></li>',
    '<li><span class="crumbs__current" aria-current="page">Page B</span></li><li><a class="crumbs__link" href="/a/">Page A</a></li>'
  );
  assert.deepEqual(sudit('/a/b/', html, struktura, ozhidanie).map((x) => x.chto), ['после текущего звена ещё есть ссылки']);
});

test('B1-G-4: JSON-LD в <noscript> тела — «noscript» называет JSON-LD', () => {
  const o = sudit('/a/b/', stranicaB({ telo: '<noscript><script type="application/ld+json">{"@type":"Thing"}</script></noscript>' }), struktura, ozhidanie);
  assert.ok(o.some((x) => x.vid === 'noscript' && x.chto.includes('JSON-LD')), JSON.stringify(o));
});

test('B1-G-6: крошки из элементов SVG — отказ «крошки»', () => {
  const svg =
    '<svg><nav class="crumbs" aria-label="Breadcrumbs"><a class="crumbs__link" href="/">Home</a><a class="crumbs__link" href="/a/">Page A</a><foreignObject><span class="crumbs__current" aria-current="page">Page B</span></foreignObject></nav></svg>';
  assert.deepEqual(vidy('/a/b/', stranicaB().replace(/<nav class="crumbs"[\s\S]*?<\/nav>/, svg)), ['крошки']);
});

test('B1-G-7: имя крошек по id в теневом корне — висячее; крошки только в <noscript> тела — отказ', () => {
  assert.deepEqual(vidy('/a/b/', stranicaB({ imyaNav: 'aria-labelledby="im"', telo: '<div><template shadowrootmode="open"><span id="im">Crumbs</span></template></div>' })), ['крошки']);
  assert.ok(vidy('/a/b/', stranicaB().replace(/(<nav class="crumbs"[\s\S]*?<\/nav>)/, '<noscript>$1</noscript>')).includes('noscript'));
});

test.todo('B1-G-7 (предел): имя крошек только в скрытом потомке (accname его отбрасывает); теневой корень без <slot> над nav.crumbs — светлые дети не рисуются');

test('B1-G-8: U+FEFF на краю ярлыка — другой ярлык, как U+200B; NBSP внутри — другой ярлык (РАСХОЖДЕНИЕ: прежний сводил \\s)', () => {
  assert.deepEqual(vidy('/a/b/', stranicaB().replace('href="/a/">Page A<', 'href="/a/">&#xFEFF;Page A<')), ['крошки']);
  assert.deepEqual(vidy('/a/b/', stranicaB().replace('href="/a/">Page A<', 'href="/a/">Page&nbsp;A<')), ['крошки']);
});

/* — «судью судят», блок Б, раунд 2 (B2-*) — */

test('B2-2: крошки только в <noscript> головы — разборщик без скриптов выносит их в тело, читатель со скриптами их не видит: отказ', () => {
  const nav = stranicaB().match(/<nav class="crumbs"[\s\S]*?<\/nav>/)[0];
  const html = stranicaB().replace(nav, '').replace('</head>', `<noscript>${nav}</noscript></head>`);
  assert.ok(vidy('/a/b/', html).includes('noscript'), JSON.stringify(sudit('/a/b/', html, struktura, ozhidanie)));
});

test('B2-5: цель aria-labelledby только в <noscript> — у читателя со скриптами имени нет: отказ', () => {
  const html = stranicaB({ imyaNav: 'aria-labelledby="im"', telo: '<noscript><span id="im">Crumbs</span></noscript>' });
  assert.notDeepEqual(vidy('/a/b/', html), []);
});

test('B2-6: разметка головы только внутри <template shadowrootmode> в <head> — у браузера шаблон инертен: отказ', () => {
  const html = glavnaya.replace(/(<link rel="canonical"[\s\S]*<\/script>)<\/head>/, '<template shadowrootmode="open">$1</template></head>');
  assert.notEqual(html, glavnaya);
  assert.notDeepEqual(vidy('/', html), []);
});

test('B2-8: aria-label из одних невидимых знаков (U+200B) — имени нет: отказ «крошки»', () => {
  assert.deepEqual(vidy('/a/b/', stranicaB({ imyaNav: 'aria-label="&#x200B;"' })), ['крошки']);
});

test('B2-2 (контроль): крошки в теле и <noscript> с таблицей стилей в голове — чисто', () => {
  assert.deepEqual(vidy('/a/b/', stranicaB({ golova: spisok([['Home', '/'], ['Page A', '/a/'], ['Page B', '/a/b/']]) + '<noscript><link rel="stylesheet" href="/x.css"></noscript>' })), []);
});

test('страница вне структуры; пустая сборка; сборка без главной', () => {
  assert.deepEqual(vidy('/net/', stranicaB()), ['вне структуры']);
  assert.equal(suditNabor([], struktura, ozhidanie)[0].vid, 'пусто');
  assert.ok(suditNabor([{ url: '/a/b/', html: stranicaB() }], struktura, ozhidanie).some((o) => o.vid === 'главной нет'));
});
