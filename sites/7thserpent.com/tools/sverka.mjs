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
 *     держатся скрим, тон и кадровка маршрута); `aria-labelledby="page-title"`; `h1#page-title` с `hero__title`
 *     и `t-headline` — в колонке текста (`.hero__text`), перед лидом; `.page-head` нет; кадр —
 *     картинка в `.hero__art` (ключ `src` и каждого кандидата `srcset` = `art`, `alt` = «<игра> —
 *     <опис>» записи, `width` и `height` — размеры мастера в записи: `sizes` героя считается
 *     по ним, П102 п. 1, R1-P1-2); `.foto__credit` в рамке арта нет; тон — `geroy--stal` ⇔ вид
 *     записи не «key art»; кадровка — `--fokus` ⇔ `artFocus`; подпись кадра — ровно одна
 *     `p.podpis-geroya.t-caption` в `<main>`, последним узлом секции героя (элемент или непустой
 *     текст) ⇔ `artCaption`, у страниц, где кадр — не игра страницы, обязательна (данные сайта:
 *     `/remake/`, `/movie/`); кнопки — ровно одна `a.btn-primary` и одна `a.btn-secondary` в герое,
 *     адрес и надпись — из содержания, иконка главной — ровно один `svg`, все его элементы — `path`
 *     стрелки вниз при якоре, вправо при адресе (`src/data/icons.ts`), путей вне `svg` нет; лид — `lead`. Героя нет — `h1` в `header.page-head`, подписи кадра нет;
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
 *     ровно один `h2#gallery-title.gallery__title.t-headline` = `title`; строка `p.gallery__lead`
 *     не больше одной, есть ⇔ `lead`, раньше сетки; `li.gallery__item` — по кадру, в порядке файла;
 *     `figure` и `img` в секции — по числу кадров; в каждом пункте ровно одна `div.foto` с классом
 *     тона `kadr-galerei` и картинкой (как у героя), ровно одна `figcaption.t-caption` = `caption`,
 *     другого текста нет; текста в секции вне заголовка, строки и кадров нет; `kadr-galerei`
 *     в `<main>` — только у кадров галереи;
 *   - ПРИЗЫВ объявлен ⇔ ровно одна `section.cta`, последний ребёнок `<main>`; заголовок, лид,
 *     надпись и адрес кнопки `a.cta__btn` — из содержания, кнопка — `btn-primary`;
 *   - КАРТИНКИ `<main>` — ровно по числу кадров файла содержания (герой, ряды к печати с `art`,
 *     пункты галереи), ключи `src`, `srcset` и `<source srcset>` — только ключи этих кадров;
 *   - НОТА ПОДВАЛА — игры ноты («Games: …») = игры всех кадров страницы (герой, ряды, галерея)
 *     по записям, классы строки лицензии («License class: …») = классы тех же записей; «Games:»
 *     и «License class:» — по одному разу; кадров нет — ноты нет.
 * Раунд 1 «судью судят» блока В вернул проверки прежних сверок, которые новая потеряла (V1-1…V1-5),
 * и закрыл пределы прежних (V1-6, V1-7).
 * Текст сравнивается после одной нормализации для обеих сторон (`norm`: пробельные, включая
 * неразрывный, — пробел, края срезаны — как `tekst()` схемы).
 *
 * ПРЕДЕЛЫ (названы): вид (сетка, рамки, скрим, растяжение) — кадры и глаза владельца; контраст —
 * замер пикселей; `sizes` и ширины кандидатов не судятся (судится только ключ и размеры мастера);
 * «связанные» (`link-list`) судит сторож `links` ядра (адреса) и эта сверка не судит их ярлыки;
 * текст и блоки `<main>` вне полей содержания — третья кнопка героя, абзац в колонке героя, в ряду
 * вне `year`/`title`/`meta`/`body` или в призыве, `section` без класса блока — не судятся (кроме
 * галереи; V1-8, test.todo); фронтматтер находится выражением загрузчика Astro и разбирается пакетом
 * `yaml` с ключами слияния, как `js-yaml` загрузчика; файлы и папки с точки не читаются, как загрузчиком.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as yamlParse } from 'yaml';
import { razobrat, elementy, pervyi, imya, atr, klassy, predki, tekstVsego, element } from '@factory/core/text/html.mjs';

/** Одна нормализация для обеих сторон сверки. */
export const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const txt = (u) => (u ? norm(tekstVsego(u)) : undefined);
const est = (u, k) => klassy(u).has(k);
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
    return [...m[1].matchAll(/\sd="([^"]*)"/g)].map((x) => x[1]);
  };
  const ikony = { 'arrow-down': ikona('arrow-down'), 'arrow-right': ikona('arrow-right') };
  const papka = join(sayt, 'src/content/tresc');
  const fajly = [];
  const obhod = (d) => {
    for (const x of readdirSync(d, { withFileTypes: true })) {
      // Имена с точки загрузчик коллекции не видит (`**/*.md`, dot: false) — и сверка тоже (V1-10).
      if (x.name.startsWith('.')) continue;
      const p = join(d, x.name);
      if (x.isDirectory()) obhod(p);
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

/** Замечания о картинке кадра: ключ `src` и каждого кандидата `srcset`, `alt`, `width`/`height` — по записи. */
function sverkaKartinki(img, klyuch, gde, kredity) {
  if (!img) return [`${gde}: нет картинки`];
  const zam = [];
  const zapis = kredity[klyuch];
  const kandidaty = (atr(img, 'srcset') ?? '').split(',').map((c) => c.trim().split(/\s+/)[0]).filter(Boolean);
  if (!kandidaty.length) zam.push(`${gde}: у картинки нет srcset`);
  const chuzhie = [...new Set([atr(img, 'src') ?? '', ...kandidaty].map(klyuchAdresa).filter((k) => k !== klyuch))];
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
      // Обёртка — вплотную: кроме героя, только пробельный текст и комментарии (пачка 2; V1-2).
      const obertkaVerna = imya(obertka) === 'div' && est(obertka, 'geroy') && obertka.childNodes.every((x) => x === hero || (!element(x) && (x.nodeName !== '#text' || !norm(x.value))));
      if (!obertkaVerna) zam.push('нет обёртки div.geroy вокруг одного героя — скрим, тон и кадровка маршрута героя не достанут');
      const h = h1[0];
      if (!h || !predki(h).includes(hero)) zam.push('h1 не внутри героя');
      else {
        const tekst = pervyi(hero, (u) => est(u, 'hero__text'));
        const lid = pervyi(hero, (u) => est(u, 'hero__lead'));
        if (!tekst || !predki(h).includes(tekst) || (lid && por.get(h) > por.get(lid))) zam.push('h1 героя не в колонке текста (.hero__text, перед лидом)');
        if (!est(h, 'hero__title') || !est(h, 't-headline')) zam.push(`классы h1 героя «${[...klassy(h)].join(' ')}», ждали hero__title и t-headline`);
        if (atr(h, 'id') !== 'page-title') zam.push('у h1 героя нет id="page-title"');
      }
      if (vMain((u) => est(u, 'page-head')).length) zam.push('при герое напечатана .page-head');
      const art = pervyi(hero, (u) => est(u, 'hero__art'));
      zam.push(...sverkaKartinki(art && pervyi(art, (u) => imya(u) === 'img'), dane.art, 'кадр героя', kredity));
      if (art && pervyi(art, (u) => est(u, 'foto__credit'))) zam.push('подпись в рамке арта героя (.foto__credit) — под скримом');
      if (obertkaVerna) {
        const stal = est(obertka, 'geroy--stal');
        const kluchevoy = /^key art\b/.test(kredity[dane.art]?.kind ?? '');
        if (stal === kluchevoy) zam.push(`тон кадра: geroy--stal ${stal ? 'есть' : 'нет'}, а вид записи — ${kredity[dane.art]?.kind}`);
        const fokus = (atr(obertka, 'style') ?? '').match(/--fokus:\s*([^;"]+)/)?.[1]?.trim();
        if ((fokus ?? null) !== (dane.artFocus ?? null)) zam.push(`кадровка ${fokus ?? '—'}, в содержании ${dane.artFocus ?? '—'}`);
      }
      if (dane.artCaption) {
        // Последний узел героя — элемент или непустой текст (текст после подписи — не «последней», V1-2).
        const posled = hero.childNodes.filter((x) => element(x) || (x.nodeName === '#text' && norm(x.value))).at(-1);
        if (podpisi.length !== 1 || posled !== podpisi[0]) zam.push(`подпись кадра: в <main> ${podpisi.length} шт., последним элементом героя (место dopisek) — ${posled && est(posled, 'podpis-geroya') ? 'да' : 'нет'}; ждали одну, последней`);
        else {
          if (!est(podpisi[0], 't-caption')) zam.push(`подпись кадра без роли t-caption («${[...klassy(podpisi[0])].join(' ')}»)`);
          if (txt(podpisi[0]) !== norm(dane.artCaption)) zam.push(`текст подписи кадра «${txt(podpisi[0])}», в содержании «${norm(dane.artCaption)}»`);
        }
      } else if (podpisi.length) zam.push('подпись кадра напечатана, а в содержании её нет');
      if (obyazatelnaPodpis.has(page.url) && !dane.artCaption) zam.push(`подпись кадра обязательна у героя ${page.url} (кадр — не игра страницы), а artCaption нет`);
      for (const [klass, pole] of [['btn-primary', 'primary'], ['btn-secondary', 'secondary']]) {
        const kn = elementy(hero, (u) => imya(u) === 'a' && est(u, klass));
        if (kn.length !== 1) {
          zam.push(`кнопок ${klass} в герое ${kn.length}, ждали 1`);
          continue;
        }
        if ((atr(kn[0], 'href') ?? '') !== dane[pole]?.href) zam.push(`${pole}: адрес ${atr(kn[0], 'href')}, в содержании ${dane[pole]?.href}`);
        if (txt(kn[0]) !== norm(dane[pole]?.label)) zam.push(`${pole}: надпись «${txt(kn[0])}», в содержании «${norm(dane[pole]?.label)}»`);
        if (pole === 'primary') {
          const imyaIk = String(dane.primary?.href).startsWith('#') ? 'arrow-down' : 'arrow-right';
          // Иконка — ровно один svg, все его элементы — path с теми же d, путей вне svg нет (пачка 2; V1-3).
          const svgi = elementy(kn[0], (u) => imya(u) === 'svg');
          const d = svgi.length === 1 ? elementy(svgi[0]).map((p) => (imya(p) === 'path' ? atr(p, 'd') : '<' + imya(p) + '>')) : ['svg: ' + svgi.length];
          if (elementy(kn[0], (u) => imya(u) === 'path').length !== elementy(svgi[0] ?? kn[0], (u) => imya(u) === 'path').length) d.push('path вне svg');
          if (d.join('|') !== ikony[imyaIk].join('|')) zam.push(`иконка главной кнопки — не ${imyaIk} (адрес ${dane.primary?.href})`);
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
        if (txt(kn[0]) !== norm(dane.cta?.label)) zam.push(`надпись кнопки призыва «${txt(kn[0])}», в содержании «${norm(dane.cta?.label)}»`);
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
  const vne = [...new Set(klyuchiKartinok.filter((k) => !klyuchi.includes(k)))];
  if (vne.length) zam.push(`картинки <main> с ключами вне кадров содержания: ${vne.join(', ')}`);
  const noty = elementy(doc, (u) => imya(u) === 'p' && est(u, 'ft__art-note')).map(txt);
  // «Games:» и «License class:» — по одному разу (предел прежней пачки 4; V1-7).
  const gamesRaz = (noty.join(' ').match(/Games: /g) ?? []).length;
  const licRaz = noty.filter((n) => n.startsWith('License class: ')).length;
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

/** Текст узла без поддеревьев по фильтру (для «лишнего текста»). */
function tekstBez(u, isklyuchit) {
  let s = '';
  const stek = [...(u.childNodes ?? [])].reverse();
  while (stek.length) {
    const x = stek.pop();
    if (x.nodeName === '#text') s += x.value;
    else if (element(x)) {
      if (isklyuchit(x) || ['script', 'style'].includes(imya(x))) continue;
      for (let i = (x.childNodes ?? []).length - 1; i >= 0; i--) stek.push(x.childNodes[i]);
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
  return { zamechaniya: out, stranic: soderzhanie.length };
}

/**
 * Интеграция Astro — сторож сборки сайта. `obyazatelnaPodpis` — адреса, где подпись кадра героя
 * обязательна (кадр — не игра страницы).
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
