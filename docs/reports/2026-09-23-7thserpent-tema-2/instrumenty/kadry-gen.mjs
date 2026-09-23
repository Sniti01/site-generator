// Генератор скриптов съёмки для browser_run_code_unsafe (Playwright MCP), сессия 8
// трека «второй сайт» (П75). Копия docs/reports/2026-09-16-sobytie-kadry/sniazka-gen.mjs
// (событие «кадры рядам», П57) — что изменено против копии:
//   1. ROOT — sesja-2026-09-23-8; «снято» — 2026-09-23.
//   2. Профиль сайта третьим аргументом:
//      ac4bf-en — первый сайт на английском (3e3b26c): место крошек
//                 nav[aria-label="Breadcrumbs"] (перевод П76, id и якоря прежние);
//      ac4bf-pl — первый сайт на польском (48243b8): nav[aria-label="Okruszki"], как в копии;
//      7s       — главная второго сайта: только четыре протокольных кадра, якорь
//                 геометрии без кадра #content (как у эталона сессии 7), мест нет.
//   3. Кадр слоя/блока и места — только у профилей ac4bf (у главной второго сайта их нет).
//   4. По раунду 1 «судью судят» (сессия 8): строка «драйвер» в geometria.json больше не зовёт
//      ГОТОВНОСТЬ дословной (срок 3 с); перед съёмкой — стоп, если canonical страницы не несёт
//      хост профиля (на порту чужой сайт).
//   5. По раунду 2: сняты места stopka-rodowod (glowna, gra — адреса перевода П76 другие) и лог
//      «за правым краем окна» режима visitor (на кадры не влиял); в geometria.json ключи идут
//      «390», затем «1440» — как у эталона сессии 7 (сверка frames.mjs порядка ключей не видит).
// Остальное — дословно копии: ПРОКРУТКА / ГОТОВНОСТЬ под сроком 3 с (обход пункта 19) /
// ГЕОМЕТРИЯ / К_ЯКОРЮ / К_ВЕРХУ / осадка 700 мс + 2 rAF / места с DOM при scrollY = 0.
//
// node kadry-gen.mjs <run> <strona: glowna|gra|visitor> <profil: ac4bf-en|ac4bf-pl|7s> <сборка>
//   → пишет sesja-2026-09-23-8/<run>/<strona>.js
import { writeFileSync, mkdirSync } from 'node:fs';

const [, , run, strona, profil, build] = process.argv;
if (!run || !strona || !profil || !build) { console.error('kadry-gen.mjs <run> <glowna|gra|visitor> <ac4bf-en|ac4bf-pl|7s> <сборка>'); process.exit(2); }

// Абсолютный путь: скрипт драйвера исполняется в процессе Playwright MCP, и page.screenshot
// пишет кадры туда по этому пути. Папка .playwright-mcp/ — вне git (.gitignore).
const ROOT = new URL('../../../../.playwright-mcp/sesja-2026-09-23-8', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SNIETO = '2026-09-23';
const OKRUSZKI_SEL = { 'ac4bf-en': 'nav[aria-label="Breadcrumbs"]', 'ac4bf-pl': 'nav[aria-label="Okruszki"]' };

function ac4bf(okrSel) {
  const OKRUSZKI = { nazwa: 'okruszki', sel: okrSel };
  return {
    glowna: {
      url: 'http://localhost:4321/',
      page: '/',
      okruszki: 'brak',
      layers: ['epoka-jerozolima', 'epoka-wlochy', 'epoka-londyn'],
      blocks: ['swieze-tytul', 'numeracja-tytul', 'galeria-tytul', 'katalog-tytul'],
      geomExtra: [],
      miejsca: [
        { nazwa: 'szapka', sel: 'header.hdr', fixed: true },
        { nazwa: 'skala', sel: 'aside.rail', fixed: true, naWysokosc: true },
        OKRUSZKI,
        { nazwa: 'hero', sel: 'section.hero' },
        { nazwa: 'podpis', sel: '.byline' },
        { nazwa: 'warstwa-jerozolima', sel: '#epoka-jerozolima' },
        { nazwa: 'warstwa-wlochy', sel: '#epoka-wlochy' },
        { nazwa: 'creed', sel: 'section.creed' },
        { nazwa: 'warstwa-japonia', sel: '#epoka-japonia' },
        { nazwa: 'warstwa-karaiby', sel: '#epoka-karaiby' },
        { nazwa: 'lenta', sel: 'section.rail-sec' },
        { nazwa: 'lenta-daty', sel: '.rail-sec__date', all: true },
        { nazwa: 'warstwa-londyn', sel: '#epoka-londyn' },
        { nazwa: 'numeracja', sel: 'section.link-list' },
        { nazwa: 'galeria', sel: 'section.gallery' },
        { nazwa: 'stog', sel: '#katalog' },
        { nazwa: 'cta', sel: 'section.cta' },
        { nazwa: 'stopka', sel: 'footer.ft' },
        { nazwa: 'reszta-main', sel: 'main' },
      ],
    },
    gra: {
      url: 'http://localhost:4321/assassins-creed-4-black-flag/',
      page: '/assassins-creed-4-black-flag/',
      okruszki: 'jest',
      layers: ['co-jest-w-grze', 'edward-kenway', 'kawka', 'trzy-miasta', 'abstergo', 'freedom-cry-i-rogue'],
      blocks: ['toc-tytul', 'galeria-tytul', 'werdykt-tytul', 'powiazane-tytul', 'cta-tytul'],
      geomExtra: [],
      miejsca: [
        { nazwa: 'szapka', sel: 'header.hdr', fixed: true },
        OKRUSZKI,
        { nazwa: 'hero', sel: 'section.hero' },
        { nazwa: 'podpis', sel: '.byline' },
        { nazwa: 'toc', sel: '[aria-labelledby="toc-tytul"]' },
        { nazwa: 'rzedy', sel: 'section.layer', all: true },
        { nazwa: 'galeria', sel: 'section.gallery' },
        { nazwa: 'werdykt', sel: '[aria-labelledby="werdykt-tytul"]' },
        { nazwa: 'powiazane', sel: '[aria-labelledby="powiazane-tytul"]' },
        { nazwa: 'cta', sel: 'section.cta' },
        { nazwa: 'stopka', sel: 'footer.ft' },
        { nazwa: 'reszta-main', sel: 'main' },
      ],
    },
    visitor: { url: 'http://localhost:4321/', page: '/' },
  };
}

const PROFILE = {
  'ac4bf-en': ac4bf(OKRUSZKI_SEL['ac4bf-en']),
  'ac4bf-pl': ac4bf(OKRUSZKI_SEL['ac4bf-pl']),
  '7s': {
    glowna: {
      url: 'http://localhost:4321/',
      page: '/',
      okruszki: null, // главная второго сайта — крошек нет, место не судится
      layers: [],
      blocks: [],
      geomExtra: ['content'], // якорь геометрии без кадра (эталон сессии 7)
      miejsca: [],
    },
  },
};
const PAGES = PROFILE[profil];
if (!PAGES) { console.error('profil: ac4bf-en|ac4bf-pl|7s'); process.exit(2); }
const cfg = PAGES[strona];
if (!cfg) { console.error('strona ' + strona + ' нет в профиле ' + profil); process.exit(2); }
const out = `${ROOT}/${run}/${strona}`;
mkdirSync(out, { recursive: true });

const POCHEMU = profil === '7s'
  ? 'Геометрия эталона для сверки числом (П39): условия съёмки, отступ кадров блоков, высота страницы и положение якоря #content (<main>, якорь геометрии без кадра: offsetTop — сдвиг шапки, высота — сдвиг содержимого) на каждом вьюпорте. Сверяется npm run accept:frames -- check. Обнуляется вместе с кадрами.'
  : 'Геометрия эталона для сверки числом (П39, пункт 14; П41 — кадры блоков): условия съёмки, отступ кадров блоков, высота страницы и положение якорей (слои — центрируются К_ЯКОРЮ, заголовки блоков — К_ВЕРХУ) на каждом вьюпорте. Сверяется npm run accept:frames -- check. Обнуляется вместе с кадрами.';
// Строка «драйвер» пишется в geometria.json эталона. ГОТОВНОСТЬ не дословна frames.mjs:
// ожидание картинок обёрнуто в Promise.race со сроком 3 с (обход пункта 19 бэклога) —
// так и сказано (раунд 1 «судью судят», сессия 8; у эталона сессии 7 стояло «дословно»).
const DRAJVER = profil === '7s'
  ? 'Playwright MCP (headless Chromium), dpr 1, clientWidth 1440/390 (полоса прокрутки скрыта и не отнимает ширины); скрипты ПРОКРУТКА и ГЕОМЕТРИЯ из core/accept/frames.mjs дословно, ГОТОВНОСТЬ — с ожиданием картинок под сроком 3 с (обход пункта 19), вшиты в код драйвера генератором (docs/reports/2026-09-23-7thserpent-tema-2/instrumenty/kadry-gen.mjs); ПРОКРУТКА до ГОТОВНОСТИ (порядок по факту, бэклог 19); 1440 → 390 без перезагрузки (П16); полный кадр — fullPage; сайт на порту сверен по canonical'
  : 'Playwright MCP (headless Chromium), полоса прокрутки скрыта, dpr 1; ГОТОВНОСТЬ после ПРОКРУТКИ под сроком 3 с на кадр (обход пункта 19); К_ЯКОРЮ/К_ВЕРХУ + проверка scrollY + осадка 700 мс и 2 rAF одним вызовом; полный кадр — fullPage; сайт на порту сверен по canonical';

// Какой сайт обязан отвечать на порту: превью разных сайтов в сессии поднимались на разных
// портах, и драйвер с зашитым адресом снял бы чужой сайт молча (раунд 1, находка K2).
const HOST = profil === '7s' ? '7thserpent.com' : 'ac4bf-thewatch.com';

const CONFIG = { ...cfg, out, build, run, snieto: SNIETO, profil, pochemu: POCHEMU, drajver: DRAJVER, host: HOST };

// Общие скрипты страницы — дословно frames.mjs / копия П50.
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

const code = strona === 'visitor' ? `async (page) => {
  const CONFIG = ${JSON.stringify(CONFIG)};
  const log = [];
  const say = (s) => log.push(s);
${WSPOLNE}
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(CONFIG.url, { waitUntil: 'load' });
  await SAJT();
  await page.evaluate(async () => { await document.fonts.ready; });
  say('УСЛОВИЯ 390: ' + JSON.stringify(await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight, clientWidth: document.documentElement.clientWidth, clientHeight: document.documentElement.clientHeight, dpr: window.devicePixelRatio }))));
  say('ПРОКРУТКА 390 (свежая загрузка): ' + JSON.stringify(await page.evaluate(PROKRUTKA)));
  const got = await page.evaluate(GOTOVNOST);
  say('ГОТОВНОСТЬ 390: ' + JSON.stringify(got));
  const wKadrze = await page.evaluate(() => { const w = [...document.images].filter(i => i.getBoundingClientRect().left < document.documentElement.clientWidth); return { всего: w.length, загружено: w.filter(i => i.complete && i.naturalWidth > 0).length }; });
  say('в полосе кадра: ' + wKadrze.всего + ', загружено ' + wKadrze.загружено);
  if (wKadrze.загружено !== wKadrze.всего) throw new Error('СТОП: в полосе кадра загружено ' + wKadrze.загружено + ' из ' + wKadrze.всего + ' картинок');
  say('герой (currentSrc): ' + await page.evaluate(() => { const i = document.querySelector('section.hero img'); return i ? i.currentSrc.split('/').pop() : 'нет img героя'; }));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(OSADKA);
  await shot('mobile-hero-390x844.png');
  await shot('mobile-full-390.png', true);
  say('высота: ' + await page.evaluate(() => document.body.scrollHeight));
  await page.evaluate((d) => { window.__sesja = d; }, { log });
  return log.join('\\n');
}` : `async (page) => {
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
  // К_ВЕРХУ — дословно, отступ 100
  const K_VERHU = async (id) => {
    const заголовок = document.getElementById(id);
    if (!заголовок) throw new Error('нет якоря #' + id);
    const рамка = заголовок.getBoundingClientRect();
    const offsetTop = Math.round((рамка.top + window.scrollY) * 100) / 100;
    const высота = Math.round(рамка.height * 100) / 100;
    const y = Math.max(0, Math.round(offsetTop - 100));
    window.scrollTo({ top: y, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 200));
    return { якорь: id, отступ: 100, offsetTop, высота, ожидали: y, scrollY: window.scrollY, высотаСтраницы: document.body.scrollHeight };
  };
  const MIEJSCA = (spec) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const out = [];
    for (const m of spec) {
      const els = m.all ? [...document.querySelectorAll(m.sel)] : [document.querySelector(m.sel)];
      els.forEach((el, i) => {
        if (!el) { out.push({ nazwa: m.nazwa, brak: true }); return; }
        const r = el.getBoundingClientRect();
        const rect = { nazwa: m.all ? m.nazwa + '-' + (i + 1) : m.nazwa, x: Math.floor(r.left), y: Math.floor(r.top + window.scrollY), w: Math.ceil(r.width) + 1, h: Math.ceil(r.height) + 1 };
        if (m.fixed) rect.fixed = true;
        if (m.naWysokosc) rect.naWysokosc = true;
        out.push(rect);
      });
    }
    return out;
  };
  const OKRUSZKI_KONTROLA = (miejscaLista, w) => {
    if (CONFIG.okruszki === null) return;
    if (CONFIG.okruszki !== 'jest' && CONFIG.okruszki !== 'brak') throw new Error('СТОП: ожидание okruszki у ' + CONFIG.page + ' не задано (' + CONFIG.okruszki + ')');
    const o = miejscaLista.find(m => m.nazwa === 'okruszki');
    const jest = !!(o && !o.brak && o.w > 1 && o.h > 1);
    if (CONFIG.okruszki === 'jest' && !jest) throw new Error('СТОП: на ' + CONFIG.page + ' нет места okruszki (' + w + ')');
    if (CONFIG.okruszki === 'brak' && jest) throw new Error('СТОП: на ' + CONFIG.page + ' есть место okruszki, а не должно (' + w + ')');
    say('okruszki ' + w + ': ' + (jest ? 'есть ' + JSON.stringify({ x: o.x, y: o.y, w: o.w, h: o.h }) : 'нет') + ' — как ожидалось (' + CONFIG.okruszki + ')');
  };
  const scrollYs = {};
  const geom = {};
  const miejsca = {};

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(CONFIG.url, { waitUntil: 'load' });
  await SAJT();
  await page.evaluate(async () => { await document.fonts.ready; });
  say('ПРОКРУТКА 1440: ' + JSON.stringify(await page.evaluate(PROKRUTKA)));
  say('ГОТОВНОСТЬ 1440: ' + JSON.stringify(await page.evaluate(GOTOVNOST)));
  const ids = [...CONFIG.layers, ...CONFIG.blocks, ...CONFIG.geomExtra];
  geom['1440'] = await page.evaluate(GEOMETRIA, ids);
  say('ГЕОМЕТРИЯ 1440: высота ' + geom['1440'].высота + ', clientWidth ' + geom['1440'].вьюпорт.clientWidth + ', якорей ' + Object.keys(geom['1440'].слои).length);
  miejsca['1440'] = await page.evaluate(MIEJSCA, CONFIG.miejsca);
  OKRUSZKI_KONTROLA(miejsca['1440'], '1440');
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
    const r = await page.evaluate(K_VERHU, id);
    if (r.scrollY !== r.ожидали) throw new Error('СТОП: scrollY ' + r.scrollY + ' ≠ ожидали ' + r.ожидали + ' у #' + id);
    await page.evaluate(OSADKA);
    const name = 'baseline-desktop-blok-' + id.replace(/-tytul$/, '') + '-1440x900.png';
    await shot(name); scrollYs[name] = r.scrollY;
    say('К_ВЕРХУ ' + JSON.stringify(r));
  }
  // 390 без перезагрузки
  await page.setViewportSize({ width: 390, height: 844 });
  say('ПРОКРУТКА 390: ' + JSON.stringify(await page.evaluate(PROKRUTKA)));
  say('ГОТОВНОСТЬ 390: ' + JSON.stringify(await page.evaluate(GOTOVNOST)));
  geom['390'] = await page.evaluate(GEOMETRIA, ids);
  say('ГЕОМЕТРИЯ 390: высота ' + geom['390'].высота + ', clientWidth ' + geom['390'].вьюпорт.clientWidth + ', якорей ' + Object.keys(geom['390'].слои).length);
  miejsca['390'] = await page.evaluate(MIEJSCA, CONFIG.miejsca);
  OKRUSZKI_KONTROLA(miejsca['390'], '390');
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
    драйвер: CONFIG.drajver,
    отступ_блока: 100,
  };
  const miejscaJson = {
    '1440': { scrollY: scrollYs, miejsca: miejsca['1440'] },
    '390': { scrollY: scrollYs, miejsca: miejsca['390'] },
    _: 'места с DOM при scrollY = 0, прогон ' + CONFIG.run + ', сборка ' + CONFIG.build,
  };
  await page.evaluate((d) => { window.__sesja = d; }, { log, geometria, miejsca: miejscaJson });
  return log.join('\\n');
}`;

writeFileSync(`${ROOT}/${run}/${strona}.js`, code);
console.log(`${ROOT}/${run}/${strona}.js`);
