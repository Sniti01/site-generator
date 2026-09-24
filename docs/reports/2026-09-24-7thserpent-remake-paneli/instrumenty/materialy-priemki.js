// Материалы приёмки глазами сессии 10 (П81: ряд ремейка из кадров оригиналов) — для
// browser_run_code_unsafe Playwright MCP (параметр filename). Копия
// docs/reports/2026-09-23-7thserpent-glavnaya/instrumenty/materialy-priemki.js (сессия 9,
// все её проверки и пределы — там, в шапке) — что изменено:
//   1. OUT — папка доклада сессии 10; материалы сессии 9 не перезаписываются.
//   2. Полные кадры — 1440, 1024, 390; кадры окна ряда ремейка на 1440, 1024, 390 — по п. 5
//      (панели с плашкой по центру окна), вместо низких окон сессии 9.
//   3. Проверка, что нарисованы панели ремейка: у каждой из трёх картинок .panele ряда
//      разброс яркости в её рамке на кадре окна (sd) не ниже 8 — пустая панель даёт около 0.
//      Рамка — без плашки: плашка заходит на кадр снизу (margin-top: −xl) с обводкой, и её
//      текст давал разброс выше порога и у пустой панели — большая панель и mp1-k06 на 1440
//      и 390 проходили бы пустыми (K1 «судью судят» сессии 10). У панели, на которую плашка
//      заходит, рамка обрезается по верх плашки минус обводка; остаток ниже 24 px — стоп.
//      ПРЕДЕЛ (раунд 3 «судью судят», R3-MAT-1): разброс ловит пустую или ровную панель,
//      но не то, какой кадр стоит в панели (соседний или из чужого ряда проходит), и не
//      то, заполняет ли картинка панель: рамка — коробка <img>, а не .foto. Какой кадр
//      где — глазами по таблице «Кадры» раздела 2 доклада и листу арта.
//   4. Самопроверка в каждом окне, три состояния: картинки панелей скрыты (visibility:
//      hidden), залиты ровным белым и ровным серым (filter: brightness(0) invert(1) и
//      invert(0.5); под дуотоном .foto белая даёт тон эпохи — самый светлый, какой может
//      дать панель); кадр окна без записи, и та же мерка обязана дать у всех трёх панелей
//      разброс ниже 8 — иначе проверка слепа, стоп. Потом стиль снимается. Скрытые
//      картинки дают цвет фона — как строка зазора и обводки плашки, поэтому одна эта
//      самопроверка не видела рамку, захватившую чужую строку (R2-KOD-2 «судью судят»).
//   5. Кадр окна — по центру панелей вместе с плашкой и её обводкой, а не секции: на 1024
//      секция выше окна, и по её центру плашка, которая называет оригиналы, уходила из кадра,
//      а рамка нижней панели — за низ холста, где getImageData даёт прозрачные нули
//      (R2-KOD-1). Не помещаются в окно — стоп. ПРЕДЕЛ (R3-MAT-2): нет плашки — кадр
//      по одним панелям, без стопа; пропавшую плашку ловят accept:frames (высота страницы
//      и геометрия) и глаз.
//   6. Рамка панели округляется внутрь (x, y — вверх; правый и нижний край — вниз) и обязана
//      лежать в окне целиком — иначе стоп: в мерку не попадают ни строка зазора, ни обводка
//      плашки, ни пиксели вне холста.
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
    // кадр окна по ряду ремейка — по центру панелей с плашкой (п. 5 шапки)
    const { panele, plashka, blok, okno: ok } = await page.evaluate(async () => {
      const el = document.getElementById('remake');
      const pan = el.querySelector('.panele');
      const p = el.querySelector('.plashka');
      const o = p ? parseFloat(getComputedStyle(p).outlineWidth) || 0 : 0;
      const r0 = pan.getBoundingClientRect(), r1 = p ? p.getBoundingClientRect() : r0;
      const gora = Math.min(r0.top, r1.top - o) + scrollY, niz = Math.max(r0.bottom, r1.bottom + o) + scrollY;
      window.scrollTo({ top: Math.round((gora + niz) / 2 - innerHeight / 2), behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 300));
      const rect = (e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
      return {
        panele: [...el.querySelectorAll('.panele img')].map(rect),
        plashka: p ? { ...rect(p), obvodka: o } : null,
        blok: { gora: gora - scrollY, niz: niz - scrollY },
        okno: { w: innerWidth, h: innerHeight },
      };
    });
    if (blok.gora < 0 || blok.niz > ok.h) throw new Error('СТОП: панели с плашкой не помещаются в окно ' + w + 'x' + h + ': ' + JSON.stringify(blok));
    // рамка панели без плашки (п. 3), округлённая внутрь и целиком в окне (п. 6)
    const ramki = panele.map((r) => {
      let { x, y, w: rw, h: rh } = r;
      if (plashka) {
        const o = plashka.obvodka, verh = plashka.y - o;
        const zahodit = plashka.x - o < x + rw && plashka.x + plashka.w + o > x && verh < y + rh && plashka.y + plashka.h + o > y;
        if (zahodit) rh = verh - y;
      }
      const x0 = Math.ceil(x), y0 = Math.ceil(y), x1 = Math.floor(x + rw), y1 = Math.floor(y + rh);
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    });
    if (ramki.some((r) => r.h < 24 || r.w < 24)) throw new Error('СТОП: рамка панели без плашки меньше 24 px на ' + w + ': ' + JSON.stringify(ramki));
    if (ramki.some((r) => r.x < 0 || r.y < 0 || r.x + r.w > ok.w || r.y + r.h > ok.h)) throw new Error('СТОП: рамка панели вне окна на ' + w + ': ' + JSON.stringify(ramki));
    await osadka();
    const st = await statOf(await page.screenshot({ path: OUT + `remake-${w}.png`, scale: 'css' }), ramki);
    // самопроверка (п. 4): скрытые и ровно залитые панели обязаны дать разброс ниже порога
    const samo = [];
    for (const [imya, css] of [['скрытые', 'visibility: hidden'], ['белые', 'filter: brightness(0) invert(1)'], ['серые', 'filter: brightness(0) invert(0.5)']]) {
      const tag = await page.addStyleTag({ content: `#remake .panele img { ${css} !important; }` });
      await osadka();
      const s = await statOf(await page.screenshot({ scale: 'css' }), ramki);
      await tag.evaluate((t) => t.remove());
      samo.push(`${imya} ${s.map((x) => x.sd.toFixed(1)).join(' / ')}`);
      if (s.some((x) => x.sd >= 8)) throw new Error(`СТОП: проверка слепа — ${imya} панели дали разброс не ниже 8 на ${w}: ${s.map((x) => x.sd.toFixed(1)).join(' / ')}\n` + log.join('\n'));
    }
    await osadka();
    log.push(`  ряд ремейка ${w}: панелей ${panele.length}, рамки ${ramki.map((r) => r.w + 'x' + r.h).join(' / ')}, разброс яркости ${st.map((s) => s.sd.toFixed(1)).join(' / ')}; самопроверка: ${samo.join('; ')}`);
    if (panele.length !== 3 || st.some((s) => s.sd < 8)) throw new Error('СТОП: панели ремейка не нарисованы на ' + w + '\n' + log.join('\n'));
  }
  return log.join('\n');
}
