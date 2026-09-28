/**
 * СТОРОЖ 8 СЛОВ — чужих 8-словных последовательностей в текстах страниц нет (П102 блок Б; вместо
 * копии сторожа `chuzhie-p5.mjs` и среза окончаний сессий 15–19, бэклог 61 п. 11, 68 п. 1–4, 12).
 *
 * «Чужой текст не переносится» (`CLAUDE.md` сайта, §5) до выноса держали разовые копии сторожа
 * брифов в папках докладов и срез окончаний, который читали глазами. Здесь — один сторож на одном
 * фундаменте (`core/text/`): одно извлечение текста страницы, одна модель слов, один указатель
 * корпуса. Сторож — интеграция Astro на `astro:build:done`: `npm run build` падает на отказе, как
 * на гейтах ядра; выключателя нет.
 *
 * ЧТО СУДИТСЯ на каждой странице из круга сайта (`dannye.stranica(url)`):
 *   - строки видимого текста `<main>` в двух прочтениях строчных тегов — все 8-граммы по положению,
 *     в двух режимах: точно и со срезом окончаний (фраза конкурента с другим числом или `'s` —
 *     тоже чужая). Совпадение внутри кавычек исключения сайта — разрешено судьёй исключений
 *     (`exceptions.mjs`), любое другое — отказ;
 *   - голова (`<title>`, `description`, `og:title`, `og:description` — каждого ровно по одному
 *     и непустые) и текстовые атрибуты тегов `<main>` (`alt`, `title`, `aria-label` и прочие
 *     текстовые `aria-*`, `value`, `placeholder`, `label` — список `ATRIBUTY_TEKSTA` извлечения) —
 *     отдельными строками, строго: исключений там нет.
 * Строка не режется по «·» и «|» (строже сторожа брифов: у брифа это разделители ключей и ячеек).
 * Адреса `https?://…` — пробелом (не формулировка). Имена сайта (`dannye.imena`) — одним словом.
 *
 * ОТКАЗ И ГРОМКОСТЬ. Ноль страниц в круге — отказ; файла страницы нет — отказ; страница не читается (`<main>` не ровно один,
 * голова не по одному значению) — отказ; в `<main>` меньше `minSlov` слов — отказ («0 чужих»
 * о пустом извлечении не выдаётся); без корпуса или с неполным — отказ `OshibkaKorpusa`;
 * исключение сайта для страницы, которой нет в сборке, — отказ (данные отстали).
 *
 * ПРЕДЕЛЫ (названы): 8-граммы судятся внутри одной строки — фраза, разрезанная между двумя блоками
 * так, что в каждом не больше 7 её слов, не ловится (так же у прежних судей, R1-BRIFY-3, sod5-5);
 * буквы-двойники и знаки совместимости внутри слов не сводятся к латинице (предел семейства судей,
 * бэклог 68 п. 2); срез окончаний — правило сессии 15 как есть (только `'s`, `-ies`, `-es`/`-s`);
 * текст вне `<main>` и головы (шапка, крошки, подвал) и JSON-LD не судятся — их пишет не текст
 * страницы, а ядро и шаблон сайта; главная — вне круга второго сайта (данные сайта).
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { izvlechStranicu, OshibkaIzvlecheniya } from '../text/extract.mjs';
import { N_GRAM, REZHIMY, slova, imenaSlovami, bezImen, vRezhime, bezAdresov } from '../text/words.mjs';
import { ukazatelKorpusa, KESH_PO_UMOLCHANIYU } from '../text/corpus.mjs';
import { paryKavychek, sudIsklyucheniy } from './exceptions.mjs';
import { plikStrony } from './after-build.mjs';

/** Поля головы, которых ровно по одному и непустые; прочие поля головы извлечения (`twitter:*`,
 *  `og:image:alt`) необязательны, но если есть — судятся так же строго. */
export const POLYA_GOLOVY = ['title', 'description', 'og:title', 'og:description'];

/**
 * Слова строки с меткой куска кавычек: -1 — вне кавычек, k — внутри k-й пары «“ ”»; имена сайта
 * свёрнуты, метка свёрнутого имени — общая или 'mix' (имя через границу кавычек).
 */
export function slovaSMetkoy(s, imSl) {
  const pary = paryKavychek(s);
  const kuski = [];
  let pos = 0;
  pary.forEach(([a, b], k) => {
    kuski.push([s.slice(pos, a), -1]);
    kuski.push([s.slice(a + 1, b), k]);
    pos = b + 1;
  });
  kuski.push([s.slice(pos), -1]);
  const out = kuski.flatMap(([t, seg]) => slova(bezAdresov(t)).map((w) => ({ w, seg })));
  return bezImen(out, imSl).map((x) => {
    if (x.do === undefined) return x;
    const segs = new Set(out.slice(x.ot, x.do + 1).map((y) => y.seg));
    return { w: x.w, seg: segs.size === 1 ? [...segs][0] : 'mix' };
  });
}

/** Все чужие 8-граммы строки в обоих режимах: `[{ okno, g, rezhim, doc }]`. */
function vStroke(slovaStroki, uk) {
  const out = [];
  for (const rezhim of REZHIMY) {
    const ws = rezhim === 'srez' ? slovaStroki.map((x) => ({ ...x, w: vRezhime([x.w], 'srez')[0] })) : slovaStroki;
    for (let i = 0; i + N_GRAM <= ws.length; i++) {
      const okno = ws.slice(i, i + N_GRAM);
      const g = okno.map((x) => x.w).join(' ');
      const doc = uk.nayti(g, rezhim);
      if (doc) out.push({ okno, g, rezhim, doc });
    }
  }
  return out;
}

/**
 * Суд одной страницы. `uk` — указатель корпуса; `dannye` — `{ imena, isklyucheniya, minSlov }`
 * (`isklyucheniya` — все исключения сайта; судья берёт исключения этой страницы).
 * Возвращает `{ otkazy, razresheno, strok, slov }`; бросает `OshibkaIzvlecheniya`, если страница
 * не читается.
 */
export function sudStranicy(url, html, uk, dannye) {
  const imSl = imenaSlovami(dannye.imena ?? []);
  const izvl = izvlechStranicu(html);
  const otkazy = [];
  for (const pole of POLYA_GOLOVY) {
    const v = izvl.golova[pole];
    if (v.length !== 1 || !v[0]) throw new OshibkaIzvlecheniya(`${url}: в <head> ${pole} — ${v.length}${v.length === 1 ? ' пустой' : ''}, ждали ровно один непустой`);
  }
  const slov = slova(izvl.vplotnuyu.map((s) => s.tekst).join('\n')).length;
  const minSlov = dannye.minSlov ?? 100;
  if (slov < minSlov) throw new OshibkaIzvlecheniya(`${url}: в тексте <main> слов ${slov} — меньше ${minSlov}, извлечение пустое или сломано`);
  // Строки <main>: оба прочтения, одинаковые строки второго — один раз (прочтения чаще всего равны).
  const sovpadeniya = [];
  const vidennye = new Set();
  for (const prochtenie of ['vplotnuyu', 'cherezProbel']) {
    izvl[prochtenie].forEach((st, n) => {
      for (const s of vStroke(slovaSMetkoy(st.tekst, imSl), uk)) {
        const klyuch = `${st.tekst}\u0000${s.okno.map((x) => x.seg).join(',')}\u0000${s.g}\u0000${s.rezhim}`;
        if (vidennye.has(klyuch)) continue;
        vidennye.add(klyuch);
        sovpadeniya.push({ prochtenie, n, ...s });
      }
    });
  }
  const svoi = (dannye.isklyucheniya ?? []).filter((e) => e.stranica === url);
  const sud = sudIsklyucheniy(izvl, sovpadeniya, svoi);
  otkazy.push(...sud.otkazy);
  // Голова и атрибуты — строго.
  const dop = [
    ...Object.entries(izvl.golova).flatMap(([p, znacheniya]) => znacheniya.filter(Boolean).map((tekst) => ({ gde: p, tekst }))),
    ...izvl.atributy.map((a) => ({ gde: `атрибут ${a.atr}`, tekst: a.tekst })),
  ];
  const vidennyeDop = new Set();
  for (const d of dop) {
    const ws = bezImen(slova(bezAdresov(d.tekst)), imSl).map((w) => ({ w, seg: -1 }));
    for (const s of vStroke(ws, uk)) {
      const k = `${d.gde}\u0000${s.g}\u0000${s.rezhim}`;
      if (vidennyeDop.has(k)) continue;
      vidennyeDop.add(k);
      otkazy.push(`в голове или атрибуте (${d.gde}, ${s.rezhim === 'srez' ? 'срез окончаний' : 'точно'}): «${s.g}» — ${s.doc} (строка «${d.tekst.slice(0, 60)}»)`);
    }
  }
  return { otkazy, razresheno: sud.razresheno, strok: izvl.vplotnuyu.length, slov };
}

/** Адрес страницы из `pathname` хука: `/`, `/a/`, `/a/b/`. */
export const adres = (pathname) => {
  const c = String(pathname).replace(/^\/|\/$/g, '');
  return c ? `/${c}/` : '/';
};

/**
 * Суд сборки: `stranicy` — `[{ url, html }]` (уже в круге), `uk`, `dannye`. Возвращает
 * `{ otkazy: [{ url, chto }], itogi: [{ url, strok, slov, razresheno }] }`.
 */
export function sudSborki(stranicy, uk, dannye) {
  const otkazy = [];
  const itogi = [];
  if (!stranicy.length) otkazy.push({ url: '—', chto: 'страниц в круге сторожа нет — «чужих нет» о пустом множестве не выдаётся' });
  const urls = new Set(stranicy.map((s) => s.url));
  for (const e of dannye.isklyucheniya ?? []) {
    if (!urls.has(e.stranica)) otkazy.push({ url: e.stranica, chto: `исключение сайта (${e.klass} «${e.tekst.slice(0, 50)}») для страницы, которой нет в сборке или в круге сторожа — данные отстали` });
  }
  for (const s of stranicy) {
    if (s.html === null) {
      otkazy.push({ url: s.url, chto: 'файла страницы нет в сборке' });
      continue;
    }
    try {
      const r = sudStranicy(s.url, s.html, uk, dannye);
      for (const chto of r.otkazy) otkazy.push({ url: s.url, chto });
      itogi.push({ url: s.url, strok: r.strok, slov: r.slov, razresheno: r.razresheno });
    } catch (e) {
      if (!(e instanceof OshibkaIzvlecheniya)) throw e;
      otkazy.push({ url: s.url, chto: `страница не читается: ${e.message}` });
    }
  }
  return { otkazy, itogi };
}

/**
 * Интеграция Astro. `corpus` — папка корпуса от корня сайта; `dannye` — данные сайта:
 * `{ imena, isklyucheniya, stranica(url) → boolean, minSlov }`; `kesh` — папка кеша указателя
 * (по умолчанию — временная папка системы; `null` — без кеша).
 * @returns {import('astro').AstroIntegration}
 */
export default function phrases({ corpus = 'input/corpus', dannye, kesh = KESH_PO_UMOLCHANIYU }) {
  let koren = null;
  return {
    name: 'factory:phrases',
    hooks: {
      'astro:config:done': ({ config }) => {
        koren = fileURLToPath(config.root);
      },
      'astro:build:done': ({ dir, pages, logger }) => {
        const dist = fileURLToPath(dir);
        const uk = ukazatelKorpusa(join(koren, corpus), { imena: dannye.imena ?? [], kesh });
        const stranicy = [];
        for (const { pathname } of pages) {
          const url = adres(pathname);
          if (!dannye.stranica(url)) continue;
          const f = plikStrony(dist, pathname);
          if (!f || !existsSync(f)) {
            stranicy.push({ url, html: null });
            continue;
          }
          stranicy.push({ url, html: readFileSync(f, 'utf8') });
        }
        const { otkazy, itogi } = sudSborki(stranicy, uk, dannye);
        if (otkazy.length) {
          logger.error(`8 слов: отказов ${otkazy.length}`);
          throw new Error(
            `Чужие 8-словные последовательности или нечитаемые страницы — ${otkazy.length}:\n` +
              otkazy.map((o) => `  ${o.url}: ${o.chto}`).join('\n') +
              '\nЧужой текст не переносится (CLAUDE.md сайта, §5): перепишите фразу своими словами. Исключения — только решённые классы, данными сайта (gates/).'
          );
        }
        const razr = itogi.reduce((n, x) => n + x.razresheno.size, 0);
        if (uk.oshibkaKesha) logger.warn(`8 слов: ${uk.oshibkaKesha}`);
        logger.info(
          `8 слов: страниц ${itogi.length}, документов корпуса ${uk.dokumentov} (без 8-грамм — ${uk.pustyh})${uk.izKesha ? ', указатель из кеша' : ''}; чужих 8-грамм вне исключений — 0; исключений с совпадениями — ${razr}`
        );
        // Разрешённое — по исключениям: приёмка читает, какие исключения сработали и сколько 8-грамм легло в каждое.
        for (const x of itogi) {
          for (const [tekst, sovp] of x.razresheno) {
            const srez = sovp.filter((s) => s.startsWith('срез')).length;
            logger.info(`  ${x.url}: «${tekst.slice(0, 60)}» — совпадений ${sovp.length} (точно ${sovp.length - srez}, срез ${srez})`);
          }
        }
      },
    },
  };
}
