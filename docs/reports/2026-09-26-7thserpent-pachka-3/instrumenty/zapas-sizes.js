// Запасные записи sizes героя (сессия 16, «судью судят», раунд 1, P3-R1-MARSHRUT-1) — для
// browser_run_code_unsafe Playwright MCP (параметр filename). Браузер, который не разбирает max() и
// clamp() в sizes (Safari до 26.4), пропускает такие записи; опыт воспроизводит это в Chromium: на
// странице героя создаются две проверочные картинки с srcset героя — A со строкой sizes маршрута как
// есть, B с той же строкой, где каждая «max(» заменена на «maxx(» (функция, которой нет, — запись
// не разбирается). Значение sizes, которое применил браузер, = naturalWidth × w / ширина файла (при
// srcset с дескриптором w naturalWidth = ширина файла × sizes / w, какой кандидат ни выбран).
// Ждём: A = расчёт маршрута, B = прежнее правило (200vw до 1024 px, 170vw выше). Расчёт — та же формула,
// что sizesGeroya маршрута (пропорция мастера — вторым элементом STRANICY, числа округлены вверх до
// сотых), вердикт сверяет оба числа в пределах 1 px («судью судят», раунд 2, P3-R2-MARSHRUT-1: первая
// редакция проверяла только B и A ≥ прежнего — потерянная правка проходила); строка sizes героя пишется
// в каждую клетку.
// ПРЕДЕЛ: это модель браузера без max(), а не Safari; разбор условий max-width Safari понимает давно.
// Модель одна — ни max(), ни clamp(); случай «max() есть, clamp() нет», низкие окна, кэш внутри документа
// и предзагрузка проверены опытом линзы в раунде 2 (P3-R2-MARSHRUT-2), этим инструментом — нет.
// Числа — window.__zapas вкладки, которую держит MCP (выгрузить browser_evaluate в JSON); вкладка —
// только сосуд выгрузки, замер идёт в своём контексте (P3-R2-MARSHRUT-7).
async (page) => {
  const BASE = 'http://127.0.0.1:4425';
  const SBORKA = '1d68052';
  const STRANICY = [['/max-payne-3/', 1920 / 620], ['/max-payne-2/', 1920 / 620], ['/max-payne-1/', 3840 / 1240], ['/remake/', 1280 / 960]];
  const OKNA = [[390, 844], [640, 900], [641, 900], [800, 900], [1024, 768], [1025, 900], [1440, 900], [1920, 1080]];
  const browser = page.context().browser();
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const out = [];
  for (const [adres, prop] of STRANICY) {
    for (const [w, h] of OKNA) {
      await p.setViewportSize({ width: w, height: h });
      const otvet = await p.goto(BASE + adres, { waitUntil: 'load' });
      if (!otvet || otvet.status() !== 200) throw new Error('СТОП: ' + adres + ' ответ ' + (otvet ? otvet.status() : 'нет'));
      const m = await p.evaluate(async (prop) => {
        const hero = document.querySelector('.hero__art img');
        const vverkh = (x) => Math.ceil(x * 100) / 100;
        const vw = innerWidth / 100;
        const vh = innerHeight / 100;
        const vysota = Math.min(Math.max(vverkh(600 * prop), vverkh(90 * prop) * vh), vverkh(920 * prop));
        const raschet = innerWidth <= 640
          ? Math.max(200 * vw, vverkh(40 * prop) * vh, vverkh(260 * prop))
          : innerWidth <= 1024 ? Math.max(200 * vw, vysota) : Math.max(170 * vw, vysota);
        const znachenie = async (sizes) => {
          const img = document.createElement('img');
          img.style.cssText = 'position:absolute;left:-9999px;top:0;width:10px;height:10px';
          img.sizes = sizes;
          img.srcset = hero.srcset;
          document.body.appendChild(img);
          await img.decode();
          const kandidaty = img.srcset.split(',').map((x) => x.trim().split(/\s+/)).map(([u, d]) => ({ url: new URL(u, location.href).href, w: parseInt(d, 10) }));
          const vybran = kandidaty.find((k) => k.url === img.currentSrc);
          const fayl = new Image();
          fayl.src = img.currentSrc;
          await fayl.decode();
          const v = (img.naturalWidth * vybran.w) / fayl.naturalWidth;
          img.remove();
          return v;
        };
        const a = await znachenie(hero.sizes);
        const b = await znachenie(hero.sizes.split('max(').join('maxx('));
        const prezhnee = innerWidth <= 1024 ? 2 * innerWidth : 1.7 * innerWidth;
        return { sizes: hero.sizes, a, raschet, b, prezhnee };
      }, prop);
      out.push({ adres, okno: w + 'x' + h, ...m, ok: Math.abs(m.b - m.prezhnee) <= 1 && Math.abs(m.a - m.raschet) <= 1 && m.a >= m.prezhnee - 1 });
    }
  }
  await ctx.close();
  await page.evaluate((o) => { window.__zapas = o; }, { sborka: SBORKA, base: BASE, kletki: out });
  const plokhih = out.filter((r) => !r.ok);
  return [
    'сборка ' + SBORKA + ', сервер ' + BASE + ', DPR 1',
    ...out.map((r) => `${r.adres} ${r.okno}: с max() ${Math.round(r.a)} (расчёт ${Math.round(r.raschet)}), без max() ${Math.round(r.b)}, прежнее правило ${Math.round(r.prezhnee)}${r.ok ? '' : ' — НЕ ТАК'}`),
    'клеток ' + out.length + '; с max() не равно расчёту, без max() не равно прежнему правилу или с max() меньше прежнего: ' + plokhih.length,
  ].join('\n');
}
