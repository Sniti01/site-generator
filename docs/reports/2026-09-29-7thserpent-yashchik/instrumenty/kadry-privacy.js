// Кадры /privacy/ для взгляда владельца (сессия 23, П108: «/privacy/ кадрами 1440 и 390 с путями в репозитории») —
// для browser_run_code_unsafe Playwright MCP, кодом строкой (файл вне корня репозитория MCP не принимает, бэклог 71 п. 10).
// Копия kadry-privacy.js сессии 22 (docs/reports/2026-09-28-7thserpent-publikacija/instrumenty/): окна 1440 и 390, сборка
// SBORKA, в строке итога — ещё число рядов и видимость адреса ящика (innerText). Сервер — статическая копия dist/ сборки
// (server.mjs); ответ 200 и canonical сверяются; каждое окно — новый контекст без кэша. Зерно не снимается; DPR 1.
async (page) => {
  const BASE = 'http://127.0.0.1:4437';
  const SBORKA = 'b33709d';
  if (!/^[0-9a-f]{7,40}$/.test(SBORKA)) throw new Error('СТОП: SBORKA — не хеш коммита');
  const dir = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/kadry/';
  const ADRES = '/privacy/';
  const YASHCHIK = 'contact@7thserpent.com';
  const OKNA = [[1440, 900], [390, 844]];
  const browser = page.context().browser();
  const stroki = [`сборка ${SBORKA}, сервер ${BASE}, ${ADRES}`];
  for (const [w, h] of OKNA) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const zaprosy = [];
    p.on('request', (r) => zaprosy.push(r.url()));
    const otvet = await p.goto(BASE + ADRES, { waitUntil: 'networkidle' });
    if (!otvet || otvet.status() !== 200) throw new Error('СТОП: ответ ' + (otvet ? otvet.status() : 'нет'));
    const g = await p.evaluate(async (yashchik) => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
      return {
        canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
        vysota: document.documentElement.scrollHeight,
        shirina: document.documentElement.scrollWidth,
        okno: document.documentElement.clientWidth,
        ryadov: document.querySelectorAll('main section[id]').length,
        podpis: document.querySelector('.byline__line')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
        adres: document.body.innerText.includes(yashchik),
      };
    }, YASHCHIK);
    if (g.canonical !== 'https://www.7thserpent.com' + ADRES) throw new Error('СТОП: canonical ' + g.canonical);
    await p.waitForTimeout(300);
    await p.screenshot({ path: dir + 'privacy-' + w + '-ekran.png' });
    await p.screenshot({ path: dir + 'privacy-' + w + '-celikom.jpg', fullPage: true, type: 'jpeg', quality: 70 });
    const chuzhie = zaprosy.filter((u) => !u.startsWith(BASE + '/') && !u.startsWith('data:'));
    stroki.push(`${w}x${h}: ответ 200, высота ${g.vysota}, ширина документа ${g.shirina} при окне ${g.okno}, рядов ${g.ryadov}, подпись «${g.podpis}», адрес ${YASHCHIK} в видимом тексте — ${g.adres ? 'да' : 'НЕТ'}, запросов ${zaprosy.length}, внешних ${chuzhie.length}${chuzhie.length ? ': ' + chuzhie.join(' ') : ''}`);
    await ctx.close();
  }
  return stroki.join('\n');
}
