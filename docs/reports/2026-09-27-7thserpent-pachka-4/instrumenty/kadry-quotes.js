// Кадры стопа сессии 17 для взгляда владельца (П95: «мой взгляд на /quotes/ (кадры 1440, 390 и 320,
// с путями в репозитории) — первая страница с галереей») — для browser_run_code_unsafe Playwright MCP
// (параметр filename). Форма — kadry-stopa.js сессий 15–16 (новый инструмент, не копия: у /quotes/
// другие кадры — галерея ниже первого экрана).
// Сервер — статическая копия dist/ сборки последнего коммита (BASE, сборка — SBORKA; вписываются перед
// прогоном); ответ 200 и canonical страницы сверяются. Картинки грузятся сразу (lazy → eager) и ждутся
// не дольше 8 с, недогрузка — стоп. Зерно не снимается; DPR 1.
// Кадры на каждой ширине: первый экран (окно сверху); ряд Max Payne 3 (окно, прокрученное к ряду
// `#max-payne-3` — реплики с главами); галерея — вырезка полностраничного кадра по рамке `section.gallery`
// (снимок элемента накрывал бы верх секции липкой шапкой сайта). Числа —
// window.__kadry (выгрузить browser_evaluate).
async (page) => {
  const BASE = 'http://127.0.0.1:4428';
  const SBORKA = '149a040';
  const dir = 'D:/SEO/cloud/site-generator/docs/reports/2026-09-27-7thserpent-pachka-4/kadry/';
  const OKNA = [[1440, 900], [390, 844], [320, 640]];
  const chisla = {};
  for (const [w, h] of OKNA) {
    await page.setViewportSize({ width: w, height: h });
    const otvet = await page.goto(BASE + '/quotes/', { waitUntil: 'load' });
    if (!otvet || otvet.status() !== 200) throw new Error('СТОП: /quotes/ ответ ' + (otvet ? otvet.status() : 'нет'));
    const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href ?? null);
    if (canonical !== 'https://www.7thserpent.com/quotes/') throw new Error('СТОП: canonical ' + canonical);
    const g = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      const t0 = Date.now();
      while ([...document.images].some((i) => !i.complete) && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { y: Math.round(b.top + scrollY), h: Math.round(b.height), w: Math.round(b.width) }; };
      const kadryGal = [...document.querySelectorAll('.gallery__frame img')].map((i) => ({ w: i.clientWidth, h: i.clientHeight, currentSrc: i.currentSrc.split('/').pop() }));
      return {
        nezagruzheno: [...document.images].filter((i) => !i.complete || !i.naturalWidth).length,
        vysota: document.documentElement.scrollHeight,
        h1: r('h1'), byline: r('.byline'), ryadMP3: r('#max-payne-3'), galereya: r('section.gallery'), kadryGal,
      };
    });
    if (g.nezagruzheno) throw new Error('СТОП: /quotes/ ' + w + ' не загружено картинок: ' + g.nezagruzheno);
    chisla['quotes-' + w] = g;
    await page.waitForTimeout(300);
    await page.screenshot({ path: dir + 'quotes-' + w + '-pervy-ekran.png' });
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.max(0, g.ryadMP3.y - 40));
    await page.waitForTimeout(300);
    await page.screenshot({ path: dir + 'quotes-' + w + '-ryad-max-payne-3.png' });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    // Галерея — вырезкой из полностраничного кадра: снимок элемента прокручивает окно, и липкая шапка
    // сайта ложится поверх верха секции (первый прогон, кадр 320); в полностраничном кадре шапка стоит
    // на своём месте вверху страницы.
    await page.screenshot({ path: dir + 'quotes-' + w + '-galereya.png', fullPage: true, clip: { x: 0, y: g.galereya.y, width: w, height: g.galereya.h } });
  }
  await page.evaluate((c) => { window.__kadry = c; }, { sborka: SBORKA, ...chisla });
  return 'ok: сборка ' + SBORKA + '; ' + Object.keys(chisla).join(', ');
}
