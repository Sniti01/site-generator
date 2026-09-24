// Запас строки меню шапки при знаке сайта (сессия 11; «судью судят», раунд 1, R1-POLNOTA-4:
// «не переполнено» из render.mjs запаса не видит — scrollWidth списка не бывает меньше
// clientWidth). Собранная страница, без подстановок: на каждой ширине от 961 до 1180 px
// (от 961 меню в строке, до 1180 зазор пунктов sm) — правый край последнего пункта меню
// против правого края контейнера шапки и зазор между знаком и первым пунктом; на 320–960
// (меню в ящике) — зазор между знаком и бургером.
//   node zapas-menu.mjs [адрес]
import { createRequire } from 'node:module';
const { chromium } = createRequire('C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json')('playwright-core');
const URL_ = process.argv[2] ?? 'http://localhost:4331/';
const browser = await chromium.launch({ executablePath: 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
const ctx = await browser.newContext({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(URL_, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const menu = { min: Infinity, gdzie: null }, burger = { min: Infinity, gdzie: null };
for (let w = 320; w <= 1180; w++) {
  await page.setViewportSize({ width: w, height: 800 });
  const r = await page.evaluate(() => {
    const inner = document.querySelector('.hdr__inner').getBoundingClientRect();
    const brand = document.querySelector('.hdr__brand').getBoundingClientRect();
    const items = [...document.querySelectorAll('.hdr__list > li')].map((li) => li.getBoundingClientRect());
    const nav = document.querySelector('.hdr__nav');
    const b = document.querySelector('.hdr__burger').getBoundingClientRect();
    const naviVisible = getComputedStyle(nav).display !== 'none';
    return naviVisible
      ? { tryb: 'menu', zapas: inner.right - items[items.length - 1].right, zazor: items[0].left - brand.right }
      : { tryb: 'burger', zapas: b.left - brand.right };
  });
  const cel = r.tryb === 'menu' ? menu : burger;
  if (r.zapas < cel.min) { cel.min = +r.zapas.toFixed(2); cel.gdzie = w; cel.zazor = r.zazor !== undefined ? +r.zazor.toFixed(2) : undefined; }
}
console.log(JSON.stringify({ браузер: `Chromium ${browser.version()}`, меню_в_строке: menu, бургер: burger }, null, 2));
await browser.close();
