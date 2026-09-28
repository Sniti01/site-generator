/**
 * ОДНА СВЕРКА `dist/` ПО ФАЙЛАМ СОДЕРЖАНИЯ — страница такова, как обещает её файл содержания
 * и структура (П102 блок В: «одна сверка dist вместо сверок пачек 1, 2, 4: она знает героя,
 * галерею, кадры рядов, ноту и призыв»). Прежние — сверки `dist/` разовых проб пачки 1
 * (`proby-p1.mjs`: призыв, кадры рядов ↔ нота), пачки 2 (`proby-p2.mjs`: герой, подпись, ряды,
 * нота) и пачки 4 (`proby-p4.mjs`: галерея, нота) — каждая не знала кадров чужих ветвей, и нота
 * подвала давала ожидаемые ПЛОХО (П95, П97 п. 3). Здесь нота считается по ВСЕМ кадрам страницы.
 *
 * Сторож сборки сайта: интеграция Astro на `astro:build:done` (сборка падает на отказе), разбор —
 * деревом parse5 (`core/text/html.mjs`). Маршрут и схема — сайта (П85 п. 1), и сверка их печати —
 * тоже сайта. Функция `sverkaStranicy` — для тестов (`tools/testy/sverka.test.mjs`).
 *
 * ЧТО СВЕРЯЕТСЯ на каждой странице маршрута (файл `src/content/tresc/**\/*.md` ↔ страница сборки):
 *   - `h1` страницы = `h1` структуры (свежесть);
 *   - ГЕРОЙ объявлен ⇔ в `<main>` ровно один `section.hero`, первый блок `<main>`, в обёртке
 *     `div.geroy` вплотную — кроме героя в ней только пробельный текст и комментарии (на обёртке
 *     держатся скрим, тон и кадровка маршрута), метки области (`data-astro-cid-*`) обёртки — те же, что у `h1`
 *     (правила маршрута — `.geroy[data-astro-cid-…]`, R4-V-K-1); `aria-labelledby="page-title"`; `h1#page-title` с `hero__title`
 *     и `t-headline` — в колонке текста (`.hero__text`), перед лидом, id `page-title` в документе один (R4-V-K-8);
 *     `.page-head` нет; кадр — картинка в `div.foto` внутри `.hero__art` (R4-V-K-2; ключ `src` и каждого кандидата `srcset` = `art`, `alt` = «<игра> —
 *     <опис>» записи, `width` и `height` — размеры мастера в записи: `sizes` героя считается
 *     по ним, П102 п. 1, R1-P1-2); `.foto__credit` в рамке арта нет; тон — `geroy--stal` ⇔ вид
 *     записи не «key art»; кадровка — `--fokus` ⇔ `artFocus`; подпись кадра — ровно одна
 *     `p.podpis-geroya.t-caption` в `<main>`, последним узлом секции героя (элемент или непустой
 *     текст) ⇔ `artCaption`, у страниц, где кадр можно принять за другое, обязательна (П96; данные
 *     сайта — `gates/sverka.mjs`: везде, где подпись стоит, П103 п. 4); кнопки — ровно одна `a.btn-primary` и одна `a.btn-secondary` в герое,
 *     адрес и надпись (нарисованный текст: без `<title>` и `<desc>` svg, с текстом svg и теневого корня — R4-V-Z-1,
 *     R4-V-K-10, R4-V-K-11) — из содержания, в контурной кнопке элементов нет (R4-V-K-12), иконка главной — ровно один `svg` верхнего уровня,
 *     атрибуты его корня — ровно печать `core/primitives/Icon.astro`, его элементы с именами, всеми атрибутами
 *     и текстом — как разметка стрелки вниз при якоре, вправо при адресе (`src/data/icons.ts`, разобранная
 *     так же), элементов вне `svg` нет; кадровка — `style` обёртки строго `--fokus: <artFocus>` (без `artFocus` —
 *     без `style`), `style` у потомков героя — замечание; лид — `lead`. Героя нет — `h1` в `header.page-head`, подписи кадра нет;
 *   - ПОДПИСЬ `byline` объявлена ⇔ ровно один `div.byline` — после героя и раньше первого ряда;
 *     `time[datetime]` = `date`, тексты автора, даты и приписки — из содержания;
 *   - РЯДЫ — `section.layer` в `<main>` ровно столько и в том порядке, что печатает маршрут
 *     (вхождения `story-row` по `blocks[]`, в каждом — ряды его роли в порядке файла); у каждого —
 *     `id`, метка (`.t-label`) = `year`, `h2` = `title`, `.layer__meta` = `meta`, абзацы
 *     `.layer__body` = `body`; классы `band`, `layer--flip`, `layer--bez-kadru` ⇔ поля; кадр ряда —
 *     ровно одна `div.foto.kadr-ryadu` с картинкой ⇔ `art`, картинка — как у героя; `.kadr-ryadu`
 *     в `<main>` — ровно столько, сколько рядов к печати с `art` (кадр вне своего ряда — замечание);
 *   - ГАЛЕРЕЯ объявлена ⇔ ровно одна `section.gallery`, не внутри героя или ряда, после героя,
 *     подписи и последнего ряда, раньше «связанных» и призыва; `aria-labelledby="gallery-title"`;
 *     ровно один `h2#gallery-title.gallery__title.t-headline` = `title`, id `gallery-title` в документе один
 *     (R4-V-K-8); строка `p.gallery__lead`
 *     не больше одной, есть ⇔ `lead`, раньше сетки; `li.gallery__item` — по кадру, в порядке файла;
 *     `figure` и `img` в секции — по числу кадров; в каждом пункте ровно одна `div.foto` с классом
 *     тона `kadr-galerei` и картинкой (как у героя), ровно одна `figcaption.t-caption` = `caption`,
 *     другого текста нет; текста в секции вне заголовка, строки и кадров нет; `kadr-galerei`
 *     в `<main>` — только у кадров галереи;
 *   - «СВЯЗАННЫЕ» объявлены ⇔ ровно одна `section.link-list`, прямой ребёнок `<main>`,
 *     `aria-labelledby="related-title"`; заголовок — `h2#related-title.link-list__title.t-headline` = `related.title`,
 *     первый и единственный элемент документа с этим id (браузер берёт первый; R4-V-K-8), адреса ссылок по порядку =
 *     `related` структуры; раздел — после рядов и галереи (V2-8, V3-5, V3-6);
 *   - ПРИЗЫВ объявлен ⇔ ровно одна `section.cta`, последний ребёнок `<main>`; заголовок, лид,
 *     надпись (нарисованный текст, как у кнопок героя) и адрес кнопки `a.cta__btn` — из содержания, кнопка — `btn-primary`,
 *     иконка — стрелка вправо, судится как иконка главной кнопки героя (R4-V-K-10, R4-V-K-12);
 *   - КАРТИНКИ `<main>` — ровно по числу кадров файла содержания (герой, ряды к печати с `art`,
 *     пункты галереи); `<source>` в `<picture>` картинки кадра — только ключ этого кадра; любой адрес
 *     `_astro` (без таба и перевода строки, как у URL-разборщика браузера, после раскрытия каждой полной
 *     процентной записи, с `./` и `//` после папки; R4-V-K-5, R4-V-K-6) в атрибутах самого `<main>` и его
 *     элементов и в его `<style>` — только ключ кадра страницы;
 *   - ОФОРМЛЕНИЕ `<main>` — `style` только у обёртки героя: у `<html>`, `<body>`, `<main>` и прочих элементов
 *     `<main>` — замечание, `<style>` и `<link rel=stylesheet>` в `<main>` — замечание (V3-3), и в `<body>` вне
 *     `<main>` — тоже (R4-V-K-3); вне `<main>` `style` — только `--farba: var(--…)` у фигур знака `svg.znak` (R4-V-P-2);
 *     атрибуты `<html>` — только `lang`, у `<body>` — ни одного (R4-V-K-7); `<script>` любого пространства имён
 *     и атрибут `on*` в `<main>`, обработчик `on*` где угодно в документе — замечание (R4-V-K-4);
 *   - НОТА ПОДВАЛА — игры ноты («Games: …») = игры всех кадров страницы (герой, ряды, галерея)
 *     по записям, классы строки лицензии («License class: …») = классы тех же записей; «Games:»
 *     и «License class:» — по одному разу по тексту `<body>` вне `<main>` и нот (R4-V-K-14), записью, как
 *     видит читатель: NFKC, без невидимых знаков, без учёта регистра, пробел до и после двоеточия
 *     не обязателен, двоеточия-двойники — в счёт (R4-V-K-13); кадров нет — ноты нет;
 *   - ВСТРЕЧНО: каждый `*.html`, `*.htm`, `*.xhtml`, `*.shtml` (любой регистр) сборки, кроме главной, — страница
 *     прочитанного файла содержания (V3-7, R4-V-K-9).
 * Раунды 1–4 «судью судят» блока В вернули проверки прежних сверок, которые новая потеряла
 * (V1-1…V1-5, V2-1), закрыли пределы прежних (V1-6, V1-7) и пропуски (V2-3…V2-12, V3-1…V3-10,
 * R4-V-K-1…K-14, R4-V-Z-1, R4-V-P-1…P-9).
 * Текст сравнивается после одной нормализации для обеих сторон (`norm`: пробельные, включая
 * неразрывный, — пробел, края срезаны — как `tekst()` схемы).
 *
 * ПРЕДЕЛЫ (названы): вид (сетка, рамки, скрим, растяжение) — кадры и глаза владельца; контраст —
 * замер пикселей; `sizes` и ширины кандидатов не судятся (судится только ключ и размеры мастера);
 * ярлыки «связанных» не судятся (их пишет ядро из структуры); текст и блоки `<main>` вне полей
 * содержания — третья кнопка героя, абзац в колонке героя, в ряду вне `year`/`title`/`meta`/`body`
 * или в призыве, `section` без класса блока — не судятся (кроме галереи; V1-8, test.todo); фронтматтер
 * находится выражением загрузчика Astro для `---` и разбирается пакетом `yaml` с ключами слияния, как
 * `js-yaml` загрузчика; фронтматтер TOML (`+++`, загрузчик его читает) — громкий отказ (сайт пишет YAML;
 * V2-6, test.todo); файлы и папки с точки не читаются, по ссылкам-переходам обход идёт, битая ссылка
 * пропускается, петля не обходится дважды — как у загрузчика (V3-10). Записи кадров только главной
 * (`mp1-k10`) не судятся — главная вне сверки (P2-4, test.todo). `<style>` и `<link rel=stylesheet>` в `<head>` —
 * печать сайта, их правила (например, для `.geroy` или иконки) не читаются (R4-V-P-8, test.todo); `<script>` вне
 * `<main>` — модуль шапки печатает сайт, содержание скрипта не читается (R4-V-K-4, test.todo); буквы-двойники других
 * алфавитов в «Games:» и «License class:» не судятся (R4-V-K-13, test.todo).
 */

import { readFileSync, readdirSync, existsSync, statSync, realpathSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as yamlParse } from 'file:///D:/SEO/cloud/site-generator/node_modules/yaml/dist/index.js';
import { razobrat, elementy, pervyi, imya, atr, klassy, predki, tekstVsego, tekstDetey, element, chasti, deti } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';

/** Одна нормализация для обеих сторон сверки. */
export const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const txt = (u) => (u ? norm(tekstVsego(u)) : undefined);
const est = (u, k) => klassy(u).has(k);
/** Не только пробельные знаки HTML (NBSP — не пробел: строка над героем или анонимный элемент; V2-9). */
const neProbel = (s) => /[^\t\n\f\r ]/.test(String(s ?? ''));
/** Подпись иконки: элементы svg с именами, всеми атрибутами (отсортированными) и прямым текстом, строкой. */
const podpisIkony = (svg) => JSON.stringify(elementy(svg).map((u) => [imya(u), (u.attrs ?? []).map((a) => `${a.name}=${a.value}`).sort(), tekstDetey(u).trim()]));
/** Атрибуты корня svg иконки без меток области стилей Astro, строкой. */
const kornevyeAtributy = (svg) => (svg.attrs ?? []).filter((a) => !a.name.startsWith('data-astro-cid')).map((a) => `${a.name}=${a.value}`).sort().join('|');
/** Корень svg иконки — ровно печать `core/primitives/Icon.astro` (размер 18, контур, скрыт от дерева доступности; V3-1). */
const KOREN_IKONKI = ['aria-hidden=true', 'fill=none', 'focusable=false', 'height=18', 'stroke-linecap=round', 'stroke-linejoin=round', 'stroke-width=1.5', 'stroke=currentColor', 'viewBox=0 0 24 24', 'width=18'].sort().join('|');
/**
 * Надпись кнопки — нарисованный текст: без `<title>` и `<desc>` внутри svg (не рисуются; V3-8); текст svg (`<text>`,
 * `<tspan>`, `<textPath>`, `foreignObject`) и теневого корня — в счёт (R4-V-Z-1, R4-V-K-10, R4-V-K-11).
 */
const nadpis = (u) => norm(tekstBez(u, (x) => ['title', 'desc'].includes(imya(x)) && predki(x).some((p) => imya(p) === 'svg')));
/** Метки области стилей Astro элемента (`data-astro-cid-*`), строкой. */
const metki = (u) => (u?.attrs ?? []).map((a) => a.name).filter((n) => n.startsWith('data-astro-cid')).sort().join(' ');
/** Элемент кратко — имя и классы («div.foto»). */
const kratko = (u) => (u ? imya(u) + '.' + [...klassy(u)].join('.') : '—');

/**
 * Иконка кнопки: ровно один svg верхнего уровня (вложенные в него не в счёт); атрибуты корня — ровно печать Icon.astro
 * ядра; его элементы с именами, атрибутами и текстом — как разметка `imyaIk` в src/data/icons.ts (симметрично: обе
 * стороны разобраны parse5 в svg); элементов вне svg нет (пачка 2; V1-3, V2-1, V2-2, V3-1, V3-8; призыв — R4-V-K-10).
 * Расхождение строкой или `null`.
 */
function sverkaIkony(kn, imyaIk, ikony) {
  const svgi = elementy(kn, (u) => imya(u) === 'svg' && !predki(u).some((p) => imya(p) === 'svg'));
  const svg = svgi.length === 1 ? svgi[0] : null;
  const napechatano = svg ? podpisIkony(svg) : `svg: ${svgi.length}`;
  const vneSvg = elementy(kn).filter((u) => u !== svg && !(svg && predki(u).includes(svg)));
  const koren = svg ? kornevyeAtributy(svg) : '';
  const korenChuzhoy = svg && koren !== KOREN_IKONKI;
  if (napechatano === ikony[imyaIk] && !vneSvg.length && !korenChuzhoy) return null;
  return `напечатано ${napechatano}${vneSvg.length ? `; вне svg: ${vneSvg.map(imya).join(', ')}` : ''}${korenChuzhoy ? `; атрибуты svg «${koren}», ждали печать Icon.astro` : ''}`;
}
/** Ключ кадра — только из пути `/_astro/<ключ>.<хеш>.<расширение>` своего сайта; иначе «?». */
export const klyuchAdresa = (u) => (String(u).match(/^\/_astro\/([a-z0-9-]+)\.[^/]+$/) || [])[1] ?? '?';

/** Входы сверки: структура, записи кадров, иконки, файлы содержания. */
export function vhody(sayt) {
  const struktura = JSON.parse(readFileSync(join(sayt, 'structure/structure.json'), 'utf8'));
  const kredity = JSON.parse(readFileSync(join(sayt, 'src/data/game-art.json'), 'utf8'));
  const ikonyTs = readFileSync(join(sayt, 'src/data/icons.ts'), 'utf8');
  const ikona = (imyaIk) => {
    const m = ikonyTs.match(new RegExp(`'${imyaIk}':\\s*'([^']*)'`));
    if (!m) throw new Error(`сверка dist: нет иконки ${imyaIk} в src/data/icons.ts`);
    // Разметка иконки разбирается так же, как напечатанная, — внутри svg (V2-2).
    return podpisIkony(pervyi(razobrat(`<svg>${m[1]}</svg>`), (u) => imya(u) === 'svg'));
  };
  const ikony = { 'arrow-down': ikona('arrow-down'), 'arrow-right': ikona('arrow-right') };
  const papka = join(sayt, 'src/content/tresc');
  const fajly = [];
  const proydeno = new Set();
  const obhod = (d) => {
    // Петля ссылок — папка, уже пройденная по настоящему пути, второй раз не обходится (V3-10).
    const nastoyashchiy = realpathSync(d);
    if (proydeno.has(nastoyashchiy)) return;
    proydeno.add(nastoyashchiy);
    for (const x of readdirSync(d, { withFileTypes: true })) {
      // Имена с точки загрузчик коллекции не видит (`**/*.md`, dot: false) — и сверка тоже (V1-10).
      if (x.name.startsWith('.')) continue;
      const p = join(d, x.name);
      // По ссылкам загрузчик идёт (followSymbolicLinks) — и сверка тоже (V2-12); битую ссылку он пропускает — и сверка (V3-10).
      let papka = x.isDirectory();
      if (x.isSymbolicLink()) {
        try {
          papka = statSync(p).isDirectory();
        } catch {
          continue;
        }
      }
      if (papka) obhod(p);
      else if (x.name.endsWith('.md')) fajly.push(p);
    }
  };
  obhod(papka);
  const soderzhanie = fajly.map((f) => {
    // Фронтматтер — выражением загрузчика Astro (@astrojs/internal-helpers, frontmatter.js): пустые строки
    // до «---» и пробел после него — законны (V1-9).
    const fm = readFileSync(f, 'utf8').match(/(?:^﻿?|^\s*\n)---([\s\S]*?\n)---/);
    return { fajl: f, dane: fm ? yamlParse(fm[1], { merge: true }) : null };
  });
  return { struktura, kredity, ikony, soderzhanie };
}

/**
 * Замечания о картинке кадра: ключ `src`, каждого кандидата `srcset` и каждого `<source>` её `<picture>` (браузер
 * покажет источник, V2-3), `alt`, `width`/`height` — по записи.
 */
function sverkaKartinki(img, klyuch, gde, kredity) {
  if (!img) return [`${gde}: нет картинки`];
  const zam = [];
  const zapis = kredity[klyuch];
  const razbit = (s) => (s ?? '').split(',').map((c) => c.trim().split(/\s+/)[0]).filter(Boolean);
  const kandidaty = razbit(atr(img, 'srcset'));
  if (!kandidaty.length) zam.push(`${gde}: у картинки нет srcset`);
  const istochniki = imya(img.parentNode) === 'picture' ? (img.parentNode.childNodes ?? []).filter((u) => imya(u) === 'source').flatMap((s) => razbit(atr(s, 'srcset'))) : [];
  const chuzhie = [...new Set([atr(img, 'src') ?? '', ...kandidaty, ...istochniki].map(klyuchAdresa).filter((k) => k !== klyuch))];
  if (chuzhie.length) zam.push(`${gde}: в src или srcset ключи ${chuzhie.join(', ')}, в содержании ${klyuch}`);
  const zhdemAlt = zapis ? `${zapis.game} — ${zapis.opis ?? 'publisher material'}` : undefined;
  if ((atr(img, 'alt') ?? '') !== zhdemAlt) zam.push(`${gde}: alt «${(atr(img, 'alt') ?? '').slice(0, 70)}» ≠ записи кадра ${klyuch} «${String(zhdemAlt).slice(0, 70)}»`);
  if (zapis && (atr(img, 'width') !== String(zapis.width) || atr(img, 'height') !== String(zapis.height))) {
    zam.push(`${gde}: размеры картинки ${atr(img, 'width')}×${atr(img, 'height')} ≠ записи кадра ${klyuch} ${zapis.width}×${zapis.height} (мастер разошёлся с записью)`);
  }
  return zam;
}

/** Порядок элементов документа — для «раньше/позже». */
const poryadok = (doc) => new Map(elementy(doc).map((u, i) => [u, i]));
/** Последний потомок узла в порядке документа (конец узла). */
const konec = (u, por) => Math.max(por.get(u), ...elementy(u).map((x) => por.get(x)));

/**
 * Замечания сверки одной страницы: пусто — страница такова, как обещает её файл содержания.
 * `s` — `{ page, dane, html, kredity, ikony, obyazatelnaPodpis: Set }`.
 */
export function sverkaStranicy({ page, dane, html, kredity, ikony, obyazatelnaPodpis = new Set() }) {
  const zam = [];
  const doc = razobrat(html);
  const mainy = elementy(doc, (u) => imya(u) === 'main');
  if (mainy.length !== 1) return [`<main> — ${mainy.length}, нужен ровно один`];
  const main = mainy[0];
  const por = poryadok(doc);
  const bloki = page.blocks.map((b) => b.block);
  const vMain = (pred) => elementy(main, pred);
  /** Элементы документа с этим id: IDREF (`aria-labelledby`) браузер разрешает по первому в документе (R4-V-K-8). */
  const sId = (id) => elementy(doc, (u) => atr(u, 'id') === id);

  // свежесть: h1 структуры
  const h1 = vMain((u) => imya(u) === 'h1');
  if (h1.length !== 1) zam.push(`h1 в <main>: ${h1.length}, нужен ровно один`);
  else if (txt(h1[0]) !== norm(page.h1)) zam.push(`h1 «${txt(h1[0])}» ≠ h1 структуры «${norm(page.h1)}» — сборка старая или печать разошлась`);

  // герой
  const geroi = vMain((u) => imya(u) === 'section' && est(u, 'hero'));
  const podpisi = vMain((u) => est(u, 'podpis-geroya'));
  const heroObyavlen = bloki.includes('hero-key-art');
  const hero = geroi.length === 1 ? geroi[0] : null;
  if (heroObyavlen) {
    if (geroi.length !== 1) zam.push(`героев ${geroi.length}, ждали 1`);
    else {
      const sekcii = vMain((u) => imya(u) === 'section');
      if (sekcii[0] !== hero) zam.push('герой не первый блок <main>');
      if (atr(hero, 'aria-labelledby') !== 'page-title') zam.push(`aria-labelledby героя «${atr(hero, 'aria-labelledby') ?? '—'}», ждали page-title — id h1 героя`);
      const obertka = hero.parentNode;
      // Обёртка — вплотную: кроме героя, только пробельный текст HTML и комментарии (пачка 2; V1-2; NBSP — не пробел, V2-9).
      const obertkaVerna = imya(obertka) === 'div' && est(obertka, 'geroy') && obertka.childNodes.every((x) => x === hero || (!element(x) && (x.nodeName !== '#text' || !neProbel(x.value))));
      if (!obertkaVerna) zam.push('нет обёртки div.geroy вокруг одного героя — скрим, тон и кадровка маршрута героя не достанут');
      const h = h1[0];
      if (!h || !predki(h).includes(hero)) zam.push('h1 не внутри героя');
      else {
        const tekst = pervyi(hero, (u) => est(u, 'hero__text'));
        const lid = pervyi(hero, (u) => est(u, 'hero__lead'));
        if (!tekst || !predki(h).includes(tekst) || (lid && por.get(h) > por.get(lid))) zam.push('h1 героя не в колонке текста (.hero__text, перед лидом)');
        if (!est(h, 'hero__title') || !est(h, 't-headline')) zam.push(`классы h1 героя «${[...klassy(h)].join(' ')}», ждали hero__title и t-headline`);
        if (atr(h, 'id') !== 'page-title') zam.push('у h1 героя нет id="page-title"');
        const sPt = sId('page-title');
        if (sPt.length !== 1) zam.push(`id page-title в документе — ${sPt.length}, первый — ${kratko(sPt[0])}: aria-labelledby героя берёт первый, ждали один h1`);
      }
      if (vMain((u) => est(u, 'page-head')).length) zam.push('при герое напечатана .page-head');
      const art = pervyi(hero, (u) => est(u, 'hero__art'));
      const imgGeroya = art && pervyi(art, (u) => imya(u) === 'img');
      zam.push(...sverkaKartinki(imgGeroya, dane.art, 'кадр героя', kredity));
      if (imgGeroya) {
        // Кадровка и тон маршрута — `.geroy… .hero__art .foto img`: картинка — в div.foto внутри .hero__art (как кадр
        // ряда, V1-5; R4-V-K-2).
        const foto = predki(imgGeroya).find((p) => est(p, 'foto'));
        if (!foto || imya(foto) !== 'div' || !predki(foto).includes(art)) zam.push(`кадр героя без .foto (картинка в «${kratko(imgGeroya.parentNode)}») — кадровка и тон маршрута кадр не достанут`);
      }
      if (art && pervyi(art, (u) => est(u, 'foto__credit'))) zam.push('подпись в рамке арта героя (.foto__credit) — под скримом');
      if (obertkaVerna) {
        // Правила маршрута (кадровка, тон, скрим) — `.geroy[data-astro-cid-…]`: метки области обёртки — те же, что у h1
        // героя (оба печатает маршрут; R4-V-K-1).
        if (!metki(obertka) || (h1[0] && metki(obertka) !== metki(h1[0]))) zam.push(`метки области обёртки героя «${metki(obertka) || '—'}», у h1 «${metki(h1[0]) || '—'}» — правила маршрута (кадровка, тон, скрим) обёртку не достают`);
        const stal = est(obertka, 'geroy--stal');
        const kluchevoy = /^key art\b/.test(kredity[dane.art]?.kind ?? '');
        if (stal === kluchevoy) zam.push(`тон кадра: geroy--stal ${stal ? 'есть' : 'нет'}, а вид записи — ${kredity[dane.art]?.kind}`);
        // Кадровка — style обёртки строго `--fokus: <artFocus>` или его нет без artFocus: разбор объявлений CSS
        // (комментарии, экранирование, !important) судья не повторяет — маршрут печатает ровно это (V2-7, V3-2).
        const zhdemStil = dane.artFocus ? `--fokus: ${dane.artFocus}` : undefined;
        if (atr(obertka, 'style') !== zhdemStil) zam.push(`кадровка: style обёртки «${atr(obertka, 'style') ?? '—'}», ждали «${zhdemStil ?? '—'}»`);
      }
      // Кадровку задаёт только обёртка: style у потомка героя её перекрывает (V2-7, V3-3).
      const vnutri = elementy(obertka).filter((u) => atr(u, 'style') !== undefined);
      if (vnutri.length) zam.push(`кадровка внутри героя (${vnutri.map((u) => imya(u) + '.' + [...klassy(u)].join('.')).join(', ')}) — style у потомка героя; задаёт её только обёртка`);
      if (dane.artCaption) {
        // Последний узел героя — элемент или непустой текст (текст после подписи — не «последней», V1-2).
        const posled = hero.childNodes.filter((x) => element(x) || (x.nodeName === '#text' && neProbel(x.value))).at(-1);
        if (podpisi.length !== 1 || posled !== podpisi[0]) zam.push(`подпись кадра: в <main> ${podpisi.length} шт., последним элементом героя (место dopisek) — ${posled && est(posled, 'podpis-geroya') ? 'да' : 'нет'}; ждали одну, последней`);
        else {
          if (!est(podpisi[0], 't-caption')) zam.push(`подпись кадра без роли t-caption («${[...klassy(podpisi[0])].join(' ')}»)`);
          if (txt(podpisi[0]) !== norm(dane.artCaption)) zam.push(`текст подписи кадра «${txt(podpisi[0])}», в содержании «${norm(dane.artCaption)}»`);
        }
      } else if (podpisi.length) zam.push('подпись кадра напечатана, а в содержании её нет');
      if (new Set(['/remake/', '/movie/', '/media/', '/mods/', '/quotes/', '/voice-and-face/']).has(page.url) && !dane.artCaption) zam.push(`подпись кадра обязательна у героя ${page.url} (кадр можно принять за другое, П96, П103 п. 4), а artCaption нет`);
      for (const [klass, pole] of [['btn-primary', 'primary'], ['btn-secondary', 'secondary']]) {
        const kn = elementy(hero, (u) => imya(u) === 'a' && est(u, klass));
        if (kn.length !== 1) {
          zam.push(`кнопок ${klass} в герое ${kn.length}, ждали 1`);
          continue;
        }
        if ((atr(kn[0], 'href') ?? '') !== dane[pole]?.href) zam.push(`${pole}: адрес ${atr(kn[0], 'href')}, в содержании ${dane[pole]?.href}`);
        if (nadpis(kn[0]) !== norm(dane[pole]?.label)) zam.push(`${pole}: надпись «${nadpis(kn[0])}», в содержании «${norm(dane[pole]?.label)}»`);
        if (pole === 'primary') {
          // Иконка — стрелка вниз при якоре, вправо при адресе (печать маршрута).
          const imyaIk = String(dane.primary?.href).startsWith('#') ? 'arrow-down' : 'arrow-right';
          const oshibka = sverkaIkony(kn[0], imyaIk, ikony);
          if (oshibka) zam.push(`иконка главной кнопки — не ${imyaIk} (адрес ${dane.primary?.href}): ${oshibka}`);
        } else {
          // Контурная кнопка — только надпись: элемент в ней (svg, поле формы, теневой корень) рисует мимо надписи
          // (R4-V-K-10, R4-V-K-12).
          const el = elementy(kn[0]);
          if (el.length) zam.push(`secondary: элементы в кнопке (${el.map(imya).join(', ')}) — герой печатает в контурной кнопке только надпись`);
        }
      }
      const lid = pervyi(hero, (u) => est(u, 'hero__lead'));
      if (!lid || txt(lid) !== norm(dane.lead)) zam.push('лид героя разошёлся с файлом содержания');
    }
  } else {
    if (geroi.length) zam.push(`герой напечатан (${geroi.length}), а блока нет`);
    const h = h1[0];
    if (!h || !(imya(h.parentNode) === 'header' && est(h.parentNode, 'page-head'))) zam.push('без героя h1 не в header.page-head');
    if (podpisi.length) zam.push('подпись кадра героя напечатана без героя');
  }

  // подпись byline
  const bylines = vMain((u) => imya(u) === 'div' && est(u, 'byline'));
  const ryadyVse = vMain((u) => imya(u) === 'section' && est(u, 'layer'));
  if (bloki.includes('byline')) {
    if (bylines.length !== 1) zam.push(`подписей ${bylines.length}, ждали 1`);
    else {
      const b = bylines[0];
      if (hero && por.get(b) <= konec(hero, por)) zam.push('подпись не после героя');
      if (ryadyVse.length && por.get(b) > por.get(ryadyVse[0])) zam.push('подпись после первого ряда');
      const time = pervyi(b, (u) => imya(u) === 'time');
      if ((time && atr(time, 'datetime')) !== dane.byline?.date) zam.push(`datetime ${(time && atr(time, 'datetime')) ?? '—'}, в содержании ${dane.byline?.date}`);
      if (!time || txt(time) !== norm(dane.byline?.dateLabel)) zam.push('подпись даты разошлась с файлом содержания');
      const avtor = pervyi(b, (u) => est(u, 'byline__author'));
      if (!avtor || txt(avtor) !== norm(dane.byline?.author)) zam.push('автор подписи разошёлся с файлом содержания');
      const rol = pervyi(b, (u) => est(u, 'byline__role'));
      if ((rol ? txt(rol) : undefined) !== (dane.byline?.role === undefined ? undefined : norm(dane.byline.role))) zam.push('приписка подписи разошлась с файлом содержания');
    }
  } else if (bylines.length) zam.push(`подпись напечатана (${bylines.length}), а блока нет`);

  // ряды — по месту и в порядке печати маршрута
  const rows = dane.rows ?? [];
  const rolOf = (r) => r || '';
  const zhdemRyady = page.blocks.filter((b) => b.block === 'story-row').flatMap((b) => rows.filter((r) => rolOf(r.role) === rolOf(b.role)));
  if (ryadyVse.length !== zhdemRyady.length) zam.push(`рядов в <main> ${ryadyVse.length}, в файле содержания к печати ${zhdemRyady.length}`);
  const ids = ryadyVse.map((r) => atr(r, 'id')).join(' ');
  if (ids !== zhdemRyady.map((r) => r.id).join(' ')) zam.push(`порядок рядов «${ids}» ≠ порядку печати «${zhdemRyady.map((r) => r.id).join(' ')}»`);
  for (const r of zhdemRyady) {
    const s = ryadyVse.find((x) => atr(x, 'id') === r.id);
    if (!s) {
      zam.push(`ряда ${r.id} нет в <main>`);
      continue;
    }
    if (txt(pervyi(s, (u) => est(u, 't-label'))) !== norm(r.year)) zam.push(`ряд ${r.id}: year разошёлся с файлом содержания`);
    if (txt(pervyi(s, (u) => imya(u) === 'h2')) !== norm(r.title)) zam.push(`ряд ${r.id}: заголовок разошёлся с файлом содержания`);
    if (txt(pervyi(s, (u) => est(u, 'layer__meta'))) !== norm(r.meta)) zam.push(`ряд ${r.id}: meta разошлась с файлом содержания`);
    const telo = pervyi(s, (u) => est(u, 'layer__body'));
    const abzacy = telo ? elementy(telo, (u) => imya(u) === 'p').map(txt) : [];
    const zhdemAbzacy = (r.body ?? []).map(norm);
    if (abzacy.join('\n') !== zhdemAbzacy.join('\n')) zam.push(`ряд ${r.id}: абзацы разошлись с файлом содержания (напечатано ${abzacy.length}, в файле ${zhdemAbzacy.length})`);
    // Пустое поле с обеих сторон сравнялось бы молча (сверка пачки 2, раунд 2, P2-R2-SVERKA-6).
    if (zhdemAbzacy.some((x) => x === '') || [r.year, r.title, r.meta].some((x) => norm(x) === '')) zam.push(`ряд ${r.id}: поле ряда пусто у сверки (разбор фронтматтера)`);
    if (est(s, 'band') !== Boolean(r.band)) zam.push(`ряд ${r.id}: класс band ${est(s, 'band') ? 'есть' : 'нет'}, в содержании band: ${Boolean(r.band)}`);
    if (est(s, 'layer--flip') !== Boolean(r.flip)) zam.push(`ряд ${r.id}: класс layer--flip ${est(s, 'layer--flip') ? 'есть' : 'нет'}, в содержании flip: ${Boolean(r.flip)}`);
    if (est(s, 'layer--bez-kadru') !== !r.art) zam.push(`ряд ${r.id}: класс layer--bez-kadru ${est(s, 'layer--bez-kadru') ? 'есть' : 'нет'}, в содержании art: ${r.art ?? '—'}`);
    const kadry = elementy(s, (u) => est(u, 'kadr-ryadu'));
    if (r.art) {
      if (kadry.length !== 1) zam.push(`ряд ${r.id}: кадров ряда ${kadry.length}, ждали 1`);
      else {
        // Кадр ряда — div.foto (тон .foto.kadr-ryadu и рамка ядра; пачки 1 и 2; V1-5).
        if (!(imya(kadry[0]) === 'div' && est(kadry[0], 'foto'))) zam.push(`ряд ${r.id}: кадр ряда без .foto («${imya(kadry[0])}.${[...klassy(kadry[0])].join('.')}») — тон и рамка ядра не достанут`);
        zam.push(...sverkaKartinki(pervyi(kadry[0], (u) => imya(u) === 'img'), r.art, `ряд ${r.id}: кадр ряда`, kredity));
      }
    } else if (kadry.length) zam.push(`ряд ${r.id}: кадр ряда напечатан, а art нет`);
  }
  // Все кадры рядов в <main> — ровно кадры рядов к печати с art (кадр вне своего ряда; пачка 1; V1-1).
  const kadryRyadovVsego = vMain((u) => est(u, 'kadr-ryadu')).length;
  const kadrovRyadov = zhdemRyady.filter((r) => r.art).length;
  if (kadryRyadovVsego !== kadrovRyadov) zam.push(`kadr-ryadu в <main> ${kadryRyadovVsego} раз, кадров рядов к печати ${kadrovRyadov} — кадр ряда вне своего ряда или лишний`);

  // галерея
  const galerei = vMain((u) => imya(u) === 'section' && est(u, 'gallery'));
  const tony = vMain((u) => est(u, 'kadr-galerei'));
  const galereyaObyavlena = bloki.includes('gallery');
  const g = dane.gallery;
  if (galereyaObyavlena) {
    if (galerei.length !== 1) zam.push(`галерей ${galerei.length}, ждали 1`);
    else if (!g) zam.push('галерея объявлена, а поля gallery в содержании нет');
    else {
      const sek = galerei[0];
      if (atr(sek, 'aria-labelledby') !== 'gallery-title') zam.push(`aria-labelledby галереи «${atr(sek, 'aria-labelledby') ?? '—'}», ждали gallery-title`);
      if (predki(sek).some((u) => imya(u) === 'section')) zam.push('галерея внутри другой секции (героя или ряда)');
      if (hero && por.get(sek) <= konec(hero, por)) zam.push('галерея не после героя');
      if (bylines.length && por.get(bylines[0]) > por.get(sek)) zam.push('галерея раньше подписи byline');
      if (ryadyVse.length && konec(ryadyVse.at(-1), por) > por.get(sek)) zam.push('галерея не после рядов (ряд ниже галереи или галерея внутри ряда)');
      const linki = vMain((u) => imya(u) === 'section' && est(u, 'link-list'));
      const cta = vMain((u) => imya(u) === 'section' && est(u, 'cta'));
      if (linki.length && por.get(linki[0]) < por.get(sek)) zam.push('галерея не перед «связанными» (link-list выше галереи)');
      if (cta.length && por.get(cta[0]) < por.get(sek)) zam.push('галерея не перед призывом (cta выше галереи)');
      const h2 = elementy(sek, (u) => imya(u) === 'h2');
      if (h2.length !== 1) zam.push(`заголовков h2 в галерее ${h2.length}, ждали 1`);
      if (h2[0]) {
        if (atr(h2[0], 'id') !== 'gallery-title') zam.push('у заголовка галереи нет id="gallery-title"');
        const sGt = sId('gallery-title');
        if (sGt.length !== 1) zam.push(`id gallery-title в документе — ${sGt.length}, первый — ${kratko(sGt[0])}: aria-labelledby галереи берёт первый, ждали один заголовок`);
        if (!est(h2[0], 'gallery__title') || !est(h2[0], 't-headline')) zam.push(`классы заголовка галереи «${[...klassy(h2[0])].join(' ')}», ждали gallery__title и t-headline`);
        if (txt(h2[0]) !== norm(g.title)) zam.push(`заголовок галереи «${txt(h2[0])}», в содержании «${norm(g.title)}»`);
      }
      const lidy = elementy(sek, (u) => est(u, 'gallery__lead'));
      if (lidy.length > 1) zam.push(`строк под заголовком галереи ${lidy.length}, ждали не больше 1`);
      if (g.lead === undefined) {
        if (lidy.length) zam.push('строка под заголовком галереи напечатана, а lead нет');
      } else if (!lidy.length) zam.push('строки под заголовком галереи (lead) нет');
      else if (txt(lidy[0]) !== norm(g.lead)) zam.push(`строка под заголовком галереи «${txt(lidy[0]).slice(0, 60)}», в содержании «${norm(g.lead).slice(0, 60)}»`);
      const setka = pervyi(sek, (u) => imya(u) === 'ul');
      if (lidy[0] && setka && por.get(lidy[0]) > por.get(setka)) zam.push('строка под заголовком галереи стоит после сетки');
      const punkty = elementy(sek, (u) => imya(u) === 'li' && est(u, 'gallery__item'));
      const items = g.items ?? [];
      if (punkty.length !== items.length) zam.push(`кадров галереи ${punkty.length}, в файле содержания ${items.length}`);
      const figur = elementy(sek, (u) => imya(u) === 'figure').length;
      const kartinok = elementy(sek, (u) => imya(u) === 'img').length;
      if (figur !== items.length || kartinok !== items.length) zam.push(`в галерее figure ${figur}, img ${kartinok}, а кадров в файле содержания ${items.length}`);
      items.forEach((it, i) => {
        const li = punkty[i];
        if (!li) return;
        const gde = `кадр галереи ${i + 1} (${it.art})`;
        const imgs = elementy(li, (u) => imya(u) === 'img');
        if (imgs.length !== 1) zam.push(`${gde}: картинок ${imgs.length}, ждали 1`);
        const foto = elementy(li, (u) => est(u, 'foto'));
        if (foto.length !== 1) zam.push(`${gde}: оболочек .foto ${foto.length}, ждали 1`);
        else {
          if (!est(foto[0], 'kadr-galerei')) zam.push(`${gde}: без класса тона kadr-galerei («${[...klassy(foto[0])].join(' ')}»)`);
          zam.push(...sverkaKartinki(pervyi(foto[0], (u) => imya(u) === 'img'), it.art, gde, kredity));
        }
        const podp = elementy(li, (u) => imya(u) === 'figcaption');
        if (podp.length !== 1) zam.push(`${gde}: подписей figcaption ${podp.length}, ждали 1`);
        else {
          if (!est(podp[0], 't-caption')) zam.push(`${gde}: подпись без роли t-caption`);
          if (txt(podp[0]) !== norm(it.caption)) zam.push(`${gde}: подпись «${txt(podp[0])}», в содержании «${norm(it.caption)}»`);
        }
        const vne = norm(tekstBez(li, (u) => imya(u) === 'figcaption'));
        if (vne) zam.push(`${gde}: текст в кадре вне подписи «${vne.slice(0, 60)}»`);
      });
      const ostatok = norm(tekstBez(sek, (u) => imya(u) === 'h2' || est(u, 'gallery__lead') || (imya(u) === 'li' && est(u, 'gallery__item'))));
      if (ostatok) zam.push(`текст в галерее вне кадров и заголовка «${ostatok.slice(0, 60)}»`);
      if (tony.length !== items.length) zam.push(`kadr-galerei в <main> ${tony.length} раз, кадров галереи ${items.length} — класс тона вне галереи или лишний`);
    }
  } else {
    if (galerei.length) zam.push(`галерея напечатана (${galerei.length}), а блока нет`);
    if (tony.length) zam.push(`kadr-galerei в <main> без галереи (${tony.length})`);
  }

  // «связанные» (link-list) — раздел, заголовок из содержания, адреса related структуры по порядку, место — после рядов
  // и галереи (раньше призыва — «призыв последний»); сторож links судит только, что адрес есть в структуре (V2-8).
  const spiski = vMain((u) => imya(u) === 'section' && est(u, 'link-list'));
  if (bloki.includes('link-list')) {
    if (spiski.length !== 1) zam.push(`«связанных» ${spiski.length}, ждали 1`);
    else {
      const sek = spiski[0];
      // Раздел — прямой ребёнок <main> (не внутри призыва или ряда; V3-5); заголовок — h2.link-list__title.t-headline
      // с id related-title, на него — aria-labelledby раздела (V3-6); заголовок — первый и единственный элемент документа
      // с этим id: браузер берёт первый (R4-V-K-8).
      if (sek.parentNode !== main) zam.push('«связанные» внутри другой секции — раздел не прямой ребёнок <main>');
      if (atr(sek, 'aria-labelledby') !== 'related-title') zam.push(`aria-labelledby «связанных» «${atr(sek, 'aria-labelledby') ?? '—'}», ждали related-title`);
      const sRt = sId('related-title');
      const zag = sRt[0] ?? null;
      if (sRt.length !== 1 || (zag && !predki(zag).includes(sek))) zam.push(`id related-title в документе — ${sRt.length}, первый — ${kratko(zag)}${zag && !predki(zag).includes(sek) ? ' вне раздела' : ''}: aria-labelledby «связанных» берёт первый, ждали один заголовок раздела`);
      if (!zag || imya(zag) !== 'h2' || !est(zag, 'link-list__title') || !est(zag, 't-headline')) zam.push(`заголовок «связанных» — не h2.link-list__title.t-headline («${zag ? imya(zag) + '.' + [...klassy(zag)].join('.') : '—'}»)`);
      if (!zag || txt(zag) !== norm(dane.related?.title)) zam.push(`заголовок «связанных» «${txt(zag) ?? '—'}», в содержании «${norm(dane.related?.title)}»`);
      const adresa = elementy(sek, (u) => imya(u) === 'a').map((a) => atr(a, 'href'));
      if (adresa.join('|') !== (page.related ?? []).join('|')) zam.push(`адреса «связанных» [${adresa.join(', ')}] ≠ related структуры [${(page.related ?? []).join(', ')}]`);
      const ryadySek = vMain((u) => imya(u) === 'section' && est(u, 'layer'));
      if (ryadySek.length && por.get(sek) <= konec(ryadySek.at(-1), por)) zam.push('«связанные» не после рядов');
      if (galerei.length === 1 && por.get(sek) <= konec(galerei[0], por)) zam.push('«связанные» не после галереи');
    }
  } else if (spiski.length) zam.push(`«связанные» напечатаны (${spiski.length}), а блока нет`);

  // призыв
  const cty = vMain((u) => imya(u) === 'section' && est(u, 'cta'));
  if (bloki.includes('cta-band')) {
    if (cty.length !== 1) zam.push(`призывов ${cty.length}, ждали 1`);
    else {
      const c = cty[0];
      if (main.childNodes.filter(element).at(-1) !== c) zam.push('призыв не последний блок <main>');
      const kn = elementy(c, (u) => imya(u) === 'a' && est(u, 'cta__btn'));
      if (kn.length !== 1) zam.push(`кнопок призыва ${kn.length}, ждали 1`);
      else {
        // Кнопка призыва — главная (пачка 1: селектор btn btn-primary … cta__btn; V1-4).
        if (!est(kn[0], 'btn-primary')) zam.push(`кнопка призыва без btn-primary («${[...klassy(kn[0])].join(' ')}»)`);
        if ((atr(kn[0], 'href') ?? '') !== dane.cta?.href) zam.push(`кнопка призыва ведёт на ${atr(kn[0], 'href')}, в содержании ${dane.cta?.href}`);
        if (nadpis(kn[0]) !== norm(dane.cta?.label)) zam.push(`надпись кнопки призыва «${nadpis(kn[0])}», в содержании «${norm(dane.cta?.label)}»`);
        // Иконка призыва — стрелка вправо (печать маршрута), судится как иконка главной кнопки героя (R4-V-K-10, R4-V-K-12).
        const oshibka = sverkaIkony(kn[0], 'arrow-right', ikony);
        if (oshibka) zam.push(`иконка кнопки призыва — не arrow-right: ${oshibka}`);
      }
      if (txt(pervyi(c, (u) => est(u, 'cta__title'))) !== norm(dane.cta?.title)) zam.push('заголовок призыва разошёлся с файлом содержания');
      if (txt(pervyi(c, (u) => est(u, 'cta__lead'))) !== norm(dane.cta?.lead)) zam.push('лид призыва разошёлся с файлом содержания');
    }
  } else if (cty.length) zam.push(`призыв напечатан (${cty.length}), а блока нет`);

  // нота подвала — по всем кадрам страницы
  const klyuchi = [
    ...(heroObyavlen && dane.art ? [dane.art] : []),
    ...zhdemRyady.map((r) => r.art).filter(Boolean),
    ...(galereyaObyavlena ? (g?.items ?? []).map((it) => it.art) : []),
  ];
  // Картинки <main> — ровно кадры по файлу содержания, их ключи (src, srcset, source) — только ключи кадров:
  // вторая картинка, картинка в тексте, <picture><source> другого кадра (пределы прежней пачки 2; V1-6).
  const kandidaty = (s) => (s ?? '').split(',').map((c) => c.trim().split(/\s+/)[0]).filter(Boolean);
  const kartinki = vMain((u) => imya(u) === 'img');
  const kadrov = (heroObyavlen ? 1 : 0) + zhdemRyady.filter((r) => r.art).length + (galereyaObyavlena ? (g?.items ?? []).length : 0);
  if (kartinki.length !== kadrov) zam.push(`картинок в <main> ${kartinki.length}, кадров по файлу содержания ${kadrov}`);
  const klyuchiKartinok = [...kartinki.flatMap((i) => [atr(i, 'src') ?? '', ...kandidaty(atr(i, 'srcset'))]), ...vMain((u) => imya(u) === 'source').flatMap((x) => kandidaty(atr(x, 'srcset')))].map(klyuchAdresa);
  // И любой адрес _astro в атрибутах самого <main> и его элементов (svg image, style, poster, data…) и в <style>
  // внутри <main> (V2-5): после раскрытия процентов, без учёта регистра, с `./` и `//` после папки — ключ `<ключ>.`;
  // неузнанный — «?» (V3-4). Таб и перевод строки выброшены, как у URL-разборщика браузера (R4-V-K-5); проценты
  // раскрываются по одной полной записи ASCII — неполная в запросе или фрагменте раскрытию пути не мешает (R4-V-K-6).
  const ASTRO = /_astro((?:\/\.?)+)([^"'\s)?#,]*)/gi;
  const iskatAstro = (v) => {
    const s = String(v).replace(/[\t\n\r]/g, '').replace(/%([0-7][0-9a-f])/gi, (_x, h) => String.fromCharCode(parseInt(h, 16)));
    for (const m of s.replace(/\\/g, '/').matchAll(ASTRO)) klyuchiKartinok.push(/^([a-z0-9-]+)\./.exec(m[2])?.[1] ?? '?');
  };
  for (const u of [main, ...vMain(() => true)]) {
    for (const a of u.attrs ?? []) iskatAstro(a.value);
    if (imya(u) === 'style') iskatAstro(tekstDetey(u));
  }
  const vne = [...new Set(klyuchiKartinok.filter((k) => !klyuchi.includes(k)))];
  if (vne.length) zam.push(`картинки <main> с ключами вне кадров содержания: ${vne.join(', ')}`);
  // Оформление в <main> — только style обёртки героя: style у самого <main>, <body>, <html> и у прочих элементов <main>
  // (кроме потомков героя — их судит «кадровка внутри героя»), <style> и <link rel=stylesheet> в <main> — замечание (V3-3).
  const obertkaGeroya = hero && imya(hero.parentNode) === 'div' && est(hero.parentNode, 'geroy') ? hero.parentNode : null;
  const chuzhieStili = [chasti(doc).html, chasti(doc).body, main, ...vMain(() => true)].filter(
    (u) => u && atr(u, 'style') !== undefined && u !== obertkaGeroya && !(obertkaGeroya && predki(u).includes(obertkaGeroya))
  );
  if (chuzhieStili.length) zam.push(`кадровка и оформление: style у ${chuzhieStili.map((u) => imya(u) + '.' + [...klassy(u)].join('.')).join(', ')} — в <main> style только у обёртки героя`);
  const { html: kornevoy, body } = chasti(doc);
  const vneMain = (u) => u !== main && !predki(u).includes(main);
  // Вне <main> style — только печать знака сайта: `--farba: var(--…)` у фигур svg.znak (R4-V-P-2).
  const stiliVne = elementy(body ?? doc, (u) => vneMain(u) && atr(u, 'style') !== undefined && !(/^--farba: var\(--[a-z0-9-]+\)$/.test(atr(u, 'style')) && predki(u).some((p) => imya(p) === 'svg' && est(p, 'znak'))));
  if (stiliVne.length) zam.push(`style вне <main> у ${stiliVne.map(kratko).join(', ')} — печать сайта несёт там style только у фигур знака (--farba)`);
  // Атрибуты корня и тела — печать сайта: у <html> только lang, у <body> ни одного (фон, цвет, скрытие страницы; R4-V-K-7).
  const atrKorney = [...(kornevoy?.attrs ?? []).filter((a) => a.name !== 'lang').map((a) => `html ${a.name}`), ...(body?.attrs ?? []).map((a) => `body ${a.name}`)];
  if (atrKorney.length) zam.push(`атрибуты <html>/<body> вне печати сайта: ${atrKorney.join(', ')} — у <html> только lang, у <body> ни одного`);
  const listStiley = (u) => imya(u) === 'style' || (imya(u) === 'link' && (atr(u, 'rel') ?? '').toLowerCase().split(/\s+/).includes('stylesheet'));
  const listyStiley = vMain(listStiley);
  if (listyStiley.length) zam.push(`<style> в <main>: ${listyStiley.length} (${listyStiley.map(imya).join(', ')}) — оформление страницы в <main> не печатается`);
  // <style> и <link rel=stylesheet> в <body> вне <main> действуют на всю страницу так же (R4-V-K-3); в <head> — печать сайта.
  const listyVne = elementy(body ?? doc, (u) => vneMain(u) && listStiley(u));
  if (listyVne.length) zam.push(`<style> в <body> вне <main>: ${listyVne.length} (${listyVne.map(imya).join(', ')}) — оформление страницы вне <head> не печатается`);
  // Скрипт задаёт кадровку и оформление мимо атрибута style: <script> любого пространства имён и атрибут on* в <main>
  // (R4-V-K-4); обработчик on* — нигде в документе (печать сайта их не несёт; <script> вне <main> — модуль шапки, предел).
  const naOn = (u) => (u.attrs ?? []).filter((a) => /^on/i.test(a.name)).map((a) => `${a.name} у ${imya(u)}`);
  const skriptyMain = [main, ...vMain(() => true)].flatMap((u) => [...(imya(u) === 'script' ? ['script'] : []), ...naOn(u)]);
  if (skriptyMain.length) zam.push(`скрипт в <main>: ${skriptyMain.join(', ')} — печать маршрута скриптов не несёт`);
  const obrabotchikiVne = elementy(doc, vneMain).flatMap(naOn);
  if (obrabotchikiVne.length) zam.push(`обработчик on* вне <main>: ${obrabotchikiVne.join(', ')} — печать сайта обработчиков не несёт`);
  const noty = elementy(doc, (u) => imya(u) === 'p' && est(u, 'ft__art-note')).map(txt);
  // «Games:» и «License class:» — по одному разу по тексту <body> вне <main> (абзац подвала без класса ноты — тоже
  // вторая строка; R4-V-K-14) и нот в <main>; пробел после двоеточия не обязателен (предел прежней пачки 4; V1-7, V2-4,
  // V3-9). Запись — как видит читатель (R4-V-K-13): NFKC (полноширинные), без невидимых знаков, без учёта регистра,
  // пробел до двоеточия не обязателен, двоеточия-двойники — в счёт.
  const vid = (s) => s.normalize('NFKC').replace(/[\p{Cf}\u034F\uFE00-\uFE0F]/gu, '');
  const tekstNot = vid(tekstBez(body ?? doc, (u) => u === main) + ' ' + elementy(main, (u) => imya(u) === 'p' && est(u, 'ft__art-note')).map(txt).join(' '));
  const DVOETOCHIE = '\\s*[:\u2236\uA789\u02D0\u02F8\u0589\u05C3\u205A\uFE30]';
  const gamesRaz = (tekstNot.match(new RegExp(`games${DVOETOCHIE}`, 'giu')) ?? []).length;
  const licRaz = (tekstNot.match(new RegExp(`license\\s*class${DVOETOCHIE}`, 'giu')) ?? []).length;
  if (gamesRaz > 1 || licRaz > 1) zam.push(`нот об арте: «Games:» ${gamesRaz} раз, «License class:» ${licRaz} раз — ждали по одному`);
  const igryNoty = (noty.join(' ').match(/Games: ([^.]+)\./) || [])[1];
  const igryKadrov = [...new Set(klyuchi.map((k) => kredity[k]?.game))].sort();
  if (!klyuchi.length && noty.length) zam.push('кадров нет, а нота об арте есть');
  if (klyuchi.length) {
    if (!igryNoty) zam.push('кадры есть, а ноты об арте нет');
    else if (igryNoty.split(', ').sort().join('|') !== igryKadrov.join('|')) zam.push(`игры ноты «${igryNoty}» ≠ игры кадров «${igryKadrov.join(', ')}»`);
    const stroka = noty.find((n) => n.startsWith('License class: '));
    const klassyKadrov = [...new Set(klyuchi.map((k) => kredity[k]?.license).filter(Boolean))].sort();
    if (!stroka) zam.push('нет строки класса лицензии');
    else {
      const klassyNoty = stroka.slice('License class: '.length).replace(/\.$/, '').split('; ').sort();
      if (klassyNoty.join('|') !== klassyKadrov.join('|')) zam.push(`класс лицензии ноты «${klassyNoty.join('; ').slice(0, 60)}» ≠ классам записей кадров`);
    }
  }
  return zam;
}

/**
 * Текст узла без поддеревьев по фильтру (для «лишнего текста»). Дети — `deti` ядра, как у `tekstVsego`: теневой корень
 * (`<template shadowrootmode>`) браузер рисует — его текст в счёт, инертный `<template>` — нет (R4-V-K-11).
 */
function tekstBez(u, isklyuchit) {
  let s = '';
  const stek = [...deti(u)].reverse();
  while (stek.length) {
    const x = stek.pop();
    if (x.nodeName === '#text') s += x.value;
    else if (element(x)) {
      if (isklyuchit(x) || ['script', 'style'].includes(imya(x))) continue;
      const d = deti(x);
      for (let i = d.length - 1; i >= 0; i--) stek.push(d[i]);
    }
  }
  return s;
}

/**
 * Сверка сборки: `dist` и `sayt` (корень сайта). Возвращает `{ zamechaniya: [{ url, chto }], stranic }`.
 * Страница, которой нет в сборке, файл вне структуры, ноль страниц — замечание.
 */
export function sverkaSborki(dist, sayt, { obyazatelnaPodpis = new Set() } = {}) {
  const { struktura, kredity, ikony, soderzhanie } = vhody(sayt);
  const out = [];
  if (!soderzhanie.length) out.push({ url: '—', chto: 'файлов содержания нет — «сверено» о пустом множестве не выдаётся' });
  for (const { fajl, dane } of soderzhanie) {
    const page = struktura.pages.find((p) => p.url === dane?.url);
    if (!page) {
      out.push({ url: fajl, chto: `адрес ${dane?.url} файла содержания не в структуре` });
      continue;
    }
    const f = join(dist, page.url.slice(1), 'index.html');
    if (!existsSync(f)) {
      out.push({ url: page.url, chto: 'страницы нет в сборке' });
      continue;
    }
    for (const chto of sverkaStranicy({ page, dane, html: readFileSync(f, 'utf8'), kredity, ikony, obyazatelnaPodpis })) out.push({ url: page.url, chto });
  }
  // Встречная проверка: каждая страница сборки, кроме главной (свой шаблон), — страница файла содержания; иначе
  // её не сверил никто (папка содержания, которую сверка не прочла, V2-12). Страница — любой `*.html` сборки:
  // `index.html` папки — адрес `/<папка>/`, прочий — `/<путь файла>` (`404.html` — STATUS_CODE_PAGES Astro; V3-7);
  // и `*.htm`, `*.xhtml`, `*.shtml` в любом регистре — статический хостинг отдаёт их страницей (R4-V-K-9).
  const adresaSoderzhaniya = new Set(soderzhanie.map((s) => s.dane?.url));
  const obhodDist = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) obhodDist(join(d, e.name));
      else if (/\.(x?html?|shtml)$/i.test(e.name)) {
        const rel = relative(dist, join(d, e.name)).split(sep).join('/');
        const url = e.name === 'index.html' ? `/${rel.slice(0, -'index.html'.length)}` : `/${rel}`;
        if (url !== '/' && !adresaSoderzhaniya.has(url)) out.push({ url, chto: 'страница сборки без файла содержания — её не сверил никто' });
      }
    }
  };
  obhodDist(dist);
  return { zamechaniya: out, stranic: soderzhanie.length };
}

/**
 * Интеграция Astro — сторож сборки сайта. `obyazatelnaPodpis` — адреса, где подпись кадра героя
 * обязательна (кадр можно принять за другое; данные — `gates/sverka.mjs`).
 * @param {{ obyazatelnaPodpis?: string[] }} [opcii]
 * @returns {import('astro').AstroIntegration}
 */
export default function sverka({ obyazatelnaPodpis = [] } = {}) {
  let koren = null;
  return {
    name: 'sayt:sverka-dist',
    hooks: {
      'astro:config:done': ({ config }) => {
        koren = fileURLToPath(config.root);
      },
      'astro:build:done': ({ dir, logger }) => {
        const r = sverkaSborki(fileURLToPath(dir), koren, { obyazatelnaPodpis: new Set(obyazatelnaPodpis) });
        if (r.zamechaniya.length) {
          logger.error(`сверка dist: замечаний ${r.zamechaniya.length}`);
          throw new Error(
            `Страницы разошлись с файлами содержания — ${r.zamechaniya.length}:\n` + r.zamechaniya.map((z) => `  ${z.url}: ${z.chto}`).join('\n') + '\nПоправьте маршрут, содержание или структуру — не сверку.'
          );
        }
        logger.info(`сверка dist: страниц маршрута ${r.stranic} — герой, подпись, ряды и кадры, галерея, призыв и нота подвала по файлам содержания`);
      },
    },
  };
}

/** Корень сайта для запуска вне сборки. */
export const SAYT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
