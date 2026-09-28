/**
 * РАЗБОР СТРАНИЦЫ — parse5, дерево, которое строит браузер (П71 п. 9, П102 блок А).
 *
 * Судьи сайтов до выноса (сессии 12–19) разбирали HTML регулярными выражениями, и раунды
 * «судью судят» шли в основном по краям этого разбора: пустой комментарий `<!-->`, `--!>`,
 * сырой текст `<textarea>` и `<title>` в теле, «<» перед не-буквой, `<main>` внутри значения
 * атрибута, сущности без «;», числовые ссылки &#128;–&#159; (бэклог 68 п. 3). Токенизатор
 * и построитель дерева parse5 идут по спецификации HTML — так же, как браузер, поэтому этих
 * краёв у судей на этом фундаменте нет: что браузер считает текстом, то текст и здесь.
 *
 * РЕЖИМ — БЕЗ СКРИПТОВ (`scriptingEnabled: false`): содержимое `<noscript>` разбирается
 * разметкой, как у читателя и поисковика без JS. Судья, который видит только страницу
 * со скриптами, не увидел бы в `<noscript>` ни текста, ни `<meta>`, а их прочтёт скребок.
 * `<template>` — инертный фрагмент: его содержимое лежит в `content`, не среди детей, и обход
 * ниже его не видит (браузер его не рисует).
 *
 * Координаты исходника (`sourceCodeLocationInfo`) — для сообщений судей: «строка N».
 */

import { parse } from 'parse5';

/** Документ по тексту HTML — дерево parse5 (адаптер по умолчанию). */
export function razobrat(html) {
  return parse(html, { scriptingEnabled: false, sourceCodeLocationInfo: true });
}

/** Узел — элемент (не текст, не комментарий, не doctype). */
export const element = (u) => Boolean(u && u.tagName);

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

/**
 * Все элементы под узлом в порядке документа (сам узел не входит). Содержимое `<template>`
 * не обходится — это не документ. `pred` — фильтр.
 */
export function elementy(koren, pred = () => true) {
  const out = [];
  const obhod = (u) => {
    for (const d of u.childNodes ?? []) {
      if (!element(d)) continue;
      if (pred(d)) out.push(d);
      obhod(d);
    }
  };
  obhod(koren);
  return out;
}

/** Первый элемент под узлом по фильтру или `null`. */
export function pervyi(koren, pred) {
  let naiden = null;
  const obhod = (u) => {
    for (const d of u.childNodes ?? []) {
      if (naiden) return;
      if (!element(d)) continue;
      if (pred(d)) {
        naiden = d;
        return;
      }
      obhod(d);
    }
  };
  obhod(koren);
  return naiden;
}

/** Предки узла снизу вверх (без самого узла, до документа). */
export function predki(u) {
  const out = [];
  for (let p = u?.parentNode; p && p.nodeName !== '#document'; p = p.parentNode) out.push(p);
  return out;
}

/** `<html>`, `<head>`, `<body>` документа — дерево parse5 строит их всегда. */
export function chasti(doc) {
  const html = (doc.childNodes ?? []).find((u) => imya(u) === 'html');
  const head = (html?.childNodes ?? []).find((u) => imya(u) === 'head');
  const body = (html?.childNodes ?? []).find((u) => imya(u) === 'body');
  return { html, head, body };
}

/** Строка исходника, где начинается узел (1…), или `null`. */
export const strokaIshodnika = (u) => u?.sourceCodeLocation?.startLine ?? null;

/**
 * Текст узла, как `textContent`: все потомки-тексты подряд, без комментариев и без содержимого
 * `<template>`. Для ярлыков и заголовков, где строчные теги не рвут слов; пробелы не сводятся.
 */
export function tekstVsego(u) {
  let s = '';
  const obhod = (x) => {
    for (const d of x.childNodes ?? []) {
      if (d.nodeName === '#text') s += d.value;
      else if (element(d)) obhod(d);
    }
  };
  obhod(u);
  return s;
}
