// Знак подвала: кадр окна против полного кадра той же страницы (сессия 11; «судью судят»,
// раунд 2, R2-ETALON-5 — прежний замер был на сборке c1ec5e6, до правки обводки «TH»,
// а правка изменила именно эти пиксели). playwright-core, Chromium без окна, DPR 1,
// 1440 × 900 и 390 × 844; зерно снято (display: none), конечные анимации — к концу.
// Полный кадр (fullPage) и кадр окна, где знак подвала в середине окна; рамка знака
// плюс 4 px вырезается из обоих по координатам документа и окна. Ждём 0 различий.
// Выгрузка — ../zamery/znak-podvala-okno.json; отказ (exit 1) — различия или сервер
// отдаёт не dist/.
//   node znak-podvala-okno.mjs [адрес]
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PW, CHROME, REPO, ZAMERY, sborkaIliOtkaz } from './sborka.mjs';

const { chromium } = createRequire(PW)('playwright-core');
const sharp = createRequire(join(REPO, 'package.json'))('sharp');
const URL_ = process.argv[2] ?? 'http://localhost:4331/';
const sb = await sborkaIliOtkaz(URL_, 'znak-podvala-okno');
const browser = await chromium.launch({ executablePath: CHROME });
const wynik = { instrument: 'znak-podvala-okno.mjs', brauzer: `Chromium ${browser.version()}`, sborka: sb, okna: {} };
const bledy = [];
try {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(URL_, { waitUntil: 'load' });
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
      for (const i of document.images) i.loading = 'eager';
      await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
      for (const g of document.querySelectorAll('.grain')) g.style.display = 'none';
      for (const a of document.getAnimations()) { try { a.finish(); } catch { /* бесконечная */ } }
    });
    await page.waitForTimeout(300);
    const pelny = await page.screenshot({ fullPage: true });
    await page.evaluate(() => document.querySelector('.ft__brand svg.znak').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => { const b = document.querySelector('.ft__brand svg.znak').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, sy: scrollY }; });
    const okno = await page.screenshot();
    const zap = 4;
    const left = Math.floor(r.x) - zap, width = Math.ceil(r.w) + 2 * zap, height = Math.ceil(r.h) + 2 * zap + 1;
    const topOkno = Math.floor(r.y) - zap;
    const topDok = Math.floor(r.y + r.sy) - zap;
    const drobnyj = (r.y % 1) !== ((r.y + r.sy) % 1);
    const a = await sharp(okno).extract({ left, top: topOkno, width, height }).raw().toBuffer();
    const b = await sharp(pelny).extract({ left, top: topDok, width, height }).raw().toBuffer();
    let n = 0, max = 0;
    for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d) { n++; if (d > max) max = d; } }
    wynik.okna[w] = { ramka_znaka_okno: r, verh_okno: topOkno, verh_dokument: topDok, drob_raznaya: drobnyj, subpikseley: n, max };
    if (n) bledy.push(`${w}: знак подвала в кадре окна против полного кадра — ${n} субпикселей, макс ${max}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
wynik.bledy = bledy;
writeFileSync(join(ZAMERY, 'znak-podvala-okno.json'), JSON.stringify(wynik, null, 2) + '\n');
console.log(JSON.stringify({ okna: wynik.okna, bledy }, null, 2));
if (bledy.length) process.exitCode = 1;
