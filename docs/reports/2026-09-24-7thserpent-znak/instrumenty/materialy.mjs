// Материалы вопроса владельцу о знаке (сессия 11, П83) — по находкам критика
// полноты эскизов (K1–K7, K10). Знак подставляется в настоящую шапку собранной
// главной (прод-превью, порт 4331), как в render.mjs.
//
//   node materialy.mjs <папка вывода> <папка:ключ:подпись> [...]
//
// Пишет:
//   svodka.png            — все варианты рядом: шапка 1440 (DPR 1, 1:1), шапка 390
//                           (DPR 2, родные пиксели), вкладка 16 px (DPR 1 и 2, родные
//                           пиксели);
//   wariant-<ключ>.png    — по варианту: первый экран 1440 (50 %) и 390, шапка над артом
//                           (1440 — над страницей панелей зеркального ряда, 390 — над
//                           ключевым артом первого экрана), фокус на ссылке знака,
//                           DPR 1,25 и 1,5 (частые масштабы ноутбуков Windows), ящик меню
//                           390, вкладка, PNG 16 по пикселям, apple-touch-icon.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const { chromium } = createRequire('C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json')('playwright-core');
const sharp = createRequire('D:/SEO/cloud/site-generator/package.json')('sharp');
const URL_ = process.env.ZNAK_URL ?? 'http://localhost:4331/';

const [, , outDir, ...pary] = process.argv;
mkdirSync(outDir, { recursive: true });
const warianty = pary.map((p) => {
  const [dirRaw, klucz, ...rest] = p.split('|');
  const dir = resolve(dirRaw);
  const fav = readFileSync(join(dir, 'favicon.svg'));
  return {
    dir,
    klucz,
    podpis: rest.join('|'),
    frag: readFileSync(join(dir, 'znak.html'), 'utf8'),
    fav,
    fav16: existsSync(join(dir, 'favicon-16.svg')) ? readFileSync(join(dir, 'favicon-16.svg')) : fav,
  };
});
const b64 = (buf, mime) => `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
async function svgToPng(svg, size) {
  const m = /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)"/.exec(svg.toString());
  const w = m ? Number(m[1]) : 32;
  return sharp(svg, { density: Math.max(1, (72 * size) / w) }).resize(size, size).png().toBuffer();
}

// Картинки в окне: `loading="lazy"` вне окна не грузится, поэтому ждём только видимые
// и под сроком 3 с (как ГОТОВНОСТЬ драйвера эталона).
const zhdatKadry = async (page) => {
  await page.evaluate(async () => {
    const vid = [...document.images].filter((i) => {
      const r = i.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    });
    await Promise.race([
      Promise.all(vid.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  });
  await page.waitForTimeout(300);
};

const browser = await chromium.launch({ executablePath: 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
async function naStronie(opts, frag, fn) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (frag !== null) await page.evaluate((html) => { document.querySelector('.hdr__brand').innerHTML = html; }, frag);
  await page.evaluate(() => document.fonts.ready);
  await zhdatKadry(page);
  const out = await fn(page);
  await ctx.close();
  return out;
}
const brandRect = (page) => page.evaluate(() => {
  const b = document.querySelector('.hdr__brand').getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height };
});

const dane = [];
for (const w of warianty) {
  const d = { ...w };
  // 1440, DPR 1: шапка, первый экран, шапка над страницей панелей зеркального ряда.
  Object.assign(d, await naStronie({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, w.frag, async (p) => {
    const h1440 = await p.screenshot({ clip: { x: 100, y: 0, width: 760, height: 68 } });
    const ekran1440 = await p.screenshot();
    const r = await brandRect(p);
    const y = await p.evaluate((bx) => {
      for (const sec of document.querySelectorAll('.panele')) {
        const q = sec.getBoundingClientRect();
        if (q.left < bx.x + bx.w && q.right > bx.x) return Math.round(q.top + window.scrollY - 30);
      }
      return null;
    }, r);
    let nadArtem1440 = null;
    if (y !== null) {
      await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
      await zhdatKadry(p);
      nadArtem1440 = await p.screenshot({ clip: { x: 100, y: 0, width: 760, height: 120 } });
    }
    return { h1440, ekran1440, nadArtem1440 };
  }));
  // Фокус на ссылке знака (Tab: пропуск к содержанию, затем знак), DPR 2.
  d.fokus = await naStronie({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, w.frag, async (p) => {
    await p.keyboard.press('Tab');
    await p.keyboard.press('Tab');
    await p.waitForTimeout(200);
    const r = await brandRect(p);
    return p.screenshot({ clip: { x: r.x - 16, y: 0, width: r.w + 32, height: 68 } });
  });
  // Дробные DPR — знак 1:1 в пикселях устройства.
  d.dpr = {};
  for (const s of [1.25, 1.5]) {
    d.dpr[s] = await naStronie({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: s }, w.frag, async (p) => {
      const r = await brandRect(p);
      return p.screenshot({ clip: { x: r.x - 12, y: 0, width: r.w + 24, height: 68 } });
    });
  }
  // 390, DPR 2: первый экран, шапка, над артом, ящик меню.
  Object.assign(d, await naStronie({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }, w.frag, async (p) => {
    const ekran390 = await p.screenshot();
    const h390 = await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 68 } });
    await p.evaluate(() => window.scrollTo({ top: 110, behavior: 'instant' }));
    await zhdatKadry(p);
    const nadArtem390 = await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 120 } });
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await p.waitForTimeout(200);
    await p.click('.hdr__burger');
    await p.waitForTimeout(300);
    const menu390 = await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 380 } });
    return { ekran390, h390, nadArtem390, menu390 };
  }));
  d.p16 = await svgToPng(w.fav16, 16);
  d.p32 = await svgToPng(w.fav, 32);
  d.p180 = await svgToPng(w.fav, 180);
  dane.push(d);
}

const tabHtml = (list) => `<!doctype html><html><body style="margin:0;font:12px 'Segoe UI',system-ui,sans-serif">
${[['#dee1e6', '#ffffff', '#1f1f1f'], ['#1f1f1f', '#3c3c3c', '#e3e3e3']].map(([strip, tab, ink]) => `<div style="background:${strip};height:38px;display:flex;align-items:flex-end;padding:0 8px;gap:2px">
${list.map((w) => `<div style="background:${tab};color:${ink};height:30px;width:200px;border-radius:8px 8px 0 0;display:flex;align-items:center;gap:8px;padding:0 10px;box-sizing:border-box"><img src="${b64(w.fav, 'image/svg+xml')}" width="16" height="16"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${w.klucz} · Max Payne — all games</span></div>`).join('')}
</div>`).join('')}</body></html>`;
async function htmlShot(html, dpr, width, height = 40) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  const b = await page.screenshot({ fullPage: true });
  await ctx.close();
  return b;
}
const tabW = 16 + 202 * dane.length;
const tab1 = await htmlShot(tabHtml(dane), 1, tabW);
const tab2 = await htmlShot(tabHtml(dane), 2, tabW);

const H = (t) => `<div style="margin:0 0 4px;font:600 12px 'Segoe UI',sans-serif;color:#a1abb3">${t}</div>`;
const I = (buf, w) => `<img src="${b64(buf, 'image/png')}" ${w ? `width="${w}"` : ''} style="display:block">`;
async function list(html, width, out) {
  const ctx = await browser.newContext({ viewport: { width, height: 120 }, deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  await pg.setContent(html, { waitUntil: 'load' });
  writeFileSync(out, await pg.screenshot({ fullPage: true }));
  await ctx.close();
}

// Сводка: шапка 1440 1:1, 390 в родных пикселях DPR 2.
await list(`<!doctype html><html><body style="margin:0;padding:16px;background:#2a2f36;color:#fff;font:600 15px 'Segoe UI',sans-serif">
${dane.map((d) => `<section style="margin:0 0 18px"><div style="margin:0 0 6px">${d.podpis}</div>
<div style="display:flex;gap:16px;align-items:flex-start"><div>${H('1440 · DPR 1 · 1:1')}${I(d.h1440, 760)}</div><div>${H('390 · DPR 2 · пиксели телефона')}${I(d.h390, 780)}</div></div></section>`).join('')}
<section>${H('Вкладка · 16 px · DPR 1 (светлая и тёмная полоса)')}${I(tab1, tabW)}<div style="height:10px"></div>${H('Вкладка · DPR 2 · пиксели устройства')}${I(tab2, tabW * 2)}</section>
</body></html>`, 1600, join(outDir, 'svodka.png'));

for (const d of dane) {
  if (d.klucz === '0') continue;
  await list(`<!doctype html><html><body style="margin:0;padding:16px;background:#2a2f36;color:#fff;font:600 15px 'Segoe UI',sans-serif">
<div style="margin:0 0 10px;font-size:17px">${d.podpis}</div>
<div style="display:flex;gap:16px;align-items:flex-start">
<div>${H('Первый экран 1440 · DPR 1 · 50 %')}${I(d.ekran1440, 720)}</div>
<div>${H('Первый экран 390 · DPR 2')}${I(d.ekran390, 390)}</div>
<div>${H('Ящик меню 390 · DPR 2 · пиксели телефона')}${I(d.menu390, 390)}</div>
</div>
<div style="display:flex;gap:16px;align-items:flex-start;margin-top:14px">
<div>${H('Шапка над страницей панелей ряда · 1440 · DPR 1 · 1:1')}${d.nadArtem1440 ? I(d.nadArtem1440, 760) : '<div>нет ряда под знаком</div>'}</div>
<div>${H('Шапка над артом первого экрана · 390 · DPR 2')}${I(d.nadArtem390, 780)}</div>
</div>
<div style="display:flex;gap:16px;align-items:flex-start;margin-top:14px">
<div>${H('Фокус с клавиатуры на ссылке знака · DPR 2')}${I(d.fokus)}</div>
<div>${H('DPR 1,25 · пиксели устройства')}${I(d.dpr[1.25])}</div>
<div>${H('DPR 1,5 · пиксели устройства')}${I(d.dpr[1.5])}</div>
</div>
<div style="display:flex;gap:24px;align-items:flex-end;margin-top:14px">
<div>${H('PNG 16 · ×4 по пикселям')}<img src="${b64(d.p16, 'image/png')}" width="64" height="64" style="image-rendering:pixelated;display:block"></div>
<div>${H('PNG 32 · ×2 по пикселям')}<img src="${b64(d.p32, 'image/png')}" width="64" height="64" style="image-rendering:pixelated;display:block"></div>
<div>${H('apple-touch-icon 180 · как на iOS')}<img src="${b64(d.p180, 'image/png')}" width="90" height="90" style="border-radius:20px;display:block"></div>
</div>
</body></html>`, 1600, join(outDir, `wariant-${d.klucz}.png`));
}
await browser.close();
console.log('готово:', outDir);
