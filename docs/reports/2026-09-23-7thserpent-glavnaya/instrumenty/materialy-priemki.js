// Материалы приёмки глазами главной второго сайта (сессия 9, П79): полные кадры страницы
// с превью (сборка — со слов ведущего) на пяти окнах, в папку доклада.
//
// Порядок — как у драйвера эталона (kadry-gen, П16): ОДНА загрузка (на 1920), дальше окна
// по убыванию без перезагрузки; на каждом — прокрутка по всей странице, ожидание картинок,
// прокрутка к началу, осадка, кадр окна, осадка, полный кадр. Первые редакции скрипта
// грузили страницу заново на каждом окне, и съёмка полной страницы в Chromium раз за разом
// рисовала героя без ключевого арта (кадр окна при этом с артом; опыты art-fullpage-test*.js):
// на 1280, 1024, 768 и 390, но не на 1440. Механизм (раунд 3 «судью судят», R3-KR-3): при
// съёмке полной страницы Chromium заново выбирает кандидат srcset и берёт тот, что уже лежит
// в кэше вкладки после прошлой загрузки, а кадр снимается раньше, чем новый кандидат
// отрисован; в свежем контексте пропажи нет. Защита — первая загрузка на крупнейшем окне:
// браузер сразу берёт крупнейший кандидат, подменять его нечем. Следствие — у посетителя
// с узким окном кандидат меньше; на вид это не влияет. Проверки: до и после полного кадра
// сверяется currentSrc всех картинок (подмена — стоп); в области арта героя должен быть
// свет фонаря (ни в кадре окна, ни в полном кадре его отсутствие не пропускается).
// ПРЕДЕЛ: отрисовка в полном кадре проверяется светом только у арта героя; остальные 16
// картинок — по DOM и currentSrc.
// Кадры окна на низких окнах (glavnaya-okno-*.png) — там, где видна правка R2-S2 (полоса
// арта 641–1024 без нижнего предела) и кадровка с привязкой к верху (R3-S2): на окнах
// выше 682px правка ничего не меняет, и полные кадры её не показывают (R3-KR-2).
async (page) => {
  const OUT = 'D:/SEO/cloud/site-generator/docs/reports/2026-09-23-7thserpent-glavnaya/';
  const OKNA = [[1440, 900], [1280, 800], [1024, 768], [768, 1024], [390, 844]];
  const svetOf = async (buf, art) => page.evaluate(async ({ b64, art }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = Math.round(art.w); c.height = Math.round(art.h);
    const x = c.getContext('2d'); x.drawImage(img, Math.round(art.x), Math.round(art.y), c.width, c.height, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] - d[i + 2] > 60) n++;
    return n / (d.length / 4);
  }, { b64: buf.toString('base64'), art });
  const osadka = () => page.evaluate(() => new Promise((r) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(r)), 700)));
  const log = [];
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:4331/', { waitUntil: 'networkidle' });
  const c = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.href ?? null);
  if (!c || !c.includes('7thserpent.com')) throw new Error('СТОП: не 7thserpent.com: ' + c);
  for (const [w, h] of OKNA) {
    await page.setViewportSize({ width: w, height: h });
    const g = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      const shag = Math.round(window.innerHeight * 0.9);
      for (let y = 0; y <= document.body.scrollHeight; y += shag) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 80));
      }
      const t0 = Date.now();
      while ([...document.images].some((i) => !i.complete) && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
      window.scrollTo({ top: 0, behavior: 'instant' });
      const a = document.querySelector('.hero__art').getBoundingClientRect();
      return { img: document.images.length, ok: [...document.images].filter((i) => i.complete && i.naturalWidth).length, h: document.body.scrollHeight, art: { x: a.x, y: a.y + scrollY, w: a.width, h: a.height } };
    });
    if (g.ok !== g.img) throw new Error('СТОП: на ' + w + ' загружено ' + g.ok + ' из ' + g.img);
    await osadka();
    const okno = await svetOf(await page.screenshot({ scale: 'css' }), g.art);
    await osadka();
    const src = () => page.evaluate(() => [...document.images].map((i) => i.currentSrc));
    const srcDo = await src();
    const full = await svetOf(await page.screenshot({ path: OUT + `glavnaya-${w}.png`, fullPage: true, scale: 'css' }), g.art);
    const srcPosle = await src();
    const podmena = srcDo.filter((s, i) => s !== srcPosle[i]).length;
    log.push(`${w}x${h}: ${g.img}/${g.img} картинок, страница ${g.h}px, свет фонаря в арте: окно ${(okno * 100).toFixed(1)} %, полный кадр ${(full * 100).toFixed(1)} %, подмен кандидата ${podmena}`);
    if (okno < 0.05 || full < 0.05 || podmena) throw new Error('СТОП: на ' + w + ' арт не нарисован или кандидат подменён\n' + log.join('\n'));
  }
  // Кадры окна на низких окнах (R3-KR-2) — первый экран, как у посетителя при scrollY = 0.
  for (const [w, h] of [[667, 375], [844, 390], [1024, 600]]) {
    await page.setViewportSize({ width: w, height: h });
    const art = await page.evaluate(async () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const a = document.querySelector('.hero__art').getBoundingClientRect();
      return { x: a.x, y: a.y, w: a.width, h: a.height };
    });
    await osadka();
    const okno = await svetOf(await page.screenshot({ path: OUT + `glavnaya-okno-${w}x${h}.png`, scale: 'css' }), art);
    log.push(`окно ${w}x${h}: полоса арта ${Math.round(art.h)}px, свет фонаря ${(okno * 100).toFixed(1)} %`);
    if (okno < 0.05) throw new Error('СТОП: на окне ' + w + 'x' + h + ' арт не нарисован\n' + log.join('\n'));
  }
  return log.join('\n');
}
