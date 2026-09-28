/**
 * Проба схемы и маршрута на копии сайта (П102 блок В): копия во временной папке вне репозитория
 * (`tools/kopiya.mjs`), правка файлов копии, сборка копии (`astro build` со сторожами сборки),
 * суд по коду и выводу сборки и по собранному HTML; копия удаляется в любом исходе.
 *
 * Прежние пробы (`tools/proby-tresci.mjs` пачки 0 и разовые пробы пачек 1, 2, 4) правили файлы
 * сайта НА МЕСТЕ и держались на стендах — страницах и блоках, которые пачки потом делали настоящими
 * (N19, P3 — гайд, P4 — `/story/`, P6 — плановая `/privacy/`, N14 — блок ядра без ветви маршрута,
 * Q8, Q9 — `/pc/` без героя). На копии проба ставит свои условия сама: своя страница в структуре
 * копии (P6), свой блок в словаре ядра копии (N14, `sYadrom`), коридор, которого текст не достаёт
 * (N19); Ctrl+C не оставляет подмен в репозитории. ОПОРЫ, которые остаются: `/404/` как страница правок
 * (`src/content/tresc/404.md`: текст о самом сайте, форма — ряд и «связанные»; проба, которой нужна
 * другая форма, правит структуру копии) и буквальные строки настоящих файлов содержания в пробах пачек
 * 1, 2, 4 (`href: /mods/` у `pc.md`, `art: mp2-k01` у `media.md`, кнопки и `art`/`artFocus` у
 * `max-payne-3.md`, `role: Written by` и `author: 7th Serpent` подписи `max-payne-2.md`); законная правка
 * такой строки роняет пробу громко — «встречается 0 раз», не пропуском; дата подписи `max-payne-2.md`
 * меняется по замыслу, её пробы берут из файла копии (раунды 1–3 «судью судят» блока В, V1-11, V2-11,
 * V3-11). Правка фронтматтера — только заменой строки (`pravit`): запись
 * разобранного YAML обратно меняла бы типы значений (дата без кавычек — Date у загрузчика).
 */

import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sdelatKopiyu, udalitKopiyu, sobrat, prochest, zapisat } from '../kopiya.mjs';

/** Точная замена в тексте с проверкой единственного вхождения — проба не промахивается молча. */
export function zamena(tekst, iz, na) {
  const n = tekst.split(iz).length - 1;
  if (n !== 1) throw new Error(`проба: «${iz.slice(0, 60)}» встречается ${n} раз, а нужен один`);
  return tekst.replace(iz, () => na);
}

/** Правка файла копии заменой. */
export const pravit = (k, put, iz, na) => zapisat(k, put, zamena(prochest(k, put), iz, na));

/** Правка структуры копии: `pravki` — `{ адрес: (страница) => void }`. */
export function struktura(k, pravki) {
  const o = JSON.parse(prochest(k, 'structure/structure.json'));
  for (const [url, f] of Object.entries(pravki)) {
    const p = o.pages.find((x) => x.url === url);
    if (!p) throw new Error(`проба: страницы ${url} нет в структуре`);
    f(p, o);
  }
  zapisat(k, 'structure/structure.json', JSON.stringify(o, null, 1) + '\n');
}

/** Вхождения блоков для `blocks[]`: `'story-row#rol'`. */
export const bloki = (...imena) =>
  imena.map((b) => {
    const [block, role] = b.split('#');
    return { block, source: 'manual', confidence: 'high', ...(role ? { role } : {}) };
  });

/** Слова-наполнитель: страница пробы проходит сторож 8 слов (не меньше 100 слов, чужих 8-грамм нет). */
export const NAPOLNITEL = Array.from({ length: 110 }, (_, i) => `probaslovo${i}`).join(' ');

/** Минимальный файл содержания страницы пробы (ряд с наполнителем). */
export const vremennyi = (url, dop = []) =>
  ['---', `url: ${url}`, 'rows:', '  - id: proba-ryad', '    year: Proba', '    title: Proba row', '    meta: Proba meta', '    body:', `      - ${NAPOLNITEL}`, ...dop, '---', ''].join('\n');

/** Звенья BreadcrumbList собранной страницы. */
export const zvenyev = (h) => (h.match(/"@type":"ListItem"/g) ?? []).length;

/**
 * Проба: `izmenit(k)` правит копию; `kod` — 'не 0' или 0; `zhdem` — строки, которые обязаны быть
 * в выводе сборки; `html` — `{ адрес: (html) => null | замечание }` для положительных; `sYadrom` —
 * ядро копией (проба правит ядро копии: `zapisatVYadro`).
 */
export function proba({ izmenit = () => {}, kod, zhdem = [], html = {}, sYadrom = false }) {
  const k = sdelatKopiyu(mkdtempSync(join(tmpdir(), 'proba-')), { sYadrom });
  try {
    izmenit(k);
    const r = sobrat(k);
    const vyderzhka = () => r.vyvod.split('\n').filter((l) => /Error|error|Ошиб|Адрес|Поле|Вхожд|Ряды|Блок|blocks\[\]|Два файла|Тип|пропуск|Текст под|Długość|Unrecognized|Too small|Invalid|Кадр|Kotwice|schema/.test(l)).slice(-8).join('\n');
    if (kod === 0) assert.equal(r.kod, 0, `сборка упала (код ${r.kod}), а ждали прохода:\n${vyderzhka()}`);
    else assert.notEqual(r.kod, 0, 'сборка прошла, а ждали отказа');
    const net = zhdem.filter((s) => !r.vyvod.includes(s));
    assert.deepEqual(net, [], `нет в выводе: ${net.map((s) => `«${s}»`).join(', ')}\n${vyderzhka()}`);
    for (const [url, proverka] of Object.entries(html)) {
      const f = join(k.sayt, 'dist', url.slice(1), 'index.html');
      assert.ok(existsSync(f), `${url}: страница не собрана`);
      const z = proverka(readFileSync(f, 'utf8'));
      assert.equal(z, null, `${url}: ${z}`);
    }
  } finally {
    udalitKopiyu(k);
  }
}
