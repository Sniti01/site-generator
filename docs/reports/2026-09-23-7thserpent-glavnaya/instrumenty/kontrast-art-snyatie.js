// Скрипт съёмки для замера составного контраста главной второго сайта (сессия 9,
// П79) — для browser_run_code_unsafe Playwright MCP (параметр filename). Пара
// к kontrast-art.mjs.
//
// Для каждого окна из ОКНА: окно ставится ДО загрузки, страница грузится заново
// (браузер выбирает кандидат srcset под это окно, как у посетителя — находка K3
// «судью судят»); для пяти мест (герой — заголовок и лид; контурная кнопка;
// полоса отметок; полоса-цитата; призыв) собираются рамки строк текста
// (getClientRects по текстовым узлам) с вычисленным цветом, затем колонка
// текста места скрывается
// (visibility: hidden), зерно снимается (.grain) и снимается окно.
// Кадры — в .playwright-mcp/ka/ (вне git); рамки и условия съёмки (окно, DPR)
// кладутся в window.__ka — выгрузить вызовом browser_evaluate
// (() => JSON.stringify(window.__ka)) с filename .playwright-mcp/ka/boxes.json:
//   node kontrast-art.mjs .playwright-mcp/ka .playwright-mcp/ka/boxes.json
//
// ОКНА — полоса ширин, а не четыре точки (находка K1/M1: на 1440/1280/1024/390
// замер проходил, а лид героя падал до 1,3:1 на 641–1000 и 1025–1179): обе
// стороны каждого порога главной (640/641, 1024/1025, 1359/1360), между ними
// шаг от 1 до 80px, выше 1360 — 80, 160 и 320px, и размеры планшетов
// (768×1024, 820×1180, 1194×834). Между окнами полоса не судит (раунд 2,
// R2-KA-1: на частой полосе лид героя 5,70 на 1465–1485 против 5,72 на 1440).
// Пределы: колонка текста скрывается целиком — рамки чипов и кнопок и начало
// трассы (они внутри колонки) в фон замера не входят (находка M6; под буквами
// их нет); прокрутка к месту — «верх места минус 120» (у героя — 0); высоты
// окон — 700–1180 (на низком окне строки героя под сгибом — отказ, не замер).
async (page) => {
  const URL = 'http://localhost:4331/';
  const dir = 'D:/SEO/cloud/site-generator/.playwright-mcp/ka/';
  const OKNA = [
    [360, 740], [390, 844], [414, 896], [480, 800], [560, 800], [600, 900], [640, 900],
    [641, 900], [700, 900], [720, 900], [768, 1024], [800, 900], [820, 1180], [860, 900],
    [900, 700], [960, 800], [1000, 900], [1024, 768], [1025, 900], [1060, 900], [1100, 800],
    [1140, 900], [1180, 900], [1194, 834], [1200, 900], [1280, 800], [1359, 900], [1360, 900],
    [1440, 900], [1600, 900], [1920, 1080],
  ];
  const MESTA = [
    ['hero', '.hero', ['.hero__title', '.hero__lead'], '.hero__inner'],
    // Кнопки и отметки — своими местами со своей прокруткой: на низком окне
    // телефона (360×740) они ниже первого экрана, и в кадре героя их строки
    // оказывались вне кадра (первый прогон новой редакции).
    ['herobtn', '.hero__actions', ['.btn-secondary'], '.hero__inner'],
    ['herochips', '.hero__jump', ['.hero__chip-year', '.hero__chip-place'], '.hero__inner'],
    ['quote', '.creed', ['.creed__body'], '.creed__inner'],
    ['cta', '.cta', ['.cta__title', '.cta__lead'], '.cta__inner'],
  ];
  const all = {};
  for (const [w, h] of OKNA) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(URL, { waitUntil: 'networkidle' });
    const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href ?? null);
    if (!canonical || !canonical.includes('7thserpent.com')) throw new Error('СТОП: на ' + URL + ' не 7thserpent.com (canonical ' + canonical + ')');
    const uslovia = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      const t0 = Date.now();
      while ([...document.images].some((i) => !i.complete) && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
      return { dpr: window.devicePixelRatio, clientWidth: document.documentElement.clientWidth, innerHeight: window.innerHeight, nezagruzheno: [...document.images].filter((i) => !i.complete || !i.naturalWidth).length };
    });
    if (uslovia.nezagruzheno) throw new Error('СТОП: на ' + w + '×' + h + ' не загружено картинок: ' + uslovia.nezagruzheno);
    const kadry = {};
    for (const [name, sel, targets, hide] of MESTA) {
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
            for (const b of r.getClientRects()) out.push({ t, color: getComputedStyle(n.parentElement).color, x: b.x, y: b.y, w: b.width, h: b.height, text: n.textContent.trim().slice(0, 40) });
          }
        }
        return out;
      }, { sel, targets });
      if (!boxes.length) throw new Error('СТОП: у места ' + name + ' на ' + w + ' нет ни одной строки текста');
      const handle = await page.addStyleTag({ content: hide + '{visibility:hidden!important}.grain{display:none!important}' });
      await page.waitForTimeout(250);
      await page.screenshot({ path: dir + `ka-${w}x${h}-${name}.png` });
      await handle.evaluate((el) => el.remove());
      kadry[name] = boxes;
    }
    all[`${w}x${h}`] = { uslovia, kadry };
  }
  await page.evaluate((a) => { window.__ka = a; }, all);
  return 'ok: ' + Object.keys(all).length + ' окон';
}
