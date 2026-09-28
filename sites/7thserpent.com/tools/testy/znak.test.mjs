// Судья знака без браузера (`tools/znak.mjs`, П104 блок Г). Часть 1 — пробы прежнего `--selftest` (94, сессия 11,
// П83; прежний прогон на сборке 3b78f28 — журнал сверки вердиктов доклада сессии 21) тестами один к одному, с тем же
// строгим правилом (R4-SVERKA-4): у пробы с ожиданием отказ есть, КАЖДАЯ его строка — одного из ожидаемых видов
// и каждый вид встретился; у пробы «сверено» отказа нет. Входы — настоящие (global.css, znak.json, гарнитура темы,
// иконки, которые пишет инструмент), мутации — в памяти; ничего не пишется.
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import znakDist, { sverka, wejscie, ico, SYG_PNG, IMPORT_GARNITURY } from '../znak.mjs';

const SAYT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(join(SAYT, 'package.json'));
const sharp = require('sharp');

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
/** PNG с лишним чанком gAMA: те же пиксели, другие байты. */
function sGama(pngBuf) {
  const dane = Buffer.alloc(4);
  dane.writeUInt32BE(100000);
  const typ = Buffer.from('gAMA');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(4);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typ, dane])));
  return Buffer.concat([pngBuf.subarray(0, 33), len, typ, dane, crc, pngBuf.subarray(33)]);
}

/** Строгое правило пробы: `zhdem` — null (сверено), строка или массив видов отказа. */
function sudit(bledy, zhdem) {
  const vidy = zhdem === null ? [] : [].concat(zhdem);
  if (zhdem === null) return assert.deepEqual(bledy, [], `ждали «сверено», факт — отказ: ${bledy.join(' | ')}`);
  assert.ok(bledy.length > 0, `ждали отказ «${vidy.join('» или «')}», факт — сверено`);
  const chuzhie = bledy.filter((b) => !vidy.some((v) => b.includes(v)));
  assert.deepEqual(chuzhie, [], `строки отказа чужого вида (ждали «${vidy.join('» или «')}»)`);
  const nevstrechennye = vidy.filter((v) => !bledy.some((b) => b.includes(v)));
  assert.deepEqual(nevstrechennye, [], `названный вид не встретился; отказ: ${bledy.join(' | ')}`);
}

const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const font700 = readFileSync(join(dirname(require.resolve(IMPORT_GARNITURY)), 'files', 'bodoni-moda-latin-700-normal.woff'));
const cudzyRysunek = await sharp({ create: { width: 32, height: 32, channels: 4, background: '#ff0000' } }).png().toBuffer();
const I = `@import '${IMPORT_GARNITURY}';`;
const przedRoot = (w, txt) => {
  const k = w.css.indexOf('\n:root {');
  w.css = `${w.css.slice(0, k)}\n${txt}${w.css.slice(k)}`;
  return w;
};
const glow = (w) => {
  w.znak.shapka.napisy[1].farba = 'glow';
  return w;
};
const icoZ = (a16, a32) => ico([[16, a16], [32, a32]]);
const theme = (w, txt) => {
  w.css = w.css.replace('\n@theme {', `\n@theme {\n  ${txt}`);
  return w;
};

// [имя, мутация, ожидание] — как в прежнем --selftest, дословно (имена — ключ сверки вердиктов).
const PROBY = [
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
  ['сброс --font-* в позднем @theme', (w) => { w.css += '\n@theme { --font-*: initial; }'; return w; }, 'сброс --font-*'],
  ['сброс --* в позднем @theme', (w) => { w.css += '\n@theme { --*: initial; }'; return w; }, 'сброс --*:'],
  ['@theme reference', (w) => { w.css = w.css.replace('\n@theme {', '\n@theme reference {'); return w; }, ['в верхнем @theme не начинается', 'объявлен вне верхнего @theme']],
  ['@theme inline', (w) => { w.css = w.css.replace('\n@theme {', '\n@theme inline {'); return w; }, null],
  ['@theme static', (w) => { w.css = w.css.replace('\n@theme {', '\n@theme static {'); return w; }, null],
  ['--font-display убран из @theme', (w) => { w.css = w.css.replace(/\n\s*--font-display:[^;]*;/, ''); return w; }, 'в верхнем @theme не начинается'],
  ['сброс --color-* в начале @theme', (w) => theme(w, '--color-*: initial;'), null],
  ['сброс --font-* в начале @theme', (w) => theme(w, '--font-*: initial;'), null],
  ['сброс --font-* после --font-display', (w) => { w.css = w.css.replace(/(\n\s*--font-display:[^;]*;)/, '$1\n  --font-*: initial;'); return w; }, 'сброс --font-*'],
  ['сброс не initial', (w) => theme(w, '--color-*: red;'), 'сброс пространства имён бывает только initial'],
  ['не-ASCII имя свойства', (w) => { w.css += '\n.x { --цвет: #ff0000; }'; return w; }, null],
  ['значение-блок у токена в :root', (w) => { w.css += '\n:root { --accent: {}; }'; return w; }, 'значение-блок'],
  ['значение-блок у токена в другом селекторе', (w) => { w.css += '\n.hdr { --accent: { color: red } }'; return w; }, 'значение-блок'],
  ['значение-блок без пробела', (w) => { w.css += '\n:root { --accent:hover {} }'; return w; }, 'значение-блок'],
  ['@property у фонаря', (w) => { w.css += "\n@property --accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }"; return w; }, 'зарегистрирован @property'],
  ['@property у снега', (w) => { w.css += "\n@property --ink { syntax: '*'; inherits: false; }"; return w; }, 'зарегистрирован @property'],
  ['@property у чужого токена', (w) => { w.css += "\n@property --glow { syntax: '<color>'; inherits: true; initial-value: #ffffff; }"; return w; }, null],
  ['тема грузит Бодони 400', (w) => { w.css = w.css.split(I).join("@import '@fontsource/bodoni-moda/latin-400.css';"); return w; }, 'нет ровно @import'],
  ['@import с условием print', (w) => { w.css = w.css.split(I).join(`@import '${IMPORT_GARNITURY}' print;`); return w; }, 'нет ровно @import'],
  ['@import с supports()', (w) => { w.css = w.css.split(I).join(`@import '${IMPORT_GARNITURY}' supports(display: nope);`); return w; }, 'нет ровно @import'],
  ['@import только внутри @media', (w) => { w.css = w.css.split(I).join(`@import '@fontsource/bodoni-moda/latin-400.css';\n@media print { ${I} }`); return w; }, ['внутри блока', 'нет ровно @import']],
  ['@import только в строке', (w) => { w.css = w.css.split(I).join(`@import '@fontsource/bodoni-moda/latin-400.css';\n.q::before { content: "${I}"; }`); return w; }, 'нет ровно @import'],
  ['своя @font-face Бодони в листе', (w) => { w.css += "\n@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }"; return w; }, 'своя @font-face'],
  ['своя @font-face Бодони — FONT-FAMILY и лишний пробел', (w) => { w.css += "\n@font-face { FONT-FAMILY: 'bodoni   moda'; src: url(x.woff2); }"; return w; }, 'своя @font-face'],
  ['своя @font-face Бодони — экранирование в имени', (w) => { w.css += "\n@font-face { font-family: Bodoni\\20 Moda; src: url(x.woff2); }"; return w; }, 'своя @font-face'],
  ['своя @font-face Бодони внутри @media', (w) => { w.css += "\n@media all { @font-face { font-family: 'Bodoni Moda'; src: url(x.woff2); } }"; return w; }, 'своя @font-face'],
  ['чужая @font-face', (w) => { w.css += "\n@font-face { font-family: 'Inna'; src: url(x.woff2); }"; return w; }, null],
  ['@import в двойных кавычках', (w) => { w.css = w.css.split(I).join(`@import "${IMPORT_GARNITURY}";`); return w; }, null],
  ['поздний :root с тем же значением заглавными', (w) => { w.css += '\n:root { --accent: #ECA84A; }'; return w; }, null],
  ['url() в кавычках со скобкой', (w) => { w.css += '\n.q { background: url("a)b"); }'; return w; }, null],
  ['--font-display без запятой после Бодони', (w) => { w.css = w.css.replace(/--font-display:\s*'Bodoni Moda'\s*,/, "--font-display: 'Bodoni Moda' 'Public Sans',"); return w; }, "не начинается с 'Bodoni Moda'"],
  ['--font-display с мусором после кавычки', (w) => { w.css = w.css.replace(/--font-display:\s*'Bodoni Moda'/, "--font-display: 'Bodoni Moda'x"); return w; }, "не начинается с 'Bodoni Moda'"],
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
  ['ICO: чужая запись 16', (w) => { w.publiczne.set('favicon.ico', icoZ(cudzyRysunek, pliki.get('favicon-32x32.png'))); return w; }, 'пиксели записи 16 другие'],
  ['ICO: обрезанный каталог', (w) => { w.publiczne.set('favicon.ico', pliki.get('favicon.ico').subarray(0, 20)); return w; }, 'не ICO'],
  ['иконка 16 из многоугольников', (w) => { w.publiczne = null; w.znak.ikona16 = { siatka: 16, tlo: 'bg', czesci: [{ opis: 'семёрка', farba: 'accent', points: '3,4 11,4 8,14 6,14' }] }; return w; }, null],
  ['лишний манифест', (w) => { w.publiczne.set('site.webmanifest', Buffer.from('{}')); return w; }, 'лишний иконочный файл'],
  ['лишний иконочный файл', (w) => { w.publiczne.set('favicon-48x48.png', pliki.get('icon-192.png')); return w; }, 'лишний иконочный файл'],
  ['иконочное имя — не файл', (w) => { w.publiczne.set('icon-set', 'nie-plik'); return w; }, 'не обычный файл'],
  ['файла нет', (w) => { w.publiczne.delete('icon-192.png'); return w; }, 'файла нет'],
  ['dist отстал от public', (w) => { w.dist = new Map(pliki); w.dist.set('favicon.svg', Buffer.from('<svg/>')); return w; }, 'dist/favicon.svg'],
  ['лишний иконочный файл в dist', (w) => { w.dist = new Map(pliki); w.dist.set('favicon-48x48.png', pliki.get('icon-192.png')); return w; }, 'dist/favicon-48x48.png: лишний'],
  ['файла нет в dist', (w) => { w.dist = new Map(pliki); w.dist.delete('favicon.ico'); return w; }, 'dist/favicon.ico: файла нет'],
];

test('пробы прежнего --selftest: столько же, сколько было (94)', () => {
  assert.equal(PROBY.length, 94);
  assert.equal(new Set(PROBY.map(([n]) => n)).size, PROBY.length, 'имена проб повторяются');
});

test('пробы прежнего --selftest (сессия 11) — тестами', async (t) => {
  for (const [nazwa, mut, zhdem] of PROBY) {
    await t.test(nazwa, async () => {
      const { bledy } = await sverka(mut(czyste()));
      sudit(bledy, zhdem);
    });
  }
});

// ── Часть 2. Строки таблицы «Пределы после раунда 5» доклада сессии 11 о `znak.mjs` (П104 блок Г) ─────────────
// Оракул R5-SVERKA-1 — сам Tailwind сайта: `compile()` без сети по `global.css` с импортами из node_modules (замер
// сессии 20, бэклог 69 п. 1). Судья обязан отказать ⇔ на странице нет `--font-display` с 'Bodoni Moda' первым.
const twReq = createRequire(join(SAYT, 'package.json'));
const tw = await import(pathToFileURL(twReq.resolve('tailwindcss')).href);
const twCompile = tw.compile ?? tw.default?.compile;
const TW_PAPKA = dirname(twReq.resolve('tailwindcss/package.json'));
const CSS_PUT = join(SAYT, 'src/styles/global.css');
const naytiList = (id, base) => {
  if (id.startsWith('.') || id.startsWith('/')) return resolve(base, id);
  if (id === 'tailwindcss') return join(TW_PAPKA, 'index.css');
  if (id.startsWith('tailwindcss/')) return join(TW_PAPKA, id.slice('tailwindcss/'.length));
  return createRequire(join(base, 'x.js')).resolve(id);
};
/** Значения `--font-display`, которые Tailwind сайта выводит на страницу по этому листу. */
async function fontDisplayNaStranice(css) {
  const c = await twCompile(css, {
    base: dirname(CSS_PUT),
    from: CSS_PUT,
    loadStylesheet: async (id, base) => {
      const f = naytiList(id, base);
      return { path: f, base: dirname(f), content: readFileSync(f, 'utf8') };
    },
    onDependency: () => {},
  });
  return [...c.build([]).matchAll(/--font-display\s*:\s*([^;}]*)[;}]/g)].map((m) => m[1].trim());
}
const bodoniPervoy = (vse) => vse.length > 0 && vse.every((v) => /^(['"])Bodoni Moda\1\s*(,|$)/.test(v));
const otkazGarnitury = (bledy) => bledy.some((b) => b.startsWith('гарнитура'));

test('R5-SVERKA-1: сброс пространства темы — судья отказывает ровно тогда, когда Tailwind сайта снимает --font-display', async (t) => {
  assert.ok(bodoniPervoy(await fontDisplayNaStranice(baza.css)), 'оракул: на чистом листе --font-display с Бодони первым');
  const FD = '--font-display';
  const klyuchi = [];
  for (let n = 2; n <= FD.length; n++) klyuchi.push(`${FD.slice(0, n)}-*`);
  klyuchi.push('--*', '--color-*', '--fonts-*', '--font-displayx-*', '--font-sans-*');
  const mesta = [
    ...['', ' inline', ' static', ' reference', ' default'].map((vid) => [`поздний @theme${vid}`, (css, k) => `${css}\n@theme${vid} { ${k}: initial; }`]),
    ['основной @theme, после --font-display', (css, k) => css.replace(/(\n\s*--font-display:[^;]*;)/, `$1\n  ${k}: initial;`)],
    ['основной @theme, в начале', (css, k) => css.replace('\n@theme {', `\n@theme {\n  ${k}: initial;`)],
    ['свой @theme перед основным', (css, k) => css.replace('\n@theme {', `\n@theme { ${k}: initial; }\n@theme {`)],
  ];
  for (const k of klyuchi) {
    for (const [gde, mut] of mesta) {
      await t.test(`${k} — ${gde}`, async () => {
        const w = czyste();
        w.css = mut(w.css, k);
        assert.notEqual(w.css, baza.css, 'порча не применилась');
        const snyal = !bodoniPervoy(await fontDisplayNaStranice(w.css));
        const { bledy } = await sverka(w);
        assert.equal(otkazGarnitury(bledy), snyal, `Tailwind ${snyal ? 'снимает' : 'оставляет'} --font-display, а судья ${otkazGarnitury(bledy) ? 'отказал' : 'сверил'}: ${bledy.join(' | ') || '—'}`);
      });
    }
  }
});

// R5-SVERKA-5: судился только первый элемент списка --font-display. Список, который CSS не читает (font-family
// недействителен — значение var() на странице отбрасывается), — отказ; законные списки — сверено. Доказательство
// «не читается» — спецификация (<family-name> = <string> | <custom-ident>+, CSS-wide keywords не custom-ident) и
// lightningcss сайта (недействительный список он оставляет как есть, действительный — перепечатывает).
const SPISOK_ZAMENA = (v) => (w) => {
  w.css = w.css.replace(/--font-display:[^;]*;/, `--font-display: ${v};`);
  return w;
};
test('R5-SVERKA-5: хвост списка --font-display, который CSS не читает, — отказ; законный — сверено', async (t) => {
  const PLOHIE = ["'Bodoni Moda',, serif", "'Bodoni Moda', 'Public Sans' 'X'", "'Bodoni Moda', 10px", "'Bodoni Moda', serif,", "'Bodoni Moda', initial", "'Bodoni Moda', \"x\" y", "'Bodoni Moda', 3d"];
  const ZAKONNYE = ["'Bodoni Moda', ui-serif, Georgia, 'Times New Roman', serif", "'Bodoni Moda', Times New Roman, serif", '"Bodoni Moda", serif', "'Bodoni Moda'"];
  for (const v of PLOHIE) await t.test(`отказ: ${v}`, async () => sudit((await sverka(SPISOK_ZAMENA(v)(czyste()))).bledy, 'список --font-display не читается'));
  for (const v of ZAKONNYE) await t.test(`сверено: ${v}`, async () => sudit((await sverka(SPISOK_ZAMENA(v)(czyste()))).bledy, null));
});

// R5-SVERKA-3, R5-SVERKA-2: имена сравнивались без раскрытия экранирования CSS (продолжение строки в имени
// гарнитуры, экранирование в имени правила и в имени @property).
test('R5-SVERKA-3: своя @font-face с продолжением строки в имени гарнитуры или экранированием в имени правила — отказ', async (t) => {
  const SLUCHAI = [
    ['продолжение строки в имени', "\n@font-face { font-family: 'Bodoni \\\nModa'; src: url(x.woff2); }"],
    ['@font-f\\61 ce', "\n@font-f\\61 ce { font-family: 'Bodoni Moda'; src: url(x.woff2); }"],
    ['@\\66ont-face', "\n@\\66ont-face { font-family: 'Bodoni Moda'; src: url(x.woff2); }"],
  ];
  for (const [imya, css] of SLUCHAI) {
    await t.test(imya, async () => {
      const w = czyste();
      w.css += css;
      sudit((await sverka(w)).bledy, 'своя @font-face');
    });
  }
});
test('R5-SVERKA-2: @property токена знака с экранированием в имени — отказ', async (t) => {
  const SLUCHAI = [
    ['--acc\\65nt', "\n@property --acc\\65nt { syntax: '<color>'; inherits: false; initial-value: #ff0000; }"],
    ['@prop\\65rty --accent', "\n@prop\\65rty --accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }"],
  ];
  for (const [imya, css] of SLUCHAI) {
    await t.test(imya, async () => {
      const w = czyste();
      w.css += css;
      sudit((await sverka(w)).bledy, 'зарегистрирован @property');
    });
  }
});

// R5-SVERKA-4: ветви без своей пробы (краснота — мутацией ветви, журнал доклада).
test('R5-SVERKA-4: ветви без пробы — экранированный пробел в имени, двойные кавычки, @property --font-display, регистр @property', async (t) => {
  const SLUCHAI = [
    ['экранированный пробел в имени своей @font-face', (w) => { w.css += "\n@font-face { font-family: Bodoni\\ Moda; src: url(x.woff2); }"; return w; }, 'своя @font-face'],
    ['--font-display в двойных кавычках', SPISOK_ZAMENA('"Bodoni Moda", ui-serif, Georgia, serif'), null],
    // Tailwind для @property выводит запасное `--font-display: initial` на все элементы (браузеры без @property) —
    // оракул видит и это: два отказа законны.
    ['@property --font-display', (w) => { w.css += "\n@property --font-display { syntax: '*'; inherits: true; }"; return w; }, ['зарегистрирован @property', 'Tailwind сайта не выводит']],
    ['@PROPERTY прописными', (w) => { w.css += "\n@PROPERTY --accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }"; return w; }, 'зарегистрирован @property'],
  ];
  for (const [imya, mut, zhdem] of SLUCHAI) await t.test(imya, async () => sudit((await sverka(mut(czyste()))).bledy, zhdem));
});

// R5-SVERKA-7: модель с запасом давала ложный отказ — своя @font-face гарнитуры, имя которой только содержит
// «bodoni moda» (метрическая замена под другим именем), — законна.
test('R5-SVERKA-7: своя @font-face другой гарнитуры, в имени которой есть «Bodoni Moda», — сверено', async (t) => {
  const SLUCHAI = [
    ["'Bodoni Moda Fallback'", "\n@font-face { font-family: 'Bodoni Moda Fallback'; src: local('Georgia'); size-adjust: 104%; }"],
    ['Bodoni Moda SC без кавычек', '\n@font-face { font-family: Bodoni Moda SC; src: url(x.woff2); }'],
  ];
  for (const [imya, css] of SLUCHAI) {
    await t.test(imya, async () => {
      const w = czyste();
      w.css += css;
      sudit((await sverka(w)).bledy, null);
    });
  }
});

// ── Часть 3. Знак в сборке (П84 п. 2, П104 блок Г): гейт сайта и сторож сборки ─────────────────────────────────
// Гейт источников — `tools/geity.mjs` (`npm run gates`: гейты ядра и `znak.mjs --check`); сторож сборки
// `sayt:znak-dist` — прежний `--check --dist` на `astro:build:done`. Здесь — без сборки: сторож на своей папке
// иконок, подключение в конфиге и в скриптах; сборка копии с отказом знака — `znak-sborka.test.mjs`.
test('сторож сборки знака: иконки папки сборки = то, что пишет инструмент, — сверено; иначе отказ', async (t) => {
  const integ = znakDist();
  assert.equal(integ.name, 'sayt:znak-dist');
  const logger = { error: () => {}, info: () => {} };
  const storozh = (papka) => integ.hooks['astro:build:done']({ dir: pathToFileURL(papka + '/'), logger });
  const papkaS = (pravka) => {
    const d = mkdtempSync(join(tmpdir(), 'znak-dist-'));
    const m = new Map(pliki);
    pravka?.(m);
    for (const [imie, buf] of m) writeFileSync(join(d, imie), buf);
    writeFileSync(join(d, 'index.html'), '<!doctype html><title>x</title>');
    return d;
  };
  const SLUCHAI = [
    ['контроль: иконки как у инструмента', null, null],
    ['favicon.svg в сборке другой', (m) => m.set('favicon.svg', Buffer.from('<svg/>')), /dist\/favicon\.svg: байты не равны/],
    ['лишний иконочный файл в сборке', (m) => m.set('favicon-48x48.png', pliki.get('icon-192.png')), /dist\/favicon-48x48\.png: лишний/],
    ['иконки нет в сборке', (m) => m.delete('favicon.ico'), /dist\/favicon\.ico: файла нет/],
  ];
  for (const [imya, pravka, zhdem] of SLUCHAI) {
    await t.test(imya, async () => {
      const d = papkaS(pravka);
      try {
        if (zhdem === null) await storozh(d);
        else await assert.rejects(() => storozh(d), zhdem);
      } finally {
        rmSync(d, { recursive: true, force: true });
      }
    });
  }
});

test('знак в сборке: сторож sayt:znak-dist подключён в astro.config.mjs, npm run gates — гейты сайта (ядро и знак)', async () => {
  const { default: konfig } = await import('../../astro.config.mjs');
  assert.ok(konfig.integrations.some((i) => i?.name === 'sayt:znak-dist'), 'в astro.config.mjs нет сторожа sayt:znak-dist');
  const pkg = JSON.parse(readFileSync(join(SAYT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.gates, 'node tools/geity.mjs');
  assert.equal(pkg.scripts.build, 'npm run gates && astro build');
  assert.equal(pkg.scripts['znak:selftest'], undefined, 'znak:selftest убран (пробы — тестами)');
  const geity = readFileSync(join(SAYT, 'tools/geity.mjs'), 'utf8');
  assert.match(geity, /core\/gates\/run\.mjs/);
  assert.match(geity, /tools\/znak\.mjs'\), '--check'/);
});

// ── Часть 4. «Судью судят» по блоку Г, раунд 1 (GR1-*): оракул спрашивал Tailwind не так, как сборка ─────────
// Сборка (плагин Vite) зовёт compile() @tailwindcss/node (свой разрешатель, loadModule), кандидаты сканера oxide
// по источникам листа, build(кандидаты) и optimize(); оракул звал compile() tailwindcss без кандидатов и искал
// --font-display регулярным выражением по тексту. Отсюда пропуски в импортированных листах и разметке и ложные
// отказы на законных листах. Импортированный лист и разметка — временными файлами (лист — после импортов ядра).
/** Точная замена единственного вхождения — порча, которая не применилась, громко падает. */
function zamenitStroku(s, iz, na) {
  const n = s.split(iz).length - 1;
  if (n !== 1) throw new Error(`порча: «${iz.slice(0, 60)}» встречается ${n} раз, а нужен один`);
  return s.replace(iz, () => na);
}
const POSLE_YADRA = "@import '@factory/core/styles/a11y.css';";
const vremennaya = () => mkdtempSync(join(tmpdir(), 'znak-gr1-'));
const put = (p) => p.replace(/\\/g, '/');
const sListom = (w, tekst) => {
  const d = vremennaya();
  writeFileSync(join(d, 'list.css'), tekst);
  w.css = w.css.replace(POSLE_YADRA, `${POSLE_YADRA}\n@import '${put(join(d, 'list.css'))}';`);
  return w;
};
const sRazmetkoy = (w, html) => {
  const d = vremennaya();
  writeFileSync(join(d, 'x.html'), html);
  w.css = w.css.replace("@import 'tailwindcss' source('../../src');", `@import 'tailwindcss' source('../../src');\n@source '${put(d)}';`);
  return w;
};
test('GR1: гарнитура на странице — как её собирает сборка (импорты, кандидаты, экранирование, своя @font-face, CDO)', async (t) => {
  const SLUCHAI = [
    ['GR1-K-1 произвольное свойство [--font-display:Georgia] в разметке', (w) => sRazmetkoy(w, '<p class="[--font-display:Georgia]">x</p>'), 'Tailwind сайта не выводит'],
    ['GR1-K-1 @utility с --font-display в импортированном листе и класс в разметке', (w) => sRazmetkoy(sListom(w, '@utility zag-x { --font-display: Georgia; }\n'), '<p class="zag-x">x</p>'), 'Tailwind сайта не выводит'],
    ...["'Bodoni Moda', 10px", "'Bodoni Moda',, serif", "'Bodoni Moda', initial"].map((v) => [`GR1-K-2 в @theme импортированного листа ${v}`, (w) => sListom(w, `@theme { --font-display: ${v}; }\n`), 'Tailwind сайта не выводит']),
    ["GR1-K-2 в :root импортированного листа 'Bodoni Moda',, serif", (w) => sListom(w, ":root { --font-display: 'Bodoni Moda',, serif; }\n"), 'Tailwind сайта не выводит'],
    ['GR1-K-3 экранированное имя в импортированном листе --font-displ\\61y', (w) => sListom(w, ':root { --font-displ\\61y: Georgia, serif; }\n'), 'Tailwind сайта не выводит'],
    ['GR1-K-3 экранированное имя в импортированном листе \\2d-font-display', (w) => sListom(w, ':root { \\2d-font-display: Georgia, serif; }\n'), 'Tailwind сайта не выводит'],
    ['GR1-K-3 экранированное имя в импортированном листе --font-d\\69splay', (w) => sListom(w, ':root { --font-d\\69splay: Georgia, serif; }\n'), 'Tailwind сайта не выводит'],
    ['GR1-K-4 своя @font-face Бодони в импортированном листе', (w) => sListom(w, "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }\n"), 'своя @font-face'],
    ['GR1-K-5 CDO перед @property --accent', (w) => { w.css += "\n<!-- @property --accent { syntax: '<color>'; inherits: false; initial-value: red; }"; return w; }, 'CDO или CDC'],
    ['GR1-K-5 CDO перед своей @font-face Бодони', (w) => { w.css += "\n<!-- @font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }"; return w; }, 'CDO или CDC'],
    ['GR1-K-5 CDC перед правилом', (w) => { w.css += '\n--> .x { color: red; }'; return w; }, 'CDO или CDC'],
  ];
  for (const [imya, mut, zhdem] of SLUCHAI) await t.test(imya, async () => sudit((await sverka(mut(czyste()))).bledy, zhdem));
});
test('GR1: законные листы — сверено (подпути Tailwind, @plugin, var(--font-display) только у ядра, повторное объявление, комментарий, строка)', async (t) => {
  const d = vremennaya();
  writeFileSync(join(d, 'plagin.mjs'), 'export default function () {}\n');
  const SLUCHAI = [
    ['GR1-Z-1 подпути tailwindcss без .css', (w) => { w.css = zamenitStroku(w.css, "@import 'tailwindcss' source('../../src');", "@import 'tailwindcss/theme' layer(theme);\n@import 'tailwindcss/preflight' layer(base);\n@import 'tailwindcss/utilities' layer(utilities) source('../../src');"); return w; }],
    ['GR1-Z-2 @plugin', (w) => { w.css = zamenitStroku(w.css, "@import 'tailwindcss' source('../../src');", `@import 'tailwindcss' source('../../src');\n@plugin '${put(join(d, 'plagin.mjs'))}';`); return w; }],
    ['GR1-Z-3 роль .t-headline без var(--font-display) в листе (переменную держат компоненты ядра)', (w) => { w.css = zamenitStroku(w.css, '.t-headline {\n  font-family: var(--font-display);\n', '.t-headline {\n'); return w; }],
    ['GR1-Z-4 сброс и повторное объявление в позднем @theme', (w) => { w.css += "\n@theme { --font-*: initial; --font-display: 'Bodoni Moda', serif; }"; return w; }],
    ["GR1-Z-5 комментарий /*! */ с прежней гарнитурой", (w) => { w.css = zamenitStroku(w.css, '\n@theme {', "\n/*! прежде: --font-display: 'Libre Bodoni'; */\n@theme {"); return w; }],
    ['GR1-Z-5 строка content со словами --font-display', (w) => { w.css += '\n.otladka::after { content: "--font-display: serif;"; }'; return w; }],
  ];
  for (const [imya, mut] of SLUCHAI) await t.test(imya, async () => sudit((await sverka(mut(czyste()))).bledy, null));
});
test('GR1-Z-6: продолжение строки внутри слова в имени своей @font-face — отказ', async () => {
  const w = czyste();
  w.css += "\n@font-face { font-family: 'Bodoni Mo\\\nda'; src: url(x.woff2); }";
  sudit((await sverka(w)).bledy, 'своя @font-face');
});
test('GR1-Z-7: Tailwind не собирает лист, принятый моделью (@import несуществующего листа), — отказ «не собрал»', async () => {
  const w = czyste();
  w.css = zamenitStroku(w.css, POSLE_YADRA, `${POSLE_YADRA}\n@import './net-takogo-lista.css';`);
  sudit((await sverka(w)).bledy, 'Tailwind сайта не собрал');
});
test('GR1-Z-8: CSS-wide keywords и default в списке — отказ; экранирование в имени и в строке — сверено', async (t) => {
  for (const k of ['inherit', 'unset', 'revert', 'revert-layer', 'default']) await t.test(`отказ: 'Bodoni Moda', ${k}`, async () => sudit((await sverka(SPISOK_ZAMENA(`'Bodoni Moda', ${k}`)(czyste()))).bledy, 'список --font-display не читается'));
  for (const v of ["'Bodoni Moda', Noto\\ Serif, serif", "'Bodoni Moda', 'Times\\' New', serif"]) await t.test(`сверено: ${v}`, async () => sudit((await sverka(SPISOK_ZAMENA(v)(czyste()))).bledy, null));
});
test('GR1-Z-10: прежняя команда --selftest — код 2 и «перенесён в тесты» (выход раньше записи)', () => {
  const r = spawnSync(process.execPath, [join(SAYT, 'tools/znak.mjs'), '--check', '--selftest'], { cwd: SAYT, encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--selftest перенесён в тесты/);
});
test.todo('GR1-K-6 (предел): правило роли заголовка с другой гарнитурой (.t-headline { font-family: Georgia }) — не судится: судья знака судит --font-display, а не то, что роль берёт гарнитуру темы (строка «все» «Пределов после раунда 5»; её видят кадры эталона)');
