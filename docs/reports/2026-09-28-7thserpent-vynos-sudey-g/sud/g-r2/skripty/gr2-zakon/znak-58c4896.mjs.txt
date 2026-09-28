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
 *        с нечитаемым именем (экранирование в имени), custom property
 *        со значением-блоком (`--имя: {…}` — браузер объявит его, разбор увидел
 *        бы правило), сброс пространства имён не `initial`, лишняя «}»
 *        на верхнем уровне, незакрытый блок. Имена свойств — идентификаторы CSS,
 *        в том числе не-ASCII; сброс Tailwind `--x-*: initial` читается как сброс;
 *     1) краска — токен темы: имя объявлено в верхнем блоке `:root { … }`
 *        `global.css` (селектор ровно `:root`; его и получает компонент через
 *        `var()`), каждое объявление там — ровно `#rrggbb`, все равны, и больше
 *        нигде в листе (другие селекторы, `@media`, `@layer`, `@theme`) это имя
 *        не объявлено и не зарегистрировано `@property`; токен в комментарии
 *        или строке — не токен;
 *     2) гарнитура — тема: среди операторов верхнего уровня `global.css` есть
 *        ровно `@import '@fontsource/bodoni-moda/latin-600.css';` (без условий
 *        media и supports, не в блоке), своей `@font-face` для 'Bodoni Moda'
 *        в листе нет ни на какой глубине (имя сравнивается как его читает CSS:
 *        регистр, кавычки, пробелы, экранирование), а `--font-display` объявлен
 *        только в верхнем `@theme` (голом, `inline` или `static`; `@theme reference`
 *        в CSS не выходит), первым в списке стоит ровно 'Bodoni Moda' (за ним —
 *        запятая или конец), весь список читается как `font-family` (строка или
 *        имена через запятую, без пустых элементов, чисел и CSS-wide keywords —
 *        R5-SVERKA-5), сброса `--font-*` или `--*` после него в `@theme` нет
 *        и `@property --font-display` нет; ПОСЛЕДНЕЕ СЛОВО — самому Tailwind сайта:
 *        `compile()` пакета сайта без сети по `global.css` с его импортами обязан
 *        вывести на страницу `--font-display` с 'Bodoni Moda' первым — так судятся
 *        сбросы любым префиксом ключа (`--f-*`, `---*`, `--font-display-*`), в любом
 *        виде `@theme` (и `reference`, и `default`) и в импортированных листах
 *        (R5-SVERKA-1; лист, который модель уже отвергла, Tailwind не судит); своя
 *        `@font-face` — с раскрытым экранированием в имени правила и гарнитуры
 *        (и продолжение строки) и ровно 'Bodoni Moda', а не имя, которое его
 *        содержит (R5-SVERKA-3, -7); имя `@property` — с раскрытым экранированием
 *        (R5-SVERKA-2); файл контуров — woff из `@font-face`
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
 *   Пробы сверки на мутациях настоящих входов в памяти — тесты `tools/testy/znak.test.mjs`
 *     (прежний режим `--selftest`, 94 пробы, перенесены один к одному, П104 блок Г): проба
 *     проходит, только если отказ есть, КАЖДАЯ его строка — ожидаемого вида и каждый
 *     названный вид встретился (или отказа нет у пробы «сверено»); запуск — `npm run proverki`.
 *
 * Что сверка НЕ судит и кто судит это (судья собранной страницы в браузере —
 * `docs/reports/2026-09-24-7thserpent-znak/instrumenty/wiernosc.mjs`): как знак
 * рисует браузер (каскад, обводка «TH», принудительные цвета, знак = одобренный
 * эскиз A), ссылки иконок в `<head>` собранной страницы и запросы браузера,
 * подписи ссылки знака и картинки подвала против видимого имени. Листы,
 * которые `global.css` импортирует (ядро, `tailwindcss`, `@fontsource`), сверка
 * для красок не читает (гарнитуру на странице — читает, через Tailwind сайта,
 * R5-SVERKA-1): переопределение токена там видит только судья в браузере
 * (краска частей знака = литералы иконки). Разбор — модель CSS, а не CSS:
 * то, что он понимает, он судит строго, а для форм, которых не знает сегодня,
 * последний судья — вычисленные краски на собранной странице (`wiernosc.mjs`).
 *
 * ФАЙЛЫ: `favicon.svg` (вкладку Chromium 151 с окном рисует из него — доказано
 * цветом, `vkladka-dowod.mjs` доклада), `favicon.ico` (16 и 32, PNG внутри),
 * `favicon-16x16.png` и `favicon-32x32.png`, `icon-192.png`,
 * `apple-touch-icon.png` (180). Назначение ICO, PNG, 192 и 180 — клиентам,
 * которые берут `/favicon.ico` сами, браузерам без SVG-иконок, ярлыку Android
 * и домашнему экрану iOS (углы скругляет система) — это назначение, не проверка:
 * в Chromium 151 проверено только, что вкладка берёт `favicon.svg`, а без ссылки
 * на него — `favicon-32x32.png` (и при масштабе 1); ICO, 192 и 180 не проверены
 * нигде (бэклог 60 п. 4). 16 px — свой рисунок по пиксельной сетке
 * (`ikona16`), остальные — `ikona`.
 *
 * ПРЕДЕЛЫ (названы): контуры считает `fontkitten` — зависимость Astro, а не
 * сайта; пропадёт из дерева — инструмент не запустится ни в каком режиме
 * (ошибка импорта Node, а не отказ сверки). Гарнитуру на странице судит
 * `compile()` пакета `tailwindcss` сайта (его API, версия — по lock): смена
 * поведения Tailwind меняет вердикт вместе со страницей — это и нужно. Запас
 * в безопасную сторону (ложный отказ, R5-SVERKA-7): пробелы в имени своей
 * `@font-face` сводятся и в кавычках (`'bodoni   moda'` — отказ, хотя для CSS это
 * другая гарнитура); имя из `--` в списке `--font-display` не читается; не-ASCII
 * принимается только в именах custom property; `@theme default` у основного
 * `--font-display` — отказ «вне верхнего @theme», хотя Tailwind его выводит. Кернинга у контуров нет (fontkitten
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
 * со `--bg` не сверяется. В сборке (П84 п. 2, П104 блок Г): `--check` — гейт сайта
 * (`tools/geity.mjs`, `npm run gates`, до `astro build`), сверка иконок сборки —
 * сторож `sayt:znak-dist` (`astro.config.mjs`); отказ любого роняет сборку.
 * Судьи знака в браузере (`wiernosc.mjs` и остальные в папке доклада сессии 11) —
 * ручные, вне сборки и гейтов (П84 п. 6: `playwright-core` не зависимость).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(join(siteRoot, 'package.json'));
const sharp = require('sharp');
const fk = await import(pathToFileURL(require.resolve('fontkitten')).href);
// Tailwind сайта — оракул гарнитуры на странице (R5-SVERKA-1).
const twModul = await import(pathToFileURL(require.resolve('tailwindcss')).href);
const twCompile = twModul.compile ?? twModul.default?.compile;

export const IMPORT_GARNITURY = '@fontsource/bodoni-moda/latin-600.css';
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
    // Имя: идентификатор CSS (и не-ASCII), обычное свойство или сброс пространства
    // имён Tailwind `--x-*` / `--*` (только со значением initial).
    const m = /^(--[-\w\u0080-￿]+|--(?:[-\w]*-)?\*|-?[a-zA-Z][a-zA-Z0-9-]*)\s*:([\s\S]*)$/.exec(t);
    if (!m) { bledy.push(`лист: объявление не читается: «${skrot(t)}» — сверка не знает, что оно объявляет`); return; }
    if (m[1].endsWith('*') && m[2].trim() !== 'initial') { bledy.push(`лист: объявление не читается: «${skrot(t)}» — сброс пространства имён бывает только initial`); return; }
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
        // `--имя: … {` — у custom property блок входит в значение: браузер объявит
        // --имя, а разбор увидел бы вложенное правило (R4-SVERKA-1).
        if (/^--[^:{}]*:/.test(prelude)) bledy.push(`лист: у ${prelude.split(':')[0].trim()} значение-блок «{…}» — браузер читает это как объявление, сверка его не судит`);
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

/**
 * Экранирование CSS раскрыто, как читает браузер (CSS Syntax, «consume an escaped code point»): `\` + 1–6 hex
 * (+ один пробельный) — знак (0, суррогат и больше U+10FFFF — U+FFFD); `\` + перевод строки — ничего
 * (продолжение строки в строке CSS); `\` + прочий знак — сам знак (R5-SVERKA-2, -3).
 */
export const razekranirovat = (s) =>
  String(s).replace(/\\(?:([0-9a-fA-F]{1,6})(?:\r\n|[ \t\n\r\f])?|(\r\n|[\n\r\f])|([\s\S]))/g, (_, h, nl, c) => {
    if (h) {
      const n = parseInt(h, 16);
      return n === 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff) ? '�' : String.fromCodePoint(n);
    }
    return nl ? '' : c ?? '';
  });

const CSS_SHIROKIE = new Set(['initial', 'inherit', 'unset', 'revert', 'revert-layer', 'default']);
const IDENT = /^-?(?:[a-zA-Z_\u0080-￿]|\\[0-9a-fA-F]{1,6}[ \t\n\r\f]?|\\[^\n\r\f0-9a-fA-F])(?:[-\w\u0080-￿]|\\[0-9a-fA-F]{1,6}[ \t\n\r\f]?|\\[^\n\r\f0-9a-fA-F])*/;
/**
 * Читается ли значение как `font-family` (R5-SVERKA-5): элементы через запятую, каждый — ровно одна строка или
 * одно и больше имён (`<family-name> = <string> | <custom-ident>+`), без CSS-wide keywords и `default`; пустой
 * элемент, две строки подряд, число, функция — не читается.
 */
export function spisokGarniturChitaetsya(v) {
  const s = String(v).trim();
  const elementy = [[]];
  for (let i = 0; i < s.length; ) {
    if (/\s/.test(s[i])) {
      i++;
      continue;
    }
    if (s[i] === ',') {
      elementy.push([]);
      i++;
      continue;
    }
    if (s[i] === '"' || s[i] === "'") {
      let j = i + 1;
      while (j < s.length && s[j] !== s[i]) j += s[j] === '\\' ? 2 : 1;
      if (j >= s.length) return false;
      elementy.at(-1).push({ stroka: true });
      i = j + 1;
      continue;
    }
    const m = IDENT.exec(s.slice(i));
    if (!m) return false;
    elementy.at(-1).push({ stroka: false, imya: razekranirovat(m[0]).toLowerCase() });
    i += m[0].length;
  }
  return elementy.every((e) => e.length > 0 && ((e.length === 1 && e[0].stroka) || e.every((x) => !x.stroka && !CSS_SHIROKIE.has(x.imya))));
}

/**
 * Значения `--font-display`, которые Tailwind сайта выводит на страницу по этому листу `global.css`
 * (`compile()` пакета сайта; импорты — из `node_modules` и ядра, без сети; R5-SVERKA-1).
 */
async function fontDisplayTailwind(css) {
  const cssPut = join(siteRoot, 'src/styles/global.css');
  const twPapka = dirname(require.resolve('tailwindcss/package.json'));
  const nayti = (id, base) => {
    if (id.startsWith('.') || id.startsWith('/')) return resolve(base, id);
    if (id === 'tailwindcss') return join(twPapka, 'index.css');
    if (id.startsWith('tailwindcss/')) return join(twPapka, id.slice('tailwindcss/'.length));
    return createRequire(join(base, 'x.js')).resolve(id);
  };
  const c = await twCompile(css, {
    base: dirname(cssPut),
    from: cssPut,
    loadStylesheet: async (id, base) => {
      const f = nayti(id, base);
      return { path: f, base: dirname(f), content: readFileSync(f, 'utf8') };
    },
    onDependency: () => {},
  });
  return [...c.build([]).matchAll(/--font-display\s*:\s*([^;}]*)[;}]/g)].map((m) => m[1].trim());
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
export function ico(obrazy) {
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
export const SYG_PNG = Buffer.from('89504e470d0a1a0a', 'hex');
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
  // Краски, которые рисунки действительно взяли, — для строки итога (R4-SVERKA-6, -7).
  const kraski = new Map();
  const farba = (imie, gdzie) => { const v = kraska(dekl, imie, gdzie, bledy); kraski.set(imie, v); return v; };
  const imenaKrasok = new Set([
    ...w.znak.shapka.czesci.map((c) => c.farba), ...(w.znak.shapka.napisy ?? []).map((n) => n.farba),
    ...[w.znak.ikona, w.znak.ikona16].flatMap((ik) => [ik.tlo, ...(ik.czesci ?? []).map((c) => c.farba), ...(ik.prostokaty ?? []).map((p) => p.farba)]),
  ]);

  // 2. Гарнитура — тема.
  const importy = drzewo.filter((u) => u.oper && /^@import\b/.test(u.prelude)).map((u) => u.prelude);
  const nuzhny = [`@import '${IMPORT_GARNITURY}'`, `@import "${IMPORT_GARNITURY}"`];
  if (!importy.some((p) => nuzhny.includes(p))) {
    const pohozhie = importy.filter((p) => p.includes('bodoni-moda'));
    bledy.push(`гарнитура: среди операторов верхнего уровня global.css нет ровно @import '${IMPORT_GARNITURY}';${pohozhie.length ? ` (есть: ${pohozhie.join(' | ')})` : ''} — буквы знака не стоят на гарнитуре темы`);
  }
  const vlozhennye = [];
  const svoiFontFace = [];
  const property = [];
  // Имя гарнитуры — как его читает CSS: экранирование раскрыто (и продолжение строки, R5-SVERKA-3), кавычки сняты,
  // пробелы сведены, регистр не важен (R4-SVERKA-3); своя гарнитура — ровно 'bodoni moda', а не имя, которое его
  // только содержит (метрическая замена 'Bodoni Moda Fallback' законна, R5-SVERKA-7).
  const imyaGarnitury = (v) => razekranirovat(v).replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const iskat = (lista) => {
    for (const u of lista) {
      // Имя правила — с раскрытым экранированием: `@font-f\61 ce` — это @font-face (R5-SVERKA-3).
      const prelude = razekranirovat(u.prelude ?? '').trim();
      if (!u.oper && /^@font-face$/i.test(prelude) && (u.decls ?? []).some((d) => d.imie.toLowerCase() === 'font-family' && imyaGarnitury(d.wartosc) === 'bodoni moda')) svoiFontFace.push(u.prelude);
      // @property у токена знака меняет его на странице (наследование, синтаксис,
      // начальное значение) — R4-SVERKA-2; имя — с раскрытым экранированием (R5-SVERKA-2).
      const pr = /^@property\s+--([-\w\u0080-￿]+)$/i.exec(prelude);
      if (pr && (imenaKrasok.has(pr[1]) || pr[1] === 'font-display')) property.push(`--${pr[1]}`);
      for (const c of u.children ?? []) if (c.oper && c.prelude.includes('bodoni-moda')) vlozhennye.push(`${u.prelude} { ${c.prelude} }`);
      iskat(u.children ?? []);
    }
  };
  iskat(drzewo);
  if (vlozhennye.length) bledy.push(`гарнитура: импорт Бодони внутри блока: ${vlozhennye.join('; ')}`);
  if (svoiFontFace.length) bledy.push(`гарнитура: в global.css своя @font-face для 'Bodoni Moda' (${svoiFontFace.length}) — она подменит файл темы, а контуры знака считаются из файла темы`);
  if (property.length) bledy.push(`краска: токен ${property.join(', ')} зарегистрирован @property — наследование, синтаксис и начальное значение меняют его на странице, иконки этого не знают`);
  const fd = dekl.filter((d) => d.imie === 'font-display');
  const fdTheme = fd.filter((d) => d.gde === '@theme');
  // Список гарнитур начинается ровно с 'Bodoni Moda' — за ним запятая или конец (R4-SVERKA-8), и весь список
  // читается как font-family (R5-SVERKA-5: недействительный список через var() на странице отбрасывается).
  if (!fdTheme.length || !fdTheme.every((d) => /^(['"])Bodoni Moda\1\s*(,|$)/.test(d.wartosc))) bledy.push(`гарнитура: --font-display в верхнем @theme не начинается с 'Bodoni Moda' (${fdTheme.length ? fdTheme.map((d) => d.wartosc).join(' | ') : 'нет'})`);
  else {
    const nechitaemye = fdTheme.filter((d) => !spisokGarniturChitaetsya(d.wartosc));
    if (nechitaemye.length) bledy.push(`гарнитура: список --font-display не читается как font-family (${nechitaemye.map((d) => d.wartosc).join(' | ')}) — на странице гарнитура заголовков падает на наследуемую`);
  }
  if (fd.some((d) => d.gde !== '@theme')) bledy.push(`гарнитура: --font-display объявлен вне верхнего @theme (${fd.filter((d) => d.gde !== '@theme').map((d) => d.gde).join(', ')})`);
  // Сброс пространства имён в @theme после --font-display его убирает (R4-SVERKA-9);
  // сброс до него и сброс чужого пространства — законная идиома Tailwind.
  const poFd = dekl.findIndex((d) => d.imie === 'font-display' && d.gde === '@theme');
  const sbrosy = dekl.map((d, k) => ({ ...d, k })).filter((d) => d.gde === '@theme' && (d.imie === '*' || d.imie === 'font-*') && d.k > poFd && poFd >= 0);
  if (sbrosy.length) bledy.push(`гарнитура: сброс --${sbrosy[0].imie}: initial в @theme стоит после --font-display — Tailwind уберёт его из CSS страницы`);
  // Последнее слово — самому Tailwind сайта (R5-SVERKA-1): сброс пространства темы убирает всякий ключ, который
  // начинается его префиксом (`--f-*`, `---*`, `--font-display-*`), в любом виде @theme (и reference, и default),
  // и в листах, которые global.css импортирует. Модель выше этого не знает — судья спрашивает `compile()` Tailwind
  // сайта без сети, что выйдет на страницу. Лист, который модель уже отвергла, Tailwind не судит.
  if (!bledy.some((b) => /^(лист:|гарнитура: (--font-display|сброс|список))/.test(b))) {
    try {
      const naStranice = await fontDisplayTailwind(w.css);
      if (!naStranice.length || !naStranice.every((v) => /^(['"])Bodoni Moda\1\s*(,|$)/.test(v))) {
        bledy.push(`гарнитура: Tailwind сайта не выводит на страницу --font-display с 'Bodoni Moda' первым (выводит: ${naStranice.join(' | ') || 'ничего'}) — сброс пространства темы или вид @theme убрал гарнитуру знака`);
      }
    } catch (e) {
      bledy.push(`гарнитура: Tailwind сайта не собрал global.css (${String(e.message).split('\n')[0]}) — гарнитуру на странице судить нечем`);
    }
  }
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
  return { bledy, pliki, kraski };
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
/** Входы с диска; `dist` — true (папка `dist/` сайта), путь к папке сборки или false. */
export function wejscie({ dist = false } = {}) {
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
    ...(dist ? { dist: katalog(dist === true ? join(siteRoot, 'dist') : dist) } : {}),
  };
}

/**
 * Сторож сборки (П104 блок Г: «сверка --dist (иконки dist/ = public/) — сторожем сборки»): после `astro build` —
 * та же сверка, что `--check --dist`: краски, гарнитура, иконки `public/` и иконки собранной папки — то, что пишет
 * инструмент; отказ роняет сборку. Гейт источников (до сборки) — `tools/geity.mjs` (`znak.mjs --check`).
 * @returns {import('astro').AstroIntegration}
 */
export default function znakDist() {
  return {
    name: 'sayt:znak-dist',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const w = wejscie({ dist: fileURLToPath(dir) });
        const { bledy, pliki } = await sverka(w);
        if (bledy.length) {
          logger.error(`знак: отказ — ${bledy.length}`);
          throw new Error(`Знак сайта разошёлся с источником — ${bledy.length}:\n` + bledy.map((b) => `  - ${b}`).join('\n') + '\nnpm run znak, затем сборка.');
        }
        logger.info(`знак: сверено — ${pliki.size} иконок public/ и сборки равны тому, что пишет инструмент; краски и гарнитура — тема`);
      },
    },
  };
}

// ── Запуск ───────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const CHECK = process.argv.includes('--check');
  try {
    if (process.argv.includes('--selftest')) {
      // Пробы — тестами (П104 блок Г); прежняя команда не должна молча давать «прошло».
      console.error('znak: --selftest перенесён в тесты tools/testy/znak.test.mjs — запуск: npm run proverki');
      process.exit(2);
    } else {
      const w = wejscie({ dist: process.argv.includes('--dist') });
      // Сверка иконок сборки — и сторожем сборки (`sayt:znak-dist`); `--dist` вручную — для проверки готовой dist/.
      const { bledy, pliki, kraski } = await sverka({ ...w, publiczne: CHECK ? w.publiczne : null, dist: w.dist });
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
      const kolory = [...kraski].map(([t, v]) => `${t} ${v}`).join(', ');
      console.log(`znak: ${CHECK ? 'сверено' : 'записано'} — ${pliki.size} иконок public/${w.dist ? ' и dist/' : ''} (${[...pliki.keys()].join(', ')}); надписей ${w.znak.shapka.napisy.length} — контуры равны ${w.fontPlik}; краски, которые взяли три рисунка: ${kolory}`);
    }
  } catch (e) {
    console.error(`znak: ОТКАЗ — ${e.message}`);
    for (const b of e.bledy ?? []) console.error(`  - ${b}`);
    process.exit(1);
  }
}
