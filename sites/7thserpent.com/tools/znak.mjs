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
 *        R5-SVERKA-5, без родового имени первым в цепочке имён — GR3-K-3; элемент
 *        `var(--имя[, запас])` — по форме, его значение судит страница — GR3-Z-1),
 *        сброса `--font-*` или `--*` после него в `@theme` нет
 *        и `@property --font-display` нет; ПОСЛЕДНЕЕ СЛОВО — самому Tailwind сайта:
 *        CSS страницы собирается путём сборки (плагин @tailwindcss/vite: `compile()`
 *        @tailwindcss/node с разрешателями Vite, как их строит плагин, — настройки
 *        `vite` сайта из `astro.config.mjs`, корень Vite — папка сайта, GR3-K-2, -Z-2;
 *        кандидаты сканера oxide по источникам листа, `build`, `optimize`; без сети);
 *        чего путь судьи не повторяет — плагин Vite сайта, кроме Tailwind, `vite.css`,
 *        PostCSS (файл настроек или поле `postcss` от корня Vite до корня диска),
 *        `paths` tsconfig — громкий отказ «в конвейере CSS сборки»; вывод читается
 *        разбором сверки — каждое `--font-display`
 *        на странице обязано нести 'Bodoni Moda' первым и читаемый список (`var()` —
 *        по объявлениям на странице без условий, запас — если имени нет), хотя бы одно —
 *        на `:root` без условий (под `@media`, `@supports`, `@container` — отказ, GR3-K-1), своя
 *        `@font-face` 'Bodoni Moda' на любой глубине — ровно грань пакета темы (все его
 *        листы — начертания, подмножества — тем же путём сборки: дескрипторы и `src`
 *        целиком; `local()`, чужой адрес, другой файл под тем же весом — отказ),
 *        и знаки начертания темы (normal 600) по обратному порядку определения берёт
 *        только грань с `src` темы (грань пакета с другим файлом позже темы — отказ),
 *        импорт, который путь сборки не раскрыл (`@import url(…)`, удалённый), и
 *        `@property --font-display` на любой глубине — отказ; так судятся сбросы любым
 *        префиксом ключа (`--f-*`, `---*`, `--font-display-*`), в любом виде `@theme`
 *        (и `reference`, и `default`), импортированные листы (и экранированные имена
 *        в них), утилиты и произвольные свойства из разметки (R5-SVERKA-1, GR1-K-1…K-4,
 *        GR2-K-1…K-3, GR2-Z-1); лист, который модель уже отвергла как нечитаемый или
 *        по месту, сбросу и списку `--font-display`, Tailwind не судит (GR1-Z-11); своя
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
 * (ошибка импорта Node, а не отказ сверки). Гарнитуру на странице судит путь
 * сборки — `@tailwindcss/node` и `@tailwindcss/oxide`, зависимости `@tailwindcss/vite`
 * сайта, а не сайта (их API, версии — по lock; пропадут — инструмент не запустится):
 * смена поведения Tailwind меняет вердикт вместе со страницей — это и нужно;
 * кандидаты сканера — один раз на процесс для тех же источников, грани пакета темы —
 * один раз на процесс (обновление пакета меняет их вместе со страницей). Путь судьи —
 * путь плагина с оговорками (GR3): окружение разрешателя — ssr (для CSS с явными условиями
 * плагина client отвечает так же: сборка копии сайта с пакетом по условиям node, browser, import,
 * style, default взяла import.css, оба разрешателя — тоже; замер —
 * `docs/reports/2026-09-28-7thserpent-vynos-sudey-g/sud/g-r3/dop/okruzhenie.txt`); `optimize` — без сжатия (сборка сжимает; разбор
 * судит то же дерево); собственные плагины и псевдонимы Astro в конфигурации Vite не
 * повторяются — только настройки `vite` сайта; грань в правиле перехвата с весом не числом
 * годится для роли, но на вердикт это не влияет (такая грань — не грань пакета темы). Роль заголовка
 * с другой гарнитурой (`.t-headline { font-family: Georgia }`) не судится: судится
 * `--font-display`, а не то, что роль берёт гарнитуру темы (строка «все» «Пределов
 * после раунда 5»; её видят кадры эталона; GR1-K-6, тест todo). Судится CSS, который
 * вырастает из `global.css`: `<style>` компонентов Astro (сайта и ядра) и `style=`
 * разметки судья знака не судит (GR2-K-4, тест todo). Кандидат с `--font-display`
 * текстом в любом файле зоны сканера — отказ, даже если класс не стоит ни на одном
 * элементе: судится каждое `--font-display` вывода (GR2-Z-2, тест todo). CDO и CDC
 * токеном в начале правила на верхнем уровне — громкий отказ, хотя браузер их
 * отбрасывает (GR1-K-5); внутри строк, имён и прелюдий это не они (GR2-Z-3). Запас
 * в безопасную сторону (ложный отказ, R5-SVERKA-7): пробелы в имени своей
 * `@font-face` сводятся и в кавычках (`'bodoni   moda'` — отказ, хотя для CSS это
 * другая гарнитура); грань пакета темы того же начертания с другим
 * файлом позже темы — отказ, хотя гарнитура та же (600.css после темы: Ă и
 * комбинируемые знаки берут грани latin-ext и math; GR2-Z-1); родовые `ui-*`, `emoji`,
 * `fangsong` первыми в цепочке имён — отказ (Chromium 151 принимает их как имя) и
 * CSS-wide keyword в цепочке — отказ (он тоже, GR3-K-3); `var()` в списке — только
 * элементом целиком, объявление без условий — только правилом `:root`, `html`
 * (`:root, :host`) на верхнем уровне или в `@layer`; PostCSS ищется до корня диска,
 * даже если Vite ищет короче; имя из `--` в списке `--font-display` не читается; не-ASCII
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
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(join(siteRoot, 'package.json'));
const sharp = require('sharp');
const fk = await import(pathToFileURL(require.resolve('fontkitten')).href);
// Tailwind сайта так, как его зовёт сборка (плагин @tailwindcss/vite): compile() @tailwindcss/node (свой разрешатель
// и loadModule), кандидаты сканера @tailwindcss/oxide, build(кандидаты), optimize() — оракул гарнитуры на странице
// (R5-SVERKA-1; раунд 1 «судью судят» блока Г, GR1-*: прежний оракул звал compile() tailwindcss без кандидатов).
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);

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
  // CDO «<!--» и CDC «-->» токеном в начале правила на верхнем уровне браузер отбрасывает (CSS Syntax, «consume
  // a stylesheet's contents»), а разбор сверки склеил бы их с прелюдией и не узнал правила (GR1-K-5) — громкий отказ.
  // Внутри строки, имени (`.a-->`) и прелюдии это не CDO и не CDC (GR2-Z-3).
  const cdoCdc = (chto) => bledy.push(`лист: CDO или CDC («<!--», «-->») перед ${chto} — браузер их отбрасывает, разбор сверки склеил бы их с прелюдией`);
  function blok(glub) {
    const uzly = [];
    const decls = [];
    let bufer = '';
    let cdo = false;
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
      if (glub === 0 && !bufer.trim() && (s.startsWith('<!--', i) || s.startsWith('-->', i))) cdo = true;
      if (c === '{') {
        i++;
        const prelude = bufer.trim();
        bufer = '';
        // `--имя: … {` — у custom property блок входит в значение: браузер объявит
        // --имя, а разбор увидел бы вложенное правило (R4-SVERKA-1).
        if (/^--[^:{}]*:/.test(prelude)) bledy.push(`лист: у ${prelude.split(':')[0].trim()} значение-блок «{…}» — браузер читает это как объявление, сверка его не судит`);
        if (cdo) cdoCdc(`правилом «${skrot(prelude)}»`);
        cdo = false;
        const wn = blok(glub + 1);
        uzly.push({ tip: prelude.startsWith('@') ? 'at' : 'rule', prelude, decls: wn.decls, children: wn.uzly });
        continue;
      }
      if (c === '}') {
        i++;
        if (glub === 0) { bledy.push('лист: лишняя «}» на верхнем уровне'); bufer = ''; cdo = false; continue; }
        dodajDecl(bufer, decls, uzly, glub);
        return { uzly, decls };
      }
      if (c === ';') {
        i++;
        if (cdo) cdoCdc(`оператором «${skrot(bufer.trim())}»`);
        cdo = false;
        dodajDecl(bufer, decls, uzly, glub);
        bufer = '';
        continue;
      }
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
// Родовые имена: первым в цепочке имён элемент не читается (GR3-K-3; Chromium 151 — serif, sans-serif, monospace,
// cursive, fantasy, system-ui, math, -webkit-body; ui-*, emoji, fangsong он принимает как имя — запас в безопасную сторону).
const RODOVYE = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'math', '-webkit-body', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'fangsong']);
const IDENT = /^-?(?:[a-zA-Z_\u0080-￿]|\\[0-9a-fA-F]{1,6}[ \t\n\r\f]?|\\[^\n\r\f0-9a-fA-F])(?:[-\w\u0080-￿]|\\[0-9a-fA-F]{1,6}[ \t\n\r\f]?|\\[^\n\r\f0-9a-fA-F])*/;
/** Конец скобки, открытой в `s[i]` (строки и вложенные скобки — целиком); нет — -1. */
function konecSkobki(s, i) {
  let glub = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '\\') { j++; continue; }
    if (s[j] === '"' || s[j] === "'") {
      const q = s[j];
      for (j++; j < s.length && s[j] !== q; j++) if (s[j] === '\\') j++;
      continue;
    }
    if (s[j] === '(') glub++;
    if (s[j] === ')' && --glub === 0) return j;
  }
  return -1;
}
/**
 * Читается ли значение как `font-family` (R5-SVERKA-5): элементы через запятую, каждый — ровно одна строка или
 * одно и больше имён (`<family-name> = <string> | <custom-ident>+`), без CSS-wide keywords и `default` и без родового
 * имени первым в цепочке из нескольких (GR3-K-3); пустой элемент, две строки подряд, число, функция — не читается.
 * Элемент `var(--имя[, запас])` целиком (GR3-Z-1): без `razreshit` (модель листа) — принимается по форме, его судит
 * страница; с `razreshit` (имя → значение, объявленное на странице без условий, или undefined) — читается подставленное
 * значение имени, а не объявлено — запас; нет и запаса — не читается.
 */
export function spisokGarniturChitaetsya(v, razreshit = null, glubina = 0) {
  if (glubina > 8) return false;
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
    if (s[i + m[0].length] === '(') {
      if (razekranirovat(m[0]).toLowerCase() !== 'var') return false;
      const k = konecSkobki(s, i + m[0].length);
      if (k < 0) return false;
      const vn = /^\(\s*(--[-\w\u0080-￿]+)\s*(?:,([\s\S]*))?\)$/.exec(s.slice(i + m[0].length, k + 1));
      if (!vn) return false;
      let chitaetsya = true;
      if (razreshit) {
        const znachenie = razreshit(vn[1].slice(2));
        chitaetsya = znachenie !== undefined ? spisokGarniturChitaetsya(znachenie, razreshit, glubina + 1) : vn[2] !== undefined && spisokGarniturChitaetsya(vn[2], razreshit, glubina + 1);
      }
      if (!chitaetsya) return false;
      elementy.at(-1).push({ var: true });
      i = k + 1;
      continue;
    }
    elementy.at(-1).push({ stroka: false, imya: razekranirovat(m[0]).toLowerCase() });
    i += m[0].length;
  }
  return elementy.every((e) => e.length > 0 && ((e.length === 1 && (e[0].stroka || e[0].var)) || (e.every((x) => !x.stroka && !x.var && !CSS_SHIROKIE.has(x.imya)) && !(e.length > 1 && RODOVYE.has(e[0].imya)))));
}

// Имя гарнитуры — как его читает CSS: экранирование раскрыто (и продолжение строки, R5-SVERKA-3), кавычки сняты,
// пробелы сведены, регистр не важен (R4-SVERKA-3); своя гарнитура — ровно 'bodoni moda', а не имя, которое его
// только содержит (метрическая замена 'Bodoni Moda Fallback' законна, R5-SVERKA-7).
const imyaGarnitury = (v) => razekranirovat(v).replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
/**
 * Грани 'Bodoni Moda' на любой глубине дерева, по порядку листа (имя правила — с раскрытым экранированием,
 * R5-SVERKA-3); `vlozhena` — внутри блока (`@media`, `@supports`, `@layer`…): действует не всегда или не последней.
 */
function graniBodoni(uzly, out = [], vlozhena = false) {
  for (const u of uzly) {
    if (!u.oper && /^@font-face$/i.test(razekranirovat(u.prelude ?? '').trim()) && (u.decls ?? []).some((d) => d.imie.toLowerCase() === 'font-family' && imyaGarnitury(d.wartosc) === 'bodoni moda')) out.push({ u, vlozhena });
    graniBodoni(u.children ?? [], out, true);
  }
  return out;
}
/** Грань целиком: её дескрипторы, как их вывел путь сборки (имя — в нижнем регистре, значение — как есть), по имени. */
const klyuchGrani = (u) => (u.decls ?? []).map((d) => `${d.imie.toLowerCase()}: ${d.wartosc}`).sort().join('; ');
/** Последнее значение дескриптора грани — как его читает CSS (экранирование раскрыто, нижний регистр); нет — null. */
const deskriptor = (u, imya) => {
  const d = (u.decls ?? []).filter((x) => x.imie.toLowerCase() === imya).at(-1);
  return d ? razekranirovat(d.wartosc).trim().toLowerCase() : null;
};
const VSE_ZNAKI = [[0, 0x10ffff]];
/** `unicode-range` → [[от, до], …]; не читается — весь Юникод (браузер отбрасывает такой дескриптор). */
export function diapazony(v) {
  if (v === null) return VSE_ZNAKI;
  const out = [];
  for (const el of v.split(',')) {
    const m = /^\s*u\+([0-9a-f?]{1,6})(?:-([0-9a-f]{1,6}))?\s*$/i.exec(el);
    if (!m || (m[2] && m[1].includes('?')) || !/^[0-9a-f]*\?*$/i.test(m[1])) return VSE_ZNAKI;
    const [ot, doo] = [parseInt(m[1].replace(/\?/g, '0'), 16), m[2] ? parseInt(m[2], 16) : parseInt(m[1].replace(/\?/g, 'f'), 16)];
    if (ot > doo) return VSE_ZNAKI;
    out.push([ot, doo]);
  }
  return out;
}
const peresech = (a, b) => a.flatMap(([l1, h1]) => b.map(([l2, h2]) => [Math.max(l1, l2), Math.min(h1, h2)])).filter(([l, h]) => l <= h);
const bez = (a, b) => b.reduce((ost, [l2, h2]) => ost.flatMap(([l1, h1]) => [[l1, Math.min(h1, l2 - 1)], [Math.max(l1, h2 + 1), h1]]).filter(([l, h]) => l <= h), a);
/**
 * Годится ли грань для роли темы — normal 600: не `italic` (грань normal темы для normal всегда ближе), вес — 600
 * или диапазон с 600. Вес не числом (нет, `normal`, `bold`) и `oblique` — годится. На вердикт это не влияет: у граней
 * пакета темы вес — число и `italic`/`normal`, а чужую грань отвергает «не грань пакета темы» раньше; влияет на состав
 * строк — поздняя чужая грань забирает знаки и гасит строку перехвата (GR3-Z-5).
 */
export function dlyaRoliTemy(u) {
  if (deskriptor(u, 'font-style') === 'italic') return false;
  const m = /^(\d+(?:\.\d+)?)(?:\s+(\d+(?:\.\d+)?))?$/.exec(deskriptor(u, 'font-weight') ?? '');
  if (!m) return true;
  const [a, b] = [Number(m[1]), Number(m[2] ?? m[1])];
  return Math.min(a, b) <= 600 && 600 <= Math.max(a, b);
}
const u4 = (n) => `U+${n.toString(16).toUpperCase().padStart(4, '0')}`;
const CSS_PUT = join(siteRoot, 'src/styles/global.css');
// Vite той сборки, что у Astro сайта; настройки `vite` сайта — из astro.config.mjs (импорт — при первом суде, не на верхнем
// уровне: конфигурация сама импортирует этот модуль).
const viteAstro = createRequire(require.resolve('astro/package.json'));
let VITE = null;
const viteMod = () => (VITE ??= import(pathToFileURL(viteAstro.resolve('vite')).href));
let VITE_SAYTA = null;
const viteSayta = () => (VITE_SAYTA ??= import(pathToFileURL(join(siteRoot, 'astro.config.mjs')).href).then((m) => m.default?.vite ?? {}));
const RAZRESHATELI = new WeakMap();
/**
 * Разрешатели листов и модулей — как их строит плагин @tailwindcss/vite для compile() (GR3-K-2, GR3-Z-2): `createResolver`
 * Vite с настройками `resolve` сайта (псевдонимы, условия), для CSS — расширение `.css`, поле `style`, условия `style`
 * и режима, без index, относительные первыми; две попытки (только псевдонимы, затем всё), ответ — абсолютный путь
 * `.css` (для модулей — не `.css`); окружение — ssr (страницы Astro собирает на сервере). Корень Vite — `koren`.
 */
function razreshateli(nastroyki, koren) {
  if (!RAZRESHATELI.has(nastroyki)) RAZRESHATELI.set(nastroyki, new Map());
  const poKornyu = RAZRESHATELI.get(nastroyki);
  if (!poKornyu.has(koren)) poKornyu.set(koren, (async () => {
    const vite = await viteMod();
    const { plugins, ...bezPlaginov } = nastroyki;
    // Окружение ssr объявлено явно: без конфигурации Astro Vite его не создаёт.
    const cfg = await vite.resolveConfig({ ...bezPlaginov, environments: { ssr: {}, ...bezPlaginov.environments }, root: koren, configFile: false, logLevel: 'silent' }, 'build');
    const css = cfg.createResolver({ ...cfg.resolve, extensions: ['.css'], mainFields: ['style'], conditions: ['style', 'development|production'], tryIndex: false, preferRelative: true });
    const js = cfg.createResolver(cfg.resolve);
    const obertka = (r, filtr) => async (id, base) => {
      const importer = resolve(base, '__placeholder__.ts');
      for (const tolkoPsevdonimy of [true, false]) {
        let s = await r(id, importer, tolkoPsevdonimy, true);
        if (s && s !== id) {
          if (s[0] === '.') s = resolve(base, s);
          if (filtr(s) && isAbsolute(s)) return s;
        }
      }
    };
    return { customCssResolver: obertka(css, (s) => s.endsWith('.css')), customJsResolver: obertka(js, (s) => !s.endsWith('.css')) };
  })());
  return poKornyu.get(koren);
}
const POSTCSS = ['.postcssrc', '.postcssrc.json', '.postcssrc.yaml', '.postcssrc.yml', '.postcssrc.js', '.postcssrc.cjs', '.postcssrc.mjs', '.postcssrc.ts', '.postcssrc.cts', '.postcssrc.mts', 'postcss.config.js', 'postcss.config.cjs', 'postcss.config.mjs', 'postcss.config.ts', 'postcss.config.cts', 'postcss.config.mts', '.config/postcssrc', '.config/postcssrc.json', '.config/postcssrc.yaml', '.config/postcssrc.yml', '.config/postcssrc.js', '.config/postcssrc.cjs', '.config/postcssrc.mjs', '.config/postcssrc.ts', '.config/postcssrc.cts', '.config/postcssrc.mts'];
/**
 * Что в конвейере CSS сборки после Tailwind судья не повторяет (GR3-K-2, свой член проверяющего): плагин Vite сайта, кроме
 * Tailwind; настройки `vite.css`; PostCSS — файл настроек или поле `postcss` в `package.json` от корня Vite до корня диска
 * (Vite ищет его сам, `postcss-load-config`; поиск до корня диска — не уже, чем у него); псевдонимы `paths` tsconfig
 * (их Astro отдаёт Vite своим плагином). Любое — громкий отказ: гарнитуру на странице судить нечем.
 */
function konveyerCss(nastroyki, koren, tsconfig) {
  const out = [];
  const chuzhie = [nastroyki.plugins ?? []].flat(Infinity).filter(Boolean).filter((p) => !String(p?.name ?? '').startsWith('@tailwindcss/vite'));
  if (chuzhie.length) out.push(`плагин Vite сайта ${chuzhie.map((p) => `«${p?.name ?? '?'}»`).join(', ')}`);
  if (nastroyki.css && Object.keys(nastroyki.css).length) out.push(`настройки vite.css сайта (${Object.keys(nastroyki.css).join(', ')})`);
  for (let d = koren; ; d = dirname(d)) {
    const f = POSTCSS.find((x) => existsSync(join(d, x)));
    if (f) { out.push(`PostCSS (${join(d, f)})`); break; }
    const pj = join(d, 'package.json');
    if (existsSync(pj)) {
      let polya;
      try { polya = JSON.parse(readFileSync(pj, 'utf8')); } catch { polya = { postcss: 'не читается' }; }
      if (polya && typeof polya === 'object' && 'postcss' in polya) { out.push(`PostCSS (поле postcss в ${pj})`); break; }
    }
    if (dirname(d) === d) break;
  }
  if (tsconfig && /"paths"\s*:/.test(tsconfig)) out.push('псевдонимы paths в tsconfig сайта');
  return out;
}
const kompilirovat = (css, r) => twNode.compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, shouldRewriteUrls: true, onDependency: () => {}, ...r });
// Грани пакета — разрешателем Vite без настроек сайта: образец — сам пакет, а не то, во что его превращают псевдонимы сайта.
const vyvodBezKandidatov = async (css) => drzewoCss(twNode.optimize((await kompilirovat(css, await razreshateli(BEZ_NASTROEK, siteRoot))).build([]), { minify: false }).code);
const BEZ_NASTROEK = {};
let PAKET_TEMY = null;
/**
 * Грани пакета темы — все листы `@fontsource/bodoni-moda` (начертания, подмножества), как их выводит путь сборки
 * из папки global.css, и `src` грани темы (normal 600 листа `IMPORT_GARNITURY`): своя грань 'Bodoni Moda' на странице
 * законна, только если она ровно одна из граней пакета — дескрипторы и `src` целиком (GR2-K-3, GR2-Z-1). Текстом,
 * а не разрешением адресов: в копии на другом диске путь сборки пишет адрес файла по-своему, и сравнивается он с тем
 * же выводом. Один раз на процесс.
 */
const paketTemy = () => (PAKET_TEMY ??= (async () => {
  const paket = IMPORT_GARNITURY.split('/').slice(0, 2).join('/');
  const papka = dirname(require.resolve(IMPORT_GARNITURY));
  const vse = await vyvodBezKandidatov(readdirSync(papka).filter((f) => f.endsWith('.css')).map((f) => `@import '${paket}/${f}';`).join('\n'));
  const tema = await vyvodBezKandidatov(`@import '${IMPORT_GARNITURY}';`);
  if (vse.bledy.length || tema.bledy.length) throw new Error(`листы пакета темы не читаются разбором сверки: ${[...vse.bledy, ...tema.bledy][0]}`);
  const granTemy = graniBodoni(tema.uzly).map((g) => g.u).filter(dlyaRoliTemy);
  if (granTemy.length !== 1) throw new Error(`в ${IMPORT_GARNITURY} граней normal 600 не одна (${granTemy.length})`);
  return { klyuchi: new Set(graniBodoni(vse.uzly).map((g) => klyuchGrani(g.u))), srcTemy: granTemy[0].decls.filter((d) => d.imie.toLowerCase() === 'src').map((d) => d.wartosc) };
})());
/** Кандидаты сканера по источникам листа — один раз на процесс для тех же источников. */
const KANDIDATY = new Map();
/**
 * CSS страницы, как его собирает сборка сайта по этому листу `global.css` (путь плагина @tailwindcss/vite: источники —
 * `root` и `sources` компилятора, кандидаты сканера, `build`, `optimize`; без сети; R5-SVERKA-1, GR1-K-1, GR1-Z-1…Z-3).
 */
async function cssStranicy(css, nastroyki, koren) {
  const c = await kompilirovat(css, await razreshateli(nastroyki, koren));
  const istochniki = (c.root === 'none' ? [] : c.root === null ? [{ base: koren, pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
  let kandidaty = [];
  if (c.features & twNode.Features.Utilities) {
    const klyuch = JSON.stringify(istochniki);
    if (!KANDIDATY.has(klyuch)) KANDIDATY.set(klyuch, new Scanner({ sources: istochniki }).scan());
    kandidaty = KANDIDATY.get(klyuch);
  }
  return twNode.optimize(c.build(kandidaty), { minify: false }).code;
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
 * Сверка — функция над входами (для `--check`, сторожа `sayt:znak-dist` и тестов `tools/testy/znak.test.mjs`);
 * CSS страницы по входному листу собирает Tailwind сайта (читает импорты и источники листа с диска).
 * @param {object} w входы: css, znak, fontBuf, publiczne (Map имя → Buffer | 'nie-plik'), dist? (то же)
 * @returns {Promise<{ bledy: string[], pliki: Map<string, Buffer>, kraski: Map<string, string> }>}
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
  // сброс до него и сброс чужого пространства — законная идиома Tailwind; судится сброс после ПОСЛЕДНЕГО объявления
  // (сброс и повторное объявление — законный перенос темы, GR1-Z-4).
  const poFd = dekl.findLastIndex((d) => d.imie === 'font-display' && d.gde === '@theme');
  const sbrosy = dekl.map((d, k) => ({ ...d, k })).filter((d) => d.gde === '@theme' && (d.imie === '*' || d.imie === 'font-*') && d.k > poFd && poFd >= 0);
  if (sbrosy.length) bledy.push(`гарнитура: сброс --${sbrosy[0].imie}: initial в @theme стоит после --font-display — Tailwind уберёт его из CSS страницы`);
  // Последнее слово — самому Tailwind сайта (R5-SVERKA-1): сброс пространства темы убирает всякий ключ, который
  // начинается его префиксом (`--f-*`, `---*`, `--font-display-*`), в любом виде @theme (и reference, и default),
  // и в листах, которые global.css импортирует; утилиты и произвольные свойства из разметки, экранированные имена
  // в импортах, своя @font-face в импортах (GR1-K-1…K-4). Модель выше этого не знает — судья собирает CSS страницы
  // путём сборки (`cssStranicy`) и читает его разбором сверки (комментарии и строки — не объявления, GR1-Z-5):
  // каждое `--font-display` — 'Bodoni Moda' первым и читаемый список; своя @font-face 'Bodoni Moda' — ровно грань
  // пакета темы; нераскрытый импорт и `@property --font-display` — отказ (GR2-K-1…K-3, GR2-Z-1). Tailwind не судит
  // лист, который модель отвергла как нечитаемый («лист:»), или по месту, сбросу и списку `--font-display` (GR1-Z-11):
  // там его ответ ничего не добавляет; прочие отказы модели (импорт гарнитуры, краски, @property, своя @font-face
  // в global.css) его не отменяют (GR2: пропуск по импорту гарнитуры снят — грани всего пакета темы законны).
  // Путь сборки — с настройками Vite сайта (astro.config.mjs; тесты подают свои: w.vite, корень w.korenVite, w.tsconfig).
  let nastroyki = w.vite;
  if (nastroyki === undefined) {
    try { nastroyki = await viteSayta(); } catch (e) { bledy.push(`гарнитура: настройки сборки сайта (astro.config.mjs) не читаются (${String(e.message).split('\n')[0]}) — гарнитуру на странице судить нечем`); }
  }
  const koren = w.korenVite ?? siteRoot;
  const tsPut = join(siteRoot, 'tsconfig.json');
  if (nastroyki) for (const x of konveyerCss(nastroyki, koren, w.tsconfig !== undefined ? w.tsconfig : existsSync(tsPut) ? readFileSync(tsPut, 'utf8') : null)) bledy.push(`гарнитура: в конвейере CSS сборки ${x} — судья знака его не повторяет, гарнитуру на странице судить нечем`);
  if (nastroyki && !bledy.some((b) => /^(лист:|гарнитура: (--font-display|сброс|список))/.test(b))) {
    try {
      const { uzly: stranica, bledy: nechitaemo } = drzewoCss(await cssStranicy(w.css, nastroyki, koren));
      if (nechitaemo.length) bledy.push(`гарнитура: вывод Tailwind сайта не читается разбором сверки (${nechitaemo[0]}) — гарнитуру на странице судить нечем`);
      else {
        // Объявления custom property на странице — с местом: «на корне без условий» — правило `:root` (`:root, :host`,
        // `html`) на верхнем уровне или только в `@layer`; под `@media`, `@supports`, `@container` и прочими блоками
        // и во вложенных правилах — условно (GR3-K-1). var() списка разрешается по объявлениям на корне без условий (GR3-Z-1).
        const obyavleniya = [];
        const korenSelektor = (p) => { const s = p.split(',').map((x) => x.trim()); return s.every((x) => [':root', ':host', 'html'].includes(x)) && s.some((x) => x !== ':host'); };
        const obhod = (lista, uslovno) => {
          for (const u of lista) {
            if (u.oper) continue;
            const p = razekranirovat(u.prelude ?? '').trim();
            const naKorne = !uslovno && u.tip === 'rule' && korenSelektor(p);
            for (const d of u.decls ?? []) if (d.imie.startsWith('--')) obyavleniya.push({ imie: d.imie.slice(2), wartosc: d.wartosc, naKorne });
            obhod(u.children ?? [], uslovno || !(u.tip === 'at' && /^@layer\b/i.test(p)));
          }
        };
        obhod(stranica, false);
        const naKorne = new Map(obyavleniya.filter((d) => d.naKorne).map((d) => [d.imie, d.wartosc]));
        const razreshit = (imya) => naKorne.get(imya);
        const bodoni = (v) => /^(['"])Bodoni Moda\1\s*(,|$)/.test(v) && spisokGarniturChitaetsya(v, razreshit);
        const naStranice = obyavleniya.filter((d) => d.imie === 'font-display');
        if (!naStranice.length || !naStranice.every((d) => bodoni(d.wartosc))) {
          bledy.push(`гарнитура: Tailwind сайта не выводит на страницу --font-display с 'Bodoni Moda' первым и читаемым списком (выводит: ${naStranice.map((d) => d.wartosc).join(' | ') || 'ничего'}) — сброс, вид @theme, импорт, утилита или разметка убрали гарнитуру знака`);
        } else if (!naStranice.some((d) => d.naKorne)) {
          bledy.push(`гарнитура: --font-display на странице только под условием (@media, @supports, @container или во вложенном правиле, а не на :root) — на экране гарнитура заголовков наследуемая`);
        }
        // Импорт, который путь сборки не раскрыл (`@import url(…)`, удалённый адрес), браузер загрузит сам — лист,
        // которого сверка не видела (GR2-K-1); `@property --font-display` на любой глубине меняет переменную на странице
        // (GR2-K-2; имя custom property — с учётом регистра).
        const neRaskryty = [];
        const registraciya = [];
        const obojti = (lista) => {
          for (const u of lista) {
            const p = razekranirovat(u.prelude ?? '').trim();
            if (u.oper && /^@import\b/i.test(p)) neRaskryty.push(u.prelude);
            if (!u.oper && /^@property\s+(--[-\w\u0080-￿]+)$/i.exec(p)?.[1] === '--font-display') registraciya.push(u.prelude);
            obojti(u.children ?? []);
          }
        };
        obojti(stranica);
        if (neRaskryty.length) bledy.push(`гарнитура: Tailwind сайта не раскрыл импорт на странице (${skrot(neRaskryty.join(' | '))}) — браузер загрузит лист, которого сверка не видела`);
        if (registraciya.length) bledy.push(`гарнитура: --font-display зарегистрирован @property на странице (${registraciya.length}) — наследование, синтаксис и начальное значение меняют его, иконки этого не знают`);
        // Своя грань 'Bodoni Moda' на странице — ровно грань пакета темы, иначе отказ (GR2-K-3, GR2-Z-1).
        const { klyuchi, srcTemy } = await paketTemy();
        const grani = graniBodoni(stranica);
        const srcGrani = (u) => u.decls.filter((d) => d.imie.toLowerCase() === 'src').map((d) => d.wartosc);
        const chuzhie = grani.filter((g) => !klyuchi.has(klyuchGrani(g.u)));
        if (chuzhie.length) bledy.push(`гарнитура: своя @font-face для 'Bodoni Moda' на странице — не грань пакета темы (${skrot(chuzhie.map((g) => srcGrani(g.u).join('; ') || 'без src').join(' | '))}) — она подменит файл темы, а контуры знака считаются из файла темы`);
        // Знак роль темы (normal 600) берёт у последней по листу грани, чей unicode-range его задевает (обратный порядок
        // определения, CSS Fonts): грань пакета с другим файлом, которая так берёт хоть один знак, перехватывает роль
        // у файла темы — latin-ext-600.css без unicode-range после темы (GR2-Z-1, контроль проверяющего); запас
        // в безопасную сторону: и 600.css после темы (грани latin-ext и math той же гарнитуры). Грань в блоке (`@media`,
        // `@layer`…) судится, как если бы действовала, но знаков у ранних граней не отнимает (действует не всегда
        // или не последней).
        let ostatok = VSE_ZNAKI;
        const perehvat = [];
        for (const g of [...grani].reverse()) {
          if (!dlyaRoliTemy(g.u)) continue;
          const vzyala = peresech(ostatok, diapazony(deskriptor(g.u, 'unicode-range')));
          if (!vzyala.length) continue;
          const src = srcGrani(g.u);
          const tema = src.length === srcTemy.length && src.every((s, k) => s === srcTemy[k]);
          if (!tema && klyuchi.has(klyuchGrani(g.u))) perehvat.push(`${skrot(src.join('; '))}: знаков ${vzyala.reduce((n, [l, h]) => n + h - l + 1, 0)}, первый ${u4(vzyala[0][0])}`);
          if (!g.vlozhena) ostatok = bez(ostatok, vzyala);
        }
        if (perehvat.length) bledy.push(`гарнитура: грань 'Bodoni Moda' пакета темы на странице перехватывает у файла темы знаки начертания normal 600 (${perehvat.join(' | ')}) — буквы заголовков могут взять другой файл, а контуры знака считаются из файла темы`);
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
 * Текст отказа сторожа: у одних иконок — «npm run znak, затем сборка»; при любом другом отказе инструмент ничего
 * не напишет («не пишу: входы с отказом»), поэтому сначала — источник знака (GR2-Z-7).
 */
export function otkazStorozha(bledy) {
  const tolkoIkonki = bledy.every((b) => /^(public|dist)\//.test(b));
  return `Знак сайта разошёлся с источником — ${bledy.length}:\n${bledy.map((b) => `  - ${b}`).join('\n')}\n${tolkoIkonki ? 'npm run znak, затем сборка.' : 'Сначала — источник знака (global.css, znak.json, гарнитура темы), затем npm run znak и сборка.'}`;
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
          throw new Error(otkazStorozha(bledy));
        }
        logger.info(`знак: сверено — ${pliki.size} иконок public/ и сборки равны тому, что пишет инструмент; краски и гарнитура — тема`);
      },
    },
  };
}

// ── Запуск ───────────────────────────────────────────────────────────────
// Команда — функцией, без await на верхнем уровне: сверка импортирует astro.config.mjs, а он — этот модуль; пока модуль
// не вычислен до конца, такой импорт ждал бы сам себя.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) zapusk();
async function zapusk() {
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
