// Копия `docs/reports/2026-09-26-7thserpent-pachka-2/instrumenty/rastyazhenie.js` (сессия 15, 6c127da)
// для сессии 16 (П93 п. 0г: «по таблице rastyazhenie (те же окна и DPR) растяжение «после» нигде
// не больше «до»»); отличие — адрес сервера, хеш сборки и эта строка шапки. Прогон «до» и «после» —
// одной копией, меняются только BASE и SBORKA.
// Растяжение кадра героя на широких экранах (сессия 15, П91 п. 4: «Мастера 1920 (бэклог 59 п. 2):
// растяжение на широких экранах — числом в доклад») — для browser_run_code_unsafe Playwright MCP.
// Для каждой страницы с героем, окна и плотности (DPR 1 и 2 — отдельный контекст браузера с
// deviceScaleFactor) грузится страница и в ней меряется: рамка картинки героя (`.hero__art img`,
// CSS-пиксели), выбранный браузером кандидат srcset (`currentSrc`; его ширина — дескриптор `w`
// этого адреса в `srcset`, НЕ `naturalWidth`: при srcset с `w` тот пересчитан по sizes — первый
// прогон скрипта на этом ошибся) и нарисованная ширина кадра при `object-fit: cover` =
// max(ширина рамки, высота рамки × пропорция кадра). Растяжение = нарисованная ширина × DPR /
// ширина кандидата; больше 1 — пикселей кадра меньше, чем точек экрана под ним. Числа — в
// window.__rast (выгрузить browser_evaluate).
// Узкие окна (390×844 и 800×900) и DPR 3 добавлены после «судью судят», раунд 1
// (P2-R1-MARSHRUT-6): правило `sizes` главной занижает нарисованную ширину баннера до 640 px
// и на 641–1024 px, и растяжение там больше, чем на широких экранах.
// ПРЕДЕЛЫ: высота окна для каждого — 16:9 от ширины (кроме 1024×768, 1366×768, 390×844 и
// 800×900); кадровка (`object-position`) на растяжение не влияет; при cover по ширине (рамка шире
// кадра) растяжение считается так же.
async (page) => {
  const BASE = 'http://127.0.0.1:4421';
  const SBORKA = 'b64609d';
  const STRANICY = ['/max-payne-3/', '/max-payne-2/', '/max-payne-1/', '/remake/'];
  const OKNA = [[390, 844], [800, 900], [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1600, 900], [1920, 1080], [2560, 1440], [3840, 2160]];
  const browser = page.context().browser();
  const out = [];
  for (const dpr of [1, 2, 3]) {
    const ctx = await browser.newContext({ deviceScaleFactor: dpr, viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    for (const adres of STRANICY) {
      for (const [w, h] of OKNA) {
        await p.setViewportSize({ width: w, height: h });
        const otvet = await p.goto(BASE + adres, { waitUntil: 'load' });
        if (!otvet || otvet.status() !== 200) throw new Error('СТОП: ' + adres + ' ответ ' + (otvet ? otvet.status() : 'нет'));
        const m = await p.evaluate(async () => {
          const img = document.querySelector('.hero__art img');
          const t0 = Date.now();
          while (!img.complete && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
          const b = img.getBoundingClientRect();
          const ratio = img.naturalWidth / img.naturalHeight;
          const narisovano = Math.max(b.width, b.height * ratio);
          // Ширина выбранного кандидата — из дескриптора `w` в srcset для currentSrc: naturalWidth
          // при srcset с `w` — это ширина, пересчитанная по sizes (первый прогон этого скрипта
          // брал её за ширину кандидата и дал ложные числа).
          const kandidaty = img.srcset.split(',').map((s) => s.trim().split(/\s+/)).map(([u, d]) => ({ url: new URL(u, location.href).href, w: parseInt(d, 10) }));
          const vybran = kandidaty.find((k) => k.url === img.currentSrc);
          return { dpr: devicePixelRatio, ramka: [Math.round(b.width), Math.round(b.height)], kandidat: vybran ? vybran.w : NaN, vsego: kandidaty.map((k) => k.w).join('/'), src: img.currentSrc.split('/').pop(), narisovano: Math.round(narisovano) };
        });
        out.push({ adres, okno: w + 'x' + h, ...m, rastyazhenie: Math.round((m.narisovano * m.dpr / m.kandidat) * 100) / 100 });
      }
    }
    await ctx.close();
  }
  await page.evaluate((o) => { window.__rast = o; }, out);
  return 'сборка ' + SBORKA + ', сервер ' + BASE + '\n' + out.map((r) => `${r.adres} ${r.okno}@${r.dpr}: рамка ${r.ramka.join('×')}, кандидат ${r.kandidat}w из ${r.vsego}, нарисовано ${r.narisovano}, растяжение ×${r.rastyazhenie}`).join('\n');
}
