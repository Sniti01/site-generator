// Материалы приёмки глазами знака и фавикона (сессия 11, П83 п. 4): собранная главная
// (прод-превью, порт 4331 — сборка c1ec5e6, на которой снят эталон), без подстановок.
//
//   node materialy-priemki.mjs <папка вывода> [адрес]
//
// Пишет:
//   shapka-1440.png      — шапка 1440 при DPR 1 (как на мониторе) и DPR 2 (крупно)
//   shapka-390.png       — шапка телефона 390 при DPR 3 (пиксели телефона)
//   yashchik-390.png     — открытый ящик меню, 390, DPR 3
//   pervy-ekran-1440.png — первый экран 1440, DPR 1
//   pervy-ekran-390.png  — первый экран 390, DPR 3
//   podval-1440.png, podval-390.png — подвал со знаком
//   fokus-1440.png       — фокус с клавиатуры на ссылке знака, DPR 2
//   ikony.png            — файлы public/: favicon.svg, PNG 16 и 32 по пикселям (×4),
//                          icon-192, apple-touch-icon со скруглением iOS, оба размера ICO
//   znak-dpr1-x4.png     — знак в шапке 1440 при DPR 1, по пикселям ×4 (как «TH» выглядит
//                          на обычном мониторе, с оптической обводкой)
//   materialy.json       — версия браузера и адрес (кадры сняты Chromium из кеша Playwright,
//                          эталон — Playwright MCP; сверка кадров с эталоном — frames.mjs)
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const { chromium } = createRequire('C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json')('playwright-core');
const sharp = createRequire('D:/SEO/cloud/site-generator/package.json')('sharp');
const [, , out, url = 'http://localhost:4331/'] = process.argv;
mkdirSync(out, { recursive: true });
const PUB = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/public';

const browser = await chromium.launch({ executablePath: 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const otkryt = async (w, h, dpr) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const vid = [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
    await Promise.race([Promise.all(vid.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))), new Promise((r) => setTimeout(r, 3000))]);
  });
  await page.waitForTimeout(300);
  return { ctx, page };
};
// Подвал: верх подвала — сразу под липкой шапкой (69 px с волосом), кадр — ниже шапки.
// На 390 подвал выше окна: прокрутка до низа увела бы знак подвала за край.
const podval = async (page, file, w) => {
  await page.evaluate(() => {
    const ft = document.querySelector('.ft');
    // instant: у сайта плавная прокрутка (DESIGN.md, «Правило одного движения»).
    window.scrollTo({ top: ft.getBoundingClientRect().top + window.scrollY - 69, behavior: 'instant' });
  });
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => { const b = document.querySelector('.ft').getBoundingClientRect(); return { y: Math.max(69, b.top), bottom: Math.min(innerHeight, b.bottom) }; });
  writeFileSync(join(out, file), await page.screenshot({ clip: { x: 0, y: r.y, width: w, height: Math.min(r.bottom - r.y, 420) } }));
};

writeFileSync(join(out, 'materialy.json'), JSON.stringify({ браузер: `Chromium ${browser.version()}`, адрес: url }, null, 2) + '\n');

{ // 1440, DPR 1
  const { ctx, page } = await otkryt(1440, 900, 1);
  const a = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 68 } });
  const br = await page.evaluate(() => { const b = document.querySelector('.hdr__brand').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
  const znak1 = await page.screenshot({ clip: { x: br.x - 6, y: br.y - 6, width: br.w + 12, height: br.h + 12 } });
  const m1 = await sharp(znak1).metadata();
  writeFileSync(join(out, 'znak-dpr1-x4.png'), await sharp(znak1).resize(m1.width * 4, m1.height * 4, { kernel: 'nearest' }).png().toBuffer());
  writeFileSync(join(out, 'pervy-ekran-1440.png'), await page.screenshot());
  await podval(page, 'podval-1440.png', 1440);
  await ctx.close();
  const { ctx: c2, page: p2 } = await otkryt(1440, 900, 2);
  const b = await p2.screenshot({ clip: { x: 100, y: 0, width: 760, height: 68 } });
  await p2.keyboard.press('Tab');
  await p2.keyboard.press('Tab');
  await p2.waitForTimeout(200);
  writeFileSync(join(out, 'fokus-1440.png'), await p2.screenshot({ clip: { x: 100, y: 0, width: 420, height: 68 } }));
  await c2.close();
  // Шапка: DPR 1 во всю ширину и DPR 2 левая часть — одной картинкой.
  const A = await sharp(a).metadata();
  const B = await sharp(b).metadata();
  const W = Math.max(A.width, B.width);
  writeFileSync(join(out, 'shapka-1440.png'), await sharp({ create: { width: W, height: A.height + 16 + B.height, channels: 4, background: '#2a2f36' } })
    .composite([{ input: a, top: 0, left: 0 }, { input: b, top: A.height + 16, left: 0 }]).png().toBuffer());
}
{ // 390, DPR 3
  const { ctx, page } = await otkryt(390, 844, 3);
  writeFileSync(join(out, 'shapka-390.png'), await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 68 } }));
  writeFileSync(join(out, 'pervy-ekran-390.png'), await page.screenshot());
  await page.click('.hdr__burger');
  await page.waitForTimeout(300);
  writeFileSync(join(out, 'yashchik-390.png'), await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 380 } }));
  await page.click('.hdr__burger');
  await page.waitForTimeout(200);
  await podval(page, 'podval-390.png', 390);
  await ctx.close();
}
{ // Иконки
  const b64 = (f, mime) => `data:${mime};base64,${readFileSync(join(PUB, f)).toString('base64')}`;
  const ico = readFileSync(join(PUB, 'favicon.ico'));
  const entries = [];
  for (let i = 0; i < ico.readUInt16LE(4); i++) {
    const e = 6 + 16 * i;
    entries.push({ size: ico.readUInt8(e) || 256, png: ico.subarray(ico.readUInt32LE(e + 12), ico.readUInt32LE(e + 12) + ico.readUInt32LE(e + 8)) });
  }
  const cell = (label, img) => `<div style="text-align:center;font:12px 'Segoe UI',sans-serif;color:#cfd6dc">${img}<div style="margin-top:6px">${label}</div></div>`;
  const html = `<!doctype html><html><body style="margin:0;padding:20px;background:#2a2f36;display:flex;gap:28px;align-items:flex-end">
${cell('favicon.svg · 64', `<img src="${b64('favicon.svg', 'image/svg+xml')}" width="64" height="64">`)}
${cell('favicon-16x16.png · ×4', `<img src="${b64('favicon-16x16.png', 'image/png')}" width="64" height="64" style="image-rendering:pixelated">`)}
${cell('favicon-32x32.png · ×2', `<img src="${b64('favicon-32x32.png', 'image/png')}" width="64" height="64" style="image-rendering:pixelated">`)}
${entries.map((e) => cell(`favicon.ico · ${e.size} · ×${64 / e.size}`, `<img src="data:image/png;base64,${e.png.toString('base64')}" width="64" height="64" style="image-rendering:pixelated">`)).join('')}
${cell('icon-192.png · 96', `<img src="${b64('icon-192.png', 'image/png')}" width="96" height="96">`)}
${cell('apple-touch-icon.png · как на iOS', `<img src="${b64('apple-touch-icon.png', 'image/png')}" width="90" height="90" style="border-radius:20px">`)}
</body></html>`;
  const ctx = await browser.newContext({ viewport: { width: 900, height: 100 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  writeFileSync(join(out, 'ikony.png'), await page.screenshot({ fullPage: true }));
  await ctx.close();
}
await browser.close();
console.log('готово:', out);
