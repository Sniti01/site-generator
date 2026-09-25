// Судья собранной страницы: «знак на сайте = одобренный эскиз A» и всё, что знак
// и фавикон значат для браузера (сессия 11, П83; «судью судят», раунды 1–3:
// R1-VNEDRENIE-1, R2-RISOVKA-1…7, R2-SVERKA-2, -4, -7, R2-POLNOTA-2…5, -10, -12,
// R3-BRAUZER-1…8, -12, -14, R3-POLNOTA-2…4). Ручной судья: в сборку, гейты
// и accept не входит (включить — решение владельца, бэклог 60 п. 3).
//
//   node wiernosc.mjs [адрес]             — судит (по умолчанию прод-превью
//                                           http://localhost:4331/), пишет
//                                           ../zamery/wiernosc.json; exit 1 при отказе
//   node wiernosc.mjs [адрес] --selftest  — те же проверки в малом наборе окон
//                                           на чистой странице, на мутациях в странице
//                                           (CSS и DOM сразу после загрузки) и на своём
//                                           сервере с подменой (лист стилей со статусом
//                                           203, шрифт 404): чистая — ноль отказов,
//                                           каждая мутация — свой отказ;
//                                           пишет ../zamery/wiernosc-selftest.json
//
// ЧТО СУДИТ (каждый пункт — отказ):
//  0. Эскиз — тот, что одобрил владелец: sha256 файлов voprosy/A-semerka-trassa/
//     (znak.html, favicon.svg, favicon-16.svg) равны закреплённым ниже.
//  1. Сборка — та, что лежит в dist/: каждый ответ сервера со своего адреса
//     (HTML, CSS, шрифты, картинки, иконки) во всех окнах — статус 200 и побайтно
//     равен файлу dist/ по тому же пути (статус и байты — разные виды отказа);
//     сбой загрузки — отказ; иконки dist/ равны public/.
//  2. Строение знака: на странице ровно два svg.znak — прямой потомок .hdr__brand
//     и прямой потомок .ft__brand; атрибуты width, height, viewBox — как у эскиза;
//     дети — ровно три polygon и два path, points и d по порядку равны эскизу;
//     отрисованный размер 138 × 38. Надпись «TH» узнаётся по d, а не по классу.
//  3. Краска: вычисленная заливка каждой части в шапке и подвале равна литералу
//     той же роли в одобренной иконке эскиза (перекладина и надписи — снег,
//     трассер и ромб — фонарь); обводка «TH» — той же краской 0.3px при
//     плотности до 1,5 и нет выше; у «SERPENT» и у многоугольников обводки нет.
//     Смена токена краски — тоже отказ, намеренно: знак разойдётся с одобренным
//     эскизом, новый эскиз и приёмка — решение владельца.
//  4. Смешивание, рисование за коробкой и движение: у знака и всех его предков
//     mix-blend-mode — normal, backdrop-filter — только у .hdr (размытие шапки ядра);
//     у знака и его частей нет filter, box-shadow, -webkit-box-reflect и outline;
//     у знака, его частей и предков нет CSS-анимаций — после загрузки и в каждом
//     состоянии (наведение, фокус, ящик), до того как снимок их гасит, — и рамка знака
//     не меняется сама за 500 мс при живых анимациях («Движения нет»).
//  5. Пиксели знака — два сравнения в каждом состоянии.
//     (а) Рисунок: знак страницы против эскиза, нарисованного на отдельной пустой
//     странице (краски — литералы иконки эскиза, не токены сайта) с той же
//     цепочкой смещений (у липкого предка — от него, иначе — от начала документа
//     с той же прокруткой). Со страницы убирается всё, кроме знака и его предков,
//     у предков — фон, рамка, тень и кольцо; прозрачность, фильтры, трансформации
//     предков остаются. Ждём 0 различий.
//     (б) Наложение: страница как есть (зерно снято) против той же страницы, где
//     скрыт только svg.znak, с эскизом поверх (альфа эскиза, сложение «поверх»).
//     Ловит то, что (а) прячет: перекрытие знака элементом, псевдоэлементом предка
//     или содержимым над шапкой, смешивание со страницей. Допуск — округление
//     сложения: 3 уровня из 255 на канал; изменения мельче 3 уровней наложение
//     не видит. Рамка (а) — коробка знака плюс 2 px; рамка (б) — вся полоса шапки
//     во всю ширину окна или знак подвала ± 60 px (что знак рисует за коробкой).
//     Устойчивый снимок — три одинаковых подряд (до восьми), иначе «растр
//     нестабилен» — отказ, а не проход. Перед (б) — в пяти точках (центр каждой
//     части) elementFromPoint попадает в сам знак (своё pointer-events: none
//     у знака на время проверки снимается — это не перекрытие). В окнах 1440 и 390
//     при DPR 1 шапка судится (б) и точками ещё и на всей прокрутке страницы шагом
//     в полвысоты окна и в крайней точке (в --selftest — только 1440, шагом в высоту).
//     Окна: 1440 и 390 при DPR 1, 1,25, 1,5, 1,51, 1,75, 2, 3; с полосой прокрутки
//     Windows — 1440 и 2194 (ширина экрана владельца, 3840 px при 175 %) при 1,75;
//     2194 при 1,75 и без полосы. Состояния: вверху, при прокрутке, наведение
//     на ссылку знака, фокус с клавиатуры (проверяется :focus-visible), ящик меню
//     открыт (где бургер показан; проверяется aria-expanded и hidden), подвал.
//  6. Принудительные цвета (эмуляция; светлая и тёмная схема; DPR 1, 2, 3): заливка
//     всех частей и обводка «TH» — системный CanvasText, пиксели (а) — эскиз одной
//     краской CanvasText (отступление от эскиза A — вопрос владельцу в докладе).
//  7. <head> и ссылки: ссылок-иконок (rel icon, shortcut, apple-touch-icon[-precomposed],
//     mask-icon, manifest) ровно шесть, в <head>, по порядку и с точным набором
//     атрибутов; <base> нет; адрес каждой — свой сервер; и любой загружаемый link
//     (stylesheet, preload, prefetch, preconnect, dns-prefetch, modulepreload,
//     manifest, иконки) и script[src] документа — на свой сервер (canonical
//     и alternate не загружаются и не судятся).
//     Ссылка знака ведёт на главную своего сервера.
//  8. Доступность (дерево Chromium через CDP, 1440 и 390, на 390 и с открытым
//     ящиком): ссылка знака — link с именем «7th Serpent — 7thserpent.com, home»
//     без доступных потомков; svg шапки в дереве нет; svg подвала — image с именем
//     «7th Serpent — 7thserpent.com» без потомков; других узлов с «7th Serpent»
//     в имени нет; видимое «7TH SERPENT» входит в имя (WCAG 2.5.3).
//  9. Запросы: прокрутка всей страницы на 1440 и 390 — ни одного запроса не на свой
//     сервер (data: и blob: не запросы).
// 10. Иконки против эскиза: favicon.svg побайтно равен эскизу; PNG 16, 32, 180, 192
//     и обе записи favicon.ico (ровно две: 16 и 32) по пикселям равны эскизу,
//     растрированному тем же способом, что tools/znak.mjs (sharp, librsvg).
//
// ПРЕДЕЛЫ (названы): один движок — Chromium из кеша Playwright (путь и версия —
// в выгрузке, пути — в sborka.mjs). Плотности — только названные семь: «(а) = 0»
// и допуск (б) 3 замерены на них; при других (замерено: 2,5) судья даёт ложный
// отказ на нетронутой сборке, а 0,9, 1,1, 1,925 и 2,625 не снимались вовсе
// (раунд 4, R4-BRAUZER-7, R4-POLNOTA-4). Эмуляция принудительных цветов — не настоящая
// контрастная тема Windows; в принудительных цветах судятся только «вверху»
// и подвал, без наведения, фокуса и ящика. Цветовая схема окон — светлая
// (умолчание Playwright), prefers-contrast и prefers-reduced-motion не задаются.
// Headless: вкладку и запрос фавикона браузером не видит — это vkladka-dowod.mjs;
// растр окна браузера с интерфейсом (headless: false) — только число в материалах
// (okno-plotnosti.png). Положение знака в шапке и подвале не судится: эскиз
// ставится туда, где оказался знак; положение видят кадры эталона при DPR 1.
// Фон, рамка, тень и кольцо фокуса самой ссылки знака и других предков в (а) сняты,
// в (б) они есть и в ожидаемом, и в снятом — не судит их никто; кольцо фокуса
// показано глазами (fokus-1440.png). Перекрытие прозрачным элементом с
// pointer-events: none пикселями не видно и точками не ловится (зерно страницы
// такое по замыслу). Запросы и <head> судятся около трёх секунд после загрузки,
// с прокруткой, без действий пользователя; WebSocket не видны. Эскиз и реализация
// идут от одних контуров glify.mjs — судья не независим от способа построения букв
// (кернинга нет у обоих). PNG иконок и эскиз растрирует одна библиотека — судится
// равенство рисунка, а не качество растра. Мутации самопроверки — правки страницы
// после загрузки, а не пересборка: они судят чувствительность судьи, а не путь сборки.
import { createRequire } from 'node:module';
import http from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { PW, CHROME, REPO, SITE, RAPORT, ZAMERY, sha, pochodzenie } from './sborka.mjs';

const { chromium } = createRequire(PW)('playwright-core');
const sharp = createRequire(join(REPO, 'package.json'))('sharp');

const ARGI = process.argv.slice(2);
const SELFTEST = ARGI.includes('--selftest');
const URL_ = ARGI.find((a) => !a.startsWith('--')) ?? 'http://localhost:4331/';

// ── 0. Эскиз ─────────────────────────────────────────────────────────────
const ESKIZ = join(RAPORT, 'voprosy/A-semerka-trassa');
const PINY = {
  'znak.html': 'ac61b3942c350871746ecbdae9e584e14ccf17ec70ea92bba0bbf46db6de9271',
  'favicon.svg': '9cf2fa94618ea0099bd4bf392a79a83ec43b1c78a0f8ce19b04a0f7dfa4de516',
  'favicon-16.svg': '5f891536dbb3b68d5de3704342b33bcff0fc2623df6f5cce68893e0efc4f648b',
};
const eskiz = {};
for (const [f, h] of Object.entries(PINY)) {
  const b = readFileSync(join(ESKIZ, f));
  if (sha(b) !== h) {
    console.error(`wiernosc: ОТКАЗ — эскиз ${f} не тот, что одобрил владелец: sha256 ${sha(b)}, закреплён ${h}`);
    process.exit(1);
  }
  eskiz[f] = b;
}
const ZNAK_HTML = eskiz['znak.html'].toString('utf8');
const E = {
  svg: Object.fromEntries(['width', 'height', 'viewBox'].map((a) => [a, new RegExp(`<svg [^>]*\\b${a}="([^"]+)"`).exec(ZNAK_HTML)[1]])),
  polygony: [...ZNAK_HTML.matchAll(/<polygon class="([^"]+)" points="([^"]+)"\/>/g)].map((m) => ({ rola: m[1] === 'zk1-snieg' ? 'ink' : 'accent', points: m[2] })),
  napisy: [...ZNAK_HTML.matchAll(/<path class="([^"]+)" d="([^"]+)"\/>/g)].map((m, i) => ({ th: m[1].split(' ').includes('zk1-th'), d: m[2], imie: i === 0 ? 'TH' : 'SERPENT' })),
};
const LIT = (() => {
  const f = [...eskiz['favicon.svg'].toString().matchAll(/fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]);
  return { bg: f[0], ink: f[1], accent: f[2] };
})();
if (E.polygony.length !== 3 || E.napisy.length !== 2 || E.napisy.filter((n) => n.th).length !== 1 || !E.napisy[0].th || !LIT.accent) {
  console.error('wiernosc: ОТКАЗ — эскиз не разобран (ждали 3 polygon, 2 path, «TH» первым, три краски иконки)');
  process.exit(1);
}

const IMIE_LINKU = '7th Serpent — 7thserpent.com, home';
const IMIE_PODVALU = '7th Serpent — 7thserpent.com';
const LINKI = [
  { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'icon', href: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
  { rel: 'icon', href: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
  { rel: 'icon', href: '/icon-192.png', type: 'image/png', sizes: '192x192' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
];
// Допуск наложения — округление сложения 8-битной альфы «поверх». Замерено на нетронутой
// сборке: максимум 3 уровня на краях во всех 23 окнах; допуск равен замеренному
// максимуму, запаса нет (раунд 4, R4-PROZA-5).
const TOL_NAKLADKI = 3;

// (а) Со страницы убирается всё, кроме знака и его предков; у предков — фон, рамка, тень,
// кольцо. filter: none у скрытых — не лишнее: visibility: hidden не гасит фильтр
// feTurbulence зерна ядра (Grain.astro), шум остаётся в кадре (замерено: альфа 10–13).
const SKRYJ = `*:not(:has(svg.znak)):not(svg.znak):not(svg.znak *), *::before, *::after { visibility: hidden !important; filter: none !important; backdrop-filter: none !important; }
:has(svg.znak) { background: transparent !important; border-color: transparent !important; box-shadow: none !important; outline-color: transparent !important; }`;
const BEZ_ZERNA = '.grain { display: none !important; }';
const BEZ_ZNAKA = 'svg.znak { visibility: hidden !important; }';
// Эскиз ставится с той же цепочкой смещений, что знак страницы: фаза растра при дробной
// плотности зависит от того, от какого начала отсчитано смещение (замерено: эскиз
// в фиксированном блоке в точке знака — 3361–7918 субпикселей при 1,25–1,75 на
// нетронутой сборке; от начала окна у шапки и от начала документа с той же прокруткой
// у подвала — 0 во всех 42 сочетаниях окна, плотности и состояния).
const refHtml = (ink, accent) => `<!doctype html><html><head><meta charset="utf-8"><style>
:root { --ink: ${ink}; --accent: ${accent}; }
html, body { margin: 0; background: transparent; }
#r { line-height: 0; }
#r svg { display: block; }
</style><style id="miejsce"></style></head><body><div id="r">${ZNAK_HTML}</div></body></html>`;
const miejsce = (m) => (m.tryb === 'fixed'
  ? `#r { position: fixed; left: ${m.fx}px; top: ${m.fy}px; padding-left: ${m.dx}px; padding-top: ${m.dy}px; }`
  : `body { padding-left: ${m.docX}px; padding-top: ${m.docY}px; min-height: ${m.docY + 4000}px; }`);

const hex = (c) => {
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(c ?? '');
  if (!m || (m[4] !== undefined && m[4] !== '1')) return c;
  return '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('');
};

// ── Наборы окон ──────────────────────────────────────────────────────────
// Окно: { w, h?, dpr, forced?, pasek? } — pasek: полоса прокрутки Windows (без --hide-scrollbars).
const vp = (o) => ({ width: o.w, height: o.h ?? (o.w > 500 ? 900 : 844) });
const PLOTNOSTI = [1, 1.25, 1.5, 1.51, 1.75, 2, 3];
const PELNY = {
  piksele: [
    ...[1440, 390].flatMap((w) => PLOTNOSTI.map((dpr) => ({ w, dpr, ...(dpr === 1 ? { prokrutka: 0.5 } : {}) }))),
    { w: 1440, dpr: 1.75, pasek: true }, { w: 2194, h: 1100, dpr: 1.75, pasek: true }, { w: 2194, h: 1100, dpr: 1.75 },
    { w: 1440, dpr: 1, forced: 'light' }, { w: 1440, dpr: 1, forced: 'dark' }, { w: 1440, dpr: 2, forced: 'light' },
    { w: 1440, dpr: 2, forced: 'dark' }, { w: 390, dpr: 1, forced: 'light' }, { w: 390, dpr: 3, forced: 'dark' },
  ],
  ax: [1440, 390],
  przewin: [1440, 390],
};
const KROTKI = {
  piksele: [{ w: 1440, dpr: 1, prokrutka: 1 }, { w: 1440, dpr: 1.75 }, { w: 1440, dpr: 2 }, { w: 390, dpr: 1 }, { w: 1440, dpr: 1.75, pasek: true }, { w: 1440, dpr: 1, forced: 'light' }, { w: 390, dpr: 1, forced: 'dark' }],
  ax: [1440, 390],
  przewin: [1440],
};

// ── Мутации самопроверки (правки страницы сразу после загрузки) ─────────
// Функции dom уходят в страницу текстом — без замыканий, всё внутри.
const MUTACJE = [
  { nazwa: 'знак шапки 0,8', css: '.hdr__brand { opacity: .8 }', zhdem: 'пиксели: шапка, вверху' },
  { nazwa: 'свечение знака', css: '.hdr__brand svg { filter: drop-shadow(0 0 2px #eca84a) }', zhdem: 'пиксели: шапка, вверху' },
  { nazwa: 'знак 0,98', css: '.hdr__brand svg { transform: scale(.98) }', zhdem: 'размер' },
  { nazwa: 'фонарь токеном другой', css: ':root { --accent: #ff4400 }', zhdem: 'краска' },
  { nazwa: 'знак подвала 0,5', css: '.ft__brand svg { opacity: .5 }', zhdem: 'пиксели: подвал' },
  { nazwa: 'знак спрятан', css: '.hdr__brand svg { visibility: hidden }', zhdem: 'видимость' },
  { nazwa: 'обводка «TH» снята', css: '.znak .znak__obwodka { stroke: none !important }', zhdem: 'обводка' },
  { nazwa: 'обводка у «SERPENT»', dom: () => { for (const s of document.querySelectorAll('svg.znak')) s.querySelectorAll('path')[1].classList.add('znak__obwodka'); }, zhdem: 'обводка' },
  { nazwa: 'обводка «TH» в принудительных цветах снята', css: '@media (forced-colors: active) { .znak .znak__obwodka { stroke: none !important } }', zhdem: 'принудительные цвета' },
  { nazwa: 'заливка в принудительных цветах — токен', css: '@media (forced-colors: active) { .znak polygon, .znak path { fill: var(--farba) !important } }', zhdem: 'принудительные цвета' },
  { nazwa: 'принудительные цвета, тёмная схема: заливка красная', css: '@media (forced-colors: active) and (prefers-color-scheme: dark) { .znak polygon, .znak path { fill: red !important } }', zhdem: 'принудительные цвета' },
  { nazwa: 'плотность от 2: знак 0,9', css: '@media (min-resolution: 2dppx) { .hdr__brand svg { opacity: .9 } }', zhdem: 'пиксели: шапка, вверху' },
  { nazwa: 'знака в подвале нет', dom: () => document.querySelector('.ft__brand svg.znak')?.remove(), zhdem: 'строение' },
  { nazwa: 'контур «SERPENT» правлен', dom: () => { for (const s of document.querySelectorAll('svg.znak')) { const p = s.querySelectorAll('path')[1]; p.setAttribute('d', p.getAttribute('d').replace('M30.31', 'M30.41')); } }, zhdem: 'строение' },
  { nazwa: 'чёрный блок поверх знака', dom: () => { const r = document.querySelector('.hdr__brand svg').getBoundingClientRect(); const d = document.createElement('div'); d.style.cssText = `position:fixed;left:${r.x}px;top:${r.y}px;width:${r.width}px;height:${r.height}px;background:#000;z-index:2147483647`; document.body.append(d); }, zhdem: ['перекрыт', 'наложение: шапка'] },
  { nazwa: 'блок поверх имени, перекладина открыта', dom: () => { const r = document.querySelector('.hdr__brand svg path').getBoundingClientRect(); const d = document.createElement('div'); d.style.cssText = `position:fixed;left:${r.x}px;top:${r.y}px;width:120px;height:40px;background:#090c11;z-index:2147483647`; document.body.append(d); }, zhdem: ['перекрыт', 'наложение: шапка'] },
  { nazwa: 'псевдоэлемент ссылки поверх знака', css: '.hdr__brand { position: relative } .hdr__brand::after { content: ""; position: absolute; inset: 0; background: #e5eaee }', zhdem: ['перекрыт', 'наложение: шапка'] },
  { nazwa: 'псевдоэлемент поверх знака от плотности 1,25', css: '@media (min-resolution: 1.25dppx) { .hdr__brand { position: relative } .hdr__brand::after { content: ""; position: absolute; inset: 0; background: #e5eaee } }', zhdem: ['перекрыт', 'наложение: шапка'] },
  { nazwa: 'содержимое над шапкой при прокрутке', css: 'main { position: relative; z-index: 60 }', zhdem: ['перекрыт', 'наложение: шапка, при прокрутке'] },
  { nazwa: 'смешивание ссылки знака', css: '.hdr__brand { mix-blend-mode: screen }', zhdem: ['смешивание', 'наложение: шапка'] },
  { nazwa: 'backdrop-filter у ссылки знака', css: '.hdr__brand { backdrop-filter: blur(3px) }', zhdem: 'смешивание' },
  { nazwa: 'бесконечная анимация знака', css: '@keyframes mig7ths { 50% { opacity: .5 } } .hdr__brand svg { animation: mig7ths 2s infinite }', zhdem: 'движение' },
  { nazwa: 'наведение гасит знак', css: '.hdr__brand:hover svg { opacity: .7 }', zhdem: 'пиксели: шапка, наведение' },
  { nazwa: 'фокус гасит знак', css: '.hdr__brand:focus-visible svg { opacity: .7 }', zhdem: 'пиксели: шапка, фокус' },
  { nazwa: 'ящик гасит знак', css: ".hdr:has(.hdr__burger[aria-expanded='true']) .hdr__brand svg { opacity: .7 }", zhdem: 'пиксели: шапка, ящик открыт' },
  { nazwa: 'внешняя иконка', dom: () => { const l = document.createElement('link'); l.rel = 'icon'; l.href = 'https://example.invalid/x.png'; document.head.append(l); }, zhdem: 'голова' },
  { nazwa: '<base> в голове', dom: () => { const b = document.createElement('base'); b.href = 'https://example.invalid/'; document.head.prepend(b); }, zhdem: 'голова' },
  { nazwa: 'media=print у SVG-иконки', dom: () => document.querySelector('link[href="/favicon.svg"]').setAttribute('media', 'print'), zhdem: 'голова' },
  { nazwa: 'внешний preconnect', dom: () => { const l = document.createElement('link'); l.rel = 'preconnect'; l.href = 'https://example.invalid'; document.head.append(l); }, zhdem: 'голова' },
  { nazwa: 'подпись ссылки знака', dom: () => document.querySelector('.hdr__brand').setAttribute('aria-label', 'Home'), zhdem: 'доступность' },
  { nazwa: 'подпись подвала пропала', dom: () => { const s = document.querySelector('.ft__brand svg.znak'); s.removeAttribute('aria-label'); s.removeAttribute('role'); s.setAttribute('aria-hidden', 'true'); }, zhdem: 'доступность' },
  { nazwa: 'внешний запрос', dom: () => { new Image().src = 'https://example.invalid/p.gif'; }, zhdem: 'запросы' },
  // Раунд 4: изолирующая проба наложения — точки проходят сквозь блок (pointer-events: none),
  // рисунок (а) его прячет; ловит только (б), и каждая строка отказа — «наложение» (R4-POLNOTA-2).
  { nazwa: 'непрозрачный блок поверх знака, сквозь который проходят точки', dom: () => { const r = document.querySelector('.hdr__brand svg').getBoundingClientRect(); const d = document.createElement('div'); d.style.cssText = `position:fixed;left:${r.x}px;top:${r.y}px;width:${r.width}px;height:${r.height}px;background:#000;pointer-events:none;z-index:2147483647`; document.body.append(d); }, zhdem: ['наложение'], tolko: true },
  { nazwa: 'тень у знака за коробкой', css: '.hdr__brand svg { box-shadow: 0 0 0 6px #eca84a }', zhdem: ['за коробкой', 'наложение'] },
  { nazwa: 'анимация только по наведению', css: '@keyframes h7ths { 50% { opacity: .4 } } .hdr__brand:hover svg { animation: h7ths 1s infinite }', zhdem: ['движение'] },
  { nazwa: 'pointer-events: none у знака — не перекрытие', css: '.hdr__brand svg { pointer-events: none }', zhdem: null },
  { nazwa: 'призыв над шапкой при прокрутке', css: '.cta { position: relative; z-index: 60 }', zhdem: ['наложение: шапка, при прокрутке'], tolko: true },
];
// Подмены своего сервера над dist/ (проверка «сборка = dist/»).
const PODMENY = [
  { nazwa: 'лист стилей со статусом 203 и чужим байтом', odpowiedz: (p, b) => (p.endsWith('.css') ? { status: 203, b: Buffer.concat([b, Buffer.from('/*x*/')]) } : null), zhdem: 'сборка' },
  { nazwa: 'шрифт 404', odpowiedz: (p) => (/\.woff2?$/.test(p) ? { status: 404, b: Buffer.alloc(0) } : null), zhdem: 'сборка' },
  // Раунд 4: каждая подмена — своим видом отказа (R4-BRAUZER-6).
  { nazwa: 'лист стилей со статусом 203 теми же байтами', odpowiedz: (p, b) => (p.endsWith('.css') ? { status: 203, b } : null), zhdem: ['ждали 200'], tolko: true },
  { nazwa: 'шрифт со статусом 200 чужими байтами', odpowiedz: (p, b) => (p.endsWith('.woff2') ? { status: 200, b: Buffer.concat([b, Buffer.from('x')]) } : null), zhdem: ['байты не равны dist/'], tolko: true },
  // Иконки против эскиза и dist/ (R4-POLNOTA-3) — судит ikony() по адресу подмены.
  { nazwa: 'favicon-32x32.png подменён записью 16', ikony: true, odpowiedz: (p) => (p === '/favicon-32x32.png' ? { status: 200, b: readFileSync(plikDist('/favicon-16x16.png')) } : null), zhdem: ['сборка: иконка', 'иконки:'], tolko: true },
  { nazwa: 'favicon.ico с одной записью', ikony: true, odpowiedz: (p, b) => (p === '/favicon.ico' ? { status: 200, b: (() => { const c = Buffer.from(b); c.writeUInt16LE(1, 4); return c; })() } : null), zhdem: ['сборка: иконка', 'иконки:'], tolko: true },
  { nazwa: 'favicon.svg другой', ikony: true, odpowiedz: (p, b) => (p === '/favicon.svg' ? { status: 200, b: Buffer.from(b.toString().replace('#eca84a', '#eca84b')) } : null), zhdem: ['сборка: иконка', 'иконки:'], tolko: true },
];

// ── Помощники ────────────────────────────────────────────────────────────
async function otkryt(browser, opcje, mut, adres = URL_) {
  const ctx = await browser.newContext(opcje);
  const page = await ctx.newPage();
  const zaprosy = [];
  const odpowiedzi = [];
  const sboi = [];
  page.on('request', (r) => zaprosy.push(r.url()));
  page.on('response', (r) => odpowiedzi.push(r));
  page.on('requestfailed', (r) => sboi.push(`${r.url()} — ${r.failure()?.errorText ?? 'сбой'}`));
  await page.goto(adres, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (mut?.css) await page.addStyleTag({ content: mut.css });
  if (mut?.dom) await page.evaluate(mut.dom);
  // «Движения нет»: анимации знака, его частей и предков — до того, как их кончают.
  const ruch = await page.evaluate(RUCH);
  // Конечные анимации — к концу до снимков: идущая трасса пули героя (trasa-pula),
  // даже скрытая, перерисовывает слой, и знак меняется на 1 субпиксель (замерено:
  // 1440 при 1,75 — макс 15, при 1,5 в подвале — макс 2), пока она не кончится.
  await page.evaluate(() => { for (const a of document.getAnimations()) { try { a.finish(); } catch { /* бесконечная */ } } });
  await page.waitForTimeout(200);
  return { ctx, page, zaprosy, odpowiedzi, sboi, ruch };
}
const stanZnakow = () => [...document.querySelectorAll('svg.znak')].map((svg) => {
  const cs = (el) => { const s = getComputedStyle(el); return { fill: s.fill, stroke: s.stroke, sw: s.strokeWidth, vis: s.visibility, disp: s.display }; };
  const r = svg.getBoundingClientRect();
  // Что знак рисует за своей коробкой: фильтр, тень, отражение, обводка (R4-BRAUZER-1).
  const zaKorobkoj = [svg, ...svg.children].flatMap((el) => { const s = getComputedStyle(el); return [['filter', s.filter], ['box-shadow', s.boxShadow], ['-webkit-box-reflect', s.webkitBoxReflect ?? 'none'], ['outline-style', s.outlineStyle]].filter(([, v]) => v && v !== 'none').map(([k, v]) => `${el.localName}: ${k} ${v}`); });
  const przodkowie = [];
  for (let a = svg; a; a = a.parentElement) {
    const s = getComputedStyle(a);
    przodkowie.push({ el: `${a.localName}${[...a.classList].slice(0, 2).map((c) => `.${c}`).join('')}`, hdr: a.classList.contains('hdr'), mbm: s.mixBlendMode, bdf: s.backdropFilter });
  }
  return {
    gde: svg.closest('.hdr') ? 'шапка' : svg.closest('footer') ? 'подвал' : 'иначе',
    rodzic: svg.parentElement?.classList.contains('hdr__brand') ? 'hdr__brand' : svg.parentElement?.classList.contains('ft__brand') ? 'ft__brand' : svg.parentElement?.className ?? '',
    w: r.width, h: r.height,
    attrs: { width: svg.getAttribute('width'), height: svg.getAttribute('height'), viewBox: svg.getAttribute('viewBox') },
    dzieci: [...svg.children].map((c) => c.localName),
    polygony: [...svg.querySelectorAll(':scope > polygon')].map((p) => ({ points: p.getAttribute('points'), ...cs(p) })),
    napisy: [...svg.querySelectorAll(':scope > path')].map((p) => ({ d: p.getAttribute('d'), ...cs(p) })),
    svg: cs(svg),
    przodkowie,
    zaKorobkoj,
  };
});
const canvasText = (page) => page.evaluate(() => { const t = document.createElement('div'); t.style.color = 'CanvasText'; document.body.append(t); const c = getComputedStyle(t).color; t.remove(); return c; });

function sadStylu(stany, { tag, dpr, forced, ct }, bledy) {
  const gde = stany.map((s) => s.gde).sort().join(',');
  if (stany.length !== 2 || gde !== 'подвал,шапка') { bledy.push(`строение: ${tag}: svg.znak на странице — ${stany.length} (${gde || 'нет'}), ждали ровно шапку и подвал`); }
  for (const s of stany) {
    const t = `${tag}, ${s.gde}`;
    const rodzic = s.gde === 'шапка' ? 'hdr__brand' : 'ft__brand';
    if (s.rodzic !== rodzic) bledy.push(`строение: ${t}: родитель svg — «${s.rodzic}», ждали .${rodzic}`);
    for (const a of ['width', 'height', 'viewBox']) if (s.attrs[a] !== E.svg[a]) bledy.push(`строение: ${t}: ${a}="${s.attrs[a]}", у эскиза "${E.svg[a]}"`);
    if (s.dzieci.join(',') !== 'polygon,polygon,polygon,path,path') bledy.push(`строение: ${t}: дети svg — ${s.dzieci.join(', ') || 'нет'}, ждали три polygon и два path`);
    if (Math.abs(s.w - 138) > 0.01 || Math.abs(s.h - 38) > 0.01) bledy.push(`размер: ${t}: знак ${s.w} × ${s.h}, ждали 138 × 38`);
    if (s.svg.vis !== 'visible' || s.svg.disp === 'none') bledy.push(`видимость: ${t}: svg visibility ${s.svg.vis}, display ${s.svg.disp}`);
    for (const z of s.zaKorobkoj) bledy.push(`за коробкой: ${t}: ${z} — знак рисует за своей рамкой`);
    for (const p of s.przodkowie) {
      if (p.mbm !== 'normal') bledy.push(`смешивание: ${t}: mix-blend-mode ${p.mbm} у ${p.el}`);
      if (p.bdf !== 'none' && !p.hdr) bledy.push(`смешивание: ${t}: backdrop-filter ${p.bdf} у ${p.el} (разрешён только у .hdr)`);
    }
    const kraska = (rola) => (forced ? ct : LIT[rola]);
    const brakObwodki = (c) => c.stroke === 'none' || c.sw === '0px';
    s.polygony.forEach((p, i) => {
      const e = E.polygony[i];
      if (!e) return;
      if (p.points !== e.points) bledy.push(`строение: ${t}: многоугольник ${i + 1} — points не равны эскизу`);
      const f = forced ? p.fill : hex(p.fill);
      if (f !== kraska(e.rola)) bledy.push(`${forced ? 'принудительные цвета' : 'краска'}: ${t}: многоугольник ${i + 1} (${e.rola}) залит ${p.fill}, ждали ${kraska(e.rola)}`);
      if (!brakObwodki(p)) bledy.push(`обводка: ${t}: у многоугольника ${i + 1} обводка ${p.stroke} ${p.sw}`);
      if (p.vis !== 'visible') bledy.push(`видимость: ${t}: многоугольник ${i + 1} visibility ${p.vis}`);
    });
    s.napisy.forEach((n, i) => {
      const e = E.napisy[i];
      if (!e) return;
      if (n.d !== e.d) bledy.push(`строение: ${t}: надпись ${i + 1} — d не равен эскизу («${e.imie}»)`);
      const f = forced ? n.fill : hex(n.fill);
      if (f !== kraska('ink')) bledy.push(`${forced ? 'принудительные цвета' : 'краска'}: ${t}: «${e.imie}» залита ${n.fill}, ждали ${kraska('ink')}`);
      const nuzhna = e.th && dpr <= 1.5;
      const imeetsya = !brakObwodki(n);
      const cvet = forced ? n.stroke : hex(n.stroke);
      if (nuzhna && (!imeetsya || n.sw !== '0.3px' || cvet !== kraska('ink'))) bledy.push(`${forced ? 'принудительные цвета' : 'обводка'}: ${t}: «${e.imie}» при DPR ${dpr} — обводка ${n.stroke} ${n.sw}, ждали ${kraska('ink')} 0.3px`);
      if (!nuzhna && imeetsya) bledy.push(`${forced ? 'принудительные цвета' : 'обводка'}: ${t}: «${e.imie}» при DPR ${dpr} — обводка ${n.stroke} ${n.sw}, ждали без обводки`);
      if (n.vis !== 'visible') bledy.push(`видимость: ${t}: «${e.imie}» visibility ${n.vis}`);
    });
  }
}

async function zdjecie(page, clip, omit, animations = 'disabled') {
  const b = await page.screenshot({ clip, omitBackground: omit, animations, caret: 'hide' });
  const { data, info } = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, info, png: b };
}
// Устойчивый снимок — три подряд одинаковых с паузой 100 мс, не больше восьми снимков.
async function ustojchivy(p, clip, omit) {
  let prev = await zdjecie(p, clip, omit);
  let podryad = 1;
  for (let k = 2; k <= 8; k++) {
    await p.waitForTimeout(100);
    const cur = await zdjecie(p, clip, omit);
    podryad = cur.data.equals(prev.data) ? podryad + 1 : 1;
    if (podryad === 3) return { ...cur, snimkov: k };
    prev = cur;
  }
  return null;
}
// Ставит эскиз в точку знака и возвращает рамку снимка.
async function postavit(page, ref, sel, okno) {
  const r = await page.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    const o = { x: b.x, y: b.y, width: b.width, height: b.height };
    let a = e.parentElement;
    let kotwica = null;
    while (a && a !== document.documentElement) { const p = getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') kotwica = a; a = a.parentElement; }
    if (kotwica) { const f = kotwica.getBoundingClientRect(); return { ...o, tryb: 'fixed', fx: f.x, fy: f.y, dx: b.x - f.x, dy: b.y - f.y }; }
    return { ...o, tryb: 'flow', docX: b.x + scrollX, docY: b.y + scrollY, sx: scrollX, sy: scrollY };
  }, sel);
  if (!r) return { blad: 'знака нет' };
  const hdrDol = await page.evaluate((s) => { const h = document.querySelector(s)?.closest('.hdr'); return h ? h.getBoundingClientRect().bottom : null; }, sel);
  await ref.evaluate((css) => { document.getElementById('miejsce').textContent = css; }, miejsce(r));
  await ref.evaluate(({ tryb, sx, sy }) => window.scrollTo({ left: tryb === 'flow' ? sx : 0, top: tryb === 'flow' ? sy : 0, behavior: 'instant' }), r);
  const polozenie = await ref.evaluate(() => { const b = document.querySelector('#r svg').getBoundingClientRect(); return { x: b.x, y: b.y }; });
  if (Math.abs(polozenie.x - r.x) > 0.01 || Math.abs(polozenie.y - r.y) > 0.01) return { blad: `эскиз не встал в точку знака: ${polozenie.x},${polozenie.y} против ${r.x},${r.y}` };
  const x = Math.max(0, Math.floor(r.x) - 2);
  const y = Math.max(0, Math.floor(r.y) - 2);
  const clip = { x, y, width: Math.min(okno.width, Math.ceil(r.x + r.width) + 2) - x, height: Math.min(okno.height, Math.ceil(r.y + r.height) + 2) - y };
  if (clip.width <= 0 || clip.height <= 0) return { blad: `знак вне окна (${JSON.stringify(r)})` };
  // Широкая рамка наложения — всё, что знак может нарисовать за коробкой (R4-BRAUZER-1):
  // у шапки — вся её полоса во всю ширину окна, у подвала — знак ± 60 px.
  const sx0 = Math.max(0, Math.floor(r.x) - 60), sy0 = Math.max(0, Math.floor(r.y) - 60);
  const szeroki = hdrDol !== null
    ? { x: 0, y: 0, width: okno.width, height: Math.min(okno.height, Math.ceil(hdrDol)) }
    : { x: sx0, y: sy0, width: Math.min(okno.width, Math.ceil(r.x + r.width) + 60) - sx0, height: Math.min(okno.height, Math.ceil(r.y + r.height) + 60) - sy0 };
  return { r, clip, szeroki };
}
// «Движения нет»: CSS-анимации (не переходы) у знака, его частей и предков.
const RUCH = () => document.getAnimations().filter((a) => !(a instanceof CSSTransition)).filter((a) => {
  const t = a.effect?.target;
  return t && [...document.querySelectorAll('svg.znak')].some((s) => s === t || s.contains(t) || t.contains(s));
}).map((a) => `${a.animationName ?? 'анимация'} на ${a.effect.target.localName}${[...a.effect.target.classList].map((c) => `.${c}`).join('')}`);
// Страж движения: два снимка рамки знака с живыми анимациями через 500 мс.
async function strazhRuha(page, clip) {
  const a = await zdjecie(page, clip, true, 'allow');
  await page.waitForTimeout(500);
  const b = await zdjecie(page, clip, true, 'allow');
  return a.data.equals(b.data) ? null : 'рамка знака меняется сама за 500 мс';
}
// (а) Рисунок: страница под SKRYJ против эскиза на пустой странице.
async function porownajRysunek(page, ref, clip) {
  const a = await ustojchivy(page, clip, true);
  const b = await ustojchivy(ref, clip, true);
  if (!a || !b) return { blad: `растр нестабилен (${!a ? 'страница' : 'эскиз'}): восемь снимков одного состояния без трёх одинаковых подряд` };
  if (a.data.length !== b.data.length) return { blad: `размер снимков разный: ${a.info.width}×${a.info.height} и ${b.info.width}×${b.info.height}` };
  let n = 0, max = 0, zalito = 0;
  for (let i = 0; i < a.data.length; i++) { const d = Math.abs(a.data[i] - b.data[i]); if (d) { n++; if (d > max) max = d; } }
  for (let i = 3; i < a.data.length; i += 4) if (a.data[i]) zalito++;
  return { n, max, zalito, snimkov: [a.snimkov, b.snimkov] };
}
// (б) Наложение: страница как есть против той же страницы без знака с эскизом поверх.
async function porownajNakladke(page, ref, clip) {
  const a = await ustojchivy(page, clip, false);
  const ukryj = await page.addStyleTag({ content: BEZ_ZNAKA });
  await page.waitForTimeout(150);
  const podklad = await ustojchivy(page, clip, false);
  await ukryj.evaluate((e) => e.remove());
  await page.waitForTimeout(150);
  const e = await ustojchivy(ref, clip, true);
  if (!a || !podklad || !e) return { blad: 'растр нестабилен при наложении' };
  const b = await sharp(podklad.png).composite([{ input: e.png }]).ensureAlpha().raw().toBuffer();
  if (a.data.length !== b.length) return { blad: 'размер снимков наложения разный' };
  let n = 0, max = 0;
  for (let i = 0; i < b.length; i++) { const d = Math.abs(a.data[i] - b[i]); if (d > max) max = d; if (d > TOL_NAKLADKI) n++; }
  return { n, max };
}
// Пять точек — центры частей знака; elementFromPoint должен попасть в сам знак. На время
// проверки знаку ставится pointer-events: auto: его собственное none — не перекрытие
// (R4-BRAUZER-3), а элемент или псевдоэлемент поверх по-прежнему попадёт в точку.
async function zakryt(page, sel) {
  const pe = await page.addStyleTag({ content: 'svg.znak, svg.znak * { pointer-events: auto !important; }' });
  try { return await zakrytBez(page, sel); } finally { await pe.evaluate((e) => e.remove()); }
}
async function zakrytBez(page, sel) {
  return page.evaluate((s) => {
    const svg = document.querySelector(s);
    if (!svg) return 'знака нет';
    const zle = [];
    for (const ch of svg.children) {
      const r = ch.getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      if (!(el && (el === svg || svg.contains(el)))) zle.push(`${ch.localName}: ${el ? `${el.localName}${[...el.classList].slice(0, 2).map((c) => `.${c}`).join('')}` : 'ничего'}`);
    }
    return zle.length ? `в центре частей — не знак: ${zle.join('; ')}` : null;
  }, sel);
}
const przewinDo = (page, y) => page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);

// ── Окно с пикселями ─────────────────────────────────────────────────────
async function oknoPikseli(przegladarki, o, mut, zapis, bledy) {
  const okno = vp(o);
  const forced = o.forced ?? null;
  const browser = o.pasek ? przegladarki.pasek : przegladarki.zwykla;
  const { ctx, page, ruch, odpowiedzi, sboi } = await otkryt(browser, { viewport: okno, deviceScaleFactor: o.dpr, ...(forced ? { forcedColors: 'active', colorScheme: forced } : {}) }, mut);
  const tag = `${o.w} DPR ${o.dpr}${o.pasek ? ', полоса прокрутки' : ''}${forced ? `, принудительные цвета ${forced}` : ''}`;
  const wynik = { ...o, stany: [] };
  try {
    if (ruch.length) bledy.push(`движение: ${tag}: у знака анимации — ${ruch.join('; ')}`);
    const ct = forced ? await canvasText(page) : null;
    if (forced) wynik.canvasText = ct;
    await przewinDo(page, 0);
    sadStylu(await page.evaluate(stanZnakow), { tag, dpr: o.dpr, forced, ct }, bledy);
    const burgerPokazan = await page.evaluate(() => { const b = document.querySelector('.hdr__burger'); return !!b && getComputedStyle(b).display !== 'none'; });
    await page.addStyleTag({ content: BEZ_ZERNA });
    const skryj = await page.addStyleTag({ content: SKRYJ });
    const skryjWl = (on) => skryj.evaluate((e, v) => { e.disabled = !v; }, on);
    // Прогрев: первые снимки после скрытия ещё меняют растр слоя один раз (замерено:
    // 1440 при 1,75 — снимки 1–2 равны, с третьего знак на 1 субпиксель другой).
    await page.waitForLoadState('networkidle');
    await page.screenshot({ omitBackground: true, animations: 'disabled' });
    await page.waitForTimeout(500);
    const ref = await ctx.newPage();
    await ref.setContent(forced ? refHtml(ct, ct) : refHtml(LIT.ink, LIT.accent));
    const H = '.hdr__brand svg.znak';
    const stany = [
      { stan: 'вверху', sel: H, prep: async () => { await przewinDo(page, 0); } },
      ...(forced ? [] : [
        { stan: 'при прокрутке', sel: H, prep: async () => { await przewinDo(page, 2000); } },
        { stan: 'наведение', sel: H, prep: async () => {
          await przewinDo(page, 0);
          const b = await page.evaluate(() => { const r = document.querySelector('.hdr__brand').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
          await page.mouse.move(b.x, b.y);
          await page.waitForTimeout(350);
          if (!(await page.evaluate(() => document.querySelector('.hdr__brand').matches(':hover')))) return 'наведение не удалось: ссылка знака не :hover';
        } },
        { stan: 'фокус', sel: H, prep: async () => {
          await page.mouse.move(0, okno.height - 1);
          await page.evaluate(() => document.activeElement?.blur());
          for (let k = 0; k < 25; k++) {
            await page.keyboard.press('Tab');
            if (await page.evaluate(() => document.activeElement?.classList.contains('hdr__brand'))) break;
          }
          await page.waitForTimeout(350);
          const f = await page.evaluate(() => { const a = document.activeElement; return { brand: !!a?.classList.contains('hdr__brand'), fv: !!a?.matches(':focus-visible') }; });
          if (!f.brand || !f.fv) return `фокус не удалось: на ссылке знака ${f.brand ? 'да' : 'нет'}, :focus-visible ${f.fv ? 'да' : 'нет'}`;
        } },
        ...(burgerPokazan ? [{ stan: 'ящик открыт', sel: H, prep: async () => {
          await page.evaluate(() => document.activeElement?.blur());
          await page.evaluate(() => document.querySelector('.hdr__burger').click());
          await page.waitForTimeout(400);
          const st = await page.evaluate(() => ({ exp: document.querySelector('.hdr__burger').getAttribute('aria-expanded'), hidden: document.querySelector('.hdr__drawer').hidden }));
          if (st.exp !== 'true' || st.hidden) return `ящик не открылся: aria-expanded ${st.exp}, hidden ${st.hidden}`;
        }, po: async () => { await page.evaluate(() => document.querySelector('.hdr__burger').click()); await page.waitForTimeout(300); } }] : []),
      ]),
      { stan: 'подвал', sel: '.ft__brand svg.znak', prep: async () => {
        await page.evaluate(() => document.querySelector('.ft__brand svg.znak')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.waitForTimeout(150);
      } },
    ];
    for (const s of stany) {
      const imie = s.stan === 'подвал' ? 'подвал' : `шапка, ${s.stan}`;
      const nie = await s.prep();
      if (nie) { bledy.push(`состояние: ${tag}, ${s.stan}: ${nie}`); wynik.stany.push({ stan: s.stan, blad: nie }); continue; }
      const pos = await postavit(page, ref, s.sel, okno);
      const w1 = { stan: s.stan };
      if (pos.blad) { bledy.push(`пиксели: ${imie}: ${tag}: ${pos.blad}`); wynik.stany.push({ ...w1, blad: pos.blad }); await s.po?.(); continue; }
      w1.clip = pos.clip;
      // Движение, начатое в этом состоянии (наведение, фокус, ящик, позже) — R4-BRAUZER-2.
      const ruchTut = await page.evaluate(RUCH);
      if (ruchTut.length) bledy.push(`движение: ${tag}, ${imie}: у знака анимации — ${ruchTut.join('; ')}`);
      const straz = await strazhRuha(page, pos.clip);
      if (straz) bledy.push(`движение: ${tag}, ${imie}: ${straz}`);
      w1.rysunek = await porownajRysunek(page, ref, pos.clip);
      await skryjWl(false);
      await page.waitForTimeout(150);
      const zak = await zakryt(page, s.sel);
      if (zak) bledy.push(`перекрыт: ${tag}, ${imie}: ${zak}`);
      w1.nakladka = await porownajNakladke(page, ref, pos.szeroki);
      await skryjWl(true);
      await page.waitForTimeout(150);
      await s.po?.();
      wynik.stany.push(w1);
      const R = w1.rysunek;
      if (R.blad) bledy.push(`пиксели: ${imie}: ${tag}: ${R.blad}`);
      else if (R.n) bledy.push(`пиксели: ${imie}: ${tag}: знак ≠ эскиз A — ${R.n} субпикселей, макс ${R.max}`);
      else if (!R.zalito) bledy.push(`пиксели: ${imie}: ${tag}: в рамке знака пусто`);
      const N = w1.nakladka;
      if (N.blad) bledy.push(`наложение: ${imie}: ${tag}: ${N.blad}`);
      else if (N.n) bledy.push(`наложение: ${imie}: ${tag}: страница ≠ подложка с эскизом поверх — ${N.n} субпикселей больше ${TOL_NAKLADKI}, макс ${N.max}`);
    }
    // Шапка при прокрутке всей страницы (R4-BRAUZER-4): в окнах с полем prokrutka — шагом
    // в эту долю высоты окна и в крайней точке; перекрытие точками и наложение.
    if (o.prokrutka) {
      await page.mouse.move(0, okno.height - 1);
      await page.evaluate(() => document.activeElement?.blur());
      const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      const krok = Math.floor(okno.height * o.prokrutka);
      const tochki = [];
      for (let y = 0; y < maxY; y += krok) tochki.push(y);
      tochki.push(maxY);
      const zle = [];
      let tochek = 0;
      for (const y of tochki) {
        await przewinDo(page, y);
        await page.waitForTimeout(120);
        const pos = await postavit(page, ref, H, okno);
        if (pos.blad) { zle.push(`${y}: ${pos.blad}`); continue; }
        await skryjWl(false);
        await page.waitForTimeout(100);
        const zak = await zakryt(page, H);
        const N = await porownajNakladke(page, ref, pos.szeroki);
        await skryjWl(true);
        tochek++;
        if (zak) zle.push(`${y}: перекрыт — ${zak}`);
        if (N.blad || N.n) zle.push(`${y}: наложение — ${N.blad ?? `${N.n} субпикселей, макс ${N.max}`}`);
      }
      wynik.prokrutka = { tochek, zle };
      for (const z of zle) bledy.push(`наложение: шапка, при прокрутке: ${tag}: scrollY ${z}`);
    }
    // Ответы окна пикселей — тоже против dist/ (R4-BRAUZER-5).
    if (!mut) wynik.otvety = (await sadOdpowiedzi(odpowiedzi, sboi, new URL(URL_).origin, tag, bledy)).length;
  } finally {
    await ctx.close();
  }
  zapis.push(wynik);
}

// ── Дерево доступности ───────────────────────────────────────────────────
async function drzewo(page) {
  const cdp = await page.context().newCDPSession(page);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const bid = async (sel) => {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
    return nodeId ? (await cdp.send('DOM.describeNode', { nodeId })).node.backendNodeId : null;
  };
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const po = new Map(nodes.map((n) => [n.nodeId, n]));
  const uzel = (b) => (b ? nodes.find((n) => n.backendDOMNodeId === b) ?? null : null);
  const potomki = (n) => {
    const out = [];
    const st = [...(n.childIds ?? [])];
    while (st.length) { const c = po.get(st.pop()); if (!c) continue; if (!c.ignored) out.push(`${c.role?.value}:${c.name?.value ?? ''}`); st.push(...(c.childIds ?? [])); }
    return out;
  };
  const opis = (n) => n && { role: n.role?.value, name: n.name?.value ?? '', ignored: !!n.ignored, potomki: potomki(n) };
  const w = {
    link: opis(uzel(await bid('.hdr .hdr__brand'))),
    svgShapki: opis(uzel(await bid('.hdr svg.znak'))),
    svgPodvala: opis(uzel(await bid('.ft__brand svg.znak'))),
    zImieniem: nodes.filter((n) => !n.ignored && n.role?.value !== 'RootWebArea' && /7th serpent/i.test(n.name?.value ?? '')).map((n) => `${n.role?.value}:${n.name?.value}`),
  };
  await cdp.detach();
  return w;
}
function sadDrzewa(d, tag, bledy) {
  const L = d.link;
  if (!L || L.ignored || L.role !== 'link' || L.name !== IMIE_LINKU) bledy.push(`доступность: ${tag}: ссылка знака — ${L ? `${L.role} «${L.name}»${L.ignored ? ' (скрыта)' : ''}` : 'нет в дереве'}, ждали link «${IMIE_LINKU}»`);
  if (L && L.potomki.length) bledy.push(`доступность: ${tag}: у ссылки знака доступные потомки — ${L.potomki.join(', ')}`);
  if (d.svgShapki && !d.svgShapki.ignored) bledy.push(`доступность: ${tag}: svg шапки в дереве — ${d.svgShapki.role} «${d.svgShapki.name}»`);
  const P = d.svgPodvala;
  if (!P || P.ignored || P.role !== 'image' || P.name !== IMIE_PODVALU) bledy.push(`доступность: ${tag}: знак подвала — ${P ? `${P.role} «${P.name}»${P.ignored ? ' (скрыт)' : ''}` : 'нет в дереве'}, ждали image «${IMIE_PODVALU}»`);
  if (P && P.potomki.length) bledy.push(`доступность: ${tag}: у знака подвала доступные потомки — ${P.potomki.join(', ')}`);
  const zhdem = [`link:${IMIE_LINKU}`, `image:${IMIE_PODVALU}`].sort().join(' | ');
  if (d.zImieniem.slice().sort().join(' | ') !== zhdem) bledy.push(`доступность: ${tag}: узлы с «7th Serpent» в имени — ${d.zImieniem.join(' | ') || 'нет'}, ждали ровно ${zhdem}`);
  for (const n of [L, P]) if (n?.name && !n.name.toLowerCase().includes('7th serpent')) bledy.push(`доступность: ${tag}: видимое «7TH SERPENT» не входит в имя «${n.name}»`);
}
async function oknoDrzewa(browser, w, mut, zapis, bledy) {
  const { ctx, page } = await otkryt(browser, { viewport: vp({ w }), deviceScaleFactor: 1 }, mut);
  try {
    const d = await drzewo(page);
    sadDrzewa(d, `${w}`, bledy);
    const wynik = { w, zakryty: d };
    const burger = await page.evaluate(() => { const b = document.querySelector('.hdr__burger'); return !!b && getComputedStyle(b).display !== 'none'; });
    if (burger) {
      await page.click('.hdr__burger');
      await page.waitForTimeout(400);
      const exp = await page.evaluate(() => document.querySelector('.hdr__burger').getAttribute('aria-expanded'));
      if (exp !== 'true') bledy.push(`состояние: ${w}: ящик не открылся для дерева`);
      const d2 = await drzewo(page);
      sadDrzewa(d2, `${w}, ящик открыт`, bledy);
      wynik.yashchik = d2;
    }
    zapis.push(wynik);
  } finally {
    await ctx.close();
  }
}

// ── Голова, запросы, сборка ──────────────────────────────────────────────
const plikDist = (p) => { const s = decodeURIComponent(p); return join(SITE, 'dist', s.endsWith('/') ? `${s}index.html` : s); };
// Ответы своего адреса: сбой загрузки, статус не 200 и байты не dist/ — три разных вида отказа.
async function sadOdpowiedzi(odpowiedzi, sboi, ORIGIN, tag, bledy) {
  const svoiSboi = sboi.filter((s) => s.startsWith(ORIGIN));
  if (svoiSboi.length) bledy.push(`сборка: ${tag}: сбой загрузки — ${svoiSboi.join(', ')}`);
  const pliki = [];
  for (const r of odpowiedzi) {
    const u = new URL(r.url());
    if (u.origin !== ORIGIN) continue;
    const buf = await r.body().catch(() => null);
    const f = plikDist(u.pathname);
    const dist = existsSync(f) && statSync(f).isFile() ? readFileSync(f) : null;
    const status = r.status();
    const rowny = !!buf && !!dist && buf.equals(dist);
    pliki.push({ put: u.pathname, status, sha256: buf ? sha(buf) : null, rowny_dist: rowny });
    if (status !== 200) bledy.push(`сборка: ${tag}: ${u.pathname} — ответ ${status}, ждали 200`);
    if (!rowny) bledy.push(`сборка: ${tag}: ${u.pathname} — байты не равны dist/ (${buf ? `sha256 ${sha(buf).slice(0, 12)}` : 'без тела'}; dist/ ${dist ? sha(dist).slice(0, 12) : 'файла нет'})`);
  }
  return pliki;
}
async function oknoPrzewin(browser, w, mut, zapis, bledy, adres = URL_) {
  const ORIGIN = new URL(adres).origin;
  const { ctx, page, zaprosy, odpowiedzi, sboi } = await otkryt(browser, { viewport: vp({ w }), deviceScaleFactor: 1 }, mut, adres);
  const wynik = { w };
  try {
    if (w === 1440) {
      const g = await page.evaluate(() => {
        const REL = /(^|\s)(icon|shortcut|apple-touch-icon|apple-touch-icon-precomposed|mask-icon|manifest|fluid-icon)(\s|$)/i;
        const linki = [...document.querySelectorAll('link')].filter((l) => REL.test(l.getAttribute('rel') ?? '')).map((l) => ({ wHead: l.parentElement === document.head, attrs: Object.fromEntries([...l.attributes].map((a) => [a.name, a.value])), href: l.href }));
        // Ссылки, которые браузер загружает сам (canonical и alternate — не запросы).
        const LAD = /(^|\s)(stylesheet|preload|prefetch|preconnect|dns-prefetch|modulepreload|prerender|manifest|icon|apple-touch-icon|apple-touch-icon-precomposed|mask-icon)(\s|$)/i;
        const wszystkie = [...document.querySelectorAll('link[href]')].filter((l) => LAD.test(l.getAttribute('rel') ?? '')).map((l) => l.href).concat([...document.querySelectorAll('script[src]')].map((s) => s.src));
        const a = document.querySelector('.hdr__brand');
        return { linki, wszystkie, base: document.querySelectorAll('base').length, brand: a?.href ?? null };
      });
      wynik.glowa = g;
      const norm = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
      if (g.linki.length !== LINKI.length) bledy.push(`голова: ссылок-иконок ${g.linki.length}, ждали ровно ${LINKI.length}`);
      g.linki.forEach((l, i) => {
        if (!l.wHead) bledy.push(`голова: ссылка ${i + 1} (${l.attrs.href}) не в <head>`);
        if (!LINKI[i] || norm(l.attrs) !== norm(LINKI[i])) bledy.push(`голова: ссылка ${i + 1} — ${JSON.stringify(l.attrs)}, ждали ${JSON.stringify(LINKI[i] ?? null)}`);
        if (new URL(l.href).origin !== ORIGIN) bledy.push(`голова: ссылка ${i + 1} ведёт на ${l.href} — не свой сервер`);
      });
      for (const h of g.wszystkie) if (!/^(data|blob):/.test(h) && new URL(h).origin !== ORIGIN) bledy.push(`голова: link или script на ${h} — не свой сервер`);
      if (g.base) bledy.push(`голова: на странице <base> (${g.base})`);
      if (g.brand !== `${ORIGIN}/`) bledy.push(`голова: ссылка знака ведёт на ${g.brand}, ждали ${ORIGIN}/`);
    }
    await page.evaluate(async () => {
      const h = () => document.documentElement.scrollHeight;
      for (let y = 0; y < h(); y += Math.floor(innerHeight / 2)) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 120)); }
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    const vneshnie = [...new Set(zaprosy.filter((u) => /^https?:/.test(u) && new URL(u).origin !== ORIGIN))];
    wynik.zaprosov = zaprosy.length;
    wynik.vneshnie = vneshnie;
    if (vneshnie.length) bledy.push(`запросы: ${w}: не на свой сервер — ${vneshnie.join(', ')}`);
    if (!mut) {
      const pliki = await sadOdpowiedzi(odpowiedzi, sboi, ORIGIN, `${w}`, bledy);
      wynik.otvety = pliki;
      if (!pliki.some((p) => p.put === '/')) bledy.push(`сборка: ${w}: ответа на / нет среди ответов`);
    }
    zapis.push(wynik);
  } finally {
    await ctx.close();
  }
}

// ── Иконки против эскиза ─────────────────────────────────────────────────
async function rastrEskiza(plik, size) {
  const svg = eskiz[plik];
  const vb = +/viewBox="0 0 (\d+) \d+"/.exec(svg.toString())[1];
  return sharp(svg, { density: (72 * size) / vb }).resize(size, size).ensureAlpha().raw().toBuffer();
}
const rastr = (buf) => sharp(buf).ensureAlpha().raw().toBuffer();
async function ikony(bledy, adres = URL_) {
  const ORIGIN = new URL(adres).origin;
  const wynik = [];
  const pobierz = async (p) => { const r = await fetch(ORIGIN + p); if (r.status !== 200) bledy.push(`сборка: иконка ${p} — ответ ${r.status}`); return Buffer.from(await r.arrayBuffer()); };
  for (const p of LINKI.map((l) => l.href)) {
    const srv = await pobierz(p);
    const dist = readFileSync(join(SITE, 'dist', p));
    const pub = readFileSync(join(SITE, 'public', p));
    const w = { put: p, sha256: sha(srv), rowny_dist: srv.equals(dist), rowny_public: dist.equals(pub) };
    if (!w.rowny_dist) bledy.push(`сборка: иконка ${p} с сервера не равна dist/`);
    if (!w.rowny_public) bledy.push(`сборка: иконка ${p} в dist/ не равна public/ — npm run znak, затем сборка`);
    wynik.push(w);
  }
  const svg = await pobierz('/favicon.svg');
  if (!svg.equals(eskiz['favicon.svg'])) bledy.push('иконки: favicon.svg не равен одобренному эскизу побайтно');
  const PNG = [['/favicon-16x16.png', 'favicon-16.svg', 16], ['/favicon-32x32.png', 'favicon.svg', 32], ['/apple-touch-icon.png', 'favicon.svg', 180], ['/icon-192.png', 'favicon.svg', 192]];
  for (const [p, plik, size] of PNG) {
    const meta = await sharp(await pobierz(p)).metadata();
    if (meta.width !== size || meta.height !== size) { bledy.push(`иконки: ${p} — ${meta.width}×${meta.height}, ждали ${size}×${size}`); continue; }
    if (!(await rastr(await pobierz(p))).equals(await rastrEskiza(plik, size))) bledy.push(`иконки: ${p} по пикселям не равен эскизу ${plik} при ${size}`);
  }
  const ico = await pobierz('/favicon.ico');
  const n = ico.readUInt16LE(4);
  const zapisi = [];
  for (let i = 0; i < n; i++) {
    const e = 6 + 16 * i;
    zapisi.push({ size: ico.readUInt8(e) || 256, buf: ico.subarray(ico.readUInt32LE(e + 12), ico.readUInt32LE(e + 12) + ico.readUInt32LE(e + 8)) });
  }
  if (zapisi.map((z) => z.size).join(',') !== '16,32') bledy.push(`иконки: в favicon.ico записи ${zapisi.map((z) => z.size).join(', ')}, ждали 16 и 32`);
  for (const z of zapisi) {
    const plik = z.size === 16 ? 'favicon-16.svg' : 'favicon.svg';
    const ok = await rastr(z.buf).then(async (r) => r.equals(await rastrEskiza(plik, z.size))).catch(() => false);
    if (!ok) bledy.push(`иконки: запись ${z.size} в favicon.ico по пикселям не равна эскизу ${plik}`);
  }
  return wynik;
}

// ── Свой сервер над dist/ с подменой (самопроверка сборки) ───────────────
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml' };
async function serwer(port, podmena) {
  const s = http.createServer(async (rq, rs) => {
    const p = decodeURIComponent(new URL(rq.url, 'http://x').pathname);
    try {
      const b = await readFile(plikDist(p));
      const zam = podmena(p, b);
      rs.writeHead(zam?.status ?? 200, { 'content-type': MIME[extname(plikDist(p))] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      rs.end(zam?.b ?? b);
    } catch { rs.writeHead(404); rs.end(); }
  });
  await new Promise((r) => s.listen(port, r));
  return s;
}

// ── Суд ──────────────────────────────────────────────────────────────────
async function sud(przegladarki, zestaw, mut) {
  const bledy = [];
  const zapis = { piksele: [], dostepnost: [], przewin: [] };
  for (const o of zestaw.piksele) await oknoPikseli(przegladarki, o, mut, zapis.piksele, bledy);
  for (const w of zestaw.ax) await oknoDrzewa(przegladarki.zwykla, w, mut, zapis.dostepnost, bledy);
  for (const w of zestaw.przewin) await oknoPrzewin(przegladarki.zwykla, w, mut, zapis.przewin, bledy);
  return { bledy, zapis };
}

const przegladarki = {
  zwykla: await chromium.launch({ executablePath: CHROME }),
  pasek: await chromium.launch({ executablePath: CHROME, ignoreDefaultArgs: ['--hide-scrollbars'] }),
};
const wersja = przegladarki.zwykla.version();
console.log(`браузер: Chromium ${wersja}; страница ${URL_}`);
const shapka = { sud: 'wiernosc.mjs', adres: URL_, brauzer: `Chromium ${wersja}`, chrome: CHROME, ...pochodzenie(import.meta.url), eskiz: PINY };
mkdirSync(ZAMERY, { recursive: true });
try {
  if (!SELFTEST) {
    const { bledy, zapis } = await sud(przegladarki, PELNY, null);
    zapis.ikony = await ikony(bledy);
    for (const k of zapis.piksele) console.log(`  ${k.w} DPR ${k.dpr}${k.pasek ? ' полоса' : ''}${k.forced ? ` принудительные ${k.forced}` : ''}: ${k.stany.map((s) => `${s.stan} ${s.blad ? 'ОТКАЗ' : `${s.rysunek?.blad ? 'ОТКАЗ' : s.rysunek?.n}/${s.nakladka?.blad ? 'ОТКАЗ' : s.nakladka?.n}`}`).join('; ')}`);
    writeFileSync(join(ZAMERY, 'wiernosc.json'), JSON.stringify({ ...shapka, bledy, ...zapis }, null, 2) + '\n');
    if (bledy.length) {
      console.error(`wiernosc: ОТКАЗ — ${bledy.length}`);
      for (const b of bledy) console.error(`  - ${b}`);
      process.exitCode = 1;
    } else console.log(`wiernosc: сверено — знак шапки и подвала равен эскизу A и не перекрыт (${PELNY.piksele.length} окон, из них ${PELNY.piksele.filter((o) => o.forced).length} с принудительными цветами и ${PELNY.piksele.filter((o) => o.pasek).length} с полосой прокрутки), смешивания и движения нет, голова, дерево доступности, запросы, сборка = dist/, иконки = эскиз; выгрузка zamery/wiernosc.json`);
  } else {
    const wyniki = [];
    // Ожидание: null — «сверено»; строка или массив видов. Строка отказа данного вида —
    // начинается с него (у подмен сервера — содержит его). Все названные виды должны
    // встретиться (R4-POLNOTA-2); при tolko — и каждая строка отказа одного из видов.
    const sudOk = (bledy, zhdem, tolko, soderzhit) => {
      if (zhdem === null) return bledy.length === 0;
      const vidy = [].concat(zhdem);
      const est = (b, v) => (soderzhit ? b.includes(v) : b.startsWith(v));
      return bledy.length > 0 && vidy.every((v) => bledy.some((b) => est(b, v))) && (!tolko || bledy.every((b) => vidy.some((v) => est(b, v))));
    };
    const pechat = (ok, nazwa, zhdem, bledy) => console.log(`${ok ? 'ok ' : 'НЕТ'}  ${nazwa}: ждём ${zhdem === null ? 'сверено' : `отказ «${[].concat(zhdem).join('» и «')}»`}, факт ${bledy.length ? `отказ (${bledy.length}): ${bledy[0]}` : 'сверено'}`);
    const czysty = await sud(przegladarki, KROTKI, null);
    await ikony(czysty.bledy);
    wyniki.push({ nazwa: 'чистая страница', zhdem: null, ok: czysty.bledy.length === 0, bledy: czysty.bledy });
    pechat(czysty.bledy.length === 0, 'чистая страница', null, czysty.bledy);
    for (const m of MUTACJE) {
      // Исключение внутри пробы — её отказ «проба сломана», а не обрыв самопроверки.
      const { bledy } = await sud(przegladarki, KROTKI, m).catch((e) => ({ bledy: [`проба сломана: ${e.message.split('\n')[0]}`] }));
      const ok = sudOk(bledy, m.zhdem, m.tolko, false);
      wyniki.push({ nazwa: m.nazwa, zhdem: m.zhdem, tolko: !!m.tolko, ok, bledy });
      pechat(ok, m.nazwa, m.zhdem, bledy);
    }
    let port = 4990;
    for (const p of PODMENY) {
      const s = await serwer(port, p.odpowiedz);
      const bledy = [];
      const adres = `http://localhost:${port}/`;
      try {
        if (p.ikony) await ikony(bledy, adres);
        else await oknoPrzewin(przegladarki.zwykla, 1440, null, [], bledy, adres);
      } catch (e) { bledy.push(`проба сломана: ${e.message.split('\n')[0]}`); }
      s.close();
      port++;
      const ok = sudOk(bledy, p.zhdem, p.tolko, true);
      wyniki.push({ nazwa: p.nazwa, zhdem: p.zhdem, tolko: !!p.tolko, ok, bledy });
      pechat(ok, p.nazwa, p.zhdem, bledy);
    }
    const zle = wyniki.filter((w) => !w.ok).length;
    writeFileSync(join(ZAMERY, 'wiernosc-selftest.json'), JSON.stringify({ ...shapka, zestaw: KROTKI, proby: wyniki }, null, 2) + '\n');
    console.log(`\nwiernosc --selftest: ${wyniki.length - zle}/${wyniki.length} проб; выгрузка zamery/wiernosc-selftest.json`);
    if (zle) process.exitCode = 1;
  }
} catch (e) {
  console.error(`wiernosc: ОТКАЗ — ${e.stack ?? e.message}`);
  process.exitCode = 1;
} finally {
  await przegladarki.zwykla.close();
  await przegladarki.pasek.close();
}
