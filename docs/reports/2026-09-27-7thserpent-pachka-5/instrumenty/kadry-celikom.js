// Кадры страниц пачки 5 целиком (сессия 18, П98: «мой взгляд на /gameplay/, /max-payne-3/guide/ и /movie/ (кадры
// 1440, 390 и 320, с путями в репозитории)») — для browser_run_code_unsafe Playwright MCP (параметр filename).
// Пара к копии kadry-stopa.js (первый экран и подпись byline, PNG): этот снимает всю страницу, от шапки до подвала.
// Формат — JPEG, качество 70: полностраничный PNG длинной тёмной страницы на 1440 весит мегабайты, а кадр нужен
// для чтения глазами, не для пиксельной сверки (сверки пикселей по этим кадрам нет).
// Сервер — статическая копия dist/ финальной сборки (BASE, сборка — SBORKA); ответ 200 и canonical страницы
// сверяются. Ленивые картинки грузятся сразу (lazy → eager) и ждутся не дольше 8 с, недогрузка — стоп. Зерно
// не снимается; DPR 1. Числа (высота страницы) — window.__celikom (выгрузить browser_evaluate).
// ПРЕДЕЛ: липкая шапка при полностраничной съёмке стоит один раз, вверху (Playwright снимает страницу целиком
// без прокрутки окна).
async (page) => {
  const BASE = 'http://127.0.0.1:4434';
  const SBORKA = 'VPISAT';
  if (!/^[0-9a-f]{7,40}$/.test(SBORKA)) throw new Error('СТОП: SBORKA — не хеш коммита');
  const dir = 'D:/SEO/cloud/site-generator/docs/reports/2026-09-27-7thserpent-pachka-5/kadry/';
  const PLAN = [
    ['/gameplay/', 'gameplay'],
    ['/max-payne-3/guide/', 'max-payne-3-guide'],
    ['/movie/', 'movie'],
  ];
  const OKNA = [[1440, 900], [390, 844], [320, 640]];
  const chisla = {};
  for (const [adres, slug] of PLAN) {
    for (const [w, h] of OKNA) {
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
        return {
          nezagruzheno: [...document.images].filter((i) => !i.complete || !i.naturalWidth).length,
          vysota: document.documentElement.scrollHeight,
        };
      });
      if (g.nezagruzheno) throw new Error('СТОП: ' + adres + ' ' + w + ' не загружено картинок: ' + g.nezagruzheno);
      chisla[slug + '-' + w] = g.vysota;
      await page.waitForTimeout(300);
      await page.screenshot({ path: dir + slug + '-' + w + '-celikom.jpg', fullPage: true, type: 'jpeg', quality: 70 });
    }
  }
  await page.evaluate((c) => { window.__celikom = c; }, { sborka: SBORKA, ...chisla });
  return 'ok: сборка ' + SBORKA + '; ' + Object.entries(chisla).map(([k, v]) => k + ' ' + v).join(', ');
}
