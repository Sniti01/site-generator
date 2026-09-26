// Кадры стопа сессии 15 для взгляда владельца (П91: «мой взгляд на героя /max-payne-3/ и подпись
// /max-payne-2/ (кадры 1440, 390 и 320, с путями в репозитории)»; /max-payne-1/ и /remake/ — сверх
// стопа, 1440 и 390, у /remake/ ещё 800 — полоса 641–1024, где первая редакция подписи кадра
// пропадала под скримом) — для browser_run_code_unsafe Playwright MCP (параметр filename).
// Сервер — статическая копия dist/ финальной сборки (BASE, сборка — SBORKA); ответ 200 и canonical
// страницы сверяются. Картинки грузятся сразу (lazy → eager) и ждутся не дольше 8 с, недогрузка —
// стоп (урок сессии 14: ожидание без срока вешает съёмку MCP на 30 минут). Зерно не снимается —
// кадры показывают страницу как есть; DPR 1, полоса прокрутки headless-Chromium скрыта.
// Кадры: первый экран (окно) и подпись byline — окно, прокрученное так, что низ героя и подпись
// видны (у /max-payne-2/). Полностраничных кадров нет: стоп их не просит, а длинные страницы
// дали бы десятки мегабайт в репозитории. Числа — window.__kadry (выгрузить browser_evaluate).
async (page) => {
  const BASE = 'http://127.0.0.1:4416';
  const SBORKA = 'e35cab8';
  const dir = 'D:/SEO/cloud/site-generator/docs/reports/2026-09-26-7thserpent-pachka-2/kadry/';
  const PLAN = [
    ['/max-payne-3/', 'max-payne-3', [[1440, 900], [390, 844], [320, 640]]],
    ['/max-payne-2/', 'max-payne-2', [[1440, 900], [390, 844], [320, 640]]],
    ['/max-payne-1/', 'max-payne-1', [[1440, 900], [390, 844]]],
    ['/remake/', 'remake', [[1440, 900], [800, 900], [390, 844]]],
  ];
  const chisla = {};
  for (const [adres, slug, okna] of PLAN) {
    for (const [w, h] of okna) {
      await page.setViewportSize({ width: w, height: h });
      const otvet = await page.goto(BASE + adres, { waitUntil: 'load' });
      if (!otvet || otvet.status() !== 200) throw new Error('СТОП: ' + adres + ' ответ ' + (otvet ? otvet.status() : 'нет'));
      const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href ?? null);
      if (canonical !== 'https://www.7thserpent.com' + adres) throw new Error('СТОП: canonical ' + canonical);
      const g = await page.evaluate(async () => {
        document.documentElement.style.scrollBehavior = 'auto';
        await document.fonts.ready;
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
        const t0 = Date.now();
        while ([...document.images].some((i) => !i.complete) && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
        const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { y: Math.round(b.top + scrollY), h: Math.round(b.height), w: Math.round(b.width) }; };
        const h1 = document.querySelector('h1');
        const lh = parseFloat(getComputedStyle(h1).lineHeight);
        return {
          nezagruzheno: [...document.images].filter((i) => !i.complete || !i.naturalWidth).length,
          vysota: document.documentElement.scrollHeight,
          hero: r('section.hero'), byline: r('.byline'), h1: r('h1'), podpisKadra: r('.podpis-geroya'),
          strokH1: Math.round(h1.getBoundingClientRect().height / lh),
          kroshki: r('nav[aria-label="Breadcrumbs"]'),
        };
      });
      if (g.nezagruzheno) throw new Error('СТОП: ' + adres + ' ' + w + ' не загружено картинок: ' + g.nezagruzheno);
      chisla[slug + '-' + w] = g;
      await page.waitForTimeout(300);
      await page.screenshot({ path: dir + slug + '-' + w + '-pervy-ekran.png' });
      if (g.byline) {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.max(0, g.byline.y - Math.round(h * 0.55)));
        await page.waitForTimeout(300);
        await page.screenshot({ path: dir + slug + '-' + w + '-podpis.png' });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      }
    }
  }
  await page.evaluate((c) => { window.__kadry = c; }, { sborka: SBORKA, ...chisla });
  return 'ok: сборка ' + SBORKA + '; ' + Object.keys(chisla).join(', ');
}
