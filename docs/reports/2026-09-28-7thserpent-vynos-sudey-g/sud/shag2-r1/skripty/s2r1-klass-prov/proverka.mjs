// Проверяющий s2r1-klass-prov: воспроизведение находок S2R1-K-1…K-6 скептика и своя попытка.
// Репозиторий — только чтение; HTML портится в памяти.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sverkaStranicy, vhody } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
import { OBYAZATELNAYA_PODPIS } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/sverka.mjs';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const V = vhody(SAYT);
const OB = new Set(OBYAZATELNAYA_PODPIS);
const klon = (o) => JSON.parse(JSON.stringify(o));
const po = (url) => ({
  page: V.struktura.pages.find((p) => p.url === url),
  dane: V.soderzhanie.find((s) => s.dane?.url === url)?.dane,
  html: readFileSync(join(DIST, url === '/' ? '' : url.slice(1), 'index.html'), 'utf8'),
});
const sver = (page, dane, html) => sverkaStranicy({ page, dane, html, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB });

const P = /<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>([\s\S]*?)<\/p>/;
const zam = (h, f) => {
  if (!P.test(h)) throw new Error('нет подписи');
  return h.replace(P, (_m, t) => f(t));
};
const OTKR = '<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>';
const atrP = (a) => (h) => zam(h, (t) => `<p ${a} class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</p>`);
const teg = (n) => (h) => zam(h, (t) => `<${n} class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</${n}>`);
const vnutri = (f) => (h) => zam(h, (t) => `${OTKR}${f(t)}</p>`);
const predok = (re, na) => (h) => {
  if (!re.test(h)) throw new Error('нет предка ' + re);
  return h.replace(re, na);
};

const SLUCHAI = [
  ['kontrol', 'контроль без порчи', null],
  ['kontrol', 'style="display:none" у подписи (ловится)', { html: atrP('style="display:none"') }],
  ['K-1', 'hidden у подписи', { html: atrP('hidden') }],
  ['K-1', 'hidden="until-found" у подписи', { html: atrP('hidden="until-found"') }],
  ['K-1', 'aria-hidden="true" у подписи', { html: atrP('aria-hidden="true"') }],
  ['K-1', 'inert у подписи', { html: atrP('inert') }],
  ['K-1', 'popover у подписи', { html: atrP('popover') }],
  ['K-1', 'класс visually-hidden у подписи', { html: (h) => zam(h, (t) => `<p class="podpis-geroya t-caption visually-hidden" data-astro-cid-n67f4zmd>${t}</p>`) }],
  ['K-1', 'hidden у section.hero', { html: predok(/<section (?=[^>]*class="hero[ "])/, '<section hidden ') }],
  ['K-1', 'aria-hidden у section.hero', { html: predok(/<section (?=[^>]*class="hero[ "])/, '<section aria-hidden="true" ') }],
  ['K-1', 'inert у div.geroy', { html: predok(/<div (?=[^>]*class="geroy[ "])/, '<div inert ') }],
  ['K-2', 'подпись без метки области', { html: (h) => zam(h, (t) => `<p class="podpis-geroya t-caption">${t}</p>`) }],
  ['K-3', 'dialog вместо p', { html: teg('dialog') }],
  ['K-3', 'datalist вместо p', { html: teg('datalist') }],
  ['K-3', 'noscript вместо p', { html: teg('noscript') }],
  ['K-3', 'details вместо p', { html: teg('details') }],
  ['K-3', 'iframe вместо p', { html: teg('iframe') }],
  ['K-3', 'textarea вместо p', { html: teg('textarea') }],
  ['K-4', 'span hidden внутри', { html: vnutri((t) => `<span hidden>${t}</span>`) }],
  ['K-4', 'span aria-hidden внутри', { html: vnutri((t) => `<span aria-hidden="true">${t}</span>`) }],
  ['K-4', 'теневой корень без slot перед текстом', { html: vnutri((t) => `<template shadowrootmode="open"></template>${t}`) }],
  ['K-4', 'текст в ruby/rp', { html: vnutri((t) => `<ruby><rp>${t}</rp></ruby>`) }],
  ['K-5', 'artCaption = U+200B (содержание и печать)', { tekst: '\u200B' }],
  ['K-5', 'artCaption = U+2060', { tekst: '\u2060' }],
  ['K-5', 'artCaption = U+00AD', { tekst: '\u00AD' }],
  ['K-6', 'artCaption = «Max Payne»', { tekst: 'Max Payne' }],
  ['K-6', 'artCaption = «.»', { tekst: '.' }],
  ['svoy', 'hidden у <main>', { html: predok(/<main(?=[\s>])/, '<main hidden') }],
  ['svoy', 'класс skip-link у подписи', { html: (h) => zam(h, (t) => `<p class="podpis-geroya t-caption skip-link" data-astro-cid-n67f4zmd>${t}</p>`) }],
  ['svoy', 'artCaption = U+202E + подпись (текст задом наперёд)', { tekstF: (t) => '\u202E' + t }],
];

const itog = [];
for (const [id, imya, porcha] of SLUCHAI) {
  let molchit = 0;
  const primer = [];
  for (const url of OBYAZATELNAYA_PODPIS) {
    const x = po(url);
    let html = x.html;
    let dane = klon(x.dane);
    if (porcha?.html) html = porcha.html(html);
    if (porcha?.tekst !== undefined || porcha?.tekstF) {
      const nov = porcha.tekstF ? porcha.tekstF(dane.artCaption) : porcha.tekst;
      dane.artCaption = nov;
      html = zam(html, () => `${OTKR}${nov}</p>`);
    }
    if (porcha && html === x.html && JSON.stringify(dane) === JSON.stringify(x.dane)) throw new Error('порча не применилась: ' + imya);
    const z = sver(x.page, dane, html);
    if (!z.length) molchit++;
    else primer.push(`${url}: ${z[0].slice(0, 140)}`);
  }
  itog.push(`${id}\t${imya}\tмолчит ${molchit} из ${OBYAZATELNAYA_PODPIS.length}${primer.length ? '\t' + primer[0] : ''}`);
}

// Своя попытка 2: у страницы из списка снят герой (блок hero-key-art и поля героя) — сработает ли обязательность?
{
  const s404 = po('/404/');
  const mods = po('/mods/');
  const page = { ...klon(s404.page), url: '/mods/' };
  const dane = { ...klon(s404.dane), url: '/mods/' };
  const z = sver(page, dane, s404.html);
  itog.push(`svoy\tстраница из списка без героя (страница /404/ под адресом /mods/)\t${z.length ? 'замечания: ' + z.join(' | ').slice(0, 300) : 'МОЛЧИТ'}`);
  itog.push(`svoy\tблоки /mods/: ${mods.page.blocks.map((b) => b.block).join(', ')}; блоки /404/: ${s404.page.blocks.map((b) => b.block).join(', ')}`);
}
console.log(itog.join('\n'));
