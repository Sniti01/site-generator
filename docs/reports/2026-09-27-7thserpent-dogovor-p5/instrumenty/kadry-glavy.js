// Кадры стопа сессии 19 (П100: «мой взгляд: … ряд глав гайда (кадры 1440, 390 и 320, с путями в репозитории)») — для
// browser_run_code_unsafe Playwright MCP (параметр filename). Новый съёмщик, не судья: по образцу
// docs/reports/2026-09-27-7thserpent-pachka-5/instrumenty/kadry-stopa.js (сервер — статическая копия dist/ сборки
// последнего коммита, BASE и SBORKA вписываются перед прогоном; ответ 200 и canonical сверяются; картинки грузятся сразу
// и ждутся не дольше 8 с, недогрузка — стоп; зерно не снимается; DPR 1, полоса прокрутки headless-Chromium скрыта).
// Кадр — сам ряд «Chapters» (секция #chapters) целиком, снимком элемента, на трёх ширинах. Числа — window.__kadry
// (выгрузить browser_evaluate): рамка ряда, число строк абзацев, где стоят названия IX и XIII (строка абзаца).
async (page) => {
  const BASE = 'http://127.0.0.1:4435';
  const SBORKA = 'XXXXXXX';
  const dir = 'D:/SEO/cloud/site-generator/docs/reports/2026-09-27-7thserpent-dogovor-p5/kadry/';
  const ADRES = '/max-payne-3/guide/';
  const OKNA = [[1440, 900], [390, 844], [320, 640]];
  const chisla = {};
  for (const [w, h] of OKNA) {
    await page.setViewportSize({ width: w, height: h });
    const otvet = await page.goto(BASE + ADRES, { waitUntil: 'load' });
    if (!otvet || otvet.status() !== 200) throw new Error('СТОП: ' + ADRES + ' ответ ' + (otvet ? otvet.status() : 'нет'));
    const canonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href ?? null);
    if (canonical !== 'https://www.7thserpent.com' + ADRES) throw new Error('СТОП: canonical ' + canonical);
    const g = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      const t0 = Date.now();
      while ([...document.images].some((i) => !i.complete) && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
      const ryad = document.getElementById('chapters');
      if (!ryad) return { net: true };
      const b = ryad.getBoundingClientRect();
      const abzacy = [...ryad.querySelectorAll('.layer__body p')].map((p) => {
        const lh = parseFloat(getComputedStyle(p).lineHeight);
        return { strok: Math.round(p.getBoundingClientRect().height / lh), znakov: p.textContent.length };
      });
      const gde = (t) => { const i = [...ryad.querySelectorAll('.layer__body p')].findIndex((p) => p.textContent.includes(t)); return i < 0 ? null : i + 1; };
      return {
        nezagruzheno: [...document.images].filter((i) => !i.complete || !i.naturalWidth).length,
        ryad: { y: Math.round(b.top + scrollY), h: Math.round(b.height), w: Math.round(b.width) },
        abzacy,
        IX: gde('Here I Was Again, Halfway Down the World.'),
        XIII: gde('A Fat Bald Dude with a Bad Temper.'),
      };
    });
    if (g.net) throw new Error('СТОП: на ' + ADRES + ' нет ряда #chapters');
    if (g.nezagruzheno) throw new Error('СТОП: ' + ADRES + ' ' + w + ' не загружено картинок: ' + g.nezagruzheno);
    if (g.IX === null || g.XIII === null) throw new Error('СТОП: полных названий IX и XIII в ряду нет');
    chisla['max-payne-3-guide-' + w] = g;
    await page.waitForTimeout(300);
    await page.locator('#chapters').screenshot({ path: dir + 'max-payne-3-guide-' + w + '-glavy.png' });
  }
  await page.evaluate((c) => { window.__kadry = c; }, { sborka: SBORKA, ...chisla });
  return 'ok: сборка ' + SBORKA + '; ' + Object.keys(chisla).join(', ');
}
