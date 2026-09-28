/**
 * ОДНО ИЗВЛЕЧЕНИЕ ТЕКСТА — для страниц сайта и для документов корпуса (П102 блок А, бэклог 68 п. 2).
 *
 * До выноса у каждого судьи было своё: сторож брифов снимал теги регулярным выражением,
 * копии сторожа и разборы реплик и глав — своими масками блочных и строчных тегов, срез
 * окончаний — своей; указатель корпуса и страница делились на слова по-разному, и одна
 * фраза на странице и в документе резалась иначе (бэклог 68 п. 2, 3). Здесь — одно дерево
 * (parse5, `html.mjs`) и одна функция строк на всех.
 *
 * СТРОКИ. Видимый текст режется на строки по блочным элементам (`BLOCHNYE` — список судьи глав
 * сессии 19, пять раундов «судью судят»): 8-грамма судится внутри одной строки, фраза, которую
 * разрезал заголовок или абзац, — две фразы. Любой другой элемент, комментарий, скрипт и стиль
 * СТРОЧНЫЕ, и строка читается ДВАЖДЫ: вплотную (ссылка или `<em>` внутри слова не рвут его:
 * «Wo<em>r</em>ld» — «World») и через пробел (соседние строчные элементы, стоящие на экране
 * раздельно, не склеиваются: «Remix</span><span>Guide»). Судьи судят оба прочтения. `<br>` —
 * пробел в обоих: строка на экране переносится, фраза — нет.
 *
 * ЗНАКИ, как их видит читатель (правила судьи глав сессии 19, раунды 2–5): `\t \n \r` — пробел;
 * прочие управляющие (C0, C1, DEL) и невидимые знаки (`Default_Ignorable_Code_Point`: мягкий
 * перенос, U+200B, U+2060, селекторы вариантов…) снимаются — слово на экране целое; заполнители
 * хангыля (U+3164, U+115F, U+1160, U+FFA0) и U+1BCA0–U+1BCA3 — пробел (их рисуют пустым глифом);
 * NFC; пробелы сводятся. Сущности и числовые ссылки раскрывает разборщик по спецификации (в том
 * числе &#128;–&#159; по windows-1252: «Fox&#146;s» — «Fox’s», как в браузере).
 *
 * ЧТО СЧИТАЕТСЯ ТЕКСТОМ. Всё, кроме `<script>`, `<style>`, комментариев и содержимого `<template>`.
 * Скрытое (`hidden`, классы скрытия, `aria-hidden`) считается видимым — строже: судья, который
 * верит скрытию, пропустит текст, скрытый только до первого стиля.
 *
 * СТРАНИЦА (`izvlechStranicu`): строки единственного `<main>` в двух прочтениях; голова —
 * `<title>`, `description`, `og:title`, `og:description` из `<head>` (дерево кладёт туда и `<meta>`
 * между `</head>` и `<body>`, как браузер); атрибуты тегов `<main>` — `alt`, `title`, `aria-label`,
 * `value`, `placeholder`, `label`. Голова и атрибуты — отдельными строками, каждая сама по себе.
 *
 * ДОКУМЕНТ КОРПУСА (`izvlechDokument`) — ТЕ ЖЕ строки, но всего `<body>` и с `<title>` впереди,
 * сведённые в один поток на прочтение: указатель корпуса и раньше был потоком всего документа,
 * и 8-граммы через границы его блоков остаются в указателе (прежний указатель не теряет ни одной
 * своей 8-граммы из-за блоков). `meta`, JSON-LD и атрибуты документа в указатель не идут, как
 * и прежде (сторож брифов, R1-BRIFY-4).
 */

import { razobrat, element, imya, atr, chasti, elementy, tekstVsego } from './html.mjs';

/** Блочные элементы: граница строки. Остальные — строчные (два прочтения). */
export const BLOCHNYE = new Set(
  'html body p h1 h2 h3 h4 h5 h6 li dd dt dl figcaption figure blockquote div section article aside header footer nav ul ol main pre hr address details summary form fieldset legend'.split(' ')
);
/** Не текст: содержимое не читается, сам элемент — строчный (два прочтения вокруг него). */
export const NE_TEKST = new Set(['script', 'style', 'template']);
/** Атрибуты тегов `<main>`, которые читатель видит или слышит как текст. */
export const ATRIBUTY_TEKSTA = ['alt', 'title', 'aria-label', 'value', 'placeholder', 'label'];

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
 * на страницу и на документ; прочтения собираются из одного потока.
 */
export function potok(koren) {
  const out = [];
  const obhod = (u) => {
    for (const d of u.childNodes ?? []) {
      if (d.nodeName === '#text') out.push({ tip: 'tekst', v: d.value, uzel: d });
      else if (d.nodeName === '#comment') out.push({ tip: 'strochnyi' });
      else if (element(d)) {
        const im = imya(d);
        if (NE_TEKST.has(im)) {
          out.push({ tip: 'strochnyi' });
          continue;
        }
        if (im === 'br') {
          out.push({ tip: 'probel' });
          continue;
        }
        const tip = BLOCHNYE.has(im) ? 'blok' : 'strochnyi';
        out.push({ tip, uzel: d });
        obhod(d);
        out.push({ tip, uzel: d });
      }
    }
  };
  obhod(koren);
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

/** Значения `<meta>` головы по имени (`name` или `property`, без учёта регистра). */
function metaPo(head, klyuch) {
  return elementy(head, (u) => imya(u) === 'meta')
    .filter((m) => [atr(m, 'name'), atr(m, 'property')].some((v) => (v ?? '').toLowerCase() === klyuch))
    .map((m) => atr(m, 'content') ?? '');
}

/**
 * Страница сайта. Бросает `OshibkaIzvlecheniya`, если `<main>` не ровно один или нет `<head>`.
 * Голова возвращается списками (сколько нашлось — столько и значений): «ровно по одному
 * и непустые» решает судья.
 */
export function izvlechStranicu(html) {
  const doc = razobrat(html);
  const { head } = chasti(doc);
  const mainy = elementy(doc, (u) => imya(u) === 'main');
  if (mainy.length !== 1) throw new OshibkaIzvlecheniya(`<main> — ${mainy.length}, нужен ровно один`);
  const main = mainy[0];
  const tok = potok(main);
  const golova = {
    title: head ? elementy(head, (u) => imya(u) === 'title').map((t) => chistit(tekstVsego(t))) : [],
    description: head ? metaPo(head, 'description').map(chistit) : [],
    'og:title': head ? metaPo(head, 'og:title').map(chistit) : [],
    'og:description': head ? metaPo(head, 'og:description').map(chistit) : [],
  };
  const atributy = [];
  for (const u of elementy(main)) {
    for (const a of ATRIBUTY_TEKSTA) {
      const v = atr(u, a);
      if (v !== undefined && chistit(v)) atributy.push({ atr: a, tekst: chistit(v), uzel: u });
    }
  }
  return { doc, main, vplotnuyu: stroki(tok, ''), cherezProbel: stroki(tok, ' '), golova, atributy };
}

/**
 * Документ корпуса: `<title>` и строки `<body>` — по потоку на прочтение (см. шапку).
 * Документ без `<body>` (frameset) даёт только заголовок.
 */
export function izvlechDokument(html) {
  const doc = razobrat(html);
  const { head, body } = chasti(doc);
  const titly = head ? elementy(head, (u) => imya(u) === 'title').map((t) => chistit(tekstVsego(t))).filter(Boolean) : [];
  const tok = body ? potok(body) : [];
  const svesti = (na) => [...titly, ...stroki(tok, na).map((s) => s.tekst)].join(' ');
  return { vplotnuyu: svesti(''), cherezProbel: svesti(' ') };
}
