// Генератор скриптов съёмки для browser_run_code_unsafe (Playwright MCP), сессия 9
// трека «второй сайт» (П79). Копия docs/reports/2026-09-23-7thserpent-tema-2/instrumenty/kadry-gen.mjs
// (сессия 8, П75) — что изменено против копии:
//   1. ROOT — sesja-2026-09-24-9; «снято» — 2026-09-24.
//   2. Профили первого сайта (ac4bf-en, ac4bf-pl) и режим visitor сняты: первый сайт вне
//      объёма сессии 9. Остался профиль 7s — главная второго сайта.
//   3. Профиль 7s получил кадры слоёв и блоков, как у главной первого сайта (П79 п. 6):
//      слои — четыре ряда трассы (#max-payne, #max-payne-2, #max-payne-3, #remake;
//      К_ЯКОРЮ), блоки — заголовки пяти секций (#quote-title, #around-title,
//      #games-in-order, #catalog-title, #start-title; К_ВЕРХУ, отступ 100); якорь
//      геометрии без кадра #content — как у эталонов сессий 7 и 8.
//   4. Имя кадра блока — id без суффикса заголовка: «-tytul» (соглашение frames.mjs
//      protocol) или «-title» (английские id второго сайта).
//   5. Порт превью — пятым аргументом (по умолчанию 4321): превью сайтов в сессии поднимались
//      на разных портах; сверка сайта по canonical (сессия 8) остаётся.
//   6. Сняты места с DOM (MIEJSCA, OKRUSZKI_KONTROLA, miejsca в выгрузке): у главной второго
//      сайта зон по местам и крошек нет; в выгрузке __sesja вместо miejsca — scrollY кадров.
//   По раунду 1 «судью судят» сессии 9:
//   7. СТОП, если после ГОТОВНОСТИ загружено меньше картинок, чем есть на странице (находка G5):
//      срок 3 с остаётся, но недогруженный арт больше не уходит в кадры молча.
//   8. Имя прогона — в выгрузке __sesja и служебным ключом «прогон» в geometria.json (G1):
//      сверка геометрии (frames.mjs сравнитьГеометрию) читает только числовые ключи.
//   9. Отступ кадра блока — ОТСТУП_БЛОКА из core/accept/frames.mjs, а не второе число 100 (G6).
// Остальное — дословно копии: ПРОКРУТКА / ГОТОВНОСТЬ под сроком 3 с (обход пункта 19) /
// ГЕОМЕТРИЯ / К_ЯКОРЮ / К_ВЕРХУ / осадка 700 мс + 2 rAF.
// ПРЕДЕЛЫ (названы): имя кадра блока — id без «-tytul» или «-title», а протокол frames.mjs
// называет только «-tytul» (G4); уникальность имён не проверяется — id разные по построению.
// Сверка по canonical ловит чужой хост, но не чужую сборку того же сайта (G3): какая сборка
// на порту, сверяет ведущий (сборка в geometria.json — со слов вызова). geometria.json
// кладёт не драйвер, а выгрузка window.__sesja после прогона (G2) — делать её сразу после
// каждого прогона: следующий прогон окно перезапишет.
//
// node kadry-gen.mjs <run> glowna 7s <сборка> [порт]
//   → пишет .playwright-mcp/sesja-2026-09-24-9/<run>/glowna.js
import { writeFileSync, mkdirSync } from 'node:fs';
import { ОТСТУП_БЛОКА } from '../../../../core/accept/frames.mjs';

const [, , run, strona, profil, build, port = '4321'] = process.argv;
if (!run || !strona || !profil || !build) { console.error('kadry-gen.mjs <run> glowna 7s <сборка> [порт]'); process.exit(2); }

// Абсолютный путь: скрипт драйвера исполняется в процессе Playwright MCP, и page.screenshot
// пишет кадры туда по этому пути. Папка .playwright-mcp/ — вне git (.gitignore).
const ROOT = new URL('../../../../.playwright-mcp/sesja-2026-09-24-9', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SNIETO = '2026-09-24';

const PROFILE = {
  '7s': {
    glowna: {
      url: `http://localhost:${port}/`,
      page: '/',
      layers: ['max-payne', 'max-payne-2', 'max-payne-3', 'remake'],
      blocks: ['quote-title', 'around-title', 'games-in-order', 'catalog-title', 'start-title'],
      geomExtra: ['content'], // якорь геометрии без кадра (эталоны сессий 7 и 8)
    },
  },
};
const PAGES = PROFILE[profil];
if (!PAGES) { console.error('profil: 7s'); process.exit(2); }
const cfg = PAGES[strona];
if (!cfg) { console.error('strona ' + strona + ' нет в профиле ' + profil); process.exit(2); }
const out = `${ROOT}/${run}/${strona}`;
mkdirSync(out, { recursive: true });

const POCHEMU = 'Геометрия эталона для сверки числом (П39; П41 — кадры блоков): условия съёмки, отступ кадров блоков, высота страницы и положение якорей (ряды трассы — центрируются К_ЯКОРЮ, заголовки блоков — К_ВЕРХУ; #content — якорь без кадра: offsetTop — сдвиг шапки, высота — сдвиг содержимого) на каждом вьюпорте. Сверяется npm run accept:frames -- check. Обнуляется вместе с кадрами.';
// Строка «драйвер» пишется в geometria.json эталона. ГОТОВНОСТЬ не дословна frames.mjs:
// ожидание картинок обёрнуто в Promise.race со сроком 3 с (обход пункта 19 бэклога).
const DRAJVER = 'Playwright MCP (headless Chromium), dpr 1, clientWidth 1440/390 (полоса прокрутки скрыта и не отнимает ширины); скрипты ПРОКРУТКА, ГЕОМЕТРИЯ, К_ЯКОРЮ и К_ВЕРХУ из core/accept/frames.mjs дословно, ГОТОВНОСТЬ — с ожиданием картинок под сроком 3 с (обход пункта 19) и стопом, если загружено меньше, чем есть, вшиты в код драйвера генератором (docs/reports/2026-09-23-7thserpent-glavnaya/instrumenty/kadry-gen.mjs); ПРОКРУТКА до ГОТОВНОСТИ (порядок по факту, бэклог 19); К_ЯКОРЮ/К_ВЕРХУ + проверка scrollY + осадка 700 мс и 2 rAF; 1440 → 390 без перезагрузки (П16); полный кадр — fullPage; сайт на порту сверен по canonical';

// Какой сайт обязан отвечать на порту (сессия 8, раунд 1, находка K2).
const HOST = '7thserpent.com';

const CONFIG = { ...cfg, out, build, run, snieto: SNIETO, profil, pochemu: POCHEMU, drajver: DRAJVER, host: HOST, otstup: ОТСТУП_БЛОКА };

// Общие скрипты страницы — дословно копии.
const WSPOLNE = `
  // ПРОКРУТКА — дословно frames.mjs
  const PROKRUTKA = async () => {
    const шаг = Math.round(window.innerHeight * 0.9);
    for (let y = 0; y <= document.body.scrollHeight; y += шаг) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 400));
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 200));
    return { высота: document.body.scrollHeight, scrollY: window.scrollY };
  };
  // ГОТОВНОСТЬ — под сроком 3 с (обход пункта 19), после ПРОКРУТКИ
  const GOTOVNOST = async () => {
    await document.fonts.ready;
    const imgs = [...document.images];
    await Promise.race([
      Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; }))),
      new Promise(r => setTimeout(r, 3000)),
    ]);
    return { шрифты: 'ready', изображений: imgs.length, загружено: imgs.filter(i => i.complete && i.naturalWidth > 0).length };
  };
  // осадка: 700 мс + 2 rAF
  const OSADKA = () => new Promise(r => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(r)), 700));
  const shot = async (name, full) => {
    await page.screenshot({ path: CONFIG.out + '/' + name, fullPage: !!full, scale: 'css' });
    say('кадр ' + name);
  };
  // Тот ли сайт на порту: canonical страницы обязан нести хост профиля.
  const SAJT = async () => {
    const c = await page.evaluate(() => { const l = document.querySelector('link[rel="canonical"]'); return l ? l.href : null; });
    if (!c || !c.includes(CONFIG.host)) throw new Error('СТОП: на ' + CONFIG.url + ' отвечает не ' + CONFIG.host + ' (canonical ' + c + ')');
    say('сайт: canonical ' + c);
  };
`;

const code = `async (page) => {
  const CONFIG = ${JSON.stringify(CONFIG)};
  const log = [];
  const say = (s) => log.push(s);
${WSPOLNE}
  // ГЕОМЕТРИЯ — дословно frames.mjs
  const GEOMETRIA = (ids) => ({
    вьюпорт: { w: window.innerWidth, h: window.innerHeight,
      clientWidth: document.documentElement.clientWidth, clientHeight: document.documentElement.clientHeight,
      dpr: window.devicePixelRatio },
    высота: document.body.scrollHeight,
    слои: Object.fromEntries(ids.map(id => {
      const el = document.getElementById(id);
      if (!el) throw new Error('нет якоря #' + id);
      const r = el.getBoundingClientRect();
      return [id, { offsetTop: Math.round((r.top + window.scrollY) * 100) / 100, высота: Math.round(r.height * 100) / 100 }];
    }))
  });
  // К_ЯКОРЮ — дословно
  const K_YAKORYU = async (id) => {
    const слой = document.getElementById(id);
    if (!слой) throw new Error('нет якоря #' + id);
    const рамка = слой.getBoundingClientRect();
    const offsetTop = Math.round((рамка.top + window.scrollY) * 100) / 100;
    const высота = Math.round(рамка.height * 100) / 100;
    const y = Math.round(offsetTop + (высота - window.innerHeight) / 2);
    window.scrollTo({ top: y, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 200));
    return { якорь: id, offsetTop, высота, ожидали: y, scrollY: window.scrollY, высотаСтраницы: document.body.scrollHeight };
  };
  // К_ВЕРХУ — дословно, отступ — ОТСТУП_БЛОКА frames.mjs (параметр, как у шаблона frames.mjs)
  const K_VERHU = async ([id, отступ]) => {
    const заголовок = document.getElementById(id);
    if (!заголовок) throw new Error('нет якоря #' + id);
    const рамка = заголовок.getBoundingClientRect();
    const offsetTop = Math.round((рамка.top + window.scrollY) * 100) / 100;
    const высота = Math.round(рамка.height * 100) / 100;
    const y = Math.max(0, Math.round(offsetTop - отступ));
    window.scrollTo({ top: y, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 200));
    return { якорь: id, отступ, offsetTop, высота, ожидали: y, scrollY: window.scrollY, высотаСтраницы: document.body.scrollHeight };
  };
  // Стоп по загрузке (раунд 1 «судью судят» сессии 9, G5): срок 3 с — не повод снимать
  // недогруженный арт.
  const GOTOVO = async (w) => {
    const g = await page.evaluate(GOTOVNOST);
    say('ГОТОВНОСТЬ ' + w + ': ' + JSON.stringify(g));
    if (g.загружено !== g.изображений) throw new Error('СТОП: на ' + w + ' загружено ' + g.загружено + ' из ' + g.изображений + ' картинок');
  };
  const scrollYs = {};
  const geom = {};

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(CONFIG.url, { waitUntil: 'load' });
  await SAJT();
  await page.evaluate(async () => { await document.fonts.ready; });
  say('ПРОКРУТКА 1440: ' + JSON.stringify(await page.evaluate(PROKRUTKA)));
  await GOTOVO('1440');
  const ids = [...CONFIG.layers, ...CONFIG.blocks, ...CONFIG.geomExtra];
  geom['1440'] = await page.evaluate(GEOMETRIA, ids);
  say('ГЕОМЕТРИЯ 1440: высота ' + geom['1440'].высота + ', clientWidth ' + geom['1440'].вьюпорт.clientWidth + ', якорей ' + Object.keys(geom['1440'].слои).length);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(OSADKA);
  await shot('baseline-desktop-hero-1440x900.png'); scrollYs['baseline-desktop-hero-1440x900.png'] = 0;
  await shot('baseline-desktop-full-1440.png', true); scrollYs['baseline-desktop-full-1440.png'] = 0;
  for (const id of CONFIG.layers) {
    const r = await page.evaluate(K_YAKORYU, id);
    if (r.scrollY !== r.ожидали) throw new Error('СТОП: scrollY ' + r.scrollY + ' ≠ ожидали ' + r.ожидали + ' у #' + id);
    await page.evaluate(OSADKA);
    const name = 'baseline-desktop-layer-' + id.replace(/^epoka-/, '') + '-1440x900.png';
    await shot(name); scrollYs[name] = r.scrollY;
    say('К_ЯКОРЮ ' + JSON.stringify(r));
  }
  for (const id of CONFIG.blocks) {
    const r = await page.evaluate(K_VERHU, [id, CONFIG.otstup]);
    if (r.scrollY !== r.ожидали) throw new Error('СТОП: scrollY ' + r.scrollY + ' ≠ ожидали ' + r.ожидали + ' у #' + id);
    await page.evaluate(OSADKA);
    const name = 'baseline-desktop-blok-' + id.replace(/-(tytul|title)$/, '') + '-1440x900.png';
    await shot(name); scrollYs[name] = r.scrollY;
    say('К_ВЕРХУ ' + JSON.stringify(r));
  }
  // 390 без перезагрузки
  await page.setViewportSize({ width: 390, height: 844 });
  say('ПРОКРУТКА 390: ' + JSON.stringify(await page.evaluate(PROKRUTKA)));
  await GOTOVO('390');
  geom['390'] = await page.evaluate(GEOMETRIA, ids);
  say('ГЕОМЕТРИЯ 390: высота ' + geom['390'].высота + ', clientWidth ' + geom['390'].вьюпорт.clientWidth + ', якорей ' + Object.keys(geom['390'].слои).length);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(OSADKA);
  await shot('baseline-mobile-hero-390x844.png'); scrollYs['baseline-mobile-hero-390x844.png'] = 0;
  await shot('baseline-mobile-full-390.png', true); scrollYs['baseline-mobile-full-390.png'] = 0;

  const geometria = {
    '390': geom['390'], '1440': geom['1440'],
    почему_файл: CONFIG.pochemu,
    страница: CONFIG.page,
    снято: CONFIG.snieto,
    сборка: CONFIG.build,
    прогон: CONFIG.run,
    драйвер: CONFIG.drajver,
    отступ_блока: CONFIG.otstup,
  };
  await page.evaluate((d) => { window.__sesja = d; }, { прогон: CONFIG.run, сборка: CONFIG.build, log, geometria, scrollY: scrollYs });
  return log.join('\\n');
}`;

writeFileSync(`${ROOT}/${run}/${strona}.js`, code);
console.log(`${ROOT}/${run}/${strona}.js`);
