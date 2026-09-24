// Контраст знака над содержимым под полупрозрачной шапкой (сессия 11, П83).
// Шапка ядра — `color-mix(in oklab, var(--bg) 88%, transparent)` с размытием: над артом
// и панелями фон под знаком — составное сочетание, гейт контраста его не считает
// (gates/contrast.mjs, «полупрозрачная шапка поверх содержимого»).
//
// ГАРАНТИЯ — ГРАНИЦА. Размытие усредняет подложку и светлее белого её не сделает, поэтому
// худший фон под шапкой — шапка над белым. Инструмент кладёт под шапку белый лист
// (fixed, z-index ниже шапки), снимает фон шапки с экрана и считает контраст красок знака
// (фонарь, снег) и обводки фокуса (фонарь по тексту) против него — при любом содержимом,
// ширине и прокрутке. Пересчитывать, если меняются доля color-mix шапки, токен --bg или
// порядок слоёв. Зерно граница не учитывает — как и пары гейта (абзац о зерне
// в gates/contrast.mjs).
//
// ЗАМЕР — ИЛЛЮСТРАЦИЯ. Прокрутка всей страницы шагом 5 px (мгновенная: у сайта плавная
// прокрутка), знак скрыт, зерно снято (display: none), снимок — ВСЯ полоса шапки
// во всю ширину окна, рамка знака вырезается в памяти: снимок, обрезанный по рамке,
// считает размытие шапки по обрезанной подложке и даёт не тот фон («судью судят»,
// раунд 1, R1-KONTRAST-2). Худший пиксель фона — самый светлый: краски знака светлые
// на тёмном. Это минимум по выборке, не граница.
//
//   node kontrast-znaka.mjs [адрес]
import { createRequire } from 'node:module';
const { chromium } = createRequire('C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json')('playwright-core');
const sharp = createRequire('D:/SEO/cloud/site-generator/package.json')('sharp');
const URL_ = process.argv[2] ?? 'http://localhost:4331/';

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const cr = (a, b) => +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);

const browser = await chromium.launch({ executablePath: 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const wynik = { браузер: `Chromium ${browser.version()}`, адрес: URL_ };

const przygotuj = async (page) => {
  await page.goto(URL_, { waitUntil: 'load' });
  return page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto';
    await document.fonts.ready;
    for (const i of document.images) i.loading = 'eager';
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    for (const g of document.querySelectorAll('.grain')) g.style.display = 'none';
    const css = getComputedStyle(document.documentElement);
    const krasy = Object.fromEntries(['accent', 'ink', 'accent-text'].map((t) => [t, css.getPropertyValue(`--${t}`).trim()]));
    const b = document.querySelector('.hdr__brand').getBoundingClientRect();
    return { krasy, ramka: { x: Math.floor(b.x), y: Math.floor(b.y), w: Math.ceil(b.width), h: Math.ceil(b.height) }, H: document.body.scrollHeight, niezaladowane: [...document.images].filter((i) => !(i.complete && i.naturalWidth > 0)).length };
  });
};
const wyciag = async (page, w, r, dpr) => {
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: 69 } });
  const { data, info } = await sharp(buf).extract({ left: Math.round(r.x * dpr), top: Math.round(r.y * dpr), width: Math.round(r.w * dpr), height: Math.round(r.h * dpr) }).raw().toBuffer({ resolveWithObject: true });
  let naj = { L: -1 };
  for (let i = 0; i < data.length; i += info.channels) {
    const l = L(data[i], data[i + 1], data[i + 2]);
    if (l > naj.L) naj = { L: l, rgb: [data[i], data[i + 1], data[i + 2]] };
  }
  return naj;
};

for (const [w, h, dpr] of [[390, 844, 1], [1440, 900, 1], [390, 844, 2], [1440, 900, 2]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const p = await przygotuj(page);
  const K = Object.fromEntries(Object.entries(p.krasy).map(([k, v]) => [k, L(...hex(v))]));
  await page.evaluate(() => { document.querySelector('.hdr__brand .znak').style.visibility = 'hidden'; });
  // Граница: белый лист под шапкой.
  await page.evaluate(() => {
    const list = document.createElement('div');
    list.id = 'bialy-list';
    list.style.cssText = 'position:fixed;inset:0 0 auto 0;height:80px;background:#fff;z-index:49';
    document.body.append(list);
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(150);
  const gran = await wyciag(page, w, p.ramka, dpr);
  await page.evaluate(() => document.getElementById('bialy-list').remove());
  // Замер: вся страница шагом 5.
  let naj = { L: -1 };
  for (let y = 0; y <= p.H - h; y += 5) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(30);
    const n = await wyciag(page, w, p.ramka, dpr);
    if (n.L > naj.L) naj = { ...n, y };
  }
  wynik[`${w} DPR ${dpr}`] = {
    незагружено_картинок: p.niezaladowane,
    граница_фон_над_белым: `rgb(${gran.rgb.join(' ')})`,
    граница: { фонарь: cr(K.accent, gran.L), снег: cr(K.ink, gran.L), обводка_фокуса: cr(K['accent-text'], gran.L) },
    замер_худший_фон: `rgb(${naj.rgb.join(' ')}) при scrollY ${naj.y}`,
    замер: { фонарь: cr(K.accent, naj.L), снег: cr(K.ink, naj.L) },
  };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(wynik, null, 2));
