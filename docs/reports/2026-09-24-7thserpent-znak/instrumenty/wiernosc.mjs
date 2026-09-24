// Судья «знак на сайте = одобренный эскиз» (сессия 11, П83; «судью судят», раунд 1:
// R1-VNEDRENIE-1 — сборка отличалась от эскиза A, и ни один судья этого не видел).
//
//   node wiernosc.mjs [адрес]      (по умолчанию прод-превью http://localhost:4331/)
//
// Что судит, exit 1 при любом расхождении:
//  1. Пиксели шапки (полоса 0–68 во всю ширину окна): собранная страница как есть
//     против той же страницы, где в .hdr__brand подставлен znak.html эскиза
//     (docs/reports/2026-09-24-7thserpent-znak/voprosy/A-semerka-trassa/). 1440 и 390,
//     DPR 1, 1,25, 1,5 и 2. Ждём 0 различий: реализация рисует ровно эскиз.
//  2. Вычисленный stroke-width у надписей знака в шапке и подвале при DPR 1, 1,25,
//     1,5, 1,51 и 2: «TH» — 0.3px при плотности до 1,5 и 0px выше; «SERPENT» — 0px
//     везде (как у эскиза: обводка — только оптическая поправка «TH»).
//  3. Режим принудительных цветов (эмуляция, светлая и тёмная схема): заливка всех
//     частей знака в шапке и подвале — системный цвет текста (CanvasText), а не снег
//     и фонарь (R1-VNEDRENIE-3).
// ПРЕДЕЛЫ: один движок (Chromium из кеша Playwright, версия печатается); эмуляция
// принудительных цветов — не настоящая контрастная тема Windows; эскиз подставляется
// в шапку, подвал судится только по пункту 2 и 3 (у эскиза подвала не было).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire('C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json')('playwright-core');
const sharp = createRequire('D:/SEO/cloud/site-generator/package.json')('sharp');
const URL_ = process.argv[2] ?? 'http://localhost:4331/';
const eskiz = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'voprosy', 'A-semerka-trassa', 'znak.html'), 'utf8');

const browser = await chromium.launch({ executablePath: 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
console.log(`браузер: Chromium ${browser.version()}; страница ${URL_}`);
const bledy = [];

const otkryt = async (w, dpr, extra = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: w > 500 ? 900 : 844 }, deviceScaleFactor: dpr, ...extra });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  return { ctx, page };
};
const polosa = async (page, w) => {
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: 68 } });
  return sharp(buf).raw().toBuffer();
};

// 1. Пиксели шапки против эскиза.
for (const w of [1440, 390]) {
  for (const dpr of [1, 1.25, 1.5, 2]) {
    const { ctx, page } = await otkryt(w, dpr);
    const kakEst = await polosa(page, w);
    await page.evaluate((html) => { document.querySelector('.hdr__brand').innerHTML = html; }, eskiz);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const eskizBuf = await polosa(page, w);
    let n = 0, max = 0;
    for (let i = 0; i < kakEst.length; i++) { const d = Math.abs(kakEst[i] - eskizBuf[i]); if (d) { n++; if (d > max) max = d; } }
    console.log(`  шапка ${w} DPR ${dpr}: против эскиза — ${n} субпикселей${n ? `, макс ${max}` : ''}`);
    if (n) bledy.push(`шапка ${w} при DPR ${dpr} отличается от эскиза A: ${n} субпикселей, макс ${max}`);
    await ctx.close();
  }
}

// 2. Вычисленная обводка надписей.
for (const dpr of [1, 1.25, 1.5, 1.51, 2]) {
  const { ctx, page } = await otkryt(1440, dpr);
  const sw = await page.evaluate(() => [...document.querySelectorAll('svg.znak')].map((svg) => ({
    gde: svg.closest('.hdr') ? 'шапка' : 'подвал',
    paths: [...svg.querySelectorAll('path')].map((p) => ({ obwodka: p.classList.contains('znak__obwodka'), sw: getComputedStyle(p).strokeWidth, stroke: getComputedStyle(p).stroke })),
  })));
  for (const { gde, paths } of sw) {
    for (const p of paths) {
      const zhdali = p.obwodka && dpr <= 1.5 ? '0.3px' : '0px';
      const fakt = p.stroke === 'none' ? '0px' : p.sw;
      if (fakt !== zhdali) bledy.push(`${gde}, надпись ${p.obwodka ? '«TH»' : '«SERPENT»'} при DPR ${dpr}: обводка ${fakt} (stroke ${p.stroke}), ждали ${zhdali}`);
    }
    console.log(`  обводка DPR ${dpr}, ${gde}: ${paths.map((p) => `${p.obwodka ? 'TH' : 'SERPENT'} ${p.stroke === 'none' ? '0px' : p.sw}`).join(', ')}`);
  }
  await ctx.close();
}

// 3. Принудительные цвета.
for (const colorScheme of ['light', 'dark']) {
  const { ctx, page } = await otkryt(1440, 1, { forcedColors: 'active', colorScheme });
  const r = await page.evaluate(() => {
    const t = document.createElement('div');
    t.style.color = 'CanvasText';
    document.body.append(t);
    const canvasText = getComputedStyle(t).color;
    t.remove();
    const fills = [...document.querySelectorAll('svg.znak polygon, svg.znak path')].map((el) => getComputedStyle(el).fill);
    return { canvasText, fills, bg: getComputedStyle(document.body).backgroundColor };
  });
  const chuzhie = r.fills.filter((f) => f !== r.canvasText);
  console.log(`  принудительные цвета, ${colorScheme}: CanvasText ${r.canvasText}, фон ${r.bg}; частей ${r.fills.length}, не CanvasText — ${chuzhie.length}`);
  if (chuzhie.length) bledy.push(`принудительные цвета (${colorScheme}): ${chuzhie.length} частей знака не CanvasText — ${[...new Set(chuzhie)].join(', ')}`);
  await ctx.close();
}

await browser.close();
if (bledy.length) {
  console.error(`wiernosc: ОТКАЗ — ${bledy.length}`);
  for (const b of bledy) console.error(`  - ${b}`);
  process.exit(1);
}
console.log('wiernosc: знак на сайте равен эскизу A (шапка 1440 и 390, DPR 1–2), обводка «TH» — по плотности, принудительные цвета — CanvasText');
