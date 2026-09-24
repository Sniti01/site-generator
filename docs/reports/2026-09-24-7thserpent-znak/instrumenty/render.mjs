// Лист эскиза знака (сессия 11, П83): знак подставляется в настоящую шапку
// собранной главной (прод-превью на порту 4331) и снимается там, где владелец
// будет его принимать: шапка 1440, шапка над кадром после прокрутки, знак
// крупно, 961 (самая узкая строка меню), 390 — шапка и открытый ящик меню;
// фавикон — во вкладке (светлая и тёмная полоса, DPR 1 и 2), запасные PNG
// 16/32/48/192 и apple-touch-icon 180 на домашнем экране.
//
//   node render.mjs <папка варианта>
//
// В папке варианта: `znak.html` — фрагмент внутрь `.hdr__brand` (цвета —
// var(--токен) темы), `favicon.svg` (квадрат, цвета литералами токенов),
// необязательно `favicon-16.svg` (свой рисунок для 16 px).
// Пишет в ту же папку `list.png` и `mery.json` (размеры знака, высота
// шапки, переполнение меню на 961).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const { chromium } = createRequire('C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json')('playwright-core');
const sharp = createRequire('D:/SEO/cloud/site-generator/package.json')('sharp');

const dir = resolve(process.argv[2] ?? '.');
const URL_ = process.env.ZNAK_URL ?? 'http://localhost:4331/';
const frag = readFileSync(join(dir, 'znak.html'), 'utf8');
const favSvg = readFileSync(join(dir, 'favicon.svg'));
const fav16Path = join(dir, 'favicon-16.svg');
const fav16Svg = existsSync(fav16Path) ? readFileSync(fav16Path) : favSvg;

const b64 = (buf, mime) => `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;

async function svgToPng(svg, size) {
  const m = /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)"/.exec(svg.toString());
  const w = m ? Number(m[1]) : 32;
  return sharp(svg, { density: Math.max(1, (72 * size) / w) }).resize(size, size).png().toBuffer();
}

const browser = await chromium.launch({ executablePath: 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const mery = {};

async function withPage(opts, fn) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate((html) => {
    document.querySelector('.hdr__brand').innerHTML = html;
  }, frag);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const out = await fn(page);
  await ctx.close();
  return out;
}

const shots = {};

shots.h1440 = await withPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, async (page) => {
  mery['1440'] = await page.evaluate(() => {
    const b = document.querySelector('.hdr__brand').getBoundingClientRect();
    const h = document.querySelector('.hdr').getBoundingClientRect();
    return { znak: [b.x, b.y, b.width, b.height].map((v) => +v.toFixed(2)), shapka: +h.height.toFixed(2) };
  });
  const a = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 68 } });
  await page.evaluate(() => window.scrollTo(0, 1180));
  await page.waitForTimeout(400);
  const b = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 68 } });
  return { a, b };
});

shots.zoom = await withPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 }, async (page) => {
  const r = await page.evaluate(() => {
    const b = document.querySelector('.hdr__brand').getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
  return page.screenshot({ clip: { x: Math.max(0, r.x - 16), y: 0, width: r.w + 32, height: 68 } });
});

shots.h961 = await withPage({ viewport: { width: 961, height: 800 }, deviceScaleFactor: 1 }, async (page) => {
  mery['961'] = await page.evaluate(() => {
    const nav = document.querySelector('.hdr__nav');
    const list = document.querySelector('.hdr__list');
    const b = document.querySelector('.hdr__brand').getBoundingClientRect();
    return {
      znak: [b.x, b.y, b.width, b.height].map((v) => +v.toFixed(2)),
      menuPerepolneno: list.scrollWidth > nav.clientWidth + 0.5,
      menu: [list.scrollWidth, nav.clientWidth],
    };
  });
  return page.screenshot({ clip: { x: 0, y: 0, width: 961, height: 68 } });
});

shots.m390 = await withPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }, async (page) => {
  mery['390'] = await page.evaluate(() => {
    const b = document.querySelector('.hdr__brand').getBoundingClientRect();
    const h = document.querySelector('.hdr').getBoundingClientRect();
    return { znak: [b.x, b.y, b.width, b.height].map((v) => +v.toFixed(2)), shapka: +h.height.toFixed(2) };
  });
  const a = await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 68 } });
  await page.click('.hdr__burger');
  await page.waitForTimeout(300);
  const b = await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 380 } });
  return { a, b };
});

// Иконки: SVG как есть (браузер) и запасные PNG (sharp — тот же путь, что у инструмента).
const png = {};
for (const s of [16, 32, 48, 180, 192]) png[s] = await svgToPng(s === 16 ? fav16Svg : favSvg, s);
for (const s of [16, 32, 180]) writeFileSync(join(dir, `png-${s}.png`), png[s]);

const tabHtml = (dpr) => `<!doctype html><html><body style="margin:0;font:12px 'Segoe UI',system-ui,sans-serif">
${[
  ['#dee1e6', '#ffffff', '#1f1f1f', 'светлая'],
  ['#1f1f1f', '#3c3c3c', '#e3e3e3', 'тёмная'],
]
  .map(
    ([strip, tab, ink]) => `<div style="background:${strip};height:40px;display:flex;align-items:flex-end;padding:0 8px;gap:2px">
  <div style="background:${tab};color:${ink};height:32px;width:240px;border-radius:8px 8px 0 0;display:flex;align-items:center;gap:8px;padding:0 12px;box-sizing:border-box">
    <img src="${b64(favSvg, 'image/svg+xml')}" width="16" height="16"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Max Payne — all games in order</span></div>
  <div style="color:${ink};opacity:.7;height:32px;width:200px;display:flex;align-items:center;gap:8px;padding:0 12px;box-sizing:border-box">
    <img src="${b64(png[16], 'image/png')}" width="16" height="16"><span>PNG 16 — запасной</span></div>
  <div style="color:${ink};opacity:.7;height:32px;width:200px;display:flex;align-items:center;gap:8px;padding:0 12px;box-sizing:border-box">
    <img src="${b64(png[32], 'image/png')}" width="16" height="16"><span>PNG 32 → 16</span></div>
</div>`,
  )
  .join('')}</body></html>`;

async function htmlShot(html, dpr, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  const b = await page.screenshot({ fullPage: true });
  await ctx.close();
  return b;
}

shots.tab1 = await htmlShot(tabHtml(1), 1, 680, 80);
shots.tab2 = await htmlShot(tabHtml(2), 2, 680, 80);

const homeHtml = `<!doctype html><html><body style="margin:0;background:linear-gradient(160deg,#3a4a63,#8a6f86 60%,#d9a38a);width:420px;height:150px;display:flex;align-items:center;gap:28px;padding:0 24px;box-sizing:border-box;font:11px -apple-system,'Segoe UI',sans-serif;color:#fff">
<div style="text-align:center"><img src="${b64(png[180], 'image/png')}" width="60" height="60" style="border-radius:13px;display:block"><div style="margin-top:6px">7thserpent</div></div>
${[16, 32, 48, 192].map((s) => `<div style="text-align:center"><img src="${b64(png[s], 'image/png')}" width="${Math.min(s, 64)}" height="${Math.min(s, 64)}" style="image-rendering:pixelated;display:block;margin:auto"><div style="margin-top:6px">${s}</div></div>`).join('')}
</body></html>`;
shots.home = await htmlShot(homeHtml, 2, 420, 150);

await browser.close();

// Сборка листа.
const img = (buf) => `<img src="${b64(buf, 'image/png')}" style="display:block;max-width:100%">`;
const sec = (t, body) => `<section style="margin:0 0 18px"><h2 style="font:600 13px 'Segoe UI',sans-serif;color:#a1abb3;margin:0 0 6px;letter-spacing:.04em">${t}</h2>${body}</section>`;
const sheet = `<!doctype html><html><body style="margin:0;padding:20px;background:#2a2f36;width:1440px;box-sizing:content-box">
${sec('Шапка 1440 · DPR 1 · первый экран', img(shots.h1440.a))}
${sec('Шапка 1440 · DPR 1 · после прокрутки (над панелями ряда)', img(shots.h1440.b))}
${sec('Знак крупно · DPR 3', `<div style="background:#000;display:inline-block">${img(shots.zoom)}</div>`)}
${sec('Шапка 961 · DPR 1 · самая узкая строка меню', img(shots.h961))}
<div style="display:flex;gap:24px;align-items:flex-start">
${sec('390 · DPR 2 · шапка', `<div style="width:390px">${img(shots.m390.a)}</div>`)}
${sec('390 · DPR 2 · открытый ящик меню', `<div style="width:390px">${img(shots.m390.b)}</div>`)}
<div>
${sec('Вкладка · DPR 1', img(shots.tab1))}
${sec('Вкладка · DPR 2', `<div style="width:680px">${img(shots.tab2)}</div>`)}
${sec('apple-touch-icon 180 → 60 · запасные PNG', `<div style="width:420px">${img(shots.home)}</div>`)}
</div>
</div>
</body></html>`;
const b2 = await chromium.launch({ executablePath: 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const ctx = await b2.newContext({ viewport: { width: 1480, height: 900 }, deviceScaleFactor: 1 });
const pg = await ctx.newPage();
await pg.setContent(sheet, { waitUntil: 'load' });
writeFileSync(join(dir, 'list.png'), await pg.screenshot({ fullPage: true }));
await b2.close();
writeFileSync(join(dir, 'mery.json'), JSON.stringify(mery, null, 2) + '\n');
console.log(JSON.stringify(mery));
