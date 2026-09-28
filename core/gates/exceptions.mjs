/**
 * СУДЬЯ ИСКЛЮЧЕНИЙ СТОРОЖА 8 СЛОВ — один на все классы (П102 блок Б, бэклог 68 п. 4; вместо
 * разборов реплик `/quotes/` и названий глав гайда сессий 17 и 19).
 *
 * Чужая 8-грамма на странице — отказ, кроме одного случая: все её слова лежат внутри ОДНОЙ пары
 * типографских кавычек «“ ”», и текст в этих кавычках — исключение из данных сайта для этой
 * страницы. Классы исключений решает владелец (П102: «классы только решённые»); у второго сайта
 * это реплики `/quotes/` (П95) и полные названия глав гайда (П99 п. 2). Данные — в `gates/`
 * сайта: текст, страница, ряд и сосед; судья правил класса не знает, он сверяет данные.
 *
 * ИСКЛЮЧЕНИЕ — `{ klass, stranica, tekst, ryad, posle?, pered? }`:
 *   - `tekst` — ровно то, что стоит в кавычках (сравнение после сведения пробелов и апострофов,
 *     пробела перед знаком препинания и после «( [ “» — след строчного тега в прочтении «через
 *     пробел»);
 *   - `ryad` — `{ id?, metka }`: ближайшая над строкой HTML-секция `section.layer` (ряд `story-row`;
 *     вложенная секция — свой ряд) с `id`, равным `ryad.id` (если задан), и первой в документе
 *     с этим `id`; её метка — первый HTML-элемент `.t-label` секции (не скрипт, не стиль, не в
 *     `<noscript>`, не метка вложенной секции), текст по модели строк — подходит под `ryad.metka` (регулярное выражение,
 *     с регистром: метка прописными в исходнике — ложный отказ, громкий); метка судится за оба
 *     прочтения: `<noscript>`, который разборщик без скриптов закрыл раньше его `</noscript>`, начатый
 *     до конца метки, — метку у читателя со скриптами не определить: отказ (R4-B-K-1, ниже);
 *   - `posle` — текст сразу за закрывающей кавычкой до следующей открывающей (или конца строки)
 *     подходит под выражение (глава за репликой);
 *   - `pered` — текст от предыдущей закрывающей кавычки (или начала строки) до открывающей
 *     подходит под выражение (номер главы, место и счёт перед названием).
 * И ещё — в каждом из двух прочтений строк исключение стоит в кавычках ровно один раз.
 *
 * ВИДЫ ОТКАЗА: «вне кавычек»; «через границу кавычек» (часть слов 8-граммы в кавычках, часть —
 * вне или в другой паре); «в кавычках, но не исключение сайта»; по исключению — «в кавычках N раз»,
 * «не в ряду story-row», «не в своём ряду», «сосед после», «сосед перед»; «исключение для страницы
 * вне сборки».
 * Голова и атрибуты страницы исключений не знают — там любая чужая 8-грамма отказ (судит сторож).
 *
 * ПРЕДЕЛЫ (прежние, названы в шапках судей сессий 17 и 19): кавычки — только символы «“ ”» парами
 * в одной строке, кусок без пары — вне кавычек (строже); кавычки, которые рисует браузер (`<q>`,
 * CSS `content`), не видны — исключение в `<q>` получит отказ (строже); немецкая закрывающая “
 * открывает пару (строже); что текст исключения верен и его глава верна, судит сверка с документами,
 * не этот судья. СКРЫТОЕ (атрибут `hidden`, CSS, и содержимое `<noscript>` — его не видит читатель
 * со скриптами) извлечение считает видимым: для сторожа это строже, а здесь МЯГЧЕ — скрытые (атрибут
 * `hidden`, CSS) кавычки вокруг исключения, скрытая метка ряда, скрытый сосед засчитываются; кавычки
 * и сосед в `<noscript>` — тоже; метка ряда в `<noscript>` и её текст в `<noscript>` — нет (B2-11, B3-2)
 * (путь — только через шаблон сайта, содержание экранируется; прежний разбор глав называл так же,
 * izv-N3; раунды 1, 3 и 4 блока Б, B1-F-2 — test.todo, R4-B-Z-7).
 * `<noscript>` ПОД ДВУМЯ ПРОЧТЕНИЯМИ (раунд 4, R4-B-K-1): разборщик без скриптов закрывает `<noscript>`
 * раньше его `</noscript>`, когда блочный тег внутри закрывает внешний `<p>` (`<p><noscript><p>…`),
 * `</div>` закрывает обёртку, файл кончается; содержимое выходит из `<noscript>`, а у читателя
 * со скриптами оно — сырой текст до `</noscript>`, где тот кончается, дерево без скриптов не говорит.
 * Такой `<noscript>`, начатый до конца метки ряда (где угодно выше в документе или в самой метке), —
 * отказ «не в своём ряду» с пометкой (СТРОЖЕ: законная метка после такого `<noscript>` — ложный
 * отказ, громкий; у сайта `<noscript>` нет). ПРЕДЕЛ: `</noscript>` внутри комментария, атрибута или
 * скрипта в `<noscript>` (у читателя со скриптами сырой текст кончается на нём) — не виден: метка
 * за ним внутри `<noscript>` дерева без скриптов не засчитывается (строже), а `.t-label` в той же
 * `<noscript>`, видимая читателю со скриптами раньше засчитанной, — не видна (мягче).
 */

import { klassy, predki, imya, atr, pervyi, vHtml, elementy, strokaIshodnika } from '../text/html.mjs';
import { potok, stroki, NE_TEKST } from '../text/extract.mjs';
import { APOSTROFY } from '../text/words.mjs';

/** Пробел перед знаком препинания и после открывающей скобки — след строчного тега в прочтении «через пробел». */
export const normP = (s) => s.replace(/\s+([.,:;!?)\]”])/g, '$1').replace(/([(\[“])\s+/g, '$1');
/** Сравнение текста в кавычках с исключением: пробелы сведены, апострофы — один знак, тот же набор, что у модели слов. */
export const normN = (s) => normP(s).replace(/\s+/g, ' ').replace(APOSTROFY, "'").trim();

/** Пары «“ ”» строки: первая “ и первая ” после неё, `[начало, конец]`. */
export function paryKavychek(s) {
  const pary = [];
  for (let i = 0; ; ) {
    const a = s.indexOf('“', i);
    const b = a < 0 ? -1 : s.indexOf('”', a + 1);
    if (a < 0 || b < 0) break;
    pary.push([a, b]);
    i = b + 1;
  }
  return pary;
}

/** Секция ряда: HTML-элемент `section` с классом `layer` (SVG-элемент с тем же именем — не ряд, B1-F-1). */
const sekciyaRyada = (u) => vHtml(u) && imya(u) === 'section' && klassy(u).has('layer');

/**
 * Ряд строки: ближайшая секция `section.layer` над её узлом, её `id` и метка. Метка — первый
 * HTML-элемент `.t-label` секции, не `<script>`/`<style>`/`<template>`, не в `<noscript>` (B2-11), чья
 * ближайшая секция ряда — она сама (метка вложенной секции — метка того ряда); текст метки — по модели
 * строк, `<br>` — пробел, без текста в `<noscript>` внутри метки (раунды 1–3 «судью судят» блока Б,
 * B1-F-1, B1-F-4, B3-2). `pervyiId` — секция первая в документе с этим `id` (как `getElementById`;
 * дубль id — не свой ряд, B1-F-5). `neyasno` — строка исходника `<noscript>`, вынесенного разборщиком
 * без скриптов и начатого до конца метки (метку у читателя со скриптами не определить, R4-B-K-1), или `null`.
 */
export function ryadStroki(stroka, doc) {
  const sek = predki(stroka.uzel).find(sekciyaRyada);
  if (!sek) return null;
  // Метка в <noscript> — не метка: читатель со скриптами её не видит (раунд 2 блока Б, B2-11).
  const metka = pervyi(sek, (u) => vHtml(u) && !NE_TEKST.has(imya(u)) && klassy(u).has('t-label') && predki(u).find(sekciyaRyada) === sek && !predki(u).some((p) => imya(p) === 'noscript'));
  const id = atr(sek, 'id') ?? null;
  const konec = (metka ?? sek).sourceCodeLocation?.endOffset ?? Infinity;
  const vynesennyi = doc ? vynesennye(doc).find((n) => n.nachalo < konec) : undefined;
  return {
    id,
    pervyiId: id !== null && doc ? pervyi(doc, (u) => atr(u, 'id') === id) === sek : false,
    metka: metka ? stroki(potok(metka).filter((t) => t.tip !== 'tekst' || !predki(t.uzel).some((p) => imya(p) === 'noscript')), '').map((s) => s.tekst).join(' ') : '',
    neyasno: vynesennyi ? vynesennyi.stroka : null,
  };
}

const VYNESENNYE = new WeakMap();
/**
 * `<noscript>` документа без конца тега в дереве без скриптов — разборщик закрыл его раньше его
 * `</noscript>` и вынес содержимое наружу (R4-B-K-1): начала в исходнике и строки, по порядку документа.
 */
function vynesennye(doc) {
  if (!VYNESENNYE.has(doc)) {
    const ns = elementy(doc, (u) => vHtml(u) && imya(u) === 'noscript' && !u.sourceCodeLocation?.endTag);
    VYNESENNYE.set(doc, ns.map((u) => ({ nachalo: u.sourceCodeLocation?.startOffset ?? 0, stroka: strokaIshodnika(u) ?? '?' })));
  }
  return VYNESENNYE.get(doc);
}

/**
 * Суд исключений одной страницы.
 * `izvl` — извлечение страницы (`izvlechStranicu`); `sovpadeniya` — чужие 8-граммы строк `<main>`
 * (`{ prochtenie, n, okno: [{ w, seg }], g, rezhim, doc }`, `seg`: -1 — вне кавычек, k — в k-й паре,
 * 'mix' — имя через границу); `isklyucheniya` — исключения ЭТОЙ страницы.
 * Возвращает `{ otkazy: string[], razresheno: Map<tekst, string[]> }`.
 */
export function sudIsklyucheniy(izvl, sovpadeniya, isklyucheniya) {
  const otkazy = new Set();
  const razresheno = new Map();
  const poTekstu = new Map(isklyucheniya.map((e) => [normN(e.tekst), e]));
  const prochteniya = { vplotnuyu: izvl.vplotnuyu, cherezProbel: izvl.cherezProbel };
  for (const s of sovpadeniya) {
    const segs = new Set(s.okno.map((x) => x.seg));
    const seg = segs.size === 1 ? [...segs][0] : null;
    const stroka = prochteniya[s.prochtenie][s.n].tekst;
    if (seg !== null && seg !== -1 && seg !== 'mix') {
      const [a, b] = paryKavychek(stroka)[seg];
      const e = poTekstu.get(normN(stroka.slice(a + 1, b)));
      if (e) {
        if (!razresheno.has(e.tekst)) razresheno.set(e.tekst, []);
        razresheno.get(e.tekst).push(`${s.rezhim === 'srez' ? 'срез окончаний' : 'точно'}: «${s.g}» — ${s.doc}`);
        continue;
      }
    }
    const vid = seg === -1 ? 'вне кавычек' : seg === null || seg === 'mix' ? 'через границу кавычек' : 'в кавычках, но не исключение сайта';
    otkazy.add(`${vid} (${s.rezhim === 'srez' ? 'срез окончаний' : 'точно'}), строка «${stroka.slice(0, 90)}»: «${s.g}» — ${s.doc}`);
  }
  for (const e of isklyucheniya) {
    const n = normN(e.tekst);
    for (const [imyaP, stroki] of Object.entries(prochteniya)) {
      const vhozhdeniya = [];
      for (const st of stroki) for (const [a, b] of paryKavychek(st.tekst)) if (normN(st.tekst.slice(a + 1, b)) === n) vhozhdeniya.push({ st, a, b });
      const gde = `${e.klass} «${e.tekst.slice(0, 60)}»`;
      if (vhozhdeniya.length !== 1) otkazy.add(`${gde}: в кавычках ${vhozhdeniya.length} раз, ждали 1 (прочтение ${imyaP === 'vplotnuyu' ? 'вплотную' : 'через пробел'})`);
      for (const { st, a, b } of vhozhdeniya) {
        const r = ryadStroki(st, izvl.doc);
        if (!r) otkazy.add(`${gde}: не в ряду story-row (над строкой нет section.layer)`);
        else if (r.neyasno !== null || (e.ryad.id !== undefined && (r.id !== e.ryad.id || !r.pervyiId)) || !e.ryad.metka.test(r.metka)) {
          const dubl = e.ryad.id !== undefined && r.id === e.ryad.id && !r.pervyiId ? ' (не первый элемент документа с этим id)' : '';
          const ns = r.neyasno !== null ? ` (у читателя со скриптами метку не определить: <noscript> строки ${r.neyasno} разборщик без скриптов закрыл раньше его </noscript>)` : '';
          otkazy.add(`${gde}: не в своём ряду — ряд id «${r.id ?? '—'}»${dubl} с меткой «${r.metka}»${ns}, ждали${e.ryad.id !== undefined ? ` id «${e.ryad.id}»,` : ''} метку ${e.ryad.metka}`);
        }
        if (e.posle) {
          const sled = st.tekst.indexOf('“', b + 1);
          const okno = st.tekst.slice(b + 1, sled < 0 ? undefined : sled);
          if (!e.posle.test(okno)) otkazy.add(`${gde}: сосед после кавычки не тот — «${okno.slice(0, 50)}», ждали ${e.posle}`);
        }
        if (e.pered) {
          const otrezok = normP(st.tekst.slice(st.tekst.lastIndexOf('”', a - 1) + 1, a)).replace(/\s+/g, ' ');
          if (!e.pered.test(otrezok)) otkazy.add(`${gde}: сосед перед кавычкой не тот — «${otrezok.trim().slice(0, 70)}», ждали ${e.pered}`);
        }
      }
    }
  }
  return { otkazy: [...otkazy], razresheno };
}
