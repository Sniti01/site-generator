// Проверяющий s2r2-zakon-prov: воспроизведение Z-2…Z-6 настоящим судьёй на эталонной сборке (HTML портится в памяти).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sverkaStranicy, vhody, SAYT } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
import { OBYAZATELNAYA_PODPIS } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/sverka.mjs';

const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const V = vhody(SAYT);
const OB = new Set(OBYAZATELNAYA_PODPIS);
const klon = (o) => JSON.parse(JSON.stringify(o));
const html = (url) => readFileSync(join(DIST, url.replace(/^\//, ''), 'index.html'), 'utf8');
const po = (url) => ({ page: V.struktura.pages.find((p) => p.url === url), dane: V.soderzhanie.find((s) => s.dane?.url === url)?.dane, html: html(url) });
const sud = (url, fh, fd) => {
  const x = po(url);
  const h = fh ? fh(x.html) : x.html;
  if (fh && h === x.html) return ['ПОРЧА НЕ ПРИМЕНИЛАСЬ'];
  const d = fd ? fd(klon(x.dane)) : x.dane;
  return sverkaStranicy({ page: x.page, dane: d, html: h, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB });
};
const PODPIS = /(<p class="podpis-geroya t-caption"[^>]*>)([\s\S]*?)(<\/p>)/;
const podpis = (znak) => [(h) => h.replace(PODPIS, (_, a, _t, c) => a + znak + c), (d) => { d.artCaption = znak; return d; }];
const vyvod = (imya, z) => console.log(`${imya}: ${z.length ? z.map((y) => y.slice(0, 160)).join(' | ') : '[] МОЛЧИТ'}`);

console.log('== контроль: шесть страниц без порчи');
for (const url of OBYAZATELNAYA_PODPIS) vyvod(url, sud(url));

console.log('== Z-2: чужая непустая метка у подписи (метка героя вместо метки маршрута)');
for (const url of OBYAZATELNAYA_PODPIS) vyvod(url, sud(url, (h) => {
  const cidHero = h.match(/<section class="hero"[^>]*(data-astro-cid-[a-z0-9]+)/)[1];
  return h.replace(/(<p class="podpis-geroya t-caption") data-astro-cid-[a-z0-9]+>/, `$1 ${cidHero}>`);
}));

console.log('== Z-3: классы скрытия и popover у предков (настоящий судья)');
const Z3 = [
  ['popover у section.hero', (h) => h.replace('<section class="hero"', '<section popover class="hero"')],
  ['sr-only у section.hero', (h) => h.replace('<section class="hero"', '<section class="hero sr-only"')],
  ['visually-hidden у div.geroy', (h) => h.replace('<div class="geroy', '<div class="visually-hidden geroy')],
  ['invisible у div.geroy', (h) => h.replace('<div class="geroy', '<div class="invisible geroy')],
  ['hidden (класс) у <main>', (h) => h.replace('<main id="content"', '<main class="hidden" id="content"')],
];
for (const url of ['/media/', '/voice-and-face/']) for (const [n, f] of Z3) vyvod(`${url} ${n}`, sud(url, f));

console.log('== Z-4: подпись из знаков, которые не рисуются (не Cf)');
const Z4 = ['\uFE0F', '\uFE00', '\u180B', '\u17B4', '\u{E0100}', '\u17B5', '\u180F', '\u180D', '\uFE0F\uFE0F\u180B'];
for (const url of OBYAZATELNAYA_PODPIS) for (const z of Z4) {
  const cp = [...z].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase()).join(' ');
  const shema = z.trim().length >= 1 ? 'схема tekst() пропускает' : 'схема отказывает';
  vyvod(`${url} ${cp} (${shema})`, sud(url, ...podpis(z)));
}
console.log('контроль Z-4: U+200B');
vyvod('/media/ U+200B', sud('/media/', ...podpis('\u200B')));

console.log('== Z-5: предок-элемент, который не рисуется, и классы Tailwind вне списка');
const obernut = (teg) => (h) => h.replace(/<div class="geroy[\s\S]*?<\/section><\/div>/, (x) => `<${teg}>${x}</${teg}>`);
const Z5 = [
  ['<details> вокруг div.geroy', obernut('details')],
  ['<dialog> вокруг div.geroy', obernut('dialog')],
  ['<noscript> вокруг div.geroy', obernut('noscript')],
  ['<datalist> вокруг div.geroy', obernut('datalist')],
  ['md:hidden у div.geroy', (h) => h.replace('<div class="geroy', '<div class="md:hidden geroy')],
  ['collapse у section.hero', (h) => h.replace('<section class="hero"', '<section class="hero collapse"')],
  ['opacity-0 у section.hero', (h) => h.replace('<section class="hero"', '<section class="hero opacity-0"')],
  // свои члены класса
  ['hidden у <body>', (h) => h.replace(/<body([^>]*)>/, '<body$1 hidden>')],
  ['aria-hidden у <body>', (h) => h.replace(/<body([^>]*)>/, '<body$1 aria-hidden="true">')],
  ['inert у <body>', (h) => h.replace(/<body([^>]*)>/, '<body$1 inert>')],
  ['sm:sr-only у section.hero', (h) => h.replace('<section class="hero"', '<section class="hero sm:sr-only"')],
  ['max-lg:invisible у div.geroy', (h) => h.replace('<div class="geroy', '<div class="max-lg:invisible geroy')],
  ['<select> вокруг div.geroy', obernut('select')],
  ['<template> вокруг div.geroy', obernut('template')],
];
for (const url of ['/media/', '/mods/']) for (const [n, f] of Z5) vyvod(`${url} ${n}`, sud(url, f));

console.log('== Z-6: законные знаки Cf в подписи');
const Z6 = [
  ['мягкий перенос', (t) => t.replace('screenshot', 'screen\u00ADshot')],
  ['ZWJ в эмодзи', (t) => '\u{1F468}\u200D\u{1F4BB} ' + t],
  ['word joiner', (t) => t.replace(/ (\d)/, ' \u2060$1')],
  ['LRM', (t) => t + ' (\u05DE\u05E7\u05E1\u200E)'],
];
for (const url of ['/media/', '/remake/']) for (const [n, f] of Z6) {
  const t = f(po(url).dane.artCaption);
  vyvod(`${url} ${n} [${t === po(url).dane.artCaption ? 'не применилась' : 'ok'}]`, sud(url, ...podpis(t)));
}
