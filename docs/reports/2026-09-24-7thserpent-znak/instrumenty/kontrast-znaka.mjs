// Замер контраста знака над содержимым под полупрозрачной шапкой (сессия 11, П83).
// Шапка ядра — `color-mix(in oklab, var(--bg) 88%, transparent)` с размытием: над артом
// и панелями фон под знаком — составное сочетание, гейт контраста его не считает
// (gates/contrast.mjs, «полупрозрачная шапка поверх содержимого»). Замер — как правило
// замера по пикселю DESIGN.md: знак скрыт, зерно снято, берётся худший (самый светлый
// по относительной яркости) пиксель фона в рамке знака; контраст красок знака (фонарь
// и снег) против него — по формуле WCAG. Прокрутка — вся страница шагом 20 px на 390
// и 1440, DPR 1; страница грузится один раз на ширину, картинки — после прокрутки.
//
//   node kontrast-znaka.mjs [адрес]
import { createRequire } from 'node:module';
const { chromium } = createRequire('C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json')('playwright-core');
const sharp = createRequire('D:/SEO/cloud/site-generator/package.json')('sharp');
const URL_ = process.argv[2] ?? 'http://localhost:4331/';

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const KRASKI = { accent: L(...hex('#eca84a')), ink: L(...hex('#e5eaee')) };

const browser = await chromium.launch({ executablePath: 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const wynik = {};
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'load' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y <= document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    await Promise.race([
      Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
    document.querySelector('.hdr__brand .znak').style.visibility = 'hidden';
    for (const g of document.querySelectorAll('.grain, [class*="grain"]')) g.style.display = 'none';
  });
  const r = await page.evaluate(() => { const b = document.querySelector('.hdr__brand').getBoundingClientRect(); return { x: Math.floor(b.x), y: Math.floor(b.y), w: Math.ceil(b.width), h: Math.ceil(b.height) }; });
  const H = await page.evaluate(() => document.body.scrollHeight);
  let najgorszy = { L: -1 };
  for (let y = 0; y <= H - h; y += 20) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(40);
    const buf = await page.screenshot({ clip: { x: r.x, y: r.y, width: r.w, height: r.h } });
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      const l = L(data[i], data[i + 1], data[i + 2]);
      if (l > najgorszy.L) najgorszy = { L: l, y, rgb: [data[i], data[i + 1], data[i + 2]] };
    }
  }
  wynik[w] = {
    рамка: r,
    худший_фон: `rgb(${najgorszy.rgb.join(' ')}) при scrollY ${najgorszy.y}`,
    фонарь: +cr(KRASKI.accent, najgorszy.L).toFixed(2),
    снег: +cr(KRASKI.ink, najgorszy.L).toFixed(2),
  };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(wynik, null, 2));
