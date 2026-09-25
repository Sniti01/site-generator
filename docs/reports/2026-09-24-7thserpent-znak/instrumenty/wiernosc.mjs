// Судья собранной страницы: «знак на сайте = одобренный эскиз A» и всё, что знак
// и фавикон значат для браузера (сессия 11, П83; «судью судят», раунды 1 и 2:
// R1-VNEDRENIE-1, R2-RISOVKA-1…7, R2-SVERKA-2, -4, -7, R2-POLNOTA-2…5, -10, -12).
//
//   node wiernosc.mjs [адрес]             — судит (по умолчанию прод-превью
//                                           http://localhost:4331/), пишет
//                                           ../zamery/wiernosc.json; exit 1 при отказе
//   node wiernosc.mjs [адрес] --selftest  — те же проверки в малом наборе окон
//                                           на чистой странице и на мутациях
//                                           в странице (CSS и DOM после загрузки):
//                                           чистая — ноль отказов, каждая мутация —
//                                           свой отказ; пишет ../zamery/wiernosc-selftest.json
//
// ЧТО СУДИТ (каждый пункт — отказ):
//  0. Эскиз — тот, что одобрил владелец: sha256 файлов voprosy/A-semerka-trassa/
//     (znak.html, favicon.svg, favicon-16.svg) равны закреплённым ниже.
//  1. Сборка — та, что лежит в dist/: каждый ответ сервера со своего адреса
//     (HTML, CSS, шрифты, картинки, иконки) побайтно равен файлу dist/ по тому же
//     пути; иконки dist/ равны public/. В выгрузку — sha256, коммит и грязь дерева.
//  2. Строение знака: на странице ровно два svg.znak — прямой потомок .hdr__brand
//     и прямой потомок .ft__brand; атрибуты width, height, viewBox — как у эскиза;
//     дети — ровно три polygon и два path, points и d по порядку равны эскизу;
//     отрисованный размер 138 × 38. Надпись «TH» узнаётся по d, а не по классу.
//  3. Краска: вычисленная заливка каждой части в шапке и подвале равна литералу
//     той же роли в одобренной иконке эскиза (перекладина и надписи — снег,
//     трассер и ромб — фонарь); обводка «TH» — той же краской 0.3px при
//     плотности до 1,5 и нет выше; у «SERPENT» и у многоугольников обводки нет.
//  4. Пиксели знака: знак страницы против эскиза, нарисованного на отдельной
//     пустой странице (краски — литералы иконки эскиза, не токены сайта) в той же
//     точке окна. Со страницы убирается всё, кроме знака и его предков, у предков —
//     фон, рамка, тень и кольцо; прозрачность, фильтры, трансформации, наследуемые
//     краски предков остаются и судятся. Рамка — коробка знака плюс 2 px.
//     Каждое состояние снимается дважды и эскиз дважды: разные снимки одного
//     состояния — «растр нестабилен» (до трёх попыток), это отказ, а не проход.
//     Ждём 0 различий. Окна 1440 и 390, плотности 1, 1,25, 1,5, 1,51, 1,75, 2, 3;
//     состояния: шапка вверху, шапка при прокрутке, наведение на ссылку знака,
//     фокус с клавиатуры (проверяется, что фокус на ссылке и :focus-visible),
//     ящик меню открыт (где бургер показан; проверяется aria-expanded и hidden),
//     подвал. Перед снятием — знак видим и не перекрыт (elementFromPoint).
//  5. Принудительные цвета (эмуляция, светлая и тёмная схема, плотность 1 и 2 или 3):
//     заливка всех частей и обводка «TH» — системный CanvasText, пиксели — эскиз
//     одной краской CanvasText (отступление от эскиза A — вопрос владельцу в докладе).
//  6. <head>: ссылок-иконок (rel icon, shortcut, apple-touch-icon[-precomposed],
//     mask-icon, manifest) ровно шесть, в <head>, по порядку и с точным набором
//     атрибутов (без media и прочих); <base> нет; адрес каждой — свой сервер.
//     Ссылка знака ведёт на главную своего сервера.
//  7. Доступность (дерево Chromium через CDP, 1440 и 390, на 390 и с открытым
//     ящиком): ссылка знака — link с именем «7th Serpent — 7thserpent.com, home»
//     без доступных потомков; svg шапки в дереве нет; svg подвала — image с именем
//     «7th Serpent — 7thserpent.com» без потомков; других узлов с «7th Serpent»
//     в имени нет; видимое «7TH SERPENT» входит в имя (WCAG 2.5.3).
//  8. Запросы: прокрутка всей страницы на 1440 и 390 — ни одного запроса не на свой
//     сервер (data: и blob: не запросы).
//  9. Иконки против эскиза: favicon.svg побайтно равен эскизу; PNG 16, 32, 180, 192
//     и обе записи favicon.ico (ровно две: 16 и 32) по пикселям равны эскизу,
//     растрированному тем же способом, что tools/znak.mjs (sharp, librsvg).
//
// ПРЕДЕЛЫ (названы): один движок — Chromium из кеша Playwright (путь и версия —
// в выгрузке; playwright-core — из временного кеша npx по жёсткому пути). Эмуляция
// принудительных цветов — не настоящая контрастная тема Windows. Headless: вкладку
// и запрос фавикона браузером не видит — это vkladka-dowod.mjs. Фон, рамка, тень
// и кольцо фокуса у предков знака (в том числе у ссылки) не судятся: их видят кадры
// эталона и материалы приёмки. Перекрытие элементом с pointer-events: none не видно
// (зерно страницы такое по замыслу). Эскиз и реализация идут от одних контуров
// glify.mjs — судья не независим от способа построения букв (кернинга нет у обоих).
// PNG иконок и эскиз растрирует одна библиотека — судится равенство рисунка,
// а не качество растра. Мутации самопроверки — правки страницы после загрузки,
// а не пересборка: они судят чувствительность судьи, а не путь сборки.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TU = dirname(fileURLToPath(import.meta.url));
const RAPORT = resolve(TU, '..');
const REPO = resolve(RAPORT, '../../..');
const SITE = join(REPO, 'sites/7thserpent.com');
const PW = 'C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json';
const CHROME = 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const { chromium } = createRequire(PW)('playwright-core');
const sharp = createRequire(join(REPO, 'package.json'))('sharp');

const ARGI = process.argv.slice(2);
const SELFTEST = ARGI.includes('--selftest');
const URL_ = ARGI.find((a) => !a.startsWith('--')) ?? 'http://localhost:4331/';
const ORIGIN = new URL(URL_).origin;
const sha = (b) => createHash('sha256').update(b).digest('hex');

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

// Со страницы убирается всё, кроме знака и его предков; у предков — фон, рамка, тень, кольцо.
// filter: none у скрытых — не лишнее: visibility: hidden не гасит фильтр feTurbulence
// зерна ядра (Grain.astro), шум остаётся в кадре (замерено: альфа 10–13 на всей полосе).
const SKRYJ = `*:not(:has(svg.znak)):not(svg.znak):not(svg.znak *), *::before, *::after { visibility: hidden !important; filter: none !important; backdrop-filter: none !important; }
:has(svg.znak) { background: transparent !important; border-color: transparent !important; box-shadow: none !important; outline-color: transparent !important; }`;
// Эскиз ставится с той же цепочкой смещений, что знак страницы: фаза растра при дробной
// плотности зависит от того, от какого начала отсчитано смещение (замерено: эскиз
// в фиксированном блоке в точке знака — 3361–7918 субпикселей при 1,25–1,75 на
// нетронутой сборке; от начала окна у шапки и от начала документа с той же прокруткой
// у подвала — 0 во всех 42 сочетаниях окна, плотности и состояния). Поэтому: у знака
// с фиксированным или липким предком — фиксированный блок в точке этого предка
// и отступ до знака; иначе — отступ от начала документа и та же прокрутка.
const refHtml = (ink, accent) => `<!doctype html><html><head><meta charset="utf-8"><style>
:root { --ink: ${ink}; --accent: ${accent}; }
html, body { margin: 0; background: transparent; }
#r { line-height: 0; }
#r svg { display: block; }
</style><style id="miejsce"></style></head><body><div id="r">${ZNAK_HTML}</div></body></html>`;
const miejsce = (m) => (m.tryb === 'fixed'
  ? `#r { position: fixed; left: ${m.fx}px; top: ${m.fy}px; padding-left: ${m.dx}px; padding-top: ${m.dy}px; }`
  : `body { padding-left: ${m.docX}px; padding-top: ${m.docY}px; min-height: ${m.docY + 4000}px; }`);

const vp = (w) => ({ width: w, height: w > 500 ? 900 : 844 });
const hex = (c) => {
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(c ?? '');
  if (!m || (m[4] !== undefined && m[4] !== '1')) return c;
  return '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('');
};

// ── Наборы окон ──────────────────────────────────────────────────────────
const PLOTNOSTI = [1, 1.25, 1.5, 1.51, 1.75, 2, 3];
const PELNY = {
  piksele: [1440, 390].flatMap((w) => PLOTNOSTI.map((d) => [w, d])),
  forced: [[1440, 1, 'light'], [1440, 1, 'dark'], [1440, 2, 'light'], [1440, 2, 'dark'], [390, 1, 'light'], [390, 3, 'dark']],
  ax: [1440, 390],
  przewin: [1440, 390],
};
const KROTKI = { piksele: [[1440, 1], [1440, 1.75], [390, 1]], forced: [[1440, 1, 'light']], ax: [1440, 390], przewin: [1440] };

// ── Мутации самопроверки (правки страницы после загрузки) ───────────────
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
  { nazwa: 'знака в подвале нет', dom: () => document.querySelector('.ft__brand svg.znak')?.remove(), zhdem: 'строение' },
  { nazwa: 'контур «SERPENT» правлен', dom: () => { for (const s of document.querySelectorAll('svg.znak')) { const p = s.querySelectorAll('path')[1]; p.setAttribute('d', p.getAttribute('d').replace('M30.31', 'M30.41')); } }, zhdem: 'строение' },
  { nazwa: 'перекрыт', dom: () => { const r = document.querySelector('.hdr__brand svg').getBoundingClientRect(); const d = document.createElement('div'); d.style.cssText = `position:fixed;left:${r.x}px;top:${r.y}px;width:${r.width}px;height:${r.height}px;background:#000;z-index:2147483647`; document.body.append(d); }, zhdem: 'перекрыт' },
  { nazwa: 'наведение гасит знак', css: '.hdr__brand:hover svg { opacity: .7 }', zhdem: 'пиксели: шапка, наведение' },
  { nazwa: 'фокус гасит знак', css: '.hdr__brand:focus-visible svg { opacity: .7 }', zhdem: 'пиксели: шапка, фокус' },
  { nazwa: 'ящик гасит знак', css: ".hdr:has(.hdr__burger[aria-expanded='true']) .hdr__brand svg { opacity: .7 }", zhdem: 'пиксели: шапка, ящик открыт' },
  { nazwa: 'внешняя иконка', dom: () => { const l = document.createElement('link'); l.rel = 'icon'; l.href = 'https://example.invalid/x.png'; document.head.append(l); }, zhdem: 'голова' },
  { nazwa: '<base> в голове', dom: () => { const b = document.createElement('base'); b.href = 'https://example.invalid/'; document.head.prepend(b); }, zhdem: 'голова' },
  { nazwa: 'media=print у SVG-иконки', dom: () => document.querySelector('link[href="/favicon.svg"]').setAttribute('media', 'print'), zhdem: 'голова' },
  { nazwa: 'подпись ссылки знака', dom: () => document.querySelector('.hdr__brand').setAttribute('aria-label', 'Home'), zhdem: 'доступность' },
  { nazwa: 'подпись подвала пропала', dom: () => { const s = document.querySelector('.ft__brand svg.znak'); s.removeAttribute('aria-label'); s.removeAttribute('role'); s.setAttribute('aria-hidden', 'true'); }, zhdem: 'доступность' },
  { nazwa: 'внешний запрос', dom: () => { new Image().src = 'https://example.invalid/p.gif'; }, zhdem: 'запросы' },
];

// ── Помощники ────────────────────────────────────────────────────────────
async function otkryt(browser, opcje, mut) {
  const ctx = await browser.newContext(opcje);
  const page = await ctx.newPage();
  const zaprosy = [];
  const odpowiedzi = [];
  page.on('request', (r) => zaprosy.push(r.url()));
  page.on('response', (r) => odpowiedzi.push(r));
  await page.goto(URL_, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  // Конечные анимации — к концу до снимков: идущая трасса пули героя (trasa-pula),
  // даже скрытая, перерисовывает слой, и знак меняется на 1 субпиксель (замерено:
  // 1440 при 1,75 — макс 15, при 1,5 в подвале — макс 2), пока она не кончится.
  await page.evaluate(() => { for (const a of document.getAnimations()) { try { a.finish(); } catch { /* бесконечная */ } } });
  if (mut?.css) await page.addStyleTag({ content: mut.css });
  if (mut?.dom) await page.evaluate(mut.dom);
  await page.waitForTimeout(200);
  return { ctx, page, zaprosy, odpowiedzi };
}
const stanZnakow = () => [...document.querySelectorAll('svg.znak')].map((svg) => {
  const cs = (el) => { const s = getComputedStyle(el); return { fill: s.fill, stroke: s.stroke, sw: s.strokeWidth, vis: s.visibility, disp: s.display }; };
  const r = svg.getBoundingClientRect();
  return {
    gde: svg.closest('.hdr') ? 'шапка' : svg.closest('footer') ? 'подвал' : 'иначе',
    rodzic: svg.parentElement?.classList.contains('hdr__brand') ? 'hdr__brand' : svg.parentElement?.classList.contains('ft__brand') ? 'ft__brand' : svg.parentElement?.className ?? '',
    w: r.width, h: r.height,
    attrs: { width: svg.getAttribute('width'), height: svg.getAttribute('height'), viewBox: svg.getAttribute('viewBox') },
    dzieci: [...svg.children].map((c) => c.localName),
    polygony: [...svg.querySelectorAll(':scope > polygon')].map((p) => ({ points: p.getAttribute('points'), ...cs(p) })),
    napisy: [...svg.querySelectorAll(':scope > path')].map((p) => ({ d: p.getAttribute('d'), ...cs(p) })),
    svg: cs(svg),
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
      const sw = n.sw;
      const cvet = forced ? n.stroke : hex(n.stroke);
      if (nuzhna && (!imeetsya || sw !== '0.3px' || cvet !== kraska('ink'))) bledy.push(`${forced ? 'принудительные цвета' : 'обводка'}: ${t}: «${e.imie}» при DPR ${dpr} — обводка ${n.stroke} ${sw}, ждали ${kraska('ink')} 0.3px`);
      if (!nuzhna && imeetsya) bledy.push(`${forced ? 'принудительные цвета' : 'обводка'}: ${t}: «${e.imie}» при DPR ${dpr} — обводка ${n.stroke} ${sw}, ждали без обводки`);
      if (n.vis !== 'visible') bledy.push(`видимость: ${t}: «${e.imie}» visibility ${n.vis}`);
    });
  }
}

async function zdjecie(page, clip) {
  const b = await page.screenshot({ clip, omitBackground: true, animations: 'disabled', caret: 'hide' });
  const { data, info } = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, info };
}
async function porownaj(page, ref, sel, okno) {
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
  await ref.evaluate((css) => { document.getElementById('miejsce').textContent = css; }, miejsce(r));
  await ref.evaluate(({ tryb, sx, sy }) => window.scrollTo({ left: tryb === 'flow' ? sx : 0, top: tryb === 'flow' ? sy : 0, behavior: 'instant' }), r);
  const polozenie = await ref.evaluate(() => { const b = document.querySelector('#r svg').getBoundingClientRect(); return { x: b.x, y: b.y }; });
  if (Math.abs(polozenie.x - r.x) > 0.01 || Math.abs(polozenie.y - r.y) > 0.01) return { blad: `эскиз не встал в точку знака: ${polozenie.x},${polozenie.y} против ${r.x},${r.y}` };
  const x = Math.max(0, Math.floor(r.x) - 2);
  const y = Math.max(0, Math.floor(r.y) - 2);
  const clip = { x, y, width: Math.min(okno.width, Math.ceil(r.x + r.width) + 2) - x, height: Math.min(okno.height, Math.ceil(r.y + r.height) + 2) - y };
  if (clip.width <= 0 || clip.height <= 0) return { blad: `знак вне окна (${JSON.stringify(r)})` };
  // Устойчивый снимок — три подряд одинаковых с паузой 100 мс, не больше восьми снимков.
  const ustojchivy = async (p) => {
    let prev = await zdjecie(p, clip);
    let podryad = 1;
    for (let k = 2; k <= 8; k++) {
      await p.waitForTimeout(100);
      const cur = await zdjecie(p, clip);
      podryad = cur.data.equals(prev.data) ? podryad + 1 : 1;
      if (podryad === 3) return { ...cur, snimkov: k };
      prev = cur;
    }
    return null;
  };
  const a = await ustojchivy(page);
  const b = await ustojchivy(ref);
  if (!a || !b) return { blad: `растр нестабилен (${!a ? 'страница' : 'эскиз'}): восемь снимков одного состояния без трёх одинаковых подряд` };
  if (a.data.length !== b.data.length) return { blad: `размер снимков разный: ${a.info.width}×${a.info.height} и ${b.info.width}×${b.info.height}` };
  let n = 0, max = 0, zalito = 0;
  for (let i = 0; i < a.data.length; i++) { const d = Math.abs(a.data[i] - b.data[i]); if (d) { n++; if (d > max) max = d; } }
  for (let i = 3; i < a.data.length; i += 4) if (a.data[i]) zalito++;
  return { n, max, zalito, snimkov: [a.snimkov, b.snimkov], clip, rect: r };
}
const przewinDo = (page, y) => page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
async function zakryt(page, sel) {
  return page.evaluate((s) => {
    const svg = document.querySelector(s);
    if (!svg) return 'знака нет';
    const bar = svg.querySelector('polygon');
    const r = bar.getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return el && (el === svg || svg.contains(el) || el.contains(svg)) ? null : `в центре перекладины — ${el ? `${el.localName}.${[...el.classList].join('.')}` : 'ничего'}`;
  }, sel);
}

// ── Окно с пикселями (обычное или принудительные цвета) ──────────────────
async function oknoPikseli(browser, w, dpr, mut, forced, zapis, bledy) {
  const okno = vp(w);
  const { ctx, page } = await otkryt(browser, { viewport: okno, deviceScaleFactor: dpr, ...(forced ? { forcedColors: 'active', colorScheme: forced } : {}) }, mut);
  const tag = `${w} DPR ${dpr}${forced ? `, принудительные цвета ${forced}` : ''}`;
  const wynik = { w, dpr, forced: forced ?? null, stany: [] };
  try {
    const ct = forced ? await canvasText(page) : null;
    if (forced) wynik.canvasText = ct;
    await przewinDo(page, 0);
    sadStylu(await page.evaluate(stanZnakow), { tag, dpr, forced, ct }, bledy);
    const zH = await zakryt(page, '.hdr__brand svg.znak');
    if (zH) bledy.push(`перекрыт: ${tag}, шапка: ${zH}`);
    await page.evaluate(() => document.querySelector('.ft__brand svg.znak')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(100);
    const zF = await zakryt(page, '.ft__brand svg.znak');
    if (zF) bledy.push(`перекрыт: ${tag}, подвал: ${zF}`);
    const burgerPokazan = await page.evaluate(() => { const b = document.querySelector('.hdr__burger'); return !!b && getComputedStyle(b).display !== 'none'; });
    await przewinDo(page, 0);
    await page.addStyleTag({ content: SKRYJ });
    // Прогрев: первые снимки страницы после скрытия ещё меняют растр слоя один раз
    // (замерено: 1440 при 1,75 — снимки 1–2 равны, с третьего знак на 1 субпиксель
    // другой и дальше стоит); холостой снимок окна и пауза — до первого состояния.
    await page.waitForLoadState('networkidle');
    await page.screenshot({ omitBackground: true, animations: 'disabled' });
    await page.waitForTimeout(500);
    const ref = await ctx.newPage();
    await ref.setContent(forced ? refHtml(ct, ct) : refHtml(LIT.ink, LIT.accent));
    const stany = [
      { stan: 'вверху', gde: 'шапка', sel: '.hdr__brand svg.znak', prep: async () => { await przewinDo(page, 0); } },
      ...(forced ? [] : [
        { stan: 'при прокрутке', gde: 'шапка', sel: '.hdr__brand svg.znak', prep: async () => { await przewinDo(page, 2000); } },
        { stan: 'наведение', gde: 'шапка', sel: '.hdr__brand svg.znak', prep: async () => {
          await przewinDo(page, 0);
          const b = await page.evaluate(() => { const r = document.querySelector('.hdr__brand').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
          await page.mouse.move(b.x, b.y);
          await page.waitForTimeout(350);
          if (!(await page.evaluate(() => document.querySelector('.hdr__brand').matches(':hover')))) return 'наведение не удалось: ссылка знака не :hover';
        } },
        { stan: 'фокус', gde: 'шапка', sel: '.hdr__brand svg.znak', prep: async () => {
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
        ...(burgerPokazan ? [{ stan: 'ящик открыт', gde: 'шапка', sel: '.hdr__brand svg.znak', prep: async () => {
          await page.evaluate(() => document.activeElement?.blur());
          await page.evaluate(() => document.querySelector('.hdr__burger').click());
          await page.waitForTimeout(400);
          const o = await page.evaluate(() => ({ exp: document.querySelector('.hdr__burger').getAttribute('aria-expanded'), hidden: document.querySelector('.hdr__drawer').hidden }));
          if (o.exp !== 'true' || o.hidden) return `ящик не открылся: aria-expanded ${o.exp}, hidden ${o.hidden}`;
        }, po: async () => { await page.evaluate(() => document.querySelector('.hdr__burger').click()); await page.waitForTimeout(300); } }] : []),
      ]),
      { stan: 'подвал', gde: 'подвал', sel: '.ft__brand svg.znak', prep: async () => {
        await page.evaluate(() => document.querySelector('.ft__brand svg.znak')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
        await page.waitForTimeout(150);
      } },
    ];
    for (const s of stany) {
      const nie = await s.prep();
      if (nie) { bledy.push(`состояние: ${tag}, ${s.stan}: ${nie}`); wynik.stany.push({ stan: s.stan, blad: nie }); continue; }
      const r = await porownaj(page, ref, s.sel, okno);
      await s.po?.();
      wynik.stany.push({ stan: s.stan, gde: s.gde, ...r });
      const imie = s.stan === 'подвал' ? 'подвал' : `шапка, ${s.stan}`;
      if (r.blad) bledy.push(`пиксели: ${imie}: ${tag}: ${r.blad}`);
      else if (r.n) bledy.push(`пиксели: ${imie}: ${tag}: знак ≠ эскиз A — ${r.n} субпикселей, макс ${r.max}`);
      else if (!r.zalito) bledy.push(`пиксели: ${imie}: ${tag}: в рамке знака пусто`);
    }
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
  const { ctx, page } = await otkryt(browser, { viewport: vp(w), deviceScaleFactor: 1 }, mut);
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
async function oknoPrzewin(browser, w, mut, zapis, bledy) {
  const { ctx, page, zaprosy, odpowiedzi } = await otkryt(browser, { viewport: vp(w), deviceScaleFactor: 1 }, mut);
  const wynik = { w };
  try {
    if (w === 1440) {
      const g = await page.evaluate(() => {
        const REL = /(^|\s)(icon|shortcut|apple-touch-icon|apple-touch-icon-precomposed|mask-icon|manifest|fluid-icon)(\s|$)/i;
        const linki = [...document.querySelectorAll('link')].filter((l) => REL.test(l.getAttribute('rel') ?? '')).map((l) => ({ wHead: l.parentElement === document.head, attrs: Object.fromEntries([...l.attributes].map((a) => [a.name, a.value])), href: l.href }));
        const a = document.querySelector('.hdr__brand');
        return { linki, base: document.querySelectorAll('base').length, brand: a?.href ?? null };
      });
      wynik.glowa = g;
      const norm = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
      if (g.linki.length !== LINKI.length) bledy.push(`голова: ссылок-иконок ${g.linki.length}, ждали ровно ${LINKI.length}`);
      g.linki.forEach((l, i) => {
        if (!l.wHead) bledy.push(`голова: ссылка ${i + 1} (${l.attrs.href}) не в <head>`);
        if (!LINKI[i] || norm(l.attrs) !== norm(LINKI[i])) bledy.push(`голова: ссылка ${i + 1} — ${JSON.stringify(l.attrs)}, ждали ${JSON.stringify(LINKI[i] ?? null)}`);
        if (new URL(l.href).origin !== ORIGIN) bledy.push(`голова: ссылка ${i + 1} ведёт на ${l.href} — не свой сервер`);
      });
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
      const pliki = [];
      for (const r of odpowiedzi) {
        const u = new URL(r.url());
        if (u.origin !== ORIGIN || r.status() !== 200) continue;
        const buf = await r.body().catch(() => null);
        const f = plikDist(u.pathname);
        const dist = existsSync(f) && statSync(f).isFile() ? readFileSync(f) : null;
        const rowny = !!buf && !!dist && buf.equals(dist);
        pliki.push({ put: u.pathname, sha256: buf ? sha(buf) : null, rowny_dist: rowny });
        if (!rowny) bledy.push(`сборка: ${w}: ${u.pathname} — ответ сервера ${buf ? `sha256 ${sha(buf).slice(0, 12)}` : 'без тела'} не равен dist/ (${dist ? sha(dist).slice(0, 12) : 'файла нет'})`);
      }
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
async function ikony(bledy) {
  const wynik = [];
  const pobierz = async (p) => Buffer.from(await (await fetch(ORIGIN + p)).arrayBuffer());
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

// ── Суд ──────────────────────────────────────────────────────────────────
async function sud(browser, zestaw, mut) {
  const bledy = [];
  const zapis = { piksele: [], forced: [], dostepnost: [], przewin: [] };
  for (const [w, dpr] of zestaw.piksele) await oknoPikseli(browser, w, dpr, mut, null, zapis.piksele, bledy);
  for (const [w, dpr, sch] of zestaw.forced) await oknoPikseli(browser, w, dpr, mut, sch, zapis.forced, bledy);
  for (const w of zestaw.ax) await oknoDrzewa(browser, w, mut, zapis.dostepnost, bledy);
  for (const w of zestaw.przewin) await oknoPrzewin(browser, w, mut, zapis.przewin, bledy);
  return { bledy, zapis };
}
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim();
const ZAMERY = join(RAPORT, 'zamery');

const browser = await chromium.launch({ executablePath: CHROME });
const wersja = browser.version();
console.log(`браузер: Chromium ${wersja}; страница ${URL_}`);
const shapka = {
  sud: 'wiernosc.mjs',
  adres: URL_,
  brauzer: `Chromium ${wersja}`,
  chrome: CHROME,
  kommit: git('rev-parse', 'HEAD'),
  gryaz_sajta: git('status', '--porcelain', '--', 'sites/7thserpent.com').split('\n').filter(Boolean),
  eskiz: PINY,
};
mkdirSync(ZAMERY, { recursive: true });
try {
  if (!SELFTEST) {
    const { bledy, zapis } = await sud(browser, PELNY, null);
    zapis.ikony = await ikony(bledy);
    for (const k of zapis.piksele.concat(zapis.forced)) console.log(`  ${k.w} DPR ${k.dpr}${k.forced ? ` принудительные ${k.forced}` : ''}: ${k.stany.map((s) => `${s.stan} ${s.blad ? 'ОТКАЗ' : s.n}`).join('; ')}`);
    writeFileSync(join(ZAMERY, 'wiernosc.json'), JSON.stringify({ ...shapka, bledy, ...zapis }, null, 2) + '\n');
    if (bledy.length) {
      console.error(`wiernosc: ОТКАЗ — ${bledy.length}`);
      for (const b of bledy) console.error(`  - ${b}`);
      process.exitCode = 1;
    } else console.log(`wiernosc: сверено — знак шапки и подвала равен эскизу A (${PELNY.piksele.length} окон и ${PELNY.forced.length} с принудительными цветами), голова, дерево доступности, запросы, сборка = dist/, иконки = эскиз; выгрузка zamery/wiernosc.json`);
  } else {
    const wyniki = [];
    const czysty = await sud(browser, KROTKI, null);
    await ikony(czysty.bledy);
    wyniki.push({ nazwa: 'чистая страница', zhdem: null, ok: czysty.bledy.length === 0, bledy: czysty.bledy });
    console.log(`${czysty.bledy.length ? 'НЕТ' : 'ok '}  чистая страница: ждём сверено, факт ${czysty.bledy.length ? `отказ (${czysty.bledy.length}): ${czysty.bledy[0]}` : 'сверено'}`);
    for (const m of MUTACJE) {
      const { bledy } = await sud(browser, KROTKI, m);
      const trafil = bledy.find((b) => b.startsWith(m.zhdem));
      wyniki.push({ nazwa: m.nazwa, zhdem: m.zhdem, ok: !!trafil, bledy });
      console.log(`${trafil ? 'ok ' : 'НЕТ'}  ${m.nazwa}: ждём отказ «${m.zhdem}», факт ${bledy.length ? `отказ (${bledy.length}): ${trafil ?? bledy[0]}` : 'сверено'}`);
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
  await browser.close();
}
