/**
 * Данные сайта для сторожа 8 слов ядра (`core/gates/phrases.mjs`) и его судьи исключений
 * (`core/gates/exceptions.mjs`) — П102 блок Б. Как `gates/assets.mjs` и `gates/contrast.mjs`:
 * механизм в ядре, ожидания — здесь.
 *
 * ИМЕНА — официальные названия игр (`CLAUDE.md` сайта, §2, «Правила текста о предмете»): имена
 * собственные, не формулировка — идут в 8-грамму одним словом. «Max Payne» без номера в список
 * не входит (это и игра, и герой) — сторож строже. Список — прежний `IMENA` сторожа брифов
 * (пачка 0, П85), без правки.
 *
 * КРУГ — страницы маршрута: все, кроме главной. У главной свой шаблон и тексты в `src/data/home.ts`,
 * её цитата главы 7 — П96 п. 4; прежние копии сторожа судили 15 страниц спроса, этот судит ещё и
 * `/404/` (её текст пишет маршрут).
 *
 * ИСКЛЮЧЕНИЯ — только классы, решённые владельцем (П102: «классы только решённые»):
 *   - реплики `/quotes/` (П95; П67 п. 2): восемь реплик, сверенных по документам корпуса буква
 *     в букву (доклад сессии 17, раздел 5), — прежний список `REPLIKI` разбора реплик сессии 17;
 *     ряд — своей игры (метка ряда начинается с игры), сразу за закрывающей кавычкой — глава
 *     («— Chapter N», «— Part I, Chapter N», «— also Chapter N»);
 *   - полные названия глав IX и XIII гайда (П99 п. 2, П100): прежний список `GLAVY` разбора глав
 *     сессии 19; ряд `id="chapters"` с меткой «Chapters», перед открывающей кавычкой — от предыдущей
 *     закрывающей (или начала строки) — ровно «<свой номер>. <место> (<части> / <улики>): », без
 *     другого римского заголовка; место — белым списком (латиница, цифры, пробел, « , . ’ ' & - – — »;
 *     буква-двойник — отказ).
 * Правила соседей — те же, что у прежних разборов (раунды «судью судят» сессий 17 и 19), записаны
 * выражениями. ПРЕДЕЛ (прежний sod5-4, раунд 1 блока Б, B1-F-3): заголовком считается только
 * прописное римское число из I V X L C с точкой — чужой номер другой записью («10.», «x.», «X –»)
 * в месте своей главы проходит.
 *
 * ПОРОГ `minSlov` — 100 на всех страницах круга; у прежних разборов реплик и глав было 300. Замену
 * перекрывает счёт «в кавычках ровно один раз»: пустое извлечение даёт «0 раз» — отказ.
 */

/** Официальные названия игр — одним словом в 8-грамме. */
export const IMENA = ['Max Payne 2: The Fall of Max Payne', 'Max Payne 1 & 2 Remake', 'Max Payne Mobile', 'Max Payne 3', 'Max Payne (2008)'];

/** Круг сторожа: страницы маршрута (всё, кроме главной). */
export const stranica = (url) => url !== '/';

/** Меньше слов в `<main>` — извлечение пустое или сломано. */
export const minSlov = 100;

/** Сразу за репликой — глава. */
const GLAVA_POSLE = /^\s*[—–]\s*(also\s+)?(Part I,\s*)?Chapter \d+\b/;

/** @type {[string, RegExp][]} */
const REPLIKI = [
  ['My cover had been blown. The door slammed shut behind me. And then I was dodging bullets like raindrops.', /^Max Payne · 2001/],
  ['Karaoke was never my strong point', /^Max Payne · 2001/],
  ['Thank you.', /^Max Payne · 2001/],
  ['In a situation like mine, you can only think in metaphors.', /^Max Payne 2 · 2003/],
  ['Her fashion sense didn’t leave a whole lot of room for imagination, let alone food', /^Max Payne 3 · 2012/],
  ['This place was like Baghdad and G-strings', /^Max Payne 3 · 2012/],
  ['I stood out in this place like a streetwalker in a monastery', /^Max Payne 3 · 2012/],
  ['But the airport is the only place a fat gringo might blend in. Well, there or a sex club.', /^Max Payne 3 · 2012/],
];

/**
 * Перед названием главы: «<номер>. <место> (<части> / <улики>): » — свой номер первым, другого
 * римского заголовка (римское число с точкой, вокруг которого нет букв и цифр) в месте нет,
 * место — латиница, цифры, пробел и « , . ’ ' & - – — », счёт — «(6 / 3):» или «(6/3):».
 */
const nomerGlavy = (nomer) =>
  new RegExp(`^\\s*${nomer}\\.\\s(?:(?!(?<![\\p{L}\\p{N}])[IVXLC]+\\.(?![\\p{L}\\p{N}]))[A-Za-z0-9 ,.’'&\\-–—])*\\(\\d+\\s*/\\s*\\d+\\):\\s*$`, 'u');

/** @type {[string, string][]} */
const GLAVY = [
  ['Here I Was Again, Halfway Down the World.', 'IX'],
  ['A Fat Bald Dude with a Bad Temper.', 'XIII'],
];

/** Исключения сторожа 8 слов: `{ klass, stranica, tekst, ryad: { id?, metka }, posle?, pered? }`. */
export const ISKLYUCHENIYA = [
  ...REPLIKI.map(([tekst, metka]) => ({ klass: 'реплика', stranica: '/quotes/', tekst, ryad: { metka }, posle: GLAVA_POSLE })),
  ...GLAVY.map(([tekst, nomer]) => ({
    klass: 'название главы',
    stranica: '/max-payne-3/guide/',
    tekst,
    ryad: { id: 'chapters', metka: /^chapters$/i },
    pered: nomerGlavy(nomer),
  })),
];

/** Всё, что ждёт сторож ядра. */
export const dannye = { imena: IMENA, isklyucheniya: ISKLYUCHENIYA, stranica, minSlov };
