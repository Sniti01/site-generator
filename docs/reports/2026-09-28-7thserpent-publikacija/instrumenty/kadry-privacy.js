// Кадры /privacy/ для взгляда владельца (сессия 22, П106: «/privacy/ кадрами 1440, 390 и 320, с путями в репозитории») —
// для browser_run_code_unsafe Playwright MCP (параметр filename). Копия kadry-celikom.js сессии 18
// (docs/reports/2026-09-27-7thserpent-pachka-5/instrumenty/) с первым экраном PNG рядом со страницей целиком (JPEG 70),
// внешними запросами страницы и шириной документа против окна (горизонтальная прокрутка).
// Сервер — статическая копия dist/ сборки SBORKA (BASE); ответ 200 и canonical сверяются; каждое окно — новый
// контекст без кэша. Зерно не снимается; DPR 1. Итог — строкой (выгрузить в журнал).
async (page) => {
  const BASE = 'http://127.0.0.1:4436';
  const SBORKA = 'bbfce3d';
  if (!/^[0-9a-f]{7,40}$/.test(SBORKA)) throw new Error('СТОП: SBORKA — не хеш коммита');
  const dir = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/2a2fa1b5-b706-4952-b80c-ce6acb0f1174/scratchpad/kadry/';
  const ADRES = '/privacy/';
  const OKNA = [[1440, 900], [390, 844], [320, 640]];
  const browser = page.context().browser();
  const stroki = [`сборка ${SBORKA}, сервер ${BASE}, ${ADRES}`];
  for (const [w, h] of OKNA) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const zaprosy = [];
    p.on('request', (r) => zaprosy.push(r.url()));
    const otvet = await p.goto(BASE + ADRES, { waitUntil: 'networkidle' });
    if (!otvet || otvet.status() !== 200) throw new Error('СТОП: ответ ' + (otvet ? otvet.status() : 'нет'));
    const g = await p.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
      return {
        canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
        vysota: document.documentElement.scrollHeight,
        shirina: document.documentElement.scrollWidth,
        okno: document.documentElement.clientWidth,
        ryadov: document.querySelectorAll('main section[id]').length,
        podpis: document.querySelector('.byline__line')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      };
    });
    if (g.canonical !== 'https://www.7thserpent.com' + ADRES) throw new Error('СТОП: canonical ' + g.canonical);
    await p.waitForTimeout(300);
    await p.screenshot({ path: dir + 'privacy-' + w + '-ekran.png' });
    await p.screenshot({ path: dir + 'privacy-' + w + '-celikom.jpg', fullPage: true, type: 'jpeg', quality: 70 });
    const chuzhie = zaprosy.filter((u) => !u.startsWith(BASE + '/') && !u.startsWith('data:'));
    stroki.push(`${w}x${h}: ответ 200, высота ${g.vysota}, ширина документа ${g.shirina} при окне ${g.okno}, рядов ${g.ryadov}, подпись «${g.podpis}», запросов ${zaprosy.length}, внешних ${chuzhie.length}${chuzhie.length ? ': ' + chuzhie.join(' ') : ''}`);
    await ctx.close();
  }
  return stroki.join('\n');
}
