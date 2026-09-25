#!/usr/bin/env node
/**
 * Иконки сайта из знака (сессия 11, П83 и дополнение: знак — «Семёрка из
 * трассы», фавикон — из того же рисунка, с `favicon.ico`).
 *
 * Источник один — `src/data/znak.json`: три рисунка одного знака — шапка
 * (её рисует `src/components/Znak.astro`), иконка на сетке 32 и пиксельная
 * иконка на сетке 16; краска каждой части — ИМЯ токена темы. Значения красок
 * инструмент берёт из `src/styles/global.css`, поэтому литералы в файлах
 * иконок равны токенам по построению, а не по памяти.
 *
 *   node tools/znak.mjs            — пишет в public/ шесть файлов (ниже);
 *                                    при отказе проверок 0–2 не пишет ничего
 *   node tools/znak.mjs --check    — ничего не пишет; exit 1 при любом отказе:
 *     0) лист читается целиком: разбор — токенайзером CSS (комментарии, строки
 *        с экранированием, url() без кавычек, экранирование вне строк,
 *        вложенность блоков). Всё, чего разбор не понимает, — громкий отказ,
 *        а не пропуск: текст вне блока на верхнем уровне (браузер склеил бы
 *        его с селектором следующего правила и выбросил правило), объявление
 *        с нечитаемым именем (экранирование в имени, `--font-*`), лишняя «}»
 *        на верхнем уровне, незакрытый блок;
 *     1) краска — токен темы: имя объявлено в верхнем блоке `:root { … }`
 *        `global.css` (селектор ровно `:root`; его и получает компонент через
 *        `var()`), каждое объявление там — ровно `#rrggbb`, все равны, и больше
 *        нигде в листе (другие селекторы, `@media`, `@layer`, `@theme`) это имя
 *        не объявлено; токен в комментарии или строке — не токен;
 *     2) гарнитура — тема: среди операторов верхнего уровня `global.css` есть
 *        ровно `@import '@fontsource/bodoni-moda/latin-600.css';` (без условий
 *        media и supports, не в блоке), своей `@font-face` для 'Bodoni Moda'
 *        в листе нет, а `--font-display` объявлен только в верхнем `@theme`
 *        (голом, `inline` или `static`; `@theme reference` в CSS не выходит)
 *        и начинается с 'Bodoni Moda'; файл контуров — woff из `@font-face`
 *        листа гарнитуры (normal, 600); контур каждой надписи равен пересчёту
 *        из него по `size`, `track`, `x`, `y`;
 *     3) файлы: иконочных имён в `public/` (`favicon*`, `icon-*`,
 *        `apple-touch-icon*`, `*.webmanifest`) ровно шесть, каждое — обычный
 *        файл, и каждый ПОБАЙТНО равен тому, что инструмент написал бы сейчас;
 *        прочие имена `public/` (например, `robots.txt`) не читаются и не
 *        судятся. Диагноз расхождения: PNG — «не PNG» по сигнатуре, иначе те же
 *        ли пиксели; ICO — «не ICO» по заголовку, «каталог ICO другой» (число
 *        и размеры записей), иначе те же ли пиксели каждой записи; SVG — текст.
 *     С `--dist` — то же для иконочных имён `dist/` (сборка не отстала от иконок).
 *   node tools/znak.mjs --selftest — пробы сверки на мутациях настоящих входов
 *     в памяти (ничего не пишет). Проба проходит, только если отказ есть
 *     и КАЖДАЯ его строка — ожидаемого вида (или отказа нет у пробы «сверено»):
 *     проба не засчитывается по чужой причине.
 *
 * Что сверка НЕ судит и кто судит это (судья собранной страницы в браузере —
 * `docs/reports/2026-09-24-7thserpent-znak/instrumenty/wiernosc.mjs`): как знак
 * рисует браузер (каскад, обводка «TH», принудительные цвета, знак = одобренный
 * эскиз A), ссылки иконок в `<head>` собранной страницы и запросы браузера,
 * подписи ссылки знака и картинки подвала против видимого имени. Листы,
 * которые `global.css` импортирует (ядро, `tailwindcss`, `@fontsource`), сверка
 * не читает: переопределение токена там видит только судья в браузере
 * (краска частей знака = литералы иконки).
 *
 * ФАЙЛЫ: `favicon.svg` (вкладку Chromium 151 с окном рисует из него — доказано
 * цветом, `vkladka-dowod.mjs` доклада), `favicon.ico` (16 и 32, PNG внутри),
 * `favicon-16x16.png` и `favicon-32x32.png`, `icon-192.png`,
 * `apple-touch-icon.png` (180). Назначение ICO, PNG, 192 и 180 — клиентам,
 * которые берут `/favicon.ico` сами, браузерам без SVG-иконок, ярлыку Android
 * и домашнему экрану iOS (углы скругляет система); кроме Chromium 151 это
 * не проверялось (бэклог 60 п. 4). 16 px — свой рисунок по пиксельной сетке
 * (`ikona16`), остальные — `ikona`.
 *
 * ПРЕДЕЛЫ (названы): контуры считает `fontkitten` — зависимость Astro, а не
 * сайта; пропадёт из дерева — инструмент не запустится ни в каком режиме
 * (ошибка импорта Node, а не отказ сверки). Кернинга у контуров нет (fontkitten
 * без раскладки) — ни у эскиза, ни у пересчёта: проверка 2 ловит дрейф данных
 * от гарнитуры, а не ошибку способа. Контуры пересчитывает и помощник эскиза
 * `docs/reports/2026-09-24-7thserpent-znak/instrumenty/glify.mjs`; новый контур —
 * им, затем `d` в `znak.json`. После обновления `@fontsource/bodoni-moda`
 * с другими контурами проверка 2 упадёт; новый `d` разведёт знак с одобренным
 * эскизом A и с эталоном `_baseline/` — это пересъёмка эталона и приёмка
 * глазами, то есть решение владельца, а не починка сверки. PNG растрирует
 * `sharp` (librsvg), не браузер; побайтная сверка держится на версии sharp —
 * смена версии даст громкий отказ проверки 3, лечится `npm run znak` с просмотром
 * иконок. Подобие иконок шапке (три рисунка) — приёмка глазами. `theme-color`
 * со `--bg` не сверяется. В сборку и гейты сверка не входит: включить её —
 * решение владельца.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(join(siteRoot, 'package.json'));
const sharp = require('sharp');
const fk = await import(pathToFileURL(require.resolve('fontkitten')).href);

const IMPORT_GARNITURY = '@fontsource/bodoni-moda/latin-600.css';
const IKONOCHNY = /^(favicon|icon-|apple-touch-icon)|\.webmanifest$/;
const skrot = (t) => (t.length > 70 ? `${t.slice(0, 70)}…` : t).replace(/\s+/g, ' ');

// ── Токенайзер CSS ───────────────────────────────────────────────────────
/**
 * Разбор листа: `{ uzly, bledy }`. Узел верхнего уровня — `{ tip: 'at' | 'rule',
 * prelude, decls, children }` или оператор `{ tip: 'at', prelude, oper: true }`.
 * Комментарии снимаются, строки (с экранированием) и url() сохраняются целыми.
 * Объявления блока — `decls: [{ imie, wartosc }]` (только на своём уровне).
 * `bledy` — всё, чего разбор не понял: такой лист сверка не судит, а отвергает.
 */
export function drzewoCss(src) {
  const s = src;
  const bledy = [];
  let i = 0;
  const chitatStroku = (q) => {
    let out = q;
    i++;
    while (i < s.length) {
      const c = s[i];
      if (c === '\\') { out += c + (s[i + 1] ?? ''); i += 2; continue; }
      out += c;
      i++;
      if (c === q) break;
    }
    return out;
  };
  function dodajDecl(txt, decls, uzly, glub) {
    const t = txt.trim();
    if (!t) return;
    if (t.startsWith('@')) { uzly.push({ tip: 'at', prelude: t, oper: true }); return; }
    if (glub === 0) { bledy.push(`лист: текст вне блока на верхнем уровне: «${skrot(t)}» — браузер склеит его с селектором следующего правила`); return; }
    const m = /^(--[a-zA-Z0-9_-]+|-?[a-zA-Z][a-zA-Z0-9-]*)\s*:([\s\S]*)$/.exec(t);
    if (!m) { bledy.push(`лист: объявление не читается: «${skrot(t)}» — сверка не знает, что оно объявляет`); return; }
    decls.push({ imie: m[1], wartosc: m[2].trim() });
  }
  function blok(glub) {
    const uzly = [];
    const decls = [];
    let bufer = '';
    while (i < s.length) {
      const c = s[i];
      if (c === '/' && s[i + 1] === '*') { const j = s.indexOf('*/', i + 2); i = j < 0 ? s.length : j + 2; continue; }
      if (c === '"' || c === "'") { bufer += chitatStroku(c); continue; }
      if (c === '\\') { bufer += c + (s[i + 1] ?? ''); i += 2; continue; }
      if (c === '(' && /url$/i.test(bufer) && !/["']/.test(s.slice(i + 1).trimStart()[0] ?? '')) {
        const j = s.indexOf(')', i + 1);
        const k = j < 0 ? s.length : j + 1;
        bufer += s.slice(i, k);
        i = k;
        continue;
      }
      if (c === '{') {
        i++;
        const prelude = bufer.trim();
        bufer = '';
        const wn = blok(glub + 1);
        uzly.push({ tip: prelude.startsWith('@') ? 'at' : 'rule', prelude, decls: wn.decls, children: wn.uzly });
        continue;
      }
      if (c === '}') {
        i++;
        if (glub === 0) { bledy.push('лист: лишняя «}» на верхнем уровне'); bufer = ''; continue; }
        dodajDecl(bufer, decls, uzly, glub);
        return { uzly, decls };
      }
      if (c === ';') { i++; dodajDecl(bufer, decls, uzly, glub); bufer = ''; continue; }
      bufer += c;
      i++;
    }
    if (glub > 0) bledy.push('лист: незакрытый блок в конце листа');
    dodajDecl(bufer, decls, uzly, glub);
    return { uzly, decls };
  }
  return { uzly: blok(0).uzly, bledy };
}
const THEME = /^@theme(\s+(inline|static))*$/;
/** Все объявления `--имя` дерева с местом: верхний `:root`, верхний `@theme` или иначе. */
export function deklaracje(uzly) {
  const out = [];
  const obhod = (lista, gde) => {
    for (const u of lista) {
      if (u.oper) continue;
      const tut = gde ?? (u.tip === 'rule' && u.prelude === ':root' ? ':root' : u.tip === 'at' && THEME.test(u.prelude) ? '@theme' : 'другой блок');
      for (const d of u.decls ?? []) if (d.imie.startsWith('--')) out.push({ imie: d.imie.slice(2), wartosc: d.wartosc, gde: tut });
      obhod(u.children ?? [], 'вложенный блок');
    }
  };
  obhod(uzly, null);
  return out;
}
function kraska(dekl, imie, gdzie, bledy) {
  const vse = dekl.filter((d) => d.imie === imie);
  const root = vse.filter((d) => d.gde === ':root');
  const chuzhie = vse.filter((d) => d.gde !== ':root');
  if (!root.length) { bledy.push(`${gdzie}: краска «${imie}» — не токен темы: в верхнем :root global.css нет --${imie}${chuzhie.length ? ` (есть только: ${[...new Set(chuzhie.map((d) => d.gde))].join(', ')})` : ''}`); return '#ff00ff'; }
  if (chuzhie.length) bledy.push(`${gdzie}: токен --${imie} переопределён вне верхнего :root (${chuzhie.map((d) => `${d.gde}: «${d.wartosc}»`).join(', ')}) — знак на странице и иконки могут разойтись`);
  const zle = root.filter((d) => !/^#[0-9a-f]{6}$/i.test(d.wartosc));
  if (zle.length) { bledy.push(`${gdzie}: токен --${imie} объявлен не как #rrggbb: ${zle.map((d) => `«${d.wartosc}»`).join(', ')} — иконки не могут взять его значение`); return '#ff00ff'; }
  const rozne = [...new Set(root.map((d) => d.wartosc.toLowerCase()))];
  if (rozne.length > 1) { bledy.push(`${gdzie}: токен --${imie} объявлен в :root с разными значениями: ${rozne.join(', ')}`); return '#ff00ff'; }
  return rozne[0];
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
// ICO с PNG внутри: заголовок, записи, данные.
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
function zapisiIco(buf) {
  if (buf.length < 6 || buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1) return null;
  const n = buf.readUInt16LE(4);
  if (buf.length < 6 + 16 * n) return null;
  const out = [];
  for (let k = 0; k < n; k++) {
    const e = 6 + 16 * k;
    const len = buf.readUInt32LE(e + 8);
    const off = buf.readUInt32LE(e + 12);
    out.push({ w: buf.readUInt8(e) || 256, h: buf.readUInt8(e + 1) || 256, dane: buf.subarray(off, off + len) });
  }
  return out;
}
const SYG_PNG = Buffer.from('89504e470d0a1a0a', 'hex');
async function piksele(buf) {
  try {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return `${info.width}x${info.height}:${data.toString('base64')}`;
  } catch { return null; }
}
async function diagnoz(imie, stary, nowy) {
  if (imie.endsWith('.png')) {
    if (!stary.subarray(0, 8).equals(SYG_PNG)) return 'не PNG (сигнатура другая)';
    const [a, b] = [await piksele(stary), await piksele(nowy)];
    if (a === null) return 'PNG не читается';
    return a === b ? 'пиксели те же (перекодирован или чанки)' : 'пиксели другие (другой рисунок)';
  }
  if (imie.endsWith('.ico')) {
    const [zs, zn] = [zapisiIco(stary), zapisiIco(nowy)];
    if (!zs) return 'не ICO (заголовок другой)';
    const kat = (z) => z.map((x) => `${x.w}x${x.h}`).join(',');
    if (kat(zs) !== kat(zn)) return `каталог ICO другой (записи ${kat(zs) || 'нет'}, ждали ${kat(zn)})`;
    const inne = [];
    for (let k = 0; k < zn.length; k++) if ((await piksele(zs[k].dane)) !== (await piksele(zn[k].dane))) inne.push(zn[k].w);
    return inne.length ? `пиксели записи ${inne.join(' и ')} другие (другой рисунок или запись не читается)` : 'пиксели записей те же (перекодирован или поля каталога)';
  }
  return 'текст другой';
}

/**
 * Сверка — чистая функция над входами (для --check и --selftest).
 * @param {object} w входы: css, znak, fontBuf, publiczne (Map имя → Buffer | 'nie-plik'), dist? (то же)
 * @returns {Promise<{ bledy: string[], pliki: Map<string, Buffer> }>}
 */
export async function sverka(w) {
  const { uzly: drzewo, bledy } = drzewoCss(w.css);
  const dekl = deklaracje(drzewo);
  const farba = (imie, gdzie) => kraska(dekl, imie, gdzie, bledy);

  // 2. Гарнитура — тема.
  const importy = drzewo.filter((u) => u.oper && /^@import\b/.test(u.prelude)).map((u) => u.prelude);
  const nuzhny = [`@import '${IMPORT_GARNITURY}'`, `@import "${IMPORT_GARNITURY}"`];
  if (!importy.some((p) => nuzhny.includes(p))) {
    const pohozhie = importy.filter((p) => p.includes('bodoni-moda'));
    bledy.push(`гарнитура: среди операторов верхнего уровня global.css нет ровно @import '${IMPORT_GARNITURY}';${pohozhie.length ? ` (есть: ${pohozhie.join(' | ')})` : ''} — буквы знака не стоят на гарнитуре темы`);
  }
  const vlozhennye = [];
  const svoiFontFace = [];
  const iskat = (lista) => {
    for (const u of lista) {
      if (!u.oper && /^@font-face$/i.test(u.prelude) && (u.decls ?? []).some((d) => d.imie === 'font-family' && /bodoni moda/i.test(d.wartosc))) svoiFontFace.push(u.prelude);
      for (const c of u.children ?? []) if (c.oper && c.prelude.includes('bodoni-moda')) vlozhennye.push(`${u.prelude} { ${c.prelude} }`);
      iskat(u.children ?? []);
    }
  };
  iskat(drzewo);
  if (vlozhennye.length) bledy.push(`гарнитура: импорт Бодони внутри блока: ${vlozhennye.join('; ')}`);
  if (svoiFontFace.length) bledy.push(`гарнитура: в global.css своя @font-face для 'Bodoni Moda' (${svoiFontFace.length}) — она подменит файл темы, а контуры знака считаются из файла темы`);
  const fd = dekl.filter((d) => d.imie === 'font-display');
  const fdTheme = fd.filter((d) => d.gde === '@theme');
  if (!fdTheme.length || !fdTheme.every((d) => /^['"]Bodoni Moda['"]/.test(d.wartosc))) bledy.push(`гарнитура: --font-display в верхнем @theme не начинается с 'Bodoni Moda' (${fdTheme.length ? fdTheme.map((d) => d.wartosc).join(' | ') : 'нет'})`);
  if (fd.some((d) => d.gde !== '@theme')) bledy.push(`гарнитура: --font-display объявлен вне верхнего @theme (${fd.filter((d) => d.gde !== '@theme').map((d) => d.gde).join(', ')})`);
  const napisy = w.znak.shapka.napisy ?? [];
  if (!napisy.length) bledy.push('надписи: у знака нет надписей — имя знака не нарисовано');
  if (!w.fontBuf) bledy.push(`гарнитура: в ${IMPORT_GARNITURY} нет @font-face normal 600 с woff`);
  else {
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
      if (!n.d || czesci.join('') !== n.d) bledy.push(`надпись «${n.tekst}»: контур в znak.json не равен пересчёту из гарнитуры темы (size ${n.size}, track ${n.track}, x ${n.x}, y ${n.y})`);
    }
  }
  // 1. Краски шапки (иконки судятся при сборке файлов ниже).
  for (const c of w.znak.shapka.czesci) farba(c.farba, `шапка, ${c.opis}`);
  for (const n of napisy) farba(n.farba, `шапка, надпись «${n.tekst}»`);

  // 3. Файлы.
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
  const sverit = async (mapa, gde) => {
    for (const [imie, v] of mapa) {
      if (!IKONOCHNY.test(imie)) continue;
      if (v === 'nie-plik') { bledy.push(`${gde}/${imie}: иконочное имя — не обычный файл (папка или ссылка) — в ${gde}/ иконки только файлами`); continue; }
      if (!pliki.has(imie)) bledy.push(`${gde}/${imie}: лишний иконочный файл — иконки знака ровно шесть`);
    }
    for (const [imie, nowy] of pliki) {
      const stary = mapa.get(imie);
      if (!stary || stary === 'nie-plik') { if (!stary) bledy.push(`${gde}/${imie}: файла нет — npm run znak${gde === 'dist' ? ', затем сборка' : ''}`); continue; }
      if (!stary.equals(nowy)) bledy.push(`${gde}/${imie}: байты не равны тому, что пишет инструмент; ${await diagnoz(imie, stary, nowy)} — npm run znak${gde === 'dist' ? ', затем сборка' : ''}`);
    }
  };
  if (w.publiczne) await sverit(w.publiczne, 'public');
  if (w.dist) await sverit(w.dist, 'dist');
  return { bledy, pliki };
}

// ── Входы с диска ────────────────────────────────────────────────────────
// Читаются только иконочные имена; прочее в папке не трогается (ни stat, ни чтение).
function katalog(dir) {
  if (!existsSync(dir)) return new Map();
  return new Map(readdirSync(dir).filter((f) => IKONOCHNY.test(f)).map((f) => {
    const st = lstatSync(join(dir, f));
    return [f, st.isFile() ? readFileSync(join(dir, f)) : 'nie-plik'];
  }));
}
function wejscie({ dist = false } = {}) {
  const fontCssPath = require.resolve(IMPORT_GARNITURY);
  const fontCss = readFileSync(fontCssPath, 'utf8');
  const ff = [...fontCss.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]).find((b) => /font-style:\s*normal/.test(b) && /font-weight:\s*600/.test(b));
  const woff = ff && /url\(\.\/files\/([^)]+\.woff)\)/.exec(ff);
  return {
    css: readFileSync(join(siteRoot, 'src/styles/global.css'), 'utf8'),
    znak: JSON.parse(readFileSync(join(siteRoot, 'src/data/znak.json'), 'utf8')),
    fontPlik: woff ? woff[1] : null,
    fontBuf: woff ? readFileSync(join(dirname(fontCssPath), 'files', woff[1])) : null,
    publiczne: katalog(join(siteRoot, 'public')),
    ...(dist ? { dist: katalog(join(siteRoot, 'dist')) } : {}),
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
  const font700 = readFileSync(join(dirname(require.resolve(IMPORT_GARNITURY)), 'files', 'bodoni-moda-latin-700-normal.woff'));
  const cudzyRysunek = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#ff0000' } }).png().toBuffer();
  const I = `@import '${IMPORT_GARNITURY}';`;
  const przedRoot = (w, txt) => { const k = w.css.indexOf('\n:root {'); w.css = `${w.css.slice(0, k)}\n${txt}${w.css.slice(k)}`; return w; };
  const glow = (w) => { w.znak.shapka.napisy[1].farba = 'glow'; return w; };
  const icoZ = (a16, a32) => ico([[16, a16], [32, a32]]);
  // [имя, мутация, ожидание]: null — «сверено»; строка или массив — каждая строка отказа содержит одну из них.
  const proby = [
    ['чистые входы', (w) => w, null],
    ['чистые входы и robots.txt в public/', (w) => { w.publiczne.set('robots.txt', Buffer.from('User-agent: *\n')); return w; }, null],
    ['BOM в начале листа', (w) => { w.css = '﻿' + w.css; return w; }, null],
    ['url() без кавычек с «;» и «{»', (w) => { w.css += '\n.q { background: url(data:a;b{c); }\n:root { --glow: #ffffff; }'; return glow(w); }, null],
    ['экранированная скобка в селекторе', (w) => { w.css += '\n.a\\{b { color: red; }\n:root { --glow: #ffffff; }'; return glow(w); }, null],
    ['другое значение только в комментарии', (w) => { w.css += '\n/* прежде --accent: #ff0000; */'; return w; }, null],
    ['токен только в комментарии внутри :root', (w) => { w.css += '\n:root { /* x; --glow: #ffffff; */ }'; return glow(w); }, 'не токен темы'],
    ['токен только в комментарии верхнего уровня', (w) => { w.css += '\n/* было: --glow: #ffffff; */'; return glow(w); }, 'не токен темы'],
    ['объявление внутри строки', (w) => { w.css += '\n.q::after { content: " --glow: #ffffff;"; }'; return glow(w); }, 'не токен темы'],
    ['«}» внутри строки, затем поздний :root', (w) => { w.publiczne = null; w.css += '\n.q::before { content: "}"; }\n:root { --accent: #ff0000; }'; return w; }, 'разными значениями'],
    ['экранированная кавычка и «}» в строке, затем поздний :root', (w) => { w.publiczne = null; w.css += '\n.q::before { content: "\\"}"; }\n:root { --accent: #ff0000; }'; return w; }, 'разными значениями'],
    ['имя только в @theme', (w) => { w.znak.shapka.czesci[1].farba = 'color-accent'; return w; }, 'есть только: @theme'],
    ['токен внутри @layer', (w) => { w.css += '\n@layer base { :root { --glow: #ffffff; } }'; return glow(w); }, 'есть только: вложенный блок'],
    ['токен только в @media', (w) => { w.css += '\n@media print { :root { --glow: #ffffff; } }'; return glow(w); }, 'не токен темы'],
    ['токен только в :root с классом', (w) => { w.css += '\n:root.menu-otwarte { --glow: #ffffff; }'; return glow(w); }, 'есть только: другой блок'],
    ['поздний не-hex в :root', (w) => { w.publiczne = null; w.css += '\n:root { --accent: rgb(255 0 0); }'; return w; }, 'не как #rrggbb'],
    ['поздний var() в :root', (w) => { w.publiczne = null; w.css += '\n:root { --accent: var(--ink); }'; return w; }, 'не как #rrggbb'],
    ['поздний #rgb в :root', (w) => { w.publiczne = null; w.css += '\n:root { --accent: #f00; }'; return w; }, 'не как #rrggbb'],
    ['!important', (w) => { w.publiczne = null; w.css += '\n:root { --accent: #eca84a !important; }'; return w; }, 'не как #rrggbb'],
    ['другое значение в :root', (w) => { w.publiczne = null; w.css += '\n:root { --accent: #ff0000; }'; return w; }, 'разными значениями'],
    ['после вложенного правила', (w) => { w.publiczne = null; w.css += '\n:root{.x{color:red}--accent:#ff0000}'; return w; }, 'разными значениями'],
    ['переопределение в другом селекторе', (w) => { w.css += '\n.ft { --accent: #ff0000; }'; return w; }, 'переопределён вне верхнего :root'],
    ['объявление вне блока перед :root', (w) => przedRoot(w, "--font-text: 'Public Sans', serif;"), 'текст вне блока'],
    ['свойство вне блока перед :root', (w) => przedRoot(w, 'color: red;'), 'текст вне блока'],
    ['лишняя «}» на верхнем уровне', (w) => { w.css += '\n}\n.x { color: red; }'; return w; }, 'лишняя «}»'],
    ['незакрытый блок в конце', (w) => { w.css += '\n.x { color: red;'; return w; }, 'незакрытый блок'],
    ['экранирование в имени токена в :root', (w) => { w.css += '\n:root { --acc\\65nt: #ff0000; }'; return w; }, 'объявление не читается'],
    ['экранирование в имени токена в другом селекторе', (w) => { w.css += '\n.hdr { --acc\\65nt: #ff0000; }'; return w; }, 'объявление не читается'],
    ['экранирование в имени --font-display', (w) => { w.css += "\n:root { --font-displ\\61y: 'Playfair Display', serif; }"; return w; }, 'объявление не читается'],
    ['сброс --font-* в позднем @theme', (w) => { w.css += '\n@theme { --font-*: initial; }'; return w; }, 'объявление не читается'],
    ['сброс --* в позднем @theme', (w) => { w.css += '\n@theme { --*: initial; }'; return w; }, 'объявление не читается'],
    ['@theme reference', (w) => { w.css = w.css.replace('\n@theme {', '\n@theme reference {'); return w; }, ['в верхнем @theme не начинается', 'объявлен вне верхнего @theme']],
    ['тема грузит Бодони 400', (w) => { w.css = w.css.split(I).join("@import '@fontsource/bodoni-moda/latin-400.css';"); return w; }, 'нет ровно @import'],
    ['@import с условием print', (w) => { w.css = w.css.split(I).join(`@import '${IMPORT_GARNITURY}' print;`); return w; }, 'нет ровно @import'],
    ['@import с supports()', (w) => { w.css = w.css.split(I).join(`@import '${IMPORT_GARNITURY}' supports(display: nope);`); return w; }, 'нет ровно @import'],
    ['@import только внутри @media', (w) => { w.css = w.css.split(I).join(`@import '@fontsource/bodoni-moda/latin-400.css';\n@media print { ${I} }`); return w; }, ['внутри блока', 'нет ровно @import']],
    ['@import только в строке', (w) => { w.css = w.css.split(I).join(`@import '@fontsource/bodoni-moda/latin-400.css';\n.q::before { content: "${I}"; }`); return w; }, 'нет ровно @import'],
    ['своя @font-face Бодони в листе', (w) => { w.css += "\n@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }"; return w; }, 'своя @font-face'],
    ['--font-display — другая гарнитура', (w) => { w.css = w.css.replace(/--font-display:\s*'Bodoni Moda'/, "--font-display: 'Playfair Display'"); return w; }, "не начинается с 'Bodoni Moda'"],
    ['--font-display — Бодони второй', (w) => { w.css = w.css.replace(/--font-display:\s*'Bodoni Moda'/, "--font-display: 'Playfair Display', 'Bodoni Moda'"); return w; }, "не начинается с 'Bodoni Moda'"],
    ['--font-display через var()', (w) => { w.css = w.css.replace(/--font-display:\s*'Bodoni Moda'[^;]*;/, '--font-display: var(--x);'); return w; }, "не начинается с 'Bodoni Moda'"],
    ['--font-display вне @theme', (w) => { w.css += "\n.x { --font-display: 'Bodoni Moda', serif; }"; return w; }, 'вне верхнего @theme'],
    ['контуры из woff 700', (w) => { w.fontBuf = font700; return w; }, 'не равен пересчёту'],
    ['в листе гарнитуры нет woff 600', (w) => { w.fontBuf = null; return w; }, 'нет @font-face normal 600'],
    ['поле font в данных', (w) => { w.znak.shapka.napisy[0].font = 'x.woff'; return w; }, 'поле font не читается'],
    ['контур надписи правлен', (w) => { w.znak.shapka.napisy[0].d = w.znak.shapka.napisy[0].d.replace('26.9', '27.9'); return w; }, 'не равен пересчёту'],
    ['контур надписи пуст', (w) => { w.znak.shapka.napisy[0].d = ''; return w; }, 'не равен пересчёту'],
    ['параметр надписи правлен', (w) => { w.znak.shapka.napisy[1].track = 0.11; return w; }, 'не равен пересчёту'],
    ['надписей нет', (w) => { w.znak.shapka.napisy = []; return w; }, 'нет надписей'],
    ['краска пиксельной иконки — не токен', (w) => { w.publiczne = null; w.znak.ikona16.prostokaty[0].farba = 'glow'; return w; }, 'иконка 16: краска «glow»'],
    ['краска фона иконки 32 — не токен', (w) => { w.publiczne = null; w.znak.ikona.tlo = 'glow'; return w; }, 'иконка 32, фон: краска «glow»'],
    ['SVG под именем PNG', (w) => { w.publiczne.set('favicon-32x32.png', pliki.get('favicon.svg')); return w; }, 'не PNG'],
    ['PNG с чанком gAMA', (w) => { w.publiczne.set('apple-touch-icon.png', sGama(pliki.get('apple-touch-icon.png'))); return w; }, 'пиксели те же'],
    ['PNG с чужим рисунком', (w) => { w.publiczne.set('favicon-32x32.png', cudzyRysunek); return w; }, 'пиксели другие'],
    ['PNG битый после сигнатуры', (w) => { w.publiczne.set('favicon-16x16.png', Buffer.concat([SYG_PNG, Buffer.from('мусор')])); return w; }, 'PNG не читается'],
    ['SVG правлен', (w) => { w.publiczne.set('favicon.svg', Buffer.from(pliki.get('favicon.svg').toString().replace('#eca84a', '#eca84b'))); return w; }, 'текст другой'],
    ['ICO пустой', (w) => { w.publiczne.set('favicon.ico', Buffer.alloc(0)); return w; }, 'не ICO'],
    ['ICO: тип записи правлен', (w) => { const b = Buffer.from(pliki.get('favicon.ico')); b.writeUInt16LE(2, 2); w.publiczne.set('favicon.ico', b); return w; }, 'не ICO'],
    ['ICO: высота записи правлена', (w) => { const b = Buffer.from(pliki.get('favicon.ico')); b.writeUInt8(0, 7); w.publiczne.set('favicon.ico', b); return w; }, 'каталог ICO другой'],
    ['ICO: чужая запись 32', (w) => { w.publiczne.set('favicon.ico', icoZ(pliki.get('favicon-16x16.png'), cudzyRysunek)); return w; }, 'пиксели записи 32 другие'],
    ['ICO: та же запись, перекодирована', (w) => { w.publiczne.set('favicon.ico', icoZ(pliki.get('favicon-16x16.png'), sGama(pliki.get('favicon-32x32.png')))); return w; }, 'пиксели записей те же'],
    ['лишний манифест', (w) => { w.publiczne.set('site.webmanifest', Buffer.from('{}')); return w; }, 'лишний иконочный файл'],
    ['лишний иконочный файл', (w) => { w.publiczne.set('favicon-48x48.png', pliki.get('icon-192.png')); return w; }, 'лишний иконочный файл'],
    ['иконочное имя — не файл', (w) => { w.publiczne.set('icon-set', 'nie-plik'); return w; }, 'не обычный файл'],
    ['файла нет', (w) => { w.publiczne.delete('icon-192.png'); return w; }, 'файла нет'],
    ['dist отстал от public', (w) => { w.dist = new Map(pliki); w.dist.set('favicon.svg', Buffer.from('<svg/>')); return w; }, 'dist/favicon.svg'],
    ['лишний иконочный файл в dist', (w) => { w.dist = new Map(pliki); w.dist.set('favicon-48x48.png', pliki.get('icon-192.png')); return w; }, 'dist/favicon-48x48.png: лишний'],
    ['файла нет в dist', (w) => { w.dist = new Map(pliki); w.dist.delete('favicon.ico'); return w; }, 'dist/favicon.ico: файла нет'],
  ];
  let zle = 0;
  for (const [nazwa, mut, zhdem] of proby) {
    const { bledy } = await sverka(mut(czyste()));
    const vidy = zhdem === null ? [] : [].concat(zhdem);
    const ok = zhdem === null ? bledy.length === 0 : bledy.length > 0 && bledy.every((b) => vidy.some((v) => b.includes(v)));
    if (!ok) zle++;
    const chuzhoe = bledy.find((b) => !vidy.some((v) => b.includes(v)));
    console.log(`${ok ? 'ok ' : 'НЕТ'}  ${nazwa}: ждём ${zhdem === null ? 'сверено' : `отказ «${vidy.join('» или «')}»`}, факт ${bledy.length ? `отказ (${bledy.length}): ${chuzhoe ?? bledy[0]}` : 'сверено'}`);
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
      const { bledy, pliki } = await sverka({ ...w, publiczne: CHECK ? w.publiczne : null, dist: w.dist });
      if (!CHECK && bledy.length) throw Object.assign(new Error('не пишу: входы с отказом'), { bledy });
      if (!CHECK) {
        const pub = join(siteRoot, 'public');
        mkdirSync(pub, { recursive: true });
        for (const [imie, buf] of pliki) writeFileSync(join(pub, imie), buf);
      }
      if (bledy.length) {
        console.error(`znak: ОТКАЗ — ${bledy.length}`);
        for (const b of bledy) console.error(`  - ${b}`);
        process.exit(1);
      }
      const d = deklaracje(drzewoCss(w.css).uzly).filter((x) => x.gde === ':root');
      const imena = [...new Set([...w.znak.shapka.czesci.map((c) => c.farba), ...w.znak.shapka.napisy.map((n) => n.farba), w.znak.ikona.tlo, ...w.znak.ikona.czesci.map((c) => c.farba), w.znak.ikona16.tlo, ...w.znak.ikona16.prostokaty.map((p) => p.farba)])];
      const kolory = imena.map((t) => `${t} ${d.find((x) => x.imie === t)?.wartosc}`).join(', ');
      console.log(`znak: ${CHECK ? 'сверено' : 'записано'} — ${pliki.size} иконок public/${w.dist ? ' и dist/' : ''} (${[...pliki.keys()].join(', ')}); надписей ${w.znak.shapka.napisy.length} — контуры равны ${w.fontPlik}; краски трёх рисунков (с фонами иконок): ${kolory}`);
    }
  } catch (e) {
    console.error(`znak: ОТКАЗ — ${e.message}`);
    for (const b of e.bledy ?? []) console.error(`  - ${b}`);
    process.exit(1);
  }
}
