/**
 * РАЗБОР СТРАНИЦЫ — parse5, дерево, которое строит браузер (П71 п. 9, П102 блок А).
 *
 * Судьи сайтов до выноса (сессии 12–19) разбирали HTML регулярными выражениями, и раунды
 * «судью судят» шли в основном по краям этого разбора: пустой комментарий `<!-->`, `--!>`,
 * сырой текст `<textarea>` и `<title>` в теле, «<» перед не-буквой, `<main>` внутри значения
 * атрибута, сущности без «;», числовые ссылки &#128;–&#159; (бэклог 68 п. 3). Токенизатор
 * и построитель дерева parse5 идут по спецификации HTML — так же, как браузер, поэтому этих
 * краёв у судей на этом фундаменте нет: где кончается разметка и начинается текст, решает
 * тот же алгоритм, что у браузера. Что из текста ВИДНО на экране, дерево не говорит (стили,
 * скрытие) — это решает извлечение (`extract.mjs`) и называет свои пределы.
 *
 * РЕЖИМ — БЕЗ СКРИПТОВ (`scriptingEnabled: false`): содержимое `<noscript>` разбирается
 * разметкой, как у читателя и поисковика без JS. Судья, который видит только страницу
 * со скриптами, не увидел бы в `<noscript>` ни текста, ни `<meta>`, а их прочтёт скребок.
 * ПРЕДЕЛЫ ВЕРСИИ: parse5 8.0.1 разбирает `<select>` по прежней редакции спецификации (Chrome 135+
 * сохраняет в нём теги) и не знает декларативного теневого DOM — `<template shadowrootmode>`
 * обход ниже раскрывает сам при любом значении атрибута и любом хозяине, даже в `<head>` (браузер
 * раскрывает не всякий — строже: лишний `<title>` или `<main>` в таком шаблоне даёт громкий отказ,
 * раунд 3, A3); прочий `<template>` — инертный фрагмент: его
 * содержимое лежит в `content`, не среди детей, и обход его не видит.
 *
 * ПРОСТРАНСТВО ИМЁН: элемент SVG или MathML — не HTML, даже если зовётся `nav` или `main` (`vHtml`
 * судит пространство имён самого элемента, как браузер: HTML внутри `foreignObject` и теги, которые
 * разборщик выносит из SVG, — HTML): блоком и `<main>` судьи считают только HTML-элементы.
 *
 * ТЕНЕВОЙ КОРЕНЬ: у фрагмента `template.content` в дереве parse5 нет родителя; `deti` запоминает
 * хозяина фрагмента, и `predki` идут через него к хозяину и выше (раунд 2 «судью судят» блока А,
 * A2-2). ПРЕДЕЛ: браузер рисует светлых детей хозяина на месте `<slot>` теневого корня, обход идёт
 * в порядке документа — теневое содержимое на месте шаблона среди светлых детей (A2-9).
 *
 * ОБХОД — без рекурсии (явный стек): документ корпуса с вложенностью в десятки тысяч элементов
 * не роняет судью переполнением стека (раунд 1 «судью судят» блока А, A1-IZ-13).
 *
 * Координаты исходника (`sourceCodeLocationInfo`) — для сообщений судей: «строка N».
 */

import { parse } from 'parse5';

/** Пространство имён HTML. */
export const NS_HTML = 'http://www.w3.org/1999/xhtml';

/**
 * Документ по тексту HTML — дерево parse5 (адаптер по умолчанию). `skripty: true` — прочтение
 * читателя со скриптами: `<noscript>` — сырой текст, разметки в нём нет (судье головы — сравнить
 * два прочтения, раунд 1 «судью судят» блока Б, B1-G-1).
 */
export function razobrat(html, { skripty = false } = {}) {
  return parse(html, { scriptingEnabled: skripty, sourceCodeLocationInfo: true });
}

/** Узел — элемент (не текст, не комментарий, не doctype). */
export const element = (u) => Boolean(u && u.tagName);

/** Элемент HTML (не SVG и не MathML). */
export const vHtml = (u) => element(u) && u.namespaceURI === NS_HTML;

/** Имя элемента строчными (у HTML оно уже строчное; у SVG бывают прописные — `foreignObject`). */
export const imya = (u) => (u?.tagName ?? '').toLowerCase();

/** Значение атрибута или `undefined`. Сущности раскрыты разборщиком; повтор имени — первый (как браузер). */
export function atr(u, imyaAtr) {
  const a = u?.attrs?.find((x) => x.name === imyaAtr);
  return a ? a.value : undefined;
}

/** Классы элемента — множество (разделители — пробельные ASCII, как `classList`). */
export function klassy(u) {
  return new Set((atr(u, 'class') ?? '').split(/[\t\n\f\r ]+/).filter(Boolean));
}

/** Шаблон теневого корня (`<template shadowrootmode>`) — его содержимое браузер рисует. */
export const tenevoyShablon = (u) => vHtml(u) && imya(u) === 'template' && atr(u, 'shadowrootmode') !== undefined;

/** Фрагмент теневого корня → его шаблон (у фрагмента нет `parentNode`). */
const HOZYAIN = new WeakMap();

/**
 * Дети узла для обхода: у шаблона теневого корня — его содержимое, у прочего `<template>` —
 * никого (инертен), у остальных — `childNodes`.
 */
export function deti(u) {
  if (vHtml(u) && imya(u) === 'template') {
    if (!tenevoyShablon(u) || !u.content) return [];
    HOZYAIN.set(u.content, u);
    return u.content.childNodes ?? [];
  }
  return u.childNodes ?? [];
}

/**
 * Все элементы под узлом в порядке документа (сам узел не входит). Содержимое инертного
 * `<template>` не обходится — это не документ. `pred` — фильтр.
 */
export function elementy(koren, pred = () => true) {
  const out = [];
  const stek = [...deti(koren)].reverse();
  while (stek.length) {
    const u = stek.pop();
    if (!element(u)) continue;
    if (pred(u)) out.push(u);
    const d = deti(u);
    for (let i = d.length - 1; i >= 0; i--) stek.push(d[i]);
  }
  return out;
}

/** Первый элемент под узлом по фильтру или `null`. */
export function pervyi(koren, pred) {
  const stek = [...deti(koren)].reverse();
  while (stek.length) {
    const u = stek.pop();
    if (!element(u)) continue;
    if (pred(u)) return u;
    const d = deti(u);
    for (let i = d.length - 1; i >= 0; i--) stek.push(d[i]);
  }
  return null;
}

/** Предки узла снизу вверх (без самого узла, до документа); через теневой корень — к хозяину. */
export function predki(u) {
  const out = [];
  let p = u?.parentNode;
  while (p && p.nodeName !== '#document') {
    if (p.nodeName === '#document-fragment') {
      p = HOZYAIN.get(p);
      continue;
    }
    out.push(p);
    p = p.parentNode;
  }
  return out;
}

/** `<html>`, `<head>`, `<body>` документа (у frameset `<body>` нет). */
export function chasti(doc) {
  const html = (doc.childNodes ?? []).find((u) => imya(u) === 'html');
  const head = (html?.childNodes ?? []).find((u) => imya(u) === 'head');
  const body = (html?.childNodes ?? []).find((u) => imya(u) === 'body');
  return { html, head, body };
}

/** Строка исходника, где начинается узел (1…), или `null`. */
export const strokaIshodnika = (u) => u?.sourceCodeLocation?.startLine ?? null;

/**
 * Видимый текст узла для ярлыков и заголовков: все потомки-тексты подряд, без комментариев,
 * без содержимого `<script>` и `<style>` и инертного `<template>` (раунд 1, A1-IZ-11: иначе
 * `Chap<style>…</style>ters` давало ярлык со стилем). Строчные теги слов не рвут; пробелы
 * не сводятся.
 */
export function tekstVsego(u) {
  let s = '';
  const stek = [...deti(u)].reverse();
  while (stek.length) {
    const x = stek.pop();
    if (x.nodeName === '#text') s += x.value;
    else if (element(x)) {
      // Скрипт и стиль любого пространства имён (SVG тоже), как у строк извлечения (A2-8).
      if (imya(x) === 'script' || imya(x) === 'style') continue;
      const d = deti(x);
      for (let i = d.length - 1; i >= 0; i--) stek.push(d[i]);
    }
  }
  return s;
}

/** Сырой текст элемента из прямых детей-текстов (содержимое `<script>`: JSON-LD). */
export const tekstDetey = (u) => (u.childNodes ?? []).filter((x) => x.nodeName === '#text').map((x) => x.value).join('');
