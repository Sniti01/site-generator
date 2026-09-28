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
 *   - `tekst` — ровно то, что стоит в кавычках (сравнение после сведения пробелов, апострофов
 *     и пробела перед знаком препинания — след строчного тега в прочтении «через пробел»);
 *   - `ryad` — `{ id?, metka }`: строка стоит в секции `section.layer` (ряд `story-row`),
 *     у которой `id` равен `ryad.id` (если задан), а видимая метка — первый элемент с классом
 *     `t-label` внутри секции — подходит под `ryad.metka` (регулярное выражение);
 *   - `posle` — текст сразу за закрывающей кавычкой до следующей открывающей (или конца строки)
 *     подходит под выражение (глава за репликой);
 *   - `pered` — текст от предыдущей закрывающей кавычки (или начала строки) до открывающей
 *     подходит под выражение (номер главы, место и счёт перед названием).
 * И ещё — в каждом из двух прочтений строк исключение стоит в кавычках ровно один раз.
 *
 * ВИДЫ ОТКАЗА: «вне кавычек»; «через границу кавычек» (часть слов 8-граммы в кавычках, часть —
 * вне или в другой паре); «в кавычках, но не исключение сайта»; по исключению — «в кавычках N раз»,
 * «не в своём ряду», «сосед после», «сосед перед»; «исключение для страницы вне сборки».
 * Голова и атрибуты страницы исключений не знают — там любая чужая 8-грамма отказ (судит сторож).
 *
 * ПРЕДЕЛЫ (прежние, названы в шапках судей сессий 17 и 19): кавычки — только символы «“ ”» парами
 * в одной строке, кусок без пары — вне кавычек (строже); кавычки, которые рисует браузер (`<q>`,
 * CSS `content`), не видны — исключение в `<q>` получит отказ (строже); немецкая закрывающая “
 * открывает пару (строже); что текст исключения верен и его глава верна, судит сверка с документами,
 * не этот судья.
 */

import { klassy, predki, imya, atr, pervyi, tekstVsego } from '../text/html.mjs';
import { chistit } from '../text/extract.mjs';
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

/** Ряд строки: ближайшая секция `section.layer` над её узлом, её `id` и видимая метка. */
export function ryadStroki(stroka) {
  const sek = predki(stroka.uzel).find((u) => imya(u) === 'section' && klassy(u).has('layer'));
  if (!sek) return null;
  const metka = pervyi(sek, (u) => klassy(u).has('t-label'));
  return { id: atr(sek, 'id') ?? null, metka: metka ? chistit(tekstVsego(metka)) : '' };
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
        const r = ryadStroki(st);
        if (!r) otkazy.add(`${gde}: не в ряду story-row (над строкой нет section.layer)`);
        else if ((e.ryad.id !== undefined && r.id !== e.ryad.id) || !e.ryad.metka.test(r.metka)) {
          otkazy.add(`${gde}: не в своём ряду — ряд id «${r.id ?? '—'}» с меткой «${r.metka}», ждали${e.ryad.id !== undefined ? ` id «${e.ryad.id}»,` : ''} метку ${e.ryad.metka}`);
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
