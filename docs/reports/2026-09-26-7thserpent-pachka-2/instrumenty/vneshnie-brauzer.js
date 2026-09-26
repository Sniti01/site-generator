// Внешние запросы в браузере (сессия 15, приёмка П91: «без внешних запросов») — для
// browser_run_code_unsafe Playwright MCP (параметр filename). Пара к статическому
// `docs/reports/2026-09-25-7thserpent-pachka-1/instrumenty/vneshnie.mjs`: тот разбирает файлы
// сборки, этот слушает запросы живой страницы — на всех девяти страницах, на 1440×900 и 390×844,
// с прокруткой до низа (ленивые картинки), без кэша (новый контекст на каждую страницу).
// Внешний запрос — любой, чей хост не BASE. Итог — строка на страницу и окно.
// Предел: запросы после 1,5 с тишины и после ухода со страницы не видны; `<a>` не нажимаются.
async (page) => {
  const BASE = 'http://127.0.0.1:4416';
  const SBORKA = 'e35cab8';
  const STRANICY = ['/', '/max-payne-1/', '/max-payne-2/', '/max-payne-3/', '/remake/', '/pc/', '/media/', '/games-like-max-payne/', '/404/'];
  const OKNA = [[1440, 900], [390, 844]];
  const browser = page.context().browser();
  const stroki = [];
  let vneshnikh = 0;
  for (const [w, h] of OKNA) {
    for (const adres of STRANICY) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const p = await ctx.newPage();
      const zaprosy = [];
      p.on('request', (r) => zaprosy.push(r.url()));
      const otvet = await p.goto(BASE + adres, { waitUntil: 'networkidle' });
      await p.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      });
      await p.waitForLoadState('networkidle');
      await p.waitForTimeout(1500);
      const chuzhie = zaprosy.filter((u) => !u.startsWith(BASE + '/') && !u.startsWith('data:'));
      vneshnikh += chuzhie.length;
      stroki.push(`${w}x${h} ${adres.padEnd(24)} ответ ${otvet ? otvet.status() : 'нет'}, запросов ${zaprosy.length}, внешних ${chuzhie.length}${chuzhie.length ? ': ' + chuzhie.join(' ') : ''}`);
      await ctx.close();
    }
  }
  return [`сборка ${SBORKA}, сервер ${BASE}`, ...stroki, `итого внешних запросов: ${vneshnikh}`].join('\n');
}
