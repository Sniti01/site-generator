// Чёткость края перекладины знака при разных плотностях (сессия 11; «судью судят»,
// раунд 4, R4-PROZA-2, R4-POLNOTA-4): Chromium без окна, 1440 × 900, знак шапки
// (прокрутка 0) и знак подвала (в середине окна). Столбец — середина перекладины
// (x знака + 9 CSS px), строки — от верха знака до низа перекладины + 2 px.
// Полутон — строка устройства, у которой яркость не равна ни фону, ни снегу
// (разница больше 8 из 255 с обоими). Перекладина лежит в знаке на y 5–9 CSS px;
// край чёткий, когда 5·DPR и 9·DPR от начала знака в пикселях устройства целые
// и само начало знака на пикселе устройства. Выгрузка — ../zamery/faza-perekladiny.json.
//   node faza-perekladiny.mjs [адрес]
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PW, CHROME, REPO, ZAMERY, sborkaIliOtkaz, pochodzenie } from './sborka.mjs';

const { chromium } = createRequire(PW)('playwright-core');
const sharp = createRequire(join(REPO, 'package.json'))('sharp');
const URL_ = process.argv[2] ?? 'http://localhost:4331/';
const sb = await sborkaIliOtkaz(URL_, 'faza-perekladiny');
const browser = await chromium.launch({ executablePath: CHROME });
const PLOTNOSTI = [0.9, 1, 1.1, 1.25, 1.33, 1.5, 1.75, 1.925, 2, 2.1875, 2.5, 2.625, 3];
const wynik = { instrument: 'faza-perekladiny.mjs', brauzer: `Chromium ${browser.version()}`, ...pochodzenie(import.meta.url), sborka: sb, okna: [] };
try {
  for (const dpr of PLOTNOSTI) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
    const page = await ctx.newPage();
    await page.goto(URL_, { waitUntil: 'load' });
    await page.evaluate(async () => { await document.fonts.ready; for (const g of document.querySelectorAll('.grain')) g.style.display = 'none'; for (const a of document.getAnimations()) { try { a.finish(); } catch { /* бесконечная */ } } });
    const zapis = { dpr };
    for (const [gde, sel] of [['шапка', '.hdr__brand svg.znak'], ['подвал', '.ft__brand svg.znak']]) {
      if (gde === 'подвал') await page.evaluate(() => document.querySelector('.ft__brand svg.znak').scrollIntoView({ block: 'center', behavior: 'instant' }));
      else await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(250);
      const r = await page.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x, y: b.y }; }, sel);
      const png = await page.screenshot({ clip: { x: r.x + 9, y: Math.max(0, r.y), width: 1, height: 12 } });
      const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const Y = [];
      for (let yy = 0; yy < info.height; yy++) Y.push(data[(yy * info.width) * 3]);
      const fon = Y[0];
      const snieg = Math.max(...Y);
      const polu = Y.filter((v) => Math.abs(v - fon) > 8 && Math.abs(v - snieg) > 8).length;
      zapis[gde] = { y_css: r.y, y_ustr: +(r.y * dpr).toFixed(4), verh_ustr: +((r.y + 5) * dpr).toFixed(4), niz_ustr: +((r.y + 9) * dpr).toFixed(4), stolbec_R: Y, poluton_strok: polu, chetkij: polu === 0 };
    }
    wynik.okna.push(zapis);
    console.log(`DPR ${dpr}: шапка ${zapis['шапка'].chetkij ? 'чёткая' : `полутон ${zapis['шапка'].poluton_strok}`} (верх ${zapis['шапка'].verh_ustr}, низ ${zapis['шапка'].niz_ustr}); подвал ${zapis['подвал'].chetkij ? 'чёткий' : `полутон ${zapis['подвал'].poluton_strok}`} (верх ${zapis['подвал'].verh_ustr}, низ ${zapis['подвал'].niz_ustr})`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
writeFileSync(join(ZAMERY, 'faza-perekladiny.json'), JSON.stringify(wynik, null, 2) + '\n');
