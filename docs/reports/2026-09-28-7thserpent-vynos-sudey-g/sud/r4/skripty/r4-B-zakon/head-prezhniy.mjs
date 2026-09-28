/**
 * СУДЬЯ ГОЛОВЫ И КРОШЕК собранных страниц (`glowa`) — имя сайта для поиска, `canonical`, JSON-LD
 * и крошки (П102 блок Б; прежний — `sites/7thserpent.com/tools/glowa.mjs` пачки 0, заморожен
 * на `42fa5f3` с пределами, бэклог 61 п. 3). Интеграция Astro на `astro:build:done` — сборка
 * падает на отказе; разбор — деревом parse5 (`core/text/html.mjs`), как у браузера без скриптов.
 *
 * ЧТО СУДИТ, по каждой странице `dist/**\/index.html` (кроме `_astro/`):
 *   1. адрес страницы есть в структуре;
 *   2. ровно один `<link rel=canonical>` в документе, он в `<head>`, адрес = `site.domain` структуры
 *      + адрес страницы;
 *   3. ровно одна `<meta>` `og:site_name` (в `property` или `name`, регистр не важен), в `<head>`,
 *      значение — имя сайта из данных сайта;
 *   4. каждый `<script type="application/ld+json">` — разбираемый JSON, одиночный объект с `@type`
 *      `WebSite` или `BreadcrumbList`, в `<head>`; массив, `@graph`, другой тип — отказ;
 *   5. `WebSite` — ровно один и только на главной, ключи ровно `@context`, `@type`, `name`,
 *      `alternateName`, `url`: контекст, имя и второе имя — из данных сайта, `url` = canonical;
 *   6. `BreadcrumbList` — ровно один на каждой странице, кроме страниц без списка (данные сайта:
 *      главная и `/404/`), звенья — обход `parent` структуры, `position` 1…n, `name` — «Home»
 *      у главной, иначе `h1`, `item` — абсолютный адрес; ключи — ровно договорные;
 *   7. видимые крошки `nav.crumbs`: на главной их нет; на остальных — одна, с именем: `aria-label`
 *      не из одних пробелов и невидимых знаков или `aria-labelledby` на элемент страницы с непустым
 *      текстом (висячая ссылка — отказ, бэклог 61 п. 3; B2-8); все `<a>` внутри — ровно звенья цепочки без последнего,
 *      с классом `crumbs__link`, адресом и ярлыком звена; последнее — единственный
 *      `span.crumbs__current` с `aria-current="page"`, без ссылки внутри и после него; вложенная
 *      `nav` внутри крошек — отказ (бэклог 61 п. 3);
 *   8. разметка головы (`canonical`, `og:site_name`, JSON-LD) внутри `<noscript>` — отказ: скребок
 *      без JS прочтёт её как настоящую; и когда разборщик вынес её из `<noscript>` головы (там
 *      `<script>`, `<title>` или текст закрывают `<noscript>`, и всё за ними уходит в голову) —
 *      страница разбирается второй раз, как у читателя со скриптами, и разметка головы двух
 *      прочтений должна совпасть (раунд 1 «судью судят» блока Б, B1-G-1); так же — крошки и имя
 *      навигации: `nav.crumbs` в `<noscript>` (и в `<noscript>` головы, откуда разборщик без скриптов
 *      выносит её в тело), цель `aria-labelledby` в `<noscript>` — прочтения разные, отказ (B2-2, B2-5);
 *   9. `canonical`, `og:site_name` и JSON-LD внутри `<template shadowrootmode>` — не метаданные
 *      документа (у браузера такой шаблон в `<head>` инертен): не считаются и дают отказ «шаблон» (B2-6).
 *
 * НЕЗАВИСИМОСТЬ СУДЬИ. Имя, второе имя и контекст — из данных сайта (`gates/`), литералами из слов
 * владельца (П85 п. 3), не из кода печати: судья, который читает ожидание оттуда же, откуда печать,
 * согласится с любой опечаткой. Домен и цепочка — из структуры (договор), не из HTML.
 *
 * ПРЕДЕЛЫ ПРЕЖНЕГО СУДЬИ, СНЯТЫЕ ТОКЕНИЗАТОРОМ (бэклог 61 п. 3): `<noscript>` как граница разбора,
 * строки-теги в значениях атрибутов, самозакрытые формы сырого текста, неявное закрытие головы,
 * вырожденный комментарий `<!-->`, скрипты с «<!--» и «-->» — дерево строит браузерный разборщик.
 * Модель — страница без скриптов, сверенная с прочтением со скриптами (пункт 8).
 *
 * ПРОСТРАНСТВО ИМЁН: крошки — HTML-элемент `nav` (SVG-элемент с тем же именем — не ориентир,
 * B1-G-6); `link`, `meta` и `script` головы считаются в любом пространстве (строже: SVG-скрипт
 * JSON-LD — «вне head»). Цель `aria-labelledby` — в светлом дереве: за границу теневого корня
 * ссылка по id не ходит (B1-G-7).
 *
 * ЧЕГО НЕ СУДИТ: другие теги Open Graph, `hreflang`, `robots`, вид крошек; повтор ключа внутри
 * JSON-LD не виден (`JSON.parse` оставляет последнее значение); невидимые знаки и NBSP в ярлыках
 * сравниваются как есть, и по краям тоже (ярлык с U+200B или U+FEFF — другой ярлык, отказ; прежний
 * судья сводил `\s` — РАСХОЖДЕНИЕ, строже). ПРЕДЕЛЫ (B1-G-7, test.todo): имя крошек, лежащее только
 * в скрытом потомке цели `aria-labelledby` (accname его отбрасывает), засчитывается; теневой корень
 * без `<slot>` над `nav.crumbs` (светлые дети не рисуются) не виден.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { razobrat, elementy, imya, atr, klassy, predki, chasti, tekstVsego, tekstDetey, vHtml, tenevoyShablon } from '../text/html.mjs';
import { chistit } from '../text/extract.mjs';

/**
 * Текст для сравнения ярлыков: пробельные ASCII сведены, края сняты только от них — невидимые
 * знаки и NBSP остаются и по краям (`trim()` снял бы U+FEFF и NBSP, B1-G-8).
 */
const yarlyk = (s) => s.replace(/[\t\n\f\r ]+/g, ' ').replace(/^ | $/g, '');

const ldSkript = (u) => imya(u) === 'script' && (atr(u, 'type') ?? '').trim().toLowerCase() === 'application/ld+json';
const canonicalLink = (u) => imya(u) === 'link' && (atr(u, 'rel') ?? '').toLowerCase().split(/[\t\n\f\r ]+/).includes('canonical');
const siteNameMeta = (u) => imya(u) === 'meta' && [atr(u, 'property'), atr(u, 'name')].some((v) => (v ?? '').toLowerCase() === 'og:site_name');

/** Внутри шаблона теневого корня: метаданными документа это не бывает (раунд 2 блока Б, B2-6). */
const vShablone = (u) => predki(u).some(tenevoyShablon);
const razmetka = (u) => (canonicalLink(u) || siteNameMeta(u) || ldSkript(u)) && !vShablone(u);

/**
 * Разметка головы одного прочтения — строкой для сравнения прочтений: `canonical`, `og:site_name`,
 * JSON-LD в порядке документа, с отметкой «в голове».
 */
function razmetkaGolovy(doc) {
  const { head } = chasti(doc);
  const vGolove = (u) => Boolean(head) && predki(u).includes(head);
  return JSON.stringify(elementy(doc).filter(razmetka).map((u) => [imya(u), vGolove(u), ldSkript(u) ? tekstDetey(u) : atr(u, canonicalLink(u) ? 'href' : 'content') ?? null]));
}

/**
 * Крошки одного прочтения: HTML-элементы `nav.crumbs` (SVG-элемент с тем же именем — не ориентир
 * навигации, B1-G-6) — ссылки, текущее звено, имя навигации.
 */
function krohi(doc) {
  const vse = elementy(doc);
  const vNoscript = (u) => predki(u).some((p) => imya(p) === 'noscript');
  return vse
    .filter((u) => vHtml(u) && imya(u) === 'nav' && klassy(u).has('crumbs'))
    .map((n) => {
      const vnutri = elementy(n);
      const ssylki = vnutri.filter((u) => imya(u) === 'a');
      const tekushchie = vnutri.filter((u) => imya(u) === 'span' && klassy(u).has('crumbs__current'));
      const poryadok = new Map(vnutri.map((u, i) => [u, i]));
      const labelledby = atr(n, 'aria-labelledby');
      const idy = (labelledby ?? '').split(/[\t\n\f\r ]+/).filter(Boolean);
      // Ссылка по id за границу теневого корня не ходит: цель — в светлом дереве документа (B1-G-7).
      const imyaPoSsylke = idy
        .map((id) => vse.find((u) => atr(u, 'id') === id && !vShablone(u)))
        .filter(Boolean)
        .map((u) => yarlyk(tekstVsego(u)))
        .join(' ')
        .trim();
      return {
        label: atr(n, 'aria-label'),
        labelledby,
        imyaPoSsylke,
        vNoscript: vNoscript(n),
        vlozhennayaNav: vnutri.some((u) => imya(u) === 'nav'),
        ssylki: ssylki.map((a) => ({ href: atr(a, 'href'), klass: klassy(a).has('crumbs__link'), label: yarlyk(tekstVsego(a)), poz: poryadok.get(a) })),
        tekushchie: tekushchie.map((s) => ({
          current: atr(s, 'aria-current'),
          label: yarlyk(tekstVsego(s)),
          ssylkaVnutri: elementy(s).some((u) => imya(u) === 'a'),
          poz: poryadok.get(s),
        })),
      };
    });
}

/** Крошки строкой для сравнения прочтений (без отметки «в noscript» — она своя у каждого прочтения). */
const krohiStrokoy = (navy) => JSON.stringify(navy.map(({ vNoscript, ...n }) => n));

/** Разбор страницы в факты для суда. */
export function razobratGolovu(html) {
  const doc = razobrat(html);
  const sSkriptami = razobrat(html, { skripty: true });
  const { head } = chasti(doc);
  const vse = elementy(doc);
  const vGolove = (u) => Boolean(head) && predki(u).includes(head);
  const vNoscript = (u) => predki(u).some((p) => imya(p) === 'noscript');
  const canonical = vse.filter((u) => canonicalLink(u) && !vShablone(u));
  const siteName = vse.filter((u) => siteNameMeta(u) && !vShablone(u));
  const vShablonah = vse.filter((u) => (canonicalLink(u) || siteNameMeta(u) || ldSkript(u)) && vShablone(u)).map(imya);
  const ld = vse.filter((u) => ldSkript(u) && !vShablone(u)).map((u) => {
    const tekst = tekstDetey(u);
    let obj;
    let oshibka = null;
    try {
      obj = JSON.parse(tekst);
    } catch (e) {
      oshibka = e.message;
    }
    return { obj, oshibka, vGolove: vGolove(u), vNoscript: vNoscript(u) };
  });
  const navy = krohi(doc);
  return {
    estGolova: Boolean(head),
    canonical: canonical.map((u) => ({ href: atr(u, 'href'), vGolove: vGolove(u), vNoscript: vNoscript(u) })),
    siteName: siteName.map((u) => ({ content: atr(u, 'content'), vGolove: vGolove(u), vNoscript: vNoscript(u) })),
    ld,
    navy,
    vShablonah,
    // Разметка головы у читателя со скриптами другая — часть её стоит в <noscript>, даже если разборщик
    // без скриптов вынес её оттуда (в голове `<script>` закрывает `<noscript>`, B1-G-1).
    dvaProchteniya: razmetkaGolovy(doc) === razmetkaGolovy(sSkriptami),
    // Крошки и имя навигации — так же: `<nav>` в `<noscript>` головы разборщик без скриптов выносит
    // в тело; цель `aria-labelledby` в `<noscript>` читатель со скриптами не находит (B2-2, B2-5).
    krohiDvuhProchteniy: krohiStrokoy(navy) === krohiStrokoy(krohi(sSkriptami)),
  };
}

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
    if (p.parent && !po.has(p.parent)) throw new Error(`родитель ${p.parent} страницы ${p.url} вне структуры`);
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
 * Отказы одной страницы — `[{ vid, chto }]`; пустой — сверено.
 * `ozhidanie` — данные сайта: `{ imya, alternativnoe, kontekst, bezSpiska: [адреса без BreadcrumbList] }`.
 */
export function sudit(url, html, struktura, ozhidanie) {
  const otkazy = [];
  const otkaz = (vid, chto) => otkazy.push({ vid, chto });
  const domen = String(struktura.site?.domain ?? '').replace(/\/+$/, '');
  const stranica = struktura.pages.find((p) => p.url === url);
  if (!stranica) {
    otkaz('вне структуры', `адреса ${url} нет в structure.json`);
    return otkazy;
  }
  const f = razobratGolovu(html);
  const ozhidaemyCanonical = domen + url;

  if (f.canonical.length !== 1) otkaz('canonical', `link rel=canonical: ${f.canonical.length}, нужен ровно один`);
  else if (!f.canonical[0].vGolove) otkaz('canonical', 'link rel=canonical вне <head>');
  else if (f.canonical[0].href !== ozhidaemyCanonical) otkaz('canonical', `canonical ${f.canonical[0].href} ≠ ${ozhidaemyCanonical}`);

  if (f.siteName.length !== 1) otkaz('og:site_name', `meta og:site_name: ${f.siteName.length}, нужна ровно одна`);
  else if (!f.siteName[0].vGolove) otkaz('og:site_name', 'meta og:site_name вне <head>');
  else if (f.siteName[0].content !== ozhidanie.imya) otkaz('og:site_name', `og:site_name «${f.siteName[0].content}» ≠ «${ozhidanie.imya}»`);

  const vNoscript = [
    ...f.canonical.filter((c) => c.vNoscript).map(() => 'link rel=canonical'),
    ...f.siteName.filter((s) => s.vNoscript).map(() => 'meta og:site_name'),
    ...f.ld.filter((b) => b.vNoscript).map(() => 'JSON-LD'),
  ];
  if (vNoscript.length) otkaz('noscript', `внутри <noscript>: ${vNoscript.join(', ')} — скребок без JS прочтёт это как разметку головы`);
  else if (!f.dvaProchteniya) {
    otkaz('noscript', 'разметка головы (canonical, og:site_name, JSON-LD) у читателя со скриптами и без них разная — часть её стоит в <noscript>');
  }
  if (!f.krohiDvuhProchteniy) otkaz('noscript', 'крошки или имя навигации у читателя со скриптами и без них разные — часть их стоит в <noscript>');
  if (f.vShablonah.length) otkaz('шаблон', `внутри <template shadowrootmode>: ${f.vShablonah.join(', ')} — это не метаданные документа`);

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
      const chto = o === null ? 'null' : Array.isArray(o) ? 'массив' : typeof o !== 'object' ? `значение ${typeof o}` : '@graph';
      otkaz('JSON-LD', `блок — не одиночный объект (${chto}): разметки сверх договора сайт не печатает`);
      continue;
    }
    if (o['@type'] === 'WebSite') websites.push(o);
    else if (o['@type'] === 'BreadcrumbList') spiski.push(o);
    else otkaz('JSON-LD', `тип ${JSON.stringify(o['@type'])} вне договора: одна строка «WebSite» или «BreadcrumbList»`);
  }

  const glavnaya = url === '/';
  if (glavnaya) {
    if (websites.length !== 1) otkaz('WebSite', `на главной WebSite: ${websites.length}, нужен ровно один`);
    else {
      const w = websites[0];
      if (!rovnoKluchi(w, KLUCHI_WEBSITE)) otkaz('WebSite', `ключи WebSite: ${Object.keys(w).join(', ')} — нужны ровно ${KLUCHI_WEBSITE.join(', ')}`);
      if (w['@context'] !== ozhidanie.kontekst) otkaz('WebSite', `@context «${w['@context']}» ≠ «${ozhidanie.kontekst}»`);
      if (w.name !== ozhidanie.imya) otkaz('WebSite', `name «${w.name}» ≠ «${ozhidanie.imya}»`);
      if (w.alternateName !== ozhidanie.alternativnoe) otkaz('WebSite', `alternateName «${w.alternateName}» ≠ «${ozhidanie.alternativnoe}»`);
      if (w.url !== ozhidaemyCanonical) otkaz('WebSite', `url «${w.url}» ≠ canonical главной по договору «${ozhidaemyCanonical}»`);
      if (f.canonical.length === 1 && w.url !== f.canonical[0].href) otkaz('WebSite', `url «${w.url}» ≠ canonical страницы «${f.canonical[0].href}»`);
    }
  } else if (websites.length) otkaz('WebSite', `WebSite на ${url}: ${websites.length} — только на главной`);

  const bezRazmetki = glavnaya || (ozhidanie.bezSpiska ?? []).includes(url);
  let cep;
  try {
    cep = cepochka(struktura, url);
  } catch (e) {
    otkaz('структура', `цепочка крошек не строится: ${e.message}`);
    return otkazy;
  }
  if (bezRazmetki) {
    if (spiski.length) otkaz('BreadcrumbList', `BreadcrumbList на ${url}: ${spiski.length} — на этой странице его нет по договору`);
  } else if (spiski.length !== 1) otkaz('BreadcrumbList', `BreadcrumbList: ${spiski.length}, нужен ровно один`);
  else {
    const s = spiski[0];
    if (!rovnoKluchi(s, KLUCHI_SPISKA)) otkaz('BreadcrumbList', `ключи BreadcrumbList: ${Object.keys(s).join(', ')}`);
    if (s['@context'] !== ozhidanie.kontekst) otkaz('BreadcrumbList', `@context «${s['@context']}»`);
    const z = Array.isArray(s.itemListElement) ? s.itemListElement : [];
    if (z.length !== cep.length) otkaz('BreadcrumbList', `звеньев ${z.length}, по договору ${cep.length}`);
    cep.forEach((c, i) => {
      const e = z[i];
      if (e === undefined) return;
      if (!e || typeof e !== 'object' || Array.isArray(e)) {
        otkaz('BreadcrumbList', `звено ${i + 1}: не объект (${JSON.stringify(e)})`);
        return;
      }
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
    const n = f.navy[0];
    // Пустота имени — после снятия невидимых знаков, как в извлечении (U+200B — не имя, B2-8).
    const imyaLabel = chistit(n.label ?? '');
    if (!imyaLabel && !chistit(n.imyaPoSsylke)) {
      otkaz(
        'крошки',
        n.labelledby !== undefined
          ? `у nav.crumbs aria-labelledby «${n.labelledby}» не ведёт на элемент с текстом — навигация без имени для скринридера`
          : 'у nav.crumbs нет имени (aria-label или aria-labelledby) — навигация без имени для скринридера'
      );
    }
    if (n.vlozhennayaNav) otkaz('крошки', 'внутри nav.crumbs — ещё одна nav');
    const ssylki = n.ssylki;
    if (ssylki.length !== cep.length - 1) otkaz('крошки', `ссылок в крошках ${ssylki.length}, по договору ${cep.length - 1} (все звенья, кроме текущего)`);
    cep.slice(0, -1).forEach((c, i) => {
      const e = ssylki[i];
      if (!e) return;
      if (!e.klass) otkaz('крошки', `звено ${i + 1}: ссылка без класса crumbs__link`);
      if (e.href !== c.url) otkaz('крошки', `звено ${i + 1}: адрес ${e.href ?? '—'} ≠ ${c.url}`);
      if (e.label !== c.label) otkaz('крошки', `звено ${i + 1}: ярлык «${e.label}» ≠ «${c.label}»`);
    });
    const posl = cep[cep.length - 1];
    if (n.tekushchie.length !== 1) otkaz('крошки', `текущих звеньев (span.crumbs__current) ${n.tekushchie.length}, нужно ровно одно`);
    else {
      const t = n.tekushchie[0];
      if (t.current !== 'page') otkaz('крошки', 'текущее звено без aria-current="page"');
      if (t.ssylkaVnutri) otkaz('крошки', 'внутри текущего звена — ссылка');
      if (ssylki.some((s) => s.poz > t.poz)) otkaz('крошки', 'после текущего звена ещё есть ссылки');
      if (t.label !== posl.label) otkaz('крошки', `текущее звено: ярлык «${t.label}» ≠ «${posl.label}»`);
    }
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
export function suditNabor(stranicy, struktura, ozhidanie) {
  const otkazy = [];
  if (!stranicy.length) otkazy.push({ url: '—', vid: 'пусто', chto: 'страниц нет — «сверено» о пустом множестве не выдаётся' });
  if (stranicy.length && !stranicy.some((s) => s.url === '/')) otkazy.push({ url: '/', vid: 'главной нет', chto: 'WebSite живёт на главной, а её в сборке нет' });
  for (const s of stranicy) for (const o of sudit(s.url, s.html, struktura, ozhidanie)) otkazy.push({ url: s.url, ...o });
  return otkazy;
}

/**
 * Интеграция Astro. `structure` — путь `structure.json` от корня сайта; `ozhidanie` — данные сайта.
 * @returns {import('astro').AstroIntegration}
 */
export default function head({ structure, ozhidanie }) {
  let koren = null;
  return {
    name: 'factory:head',
    hooks: {
      'astro:config:done': ({ config }) => {
        koren = fileURLToPath(config.root);
      },
      'astro:build:done': ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const put = join(koren, structure);
        if (!existsSync(put)) throw new Error(`glowa: нет ${put}`);
        const struktura = JSON.parse(readFileSync(put, 'utf8'));
        if (!struktura.site?.domain) throw new Error('glowa: в structure.json нет site.domain — canonical не с чем сравнить');
        const stranicy = stranicyDist(dist).map((s) => ({ url: s.url, html: readFileSync(s.file, 'utf8') }));
        const otkazy = suditNabor(stranicy, struktura, ozhidanie);
        if (otkazy.length) {
          logger.error(`glowa: отказов ${otkazy.length}`);
          throw new Error(
            `Голова или крошки не по договору — ${otkazy.length}:\n` + otkazy.map((o) => `  ${o.url}: [${o.vid}] ${o.chto}`).join('\n') + '\nПоправьте шаблон (Base.astro, крошки ядра) или структуру — не судью.'
          );
        }
        logger.info(`glowa: ${stranicy.length} стр. — og:site_name «${ozhidanie.imya}» на каждой, WebSite на главной, BreadcrumbList и крошки по договору`);
      },
    },
  };
}
