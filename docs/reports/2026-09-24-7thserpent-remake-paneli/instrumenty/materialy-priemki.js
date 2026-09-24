// Материалы приёмки глазами сессии 10 (П81: ряд ремейка из кадров оригиналов) — для
// browser_run_code_unsafe Playwright MCP (параметр filename). Копия
// docs/reports/2026-09-23-7thserpent-glavnaya/instrumenty/materialy-priemki.js (сессия 9,
// все её проверки и пределы — там, в шапке) — что изменено:
//   1. OUT — папка доклада сессии 10; материалы сессии 9 не перезаписываются.
//   2. Полные кадры — 1440, 1024, 390; кадры окна — по якорю ряда ремейка (#remake) на 1440,
//      1024, 390 (ряд по центру окна), вместо низких окон сессии 9.
//   3. Проверка, что нарисованы панели ремейка: у каждой из трёх картинок .panele ряда
//      разброс яркости в её рамке на кадре окна (sd) не ниже 8 — пустая панель даёт около 0.
// Порядок, как у драйвера эталона (П16): одна загрузка на 1920, окна по убыванию без
// перезагрузки; сверка currentSrc всех картинок до и после полного кадра — подмена стоп;
// свет фонаря в арте героя в кадре окна и в полном кадре — отсутствие стоп.
async (page) => {
  const OUT = 'D:/SEO/cloud/site-generator/docs/reports/2026-09-24-7thserpent-remake-paneli/';
  const OKNA = [[1440, 900], [1024, 768], [390, 844]];
  const statOf = async (buf, rects) => page.evaluate(async ({ b64, rects }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    return rects.map((r) => {
      const d = x.getImageData(Math.round(r.x), Math.round(r.y), Math.max(1, Math.round(r.w)), Math.max(1, Math.round(r.h))).data;
      let n = 0, svet = 0, s = 0, s2 = 0;
      for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; n++; s += l; s2 += l * l; if (d[i] - d[i + 2] > 60) svet++; }
      const m = s / n;
      return { svet: svet / n, sd: Math.sqrt(Math.max(0, s2 / n - m * m)) };
    });
  }, { b64: buf.toString('base64'), rects });
  const osadka = () => page.evaluate(() => new Promise((r) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(r)), 700)));
  const log = [];
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:4331/', { waitUntil: 'networkidle' });
  const c = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href ?? null);
  if (!c || !c.includes('7thserpent.com')) throw new Error('СТОП: не 7thserpent.com: ' + c);
  for (const [w, h] of OKNA) {
    await page.setViewportSize({ width: w, height: h });
    const g = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      const shag = Math.round(window.innerHeight * 0.9);
      for (let y = 0; y <= document.body.scrollHeight; y += shag) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 80)); }
      const t0 = Date.now();
      while ([...document.images].some((i) => !i.complete) && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
      window.scrollTo({ top: 0, behavior: 'instant' });
      const a = document.querySelector('.hero__art').getBoundingClientRect();
      return { img: document.images.length, ok: [...document.images].filter((i) => i.complete && i.naturalWidth).length, h: document.body.scrollHeight, art: { x: a.x, y: a.y + scrollY, w: a.width, h: a.height } };
    });
    if (g.ok !== g.img) throw new Error('СТОП: на ' + w + ' загружено ' + g.ok + ' из ' + g.img);
    await osadka();
    const [okno] = await statOf(await page.screenshot({ scale: 'css' }), [g.art]);
    await osadka();
    const src = () => page.evaluate(() => [...document.images].map((i) => i.currentSrc));
    const srcDo = await src();
    const [full] = await statOf(await page.screenshot({ path: OUT + `glavnaya-${w}.png`, fullPage: true, scale: 'css' }), [g.art]);
    const srcPosle = await src();
    const podmen = srcDo.filter((s, i) => s !== srcPosle[i]).length;
    log.push(`${w}x${h}: ${g.img}/${g.img} картинок, страница ${g.h}px, свет фонаря в арте: окно ${(okno.svet * 100).toFixed(1)} %, полный кадр ${(full.svet * 100).toFixed(1)} %, подмен кандидата ${podmen}`);
    if (okno.svet < 0.05 || full.svet < 0.05 || podmen) throw new Error('СТОП: на ' + w + ' арт не нарисован или кандидат подменён\n' + log.join('\n'));
    // кадр окна по ряду ремейка
    const panele = await page.evaluate(async () => {
      const el = document.getElementById('remake');
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 300));
      return [...el.querySelectorAll('.panele img')].map((i) => { const b = i.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
    });
    await osadka();
    const st = await statOf(await page.screenshot({ path: OUT + `remake-${w}.png`, scale: 'css' }), panele);
    log.push(`  ряд ремейка ${w}: панелей ${panele.length}, разброс яркости ${st.map((s) => s.sd.toFixed(1)).join(' / ')}`);
    if (panele.length !== 3 || st.some((s) => s.sd < 8)) throw new Error('СТОП: панели ремейка не нарисованы на ' + w + '\n' + log.join('\n'));
  }
  return log.join('\n');
}
