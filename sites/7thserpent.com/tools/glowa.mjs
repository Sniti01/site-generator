#!/usr/bin/env node
/**
 * Судья «головы» собранных страниц — имя сайта для поиска и крошки (пачка 0,
 * П85 п. 3–4; П84 п. 7, бэклог 60 п. 10).
 *
 *   node tools/glowa.mjs                — судит dist/ сайта
 *   node tools/glowa.mjs --dist <папка> — судит другую сборку (пробы маршрута)
 *   node tools/glowa.mjs --selftest     — мутации на страницах dist/ и на литеральной
 *                                         странице маршрута: каждая обязана дать отказ
 *                                         своего вида, чистые — «сверено»
 *
 * ЧТО СУДИТ, по каждой странице `dist/**\/index.html` (кроме `_astro/`):
 *   1. адрес страницы есть в `structure/structure.json`;
 *   2. ровно один `<link rel="canonical">` в `<head>`, адрес = `site.domain`
 *      структуры + адрес страницы;
 *   3. ровно один `<meta property="og:site_name">` в `<head>`, значение —
 *      «7th Serpent»;
 *   4. каждый блок `application/ld+json` — разбираемый JSON, объект с `@type`
 *      из двух допустимых — `WebSite`, `BreadcrumbList`; другой тип, массив,
 *      `@graph` — отказ (разметку сверх договора сайт не печатает);
 *   5. `WebSite` — ровно один и только на главной, ключи ровно `@context`,
 *      `@type`, `name`, `alternateName`, `url`: «https://schema.org», «WebSite»,
 *      «7th Serpent», «7thserpent.com», `url` = canonical главной;
 *   6. `BreadcrumbList` — ровно один на каждой странице, кроме главной и
 *      `/404/`, где его нет: звенья — обход `parent` структуры от главной,
 *      `position` 1…n, `name` — «Home» у главной, иначе `h1` страницы, `item` —
 *      абсолютный адрес звена; ключи звена и списка — ровно договорные;
 *   7. видимые крошки `nav.crumbs`: на главной их нет, на остальных — одна
 *      навигация, ссылки — звенья цепочки кроме последнего, последнее —
 *      текстом с `aria-current="page"`, ярлыки и адреса — те же, что у
 *      `BreadcrumbList` (на `/404/` видимые крошки есть, разметки нет —
 *      форма первого сайта).
 *
 * НЕЗАВИСИМОСТЬ СУДЬИ. Имя и альтернативное имя — литералы из слов владельца
 * (П85 п. 3), не из `src/data/site.ts`: судья, который читает ожидание из того
 * же места, что и печать, согласится с любой опечаткой. Домен и цепочка —
 * из структуры (договор), не из собранного HTML.
 *
 * РАЗБОР — регулярными выражениями по тексту, с учётом кавычек в тегах;
 * комментарии HTML вырезаются до чтения (копия в комментарии не считается
 * ни «есть», ни «нет»). Сущности в значениях атрибутов и тексте раскрываются
 * (`&amp;`, `&#…;`, `&quot;`, `&lt;`, `&gt;`, `&apos;`, `&nbsp;`); внутри
 * `<script>` — нет (так читает браузер). Тип скрипта — без учёта регистра.
 *
 * ЧЕГО НЕ СУДИТ: других тегов Open Graph (`og:title`, `og:description`,
 * `og:locale` — литералы из структуры, их никто не сверял и прежде), `hreflang`,
 * `robots` и `noindex`; вид крошек (роль, цвет, отступы — ядро и глаза);
 * страницы вне `dist/**\/index.html` (карты сайта — не страницы).
 *
 * Код возврата: 0 — сверено, 1 — отказ, 2 — ошибка входа.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Слова владельца, П85 п. 3 — литералы, не импорт из кода сайта. */
export const OZHIDANIE = { imya: '7th Serpent', alternativnoe: '7thserpent.com', kontekst: 'https://schema.org' };

/* ------------------------------------------------------------------ *
 * Разбор
 * ------------------------------------------------------------------ */

const IMENNYE = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
export const raskryt = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, k) => {
    if (k[0] === '#') {
      const n = k[1] === 'x' || k[1] === 'X' ? parseInt(k.slice(2), 16) : Number(k.slice(1));
      try {
        return String.fromCodePoint(n);
      } catch {
        return m;
      }
    }
    return IMENNYE[k.toLowerCase()] ?? m;
  });

const bezKommentariev = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/** Атрибуты тега: имя — строчными, значение — с раскрытыми сущностями. */
export function atributy(tekstTega) {
  const out = {};
  const telo = tekstTega.replace(/^<[a-zA-Z][a-zA-Z0-9-]*/, '').replace(/\/?>$/, '');
  for (const m of telo.matchAll(/([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g)) {
    const imya = m[1].toLowerCase();
    if (imya in out) continue; // как браузер: первое вхождение атрибута
    out[imya] = raskryt(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return out;
}

/** Открывающие теги с именем из списка, с учётом кавычек (`title="a>b"` — один тег). */
function tegi(html, imena) {
  const re = new RegExp(`<(${imena.join('|')})(?=[\\s>/])(?:[^>"']|"[^"]*"|'[^']*')*>`, 'gi');
  return [...html.matchAll(re)].map((m) => ({ imya: m[1].toLowerCase(), tekst: m[0], poz: m.index, atr: atributy(m[0]) }));
}

/** Классы тега — множество. */
const klassy = (atr) => new Set((atr.class ?? '').split(/\s+/).filter(Boolean));

/** Текст внутри фрагмента: теги сняты, сущности раскрыты, пробелы сжаты. */
const tekst = (frag) => raskryt(frag.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

/**
 * Разбор одной страницы в факты для суда.
 * @param {string} html
 */
export function razobrat(html) {
  const h = bezKommentariev(html);
  const konecGolovy = h.search(/<\/head\s*>/i);
  const golova = konecGolovy >= 0 ? h.slice(0, konecGolovy) : '';
  const vGolove = (poz) => konecGolovy >= 0 && poz < konecGolovy;

  const meta = tegi(h, ['meta']);
  const siteName = meta.filter((t) => (t.atr.property ?? '').toLowerCase() === 'og:site_name');
  const linki = tegi(h, ['link']);
  const canonical = linki.filter((t) => (t.atr.rel ?? '').toLowerCase().split(/\s+/).includes('canonical'));

  const ld = [];
  for (const m of h.matchAll(/<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi)) {
    const atr = atributy(`<script${m[1]}>`);
    if ((atr.type ?? '').trim().toLowerCase() !== 'application/ld+json') continue;
    let obj;
    let oshibka = null;
    try {
      obj = JSON.parse(m[2]);
    } catch (e) {
      oshibka = e.message;
    }
    ld.push({ obj, oshibka, vGolove: vGolove(m.index) });
  }

  const navy = [];
  for (const t of tegi(h, ['nav'])) {
    if (!klassy(t.atr).has('crumbs')) continue;
    const konec = h.indexOf('</nav', t.poz);
    const vnutri = h.slice(t.poz + t.tekst.length, konec < 0 ? h.length : konec);
    const zvenya = [];
    for (const m of vnutri.matchAll(/<(a|span)\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/\1\s*>/gi)) {
      const atr = atributy(`<${m[1]}${m[2]}>`);
      const k = klassy(atr);
      if (m[1].toLowerCase() === 'a' && k.has('crumbs__link')) zvenya.push({ vid: 'ссылка', href: atr.href, label: tekst(m[3]) });
      else if (m[1].toLowerCase() === 'span' && k.has('crumbs__current')) zvenya.push({ vid: 'текущая', current: atr['aria-current'], label: tekst(m[3]) });
    }
    navy.push({ label: t.atr['aria-label'], zvenya });
  }

  return {
    estGolova: konecGolovy >= 0,
    siteName: siteName.map((t) => ({ content: t.atr.content, vGolove: vGolove(t.poz) })),
    canonical: canonical.map((t) => ({ href: t.atr.href, vGolove: vGolove(t.poz) })),
    ld,
    navy,
    golovaDlina: golova.length,
  };
}

/* ------------------------------------------------------------------ *
 * Суд
 * ------------------------------------------------------------------ */

/** Цепочка крошек по договору: обход `parent` от страницы к главной. */
export function cepochka(struktura, url) {
  const po = new Map(struktura.pages.map((p) => [p.url, p]));
  const out = [];
  const vidennye = new Set();
  let p = po.get(url);
  while (p) {
    if (vidennye.has(p.url)) throw new Error(`цикл в parent у ${p.url}`);
    vidennye.add(p.url);
    out.unshift({ url: p.url, label: p.url === '/' ? 'Home' : p.h1 });
    p = p.parent ? po.get(p.parent) : null;
  }
  return out;
}

const KLUCHI_WEBSITE = ['@context', '@type', 'name', 'alternateName', 'url'];
const KLUCHI_SPISKA = ['@context', '@type', 'itemListElement'];
const KLUCHI_ZVENA = ['@type', 'position', 'name', 'item'];
const rovnoKluchi = (obj, kluchi) => {
  const est = Object.keys(obj).sort();
  const nado = [...kluchi].sort();
  return est.length === nado.length && est.every((k, i) => k === nado[i]);
};

/**
 * Отказы одной страницы — список `{вид, что}`. Пустой — сверено.
 * @param {string} url — адрес страницы (`/`, `/404/`, `/a/b/`)
 * @param {string} html
 * @param {{site: {domain: string}, pages: object[]}} struktura
 */
export function sudit(url, html, struktura) {
  const otkazy = [];
  const otkaz = (vid, chto) => otkazy.push({ vid, chto });
  const domen = String(struktura.site?.domain ?? '').replace(/\/+$/, '');
  const stranica = struktura.pages.find((p) => p.url === url);
  if (!stranica) {
    otkaz('вне структуры', `адреса ${url} нет в structure.json`);
    return otkazy;
  }
  const f = razobrat(html);
  if (!f.estGolova) otkaz('головы нет', 'нет </head> — судить нечего');
  const ozhidaemyCanonical = domen + url;

  // canonical
  if (f.canonical.length !== 1) otkaz('canonical', `link rel=canonical: ${f.canonical.length}, нужен ровно один`);
  else if (!f.canonical[0].vGolove) otkaz('canonical', 'link rel=canonical вне <head>');
  else if (f.canonical[0].href !== ozhidaemyCanonical) otkaz('canonical', `canonical ${f.canonical[0].href} ≠ ${ozhidaemyCanonical}`);

  // og:site_name
  if (f.siteName.length !== 1) otkaz('og:site_name', `meta og:site_name: ${f.siteName.length}, нужна ровно одна`);
  else if (!f.siteName[0].vGolove) otkaz('og:site_name', 'meta og:site_name вне <head>');
  else if (f.siteName[0].content !== OZHIDANIE.imya) otkaz('og:site_name', `og:site_name «${f.siteName[0].content}» ≠ «${OZHIDANIE.imya}»`);

  // JSON-LD
  const websites = [];
  const spiski = [];
  for (const b of f.ld) {
    if (b.oshibka) {
      otkaz('JSON-LD', `блок не разбирается как JSON: ${b.oshibka}`);
      continue;
    }
    if (!b.vGolove) otkaz('JSON-LD', 'блок JSON-LD вне <head>');
    const o = b.obj;
    if (!o || typeof o !== 'object' || Array.isArray(o) || '@graph' in o) {
      otkaz('JSON-LD', 'блок — не одиночный объект (массив или @graph): разметки сверх договора сайт не печатает');
      continue;
    }
    if (o['@type'] === 'WebSite') websites.push(o);
    else if (o['@type'] === 'BreadcrumbList') spiski.push(o);
    else otkaz('JSON-LD', `тип «${o['@type']}» вне договора (WebSite, BreadcrumbList)`);
  }

  const glavnaya = url === '/';
  if (glavnaya) {
    if (websites.length !== 1) otkaz('WebSite', `на главной WebSite: ${websites.length}, нужен ровно один`);
    else {
      const w = websites[0];
      if (!rovnoKluchi(w, KLUCHI_WEBSITE)) otkaz('WebSite', `ключи WebSite: ${Object.keys(w).join(', ')} — нужны ровно ${KLUCHI_WEBSITE.join(', ')}`);
      if (w['@context'] !== OZHIDANIE.kontekst) otkaz('WebSite', `@context «${w['@context']}» ≠ «${OZHIDANIE.kontekst}»`);
      if (w.name !== OZHIDANIE.imya) otkaz('WebSite', `name «${w.name}» ≠ «${OZHIDANIE.imya}»`);
      if (w.alternateName !== OZHIDANIE.alternativnoe) otkaz('WebSite', `alternateName «${w.alternateName}» ≠ «${OZHIDANIE.alternativnoe}»`);
      if (w.url !== ozhidaemyCanonical) otkaz('WebSite', `url «${w.url}» ≠ canonical главной по договору «${ozhidaemyCanonical}»`);
      if (f.canonical.length === 1 && w.url !== f.canonical[0].href) otkaz('WebSite', `url «${w.url}» ≠ canonical страницы «${f.canonical[0].href}»`);
    }
  } else if (websites.length) otkaz('WebSite', `WebSite на ${url}: ${websites.length} — только на главной`);

  // Крошки: разметка и видимые
  const bezRazmetki = glavnaya || url === '/404/';
  const cep = cepochka(struktura, url);
  if (bezRazmetki) {
    if (spiski.length) otkaz('BreadcrumbList', `BreadcrumbList на ${url}: ${spiski.length} — на главной и /404/ его нет`);
  } else if (spiski.length !== 1) otkaz('BreadcrumbList', `BreadcrumbList: ${spiski.length}, нужен ровно один`);
  else {
    const s = spiski[0];
    if (!rovnoKluchi(s, KLUCHI_SPISKA)) otkaz('BreadcrumbList', `ключи BreadcrumbList: ${Object.keys(s).join(', ')}`);
    if (s['@context'] !== OZHIDANIE.kontekst) otkaz('BreadcrumbList', `@context «${s['@context']}»`);
    const z = Array.isArray(s.itemListElement) ? s.itemListElement : [];
    if (z.length !== cep.length) otkaz('BreadcrumbList', `звеньев ${z.length}, по договору ${cep.length}`);
    cep.forEach((c, i) => {
      const e = z[i];
      if (!e || typeof e !== 'object') return;
      if (!rovnoKluchi(e, KLUCHI_ZVENA)) otkaz('BreadcrumbList', `звено ${i + 1}: ключи ${Object.keys(e).join(', ')}`);
      if (e['@type'] !== 'ListItem') otkaz('BreadcrumbList', `звено ${i + 1}: @type «${e['@type']}»`);
      if (e.position !== i + 1) otkaz('BreadcrumbList', `звено ${i + 1}: position ${JSON.stringify(e.position)}`);
      if (e.name !== c.label) otkaz('BreadcrumbList', `звено ${i + 1}: name «${e.name}» ≠ «${c.label}»`);
      if (e.item !== domen + c.url) otkaz('BreadcrumbList', `звено ${i + 1}: item «${e.item}» ≠ «${domen + c.url}»`);
    });
  }

  if (glavnaya) {
    if (f.navy.length) otkaz('крошки', `на главной nav.crumbs: ${f.navy.length} — у главной одно звено, крошек нет`);
  } else if (f.navy.length !== 1) otkaz('крошки', `nav.crumbs: ${f.navy.length}, нужна ровно одна`);
  else {
    const z = f.navy[0].zvenya;
    if (z.length !== cep.length) otkaz('крошки', `видимых звеньев ${z.length}, по договору ${cep.length}`);
    cep.forEach((c, i) => {
      const e = z[i];
      if (!e) return;
      const posledneye = i === cep.length - 1;
      if (posledneye) {
        if (e.vid !== 'текущая' || e.current !== 'page') otkaz('крошки', `последнее звено — не текст с aria-current="page"`);
      } else if (e.vid !== 'ссылка' || e.href !== c.url) otkaz('крошки', `звено ${i + 1}: ссылка ${e.href ?? '—'} ≠ ${c.url}`);
      if (e.label !== c.label) otkaz('крошки', `звено ${i + 1}: ярлык «${e.label}» ≠ «${c.label}»`);
    });
  }
  return otkazy;
}

/** Страницы сборки: `index.html` в папках `dist/`, кроме `_astro/`. */
export function stranicyDist(dist) {
  const out = [];
  const obkhod = (p) => {
    for (const f of readdirSync(p)) {
      const q = join(p, f);
      if (statSync(q).isDirectory()) {
        if (relative(dist, q) !== '_astro') obkhod(q);
      } else if (f === 'index.html') {
        const rel = relative(dist, p).split(sep).join('/');
        out.push({ url: rel ? `/${rel}/` : '/', file: q });
      }
    }
  };
  obkhod(dist);
  return out.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
}

/** Суд набора страниц: отказ при нуле страниц и без главной. */
export function suditNabor(stranicy, struktura) {
  const otkazy = [];
  if (!stranicy.length) otkazy.push({ url: '—', vid: 'пусто', chto: 'страниц нет — «сверено» о пустом множестве не выдаётся' });
  if (stranicy.length && !stranicy.some((s) => s.url === '/')) otkazy.push({ url: '/', vid: 'главной нет', chto: 'WebSite живёт на главной, а её в сборке нет' });
  for (const s of stranicy) for (const o of sudit(s.url, s.html, struktura)) otkazy.push({ url: s.url, ...o });
  return otkazy;
}

/* ------------------------------------------------------------------ *
 * Самопроверка
 * ------------------------------------------------------------------ */

/**
 * Литеральная страница маршрута второго уровня — `/max-payne-3/guide/`
 * (родитель `/max-payne-3/`, цепочка из трёх звеньев). Разметка и ярлыки
 * написаны здесь руками, а не собраны функцией судьи: иначе проба «чистая
 * страница проходит» проверяла бы судью им же самим.
 */
function stranicaGuide(domen) {
  const h3 = 'Max Payne 3 (2012): São Paulo, platforms and what to know before playing';
  const hg = 'Max Payne 3 walkthrough: all chapters, golden guns, clues and trophies';
  const list = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${domen}/` },
      { '@type': 'ListItem', position: 2, name: h3, item: `${domen}/max-payne-3/` },
      { '@type': 'ListItem', position: 3, name: hg, item: `${domen}/max-payne-3/guide/` },
    ],
  };
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>x</title>' +
    `<link rel="canonical" href="${domen}/max-payne-3/guide/">` +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="7th Serpent">' +
    `<script type="application/ld+json">${JSON.stringify(list)}</script></head><body>` +
    '<nav class="crumbs" aria-label="Breadcrumbs"><ol class="crumbs__list container t-caption">' +
    '<li class="crumbs__item"><a class="crumbs__link" href="/">Home</a><span class="crumbs__sep" aria-hidden="true">/</span></li>' +
    `<li class="crumbs__item"><a class="crumbs__link" href="/max-payne-3/">${h3}</a><span class="crumbs__sep" aria-hidden="true">/</span></li>` +
    `<li class="crumbs__item"><span class="crumbs__current" aria-current="page">${hg}</span></li>` +
    '</ol></nav><main id="content"><h1>x</h1></main></body></html>'
  );
}

function selftest(dist, struktura) {
  const domen = struktura.site.domain.replace(/\/+$/, '');
  const chtenie = (url) => readFileSync(join(dist, url === '/' ? '' : url.slice(1), 'index.html'), 'utf8');
  if (!existsSync(join(dist, 'index.html')) || !existsSync(join(dist, '404', 'index.html'))) {
    console.error(`самопроверке нужны ${dist}/index.html и ${dist}/404/index.html — соберите сайт`);
    process.exit(2);
  }
  const glav = chtenie('/');
  const s404 = chtenie('/404/');
  const guide = stranicaGuide(domen);
  const zamena = (s, iz, na) => {
    if (!s.includes(iz)) throw new Error(`самопроверка: образец не несёт «${iz.slice(0, 60)}» — мутация не применилась бы`);
    return s.replace(iz, na);
  };
  const siteNameTeg = (s) => s.match(/<meta property="og:site_name"[^>]*>/)[0];
  const ldBlok = (s, tip) => s.match(new RegExp(`<script type="application/ld\\+json">[^<]*"@type":"${tip}"[^<]*</script>`))[0];
  const webSite = ldBlok(glav, 'WebSite');
  const guideList = ldBlok(guide, 'BreadcrumbList');
  const kroshki404 = s404.match(/<nav\b[^>]*class="crumbs[^>]*>[\s\S]*?<\/nav>/)[0];
  /** Перестановка звеньев 2 и 3 вместе с их `position` — порядок в массиве неверен, числа «верны». */
  const perestavit = (html, blok) => {
    const obj = JSON.parse(blok.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
    const z = obj.itemListElement;
    obj.itemListElement = [z[0], z[2], z[1]];
    return zamena(html, blok, `<script type="application/ld+json">${JSON.stringify(obj)}</script>`);
  };

  /** [имя, страницы {url: html}, ждём: null — сверено, иначе множество видов отказа] */
  const proby = [
    ['чистые: главная, /404/, литеральная /max-payne-3/guide/', { '/': glav, '/404/': s404, '/max-payne-3/guide/': guide }, null],
    ['og:site_name: атрибуты в обратном порядке и в одинарных кавычках — законно', { '/': zamena(glav, siteNameTeg(glav), "<meta content='7th Serpent' property='og:site_name'>") }, null],
    ['og:site_name: значение сущностями — законно', { '/': zamena(glav, siteNameTeg(glav), '<meta property="og:site_name" content="7th&#32;Serpent">') }, null],
    ['og:site_name снят', { '/': zamena(glav, siteNameTeg(glav), '') }, ['og:site_name']],
    ['og:site_name — домен вместо имени', { '/': zamena(glav, siteNameTeg(glav), '<meta property="og:site_name" content="7thserpent.com">') }, ['og:site_name']],
    ['og:site_name дважды', { '/404/': zamena(s404, siteNameTeg(s404), siteNameTeg(s404) + siteNameTeg(s404)) }, ['og:site_name']],
    ['og:site_name перенесён в <body>', { '/404/': zamena(zamena(s404, siteNameTeg(s404), ''), '<main', siteNameTeg(s404) + '<main') }, ['og:site_name']],
    ['og:site_name только в комментарии', { '/': zamena(glav, siteNameTeg(glav), `<!-- ${siteNameTeg(glav)} -->`) }, ['og:site_name']],
    ['WebSite снят с главной', { '/': zamena(glav, webSite, '') }, ['WebSite']],
    ['WebSite только в комментарии', { '/': zamena(glav, webSite, `<!-- ${webSite} -->`) }, ['WebSite']],
    ['WebSite: name — домен', { '/': zamena(glav, '"name":"7th Serpent"', '"name":"7thserpent.com"') }, ['WebSite']],
    ['WebSite: alternateName — другой', { '/': zamena(glav, '"alternateName":"7thserpent.com"', '"alternateName":"7th Serpent"') }, ['WebSite']],
    ['WebSite: url без www', { '/': zamena(glav, '"url":"https://www.7thserpent.com/"', '"url":"https://7thserpent.com/"') }, ['WebSite']],
    ['WebSite: url без слэша', { '/': zamena(glav, '"url":"https://www.7thserpent.com/"', '"url":"https://www.7thserpent.com"') }, ['WebSite']],
    ['WebSite: url по http', { '/': zamena(glav, '"url":"https://www.7thserpent.com/"', '"url":"http://www.7thserpent.com/"') }, ['WebSite']],
    ['WebSite: лишний ключ', { '/': zamena(glav, '"url":"https://www.7thserpent.com/"', '"url":"https://www.7thserpent.com/","potentialAction":{}') }, ['WebSite']],
    ['WebSite: @context по http', { '/': zamena(glav, '"@context":"https://schema.org","@type":"WebSite"', '"@context":"http://schema.org","@type":"WebSite"') }, ['WebSite']],
    ['WebSite дважды, второй — тип скрипта заглавными', { '/': zamena(glav, webSite, webSite + webSite.replace('application/ld+json', 'Application/LD+JSON')) }, ['WebSite']],
    ['WebSite на /404/', { '/404/': zamena(s404, '</head>', webSite + '</head>') }, ['WebSite']],
    ['WebSite в @graph', { '/': zamena(glav, webSite, webSite.replace(/>(\{[^<]*\})</, (m, o) => `>{"@context":"https://schema.org","@graph":[${o}]}<`)) }, ['JSON-LD', 'WebSite']],
    ['JSON-LD не разбирается', { '/': zamena(glav, '"url":"https://www.7thserpent.com/"}', '"url":"https://www.7thserpent.com/",}') }, ['JSON-LD', 'WebSite']],
    ['JSON-LD чужого типа', { '/404/': zamena(s404, '</head>', '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"x"}</script></head>') }, ['JSON-LD']],
    // Без `www` в canonical главной расходится и `url` WebSite с canonical страницы — два отказа, оба верные.
    ['canonical главной — без www', { '/': zamena(glav, 'rel="canonical" href="https://www.7thserpent.com/"', 'rel="canonical" href="https://7thserpent.com/"') }, ['canonical', 'WebSite']],
    ['canonical дважды', { '/404/': zamena(s404, '</head>', '<link rel="canonical" href="https://www.7thserpent.com/404/"></head>') }, ['canonical']],
    ['BreadcrumbList на главной', { '/': zamena(glav, '</head>', guideList + '</head>') }, ['BreadcrumbList']],
    ['BreadcrumbList на /404/', { '/404/': zamena(s404, '</head>', guideList + '</head>') }, ['BreadcrumbList']],
    ['guide: BreadcrumbList снят', { '/max-payne-3/guide/': zamena(guide, guideList, '') }, ['BreadcrumbList']],
    ['guide: position звена 2 — 9', { '/max-payne-3/guide/': zamena(guide, '"position":2', '"position":9') }, ['BreadcrumbList']],
    ['guide: звенья 2 и 3 местами (с их position)', { '/max-payne-3/guide/': perestavit(guide, guideList) }, ['BreadcrumbList']],
    ['guide: name звена ≠ h1', { '/max-payne-3/guide/': zamena(guide, '"name":"Max Payne 3 walkthrough', '"name":"Max Payne 3 guide') }, ['BreadcrumbList']],
    ['guide: item относительный', { '/max-payne-3/guide/': zamena(guide, `"item":"${domen}/max-payne-3/"`, '"item":"/max-payne-3/"') }, ['BreadcrumbList']],
    ['guide: лишнее звено', { '/max-payne-3/guide/': zamena(guide, ']}</script>', ',{"@type":"ListItem","position":4,"name":"x","item":"https://www.7thserpent.com/x/"}]}</script>') }, ['BreadcrumbList']],
    ['guide: position строкой', { '/max-payne-3/guide/': zamena(guide, '"position":1', '"position":"1"') }, ['BreadcrumbList']],
    ['guide: видимые крошки сняты', { '/max-payne-3/guide/': guide.replace(/<nav[\s\S]*<\/nav>/, '') }, ['крошки']],
    ['guide: видимый ярлык ≠ h1', { '/max-payne-3/guide/': zamena(guide, '>Max Payne 3 (2012): São Paulo', '>Max Payne 3: São Paulo') }, ['крошки']],
    ['guide: ссылка звена на чужой адрес', { '/max-payne-3/guide/': zamena(guide, 'href="/max-payne-3/"', 'href="/max-payne-2/"') }, ['крошки']],
    ['guide: последнее звено ссылкой', { '/max-payne-3/guide/': zamena(guide, '<span class="crumbs__current" aria-current="page">', '<span class="crumbs__current">') }, ['крошки']],
    ['главная: видимые крошки', { '/': zamena(glav, '<main', kroshki404 + '<main') }, ['крошки']],
    ['/404/: видимые крошки сняты', { '/404/': zamena(s404, kroshki404, '') }, ['крошки']],
    ['страница вне структуры', { '/nie-ma/': s404 }, ['вне структуры']],
    ['сборка без главной', { '/404/': s404 }, ['главной нет']],
    ['пустая сборка', {}, ['пусто']],
  ];

  let plokho = 0;
  const itog = [];
  for (const [imya, stranicy, zhdem] of proby) {
    const nabor = Object.entries(stranicy).map(([url, html]) => ({ url, html }));
    // Одиночная мутированная страница судится вместе с чистыми соседями —
    // чтобы «главной нет» и «пусто» не ловили каждую пробу; соседи не мутированы.
    const polnyi = [...nabor];
    if (zhdem && !['главной нет', 'пусто'].some((v) => zhdem.includes(v))) {
      if (!stranicy['/']) polnyi.push({ url: '/', html: glav });
    }
    const otkazy = suditNabor(polnyi, struktura);
    const vidy = new Set(otkazy.map((o) => o.vid));
    let ok;
    if (zhdem === null) ok = otkazy.length === 0;
    else ok = otkazy.length > 0 && [...vidy].every((v) => zhdem.includes(v)) && zhdem.some((v) => vidy.has(v));
    if (!ok) plokho += 1;
    itog.push({ imya, ok, vidy: [...vidy], pervyi: otkazy[0]?.chto ?? '—' });
    console.log(`${ok ? 'ok  ' : 'ПЛОХО'} ${imya.padEnd(64)} ${zhdem === null ? 'ждём: сверено' : 'ждём: ' + zhdem.join(' | ')}; получено: ${otkazy.length ? [...vidy].join(' | ') + ' — ' + otkazy[0].chto : 'сверено'}`);
  }
  console.log(`\nсамопроверка: ${proby.length - plokho}/${proby.length}`);
  return plokho === 0;
}

/* ------------------------------------------------------------------ *
 * Запуск
 * ------------------------------------------------------------------ */

const isMain = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  const iDist = args.indexOf('--dist');
  const dist = iDist >= 0 ? join(process.cwd(), args[iDist + 1] ?? '') : join(root, 'dist');
  let struktura;
  try {
    struktura = JSON.parse(readFileSync(join(root, 'structure/structure.json'), 'utf8'));
  } catch (e) {
    console.error(`structure.json не читается: ${e.message}`);
    process.exit(2);
  }
  if (!struktura.site?.domain) {
    console.error('в structure.json нет site.domain — canonical не с чем сравнить');
    process.exit(2);
  }
  if (!existsSync(dist)) {
    console.error(`нет папки сборки ${dist}`);
    process.exit(2);
  }
  if (args.includes('--selftest')) {
    process.exit(selftest(dist, struktura) ? 0 : 1);
  }
  const stranicy = stranicyDist(dist).map((s) => ({ url: s.url, html: readFileSync(s.file, 'utf8') }));
  const otkazy = suditNabor(stranicy, struktura);
  for (const s of stranicy) {
    const f = razobrat(s.html);
    const ld = f.ld.filter((b) => !b.oshibka).map((b) => b.obj['@type']).join(', ') || '—';
    console.log(`  ${s.url.padEnd(24)} og:site_name ${f.siteName.length}, JSON-LD: ${ld}, крошек: ${f.navy.map((n) => n.zvenya.length).join('/') || '—'}`);
  }
  if (otkazy.length) {
    console.error(`\nОТКАЗ — ${otkazy.length}:`);
    for (const o of otkazy) console.error(`  ${o.url}: [${o.vid}] ${o.chto}`);
    process.exit(1);
  }
  console.log(`\nсверено: ${stranicy.length} стр. — og:site_name «${OZHIDANIE.imya}» на каждой, WebSite на главной, BreadcrumbList и крошки по договору`);
}
