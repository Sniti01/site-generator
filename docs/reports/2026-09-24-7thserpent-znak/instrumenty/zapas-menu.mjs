// Запас строки меню шапки при знаке сайта (сессия 11; «судью судят»: раунд 1 —
// R1-POLNOTA-4; раунд 2 — R2-RISOVKA-5; раунд 3 — R3-BRAUZER-9, -10, R3-POLNOTA-2, -9).
// Собранная страница, без подстановок, на каждой ширине от 320 до 1180 px:
//   меню в строке (от 961): запас = правый край навигации (flex: 1) минус правый край
//     последнего пункта — столько пунктам ещё есть куда расти; перенос — у ссылки меню
//     строки текста на разной высоте (Range по тексту: у .hdr__link inline-block,
//     его getClientRects() всегда один прямоугольник, R3-BRAUZER-9); переполнение —
//     список шире навигации; зазор знак–первый пункт;
//   меню в ящике (до 960): зазор знак–бургер;
//   на всех ширинах: знак 138 × 38.
// Отказ (exit 1) при корневом кегле по умолчанию (16 px): перенос, переполнение, запас
// меньше 0, знак не 138 × 38, знак налезает на бургер; сервер отдаёт не dist/.
// Крупный шрифт настроек браузера (20 и 24 px — корневой кегль 125 и 150 %: кегли
// сайта в rem, своего размера у html нет) — замер без отказа: что будет с меню у
// зрителя с крупным шрифтом, решает владелец (R3-POLNOTA-9).
// Выгрузка — ../zamery/zapas-menu.json (с каждой шириной и происхождением).
//   node zapas-menu.mjs [адрес]              — замер
//   node zapas-menu.mjs [адрес] --selftest   — мутации: длинный пункт (перенос),
//                                              длинный пункт с nowrap (переполнение),
//                                              знак 130 px (размер); узкие диапазоны ширин
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PW, CHROME, ZAMERY, sborkaIliOtkaz, pochodzenie } from './sborka.mjs';

const { chromium } = createRequire(PW)('playwright-core');
const ARGI = process.argv.slice(2);
const SELFTEST = ARGI.includes('--selftest');
const URL_ = ARGI.find((a) => !a.startsWith('--')) ?? 'http://localhost:4331/';
const sb = await sborkaIliOtkaz(URL_, 'zapas-menu');
const browser = await chromium.launch({ executablePath: CHROME });

async function zamer(koren, mut, shiriny) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (koren) await page.addStyleTag({ content: `:root { font-size: ${koren}; }` });
  if (mut?.css) await page.addStyleTag({ content: mut.css });
  if (mut?.dom) await page.evaluate(mut.dom);
  const out = [];
  for (const w of shiriny) {
    await page.setViewportSize({ width: w, height: 800 });
    out.push({ w, ...(await page.evaluate(() => {
      const brandEl = document.querySelector('.hdr__brand');
      const brand = brandEl.getBoundingClientRect();
      const svg = brandEl.querySelector('svg.znak')?.getBoundingClientRect();
      const znak = svg ? [+svg.width.toFixed(2), +svg.height.toFixed(2)] : null;
      const nav = document.querySelector('.hdr__nav');
      if (getComputedStyle(nav).display === 'none') {
        const b = document.querySelector('.hdr__burger').getBoundingClientRect();
        return { tryb: 'ящик', znak, znak_burger: +(b.left - brand.right).toFixed(2) };
      }
      const n = nav.getBoundingClientRect();
      const ul = nav.querySelector('.hdr__list');
      const li = [...ul.children].map((x) => x.getBoundingClientRect());
      const linki = [...ul.querySelectorAll('.hdr__link')];
      const strok = (a) => { const r = document.createRange(); r.selectNodeContents(a); return new Set([...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top))).size; };
      const search = document.querySelector('.hdr__search');
      return {
        tryb: 'строка',
        znak,
        zapas: +(n.right - li[li.length - 1].right).toFixed(2),
        perenos: linki.filter((a) => strok(a) > 1).map((a) => a.textContent.trim()),
        perepolnenie: ul.scrollWidth > nav.clientWidth,
        znak_punkt: +(li[0].left - brand.right).toFixed(2),
        poisk: search && getComputedStyle(search).display !== 'none' ? +search.getBoundingClientRect().width.toFixed(2) : 0,
      };
    })) });
  }
  await ctx.close();
  return out;
}
const minBy = (a, k) => a.reduce((m, s) => (s[k] < m[k] ? s : m), a[0]);
function itog(shiriny) {
  const stroka = shiriny.filter((s) => s.tryb === 'строка');
  const yashchik = shiriny.filter((s) => s.tryb === 'ящик');
  return {
    menu_v_stroke: stroka.length ? { ot: stroka[0].w, do: stroka.at(-1).w, min_zapas: minBy(stroka, 'zapas'), perenos_na: stroka.filter((s) => s.perenos.length).map((s) => s.w), perepolnenie_na: stroka.filter((s) => s.perepolnenie).map((s) => s.w), znak_punkt: [...new Set(stroka.map((s) => s.znak_punkt))], poisk: [...new Set(stroka.map((s) => s.poisk))] } : null,
    yashchik: yashchik.length ? { ot: yashchik[0].w, do: yashchik.at(-1).w, min_znak_burger: minBy(yashchik, 'znak_burger') } : null,
    znak_ne_138x38_na: shiriny.filter((s) => !s.znak || s.znak[0] !== 138 || s.znak[1] !== 38).map((s) => s.w),
  };
}
function sad(it) {
  const bledy = [];
  const m = it.menu_v_stroke;
  if (m?.perenos_na.length) bledy.push(`перенос пунктов меню на ширинах ${m.perenos_na.join(', ')}`);
  if (m?.perepolnenie_na.length) bledy.push(`переполнение: список меню шире навигации на ширинах ${m.perepolnenie_na.join(', ')}`);
  if (m && m.min_zapas.zapas < 0) bledy.push(`запас меню меньше 0: ${m.min_zapas.zapas} на ${m.min_zapas.w}`);
  if (it.yashchik && it.yashchik.min_znak_burger.znak_burger < 0) bledy.push(`знак налезает на бургер: ${it.yashchik.min_znak_burger.znak_burger} на ${it.yashchik.min_znak_burger.w}`);
  if (it.znak_ne_138x38_na.length) bledy.push(`размер: знак не 138 × 38 на ширинах ${it.znak_ne_138x38_na.slice(0, 10).join(', ')}${it.znak_ne_138x38_na.length > 10 ? '…' : ''}`);
  return bledy;
}
const VSE = Array.from({ length: 1180 - 320 + 1 }, (_, k) => 320 + k);
try {
  if (!SELFTEST) {
    const shiriny = await zamer(null, null, VSE);
    const it = itog(shiriny);
    const bledy = sad(it);
    const krupny = {};
    for (const [imie, koren] of [['20px', '125%'], ['24px', '150%']]) {
      const sh = await zamer(koren, null, VSE);
      const k = itog(sh);
      krupny[imie] = { itog: k, otkazy_bez_porogov: sad(k) };
    }
    const vygruzka = { instrument: 'zapas-menu.mjs', brauzer: `Chromium ${browser.version()}`, ...pochodzenie(import.meta.url), sborka: sb, itog: it, bledy, krupny_shrift: krupny, shiriny };
    writeFileSync(join(ZAMERY, 'zapas-menu.json'), JSON.stringify(vygruzka, null, 2) + '\n');
    console.log(JSON.stringify({ brauzer: vygruzka.brauzer, itog: it, bledy, krupny_shrift: Object.fromEntries(Object.entries(krupny).map(([k, v]) => [k, { min_zapas: v.itog.menu_v_stroke?.min_zapas, perenos_na: v.itog.menu_v_stroke?.perenos_na.length, perepolnenie_na: v.itog.menu_v_stroke?.perepolnenie_na.length, min_znak_burger: v.itog.yashchik?.min_znak_burger, zamechaniya: v.otkazy_bez_porogov }])) }, null, 2));
    if (bledy.length) process.exitCode = 1;
  } else {
    const UZKIE = [...Array.from({ length: 40 }, (_, k) => 961 + k), 320, 400, 960];
    const DLINNY = 'The complete Max Payne series and its remake in order';
    const proby = [
      { nazwa: 'чистая страница', mut: null, zhdem: null },
      { nazwa: 'длинный пункт меню', mut: { dom: new Function(`document.querySelector('.hdr__link').textContent = ${JSON.stringify(DLINNY)};`) }, zhdem: 'перенос' },
      { nazwa: 'длинный пункт с nowrap', mut: { css: '.hdr__link { white-space: nowrap }', dom: new Function(`document.querySelector('.hdr__link').textContent = ${JSON.stringify(DLINNY + ' ' + DLINNY)};`) }, zhdem: 'переполнение' },
      { nazwa: 'знак 130 px', mut: { css: '.hdr__brand svg.znak { width: 130px }' }, zhdem: 'размер' },
      { nazwa: 'бургер поверх знака', mut: { css: '@media (max-width: 960px) { .hdr__burger { position: absolute; left: 40px } }' }, zhdem: 'знак налезает' },
    ];
    const wyniki = [];
    for (const p of proby) {
      const bledy = sad(itog(await zamer(null, p.mut, UZKIE)));
      const ok = p.zhdem === null ? bledy.length === 0 : bledy.some((b) => b.startsWith(p.zhdem));
      wyniki.push({ nazwa: p.nazwa, zhdem: p.zhdem, ok, bledy });
      console.log(`${ok ? 'ok ' : 'НЕТ'}  ${p.nazwa}: ждём ${p.zhdem ? `отказ «${p.zhdem}»` : 'сверено'}, факт ${bledy.length ? bledy.join('; ') : 'сверено'}`);
    }
    writeFileSync(join(ZAMERY, 'zapas-menu-selftest.json'), JSON.stringify({ instrument: 'zapas-menu.mjs', ...pochodzenie(import.meta.url), proby: wyniki }, null, 2) + '\n');
    const zle = wyniki.filter((w) => !w.ok).length;
    console.log(`zapas-menu --selftest: ${wyniki.length - zle}/${wyniki.length}`);
    if (zle) process.exitCode = 1;
  }
} finally {
  await browser.close();
}
