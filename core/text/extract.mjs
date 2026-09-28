/**
 * ОДНО ИЗВЛЕЧЕНИЕ ТЕКСТА — для страниц сайта и для документов корпуса (П102 блок А, бэклог 68 п. 2).
 *
 * До выноса у каждого судьи было своё: сторож брифов снимал теги регулярным выражением,
 * копии сторожа и разборы реплик и глав — своими масками блочных и строчных тегов, срез
 * окончаний — своей; указатель корпуса и страница делились на слова по-разному, и одна
 * фраза на странице и в документе резалась иначе (бэклог 68 п. 2, 3). Здесь — одно дерево
 * (parse5, `html.mjs`) и одна функция строк на всех.
 *
 * СТРОКИ. Видимый текст режется на строки по блочным HTML-элементам (`BLOCHNYE`: список судьи глав
 * сессии 19 и блоки браузера по умолчанию — ряды и части таблиц, `center`, `menu`, `dir`, `hgroup`,
 * `search`, `xmp`, `listing`, `plaintext`, `dialog`, пункты `<select>`; раунд 1 «судью судят»
 * блока А, A1-IZ-6): 8-грамма судится внутри одной строки, фраза, которую разрезал заголовок или
 * абзац, — две фразы. Ячейка (`td`, `th`) — пробел в обоих прочтениях, как `<br>`: ряд таблицы —
 * одна строка, фраза через ячейки ряда ловится (так было и у прежнего судьи), а тег внутри слова
 * ячейки её не рвёт (раунд 2, A2-3). Любой другой элемент, комментарий, скрипт и стиль СТРОЧНЫЕ,
 * и строка читается ДВАЖДЫ: вплотную (ссылка или `<em>` внутри слова не рвут его:
 * «Wo<em>r</em>ld» — «World») и через пробел (соседние строчные элементы, стоящие на экране
 * раздельно, не склеиваются: «Remix</span><span>Guide»). Судьи судят оба прочтения. `<br>` —
 * пробел в обоих: строка на экране переносится, фраза — нет. Элемент SVG или MathML с именем
 * блока (`<svg><nav/></svg>`) — строчный, не блок (A1-IZ-4).
 *
 * ЗНАКИ, как их видит читатель (правила судьи глав сессии 19, раунды 2–5): `\t \n \r` — пробел;
 * прочие управляющие (C0, C1, DEL) и невидимые знаки (`Default_Ignorable_Code_Point`: мягкий
 * перенос, U+200B, U+2060, селекторы вариантов, знаки направления, U+FEFF…) снимаются — слово на
 * экране целое; заполнители хангыля (U+3164, U+115F, U+1160, U+FFA0) и U+1BCA0–U+1BCA3 — пробел
 * (их рисуют пустым глифом); NFC; пробелы сводятся. Сущности и числовые ссылки раскрывает
 * разборщик по спецификации (в том числе &#128;–&#159; по windows-1252: «Fox&#146;s» — «Fox’s»,
 * как в браузере).
 *
 * ЧТО СЧИТАЕТСЯ ТЕКСТОМ. Всё, кроме `<script>`, `<style>`, комментариев и содержимого инертного
 * `<template>`; содержимое `<template shadowrootmode>` браузер рисует — оно текст (A1-IZ-2).
 * Скрытое (`hidden`, классы скрытия, `aria-hidden`) считается видимым: отдельной строкой или
 * фразой оно даёт судье больше текста (строже).
 *
 * ПРЕДЕЛЫ (названы; тесты `todo` в `extract.test.mjs`): скрытое ВНУТРИ видимой фразы
 * (`<span hidden>`, текст для скринридера, `<svg><title>`, `<rp>`/`<rt>`, `<noscript>` для читателя
 * с JS, запасной текст `<audio>`/`<video>`/`<object>`) рвёт её 8-грамму в обоих прочтениях — фраза
 * корпуса с таким вкраплением не ловится (A1-IZ-3); порядок слов — логический, текст,
 * развёрнутый на экране `<bdo dir="rtl">` или U+202E, судится как записан (A1-IZ-8); `<style>`
 * внутри `<option>` — текст (parse5 8.0.1 разбирает `<select>` по прежней спецификации, A1-IZ-7);
 * видимый текст CSS `content` (`::before`, кавычки `<q>`, номера `<ol>`) не виден; `srcdoc`
 * у `<iframe>` не читается; буквы-двойники и знаки совместимости (`ﬁ`, полноширинные, 𝐟) не
 * сводятся к латинице — NFC, не NFKC (предел семейства судей, бэклог 68 п. 2); текст вне `<main>`
 * и головы (шапка, крошки, подвал) и JSON-LD судьи страниц не судят.
 *
 * СТРАНИЦА (`izvlechStranicu`): строки единственного HTML-`<main>` в двух прочтениях; голова —
 * все HTML-`<title>` вне `<main>` (и в `foreignObject`, и в теневом корне; `document.title` берёт
 * первый — судья, требующий ровно один, на лишнем громко отказывает, строже) и HTML-`<meta>`
 * (`description`, `og:title`, `og:description`, а также `twitter:title`, `twitter:description`,
 * `og:image:alt`, `twitter:image:alt` — A3-6) по всему документу — и в `<main>`: meta, которую разборщик без скриптов вынес
 * в `<body>` (`<noscript>` с картинкой закрывает голову), тоже голова для скребка (A1-IZ-5, A2-1);
 * атрибуты самого `<main>` и его тегов — `alt`, `title`, `aria-label`, `aria-description`,
 * `aria-roledescription`, `aria-valuetext`, `aria-placeholder`, `aria-braillelabel`,
 * `aria-brailleroledescription`, `aria-rowindextext`, `aria-colindextext`, `value`, `placeholder`,
 * `label`, `alttext` (MathML), `abbr` (`<th>`), `summary` (`<table>`) — то, что читатель видит или
 * слышит (A1-IZ-1, A1-IZ-10, A2-15). `value=` судится у любого тега, и там, где значение не видно (строже). Голова
 * и атрибуты — отдельными строками, каждая сама по себе.
 *
 * ДОКУМЕНТ КОРПУСА (`izvlechDokument`) — ТЕ ЖЕ строки, но всего `<body>` и с `<title>` впереди,
 * по прочтению. Указатель корпуса делит на слова каждую строку отдельно (адреса, свёртка имён —
 * как у строки страницы) и сводит слова в один поток: 8-граммы через границы блоков документа
 * остаются в указателе, как в прежнем (он был потоком всего документа), а имя не сворачивается
 * через границу блоков (A1-UK-4). `meta`, JSON-LD и атрибуты документа в указатель не идут, как
 * и прежде (сторож брифов, R1-BRIFY-4). 8-граммы прежнего указателя, которых в новом нет, —
 * не из-за блоков, а из разбора: значения атрибутов, которые прежний срез тегов пускал в текст
 * на «>» внутри значения, содержимое `<template>`, иное раскрытие сущностей (замер сессии 20).
 */

import { razobrat, element, vHtml, imya, atr, chasti, elementy, tekstVsego, deti, tenevoyShablon, predki } from './html.mjs';

/** Блочные HTML-элементы: граница строки. Остальные — строчные (два прочтения). */
export const BLOCHNYE = new Set(
  (
    'html body p h1 h2 h3 h4 h5 h6 li dd dt dl figcaption figure blockquote div section article aside header footer nav ul ol main pre hr ' +
    'address details summary form fieldset legend table caption thead tbody tfoot tr center menu dir hgroup search xmp listing ' +
    'plaintext dialog optgroup option'
  ).split(' ')
);
/** Ячейки ряда таблицы: пробел в обоих прочтениях (ряд — одна строка). */
export const YACHEYKI = new Set(['td', 'th']);
/** Не текст: содержимое не читается, сам элемент — строчный (два прочтения вокруг него). */
export const NE_TEKST = new Set(['script', 'style', 'template']);
/** Атрибуты тегов `<main>`, которые читатель видит или слышит как текст. */
export const ATRIBUTY_TEKSTA = [
  'alt',
  'title',
  'aria-label',
  'aria-description',
  'aria-roledescription',
  'aria-valuetext',
  'aria-placeholder',
  'aria-braillelabel',
  'aria-brailleroledescription',
  'aria-rowindextext',
  'aria-colindextext',
  'value',
  'placeholder',
  'label',
  'alttext',
  'abbr',
  'summary',
];
/** Поля головы: `name` или `property` `<meta>` (и `title` — элемент). */
export const POLYA_META = ['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description', 'og:image:alt', 'twitter:image:alt'];

/** Строка, как её видит читатель: см. шапку, «ЗНАКИ». */
export function chistit(s) {
  return s
    .replace(/[\t\n\r]/g, ' ')
    .replace(/[ㅤᅟᅠﾠ\u{1BCA0}-\u{1BCA3}]/gu, ' ')
    .replace(/\p{Default_Ignorable_Code_Point}/gu, '')
    .replace(/\p{Cc}/gu, '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Поток узла: тексты и отметки границ — блочной, строчной, пробела (`<br>`). Одна функция
 * на страницу и на документ; прочтения собираются из одного потока. Обход — явным стеком.
 */
export function potok(koren) {
  const out = [];
  const stek = [...deti(koren)].reverse().map((u) => ({ u }));
  while (stek.length) {
    const f = stek.pop();
    if (f.zakryt) {
      out.push({ tip: f.tip, uzel: f.u });
      continue;
    }
    const d = f.u;
    if (d.nodeName === '#text') out.push({ tip: 'tekst', v: d.value, uzel: d });
    else if (d.nodeName === '#comment') out.push({ tip: 'strochnyi' });
    else if (element(d)) {
      const im = imya(d);
      if (NE_TEKST.has(im) && !tenevoyShablon(d)) {
        out.push({ tip: 'strochnyi' });
        continue;
      }
      if (vHtml(d) && im === 'br') {
        out.push({ tip: 'probel' });
        continue;
      }
      const tip = vHtml(d) && BLOCHNYE.has(im) ? 'blok' : vHtml(d) && YACHEYKI.has(im) ? 'probel' : 'strochnyi';
      out.push({ tip, uzel: d });
      stek.push({ u: d, zakryt: true, tip });
      const ch = deti(d);
      for (let i = ch.length - 1; i >= 0; i--) stek.push({ u: ch[i] });
    }
  }
  return out;
}

/**
 * Строки потока в одном прочтении: `na` — чем стать строчной границе ('' — вплотную, ' ' — через
 * пробел). Строка — `{ tekst, uzel }`, `uzel` — первый непустой текстовый узел строки (по нему
 * судья находит ряд и секцию строки).
 */
export function stroki(tok, na) {
  const out = [];
  let tek = '';
  let uzel = null;
  const sbros = () => {
    const s = chistit(tek);
    if (s) out.push({ tekst: s, uzel });
    tek = '';
    uzel = null;
  };
  for (const x of tok) {
    if (x.tip === 'blok') sbros();
    else if (x.tip === 'tekst') {
      if (!uzel && /\S/.test(x.v)) uzel = x.uzel;
      tek += x.v;
    } else if (x.tip === 'probel') tek += ' ';
    else tek += na;
  }
  sbros();
  return out;
}

/** Ошибка извлечения: страница не такова, чтобы судить её текст (итог судьи не выдаётся). */
export class OshibkaIzvlecheniya extends Error {}

/**
 * Голова документа: HTML-`title` вне `<main>` (его текст внутри `<main>` уже в строках) и HTML-`<meta>`
 * по полям `POLYA_META` по всему документу. Списками: «ровно по одному и непустые» решает судья.
 */
function golovaDokumenta(doc, main) {
  const vse = elementy(doc, (u) => vHtml(u) && (imya(u) === 'title' || imya(u) === 'meta'));
  const golova = { title: vse.filter((u) => imya(u) === 'title' && !predki(u).includes(main)).map((t) => chistit(tekstVsego(t))) };
  const meta = vse.filter((u) => imya(u) === 'meta');
  for (const pole of POLYA_META) {
    golova[pole] = meta.filter((m) => [atr(m, 'name'), atr(m, 'property')].some((v) => (v ?? '').toLowerCase() === pole)).map((m) => chistit(atr(m, 'content') ?? ''));
  }
  return golova;
}

/** Страница сайта. Бросает `OshibkaIzvlecheniya`, если HTML-`<main>` не ровно один. */
export function izvlechStranicu(html) {
  const doc = razobrat(html);
  const mainy = elementy(doc, (u) => vHtml(u) && imya(u) === 'main');
  if (mainy.length !== 1) throw new OshibkaIzvlecheniya(`<main> — ${mainy.length}, нужен ровно один`);
  const main = mainy[0];
  const tok = potok(main);
  const atributy = [];
  for (const u of [main, ...elementy(main)]) {
    for (const a of ATRIBUTY_TEKSTA) {
      const v = atr(u, a);
      if (v !== undefined && chistit(v)) atributy.push({ atr: a, tekst: chistit(v), uzel: u });
    }
  }
  return { doc, main, vplotnuyu: stroki(tok, ''), cherezProbel: stroki(tok, ' '), golova: golovaDokumenta(doc, main), atributy };
}

/**
 * Документ корпуса: `<title>` и строки `<body>` — списком строк на прочтение (см. шапку).
 * Документ без `<body>` (frameset) даёт только заголовок.
 */
export function izvlechDokument(html) {
  const doc = razobrat(html);
  const { head, body } = chasti(doc);
  const titly = head ? elementy(head, (u) => vHtml(u) && imya(u) === 'title').map((t) => chistit(tekstVsego(t))).filter(Boolean) : [];
  const tok = body ? potok(body) : [];
  const svesti = (na) => [...titly, ...stroki(tok, na).map((s) => s.tekst)];
  return { vplotnuyu: svesti(''), cherezProbel: svesti(' ') };
}
