#!/usr/bin/env node
/**
 * Сверка «разметка равна до текста» — приёмка перевода сайта (П76 п. 3).
 *
 *   node tools/markup-diff.mjs <dist-до> <dist-после>   — сверка двух сборок
 *   node tools/markup-diff.mjs --selftest               — пробы судьи
 *
 * Перевод меняет текст и ничего больше. Инструмент берёт сборку до перевода
 * и после и требует, чтобы на каждой странице совпало всё, кроме текста:
 *
 *   1. Набор страниц: каждая страница «до» есть «после» по карте адресов,
 *      лишних нет. Карта — поле `прежний_url` в `structure/pages-s2.json`
 *      (единственный источник; тот же читает `check-live` для 301). Карта
 *      без повторов: два старых адреса на один новый — отказ.
 *   2. Поток тегов: имена, порядок, вложенность, атрибуты (имена и порядок).
 *      Значения атрибутов равны, кроме:
 *        • текстовых (`TEXT_ATTRS`, `content` у `<meta>` из `TEXT_META`) —
 *          меняются, но пустое остаётся пустым, непустое непустым;
 *        • адресных (`href`, `src`, `srcset`…, `content` у og:url) — равны
 *          после карты адресов (любой из хостов сайта, `//`-адреса); имя
 *          файла `/_astro/` сравнивается без хеша — содержимое сверяет п. 6;
 *        • `lang` у `<html>` — обязан стать `en`; `og:locale` — `en_US`.
 *   3. Текст: сам текст не сравнивается, но непустой узел остаётся непустым,
 *      пустой пустым, а узел из одних пробелов — узлом из пробелов; пробел
 *      на краю узла (граница с тегом) сохраняется — склеенные слова видны.
 *      Невидимые символы (U+00AD, U+200B–U+200F и родня) непустым не считаются.
 *      Узлы и текстовые атрибуты, РАВНЫЕ «до» на той же позиции, печатаются
 *      списком (`--same`) — эвристика п. 5 ловит около 90 % польского, короткая
 *      непереведённая подпись видна здесь; список читает принимающий.
 *   4. `<style>` и обычные `<script>` — байт в байт; JSON-LD — та же форма,
 *      строки `name` меняются, адреса равны по карте.
 *   5. Остаток польского во «после»: текст, все атрибуты, кроме адресных
 *      и идентификаторов (`IDENT_ATTRS`: `id`, `class`, ссылки на `id` —
 *      по П76 п. 2 они не меняются, и п. 2 требует их равенства), и `name`
 *      в JSON-LD — без польских букв (с «ó»), без польских слов
 *      (служебных и словаря сайта — без учёта регистра; короткие «i», «w»,
 *      «z»… — строчные). Исключения — `ALLOW`, каждое с доводом.
 *   6. Прочие файлы — по имени без хеша, число файлов на имя равно:
 *        • CSS (комментарии сняты): «до» целиком входит во «после»
 *          подпоследовательностью правил и объявлений; вставки — только
 *          правила НОВЫХ классов, которых нет ни на одном элементе «после»,
 *          `@property --tw-*` и переменные `--tw-*` в правиле `*` слоя
 *          `@layer properties`; кавычки во вставке — только в дескрипторе
 *          `@property` (Tailwind v4 сканирует тексты страниц и делает утилиты
 *          из английских слов — «fixed», «table»; мёртвые правила, вид не меняют);
 *        • `.htaccess`: строки «до» идут во «после» в том же порядке;
 *          вставлены только пустые строки, комментарии и ровно правила 301
 *          с `прежний_url` — каждое раз, между `RewriteEngine On` и первым
 *          `RewriteCond`;
 *        • каждый адрес `/_astro/` в HTML «после» — существующий файл «после»;
 *        • `robots.txt`, шрифты, картинки — те же байты;
 *        • sitemap — адреса равны по карте;
 *        • JS с другими байтами печатается списком «для глаз».
 *
 * Код возврата ≠ 0 при любом расхождении пунктов 1–6 (кроме списка «для глаз»).
 */

import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.ac4bf-thewatch.com';
const HOSTS = /^(?:https?:)?\/\/(?:www\.)?ac4bf-thewatch\.com(?=\/|$)/i;

/** Исключения остатка польского: подстрока → довод. */
const ALLOW = new Map([
  ['Toruń', 'имя собственное: «Toruń portrait» — английское название портрета Коперника'],
]);

const TEXT_ATTRS = new Set(['alt', 'title', 'aria-label', 'aria-description', 'aria-roledescription', 'aria-valuetext', 'placeholder', 'label']);
const TEXT_META = new Set(['description', 'og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description', 'twitter:image:alt']);
const URL_ATTRS = new Set(['href', 'src', 'srcset', 'action', 'poster', 'xlink:href']);
// `data-era*` — klucze epok (`EraId` w `src/data/site.ts`: jerozolima, japonia…),
// identyfikatory skryptu skali, nie tekst.
const IDENT_ATTRS = new Set(['id', 'class', 'for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'headers', 'list', 'form', 'data-era', 'data-era-section']);
const POLISH_LETTERS = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
// Слово — между пробелами или пунктуацией, не внутри «Koh-i-Noor» и «Core i5».
const L = '(?:^|[\\s(„“"«])';
const R = '(?=$|[\\s,.;:!?)”"»])';
// Без учёта регистра: польские слова, которых нет в английском («ale», «pod»,
// «lat», «indie» — есть: pale ale, escape pod, lat., indie), и словарь сайта.
const POLISH_WORDS_CI = new RegExp(
  `${L}(się|jest|oraz|który|która|które|którego|że|dla|albo|także|też|tylko|już|lub|gdzie|kiedy|jako|przez|jego|jej|ich|nie|tej|jak|czy|bez|nad|przed|jeszcze|bardzo|może|można|sobie|być|był|była|było|są|tym|tego|gra|gry|grze|grę|część|części|strona|strony|stronie|stron|seria|serii|poradnik|poradniki|poradnika|mapa|mapy|epoki|epoka|werdykt|wszystkie|kadry|bractwo|redakcja|serwis|okruszki|dodatek|dodatki|wydania|wersja|roku|gdy|więc|zobacz|przejdź|treści|główna|miejsc|miejsca|dokąd|stąd|zacząć|zacznij|kolei|pierwsza|druga|trzecia|premiera|materiał|wydawcy|tekst|teksty|tekstu|ostatnie|poprzednie|następne|nieoficjalny|przewodnik|twoje|prawa|jakie|dane|zbieramy|morze|zamiast|miasta|miasto|dachy|japonia|londyn|rzym|egipt|karaiby|włochy|zachodnie|ziemia|święta|kluczowy|zdjęcia|zrzut|ekranu)${R}`,
  'iu'
);
// Строчные короткие: заглавные «I», «A», «O», «W» бывают в английском; точка
// справа не граница — «i.e.».
const POLISH_WORDS_LC = new RegExp(`${L}(i|w|z|o|u|na|po|od|za|co|ma)(?=$|[\\s,;:!?)”"»])`, 'u');

// ─── разбор HTML ──────────────────────────────────────────────────────────

// Nazwane encje, które mogą ukryć polską literę albo pustkę (runda 2).
const NAMED = { oacute: 'ó', Oacute: 'Ó', shy: '­', ZeroWidthSpace: '​', lrm: '‎', rlm: '‏', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', bdquo: '„', mdash: '—', ndash: '–', hellip: '…' };
const decode = (s) =>
  s
    .replace(/&([A-Za-z]+);/g, (m, n) => NAMED[n] ?? m)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

/** Токены: {t:'tag',name,attrs:[[k,v]],close,self} | {t:'text',v} | {t:'raw',v} | {t:'comment',v} | {t:'doctype',v} */
export function tokenize(html) {
  const out = [];
  let i = 0;
  const n = html.length;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt < 0) { out.push({ t: 'text', v: html.slice(i) }); break; }
    if (lt > i) out.push({ t: 'text', v: html.slice(i, lt) });
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      if (end < 0) throw new Error(`niezamknięty komentarz na ${lt}`);
      out.push({ t: 'comment', v: html.slice(lt + 4, end) });
      i = end + 3;
      continue;
    }
    if (html[lt + 1] === '!') {
      const end = html.indexOf('>', lt);
      out.push({ t: 'doctype', v: html.slice(lt, end + 1).toLowerCase() });
      i = end + 1;
      continue;
    }
    const close = html[lt + 1] === '/';
    let j = lt + (close ? 2 : 1);
    const nameStart = j;
    while (j < n && /[A-Za-z0-9:-]/.test(html[j])) j++;
    const name = html.slice(nameStart, j).toLowerCase();
    if (!name) { out.push({ t: 'text', v: '<' }); i = lt + 1; continue; }
    const attrs = [];
    let self = false;
    for (;;) {
      while (j < n && /\s/.test(html[j])) j++;
      if (j >= n) throw new Error(`niezamknięty znacznik <${name}>`);
      if (html[j] === '>') { j++; break; }
      if (html[j] === '/' && html[j + 1] === '>') { self = true; j += 2; break; }
      if (html[j] === '/') { j++; continue; }
      const ks = j;
      while (j < n && !/[\s=>]/.test(html[j]) && !(html[j] === '/' && html[j + 1] === '>')) j++;
      const key = html.slice(ks, j).toLowerCase();
      while (j < n && /\s/.test(html[j])) j++;
      let val = null;
      if (html[j] === '=') {
        j++;
        while (j < n && /\s/.test(html[j])) j++;
        const q = html[j];
        if (q === '"' || q === "'") {
          const end = html.indexOf(q, j + 1);
          if (end < 0) throw new Error(`niezamknięty cudzysłów w <${name}>`);
          val = html.slice(j + 1, end);
          j = end + 1;
        } else {
          const vs = j;
          while (j < n && !/[\s>]/.test(html[j])) j++;
          val = html.slice(vs, j);
        }
      }
      attrs.push([key, val === null ? null : decode(val)]);
    }
    out.push({ t: 'tag', name, attrs, close, self });
    i = j;
    if (!close && (name === 'script' || name === 'style')) {
      const end = html.toLowerCase().indexOf(`</${name}`, i);
      if (end < 0) throw new Error(`niezamknięty <${name}>`);
      out.push({ t: 'raw', v: html.slice(i, end), of: name, attrs });
      i = end;
    }
  }
  return out;
}

// ─── карта адресов ────────────────────────────────────────────────────────

const unhash = (rel) => rel.replace(/\\/g, '/').replace(/\.[A-Za-z0-9_-]{8}\.([a-z0-9]+)$/, '.*.$1');

/** Адрес «до» → каким он обязан стать «после». Хост сайта в любом виде; путь — по карте; `/_astro/` — без хеша. */
export function mapUrl(value, urlMap) {
  if (typeof value !== 'string') return value;
  const one = (u) => {
    const host = HOSTS.exec(u);
    const prefix = host ? host[0] : '';
    const rest = u.slice(prefix.length);
    if (!rest.startsWith('/')) return u;
    const cut = rest.search(/[?#]/);
    let path = cut < 0 ? rest : rest.slice(0, cut);
    const tail = cut < 0 ? '' : rest.slice(cut);
    const slashless = !path.endsWith('/') && urlMap.has(`${path}/`);
    path = slashless ? urlMap.get(`${path}/`).slice(0, -1) : (urlMap.get(path) ?? path);
    return prefix + path + tail;
  };
  return value.split(/(,\s*)/).map((part) => (/^,\s*$/.test(part) ? part : part.replace(/^(\S+)/, (m) => one(m)))).join('');
}
const assetless = (v) => (typeof v === 'string' ? v.replace(/\/_astro\/[^\s,"']+/g, (m) => unhash(m)) : v);

// ─── сверка одной страницы ────────────────────────────────────────────────

const attr = (tok, k) => tok.attrs?.find(([a]) => a === k)?.[1];
const INVISIBLE = /[\s ­​-‏⁠﻿]/g;
const isBlank = (s) => !s || !s.replace(INVISIBLE, '');

export function residue(s) {
  if (!s) return null;
  let t = s;
  for (const k of ALLOW.keys()) t = t.split(k).join('');
  if (POLISH_LETTERS.test(t)) return `polska litera: «${s.trim().slice(0, 90)}»`;
  const w = POLISH_WORDS_CI.exec(t) ?? POLISH_WORDS_LC.exec(t);
  if (w) return `polskie słowo «${w[1]}»: «${s.trim().slice(0, 90)}»`;
  return null;
}

function jsonShape(a, b, urlMap, path, errs) {
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return errs.push(`JSON-LD ${path}: inna długość listy`);
    return a.forEach((x, i) => jsonShape(x, b[i], urlMap, `${path}[${i}]`, errs));
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object' || Object.keys(a).join('|') !== Object.keys(b).join('|')) return errs.push(`JSON-LD ${path}: inne klucze`);
    for (const k of Object.keys(a)) {
      if (k === 'name' && typeof a[k] === 'string') {
        if (typeof b[k] !== 'string' || isBlank(b[k])) errs.push(`JSON-LD ${path}.name: pusty albo nie tekst`);
        continue;
      }
      jsonShape(a[k], b[k], urlMap, `${path}.${k}`, errs);
    }
    return;
  }
  if (typeof a === 'string' && mapUrl(a, urlMap) !== b) errs.push(`JSON-LD ${path}: «${b}», oczekiwano «${mapUrl(a, urlMap)}»`);
  else if (typeof a !== 'string' && a !== b) errs.push(`JSON-LD ${path}: ${b} ≠ ${a}`);
}

/** Klasy użyte na elementach strony — dla reguły CSS z p. 6. */
export function classesOf(html) {
  const set = new Set();
  for (const t of tokenize(html)) if (t.t === 'tag' && !t.close) for (const c of (attr(t, 'class') ?? '').split(/\s+/)) if (c) set.add(c);
  return set;
}

export function comparePage(htmlA, htmlB, urlMap) {
  const errs = [];
  const res = [];
  const same = []; // napisy «po» równe «przed» na tej samej pozycji — do oka
  const assets = []; // adresy /_astro/ «po» — plik musi istnieć w dist «po»
  const A = tokenize(htmlA).filter((t) => t.t !== 'comment');
  const B = tokenize(htmlB).filter((t) => t.t !== 'comment');
  // Tekst: rodzaj węzła — tekst albo same odstępy; treści się nie porównuje.
  const kind = (t) => (t.t === 'text' ? (isBlank(decode(t.v)) ? 'ws' : 'text') : t.t);
  for (const t of B) if (t.t === 'text') { const r = residue(decode(t.v)); if (r) res.push(r); }
  const len = Math.max(A.length, B.length);
  for (let i = 0; i < len; i++) {
    const x = A[i];
    const y = B[i];
    const where = `#${i} ${x ? (x.t === 'tag' ? `<${x.close ? '/' : ''}${x.name}>` : kind(x)) : '—'}`;
    if (!x || !y) { errs.push(`${where}: strumień się skończył z jednej strony (przed ${A.length}, po ${B.length})`); break; }
    if (kind(x) !== kind(y)) { errs.push(`${where}: rodzaj ${kind(x)} → ${kind(y)}${y.t === 'text' ? ` «${decode(y.v).trim().slice(0, 50)}»` : y.t === 'tag' ? ` <${y.name}>` : ''}`); break; }
    if (x.t === 'doctype' && x.v !== y.v) errs.push(`${where}: doctype`);
    if (x.t === 'text') {
      // Odstęp na brzegu węzła należy do granicy ze znacznikiem: «Gra <em>» →
      // «The<em>» skleja słowa (runda 2). Treść — do oka, gdy równa «przed».
      if (/^\s/.test(x.v) !== /^\s/.test(y.v) || /\s$/.test(x.v) !== /\s$/.test(y.v)) errs.push(`${where}: odstęp na brzegu tekstu zmieniony «${decode(y.v).trim().slice(0, 40)}»`);
      if (kind(x) === 'text' && x.v.trim() === y.v.trim()) same.push(decode(y.v).trim());
      continue;
    }
    if (x.t === 'raw') {
      const type = attr(x, 'type');
      if (x.of === 'script' && type === 'application/ld+json') {
        let ly;
        try { ly = JSON.parse(y.v); jsonShape(JSON.parse(x.v), ly, urlMap, '', errs); } catch (e) { errs.push(`${where}: JSON-LD nie parsuje się (${e.message})`); }
        const walk = (o) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (typeof v === 'string') { if (k === 'name') { const r = residue(v); if (r) res.push(`JSON-LD ${r}`); } } else walk(v); } };
        walk(ly);
      } else if (x.v !== y.v) errs.push(`${where}: treść <${x.of}> różni się`);
      continue;
    }
    if (x.t !== 'tag') continue;
    if (x.name !== y.name || x.close !== y.close || x.self !== y.self) { errs.push(`${where}: znacznik <${y.close ? '/' : ''}${y.name}>`); break; }
    const ka = x.attrs.map(([k]) => k).join(' ');
    const kb = y.attrs.map(([k]) => k).join(' ');
    if (ka !== kb) { errs.push(`${where}: atrybuty [${kb}], oczekiwano [${ka}]`); continue; }
    const metaName = x.name === 'meta' ? (attr(x, 'name') ?? attr(x, 'property')) : null;
    for (let k = 0; k < x.attrs.length; k++) {
      const [key, va] = x.attrs[k];
      const vb = y.attrs[k][1];
      const at = `${where} @${key}`;
      const urlish = URL_ATTRS.has(key) || (key === 'content' && (metaName === 'og:url' || metaName === 'og:image'));
      if (!urlish && !IDENT_ATTRS.has(key)) { const r = residue(vb); if (r) res.push(`@${key} ${r}`); }
      if (x.name === 'html' && key === 'lang') { if (vb !== 'en') errs.push(`${at}: «${vb}», oczekiwano «en»`); continue; }
      if (metaName === 'og:locale' && key === 'content') { if (vb !== 'en_US') errs.push(`${at}: «${vb}», oczekiwano «en_US»`); continue; }
      const textual = TEXT_ATTRS.has(key) || (key === 'content' && TEXT_META.has(metaName));
      if (textual) {
        if (isBlank(va) !== isBlank(vb)) errs.push(`${at}: ${isBlank(vb) ? 'opróżniony' : 'wypełniony'}`);
        if (!isBlank(vb) && va === vb) same.push(`@${key} ${vb}`);
        continue;
      }
      if (urlish) {
        for (const m of String(vb ?? '').matchAll(/\/_astro\/[^\s,"']+/g)) assets.push(m[0].replace(/[?#].*$/, ''));
        const want = assetless(mapUrl(va, urlMap));
        if (assetless(vb) !== want) errs.push(`${at}: «${vb}», oczekiwano «${want}»`);
        continue;
      }
      if (va !== vb) errs.push(`${at}: «${String(vb).slice(0, 60)}», oczekiwano «${String(va).slice(0, 60)}»`);
    }
  }
  return { errs, res, same, assets };
}

// ─── CSS i .htaccess ─────────────────────────────────────────────────────

/**
 * Żetony CSS: nagłówek reguły (`sel{`, `@layer x{`), deklaracja (`prop:val`,
 * bez średnika) i `}`. Średniki odpadają — dopisana po ostatniej deklaracji
 * zmienna nie zmienia żetonu tej ostatniej.
 */
// Komentarze zdejmuje się przed cięciem (runda 2, C1: komentarz połykał
// deklaracje «przed»); cudzysłów we wstawce — odmowa (C2: napis rozcinał reguły).
const cssTokens = (css) => (css.replace(/\/\*[\s\S]*?\*\//g, '').match(/[^{};]+\{|[^{};]+(?=[;}])|\}/g) ?? []).map((s) => s.trim()).filter(Boolean);
const TW_VAR = (t) => /^--tw-[\w-]+:/.test(t);
const TW_DESCRIPTOR = (t) => /^(syntax|inherits|initial-value):/.test(t);

/**
 * «Przed» jest podciągiem «po»; wstawki — tylko reguły nowych klas (nieużytych
 * w HTML «po» i nieznanych CSS «przed»), `@property --tw-*` i zmienne `--tw-*`.
 * Wstawiona deklaracja poza wstawioną regułą — odmowa (nowa własność starej
 * reguły). Zwraca listę zarzutów (pusta — w porządku).
 */
export function cssOnlyAddsDeadRules(cssA, cssB, usedClasses) {
  const a = cssTokens(cssA);
  const b = cssTokens(cssB);
  const selA = new Set([...cssA.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]));
  const errs = [];
  let ia = 0;
  // Stos otwartych reguł: własne («przed») i wstawione. Wewnątrz wstawionej
  // nic nie jest «swoje» — inaczej przypadkowa równość (np. `}` wstawki tuż
  // przed `}` warstwy) zjadłaby żeton «przed».
  const stack = [];
  const inInserted = () => stack.some((s) => s.ins);
  // Zmienna --tw-* poza wstawką — tylko w regule `*` warstwy `@layer properties`.
  const inTwProperties = () => stack.length >= 2 && !inInserted() && /^\*/.test(stack[stack.length - 1].h) && stack.some((s) => /^@layer properties\s*\{$/.test(s.h));
  for (const t of b) {
    if (!inInserted() && ia < a.length && t === a[ia]) {
      ia++;
      if (t.endsWith('{')) stack.push({ h: t, ins: false });
      else if (t === '}') stack.pop();
      continue;
    }
    // Cudzysłów wolno tylko w deskryptorze wstawionego @property (`syntax:"*"`,
    // `initial-value:""`) i bez `{};` w środku — inaczej napis może rozciąć reguły.
    const inProperty = inInserted() && /^@property/.test(stack.findLast((s) => s.ins).h);
    if (/["']/.test(t) && !(inProperty && TW_DESCRIPTOR(t) && !/["'][^"']*[{};][^"']*["']/.test(t))) {
      errs.push(`CSS: cudzysłów we wstawce: «${t.slice(0, 80)}»`);
      continue;
    }
    if (t.endsWith('{')) {
      stack.push({ h: t, ins: true });
      if (/^@property\s+--tw-[\w-]+\s*\{$/.test(t)) continue;
      const classes = [...t.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]);
      const rest = t.replace(/\.(-?[A-Za-z_][\w-]*)/g, '').replace(/[\s{,]/g, '');
      if (!classes.length || rest || classes.some((c) => selA.has(c) || usedClasses.has(c))) {
        errs.push(`CSS: wstawiona reguła nie jest martwą regułą nowej klasy: «${t.slice(0, 80)}»`);
      }
      continue;
    }
    if (t === '}') {
      if (stack.length && stack[stack.length - 1].ins) stack.pop();
      else errs.push('CSS: wstawione «}» poza wstawioną regułą');
      continue;
    }
    if (inInserted()) {
      const top = stack.findLast((s) => s.ins);
      if (/^@property/.test(top.h) && !TW_DESCRIPTOR(t)) errs.push(`CSS: w @property nie deskryptor: «${t.slice(0, 80)}»`);
      continue;
    }
    if (TW_VAR(t) && inTwProperties()) continue;
    errs.push(`CSS: wstawiona deklaracja w regule «przed»: «${t.slice(0, 80)}»`);
  }
  if (ia < a.length) errs.unshift(`CSS: żeton «przed» bez odpowiednika «po»: «${a[ia].slice(0, 80)}»`);
  return errs;
}

/**
 * `.htaccess` (runda 2: kolejność się liczy — reguły między warunkami hosta
 * a ich regułą zapętlają serwis). Linie «przed» idą w «po» w tej samej
 * kolejności; wstawić wolno tylko puste linie, komentarze i dokładnie reguły
 * 301 z karty — każdą raz, między `RewriteEngine On` a pierwszym `RewriteCond`.
 */
export function htaccessErrs(textA, textB, urlMap) {
  const errs = [];
  const a = textA.split(/\r?\n/);
  const b = textB.split(/\r?\n/);
  const rules = new Set([...urlMap].map(([from, to]) => `RewriteRule ^${from.slice(1, -1)}/?$ ${SITE}${to} [R=301,L]`));
  const found = new Set();
  let ia = 0;
  let engineOn = false;
  let condSeen = false;
  for (const line of b) {
    if (ia < a.length && line === a[ia]) {
      ia++;
      if (/^\s*RewriteEngine\s+On\b/i.test(line)) engineOn = true;
      if (/^\s*RewriteCond\b/.test(line)) condSeen = true;
      continue;
    }
    const t = line.trim();
    if (t === '' || t.startsWith('#')) continue;
    if (rules.has(t)) {
      if (found.has(t)) errs.push(`.htaccess: reguła dwa razy «${t}»`);
      if (!engineOn || condSeen) errs.push(`.htaccess: reguła poza miejscem (między RewriteEngine On a pierwszym RewriteCond) «${t}»`);
      found.add(t);
      continue;
    }
    errs.push(`.htaccess: wstawiona linia spoza reguł 301 z karty «${t.slice(0, 80)}»`);
  }
  if (ia < a.length) errs.push(`.htaccess: linia «przed» zniknęła albo zmieniła miejsce «${a[ia].trim().slice(0, 80)}»`);
  for (const r of rules) if (!found.has(r)) errs.push(`.htaccess: brak reguły «${r}»`);
  return errs;
}

// ─── сверка двух сборок ───────────────────────────────────────────────────

const walkDir = (dir) => {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walkDir(p));
    else out.push(p);
  }
  return out;
};

const pageUrl = (rel) => {
  const r = rel.replace(/\\/g, '/');
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return `/${r.slice(0, -'index.html'.length)}`;
  return null;
};

export function compareDists(distA, distB, urlMap) {
  const report = { pages: 0, errs: [], res: [], eyes: [], same: new Map() };
  const assets = new Set();
  const filesA = walkDir(distA).map((p) => relative(distA, p).replace(/\\/g, '/'));
  const filesB = walkDir(distB).map((p) => relative(distB, p).replace(/\\/g, '/'));
  const targets = [...urlMap.values()];
  if (new Set(targets).size !== targets.length) report.errs.push('karta adresów: dwa stare adresy na jeden nowy');

  // 1 — strony
  const pagesA = filesA.filter((f) => pageUrl(f));
  const pagesB = new Set(filesB.filter((f) => pageUrl(f)).map((f) => pageUrl(f)));
  const seen = new Set();
  const used = new Set();
  for (const f of pagesA) {
    const ua = pageUrl(f);
    const ub = urlMap.get(ua) ?? ua;
    seen.add(ub);
    if (!pagesB.has(ub)) { report.errs.push(`${ua}: brak strony ${ub} po tłumaczeniu`); continue; }
    const relB = ub === '/' ? 'index.html' : `${ub.slice(1)}index.html`;
    const htmlB = readFileSync(join(distB, relB), 'utf8');
    for (const c of classesOf(htmlB)) used.add(c);
    const { errs, res, same, assets: refs } = comparePage(readFileSync(join(distA, f), 'utf8'), htmlB, urlMap);
    report.pages++;
    for (const e of errs) report.errs.push(`${ub} ${e}`);
    for (const r of res) report.res.push(`${ub} ${r}`);
    for (const s of same) report.same.set(s, (report.same.get(s) ?? 0) + 1);
    for (const x of refs) assets.add(x);
  }
  for (const u of pagesB) if (!seen.has(u)) report.errs.push(`${u}: strona, której przed tłumaczeniem nie było`);
  // Nazwy /_astro/ porównuje się bez skrótu — więc każdy adres «po» musi mieć
  // swój plik w dist «po» (runda 2: link na zmienioną nazwę gubił style).
  const setB = new Set(filesB);
  for (const x of assets) if (!setB.has(x.slice(1))) report.errs.push(`${x}: adres z HTML «po» bez pliku w dist «po»`);

  // 6 — reszta plików, po nazwie bez skrótu; liczba plików na nazwę równa
  const group = (files) => { const m = new Map(); for (const f of files) if (!pageUrl(f)) { const k = unhash(f); m.set(k, [...(m.get(k) ?? []), f]); } return m; };
  const gA = group(filesA);
  const gB = group(filesB);
  for (const [k, list] of gA) {
    const other = gB.get(k) ?? [];
    if (other.length !== list.length) { report.errs.push(`${k}: plików przed ${list.length}, po ${other.length}`); continue; }
    list.forEach((fa, n) => {
      const fb = other[n];
      const a = readFileSync(join(distA, fa));
      const b = readFileSync(join(distB, fb));
      if (/^sitemap.*\.xml$/.test(fa)) {
        const locs = (buf) => [...buf.toString('utf8').matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
        if (locs(a).map((u) => mapUrl(u, urlMap)).sort().join('\n') !== locs(b).sort().join('\n')) report.errs.push(`${fa}: adresy mapy różnią się od adresów «przed» po karcie`);
        return;
      }
      if (fa === '.htaccess') { report.errs.push(...htaccessErrs(a.toString('utf8'), b.toString('utf8'), urlMap)); return; }
      if (a.equals(b)) return;
      if (/\.css$/.test(fa)) { report.errs.push(...cssOnlyAddsDeadRules(a.toString('utf8'), b.toString('utf8'), used).map((e) => `${fa} → ${fb}: ${e}`)); if (!report.eyes.includes(fa)) report.eyes.push(`${fa} → ${fb} (tylko martwe reguły nowych klas)`); return; }
      if (/\.js$/.test(fa)) { report.eyes.push(`${fa} → ${fb}`); return; }
      report.errs.push(`${fa}: inne bajty (${fb}) — tłumaczenie nie zmienia fontów, obrazów ani robots.txt`);
    });
  }
  for (const [k, list] of gB) if (!gA.has(k)) report.errs.push(`${list.join(', ')}: nowy plik po tłumaczeniu`);
  return report;
}

export function readUrlMap() {
  const decl = JSON.parse(readFileSync(join(root, 'structure/pages-s2.json'), 'utf8'));
  const map = new Map();
  for (const p of decl['страницы']) {
    const was = p['прежний_url'];
    if (!was) continue;
    if (map.has(was)) throw new Error(`прежний_url «${was}» dwa razy`);
    map.set(was, p.url);
  }
  return map;
}

// ─── пробы судьи ──────────────────────────────────────────────────────────

function selftest() {
  const map = new Map([['/stary/', '/new/']]);
  const base = (o = {}) => `<!doctype html><html lang="${o.lang ?? 'pl'}"><head><title>${o.title ?? 'Tytuł'}</title>` +
    `<meta name="description" content="${o.desc ?? 'Opis strony'}"><meta property="og:locale" content="${o.loc ?? 'pl_PL'}">` +
    `<link rel="canonical" href="${o.canon ?? `${SITE}/stary/`}"><link rel="stylesheet" href="/_astro/a.${o.hash ?? 'AAAAAAAA'}.css">` +
    `<script type="application/ld+json">${o.ld ?? `{"@type":"BreadcrumbList","itemListElement":[{"name":"Główna","item":"${SITE}/stary/"}]}`}</script>` +
    `<style>${o.css ?? '.a{color:red}'}</style></head>` +
    `<body><main id="${o.id ?? 'tresc'}"><h2 class="${o.cls ?? 'x'}">${o.h2 ?? 'Nagłówek'}</h2>` +
    `${o.drop ? '' : `<p>${o.p ?? 'Akapit po polsku'}</p>`}<img src="/_astro/a.png" alt="${o.alt ?? 'Opis kadru'}">` +
    `<a href="${o.href ?? '/stary/#s'}">${o.a ?? 'Link'}</a>${o.gap ?? ' '}<a href="/x/">${o.a2 ?? 'Drugi'}</a>` +
    `<span data-note="${o.data ?? 'x'}"></span>${o.extra ?? ''}</main></body></html>`;
  const en = (o = {}) => base({ lang: 'en', title: 'Title', desc: 'Page description', loc: 'en_US', canon: `${SITE}/new/`,
    ld: `{"@type":"BreadcrumbList","itemListElement":[{"name":"Home","item":"${SITE}/new/"}]}`, h2: 'Heading', p: 'An English paragraph',
    alt: 'Frame description', href: '/new/#s', a: 'Link', a2: 'Second', ...o });
  const pl = base();
  const cases = [
    ['tłumaczenie czyste przechodzi', en(), 0, 0],
    ['inny skrót CSS w linku przechodzi', en({ hash: 'BBBBBBBB' }), 0, 0],
    ['klasa zmieniona', en({ cls: 'y' }), 1, 0],
    ['id zmienione', en({ id: 'content' }), 1, 0],
    ['akapit wypadł', en({ drop: true }), 1, 0],
    ['tekst opróżniony', en({ p: ' ' }), 1, 0],
    ['tekst z samego U+200B', en({ p: '​' }), 1, 0],
    ['słowa sklejone (odstęp wypadł)', en({ gap: '' }), 1, 0],
    ['element dodany', en({ extra: '<span>x</span>' }), 1, 0],
    ['link na stary adres', en({ href: '/stary/#s' }), 1, 0],
    ['link na stary adres innym hostem', en({ href: 'https://ac4bf-thewatch.com/stary/' }), 1, 0],
    ['kotwica zmieniona', en({ href: '/new/#t' }), 1, 0],
    ['canonical nie po karcie', en({ canon: `${SITE}/stary/` }), 1, 0],
    ['lang zostaje pl', en({ lang: 'pl' }), 1, 0],
    ['og:locale zostaje pl_PL', en({ loc: 'pl_PL' }), 1, 0],
    ['CSS zmieniony', en({ css: '.a{color:blue}' }), 1, 0],
    ['JSON-LD adres nie po karcie', en({ ld: `{"@type":"BreadcrumbList","itemListElement":[{"name":"Home","item":"${SITE}/stary/"}]}` }), 1, 0],
    ['JSON-LD name nie tekst', en({ ld: `{"@type":"BreadcrumbList","itemListElement":[{"name":7,"item":"${SITE}/new/"}]}` }), 1, 0],
    ['alt opróżniony', en({ alt: '' }), 1, 0],
    ['polski tekst został', en({ p: 'Akapit się nie przetłumaczył' }), 0, 1],
    ['polskie słowo bez liter', en({ p: 'Ezio i Altair' }), 0, 1],
    ['«ó» bez innych liter', en({ p: 'Film Rodowód' }), 0, 1],
    ['polskie słowo wielką literą', en({ h2: 'Werdykt' }), 0, 1],
    ['«Nie ma takiej strony»', en({ title: 'Nie ma takiej strony' }), 0, 1],
    ['polski alt został', en({ alt: 'Opis kadru z łodzią' }), 0, 1],
    ['polski data-* został', en({ data: 'Strona gry' }), 1, 1],
    ['polska nazwa w JSON-LD', en({ ld: `{"@type":"BreadcrumbList","itemListElement":[{"name":"Strona główna","item":"${SITE}/new/"}]}` }), 0, 1],
    ['wyjątek Toruń przechodzi', en({ alt: 'The Toruń portrait' }), 0, 0],
    ['Koh-i-Noor, Core i5, «I», «A» to nie polski', en({ p: 'I saw A Koh-i-Noor on a Core i5 laptop' }), 0, 0],
    ['polskie «w» przed kropką', en({ p: 'Gra wyszła w.' }), 0, 1],
  ];
  let bad = 0;
  const say = (ok, name, info) => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'ŹLE '} ${name.padEnd(42)} ${info}`); };
  for (const [name, html, wantErr, wantRes] of cases) {
    const { errs, res } = comparePage(pl, html, map);
    const ok = (errs.length > 0) === (wantErr > 0) && (res.length > 0) === (wantRes > 0);
    say(ok, name, `błędów ${errs.length}, polskiego ${res.length}${ok ? '' : ` — ${[...errs, ...res].join(' | ') || 'nic'}`}`);
  }
  // id i class po polsku, niezmienione (П76 p. 2) — nie są resztką
  const ids = comparePage(base({ id: 'werdykt', cls: 'wydania' }), en({ id: 'werdykt', cls: 'wydania' }), map);
  say(ids.errs.length === 0 && ids.res.length === 0, 'polskie id i class bez zmian nie są resztką', `błędów ${ids.errs.length}, polskiego ${ids.res.length}`);
  // mapUrl
  const m = mapUrl(`/_astro/a.webp 640w, ${SITE}/stary/ 2x`, map);
  say(m === `/_astro/a.webp 640w, ${SITE}/new/ 2x`, 'srcset i adres bezwzględny', m);
  say(mapUrl('/stary', map) === '/new', 'adres bez końcowego ukośnika', mapUrl('/stary', map));
  say(mapUrl('//www.ac4bf-thewatch.com/stary/', map) === '//www.ac4bf-thewatch.com/new/', 'adres //host', mapUrl('//www.ac4bf-thewatch.com/stary/', map));
  // CSS
  const cssA = '@layer properties{*{--tw-a:initial}}.a{color:red}.b{margin:0}';
  const dead = '@layer properties{*{--tw-a:initial;--tw-shadow:0 0 #0000}}.a{color:red}.fixed{position:fixed}.b{margin:0}';
  say(cssOnlyAddsDeadRules(cssA, dead, new Set(['a', 'b'])).length === 0, 'CSS: martwa reguła nowej klasy i --tw-*', 'przechodzi');
  say(cssOnlyAddsDeadRules(cssA, dead, new Set(['a', 'b', 'fixed'])).length > 0, 'CSS: nowa klasa użyta w HTML', 'odmowa');
  say(cssOnlyAddsDeadRules(cssA, '@layer properties{*{--tw-a:initial}}.a{color:red;margin:1px}.b{margin:0}', new Set()).length > 0, 'CSS: deklaracja wstawiona do starej reguły', 'odmowa');
  say(cssOnlyAddsDeadRules(cssA, '@layer properties{*{--tw-a:initial}}.a{color:blue}.b{margin:0}', new Set()).length > 0, 'CSS: zmieniona wartość', 'odmowa');
  say(cssOnlyAddsDeadRules(cssA, '@layer properties{*{--tw-a:initial}}.a{color:red}.b{margin:0}main .x{color:red}', new Set()).length > 0, 'CSS: nowa reguła nie-klasowa', 'odmowa');
  say(cssOnlyAddsDeadRules(cssA, '@layer properties{*{--tw-a:initial}}.a{color:red}.a.fixed{position:fixed}.b{margin:0}', new Set()).length > 0, 'CSS: nowa reguła ze starą klasą', 'odmowa');
  // .htaccess
  const hA = 'RewriteEngine On\nErrorDocument 404 /404/index.html';
  const hB = `RewriteEngine On\nRewriteRule ^stary/?$ ${SITE}/new/ [R=301,L]\nErrorDocument 404 /404/index.html`;
  say(htaccessErrs(hA, hB, map).length === 0, '.htaccess: reguła jest, nic nie znikło', 'przechodzi');
  say(htaccessErrs(hA, 'RewriteEngine On\nErrorDocument 404 /404/index.html', map).length > 0, '.htaccess: brak reguły 301', 'odmowa');
  say(htaccessErrs(hA, `RewriteEngine On\nRewriteRule ^stary/?$ ${SITE}/new/ [R=301,L]`, map).length > 0, '.htaccess: zniknął ErrorDocument', 'odmowa');
  // Runda 2 «sędziego sądzą»: obejścia CSS, kolejność .htaccess, sklejanie, encje
  const bodyA = 'body{background:var(--bg);color:var(--ink)}html.m{overflow:hidden}';
  const layerA = '@layer properties{*{--tw-a:initial}}.a{color:red}';
  const cssBad = (name, a, b) => say(cssOnlyAddsDeadRules(a, b, new Set()).length > 0, `CSS: ${name}`, 'odmowa');
  cssBad('komentarz połyka deklarację (C1)', bodyA, 'body{background:var(--bg);--tw-q:0/*;color:var(--ink);--tw-r:*/}html.m{overflow:hidden}');
  cssBad('napis rozcina reguły (C2)', bodyA, 'body{background:var(--bg);color:var(--ink)}.zzdead{--x:0"}html.m{overflow:hidden}.zz2{"}');
  cssBad('--tw-* w zwykłej regule', layerA, '@layer properties{*{--tw-a:initial}}.a{color:red;--tw-x:1}');
  cssBad('nie-tw zmienna w warstwie properties', layerA, '@layer properties{*{--tw-a:initial;--x:1}}.a{color:red}');
  cssBad('luźne «}»', layerA, `${layerA}}`);
  cssBad('wstawiony nagłówek @media', layerA, `${layerA}@media (min-width:1px){.fixed{position:fixed}}`);
  cssBad('reguła «przed» usunięta', layerA, '@layer properties{*{--tw-a:initial}}');
  say(cssOnlyAddsDeadRules(layerA, `${layerA}@property --tw-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}`, new Set()).length === 0, 'CSS: @property z syntax:"*"', 'przechodzi');
  const hBase = `RewriteEngine On\nRewriteCond %{HTTPS} !=on\nRewriteRule ^ - [E=X:1]\nErrorDocument 404 /404/index.html`;
  const rule = `RewriteRule ^stary/?$ ${SITE}/new/ [R=301,L]`;
  const hBad = (name, b) => say(htaccessErrs(hBase, b, map).length > 0, `.htaccess: ${name}`, 'odmowa');
  say(htaccessErrs(hBase, `RewriteEngine On\n# komentarz\n${rule}\nRewriteCond %{HTTPS} !=on\nRewriteRule ^ - [E=X:1]\nErrorDocument 404 /404/index.html`, map).length === 0, '.htaccess: reguła na miejscu z komentarzem', 'przechodzi');
  hBad('reguła po RewriteCond', `RewriteEngine On\nRewriteCond %{HTTPS} !=on\n${rule}\nRewriteRule ^ - [E=X:1]\nErrorDocument 404 /404/index.html`);
  hBad('linie «przed» w innej kolejności', `RewriteEngine On\n${rule}\nRewriteRule ^ - [E=X:1]\nRewriteCond %{HTTPS} !=on\nErrorDocument 404 /404/index.html`);
  hBad('wstawione 302', `RewriteEngine On\nRewriteRule ^x$ /y [R=302,L]\n${rule}\nRewriteCond %{HTTPS} !=on\nRewriteRule ^ - [E=X:1]\nErrorDocument 404 /404/index.html`);
  hBad('dopisany ErrorDocument', `RewriteEngine On\n${rule}\nRewriteCond %{HTTPS} !=on\nRewriteRule ^ - [E=X:1]\nErrorDocument 404 /404/index.html\nErrorDocument 404 /index.html`);
  const glued = comparePage('<p>Gra <em>Unity</em> jest</p>', '<p>The<em>Unity</em>game</p>', map);
  say(glued.errs.length > 0, 'sklejenie na granicy znacznika', `błędów ${glued.errs.length}`);
  const spaced = comparePage('<p>Gra <em>Unity</em> jest</p>', '<p>The <em>Unity</em> game</p>', map);
  say(spaced.errs.length === 0, 'odstępy na granicy zachowane', `błędów ${spaced.errs.length}`);
  say(comparePage('<p>Tekst</p>', '<p>&shy;&ZeroWidthSpace;</p>', map).errs.length > 0, 'tekst z &shy; i &ZeroWidthSpace;', 'odmowa');
  say(comparePage('<p>Tekst</p>', '<p>Film Rodow&oacute;d</p>', map).res.length > 0, 'encja &oacute; to polska litera', 'resztka');
  say(residue('i.e. an escape pod, pale ale, lat. 42') === null, 'i.e., pod, ale, lat. to nie polski', String(residue('i.e. an escape pod, pale ale, lat. 42')));
  say(residue('Ostatnie teksty') !== null && residue('1868 · Londyn') !== null, 'słownik: «Ostatnie teksty», «Londyn»', 'resztka');
  // compareDists na dwóch małych dist w katalogu tymczasowym
  const tmp = mkdtempSync(join(tmpdir(), 'markup-diff-'));
  const write = (dir, files) => { for (const [f, c] of Object.entries(files)) { mkdirSync(dirname(join(dir, f)), { recursive: true }); writeFileSync(join(dir, f), c); } };
  const page = (lang, text, href, css) => `<!doctype html><html lang="${lang}"><head><link rel="stylesheet" href="/_astro/s.${css}.css"></head><body><main><p>${text}</p><a href="${href}">x</a></main></body></html>`;
  const sm = (u) => `<urlset><url><loc>${SITE}/</loc></url><url><loc>${SITE}${u}</loc></url></urlset>`;
  const distA = { 'index.html': page('pl', 'Akapit', '/stary/', 'AAAAAAAA'), 'stary/index.html': page('pl', 'Akapit', '/', 'AAAAAAAA'), '_astro/s.AAAAAAAA.css': '.a{color:red}', 'sitemap-0.xml': sm('/stary/') };
  const distB = () => ({ 'index.html': page('en', 'Paragraph', '/new/', 'BBBBBBBB'), 'new/index.html': page('en', 'Paragraph', '/', 'BBBBBBBB'), '_astro/s.BBBBBBBB.css': '.a{color:red}', 'sitemap-0.xml': sm('/new/') });
  let n = 0;
  const run = (b, m = map) => { const da = join(tmp, `a${n}`); const db = join(tmp, `b${n++}`); write(da, distA); write(db, b); return compareDists(da, db, m); };
  try {
    say(run(distB()).errs.length === 0, 'dist: czyste tłumaczenie', 'przechodzi');
    const dangling = distB(); dangling['_astro/s.CCCCCCCC.css'] = dangling['_astro/s.BBBBBBBB.css']; delete dangling['_astro/s.BBBBBBBB.css'];
    say(run(dangling).errs.some((e) => e.includes('bez pliku')), 'dist: link /_astro/ bez pliku (D5-b)', 'odmowa');
    const twin = distB(); twin['_astro/s.DDDDDDDD.css'] = '.b{}';
    say(run(twin).errs.some((e) => e.includes('plików przed')), 'dist: drugi plik o tej samej nazwie (D5)', 'odmowa');
    say(run(distB(), new Map([['/stary/', '/new/'], ['/inny/', '/new/']])).errs.some((e) => e.includes('dwa stare')), 'dist: dwa stare adresy na jeden', 'odmowa');
    const staleMap = distB(); staleMap['sitemap-0.xml'] = sm('/stary/');
    say(run(staleMap).errs.some((e) => e.includes('mapy')), 'dist: sitemap ze starym adresem', 'odmowa');
    const extra = distB(); extra['inna/index.html'] = page('en', 'Paragraph', '/', 'BBBBBBBB');
    say(run(extra).errs.some((e) => e.includes('nie było')), 'dist: strona, której nie było', 'odmowa');
    const missing = distB(); delete missing['new/index.html'];
    say(run(missing).errs.some((e) => e.includes('brak strony')), 'dist: brak strony', 'odmowa');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  const extraProbes = 8 + 5 + 6 + 7;
  console.log(`\n${cases.length + 13 + extraProbes - bad}/${cases.length + 13 + extraProbes} prób`);
  return bad === 0;
}

// ─── wejście ──────────────────────────────────────────────────────────────

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--selftest')) process.exit(selftest() ? 0 : 1);
  const [distA, distB] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!distA || !distB || !existsSync(distA) || !existsSync(distB)) {
    console.error('użycie: node tools/markup-diff.mjs <dist-przed> <dist-po> | --selftest');
    process.exit(2);
  }
  const urlMap = readUrlMap();
  console.log(`karta adresów (pages-s2.json, прежний_url): ${urlMap.size}`);
  for (const [a, b] of urlMap) console.log(`  ${a} → ${b}`);
  const r = compareDists(distA, distB, urlMap);
  for (const e of r.errs.slice(0, 60)) console.log(`ŹLE  ${e}`);
  if (r.errs.length > 60) console.log(`… i ${r.errs.length - 60} więcej`);
  for (const e of r.res.slice(0, 60)) console.log(`PL   ${e}`);
  if (r.res.length > 60) console.log(`… i ${r.res.length - 60} więcej`);
  for (const e of r.eyes) console.log(`oko  ${e} — inne bajty, do obejrzenia`);
  // Napisy równe «przed» na tej samej pozycji: heurystyka resztek łapie ~90 %
  // polskiego, nieprzetłumaczony krótki podpis bez polskich liter i słów trafia
  // tutaj. Nie zawodzi budowania — przyjmujący czyta listę (nazwy własne,
  // platformy, podpisy Commons są tu z prawa).
  const same = [...r.same].sort((x, y) => y[1] - x[1]);
  console.log(`\nrówne «przed» (do przeczytania): ${same.length}`);
  if (process.argv.includes('--same')) for (const [s, n] of same) console.log(`  ${String(n).padStart(3)}  ${s.slice(0, 100)}`);
  else console.log('  pełna lista: --same');
  console.log(`\nstron ${r.pages}, rozbieżności ${r.errs.length}, resztek polskiego ${r.res.length}, plików do obejrzenia ${r.eyes.length}, równych «przed» ${same.length}`);
  process.exit(r.errs.length || r.res.length ? 1 : 0);
}
