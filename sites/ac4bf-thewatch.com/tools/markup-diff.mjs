#!/usr/bin/env node
/**
 * Сверка «разметка равна до текста» — приёмка перевода сайта (П73 п. 3).
 *
 *   node tools/markup-diff.mjs <dist-до> <dist-после>   — сверка двух сборок
 *   node tools/markup-diff.mjs --selftest               — пробы судьи
 *
 * Перевод меняет текст и ничего больше. Инструмент берёт сборку до перевода
 * и после и требует, чтобы на каждой странице совпало всё, кроме текста:
 *
 *   1. Набор страниц: каждая страница «до» есть «после» по карте адресов,
 *      лишних нет. Карта — поле `прежний_url` в `structure/pages-s2.json`
 *      (единственный источник; тот же читает `check-live` для 301).
 *   2. Поток тегов: имена, порядок, вложенность, атрибуты (имена и порядок).
 *      Значения атрибутов равны, кроме:
 *        • текстовых (`alt`, `title`, `aria-label`, `placeholder`, `content`
 *          у `<meta>` описания и og:title/og:description) — меняются, но пустое
 *          остаётся пустым, непустое непустым;
 *        • адресных (`href`, `src`, `srcset`, `content` у og:url) — равны
 *          после карты адресов;
 *        • `lang` у `<html>` — обязан стать `en`; `og:locale` — `en_US`.
 *   3. Текст: сам текст не сравнивается, но непустой узел остаётся непустым
 *      и пустой пустым — выпавший абзац или подпись видны.
 *   4. `<style>` и обычные `<script>` — байт в байт; JSON-LD — та же форма,
 *      строки `name` меняются, адреса равны по карте.
 *   5. Остаток польского во «после»: видимый текст и текстовые атрибуты
 *      без польских букв (ąćęłńśźż) и без польских служебных слов;
 *      исключения — `ALLOW` ниже, каждое с доводом.
 *   6. Прочие файлы: CSS, шрифты, картинки — те же байты (имя без хеша);
 *      `robots.txt` — те же байты; адреса sitemap — равны по карте;
 *      отличающиеся JS и `.htaccess` печатаются списком для глаз.
 *
 * Код возврата ≠ 0 при любом расхождении пунктов 1–6 (кроме списка «для глаз»).
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.ac4bf-thewatch.com';

/** Исключения остатка польского: подстрока → довод. */
const ALLOW = new Map([
  ['Toruń', 'имя собственное: «Toruń portrait» — английское название портрета Коперника'],
]);

const TEXT_ATTRS = new Set(['alt', 'title', 'aria-label', 'placeholder']);
const TEXT_META = new Set(['description', 'og:title', 'og:description']);
const URL_ATTRS = new Set(['href', 'src', 'srcset', 'action', 'poster']);
const POLISH_LETTERS = /[ąćęłńśźżĄĆĘŁŃŚŹŻ]/;
// Слово — между пробелами или пунктуацией, не внутри «Koh-i-Noor» и «Core i5».
const POLISH_WORDS =
  /(?:^|[\s(„“"])(się|jest|oraz|który|która|które|że|dla|albo|także|też|tylko|już|lub|gdzie|kiedy|jako|przez|jego|jej|ich|nie|na|od|po|za|w|z|i)(?=$|[\s,.;:!?)”"])/u;

// ─── разбор HTML ──────────────────────────────────────────────────────────

const decode = (s) =>
  s
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

export function mapUrl(value, urlMap) {
  if (typeof value !== 'string') return value;
  const one = (u) => {
    let prefix = '';
    let rest = u;
    if (rest.startsWith(SITE)) { prefix = SITE; rest = rest.slice(SITE.length); }
    if (!rest.startsWith('/')) return u;
    const cut = rest.search(/[?#]/);
    const path = cut < 0 ? rest : rest.slice(0, cut);
    const tail = cut < 0 ? '' : rest.slice(cut);
    return prefix + (urlMap.get(path) ?? path) + tail;
  };
  return value.split(/(,\s*)/).map((part) => (/^,\s*$/.test(part) ? part : part.replace(/^(\S+)/, (m) => one(m)))).join('');
}

// ─── сверка одной страницы ────────────────────────────────────────────────

const attr = (tok, k) => tok.attrs?.find(([a]) => a === k)?.[1];
const isBlank = (s) => !s || !s.replace(/[\s ]/g, '');

function residue(s) {
  if (!s) return null;
  let t = s;
  for (const k of ALLOW.keys()) t = t.split(k).join('');
  if (POLISH_LETTERS.test(t)) return `polska litera: «${s.trim().slice(0, 90)}»`;
  const w = POLISH_WORDS.exec(t);
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
        if (isBlank(b[k])) errs.push(`JSON-LD ${path}.name: pusty`);
        continue;
      }
      jsonShape(a[k], b[k], urlMap, `${path}.${k}`, errs);
    }
    return;
  }
  if (typeof a === 'string' && mapUrl(a, urlMap) !== b) errs.push(`JSON-LD ${path}: «${b}», oczekiwano «${mapUrl(a, urlMap)}»`);
  else if (typeof a !== 'string' && a !== b) errs.push(`JSON-LD ${path}: ${b} ≠ ${a}`);
}

export function comparePage(htmlA, htmlB, urlMap) {
  const errs = [];
  const res = [];
  const A = tokenize(htmlA).filter((t) => t.t !== 'comment');
  const B = tokenize(htmlB).filter((t) => t.t !== 'comment');
  // Tekst: tylko obecność. Sąsiednie tokeny tekstowe już są jednym tokenem.
  const shape = (toks) => toks.filter((t) => t.t !== 'text' || !isBlank(decode(t.v)));
  const a = shape(A);
  const b = shape(B);
  // Остаток польского — по всем текстовым узлам «после», включая пробельные соседей.
  for (const t of B) {
    if (t.t === 'text') { const r = residue(decode(t.v)); if (r) res.push(r); }
  }
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i];
    const y = b[i];
    const where = `#${i} ${x ? (x.t === 'tag' ? `<${x.close ? '/' : ''}${x.name}>` : x.t) : '—'}`;
    if (!x || !y) { errs.push(`${where}: strumień się skończył z jednej strony (przed ${a.length}, po ${b.length})`); break; }
    if (x.t !== y.t) { errs.push(`${where}: rodzaj ${x.t} → ${y.t}${y.t === 'text' ? ` «${decode(y.v).trim().slice(0, 50)}»` : y.t === 'tag' ? ` <${y.name}>` : ''}`); break; }
    if (x.t === 'doctype' && x.v !== y.v) errs.push(`${where}: doctype`);
    if (x.t === 'raw') {
      const type = attr(x, 'type');
      if (x.of === 'script' && type === 'application/ld+json') {
        try { jsonShape(JSON.parse(x.v), JSON.parse(y.v), urlMap, '', errs); } catch (e) { errs.push(`${where}: JSON-LD nie parsuje się (${e.message})`); }
        try {
          const walk = (o) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'name' && typeof v === 'string') { const r = residue(v); if (r) res.push(`JSON-LD ${r}`); } else walk(v); } };
          walk(JSON.parse(y.v));
        } catch { /* już zgłoszone */ }
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
      if (x.name === 'html' && key === 'lang') { if (vb !== 'en') errs.push(`${at}: «${vb}», oczekiwano «en»`); continue; }
      if (metaName === 'og:locale' && key === 'content') { if (vb !== 'en_US') errs.push(`${at}: «${vb}», oczekiwano «en_US»`); continue; }
      const textual = TEXT_ATTRS.has(key) || (key === 'content' && TEXT_META.has(metaName));
      if (textual) {
        if (isBlank(va) !== isBlank(vb)) errs.push(`${at}: ${isBlank(vb) ? 'opróżniony' : 'wypełniony'}`);
        const r = residue(vb);
        if (r) res.push(`@${key} ${r}`);
        continue;
      }
      const urlish = URL_ATTRS.has(key) || (key === 'content' && metaName === 'og:url');
      if (urlish) {
        const want = mapUrl(va, urlMap);
        if (vb !== want) errs.push(`${at}: «${vb}», oczekiwano «${want}»`);
        continue;
      }
      if (va !== vb) errs.push(`${at}: «${String(vb).slice(0, 60)}», oczekiwano «${String(va).slice(0, 60)}»`);
    }
  }
  return { errs, res };
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
const unhash = (rel) => rel.replace(/\\/g, '/').replace(/\.[A-Za-z0-9_-]{8}\.([a-z0-9]+)$/, '.*.$1');

export function compareDists(distA, distB, urlMap) {
  const report = { pages: 0, errs: [], res: [], eyes: [] };
  const filesA = walkDir(distA).map((p) => relative(distA, p));
  const filesB = walkDir(distB).map((p) => relative(distB, p));
  const setB = new Set(filesB.map((f) => f.replace(/\\/g, '/')));

  // 1 — strony
  const pagesA = filesA.filter((f) => pageUrl(f));
  const pagesB = new Set(filesB.filter((f) => pageUrl(f)).map((f) => pageUrl(f)));
  const seen = new Set();
  for (const f of pagesA) {
    const ua = pageUrl(f);
    const ub = urlMap.get(ua) ?? ua;
    seen.add(ub);
    if (!pagesB.has(ub)) { report.errs.push(`${ua}: brak strony ${ub} po tłumaczeniu`); continue; }
    const relB = ub === '/' ? 'index.html' : `${ub.slice(1)}index.html`;
    const { errs, res } = comparePage(readFileSync(join(distA, f), 'utf8'), readFileSync(join(distB, relB), 'utf8'), urlMap);
    report.pages++;
    for (const e of errs) report.errs.push(`${ub} ${e}`);
    for (const r of res) report.res.push(`${ub} ${r}`);
  }
  for (const u of pagesB) if (!seen.has(u)) report.errs.push(`${u}: strona, której przed tłumaczeniem nie było`);

  // 6 — reszta plików
  const byUnhashB = new Map(filesB.map((f) => [unhash(f), f]));
  for (const f of filesA) {
    if (pageUrl(f)) continue;
    const rel = f.replace(/\\/g, '/');
    if (/^sitemap.*\.xml$/.test(rel)) {
      if (!setB.has(rel)) { report.errs.push(`${rel}: brak`); continue; }
      const locs = (p) => [...readFileSync(p, 'utf8').matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
      const want = locs(join(distA, f)).map((u) => mapUrl(u, urlMap)).sort().join('\n');
      const got = locs(join(distB, f)).sort().join('\n');
      if (want !== got) report.errs.push(`${rel}: adresy mapy różnią się od adresów «przed» po karcie`);
      continue;
    }
    const g = byUnhashB.get(unhash(f));
    if (!g) { report.errs.push(`${rel}: brak po tłumaczeniu`); continue; }
    const same = readFileSync(join(distA, f)).equals(readFileSync(join(distB, g)));
    if (same) continue;
    if (/\.js$/.test(rel) || rel === '.htaccess') report.eyes.push(`${rel} → ${g.replace(/\\/g, '/')}`);
    else report.errs.push(`${rel}: inne bajty (${g.replace(/\\/g, '/')}) — tłumaczenie nie zmienia CSS, fontów ani obrazów`);
  }
  const unA = new Set(filesA.map(unhash));
  for (const f of filesB) if (!pageUrl(f) && !unA.has(unhash(f))) report.errs.push(`${f.replace(/\\/g, '/')}: nowy plik po tłumaczeniu`);
  return report;
}

export function readUrlMap() {
  const decl = JSON.parse(readFileSync(join(root, 'structure/pages-s2.json'), 'utf8'));
  const map = new Map();
  for (const p of decl['страницы']) if (p['прежний_url']) map.set(p['прежний_url'], p.url);
  return map;
}

// ─── пробы судьи ──────────────────────────────────────────────────────────

function selftest() {
  const map = new Map([['/stary/', '/new/']]);
  const base = (o = {}) => `<!doctype html><html lang="${o.lang ?? 'pl'}"><head><title>${o.title ?? 'Tytuł'}</title>` +
    `<meta name="description" content="${o.desc ?? 'Opis strony'}"><meta property="og:locale" content="${o.loc ?? 'pl_PL'}">` +
    `<link rel="canonical" href="${o.canon ?? `${SITE}/stary/`}">` +
    `<script type="application/ld+json">${o.ld ?? `{"@type":"BreadcrumbList","itemListElement":[{"name":"Główna","item":"${SITE}/stary/"}]}`}</script>` +
    `<style>${o.css ?? '.a{color:red}'}</style></head>` +
    `<body><main id="${o.id ?? 'tresc'}"><h2 class="${o.cls ?? 'x'}">${o.h2 ?? 'Nagłówek'}</h2>` +
    `${o.drop ? '' : `<p>${o.p ?? 'Akapit po polsku'}</p>`}<img src="/_astro/a.png" alt="${o.alt ?? 'Opis kadru'}">` +
    `<a href="${o.href ?? '/stary/#s'}">${o.a ?? 'Link'}</a>${o.extra ?? ''}</main></body></html>`;
  const en = (o = {}) => base({ lang: 'en', title: 'Title', desc: 'Page description', loc: 'en_US', canon: `${SITE}/new/`,
    ld: `{"@type":"BreadcrumbList","itemListElement":[{"name":"Home","item":"${SITE}/new/"}]}`, h2: 'Heading', p: 'An English paragraph',
    alt: 'Frame description', href: '/new/#s', a: 'Link', ...o });
  const pl = base();
  const cases = [
    ['tłumaczenie czyste przechodzi', en(), 0, 0],
    ['klasa zmieniona', en({ cls: 'y' }), 1, 0],
    ['id zmienione', en({ id: 'content' }), 1, 0],
    ['akapit wypadł', en({ drop: true }), 1, 0],
    ['tekst opróżniony', en({ p: ' ' }), 1, 0],
    ['element dodany', en({ extra: '<span>x</span>' }), 1, 0],
    ['link na stary adres', en({ href: '/stary/#s' }), 1, 0],
    ['kotwica zmieniona', en({ href: '/new/#t' }), 1, 0],
    ['canonical nie po karcie', en({ canon: `${SITE}/stary/` }), 1, 0],
    ['lang zostaje pl', en({ lang: 'pl' }), 1, 0],
    ['og:locale zostaje pl_PL', en({ loc: 'pl_PL' }), 1, 0],
    ['CSS zmieniony', en({ css: '.a{color:blue}' }), 1, 0],
    ['JSON-LD adres nie po karcie', en({ ld: `{"@type":"BreadcrumbList","itemListElement":[{"name":"Home","item":"${SITE}/stary/"}]}` }), 1, 0],
    ['alt opróżniony', en({ alt: '' }), 1, 0],
    ['polski tekst został', en({ p: 'Akapit się nie przetłumaczył' }), 0, 1],
    ['polskie słowo bez liter', en({ p: 'Ezio i Altair' }), 0, 1],
    ['polski alt został', en({ alt: 'Opis kadru z łodzią' }), 0, 1],
    ['polska nazwa w JSON-LD', en({ ld: `{"@type":"BreadcrumbList","itemListElement":[{"name":"Strona główna","item":"${SITE}/new/"}]}` }), 0, 1],
    ['wyjątek Toruń przechodzi', en({ alt: 'The Toruń portrait' }), 0, 0],
    ['Koh-i-Noor i Core i5 to nie polski', en({ p: 'The Koh-i-Noor on a Core i5 laptop' }), 0, 0],
    ['polskie «w» przed kropką', en({ p: 'Gra wyszła w.' }), 0, 1],
  ];
  let bad = 0;
  for (const [name, html, wantErr, wantRes] of cases) {
    const { errs, res } = comparePage(pl, html, map);
    const ok = (errs.length > 0) === (wantErr > 0) && (res.length > 0) === (wantRes > 0);
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'ŹLE '} ${name.padEnd(34)} błędów ${errs.length}, polskiego ${res.length}${ok ? '' : ` — ${[...errs, ...res].join(' | ') || 'nic'}`}`);
  }
  // mapUrl: srcset i adres bezwzględny
  const m = mapUrl(`/_astro/a.webp 640w, ${SITE}/stary/ 2x`, map);
  const mOk = m === `/_astro/a.webp 640w, ${SITE}/new/ 2x`;
  if (!mOk) bad++;
  console.log(`${mOk ? 'ok  ' : 'ŹLE '} ${'srcset i adres bezwzględny'.padEnd(34)} ${m}`);
  console.log(`\n${cases.length + 1 - bad}/${cases.length + 1} prób`);
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
  console.log(`\nstron ${r.pages}, rozbieżności znaczników ${r.errs.length}, resztek polskiego ${r.res.length}, plików do obejrzenia ${r.eyes.length}`);
  process.exit(r.errs.length || r.res.length ? 1 : 0);
}
