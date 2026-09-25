// Материалы приёмки глазами знака и фавикона (сессия 11, П83 п. 4; «судью судят»:
// раунд 2 — R2-MATERIALY-1, -3, -4, -5, -6, R2-POLNOTA-8, -9, -11; раунд 3 —
// R3-MATERIALY-1, -2, -3, -5, -6, -8, -9, R3-POLNOTA-3). Собранная главная на порту
// (по умолчанию прод-превью 4331), без подстановок; какую сборку отдаёт сервер — сверка
// с dist/ (sborka.mjs); происхождение и sha256 каждого файла — в materialy.json.
// Вкладку браузера снимает vkladka-dowod.mjs.
//
//   node materialy-priemki.mjs <папка вывода> [адрес]
//
// Каждое состояние перед снимком проверяется (у каждого окна ещё и devicePixelRatio,
// принудительные цвета и схема, полоса прокрутки там, где она обещана). Все файлы
// пишутся во временную папку и переносятся в папку вывода вместе с materialy.json
// только при нуле отказов; при отказе (exit 1) в папку вывода ложится лишь
// materialy-otkaz.json, прежние материалы не трогаются (раунд 4, R4-MATERIALY-2).
// Подпись листа берётся из проверки, а не из текста.
// Пишет:
//   shapka-1440.png          — шапка 1440 (68 строк, без волоса — как кадры эталона):
//                              DPR 1 во всю ширину и DPR 2 крупно (левая часть)
//   shapka-390.png           — шапка телефона 390 при DPR 3 (68 строк)
//   yashchik-390.png         — ящик меню открыт (aria-expanded, ящик виден), 390, DPR 3
//   pervy-ekran-1440.png     — первый экран 1440, DPR 1; pervy-ekran-390.png — 390, DPR 3
//   podval-1440.png, podval-390.png — подвал со знаком
//   fokus-1440.png           — фокус с клавиатуры на ссылке знака (:focus-visible), DPR 1 и 2
//   znak-dpr1-x4.png         — знак шапки 1440 при DPR 1 по пикселям ×4
//   znak-plotnosti.png       — знак шапки 1440 при DPR 1, 1,25, 1,5, 1,75 (экран владельца,
//                              175 %) и 2 — пиксели устройства ×3; обводка «TH» — до 1,5
//   podval-plotnosti.png     — знак подвала 1440 при тех же плотностях ×3
//   ekran-vladelca.png       — экран владельца, DPR 1,75, шапка 69 строк с волосом:
//                              1440 (левая часть), 390, ящик 390, окно 2194 (3840 px
//                              при 175 %) с полосой прокрутки Windows, принудительные
//                              цвета на 1440
//   shapka-nad-soderzhimym.png — шапка над содержимым в худшей точке замера контраста
//                              (прокрутка из zamery/kontrast-znaka.json той же сборки),
//                              1440 при DPR 1 и 2, 390 при DPR 1 и 3
//   prinuditelnye-cveta.png  — принудительные цвета (эмуляция), светлая и тёмная схема:
//                              шапка 1440 и знак подвала — знак одной краской CanvasText
//   okno-plotnosti.png       — растр окна браузера (Chromium с окном, headless: false)
//                              при масштабе 1,25, 1,5, 1,75 против той же страницы без
//                              окна: знак шапки и подвала; вырезы выравниваются по растру
//                              (целый сдвиг до 3 пикселей устройства), в подписи — число
//                              как вырезано, сдвиг и число после выравнивания
//   ikony.png                — файлы public/ (favicon.svg ×1, PNG 16 ×4 и 32 ×2, записи
//                              ICO, вырезанные из каталога, icon-192, apple-touch-icon
//                              со скруглением iOS) и favicon.ico так, как его рисует
//                              Chromium в <img> 16 и 32 при DPR 1 (снимок ×4 и ×2)
//   materialy.json           — браузер, происхождение, сборка, состояния, числа, sha256 файлов
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PW, CHROME, REPO, SITE, ZAMERY, sha, sborkaIliOtkaz, pochodzenie } from './sborka.mjs';

const { chromium } = createRequire(PW)('playwright-core');
const sharp = createRequire(join(REPO, 'package.json'))('sharp');
const OKNO = join(dirname(fileURLToPath(import.meta.url)), 'okno.ps1');
const [, , OUT, URL_ = 'http://localhost:4331/'] = process.argv;
if (!OUT) { console.error('node materialy-priemki.mjs <папка вывода> [адрес]'); process.exit(2); }
mkdirSync(OUT, { recursive: true });
const PUB = join(SITE, 'public');
const sb = await sborkaIliOtkaz(URL_, 'materialy-priemki');
const kontrast = JSON.parse(readFileSync(join(ZAMERY, 'kontrast-znaka.json'), 'utf8'));
if (JSON.stringify(kontrast.sborka.pliki) !== JSON.stringify(sb.pliki)) {
  console.error('materialy-priemki: ОТКАЗ — zamery/kontrast-znaka.json снят с другой сборки; сначала node kontrast-znaka.mjs');
  process.exit(1);
}

// Как в wiernosc.mjs: со страницы снято всё, кроме знака и его предков (у предков — фон,
// рамка, тень, кольцо; у скрытых — и фильтры: visibility не гасит feTurbulence зерна).
const SKRYJ = `*:not(:has(svg.znak)):not(svg.znak):not(svg.znak *), *::before, *::after { visibility: hidden !important; filter: none !important; backdrop-filter: none !important; }
:has(svg.znak) { background: transparent !important; border-color: transparent !important; box-shadow: none !important; outline-color: transparent !important; }`;
const browser = await chromium.launch({ executablePath: CHROME });
const browserPasek = await chromium.launch({ executablePath: CHROME, ignoreDefaultArgs: ['--hide-scrollbars'] });
const zapis = { instrument: 'materialy-priemki.mjs', brauzer: `Chromium ${browser.version()}`, chrome: CHROME, ...pochodzenie(import.meta.url), sborka: sb, stany: {}, pliki: {}, ne_zapisano: [] };
const bledy = [];
const TMP = join(tmpdir(), 'materialy-7ths-priemki');
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const zapisz = (f, buf) => { writeFileSync(join(TMP, f), buf); zapis.pliki[f] = sha(buf); };
// Файл, чьё состояние не подтвердилось, под принятым именем не пишется.
const zapiszEsli = (ok, f, buf) => { if (ok) zapisz(f, buf); else zapis.ne_zapisano.push(f); };

const otkryt = async (w, h, dpr, extra = {}, br = browser) => {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, ...extra });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'load' });
  // Окно — то, что обещано: плотность, принудительные цвета и схема, полоса прокрутки.
  const st = await page.evaluate(() => ({ dpr: devicePixelRatio, forced: matchMedia('(forced-colors: active)').matches, dark: matchMedia('(prefers-color-scheme: dark)').matches, pasek: innerWidth - document.documentElement.clientWidth }));
  if (Math.abs(st.dpr - dpr) > 1e-6) bledy.push(`${w} DPR ${dpr}: devicePixelRatio окна ${st.dpr}`);
  if (!!extra.forcedColors !== st.forced) bledy.push(`${w} DPR ${dpr}: принудительные цвета ${st.forced}, ждали ${!!extra.forcedColors}`);
  if (extra.colorScheme && (extra.colorScheme === 'dark') !== st.dark) bledy.push(`${w} DPR ${dpr}: схема не ${extra.colorScheme}`);
  if (br === browserPasek && !(st.pasek > 0)) bledy.push(`${w} DPR ${dpr}: полосы прокрутки нет, а окно с полосой`);
  const nie = await page.evaluate(async () => {
    await document.fonts.ready;
    const vid = () => [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; });
    await Promise.race([Promise.all(vid().map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))), new Promise((r) => setTimeout(r, 5000))]);
    return vid().filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.currentSrc || i.src);
  });
  if (nie.length) bledy.push(`${w} DPR ${dpr}: видимые картинки не загружены — ${nie.join(', ')}`);
  await page.waitForTimeout(300);
  return { ctx, page };
};
const przewin = (page, y) => page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
const ramkaZnaku = (page, sel) => page.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }, sel);
const fokusNaZnak = async (page, tag) => {
  await page.evaluate(() => document.activeElement?.blur());
  for (let k = 0; k < 25; k++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement?.classList.contains('hdr__brand'))) break;
  }
  await page.waitForTimeout(250);
  const f = await page.evaluate(() => { const a = document.activeElement; return { brand: !!a?.classList.contains('hdr__brand'), fv: !!a?.matches(':focus-visible') }; });
  zapis.stany[`фокус ${tag}`] = f;
  const ok = f.brand && f.fv;
  if (!ok) bledy.push(`фокус ${tag}: на ссылке знака ${f.brand}, :focus-visible ${f.fv}`);
  return ok;
};
const otkrytYashchik = async (page, tag) => {
  await page.click('.hdr__burger');
  await page.waitForTimeout(350);
  const y = await page.evaluate(() => { const b = document.querySelector('.hdr__burger'); const d = document.querySelector('.hdr__drawer'); return { exp: b.getAttribute('aria-expanded'), hidden: d.hidden, h: d.getBoundingClientRect().height }; });
  zapis.stany[`ящик ${tag}`] = y;
  const ok = y.exp === 'true' && !y.hidden && y.h > 0;
  if (!ok) bledy.push(`ящик ${tag} не открыт: ${JSON.stringify(y)}`);
  return ok;
};
const podval = async (page, file, w) => {
  await page.evaluate(() => {
    const ft = document.querySelector('.ft');
    window.scrollTo({ top: ft.getBoundingClientRect().top + window.scrollY - 69, behavior: 'instant' });
  });
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => { const b = document.querySelector('.ft').getBoundingClientRect(); return { y: Math.max(69, b.top), bottom: Math.min(innerHeight, b.bottom) }; });
  zapisz(file, await page.screenshot({ clip: { x: 0, y: r.y, width: w, height: Math.min(r.bottom - r.y, 420) } }));
};
const wycinekZnaku = async (page, sel, zapas = 6) => {
  const b = await ramkaZnaku(page, sel);
  return page.screenshot({ clip: { x: Math.max(0, b.x - zapas), y: Math.max(0, b.y - zapas), width: b.w + 2 * zapas, height: b.h + 2 * zapas } });
};
// Лист с подписями: картинки data:, увеличение — целым множителем, пиксель в пиксель.
const list = async (plik, opis, wiersze) => {
  const cell = async ({ png, x = 1, podpis }) => {
    const m = await sharp(png).metadata();
    return `<figure><img src="data:image/png;base64,${png.toString('base64')}" style="width:${m.width * x}px;height:${m.height * x}px"><figcaption>${podpis}</figcaption></figure>`;
  };
  let html = `<html><head><meta charset="utf-8"><style>body{margin:20px;font:13px/1.4 system-ui,sans-serif;background:#2a2f36;color:#dfe5ea} .r{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;margin-bottom:18px} figure{margin:0} img{image-rendering:pixelated;display:block} figcaption{margin-top:6px;max-width:520px}</style></head><body><p style="max-width:1100px">${opis}</p>`;
  for (const w of wiersze) html += `<div class="r">${(await Promise.all(w.map(cell))).join('')}</div>`;
  html += '</body></html>';
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 200 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.setContent(html, { waitUntil: 'load' });
  zapisz(plik, await p.screenshot({ fullPage: true }));
  await ctx.close();
};

try {
  { // 1440, DPR 1 и 2
    const { ctx, page } = await otkryt(1440, 900, 1);
    const a = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 68 } });
    const znak1 = await wycinekZnaku(page, '.hdr__brand');
    const m1 = await sharp(znak1).metadata();
    zapisz('znak-dpr1-x4.png', await sharp(znak1).resize(m1.width * 4, m1.height * 4, { kernel: 'nearest' }).png().toBuffer());
    zapisz('pervy-ekran-1440.png', await page.screenshot());
    await podval(page, 'podval-1440.png', 1440);
    await przewin(page, 0);
    const ok1 = await fokusNaZnak(page, '1440 DPR 1');
    const f1 = await page.screenshot({ clip: { x: 100, y: 0, width: 420, height: 68 } });
    await ctx.close();
    const { ctx: c2, page: p2 } = await otkryt(1440, 900, 2);
    const b = await p2.screenshot({ clip: { x: 100, y: 0, width: 760, height: 68 } });
    const ok2 = await fokusNaZnak(p2, '1440 DPR 2');
    const f2 = await p2.screenshot({ clip: { x: 100, y: 0, width: 420, height: 68 } });
    await c2.close();
    const A = await sharp(a).metadata();
    const B = await sharp(b).metadata();
    zapisz('shapka-1440.png', await sharp({ create: { width: Math.max(A.width, B.width), height: A.height + 16 + B.height, channels: 4, background: '#2a2f36' } })
      .composite([{ input: a, top: 0, left: 0 }, { input: b, top: A.height + 16, left: 0 }]).png().toBuffer());
    if (ok1 && ok2) await list('fokus-1440.png', 'Фокус с клавиатуры на ссылке знака, шапка 1440. Проверено перед снимком: фокус на ссылке знака, :focus-visible — да (materialy.json, «stany»). Кольцо фокуса не судит ни один судья — только этот снимок.', [[{ png: f1, x: 2, podpis: 'DPR 1, увеличение 2' }], [{ png: f2, podpis: 'DPR 2' }]]);
    else zapis.ne_zapisano.push('fokus-1440.png');
  }
  { // 390, DPR 3
    const { ctx, page } = await otkryt(390, 844, 3);
    zapisz('shapka-390.png', await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 68 } }));
    zapisz('pervy-ekran-390.png', await page.screenshot());
    const ok = await otkrytYashchik(page, '390 DPR 3');
    zapiszEsli(ok, 'yashchik-390.png', await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 380 } }));
    await page.click('.hdr__burger');
    await page.waitForTimeout(200);
    await podval(page, 'podval-390.png', 390);
    await ctx.close();
  }
  { // Плотности: знак шапки и подвала 1440
    const shapka = [];
    const pod = [];
    for (const d of [1, 1.25, 1.5, 1.75, 2]) {
      const { ctx, page } = await otkryt(1440, 900, d);
      const ob = await page.evaluate(() => { const p = document.querySelector('.hdr__brand svg.znak path'); const s = getComputedStyle(p); return s.stroke !== 'none' && s.strokeWidth !== '0px'; });
      const podpis = `DPR ${String(d).replace('.', ',')}${d === 1.75 ? ' — экран владельца (175 %)' : ''}; ${ob ? 'обводка «TH» есть' : 'обводки «TH» нет'}; пиксели устройства ×3`;
      shapka.push({ png: await wycinekZnaku(page, '.hdr__brand svg.znak', 4), x: 3, podpis });
      await page.evaluate(() => document.querySelector('.ft__brand svg.znak').scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(300);
      pod.push({ png: await wycinekZnaku(page, '.ft__brand svg.znak', 4), x: 3, podpis: `${podpis}; прокрутка ${await page.evaluate(() => scrollY)}` });
      await ctx.close();
    }
    await list('znak-plotnosti.png', 'Знак в шапке 1440 при разных плотностях экрана (подпись — по вычисленной обводке). Обводка «TH» той же краской 0,3 px — только до плотности 1,5 (оптическая поправка волоса Бодони); при 1,75 и 2 контур гарнитуры без поправки.', shapka.map((c) => [c]));
    await list('podval-plotnosti.png', 'Знак в подвале 1440 при разных плотностях. Положение знака в подвале дробное, поэтому при 1,25, 1,5 и 1,75 перекладина ложится между пикселями устройства мягче, чем в шапке.', pod.map((c) => [c]));
  }
  { // Экран владельца: DPR 1,75, шапка с волосом
    const wiersze = [];
    {
      const { ctx, page } = await otkryt(1440, 900, 1.75);
      wiersze.push([{ png: await page.screenshot({ clip: { x: 0, y: 0, width: 760, height: 69 } }), podpis: '1440 × 900 при 1,75, левая часть 760 px — шапка с волосом' }]);
      await ctx.close();
    }
    {
      const { ctx, page } = await otkryt(2194, 1100, 1.75, {}, browserPasek);
      const x = await page.evaluate(() => ({ znakX: document.querySelector('.hdr__brand svg.znak').getBoundingClientRect().x, pasek: innerWidth - document.documentElement.clientWidth }));
      zapis.stany['экран владельца 2194'] = x;
      wiersze.push([{ png: await page.screenshot({ clip: { x: 0, y: 0, width: 760, height: 69 } }), podpis: `окно 2194 × 1100 CSS px при 1,75 (экран 3840 px, 175 %) с полосой прокрутки безоконного Chromium (${x.pasek} CSS px; на левый вырез 760 px не попадает, но сужает раскладку) — знак с x ${x.znakX}` }]);
      await ctx.close();
    }
    {
      const { ctx, page } = await otkryt(390, 844, 1.75);
      wiersze.push([{ png: await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 69 } }), podpis: '390 × 844 при 1,75 — шапка с волосом' }]);
      const ok = await otkrytYashchik(page, '390 DPR 1.75');
      if (ok) wiersze.push([{ png: await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 380 } }), podpis: '390 при 1,75 — ящик меню открыт (проверено: aria-expanded, ящик виден)' }]);
      await ctx.close();
    }
    {
      const { ctx, page } = await otkryt(1440, 900, 1.75);
      const ok = await fokusNaZnak(page, '1440 DPR 1.75');
      if (ok) wiersze.push([{ png: await page.screenshot({ clip: { x: 100, y: 0, width: 420, height: 69 } }), podpis: '1440 при 1,75 — фокус с клавиатуры на ссылке знака (проверено: :focus-visible)' }]);
      await ctx.close();
    }
    for (const sch of ['light', 'dark']) {
      const { ctx, page } = await otkryt(1440, 900, 1.75, { forcedColors: 'active', colorScheme: sch });
      wiersze.push([{ png: await page.screenshot({ clip: { x: 0, y: 0, width: 760, height: 69 } }), podpis: `1440 при 1,75, принудительные цвета, ${sch === 'light' ? 'светлая' : 'тёмная'} схема` }]);
      await ctx.close();
    }
    await list('ekran-vladelca.png', 'Экран владельца: 175 % (DPR 1,75) — снимки Chromium БЕЗ окна (растр окна браузера при 1,75 другой: okno-plotnosti.png). Обводки «TH» при этой плотности нет — контур гарнитуры. Шапка — 69 строк, с волосом снизу. Перекладина шапки здесь чёткая; в окне браузера при 1,25–1,75 она в полутоне.', wiersze);
  }
  { // Шапка над содержимым в худшей точке замера контраста
    const wiersze = [];
    for (const [w, h, d, clipW] of [[1440, 900, 1, 1440], [1440, 900, 2, 760], [390, 844, 1, 390], [390, 844, 3, 390]]) {
      const kz = kontrast.okna[`${w} DPR ${d === 1 ? 1 : 2}`];
      const y = kz.zamer_scrollY;
      const { ctx, page } = await otkryt(w, h, d);
      await page.evaluate(async () => { for (const i of document.images) i.loading = 'eager'; await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))); });
      await przewin(page, y);
      await page.waitForTimeout(400);
      const fakt = await page.evaluate(() => scrollY);
      if (fakt !== y) bledy.push(`шапка над содержимым ${w} DPR ${d}: прокрутка ${fakt}, ждали ${y}`);
      wiersze.push([{ png: await page.screenshot({ clip: { x: 0, y: 0, width: clipW, height: 68 } }), podpis: `${w} при DPR ${d}, прокрутка ${y} — худший фон под знаком по замеру контраста: фонарь ${kz.zamer.фонарь}:1, снег ${kz.zamer.снег}:1` }]);
      await ctx.close();
    }
    const g = kontrast.okna['1440 DPR 1'].granica;
    await list('shapka-nad-soderzhimym.png', `Полупрозрачная шапка над содержимым там, где фон под знаком по замеру самый светлый (zamery/kontrast-znaka.json; DPR 3 взят по точке замера DPR 2). Гарантия контраста — граница «шапка над белым листом»: фонарь ${g.фонарь}:1, снег ${g.снег}:1.`, wiersze);
  }
  { // Принудительные цвета
    const wiersze = [];
    for (const sch of ['light', 'dark']) {
      const { ctx, page } = await otkryt(1440, 900, 1, { forcedColors: 'active', colorScheme: sch });
      const sh = await page.screenshot({ clip: { x: 0, y: 0, width: 760, height: 68 } });
      await page.evaluate(() => document.querySelector('.ft__brand svg.znak').scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(300);
      const ft = await wycinekZnaku(page, '.ft__brand svg.znak', 8);
      wiersze.push([{ png: sh, podpis: `шапка 1440, принудительные цвета, схема ${sch}` }, { png: ft, x: 2, podpis: 'знак подвала ×2' }]);
      await ctx.close();
    }
    await list('prinuditelnye-cveta.png', 'Режим принудительных цветов (эмуляция Chromium, как контрастная тема Windows): знак рисуется одной системной краской текста CanvasText — отступление от «цвета из токенов темы», до решения владельца (вопрос доклада). Без этого правила снег знака на светлой системной теме дал бы 1,21:1.', wiersze);
  }
  { // Растр окна браузера при дробных плотностях против той же страницы без окна
    const wiersze = [];
    zapis.okno = {};
    const roznica = (a, b, W, H, dx, dy, m) => {
      let n = 0, max = 0;
      for (let y = m; y < H - m; y++) for (let x = m; x < W - m; x++) {
        const i = (y * W + x) * 3, j = ((y + dy) * W + (x + dx)) * 3;
        const d = Math.max(Math.abs(a[i] - b[j]), Math.abs(a[i + 1] - b[j + 1]), Math.abs(a[i + 2] - b[j + 2]));
        if (d > 8) n++;
        if (d > max) max = d;
      }
      return { n, max };
    };
    for (const s of [1.25, 1.5, 1.75]) {
      const znacznik = `udd-7ths-materialy-${String(s).replace('.', '_')}`;
      const udd = join(tmpdir(), znacznik);
      rmSync(udd, { recursive: true, force: true });
      const okno = await chromium.launchPersistentContext(udd, { headless: false, executablePath: CHROME, viewport: null, args: ['--window-position=40,40', '--window-size=1100,560', `--force-device-scale-factor=${s}`] });
      const pg = okno.pages()[0] ?? (await okno.newPage());
      await pg.goto(URL_, { waitUntil: 'load' });
      // Полоса прокрутки есть только у окна: она сужает раскладку. Скрыта в обоих.
      await pg.addStyleTag({ content: 'html { scrollbar-width: none; }' });
      await pg.evaluate(async () => { await document.fonts.ready; for (const a of document.getAnimations()) { try { a.finish(); } catch { /* бесконечная */ } } });
      await pg.waitForTimeout(800);
      const vp = await pg.evaluate(() => ({ width: innerWidth, height: innerHeight }));
      const bez = await browser.newContext({ viewport: vp, deviceScaleFactor: s });
      const pb = await bez.newPage();
      await pb.goto(URL_, { waitUntil: 'load' });
      await pb.addStyleTag({ content: 'html { scrollbar-width: none; }' });
      await pb.evaluate(async () => { await document.fonts.ready; for (const a of document.getAnimations()) { try { a.finish(); } catch { /* бесконечная */ } } });
      await pb.waitForTimeout(800);
      const plik = join(tmpdir(), `${znacznik}-okno.png`);
      const snimokOkna = async () => {
        execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', OKNO, '-Marker', znacznik, '-Title', 'Max Payne', '-Out', plik], { encoding: 'utf8' });
        const m = await sharp(plik).metadata();
        return { buf: await sharp(plik).removeAlpha().raw().toBuffer(), W: m.width, H: m.height };
      };
      // Начало страницы в окне — по метке: пурпурный квадрат 8 × 8 в (0, 0) окна страницы.
      await pg.evaluate(() => { const d = document.createElement('div'); d.id = 'metka-7ths'; d.style.cssText = 'position:fixed;left:0;top:0;width:8px;height:8px;background:#ff00ff;z-index:2147483647'; document.body.append(d); });
      await pg.waitForTimeout(300);
      const m0 = await snimokOkna();
      let ox = Infinity, oy = Infinity;
      for (let y = 0; y < m0.H; y++) for (let x = 0; x < m0.W; x++) { const i = (y * m0.W + x) * 3; if (m0.buf[i] > 240 && m0.buf[i + 1] < 20 && m0.buf[i + 2] > 240) { if (y < oy || (y === oy && x < ox)) { ox = x; oy = y; } } }
      await pg.evaluate(() => document.getElementById('metka-7ths').remove());
      if (!Number.isFinite(ox)) bledy.push(`окно ${s}: метка начала страницы не найдена`);
      for (const [gde, sel] of [['шапка', '.hdr__brand svg.znak'], ['подвал', '.ft__brand svg.znak']]) {
        if (gde === 'подвал') await pg.evaluate(() => document.querySelector('.ft__brand svg.znak').scrollIntoView({ block: 'center', behavior: 'instant' }));
        else await przewin(pg, 0);
        await pg.waitForTimeout(400);
        const sy = await pg.evaluate(() => scrollY);
        const r = await ramkaZnaku(pg, sel);
        // Без окна знак ставится в ту же точку окна: документы окна и без окна по высоте
        // расходятся на несколько CSS px (подвал 4,6–9,4 px), а прокрутка без окна
        // квантуется — остаток доли пикселя выравнивается по растру ниже.
        const docY = await pb.evaluate((s2) => document.querySelector(s2).getBoundingClientRect().top + scrollY, sel);
        await przewin(pb, gde === 'подвал' ? docY - r.y : 0);
        await pb.waitForTimeout(400);
        const rb = await ramkaZnaku(pb, sel);
        const zap = 4, M = 3;
        const cx = Math.floor((r.x - zap) * s) - M, cy = Math.floor((r.y - zap) * s) - M, cw = Math.ceil((r.w + 2 * zap) * s) + 2 * M, ch = Math.ceil((r.h + 2 * zap) * s) + 2 * M;
        const para = async () => {
          const m = await snimokOkna();
          const wO = await sharp(m.buf, { raw: { width: m.W, height: m.H, channels: 3 } }).extract({ left: ox + cx, top: oy + cy, width: cw, height: ch }).png().toBuffer();
          const wB = await sharp(await pb.screenshot()).removeAlpha().extract({ left: cx, top: cy, width: cw, height: ch }).png().toBuffer();
          const [a, b] = [await sharp(wO).raw().toBuffer(), await sharp(wB).removeAlpha().raw().toBuffer()];
          const bez0 = roznica(a, b, cw, ch, 0, 0, M);
          let luch = { ...bez0, dx: 0, dy: 0 };
          for (let dy = -M; dy <= M; dy++) for (let dx = -M; dx <= M; dx++) { const q = roznica(a, b, cw, ch, dx, dy, M); if (q.n < luch.n) luch = { ...q, dx, dy }; }
          return { wO, wB, bez0, luch };
        };
        const kakEst = await para();
        const s1 = await pg.addStyleTag({ content: SKRYJ });
        const s2 = await pb.addStyleTag({ content: SKRYJ });
        await pg.waitForTimeout(400);
        await pb.waitForTimeout(400);
        const tolkoZnak = await para();
        await s1.evaluate((e) => e.remove());
        await s2.evaluate((e) => e.remove());
        const pikseley = (cw - 2 * M) * (ch - 2 * M);
        const opis = (q) => (q.luch.dx || q.luch.dy ? `как вырезано ${q.bez0.n} (макс ${q.bez0.max}); вырезы сдвинуты на (${q.luch.dx}, ${q.luch.dy}) пикселя устройства, после выравнивания — ${q.luch.n} (макс ${q.luch.max})` : `${q.bez0.n} (макс ${q.bez0.max}), сдвига нет`);
        const wynik = { skala: s, gde, prokrutka_okno: sy, prokrutka_bez_okna: await pb.evaluate(() => scrollY), nachalo_stranicy_v_okne: [ox, oy], ramka_okno: r, ramka_bez_okna: rb, pikseley, kak_est: { kak_vyrezano: kakEst.bez0, posle_vyravnivaniya: kakEst.luch }, tolko_znak: { kak_vyrezano: tolkoZnak.bez0, posle_vyravnivaniya: tolkoZnak.luch } };
        zapis.okno[`${s} ${gde}`] = wynik;
        const m175 = s === 1.75 ? ' (экран владельца)' : '';
        wiersze.push([
          { png: kakEst.wO, x: 3, podpis: `масштаб ${String(s).replace('.', ',')}${m175}, ${gde}, как есть: окно Chromium` },
          { png: kakEst.wB, x: 3, podpis: `то же без окна; расхождений из ${pikseley}: ${opis(kakEst)}` },
        ], [
          { png: tolkoZnak.wO, x: 3, podpis: 'только знак (прочее скрыто, фон — подложка окна): окно' },
          { png: tolkoZnak.wB, x: 3, podpis: `только знак без окна; расхождений из ${pikseley}: ${opis(tolkoZnak)}` },
        ]);
      }
      rmSync(plik, { force: true });
      await bez.close();
      await okno.close();
      rmSync(udd, { recursive: true, force: true });
    }
    await list('okno-plotnosti.png', 'Знак в растре окна браузера (Chromium с окном, headless: false) при масштабе 1,25, 1,5 и 1,75 против той же страницы без окна при той же плотности, пиксели устройства ×3. Знак без окна ставится в ту же точку окна, но растр знака в окне бывает сдвинут на целую строку устройства (причина не разобрана: остаток раскладки её не объясняет), поэтому вырезы выравниваются целым сдвигом до 3 пикселей устройства, и в подписи — оба числа. «Как есть» — со шапкой и размытым содержимым под ней; «только знак» — всё прочее скрыто. Расхождение — пиксель, у которого хоть один канал отличается больше чем на 8 из 255.', wiersze);
  }
  { // Иконки
    const b64 = (f, mime) => `data:${mime};base64,${readFileSync(join(PUB, f)).toString('base64')}`;
    const ico = readFileSync(join(PUB, 'favicon.ico'));
    const entries = [];
    for (let i = 0; i < ico.readUInt16LE(4); i++) {
      const e = 6 + 16 * i;
      entries.push({ size: ico.readUInt8(e) || 256, png: ico.subarray(ico.readUInt32LE(e + 12), ico.readUInt32LE(e + 12) + ico.readUInt32LE(e + 8)) });
    }
    // favicon.ico так, как его рисует Chromium: <img> 16 и 32 при DPR 1, снимок по пикселям.
    const icoUrl = new URL('/favicon.ico', URL_).href;
    const cIco = await browser.newContext({ viewport: { width: 80, height: 40 }, deviceScaleFactor: 1 });
    const pIco = await cIco.newPage();
    await pIco.setContent(`<html><body style="margin:0;display:flex;gap:8px;align-items:flex-start"><img id="i16" src="${icoUrl}" width="16" height="16" style="display:block"><img id="i32" src="${icoUrl}" width="32" height="32" style="display:block"></body></html>`);
    await pIco.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    const nat = await pIco.evaluate(() => ({ i16: document.getElementById('i16').naturalWidth, i32: document.getElementById('i32').naturalWidth, x16: document.getElementById('i16').getBoundingClientRect().x, x32: document.getElementById('i32').getBoundingClientRect().x }));
    const ico16 = await pIco.screenshot({ clip: { x: nat.x16, y: 0, width: 16, height: 16 } });
    const ico32 = await pIco.screenshot({ clip: { x: nat.x32, y: 0, width: 32, height: 32 } });
    await cIco.close();
    zapis.stany['favicon.ico в <img>: naturalWidth'] = nat.i16;
    const png16 = await sharp(ico16).removeAlpha().raw().toBuffer();
    const zap16 = await sharp(entries.find((e) => e.size === 16).png).removeAlpha().raw().toBuffer();
    let rozn16 = 0;
    for (let i = 0; i < png16.length; i++) if (Math.abs(png16[i] - zap16[i]) > 8) rozn16++;
    zapis.stany['favicon.ico в <img> 16 против записи 16: субпикселей с разницей больше 8'] = rozn16;
    const cell = (label, img) => `<div style="text-align:center;font:12px 'Segoe UI',sans-serif;color:#cfd6dc"><div style="display:flex;justify-content:center">${img}</div><div style="margin-top:6px;max-width:150px;margin-inline:auto">${label}</div></div>`;
    const px = (src, w) => `<img src="${src}" width="${w}" height="${w}" style="image-rendering:pixelated;display:block">`;
    const html = `<!doctype html><html><body style="margin:0;padding:20px;background:#2a2f36;display:flex;flex-wrap:wrap;gap:28px;align-items:flex-end">
${cell('favicon.svg · 64', `<img src="${b64('favicon.svg', 'image/svg+xml')}" width="64" height="64" style="display:block">`)}
${cell('favicon-16x16.png · ×4', px(b64('favicon-16x16.png', 'image/png'), 64))}
${cell('favicon-32x32.png · ×2', px(b64('favicon-32x32.png', 'image/png'), 64))}
${entries.map((e) => cell(`запись ICO ${e.size}, вырезана из каталога · ×${64 / e.size}`, px(`data:image/png;base64,${e.png.toString('base64')}`, 64))).join('')}
${cell(`favicon.ico в &lt;img&gt; 16 при DPR 1 — Chromium берёт запись ${nat.i16} и уменьшает; от записи 16 отличается в ${rozn16} субпикселях · ×4`, px(`data:image/png;base64,${ico16.toString('base64')}`, 64))}
${cell(`favicon.ico в &lt;img&gt; 32 при DPR 1 · ×2`, px(`data:image/png;base64,${ico32.toString('base64')}`, 64))}
${cell('icon-192.png · 96', `<img src="${b64('icon-192.png', 'image/png')}" width="96" height="96" style="display:block">`)}
${cell('apple-touch-icon.png · как на iOS', `<img src="${b64('apple-touch-icon.png', 'image/png')}" width="90" height="90" style="border-radius:20px;display:block">`)}
</body></html>`;
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 100 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const geom = await page.evaluate(() => [...document.images].map((i) => { const r = i.getBoundingClientRect(); const p = i.parentElement.getBoundingClientRect(); return { w: r.width, ok: i.complete && i.naturalWidth > 0, vnutri: r.left >= p.left - 0.5 && r.right <= p.right + 0.5 }; }));
    if (!geom.every((g) => g.ok && g.vnutri)) bledy.push(`ikony.png: картинка не декодирована или вылезла из клетки — ${JSON.stringify(geom)}`);
    zapisz('ikony.png', await page.screenshot({ fullPage: true }));
    await ctx.close();
  }
} finally {
  await browser.close();
  await browserPasek.close();
}
zapis.bledy = bledy;
if (bledy.length) {
  writeFileSync(join(OUT, 'materialy-otkaz.json'), JSON.stringify(zapis, null, 2) + '\n');
  console.error(`materialy-priemki: ОТКАЗ — ${bledy.length}; в ${OUT} ничего не перенесено, кроме materialy-otkaz.json${zapis.ne_zapisano.length ? `; не снято: ${zapis.ne_zapisano.join(', ')}` : ''}`);
  for (const b of bledy) console.error(`  - ${b}`);
  process.exitCode = 1;
} else {
  for (const f of Object.keys(zapis.pliki)) copyFileSync(join(TMP, f), join(OUT, f));
  writeFileSync(join(OUT, 'materialy.json'), JSON.stringify(zapis, null, 2) + '\n');
  rmSync(join(OUT, 'materialy-otkaz.json'), { force: true });
  console.log(`materialy-priemki: готово — ${Object.keys(zapis.pliki).length} файлов в ${OUT}; окно (только знак, после выравнивания): ${Object.values(zapis.okno).map((o) => `${o.skala} ${o.gde} ${o.tolko_znak.posle_vyravnivaniya.n}`).join(', ')}`);
}
rmSync(TMP, { recursive: true, force: true });
