// Занижение sizes героя (сессия 16, П93 п. 0г: «занижение там, где герой растёт от текста, — предел,
// числом в доклад») — для browser_run_code_unsafe Playwright MCP (параметр filename). Итог — объект
// window.__zan (выгрузить browser_evaluate в JSON; текст итога — zanizhenie-itog.mjs рядом).
// Редакция раунда 1 «судью судят» (P3-R1-INSTR-1…4, -14): первая редакция выбирала низкие окна
// допущением («у 1025 px колонка самая узкая») и проверяла свой разбор sizes только корзиной кандидата.
//
// ЗАНИЖЕНИЕ = нарисованная ширина кадра / значение sizes; больше 1 — браузер выбирает кандидата по
// ширине меньше нарисованной. Нарисованная ширина — max(ширина рамки, высота рамки × пропорция) при
// object-fit: cover, пропорция — ТОЧНАЯ, мастера (вторым элементом STRANICY; числа — ширина и высота
// записи src/data/game-art.json; ключ кадра страницы сверяется с currentSrc).
// ЗНАЧЕНИЕ sizes — своим разбором строки img.sizes: пары «условие — длина» по запятым верхнего уровня,
// условие — одна скобочная группа (так написан sizes маршрута), первое истинное по matchMedia (или пара
// без условия) даёт длину, длина мерится шириной пустого блока. ПРЕДЕЛ разбора (P3-R1-INSTR-3):
// условия с and/not/or и длины в em он не понимает — поэтому он сверяется с браузером (ниже).
//
// ЧАСТЬ 1 — КЛЕТКИ С НАВИГАЦИЕЙ (окна OKNA на каждой странице; одна навигация на клетку обязательна —
// внутри документа Chromium предпочитает уже загруженного большего кандидата, P3-R1-INSTR-4). В каждой
// клетке разбор сверяется со значением браузера: при srcset с дескриптором w naturalWidth картинки =
// ширина файла × sizes / w, поэтому значение браузера = naturalWidth × w / ширина файла (ширина файла —
// naturalWidth отдельной картинки без srcset по тому же адресу). Расхождение больше 1 px — отказ клетки.
//
// ЧАСТЬ 2 — СКАН ШИРИН без перезагрузки (P3-R1-INSTR-1): каждая страница, высота окна 600, ширина от 641
// до 2560 шагом 1 px — только раскладка (высота героя, рамка) и разбор sizes, проверенный частью 1.
// При высоте 600 нижняя граница высоты героя — 600 px (clamp(600px, 90vh, 920px) ядра), и у неё любой
// рост от текста виден; при высотах до 666 граница та же, выше — граница растёт, и рост от текста
// начинается позже. До 640 px высота рамки арта от текста не зависит (полоса max(40vh, 260px)), поэтому
// там скана нет.
// ПРЕДЕЛЫ: высоты окна кроме 600 сканом не судятся (граница выше — запас больше); полоса прокрутки
// headless-Chromium — 0 (имитация полосы 17 px в раунде 1 дала те же числа, P3-R1-INSTR-14); DPR 1;
// шрифт браузера — по умолчанию (16 px): при крупном шрифте пользователя текст растит героя сильнее
// (до ×1,43 при 24 px, P3-R1-MARSHRUT-3), этот инструмент его не меряет (P3-R2-INSTR-8); значение sizes
// мерится шириной блока, раскладка округляет её до 1/64 px — «больше 1» считается сверх 1,0005
// (P3-R2-INSTR-5).
async (page) => {
  const BASE = 'http://127.0.0.1:4425';
  const SBORKA = '1d68052';
  const STRANICY = [
    ['/max-payne-3/', 'mp3-art', 1920 / 620],
    ['/max-payne-2/', 'mp2-art', 1920 / 620],
    ['/max-payne-1/', 'hero', 3840 / 1240],
    ['/remake/', 'mp1-k13', 1280 / 960],
  ];
  const OKNA = [
    [360, 740], [390, 844], [414, 896], [480, 800], [560, 800], [600, 900], [640, 900],
    [641, 900], [700, 900], [720, 900], [768, 1024], [800, 900], [820, 1180], [860, 900],
    [900, 700], [960, 800], [1000, 900], [1024, 768], [1025, 900], [1060, 900], [1100, 800],
    [1140, 900], [1180, 900], [1194, 834], [1200, 900], [1280, 800], [1359, 900], [1360, 900],
    [1440, 900], [1600, 900], [1920, 1080],
    [320, 640], [640, 360], [800, 600], [1024, 600], [1280, 720], [1366, 768], [2560, 1440], [3840, 2160],
    [641, 600], [1025, 600], [1038, 600], [1060, 600], [1091, 600], [1100, 600],
  ];
  const MERKA = (prop, klyuch) => {
    const img = document.querySelector('.hero__art img');
    const hero = document.querySelector('section.hero');
    if (!img || !hero) throw new Error('нет героя');
    const pary = [];
    let glub = 0;
    let nachalo = 0;
    const s = img.sizes;
    for (let i = 0; i <= s.length; i++) {
      const c = s[i];
      if (c === '(') glub += 1;
      else if (c === ')') glub -= 1;
      else if ((c === ',' && glub === 0) || i === s.length) {
        pary.push(s.slice(nachalo, i).trim());
        nachalo = i + 1;
      }
    }
    let dlina = null;
    let uslovie = null;
    for (const para of pary) {
      if (para.startsWith('(')) {
        let g = 0;
        let k = 0;
        for (; k < para.length; k++) {
          if (para[k] === '(') g += 1;
          else if (para[k] === ')') { g -= 1; if (g === 0) break; }
        }
        const u = para.slice(0, k + 1);
        if (matchMedia(u).matches) { uslovie = u; dlina = para.slice(k + 1).trim(); break; }
      } else { uslovie = '—'; dlina = para; break; }
    }
    const div = document.createElement('div');
    div.style.cssText = 'position:absolute;left:0;top:0;height:0;visibility:hidden;width:' + dlina;
    document.body.appendChild(div);
    const znachenie = div.getBoundingClientRect().width;
    div.remove();
    const b = img.getBoundingClientRect();
    const hb = hero.getBoundingClientRect();
    const granica = innerWidth <= 640 ? Math.max(0.4 * innerHeight, 260) : Math.min(Math.max(600, 0.9 * innerHeight), 920);
    const narisovano = Math.max(b.width, b.height * prop);
    const kadrSvoy = (img.currentSrc.split('/').pop() || '').split('.')[0] === klyuch;
    return { geroy: hb.height, granica, ramka: [b.width, b.height], narisovano, uslovie, dlina, znachenie, zanizhenie: narisovano / znachenie, kadrSvoy };
  };
  const browser = page.context().browser();
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const kletki = [];
  const skan = {};
  for (const [adres, klyuch, prop] of STRANICY) {
    for (const [w, h] of OKNA) {
      await p.setViewportSize({ width: w, height: h });
      const otvet = await p.goto(BASE + adres, { waitUntil: 'load' });
      if (!otvet || otvet.status() !== 200) throw new Error('СТОП: ' + adres + ' ответ ' + (otvet ? otvet.status() : 'нет'));
      const m = await p.evaluate(async ([prop, klyuch, merkaTekst]) => {
        const img = document.querySelector('.hero__art img');
        const t0 = Date.now();
        while (!img.complete && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
        const merka = eval('(' + merkaTekst + ')');
        const r = merka(prop, klyuch);
        const kandidaty = img.srcset.split(',').map((x) => x.trim().split(/\s+/)).map(([u, d]) => ({ url: new URL(u, location.href).href, w: parseInt(d, 10) }));
        const vybran = kandidaty.find((k) => k.url === img.currentSrc);
        const fayl = new Image();
        fayl.src = img.currentSrc;
        await fayl.decode();
        const brauzer = vybran ? (img.naturalWidth * vybran.w) / fayl.naturalWidth : NaN;
        return { ...r, kandidat: vybran ? vybran.w : NaN, shirinaFayla: fayl.naturalWidth, naturalWidth: img.naturalWidth, brauzer };
      }, [prop, klyuch, MERKA.toString()]);
      const sverka = Math.abs(m.znachenie - m.brauzer) <= 1 && m.kadrSvoy;
      kletki.push({ adres, okno: w + 'x' + h, ...m, sverka });
    }
    // скан ширин при высоте 600, без перезагрузки
    await p.setViewportSize({ width: 641, height: 600 });
    await p.goto(BASE + adres, { waitUntil: 'load' });
    let hudshee = null;
    const rost = [];
    const nizhe = [];
    for (let w = 641; w <= 2560; w++) {
      await p.setViewportSize({ width: w, height: 600 });
      const m = await p.evaluate(([prop, klyuch, merkaTekst]) => eval('(' + merkaTekst + ')')(prop, klyuch), [prop, klyuch, MERKA.toString()]);
      if (m.geroy > m.granica + 0.5) rost.push(w);
      // занижение больше 1 сверх округления единиц раскладки (1/64 px, раунд 2, P3-R2-INSTR-5)
      if (m.zanizhenie > 1.0005) nizhe.push(w);
      if (!hudshee || m.zanizhenie > hudshee.zanizhenie) hudshee = { okno: w + 'x600', ...m };
    }
    const otrezki = (spisok) => {
      const o = [];
      for (const w of spisok) {
        const posl = o[o.length - 1];
        if (posl && posl[1] === w - 1) posl[1] = w;
        else o.push([w, w]);
      }
      return o.map(([a, b]) => (a === b ? String(a) : a + '–' + b));
    };
    // Полоса роста героя и полоса занижения — разные: с какой-то ширины член 170vw больше нарисованной
    // ширины, и рост героя уже не занижает sizes (раунд 2, P3-R2-INSTR-7).
    skan[adres] = { hudshee, rostOtrezki: otrezki(rost), rostShirin: rost.length, zanizhenieOtrezki: otrezki(nizhe) };
  }
  await ctx.close();
  const itog = { sborka: SBORKA, base: BASE, kletki, skan };
  await page.evaluate((o) => { window.__zan = o; }, itog);
  const plokhih = kletki.filter((k) => !k.sverka);
  return [
    'сборка ' + SBORKA + ', сервер ' + BASE + ', DPR 1',
    'клеток ' + kletki.length + '; разбор sizes против значения браузера (naturalWidth): расхождений больше 1 px или чужой кадр — ' + plokhih.length + (plokhih.length ? ': ' + plokhih.map((k) => k.adres + ' ' + k.okno).join(', ') : ''),
    ...Object.entries(skan).map(([a, s]) => `${a} скан 641–2560×600: наибольшее занижение ×${s.hudshee.zanizhenie.toFixed(4)} на ${s.hudshee.okno}; герой выше границы на ширинах ${s.rostOtrezki.join(', ') || 'нигде'}; занижение больше 1 на ширинах ${s.zanizhenieOtrezki.join(', ') || 'нигде'}`),
  ].join('\n');
}
