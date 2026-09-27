// Копия docs/reports/2026-09-26-7thserpent-pachka-3/instrumenty/kadry-stopa.js (сессия 16; сама — копия пачки 2,
// 6c127da) для доработки П96 («на всех страницах на первом экране — подходящая картинка»): первые экраны восьми
// страниц с новым героем; отличие — адрес сервера, хеш сборки, папка вывода, план (8 страниц) и эти строки шапки.
// Копия для сессии 18 (П98: «мой взгляд на /gameplay/, /max-payne-3/guide/ и /movie/ (кадры 1440, 390 и 320)») —
// отличие от копии доработки (8ede451): адрес сервера, хеш сборки, папка вывода, план (три страницы пачки 5)
// и эти три строки шапки. Страницы целиком снимает отдельный kadry-celikom.js.
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
  const BASE = 'http://127.0.0.1:4434';
  const SBORKA = '90a9617';
  const dir = 'D:/SEO/cloud/site-generator/docs/reports/2026-09-27-7thserpent-pachka-5/kadry/';
  const PLAN = [
    ['/gameplay/', 'gameplay', [[1440, 900], [390, 844], [320, 640]]],
    ['/max-payne-3/guide/', 'max-payne-3-guide', [[1440, 900], [390, 844], [320, 640]]],
    ['/movie/', 'movie', [[1440, 900], [390, 844], [320, 640]]],
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
