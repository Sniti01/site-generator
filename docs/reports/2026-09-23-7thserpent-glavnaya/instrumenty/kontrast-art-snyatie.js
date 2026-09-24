// Скрипт съёмки для замера составного контраста главной второго сайта (сессия 9,
// П79) — для browser_run_code_unsafe Playwright MCP (параметр filename). Пара
// к kontrast-art.mjs: для четырёх ширин (1440, 1280, 1024, 390) и четырёх мест
// (герой, полоса чипов, полоса-цитата, призыв) собирает рамки строк текста
// (getClientRects по текстовым узлам) с вычисленным цветом, затем СКРЫВАЕТ
// колонку текста места (visibility: hidden) и зерно (.grain) и снимает окно.
// Кадры — в .playwright-mcp/ka/ (вне git); рамки кладутся в window.__ka —
// выгрузить в файл вызовом browser_evaluate (() => JSON.stringify(window.__ka))
// с filename .playwright-mcp/ka/boxes.json, затем:
//   node kontrast-art.mjs .playwright-mcp/ka .playwright-mcp/ka/boxes.json
// Адрес превью — первой строкой (порт превью сессии 9 — 4331).
// Пределы: прокрутка к месту — «верх места минус 120» (у героя — 0); место,
// не влезшее в окно, даёт «вне кадра» в kontrast-art.mjs, а не ложный замер.
async (page) => {
  const URL = 'http://localhost:4331/';
  const dir = 'D:/SEO/cloud/site-generator/.playwright-mcp/ka/';
  const all = {};
  await page.goto(URL, { waitUntil: 'networkidle' });
  const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href ?? null);
  if (!canonical || !canonical.includes('7thserpent.com')) throw new Error('СТОП: на ' + URL + ' не 7thserpent.com (canonical ' + canonical + ')');
  for (const [w, h] of [[1440, 900], [1280, 800], [1024, 768], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      const t0 = Date.now();
      while ([...document.images].some((i) => !i.complete) && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
    });
    const kadry = {};
    for (const [name, sel, targets, hide] of [
      ['hero', '.hero', ['.hero__title', '.hero__lead', '.hero__chip-year', '.hero__chip-place', '.btn-secondary'], '.hero__inner'],
      ['herochips', '.hero__jump', ['.hero__chip-year', '.hero__chip-place'], '.hero__inner'],
      ['quote', '.creed', ['.creed__body'], '.creed__inner'],
      ['cta', '.cta', ['.cta__title', '.cta__lead'], '.cta__inner'],
    ]) {
      const boxes = await page.evaluate(async ({ sel, targets }) => {
        const sec = document.querySelector(sel);
        if (!sec) throw new Error('нет места ' + sel);
        const top = sec.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: sel === '.hero' ? 0 : Math.max(0, top - 120), behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 300));
        const out = [];
        for (const t of targets) for (const el of sec.querySelectorAll(t)) {
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = walker.nextNode())) {
            if (!n.textContent.trim()) continue;
            const r = document.createRange();
            r.selectNodeContents(n);
            for (const b of r.getClientRects()) out.push({ t, color: getComputedStyle(n.parentElement).color, x: b.x, y: b.y, w: b.width, h: b.height, text: n.textContent.trim().slice(0, 30) });
          }
        }
        return out;
      }, { sel, targets });
      if (!boxes.length) throw new Error('СТОП: у места ' + name + ' на ' + w + ' нет ни одной строки текста');
      const handle = await page.addStyleTag({ content: hide + '{visibility:hidden!important}.grain{display:none!important}' });
      await page.waitForTimeout(250);
      await page.screenshot({ path: dir + `ka-${w}-${name}.png` });
      await handle.evaluate((el) => el.remove());
      kadry[name] = boxes;
    }
    all[w] = kadry;
  }
  await page.evaluate((a) => { window.__ka = a; }, all);
  return 'ok: ' + Object.entries(all).map(([w, k]) => w + ' ' + Object.values(k).map((b) => b.length).join('/')).join(', ');
}
