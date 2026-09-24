#!/usr/bin/env node
/**
 * Иконки сайта из знака (сессия 11, П83 и дополнение: знак — «Семёрка из
 * трассы», фавикон — из того же рисунка, с `favicon.ico`).
 *
 * Источник один — `src/data/znak.json`: рисунок шапки (его рисует
 * `src/components/Znak.astro`), иконка на сетке 32 и пиксельная иконка
 * на сетке 16; краска каждой части — ИМЯ токена темы. Значения красок
 * инструмент берёт из `src/styles/global.css`, поэтому литералы в файлах
 * иконок равны токенам по построению, а не по памяти.
 *
 *   node tools/znak.mjs            — пишет в public/ шесть файлов (ниже)
 *   node tools/znak.mjs --check    — ничего не пишет; exit 1 при любом отказе:
 *     1) краска — токен темы: каждое её объявление в `global.css` вне
 *        комментариев — ровно `#rrggbb`, и все объявления одного имени равны
 *        (токен в комментарии — не токен; `rgb()`, `var()`, `#rgb`,
 *        `!important` — отказ с этой причиной, а не «не токен»);
 *     2) гарнитура — тема: `global.css` грузит `@fontsource/bodoni-moda/latin-600.css`,
 *        `--font-display` начинается с 'Bodoni Moda'; файл контуров — woff
 *        из `@font-face` этого листа (normal, 600), а не поле данных; контур
 *        каждой надписи равен пересчёту из него по `size`, `track`, `x`, `y`;
 *     3) имя — подпись: буквы надписей подряд равны буквам `site.znak`
 *        (`src/data/site.ts`) без цифр и пробелов, заглавными: видимое имя
 *        знака и подпись ссылки знака — одно имя (WCAG 2.5.3);
 *     4) файлы: в `public/` ровно шесть файлов, и каждый ПОБАЙТНО равен тому,
 *        что инструмент написал бы сейчас (при расхождении PNG и ICO сказано,
 *        равны ли пиксели: «пиксели те же» — файл перекодирован или получил
 *        чанки, «пиксели другие» — другой рисунок);
 *     5) `<head>` `src/layouts/Base.astro` (без фронтматтера, HTML-комментариев
 *        и выражений `{…}`): ссылки на иконки — ровно шесть ожидаемых тегов
 *        `<link>` с `rel`, `href`, `type`, `sizes`, иных иконок нет;
 *        с `--dist` — то же в `<head>` собранного `dist/index.html`.
 *   node tools/znak.mjs --selftest — отрицательные и положительные пробы
 *     сверки на мутациях настоящих входов в памяти (ничего не пишет).
 *
 * ФАЙЛЫ: `favicon.svg` (вкладку Chromium рисует из него), `favicon.ico`
 * (16 и 32 в одном файле, PNG внутри — для клиентов, которые просят
 * `/favicon.ico` сами), `favicon-16x16.png` и `favicon-32x32.png` (запасные
 * для браузеров без SVG-иконок), `icon-192.png` (ярлык Android),
 * `apple-touch-icon.png` (180, домашний экран iOS; углы скругляет система).
 * 16 px — свой рисунок по пиксельной сетке (`ikona16`), остальные — `ikona`.
 *
 * ПРЕДЕЛЫ (названы): контуры считает `fontkitten` — зависимость Astro, а не
 * сайта; пропадёт из дерева — проверка 2 упадёт громко. Кернинга у контуров
 * нет (fontkitten без раскладки) — ни у эскиза, ни у пересчёта: проверка 2
 * ловит дрейф данных от гарнитуры, а не ошибку самого способа. PNG растрирует
 * `sharp` (librsvg), не браузер; побайтная сверка держится на версии sharp —
 * смена версии даст громкий отказ проверки 4, лечится `npm run znak`
 * с просмотром иконок. Как знак рисует браузер (каскад, обводка «TH»,
 * принудительные цвета) сверка не судит — это `wiernosc.mjs` доклада сессии 11
 * и приёмка глазами. `theme-color` в `<head>` со `--bg` не сверяется.
 * В сборку и гейты сверка не входит: включить её — решение владельца.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(join(siteRoot, 'package.json'));
const sharp = require('sharp');
const fk = await import(pathToFileURL(require.resolve('fontkitten')).href);

const IMPORT_GARNITURY = '@fontsource/bodoni-moda/latin-600.css';
const PLIKI = ['favicon.svg', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'icon-192.png', 'apple-touch-icon.png'];
const LINKI = [
  { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'icon', href: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
  { rel: 'icon', href: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
  { rel: 'icon', href: '/icon-192.png', type: 'image/png', sizes: '192x192' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
];

// ── Разбор CSS ───────────────────────────────────────────────────────────
/** Снимает комментарии CSS, не трогая строк в кавычках (как `bezKomentarzy` гейта контраста ядра). */
export function bezKomentarzyCss(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'") {
      const j = s.indexOf(c, i + 1);
      const k = j < 0 ? s.length : j + 1;
      out += s.slice(i, k);
      i = k - 1;
    } else if (c === '/' && s[i + 1] === '*') {
      const j = s.indexOf('*/', i + 2);
      i = j < 0 ? s.length : j + 1;
    } else out += c;
  }
  return out;
}
/** Все объявления `--имя: значение` вне комментариев: имя → [значения]. */
export function deklaracje(css) {
  const m = new Map();
  // Объявление начинается после `{`, `;` или пробела: `.x--accent:hover` в селекторе — не объявление.
  for (const d of bezKomentarzyCss(css).matchAll(/(?:^|[{;\s])--([a-zA-Z0-9-]+)\s*:\s*([^;}]*)/g)) {
    const [, imie, wartosc] = d;
    if (!m.has(imie)) m.set(imie, []);
    m.get(imie).push(wartosc.trim());
  }
  return m;
}
function kraska(dekl, imie, gdzie, bledy) {
  const w = dekl.get(imie);
  if (!w) { bledy.push(`${gdzie}: краска «${imie}» — не токен src/styles/global.css (объявления --${imie} вне комментариев нет)`); return '#ff00ff'; }
  const zle = w.filter((v) => !/^#[0-9a-f]{6}$/i.test(v));
  if (zle.length) { bledy.push(`${gdzie}: токен --${imie} объявлен не как #rrggbb: ${zle.map((v) => `«${v}»`).join(', ')} — иконки не могут взять его значение`); return '#ff00ff'; }
  const rozne = [...new Set(w.map((v) => v.toLowerCase()))];
  if (rozne.length > 1) { bledy.push(`${gdzie}: токен --${imie} объявлен с разными значениями: ${rozne.join(', ')}`); return '#ff00ff'; }
  return rozne[0];
}

// ── Разбор <head> ────────────────────────────────────────────────────────
/** Текст `<head>` страницы без HTML-комментариев; для .astro — без фронтматтера и выражений `{…}`. */
export function glowa(tekst, astro) {
  let s = tekst;
  if (astro) {
    const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(s);
    if (m) s = s.slice(m[0].length);
  }
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  if (astro) {
    let out = '';
    let gl = 0;
    for (const c of s) {
      if (c === '{') gl++;
      else if (c === '}') gl = Math.max(0, gl - 1);
      else if (!gl) out += c;
    }
    s = out;
  }
  const a = s.search(/<head[\s>]/i);
  const b = s.search(/<\/head>/i);
  return a < 0 || b < a ? null : s.slice(a, b);
}
export function linkiIkon(head) {
  const out = [];
  for (const t of head.matchAll(/<link\b([^>]*)>/gi)) {
    const at = {};
    for (const a of t[1].matchAll(/([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) at[a[1].toLowerCase()] = a[2] ?? a[3];
    if (/(^|\s)(icon|apple-touch-icon|shortcut|mask-icon)(\s|$)/i.test(at.rel ?? '')) out.push(at);
  }
  return out;
}
function sverkaLinkov(head, gdzie, bledy) {
  if (head === null) { bledy.push(`${gdzie}: <head> не найден`); return; }
  const jest = linkiIkon(head);
  const klucz = (l) => ['rel', 'href', 'type', 'sizes'].map((k) => `${k}=${l[k] ?? ''}`).join(' ');
  const jestK = jest.map(klucz);
  for (const l of LINKI) {
    if (!jestK.includes(klucz(l))) bledy.push(`${gdzie}: в <head> нет <link ${klucz(l)}>`);
  }
  const ozhid = LINKI.map(klucz);
  for (const k of jestK) if (!ozhid.includes(k)) bledy.push(`${gdzie}: лишняя иконка в <head>: <link ${k}>`);
}

// ── Рисунки и файлы ──────────────────────────────────────────────────────
function ikonaSvg(ik, farba) {
  const s = ik.siatka;
  const rows = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}"${ik.prostokaty ? ' shape-rendering="crispEdges"' : ''}>`];
  rows.push(`  <rect width="${s}" height="${s}" fill="${farba(ik.tlo, `иконка ${s}, фон`)}"/>`);
  for (const c of ik.czesci ?? []) rows.push(`  <polygon points="${c.points}" fill="${farba(c.farba, `иконка ${s}, ${c.opis}`)}"/>`);
  for (const p of ik.prostokaty ?? []) rows.push(`  <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${farba(p.farba, `иконка ${s}`)}"/>`);
  rows.push('</svg>', '');
  return rows.join('\n');
}
const png = (svg, siatka, size) =>
  sharp(Buffer.from(svg), { density: (72 * size) / siatka }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
// ICO с PNG внутри (Windows Vista+ и все браузеры): заголовок, записи, данные.
function ico(obrazy) {
  const head = Buffer.alloc(6 + 16 * obrazy.length);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(obrazy.length, 4);
  let offset = head.length;
  obrazy.forEach(([size, buf], i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(size >= 256 ? 0 : size, e);
    head.writeUInt8(size >= 256 ? 0 : size, e + 1);
    head.writeUInt8(0, e + 2);
    head.writeUInt8(0, e + 3);
    head.writeUInt16LE(1, e + 4);
    head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(buf.length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  return Buffer.concat([head, ...obrazy.map(([, b]) => b)]);
}
async function piksele(buf) {
  try {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return `${info.width}x${info.height}:${data.toString('base64')}`;
  } catch { return null; }
}
async function pikseleIco(buf) {
  try {
    const n = buf.readUInt16LE(4);
    const out = [];
    for (let i = 0; i < n; i++) {
      const e = 6 + 16 * i;
      out.push(await piksele(buf.subarray(buf.readUInt32LE(e + 12), buf.readUInt32LE(e + 12) + buf.readUInt32LE(e + 8))));
    }
    return out.join('|');
  } catch { return null; }
}

/**
 * Сверка — чистая функция над входами (для --check и --selftest).
 * @param w { css, znak, base, dist?, siteTs, fontCss, fontBuf, publiczne: Map<имя, Buffer> | null }
 * @returns { bledy, pliki: Map<имя, Buffer> }
 */
export async function sverka(w) {
  const bledy = [];
  const dekl = deklaracje(w.css);
  const farba = (imie, gdzie) => kraska(dekl, imie, gdzie, bledy);

  // 1–2. Гарнитура — тема; контуры — из неё.
  const cssBez = bezKomentarzyCss(w.css);
  if (!cssBez.includes(`@import '${IMPORT_GARNITURY}'`) && !cssBez.includes(`@import "${IMPORT_GARNITURY}"`)) {
    bledy.push(`гарнитура: global.css не грузит ${IMPORT_GARNITURY} — буквы знака не стоят на гарнитуре темы`);
  }
  const fd = dekl.get('font-display');
  if (!fd || !fd.every((v) => /^['"]Bodoni Moda['"]/.test(v))) bledy.push(`гарнитура: --font-display не начинается с 'Bodoni Moda' (${fd ? fd.join(' | ') : 'нет'})`);
  const ff = [...w.fontCss.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]).find((b) => /font-style:\s*normal/.test(b) && /font-weight:\s*600/.test(b));
  const woff = ff && /url\(\.\/files\/([^)]+\.woff)\)/.exec(ff);
  if (!woff) bledy.push(`гарнитура: в ${IMPORT_GARNITURY} нет @font-face normal 600 с woff`);
  if (w.fontPlik && woff && w.fontPlik !== woff[1]) bledy.push(`гарнитура: контуры считаются из ${w.fontPlik}, а тема грузит ${woff[1]}`);
  const napisy = w.znak.shapka.napisy ?? [];
  if (!napisy.length) bledy.push('надписи: у знака нет надписей — имя знака не нарисовано');
  if (w.fontBuf) {
    const font = fk.create(w.fontBuf);
    for (const n of napisy) {
      if ('font' in n) bledy.push(`надпись «${n.tekst}»: поле font не читается — гарнитура знака берётся из темы (${IMPORT_GARNITURY})`);
      const s = n.size / font.unitsPerEm;
      let x = n.x;
      const czesci = [];
      for (const ch of n.tekst) {
        const g = font.glyphForCodePoint(ch.codePointAt(0));
        const d = g.path.scale(s, -s).translate(x, n.y).toSVG();
        if (d) czesci.push(d);
        x += g.advanceWidth * s + n.track * n.size;
      }
      if (czesci.join('') !== n.d) bledy.push(`надпись «${n.tekst}»: контур в znak.json не равен пересчёту из гарнитуры темы (size ${n.size}, track ${n.track}, x ${n.x}, y ${n.y})`);
    }
  }
  for (const c of w.znak.shapka.czesci) farba(c.farba, `шапка, ${c.opis}`);
  for (const n of napisy) farba(n.farba, `шапка, надпись «${n.tekst}»`);

  // 3. Имя — подпись.
  const znakSite = /znak:\s*'([^']+)'/.exec(w.siteTs);
  if (!znakSite) bledy.push('имя: в src/data/site.ts нет site.znak');
  else {
    const litery = znakSite[1].replace(/[\d\s]/g, '').toUpperCase();
    const narysowane = napisy.map((n) => n.tekst).join('');
    if (litery !== narysowane) bledy.push(`имя: надписи знака «${narysowane}» не равны буквам site.znak «${znakSite[1]}» (${litery}) — видимое имя и подпись ссылки разошлись`);
  }

  // 4. Файлы.
  const svg32 = ikonaSvg(w.znak.ikona, farba);
  const svg16 = ikonaSvg(w.znak.ikona16, farba);
  const p16 = await png(svg16, 16, 16);
  const p32 = await png(svg32, 32, 32);
  const pliki = new Map([
    ['favicon.svg', Buffer.from(svg32)],
    ['favicon.ico', ico([[16, p16], [32, p32]])],
    ['favicon-16x16.png', p16],
    ['favicon-32x32.png', p32],
    ['icon-192.png', await png(svg32, 32, 192)],
    ['apple-touch-icon.png', await png(svg32, 32, 180)],
  ]);
  if (w.publiczne) {
    for (const imie of w.publiczne.keys()) if (!pliki.has(imie)) bledy.push(`public/${imie}: лишний файл — в public/ только иконки знака`);
    for (const [imie, nowy] of pliki) {
      const stary = w.publiczne.get(imie);
      if (!stary) { bledy.push(`public/${imie}: файла нет — npm run znak`); continue; }
      if (stary.equals(nowy)) continue;
      if (imie.endsWith('.svg')) { bledy.push(`public/${imie}: отстал от src/data/znak.json и токенов — npm run znak`); continue; }
      const f = imie.endsWith('.ico') ? pikseleIco : piksele;
      const [a, b] = [await f(stary), await f(nowy)];
      bledy.push(`public/${imie}: байты не равны тому, что пишет инструмент; ${a === null ? 'файл не читается как ' + (imie.endsWith('.ico') ? 'ICO с PNG' : 'PNG') : a === b ? 'пиксели те же (перекодирован, чанки или каталог)' : 'пиксели другие (другой рисунок)'} — npm run znak`);
    }
  }

  // 5. <head>.
  sverkaLinkov(glowa(w.base, true), 'src/layouts/Base.astro', bledy);
  if (w.dist !== undefined) sverkaLinkov(w.dist === null ? null : glowa(w.dist, false), 'dist/index.html', bledy);

  return { bledy, pliki };
}

// ── Входы с диска ────────────────────────────────────────────────────────
function wejscie({ dist = false } = {}) {
  const fontCssPath = require.resolve(IMPORT_GARNITURY);
  const fontCss = readFileSync(fontCssPath, 'utf8');
  const ff = [...fontCss.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]).find((b) => /font-style:\s*normal/.test(b) && /font-weight:\s*600/.test(b));
  const woff = ff && /url\(\.\/files\/([^)]+\.woff)\)/.exec(ff);
  const pub = join(siteRoot, 'public');
  const publiczne = existsSync(pub) ? new Map(readdirSync(pub).map((f) => [f, readFileSync(join(pub, f))])) : new Map();
  const distPath = join(siteRoot, 'dist', 'index.html');
  return {
    css: readFileSync(join(siteRoot, 'src/styles/global.css'), 'utf8'),
    znak: JSON.parse(readFileSync(join(siteRoot, 'src/data/znak.json'), 'utf8')),
    base: readFileSync(join(siteRoot, 'src/layouts/Base.astro'), 'utf8'),
    siteTs: readFileSync(join(siteRoot, 'src/data/site.ts'), 'utf8'),
    fontCss,
    fontPlik: woff ? woff[1] : null,
    fontBuf: woff ? readFileSync(join(dirname(fontCssPath), 'files', woff[1])) : null,
    publiczne,
    ...(dist ? { dist: existsSync(distPath) ? readFileSync(distPath, 'utf8') : null } : {}),
  };
}

// ── Самопроверка ─────────────────────────────────────────────────────────
function crc32(buf) {
  let c = ~0;
  for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ~c >>> 0;
}
function sGama(pngBuf) {
  const dane = Buffer.alloc(4); dane.writeUInt32BE(100000);
  const typ = Buffer.from('gAMA');
  const len = Buffer.alloc(4); len.writeUInt32BE(4);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typ, dane])));
  return Buffer.concat([pngBuf.subarray(0, 33), len, typ, dane, crc, pngBuf.subarray(33)]);
}
async function selftest() {
  const baza = wejscie();
  const { pliki } = await sverka({ ...baza, publiczne: null });
  const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
  const proby = [
    ['чистые входы', (w) => w, null],
    ['токен только в комментарии', (w) => { w.css += '\n/* было: --glow: #ffffff; */'; w.znak.shapka.napisy[1].farba = 'glow'; return w; }, 'не токен'],
    ['поздний не-hex токен', (w) => { w.css += '\n:root { --accent: rgb(255 0 0); }'; return w; }, 'не как #rrggbb'],
    ['поздний #rgb', (w) => { w.css += '\n:root { --accent: #f00; }'; return w; }, 'не как #rrggbb'],
    ['поздний #rrggbb с другим значением', (w) => { w.css += '\n:root { --accent: #ff0000; }'; return w; }, 'разными значениями'],
    ['!important', (w) => { w.css += '\n:root { --accent: #eca84a !important; }'; return w; }, 'не как #rrggbb'],
    ['другое значение только в комментарии', (w) => { w.css += '\n/* прежде --accent: #ff0000; */'; return w; }, null],
    ['тема грузит Бодони 400', (w) => { w.css = w.css.split(`'${IMPORT_GARNITURY}'`).join("'@fontsource/bodoni-moda/latin-400.css'"); return w; }, 'не грузит'],
    ['--font-display — другая гарнитура', (w) => { w.css = w.css.replace(/--font-display:\s*'Bodoni Moda'/, "--font-display: 'Playfair Display'"); return w; }, "не начинается с 'Bodoni Moda'"],
    ['контуры считаются из другого файла', (w) => { w.fontPlik = 'bodoni-moda-latin-700-normal.woff'; return w; }, 'а тема грузит'],
    ['поле font в данных', (w) => { w.znak.shapka.napisy[0].font = 'x.woff'; return w; }, 'поле font не читается'],
    ['контур надписи правлен', (w) => { w.znak.shapka.napisy[0].d = w.znak.shapka.napisy[0].d.replace('26.9', '27.9'); return w; }, 'не равен пересчёту'],
    ['параметр надписи правлен', (w) => { w.znak.shapka.napisy[1].track = 0.11; return w; }, 'не равен пересчёту'],
    ['надписей нет', (w) => { w.znak.shapka.napisy = []; return w; }, 'нет надписей'],
    ['имя не равно site.znak', (w) => { w.siteTs = w.siteTs.replace("znak: '7th Serpent'", "znak: '7th Snake'"); return w; }, 'не равны буквам site.znak'],
    ['SVG под именем PNG', (w) => { w.publiczne.set('favicon-32x32.png', pliki.get('favicon.svg')); return w; }, 'favicon-32x32.png: байты'],
    ['PNG с чанком gAMA', (w) => { w.publiczne.set('apple-touch-icon.png', sGama(pliki.get('apple-touch-icon.png'))); return w; }, 'пиксели те же'],
    ['ICO: тип записи правлен', (w) => { const b = Buffer.from(pliki.get('favicon.ico')); b.writeUInt16LE(2, 2); w.publiczne.set('favicon.ico', b); return w; }, 'favicon.ico: байты'],
    ['ICO: высота записи правлена', (w) => { const b = Buffer.from(pliki.get('favicon.ico')); b.writeUInt8(0, 7); w.publiczne.set('favicon.ico', b); return w; }, 'favicon.ico: байты'],
    ['лишний файл в public/', (w) => { w.publiczne.set('logo.png', pliki.get('icon-192.png')); return w; }, 'лишний файл'],
    ['файла нет', (w) => { w.publiczne.delete('icon-192.png'); return w; }, 'файла нет'],
    ['ссылка в HTML-комментарии', (w) => { w.base = w.base.replace(/(<link rel="icon" href="\/favicon.svg"[^>]*>)/, '<!-- $1 -->'); return w; }, 'нет <link rel=icon href=/favicon.svg'],
    ['ссылка в выражении-комментарии', (w) => { w.base = w.base.replace(/(<link rel="icon" href="\/favicon.svg"[^>]*>)/, '{/* $1 */}'); return w; }, 'нет <link rel=icon href=/favicon.svg'],
    ['ссылка под {false && …}', (w) => { w.base = w.base.replace(/(<link rel="icon" href="\/favicon.svg"[^>]*>)/, '{false && $1}'); return w; }, 'нет <link rel=icon href=/favicon.svg'],
    ['чужой rel', (w) => { w.base = w.base.replace('<link rel="icon" href="/favicon-32x32.png"', '<link rel="alternate" href="/favicon-32x32.png"'); return w; }, 'нет <link rel=icon href=/favicon-32x32.png'],
    ['ссылки в <body>', (w) => { const m = w.base.match(/\s*<link rel="(icon|apple-touch-icon)"[^>]*>/g); for (const l of m) w.base = w.base.replace(l, ''); w.base = w.base.replace('<body>', '<body>' + m.join('')); return w; }, 'нет <link'],
    ['href только во фронтматтере', (w) => { const m = w.base.match(/\s*<link rel="(icon|apple-touch-icon)"[^>]*>/g); for (const l of m) w.base = w.base.replace(l, ''); w.base = w.base.replace('/**', '/** href="/favicon.svg" href="/favicon.ico"'); return w; }, 'нет <link'],
    ['чужая иконка', (w) => { w.base = w.base.replace('<link rel="apple-touch-icon"', '<link rel="icon" href="https://example.com/x.png" />\n    <link rel="apple-touch-icon"'); return w; }, 'лишняя иконка'],
    ['dist без иконок', (w) => { w.dist = '<html><head><title>x</title></head><body></body></html>'; return w; }, 'dist/index.html: в <head> нет'],
  ];
  let zle = 0;
  for (const [nazwa, mut, zhdem] of proby) {
    const { bledy } = await sverka(mut(czyste()));
    const ok = zhdem === null ? bledy.length === 0 : bledy.some((b) => b.includes(zhdem));
    if (!ok) zle++;
    console.log(`${ok ? 'ok ' : 'НЕТ'}  ${nazwa}: ждём ${zhdem === null ? 'сверено' : `отказ «${zhdem}»`}, факт ${bledy.length ? `отказ (${bledy.length}): ${bledy[0]}` : 'сверено'}`);
  }
  console.log(`\nznak --selftest: ${proby.length - zle}/${proby.length} проб`);
  if (zle) process.exit(1);
}

// ── Запуск ───────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const CHECK = process.argv.includes('--check');
  try {
    if (process.argv.includes('--selftest')) {
      await selftest();
    } else {
      const w = wejscie({ dist: process.argv.includes('--dist') });
      const { bledy, pliki } = await sverka({ ...w, publiczne: CHECK ? w.publiczne : null });
      if (!CHECK) {
        const zle = bledy.filter((b) => !b.startsWith('src/layouts') && !b.startsWith('dist/'));
        if (zle.length) throw Object.assign(new Error('не пишу: входы с отказом'), { bledy: zle });
        const pub = join(siteRoot, 'public');
        mkdirSync(pub, { recursive: true });
        for (const [imie, buf] of pliki) writeFileSync(join(pub, imie), buf);
      }
      if (bledy.length) {
        console.error(`znak: ОТКАЗ — ${bledy.length}`);
        for (const b of bledy) console.error(`  - ${b}`);
        process.exit(1);
      }
      const d = deklaracje(w.css);
      const kolory = [...new Set([w.znak.ikona.tlo, ...w.znak.ikona.czesci.map((c) => c.farba)])].map((t) => `${t} ${d.get(t)?.[0]}`).join(', ');
      console.log(`znak: ${CHECK ? 'сверено' : 'записано'} — ${pliki.size} файлов public/ (${[...pliki.keys()].join(', ')}); надписей ${w.znak.shapka.napisy.length} — контуры равны ${w.fontPlik}; имя = site.znak; ссылки в <head>${w.dist !== undefined ? ' и в dist/index.html' : ''}; краски: ${kolory}`);
    }
  } catch (e) {
    console.error(`znak: ОТКАЗ — ${e.message}`);
    for (const b of e.bledy ?? []) console.error(`  - ${b}`);
    process.exit(1);
  }
}
