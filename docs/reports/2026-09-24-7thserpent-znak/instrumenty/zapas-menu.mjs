// Запас строки меню шапки при знаке сайта (сессия 11; «судью судят», раунд 1, R1-POLNOTA-4;
// раунд 2, R2-RISOVKA-5: прежняя метрика мерила до края .hdr__inner и включала поле
// контейнера и поиск, не опускалась ниже 32 px, даже когда пункты уже переносились).
// Собранная страница, без подстановок, на каждой ширине от 320 до 1180 px:
//   меню в строке (от 961): запас = правый край навигации (flex: 1) минус правый край
//     последнего пункта — столько пунктам ещё есть куда расти; перенос — у какой-нибудь
//     ссылки меню больше одной строки; переполнение — список шире навигации;
//     зазор знак–первый пункт;
//   меню в ящике (до 960): зазор знак–бургер.
// Отказ (exit 1): перенос или переполнение хоть на одной ширине, запас меньше 0,
// сервер отдаёт не dist/. Выгрузка — ../zamery/zapas-menu.json (с каждой шириной).
//   node zapas-menu.mjs [адрес]
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PW, CHROME, ZAMERY, sborkaIliOtkaz } from './sborka.mjs';

const { chromium } = createRequire(PW)('playwright-core');
const URL_ = process.argv[2] ?? 'http://localhost:4331/';
const sb = await sborkaIliOtkaz(URL_, 'zapas-menu');
const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(URL_, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const shiriny = [];
for (let w = 320; w <= 1180; w++) {
  await page.setViewportSize({ width: w, height: 800 });
  shiriny.push({ w, ...(await page.evaluate(() => {
    const brand = document.querySelector('.hdr__brand').getBoundingClientRect();
    const nav = document.querySelector('.hdr__nav');
    if (getComputedStyle(nav).display === 'none') {
      const b = document.querySelector('.hdr__burger').getBoundingClientRect();
      return { tryb: 'ящик', znak_burger: +(b.left - brand.right).toFixed(2) };
    }
    const n = nav.getBoundingClientRect();
    const ul = nav.querySelector('.hdr__list');
    const li = [...ul.children].map((x) => x.getBoundingClientRect());
    const linki = [...ul.querySelectorAll('.hdr__link')];
    const search = document.querySelector('.hdr__search');
    return {
      tryb: 'строка',
      zapas: +(n.right - li[li.length - 1].right).toFixed(2),
      perenos: linki.filter((a) => a.getClientRects().length > 1).map((a) => a.textContent.trim()),
      perepolnenie: ul.scrollWidth > nav.clientWidth,
      znak_punkt: +(li[0].left - brand.right).toFixed(2),
      poisk: search && getComputedStyle(search).display !== 'none' ? +search.getBoundingClientRect().width.toFixed(2) : 0,
    };
  })) });
}
await browser.close();
const stroka = shiriny.filter((s) => s.tryb === 'строка');
const yashchik = shiriny.filter((s) => s.tryb === 'ящик');
const minBy = (a, k) => a.reduce((m, s) => (s[k] < m[k] ? s : m), a[0]);
const itog = {
  menu_v_stroke: { ot: stroka[0]?.w, do: stroka.at(-1)?.w, min_zapas: minBy(stroka, 'zapas'), perenos_na: stroka.filter((s) => s.perenos.length).map((s) => s.w), perepolnenie_na: stroka.filter((s) => s.perepolnenie).map((s) => s.w), znak_punkt: [...new Set(stroka.map((s) => s.znak_punkt))], poisk: [...new Set(stroka.map((s) => s.poisk))] },
  yashchik: { ot: yashchik[0]?.w, do: yashchik.at(-1)?.w, min_znak_burger: minBy(yashchik, 'znak_burger') },
};
const bledy = [];
if (itog.menu_v_stroke.perenos_na.length) bledy.push(`перенос пунктов меню на ширинах ${itog.menu_v_stroke.perenos_na.join(', ')}`);
if (itog.menu_v_stroke.perepolnenie_na.length) bledy.push(`список меню шире навигации на ширинах ${itog.menu_v_stroke.perepolnenie_na.join(', ')}`);
if (itog.menu_v_stroke.min_zapas?.zapas < 0) bledy.push(`запас меню меньше 0: ${itog.menu_v_stroke.min_zapas.zapas} на ${itog.menu_v_stroke.min_zapas.w}`);
const vygruzka = { instrument: 'zapas-menu.mjs', brauzer: `Chromium ${browser.version()}`, sborka: sb, itog, bledy, shiriny };
writeFileSync(join(ZAMERY, 'zapas-menu.json'), JSON.stringify(vygruzka, null, 2) + '\n');
console.log(JSON.stringify({ brauzer: vygruzka.brauzer, itog, bledy }, null, 2));
if (bledy.length) process.exitCode = 1;
