// Материалы приёмки глазами знака и фавикона (сессия 11, П83 п. 4; «судью судят», раунд 2:
// R2-MATERIALY-1, -3, -4, -5, -6, R2-POLNOTA-8, -9, -11). Собранная главная на порту
// (по умолчанию прод-превью 4331), без подстановок; какую сборку отдаёт сервер — сверка
// с dist/ (sborka.mjs), коммит и sha256 — в materialy.json. Вкладку браузера снимает
// vkladka-dowod.mjs.
//
//   node materialy-priemki.mjs <папка вывода> [адрес]
//
// Пишет (каждое состояние перед снимком проверяется; не то состояние — отказ, exit 1):
//   shapka-1440.png          — шапка 1440: DPR 1 во всю ширину и DPR 2 крупно (левая часть)
//   shapka-390.png           — шапка телефона 390 при DPR 3
//   yashchik-390.png         — ящик меню открыт (aria-expanded, ящик виден), 390, DPR 3
//   pervy-ekran-1440.png     — первый экран 1440, DPR 1; pervy-ekran-390.png — 390, DPR 3
//   podval-1440.png, podval-390.png — подвал со знаком
//   fokus-1440.png           — фокус с клавиатуры на ссылке знака (:focus-visible), DPR 1 и 2
//   znak-dpr1-x4.png         — знак шапки 1440 при DPR 1 по пикселям ×4
//   znak-plotnosti.png       — знак шапки 1440 при DPR 1, 1,25, 1,5, 1,75 (экран владельца,
//                              175 %) и 2 — пиксели устройства ×3; обводка «TH» — до 1,5
//   podval-plotnosti.png     — знак подвала 1440 при тех же плотностях ×3 (перекладина
//                              при дробной плотности — R1-VNEDRENIE-6)
//   shapka-nad-soderzhimym.png — шапка над содержимым в худшей точке замера контраста
//                              (прокрутка из zamery/kontrast-znaka.json той же сборки),
//                              1440 при DPR 1 и 2, 390 при DPR 1 и 3
//   prinuditelnye-cveta.png  — принудительные цвета (эмуляция), светлая и тёмная схема:
//                              шапка 1440 и знак подвала — знак одной краской CanvasText
//   okno-plotnosti.png       — оконный растр Chromium с окном при масштабе 1,25, 1,5, 1,75
//                              против того же окна без окна: знак шапки и подвала, число
//                              расхождений (пиксели с разницей больше 8 из 255)
//   ikony.png                — файлы public/ (favicon.svg, PNG 16 и 32 ×4, icon-192,
//                              apple-touch-icon со скруглением iOS, записи ICO, вырезанные
//                              из каталога) и favicon.ico так, как его декодирует Chromium
//                              (<img src="/favicon.ico"> 16 и 32)
//   materialy.json           — браузер, сборка, состояния, числа, sha256 каждого файла
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PW, CHROME, REPO, SITE, ZAMERY, sha, sborkaIliOtkaz } from './sborka.mjs';

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
const zapis = { instrument: 'materialy-priemki.mjs', brauzer: `Chromium ${browser.version()}`, chrome: CHROME, sborka: sb, stany: {}, pliki: {} };
const bledy = [];
const zapisz = (f, buf) => { writeFileSync(join(OUT, f), buf); zapis.pliki[f] = sha(buf); };

const otkryt = async (w, h, dpr, extra = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, ...extra });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'load' });
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
  if (!f.brand || !f.fv) bledy.push(`фокус ${tag}: на ссылке знака ${f.brand}, :focus-visible ${f.fv}`);
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
    await fokusNaZnak(page, '1440 DPR 1');
    const f1 = await page.screenshot({ clip: { x: 100, y: 0, width: 420, height: 68 } });
    await ctx.close();
    const { ctx: c2, page: p2 } = await otkryt(1440, 900, 2);
    const b = await p2.screenshot({ clip: { x: 100, y: 0, width: 760, height: 68 } });
    await fokusNaZnak(p2, '1440 DPR 2');
    const f2 = await p2.screenshot({ clip: { x: 100, y: 0, width: 420, height: 68 } });
    await c2.close();
    const A = await sharp(a).metadata();
    const B = await sharp(b).metadata();
    zapisz('shapka-1440.png', await sharp({ create: { width: Math.max(A.width, B.width), height: A.height + 16 + B.height, channels: 4, background: '#2a2f36' } })
      .composite([{ input: a, top: 0, left: 0 }, { input: b, top: A.height + 16, left: 0 }]).png().toBuffer());
    await list('fokus-1440.png', 'Фокус с клавиатуры на ссылке знака, шапка 1440 (проверено: фокус на ссылке, :focus-visible).', [[{ png: f1, x: 2, podpis: 'DPR 1, увеличение 2' }], [{ png: f2, podpis: 'DPR 2' }]]);
  }
  { // 390, DPR 3
    const { ctx, page } = await otkryt(390, 844, 3);
    zapisz('shapka-390.png', await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 68 } }));
    zapisz('pervy-ekran-390.png', await page.screenshot());
    await page.click('.hdr__burger');
    await page.waitForTimeout(350);
    const y = await page.evaluate(() => { const b = document.querySelector('.hdr__burger'); const d = document.querySelector('.hdr__drawer'); return { exp: b.getAttribute('aria-expanded'), hidden: d.hidden, h: d.getBoundingClientRect().height }; });
    zapis.stany['ящик 390'] = y;
    if (y.exp !== 'true' || y.hidden || !y.h) bledy.push(`ящик 390 не открыт: ${JSON.stringify(y)}`);
    zapisz('yashchik-390.png', await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 380 } }));
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
      const ob = d <= 1.5 ? 'обводка «TH» есть' : 'обводки «TH» нет';
      const podpis = `DPR ${String(d).replace('.', ',')}${d === 1.75 ? ' — экран владельца (175 %)' : ''}; ${ob}; пиксели устройства ×3`;
      shapka.push({ png: await wycinekZnaku(page, '.hdr__brand svg.znak', 4), x: 3, podpis });
      await page.evaluate(() => document.querySelector('.ft__brand svg.znak').scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(300);
      pod.push({ png: await wycinekZnaku(page, '.ft__brand svg.znak', 4), x: 3, podpis: `${podpis}; прокрутка ${await page.evaluate(() => scrollY)}` });
      await ctx.close();
    }
    await list('znak-plotnosti.png', 'Знак в шапке 1440 при разных плотностях экрана. Обводка «TH» той же краской 0,3 px — только до плотности 1,5 (оптическая поправка волоса Бодони); при 1,75 и 2 контур гарнитуры без поправки.', shapka.map((c) => [c]));
    await list('podval-plotnosti.png', 'Знак в подвале 1440 при разных плотностях. Положение знака в подвале дробное, поэтому при 1,25 и 1,5 перекладина ложится между пикселями устройства мягче, чем в шапке.', pod.map((c) => [c]));
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
    await list('shapka-nad-soderzhimym.png', 'Полупрозрачная шапка над содержимым там, где фон под знаком по замеру самый светлый (zamery/kontrast-znaka.json; DPR 3 взят по точке замера DPR 2). Гарантия контраста — граница «шапка над белым листом», 7,05:1 фонарь, 11,90:1 снег.', wiersze);
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
    await list('prinuditelnye-cveta.png', 'Режим принудительных цветов (эмуляция Chromium, как контрастная тема Windows): знак рисуется одной системной краской текста CanvasText — отступление от «цвета из токенов темы», вопрос владельцу в докладе. Без этого правила снег знака на светлой системной теме дал бы 1,21:1.', wiersze);
  }
  { // Оконный растр при дробных плотностях против того же окна без окна
    const wiersze = [];
    zapis.okno = {};
    for (const s of [1.25, 1.5, 1.75]) {
      const znacznik = `udd-7ths-materialy-${String(s).replace('.', '_')}`;
      const udd = join(tmpdir(), znacznik);
      rmSync(udd, { recursive: true, force: true });
      const okno = await chromium.launchPersistentContext(udd, { headless: false, executablePath: CHROME, viewport: null, args: ['--window-position=40,40', '--window-size=1100,560', `--force-device-scale-factor=${s}`] });
      const pg = okno.pages()[0] ?? (await okno.newPage());
      await pg.goto(URL_, { waitUntil: 'load' });
      // Полоса прокрутки есть только у окна: она сужает раскладку, и страницы расходятся
      // уже не растром. Скрыта в обоих — ширина раскладки одна.
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
      const snimokOkna = async (plik) => {
        execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', OKNO, '-Marker', znacznik, '-Title', 'Max Payne', '-Out', plik], { encoding: 'utf8' });
        const m = await sharp(plik).metadata();
        return { buf: await sharp(plik).removeAlpha().raw().toBuffer(), W: m.width, H: m.height };
      };
      // Начало страницы в окне — по метке: пурпурный квадрат 8 × 8 в (0, 0) окна страницы.
      const plik = join(tmpdir(), `${znacznik}-okno.png`);
      await pg.evaluate(() => { const d = document.createElement('div'); d.id = 'metka-7ths'; d.style.cssText = 'position:fixed;left:0;top:0;width:8px;height:8px;background:#ff00ff;z-index:2147483647'; document.body.append(d); });
      await pg.waitForTimeout(300);
      const m0 = await snimokOkna(plik);
      let ox = Infinity, oy = Infinity;
      for (let y = 0; y < m0.H; y++) for (let x = 0; x < m0.W; x++) { const i = (y * m0.W + x) * 3; if (m0.buf[i] > 240 && m0.buf[i + 1] < 20 && m0.buf[i + 2] > 240) { if (y < oy || (y === oy && x < ox)) { ox = x; oy = y; } } }
      await pg.evaluate(() => document.getElementById('metka-7ths').remove());
      if (!Number.isFinite(ox)) bledy.push(`окно ${s}: метка начала страницы не найдена`);
      const roznica = (a, b) => { let n = 0, max = 0; for (let i = 0; i < a.length; i += 3) { const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); if (d > 8) n++; if (d > max) max = d; } return { n, max }; };
      for (const [gde, sel] of [['шапка', '.hdr__brand svg.znak'], ['подвал', '.ft__brand svg.znak']]) {
        if (gde === 'подвал') await pg.evaluate(() => document.querySelector('.ft__brand svg.znak').scrollIntoView({ block: 'center', behavior: 'instant' }));
        else await przewin(pg, 0);
        await pg.waitForTimeout(400);
        const sy = await pg.evaluate(() => scrollY);
        const r = await ramkaZnaku(pg, sel);
        // Без окна знак ставится в ту же точку окна (документы по высоте могут разниться,
        // тогда та же прокрутка упирается в край и знак встаёт иначе).
        const docY = await pb.evaluate((s2) => document.querySelector(s2).getBoundingClientRect().top + scrollY, sel);
        await przewin(pb, gde === 'подвал' ? docY - r.y : 0);
        await pb.waitForTimeout(400);
        const rb = await ramkaZnaku(pb, sel);
        const zap = 4;
        const cx = Math.floor((r.x - zap) * s), cy = Math.floor((r.y - zap) * s), cw = Math.ceil((r.w + 2 * zap) * s), ch = Math.ceil((r.h + 2 * zap) * s);
        const para = async () => {
          const m = await snimokOkna(plik);
          const wO = await sharp(m.buf, { raw: { width: m.W, height: m.H, channels: 3 } }).extract({ left: ox + cx, top: oy + cy, width: cw, height: ch }).png().toBuffer();
          const wB = await sharp(await pb.screenshot()).removeAlpha().extract({ left: cx, top: cy, width: cw, height: ch }).png().toBuffer();
          return { wO, wB, ...roznica(await sharp(wO).raw().toBuffer(), await sharp(wB).removeAlpha().raw().toBuffer()) };
        };
        const kakEst = await para();
        const s1 = await pg.addStyleTag({ content: SKRYJ });
        const s2 = await pb.addStyleTag({ content: SKRYJ });
        await pg.waitForTimeout(400);
        await pb.waitForTimeout(400);
        const tolkoZnak = await para();
        await s1.evaluate((e) => e.remove());
        await s2.evaluate((e) => e.remove());
        const pikseley = cw * ch;
        const wynik = { skala: s, gde, prokrutka_okno: sy, prokrutka_bez_okna: await pb.evaluate(() => scrollY), nachalo_stranicy_v_okne: [ox, oy], ramka_okno: r, ramka_bez_okna: rb, pikseley, kak_est: { rashozhdeniy: kakEst.n, max: kakEst.max }, tolko_znak: { rashozhdeniy: tolkoZnak.n, max: tolkoZnak.max } };
        // Документы окна и без окна расходятся по высоте на доли пикселя (замерено: подвал
        // 0,13–0,36 px при 1,25–1,75), прокрутка без окна квантуется — точка знака
        // совпадает до такой доли; сдвиг пишется в выгрузку и подпись, отказ — от 0,5 px.
        const sdvig = +Math.max(Math.abs(r.x - rb.x), Math.abs(r.y - rb.y)).toFixed(3);
        wynik.sdvig_px = sdvig;
        if (sdvig >= 0.5) bledy.push(`окно ${s}, ${gde}: без окна знак не в той же точке, сдвиг ${sdvig} px (${JSON.stringify({ r, rb })})`);
        zapis.okno[`${s} ${gde}`] = wynik;
        const m175 = s === 1.75 ? ' (экран владельца)' : '';
        wiersze.push([
          { png: kakEst.wO, x: 3, podpis: `масштаб ${String(s).replace('.', ',')}${m175}, ${gde}, как есть: окно Chromium${sdvig ? `; без окна знак сдвинут на ${String(sdvig).replace('.', ',')} px` : ''}` },
          { png: kakEst.wB, x: 3, podpis: `то же без окна; расхождений ${kakEst.n} из ${pikseley} (макс ${kakEst.max})` },
        ], [
          { png: tolkoZnak.wO, x: 3, podpis: `только знак (прочее скрыто): окно` },
          { png: tolkoZnak.wB, x: 3, podpis: `только знак без окна; расхождений ${tolkoZnak.n} из ${pikseley} (макс ${tolkoZnak.max})` },
        ]);
      }
      rmSync(plik, { force: true });
      await bez.close();
      await okno.close();
      rmSync(udd, { recursive: true, force: true });
    }
    await list('okno-plotnosti.png', 'Знак в настоящем окне Chromium (оконный растр) при масштабе 1,25, 1,5 и 1,75 против той же страницы без окна при той же плотности и в той же точке окна, пиксели устройства ×3. «Как есть» — со шапкой и размытым содержимым под ней; «только знак» — всё прочее скрыто, фон белый. Расхождение — пиксель, у которого хоть один канал отличается больше чем на 8 из 255.', wiersze);
  }
  { // Иконки
    const b64 = (f, mime) => `data:${mime};base64,${readFileSync(join(PUB, f)).toString('base64')}`;
    const ico = readFileSync(join(PUB, 'favicon.ico'));
    const entries = [];
    for (let i = 0; i < ico.readUInt16LE(4); i++) {
      const e = 6 + 16 * i;
      entries.push({ size: ico.readUInt8(e) || 256, png: ico.subarray(ico.readUInt32LE(e + 12), ico.readUInt32LE(e + 12) + ico.readUInt32LE(e + 8)) });
    }
    const icoUrl = new URL('/favicon.ico', URL_).href;
    const cell = (label, img) => `<div style="text-align:center;font:12px 'Segoe UI',sans-serif;color:#cfd6dc">${img}<div style="margin-top:6px;max-width:130px">${label}</div></div>`;
    const html = `<!doctype html><html><body style="margin:0;padding:20px;background:#2a2f36;display:flex;flex-wrap:wrap;gap:28px;align-items:flex-end">
${cell('favicon.svg · 64', `<img src="${b64('favicon.svg', 'image/svg+xml')}" width="64" height="64">`)}
${cell('favicon-16x16.png · ×4', `<img src="${b64('favicon-16x16.png', 'image/png')}" width="64" height="64" style="image-rendering:pixelated">`)}
${cell('favicon-32x32.png · ×2', `<img src="${b64('favicon-32x32.png', 'image/png')}" width="64" height="64" style="image-rendering:pixelated">`)}
${entries.map((e) => cell(`запись ICO ${e.size}, вырезана из каталога · ×${64 / e.size}`, `<img src="data:image/png;base64,${e.png.toString('base64')}" width="64" height="64" style="image-rendering:pixelated">`)).join('')}
${cell('favicon.ico в &lt;img&gt; 16 — Chromium берёт запись 32 и уменьшает (naturalWidth 32), запись 16 в &lt;img&gt; не видна · ×4', `<div style="width:64px;height:64px;overflow:hidden"><img id="ico16" src="${icoUrl}" width="16" height="16" style="transform:scale(4);transform-origin:0 0;image-rendering:pixelated"></div>`)}
${cell('favicon.ico в &lt;img&gt; 32 — как декодирует Chromium · ×2', `<div style="width:64px;height:64px;overflow:hidden"><img id="ico32" src="${icoUrl}" width="32" height="32" style="transform:scale(2);transform-origin:0 0;image-rendering:pixelated"></div>`)}
${cell('icon-192.png · 96', `<img src="${b64('icon-192.png', 'image/png')}" width="96" height="96">`)}
${cell('apple-touch-icon.png · как на iOS', `<img src="${b64('apple-touch-icon.png', 'image/png')}" width="90" height="90" style="border-radius:20px">`)}
</body></html>`;
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 100 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const ok = await page.evaluate(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    if (!ok) bledy.push('ikony.png: не все картинки декодированы');
    zapis.stany['favicon.ico в <img>: naturalWidth'] = await page.evaluate(() => document.getElementById('ico16').naturalWidth);
    zapisz('ikony.png', await page.screenshot({ fullPage: true }));
    await ctx.close();
  }
} finally {
  await browser.close();
}
zapis.bledy = bledy;
writeFileSync(join(OUT, 'materialy.json'), JSON.stringify(zapis, null, 2) + '\n');
if (bledy.length) {
  console.error(`materialy-priemki: ОТКАЗ — ${bledy.length}`);
  for (const b of bledy) console.error(`  - ${b}`);
  process.exitCode = 1;
} else console.log(`materialy-priemki: готово — ${Object.keys(zapis.pliki).length} файлов в ${OUT}; окно (только знак, расхождений): ${Object.values(zapis.okno).map((o) => `${o.skala} ${o.gde} ${o.tolko_znak.rashozhdeniy}`).join(', ')}`);
