// Скрипт съёмки для замера контраста текста призыва на страницах маршрута второго сайта
// (сессия 14, П89: «Контраст текста призыва — замером пикселей по собранной странице»)
// — для browser_run_code_unsafe Playwright MCP (параметр filename). Пара к вычислителю
// docs/reports/2026-09-23-7thserpent-glavnaya/instrumenty/kontrast-art.mjs (сессия 9,
// без правки): тот же формат кадров `ka-<Ш>x<В>-<место>.png` и `boxes.json`.
//
// Копия docs/reports/2026-09-23-7thserpent-glavnaya/instrumenty/kontrast-art-snyatie.js;
// что изменено против копии:
//   1. СТРАНИЦЫ — три страницы пачки 1 (`/pc/`, `/games-like-max-payne/`, `/media/`)
//      вместо главной; кадры и рамки каждой — в своей папке `<dir>/<слаг>/`, рамки —
//      в window.__ka[<адрес>].
//   2. МЕСТО одно — призыв `cta` (заголовок и лид; колонка `.cta__inner` скрывается, как
//      у главной). Мест героя, кнопок, отметок и цитаты на страницах маршрута нет.
//      Кнопка призыва стоит на сплошной заливке фонаря — это пара токенов гейта
//      контраста (`gates/contrast.mjs`), а не текст поверх скрима: здесь не мерится.
//   3. Адрес сервера — BASE (статический сервер копии dist/ сессии, не astro preview).
//   4. СТОП, если на странице призыва нет (`section.cta`) или он не один.
// Остальное — дословно копии: ОКНА (31), загрузка заново на каждом окне, ожидание картинок
// под сроком 8 с и стоп при недогрузке, сверка canonical, прокрутка «верх места минус 120»,
// рамки строк getClientRects по текстовым узлам с вычисленным цветом, скрытие колонки
// текста и зерна, осадка 250 мс.
// ПРЕДЕЛЫ — копии (шапки kontrast-art.mjs и kontrast-art-snyatie.js): зерно снято и не
// учтено; колонка скрывается целиком; между окнами полосы не судится; высоты окон 700–1180.
// Выгрузка: browser_evaluate (() => JSON.stringify(window.__ka[<адрес>])) с filename
// <dir>/<слаг>/boxes.json, затем node kontrast-art.mjs <dir>/<слаг> <dir>/<слаг>/boxes.json.
async (page) => {
  const BASE = 'http://127.0.0.1:4402';
  const dir = 'D:/SEO/cloud/site-generator/.playwright-mcp/ka-p1/';
  const STRANICY = [
    ['/pc/', 'pc'],
    ['/games-like-max-payne/', 'games-like'],
    ['/media/', 'media'],
  ];
  const OKNA = [
    [360, 740], [390, 844], [414, 896], [480, 800], [560, 800], [600, 900], [640, 900],
    [641, 900], [700, 900], [720, 900], [768, 1024], [800, 900], [820, 1180], [860, 900],
    [900, 700], [960, 800], [1000, 900], [1024, 768], [1025, 900], [1060, 900], [1100, 800],
    [1140, 900], [1180, 900], [1194, 834], [1200, 900], [1280, 800], [1359, 900], [1360, 900],
    [1440, 900], [1600, 900], [1920, 1080],
  ];
  const MESTA = [['cta', '.cta', ['.cta__title', '.cta__lead'], '.cta__inner']];
  const vse = {};
  for (const [adres, slug] of STRANICY) {
    const all = {};
    for (const [w, h] of OKNA) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(BASE + adres, { waitUntil: 'networkidle' });
      const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href ?? null);
      if (!canonical || !canonical.includes('7thserpent.com')) throw new Error('СТОП: на ' + adres + ' не 7thserpent.com (canonical ' + canonical + ')');
      const prizyvov = await page.evaluate(() => document.querySelectorAll('section.cta').length);
      if (prizyvov !== 1) throw new Error('СТОП: на ' + adres + ' призывов ' + prizyvov + ', ждали один');
      const uslovia = await page.evaluate(async () => {
        document.documentElement.style.scrollBehavior = 'auto';
        await document.fonts.ready;
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
        const t0 = Date.now();
        while ([...document.images].some((i) => !i.complete) && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
        return { dpr: window.devicePixelRatio, clientWidth: document.documentElement.clientWidth, innerHeight: window.innerHeight, nezagruzheno: [...document.images].filter((i) => !i.complete || !i.naturalWidth).length };
      });
      if (uslovia.nezagruzheno) throw new Error('СТОП: на ' + adres + ' ' + w + '×' + h + ' не загружено картинок: ' + uslovia.nezagruzheno);
      const kadry = {};
      for (const [name, sel, targets, hide] of MESTA) {
        const boxes = await page.evaluate(async ({ sel, targets }) => {
          const sec = document.querySelector(sel);
          if (!sec) throw new Error('нет места ' + sel);
          const top = sec.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: Math.max(0, top - 120), behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 300));
          const out = [];
          for (const t of targets) for (const el of sec.querySelectorAll(t)) {
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let n;
            while ((n = walker.nextNode())) {
              if (!n.textContent.trim()) continue;
              const r = document.createRange();
              r.selectNodeContents(n);
              for (const b of r.getClientRects()) out.push({ t, color: getComputedStyle(n.parentElement).color, x: b.x, y: b.y, w: b.width, h: b.height, text: n.textContent.trim().slice(0, 40) });
            }
          }
          return out;
        }, { sel, targets });
        if (!boxes.length) throw new Error('СТОП: у места ' + name + ' на ' + adres + ' ' + w + ' нет ни одной строки текста');
        const handle = await page.addStyleTag({ content: hide + '{visibility:hidden!important}.grain{display:none!important}' });
        await page.waitForTimeout(250);
        await page.screenshot({ path: dir + slug + '/' + `ka-${w}x${h}-${name}.png` });
        await handle.evaluate((el) => el.remove());
        kadry[name] = boxes;
      }
      all[`${w}x${h}`] = { uslovia, kadry };
    }
    vse[adres] = all;
  }
  await page.evaluate((a) => { window.__ka = a; }, vse);
  return 'ok: ' + Object.entries(vse).map(([a, v]) => a + ' ' + Object.keys(v).length + ' окон').join(', ');
}
