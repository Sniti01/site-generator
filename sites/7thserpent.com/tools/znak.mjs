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
 *   node tools/znak.mjs          — пишет в public/ шесть файлов (ниже)
 *   node tools/znak.mjs --check  — ничего не пишет; выход 1, если:
 *     1) контур надписи знака не равен пересчёту из файла гарнитуры темы
 *        по её полям (font, size, track, x, y) — буквы знака остаются
 *        контурами Bodoni Moda 600, а не рисунком «на глаз»;
 *     2) краска части — не токен `global.css` (или токен объявлен дважды
 *        с разными значениями);
 *     3) файл в public/ отстал от источника: SVG — побайтно, PNG и ICO —
 *        по пикселям каждого размера;
 *     4) ссылка на файл иконки не стоит в `<head>` (`src/layouts/Base.astro`).
 *
 * ФАЙЛЫ: `favicon.svg` (вкладка — его рисуют Chromium, Firefox), `favicon.ico`
 * (16 и 32 в одном файле, PNG внутри — для клиентов, которые просят
 * `/favicon.ico` сами), `favicon-16x16.png` и `favicon-32x32.png` (запасные
 * для браузеров без SVG-иконок), `icon-192.png` (ярлык на Android),
 * `apple-touch-icon.png` (180, домашний экран iOS; углы скругляет система).
 * 16 px — свой рисунок по пиксельной сетке (`ikona16`), остальные — `ikona`.
 *
 * ПРЕДЕЛЫ (названы): контуры считает `fontkitten` — зависимость Astro, а не
 * сайта (в `package.json` сайта её нет); пропадёт из дерева — проверка 1
 * упадёт громко, а не пройдёт молча. PNG растрирует `sharp` (librsvg), не
 * браузер: вкладку Chromium рисует сам из `favicon.svg`, запасные PNG — это
 * растр sharp. Проверка 3 сравнивает файлы с тем, что инструмент написал бы
 * сейчас, — она ловит правку источника без перезаписи и ручную правку файла,
 * но не судит, хорош ли рисунок: это приёмка глазами.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(join(siteRoot, 'package.json'));
const sharp = require('sharp');
const fk = await import(pathToFileURL(require.resolve('fontkitten')).href);

const CHECK = process.argv.includes('--check');
const znak = JSON.parse(readFileSync(join(siteRoot, 'src/data/znak.json'), 'utf8'));
const css = readFileSync(join(siteRoot, 'src/styles/global.css'), 'utf8');
const base = readFileSync(join(siteRoot, 'src/layouts/Base.astro'), 'utf8');
const bledy = [];

// Токены: `--имя: #hex;` по всему файлу (так же читает гейт контраста ядра).
const tokeny = {};
for (const m of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
  const [, imie, wartosc] = m;
  const v = wartosc.toLowerCase();
  if (tokeny[imie] && tokeny[imie] !== v) bledy.push(`токен --${imie} объявлен дважды: ${tokeny[imie]} и ${v}`);
  tokeny[imie] = v;
}
const farba = (imie, gdzie) => {
  if (!tokeny[imie]) {
    bledy.push(`${gdzie}: краска «${imie}» — не токен src/styles/global.css`);
    return '#ff00ff';
  }
  return tokeny[imie];
};

// 1. Надписи знака — контуры гарнитуры темы.
const fontDir = join(dirname(require.resolve('@fontsource/bodoni-moda/package.json')), 'files');
for (const n of znak.shapka.napisy) {
  const font = fk.create(readFileSync(join(fontDir, n.font)));
  const s = n.size / font.unitsPerEm;
  let x = n.x;
  const czesci = [];
  for (const ch of n.tekst) {
    const g = font.glyphForCodePoint(ch.codePointAt(0));
    const d = g.path.scale(s, -s).translate(x, n.y).toSVG();
    if (d) czesci.push(d);
    x += g.advanceWidth * s + n.track * n.size;
  }
  if (czesci.join('') !== n.d) bledy.push(`надпись «${n.tekst}»: контур в znak.json не равен пересчёту из ${n.font} (size ${n.size}, track ${n.track}, x ${n.x}, y ${n.y})`);
}
for (const c of znak.shapka.czesci) farba(c.farba, `шапка, ${c.opis}`);
for (const n of znak.shapka.napisy) farba(n.farba, `шапка, надпись «${n.tekst}»`);

// 2. Иконки из источника.
const ikonaSvg = (ik) => {
  const s = ik.siatka;
  const rows = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}"${ik.prostokaty ? ' shape-rendering="crispEdges"' : ''}>`];
  rows.push(`  <rect width="${s}" height="${s}" fill="${farba(ik.tlo, `иконка ${s}, фон`)}"/>`);
  for (const c of ik.czesci ?? []) rows.push(`  <polygon points="${c.points}" fill="${farba(c.farba, `иконка ${s}, ${c.opis}`)}"/>`);
  for (const p of ik.prostokaty ?? []) rows.push(`  <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${farba(p.farba, `иконка ${s}`)}"/>`);
  rows.push('</svg>', '');
  return rows.join('\n');
};
const svg32 = ikonaSvg(znak.ikona);
const svg16 = ikonaSvg(znak.ikona16);
const png = (svg, siatka, size) =>
  sharp(Buffer.from(svg), { density: (72 * size) / siatka }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

const p16 = await png(svg16, 16, 16);
const p32 = await png(svg32, 32, 32);
const pliki = {
  'favicon.svg': Buffer.from(svg32),
  'favicon.ico': ico([[16, p16], [32, p32]]),
  'favicon-16x16.png': p16,
  'favicon-32x32.png': p32,
  'icon-192.png': await png(svg32, 32, 192),
  'apple-touch-icon.png': await png(svg32, 32, 180),
};

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
function icoObrazy(buf) {
  const n = buf.readUInt16LE(4);
  const out = [];
  for (let i = 0; i < n; i++) {
    const e = 6 + 16 * i;
    const size = buf.readUInt8(e) || 256;
    out.push([size, buf.subarray(buf.readUInt32LE(e + 12), buf.readUInt32LE(e + 12) + buf.readUInt32LE(e + 8))]);
  }
  return out;
}
const piksele = async (buf) => {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return `${info.width}x${info.height}:${data.toString('base64')}`;
};

const pub = join(siteRoot, 'public');
if (CHECK) {
  for (const [imie, nowy] of Object.entries(pliki)) {
    const sciezka = join(pub, imie);
    if (!existsSync(sciezka)) { bledy.push(`public/${imie}: файла нет — npm run znak`); continue; }
    const stary = readFileSync(sciezka);
    if (imie.endsWith('.svg')) {
      if (!stary.equals(nowy)) bledy.push(`public/${imie}: отстал от src/data/znak.json и токенов — npm run znak`);
    } else if (imie.endsWith('.ico')) {
      const a = icoObrazy(stary);
      const b = icoObrazy(nowy);
      if (a.length !== b.length) bledy.push(`public/${imie}: размеров ${a.length}, ожидалось ${b.length}`);
      else for (let i = 0; i < a.length; i++) {
        if (a[i][0] !== b[i][0] || (await piksele(a[i][1])) !== (await piksele(b[i][1]))) bledy.push(`public/${imie}: размер ${b[i][0]} отстал — npm run znak`);
      }
    } else if ((await piksele(stary)) !== (await piksele(nowy))) {
      bledy.push(`public/${imie}: пиксели отстали от источника — npm run znak`);
    }
  }
} else {
  mkdirSync(pub, { recursive: true });
  for (const [imie, buf] of Object.entries(pliki)) writeFileSync(join(pub, imie), buf);
}
for (const imie of Object.keys(pliki)) {
  if (!base.includes(`href="/${imie}"`)) bledy.push(`src/layouts/Base.astro: нет ссылки href="/${imie}" в <head>`);
}

const kolory = [...new Set([znak.ikona.tlo, ...znak.ikona.czesci.map((c) => c.farba)])].map((t) => `${t} ${tokeny[t]}`).join(', ');
if (bledy.length) {
  console.error(`znak: ОТКАЗ — ${bledy.length}`);
  for (const b of bledy) console.error(`  - ${b}`);
  process.exit(1);
}
console.log(`znak: ${CHECK ? 'сверено' : 'записано'} — ${Object.keys(pliki).length} файлов public/ (${Object.keys(pliki).join(', ')}); надписей ${znak.shapka.napisy.length} — контуры равны гарнитуре; краски: ${kolory}`);
