// Занижение sizes героя (сессия 16, П93 п. 0г: «занижение там, где герой растёт от текста, — предел,
// числом в доклад») — для browser_run_code_unsafe Playwright MCP (параметр filename).
// На каждой странице с героем и каждом окне полосы замера контраста (31 окно, 360–1920) плюс окнах
// таблицы rastyazhenie меряется: высота героя и нижняя граница его высоты по правилам ядра (до 640 —
// рамка арта max(40vh, 260px); выше — clamp(600px, 90vh, 920px)), рамка арта (`.hero__art img`),
// нарисованная ширина кадра при cover по ТОЧНОЙ пропорции мастера (вторым элементом STRANICY; числа —
// ширина и высота записи src/data/game-art.json) и значение sizes в CSS-пикселях:
// строка img.sizes разбирается на пары «условие — длина» по запятым верхнего уровня, первое условие,
// для которого matchMedia истинно (или пара без условия), даёт длину; длина мерится шириной пустого
// блока с этой шириной. Занижение = нарисованная ширина / значение sizes; больше 1 — браузер выбирает
// кандидата по ширине меньше нарисованной.
// ПРЕДЕЛЫ: разбор sizes — свой, не браузера (браузер своего значения не отдаёт); проверка — на окнах
// таблицы при DPR 1 выбранный кандидат обязан быть наименьшим из тех, что не меньше значения (или
// наибольшим, если таких нет), — это сверяет, что разбор совпал с браузером. Высота окна задана
// списком; ширина полосы прокрутки headless-Chromium — 0. Числа — window.__zan (выгрузить
// browser_evaluate).
async (page) => {
  const BASE = 'http://127.0.0.1:4422';
  const SBORKA = '103c0e8';
  const STRANICY = [
    ['/max-payne-3/', 1920 / 620],
    ['/max-payne-2/', 1920 / 620],
    ['/max-payne-1/', 3840 / 1240],
    ['/remake/', 1280 / 960],
  ];
  const OKNA = [
    [360, 740], [390, 844], [414, 896], [480, 800], [560, 800], [600, 900], [640, 900],
    [641, 900], [700, 900], [720, 900], [768, 1024], [800, 900], [820, 1180], [860, 900],
    [900, 700], [960, 800], [1000, 900], [1024, 768], [1025, 900], [1060, 900], [1100, 800],
    [1140, 900], [1180, 900], [1194, 834], [1200, 900], [1280, 800], [1359, 900], [1360, 900],
    [1440, 900], [1600, 900], [1920, 1080],
    [320, 640], [640, 360], [800, 600], [1024, 600], [1280, 720], [1366, 768], [2560, 1440], [3840, 2160],
    // Низкие окна у нижних краёв полос 641–1024 и от 1025: высота героя упирается в 600 px, колонка
    // текста — самая узкая, и текст скорее всего растит героя выше границы.
    [641, 600], [680, 600], [720, 600], [1025, 600], [1060, 600], [1100, 600],
  ];
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
        const img = document.querySelector('.hero__art img');
        const hero = document.querySelector('section.hero');
        if (!img || !hero) throw new Error('нет героя');
        const t0 = Date.now();
        while (!img.complete && Date.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 100));
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
        const vw = innerWidth;
        const vh = innerHeight;
        const granica = vw <= 640 ? Math.max(0.4 * vh, 260) : Math.min(Math.max(600, 0.9 * vh), 920);
        const narisovano = Math.max(b.width, b.height * prop);
        const kandidaty = img.srcset.split(',').map((x) => x.trim().split(/\s+/)).map(([u, d]) => ({ url: new URL(u, location.href).href, w: parseInt(d, 10) }));
        const vybran = kandidaty.find((k) => k.url === img.currentSrc);
        const vse = kandidaty.map((k) => k.w).sort((a, c) => a - c);
        const zhdali = vse.find((x) => x >= znachenie) ?? vse[vse.length - 1];
        return {
          geroy: Math.round(hb.height * 10) / 10, granica: Math.round(granica * 10) / 10,
          ramka: [Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10],
          narisovano: Math.round(narisovano), uslovie, dlina, sizes: Math.round(znachenie),
          zanizhenie: Math.round((narisovano / znachenie) * 1000) / 1000,
          kandidat: vybran ? vybran.w : NaN, zhdali,
        };
      }, prop);
      out.push({ adres, okno: w + 'x' + h, ...m });
    }
  }
  await ctx.close();
  await page.evaluate((o) => { window.__zan = o; }, out);
  const nesovpali = out.filter((r) => r.kandidat !== r.zhdali);
  const hudshie = {};
  for (const r of out) if (!hudshie[r.adres] || r.zanizhenie > hudshie[r.adres].zanizhenie) hudshie[r.adres] = r;
  return [
    'сборка ' + SBORKA + ', сервер ' + BASE + ', DPR 1',
    ...out.map((r) => `${r.adres} ${r.okno}: герой ${r.geroy} (граница ${r.granica}), рамка ${r.ramka.join('×')}, нарисовано ${r.narisovano}, sizes ${r.sizes} [${r.uslovie} ${r.dlina}], занижение ×${r.zanizhenie}, кандидат ${r.kandidat}${r.kandidat !== r.zhdali ? ' (разбор ждал ' + r.zhdali + ')' : ''}`),
    'наибольшее занижение: ' + Object.values(hudshie).map((r) => `${r.adres} ×${r.zanizhenie} на ${r.okno}`).join('; '),
    'разбор sizes против выбора браузера: несовпадений ' + nesovpali.length + (nesovpali.length ? ' — ' + nesovpali.map((r) => r.adres + ' ' + r.okno).join(', ') : ''),
  ].join('\n');
}
