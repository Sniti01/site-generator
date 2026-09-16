// Генератор скриптов съёмки для browser_run_code_unsafe (Playwright MCP).
// Копия docs/reports/2026-09-15-sobytie-vida-2/sniazka-gen.mjs для события
// «кадры рядам» (П57 п. 8 списка, П58): что изменено против копии П50 —
//   1. ROOT — sesja-2026-09-16; «снято» — 2026-09-16.
//   2. Игра: пять якорей слоёв П51 п. 1 (edward-kenway, kawka, trzy-miasta,
//      abstergo, freedom-cry-i-rogue) — состав эталона 10 → 15 кадров.
//   3. Место «okruszki» (nav[aria-label="Okruszki"]) на обеих страницах;
//      на игре место обязано быть, на главной — обязано отсутствовать
//      (крошки печатаются только на внутренних страницах) — иначе стоп.
//   4. Режим «visitor» — два кадра _baseline/visitor/ по протоколу папки
//      (свежая загрузка на 390, без ресайза с 1440); строка условий съёмки и имя
//      файла героя — в логе.
//   5. Строки лога «ГЕОМЕТРИЯ …» получили хвост «, якорей N» — только лог.
// Остальное — дословно копии П50: ПРОКРУТКА / ГОТОВНОСТЬ под сроком 3 с (обход
// пункта 19 — отличие от frames.mjs унаследовано от П50) / ГЕОМЕТРИЯ / К_ЯКОРЮ /
// К_ВЕРХУ / осадка 700 мс + 2 rAF / места с DOM при scrollY = 0.
// Судью судили 2026-09-16 (две линзы, следы — в докладе события): поправки —
// контроль okruszki отказывает на неизвестном ожидании и требует ненулевой коробки;
// visitor пишет условия съёмки; известное и не правленное — MIEJSCA при all: true
// и нуле совпадений не пишет ни рамки, ни brak (унаследовано от П50).
//
// node sniazka-gen.mjs <run> <strona: glowna|gra|visitor> <сборка>  → пишет sesja/<run>/<strona>.js
import { writeFileSync, mkdirSync } from 'node:fs';

const [, , run, strona, build] = process.argv;
if (!run || !strona || !build) { console.error('sniazka-gen.mjs <run> <glowna|gra|visitor> <сборка>'); process.exit(2); }

const ROOT = 'D:/SEO/cloud/site-generator/.playwright-mcp/sesja-2026-09-16';
const SNIETO = '2026-09-16';
const OKRUSZKI = { nazwa: 'okruszki', sel: 'nav[aria-label="Okruszki"]' };
const PAGES = {
  glowna: {
    url: 'http://localhost:4321/',
    page: '/',
    okruszki: 'brak', // главная — одно звено, крошки не печатаются (e7c626d)
    layers: ['epoka-jerozolima', 'epoka-wlochy', 'epoka-londyn'],
    blocks: ['swieze-tytul', 'numeracja-tytul', 'galeria-tytul', 'katalog-tytul'],
    // места для карты диффов: имя → селектор; fixed — в системе окна; naWysokosc — тянется на всю высоту полного кадра
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
      { nazwa: 'stopka-rodowod', sel: 'footer.ft a[href="/assassins-creed-rodowod/"]' },
      { nazwa: 'reszta-main', sel: 'main' },
    ],
  },
  gra: {
    url: 'http://localhost:4321/assassins-creed-4-black-flag/',
    page: '/assassins-creed-4-black-flag/',
    okruszki: 'jest',
    // П51 п. 1: кадр слоя на каждое сочетание flip/band/кадр — шесть якорей, было один
    layers: ['co-jest-w-grze', 'edward-kenway', 'kawka', 'trzy-miasta', 'abstergo', 'freedom-cry-i-rogue'],
    blocks: ['toc-tytul', 'galeria-tytul', 'werdykt-tytul', 'powiazane-tytul', 'cta-tytul'],
    miejsca: [
      { nazwa: 'szapka', sel: 'header.hdr', fixed: true },
      OKRUSZKI,
      { nazwa: 'hero', sel: 'section.hero' },
      { nazwa: 'podpis', sel: '.byline' },
      { nazwa: 'toc', sel: '[aria-labelledby="toc-tytul"]' },
      // rzedy-1…8 — порядок DOM: co-jest-w-grze, edward-kenway, kawka, trzy-miasta, abstergo, freedom-cry-i-rogue, wydania, dla-kogo
      { nazwa: 'rzedy', sel: 'section.layer', all: true },
      { nazwa: 'galeria', sel: 'section.gallery' },
      { nazwa: 'werdykt', sel: '[aria-labelledby="werdykt-tytul"]' },
      { nazwa: 'powiazane', sel: '[aria-labelledby="powiazane-tytul"]' },
      { nazwa: 'cta', sel: 'section.cta' },
      { nazwa: 'stopka', sel: 'footer.ft' },
      { nazwa: 'stopka-rodowod', sel: 'footer.ft a[href="/assassins-creed-rodowod/"]' },
      { nazwa: 'reszta-main', sel: 'main' },
    ],
  },
  visitor: {
    url: 'http://localhost:4321/',
    page: '/',
  },
};
const cfg = PAGES[strona];
if (!cfg) { console.error('strona: glowna|gra|visitor'); process.exit(2); }
const out = `${ROOT}/${run}/${strona}`;
mkdirSync(out, { recursive: true });

const CONFIG = { ...cfg, out, build, run, snieto: SNIETO };

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
`;

const code = strona === 'visitor' ? `async (page) => {
  const CONFIG = ${JSON.stringify(CONFIG)};
  const log = [];
  const say = (s) => log.push(s);
${WSPOLNE}
  // Протокол _baseline/visitor/README.md: вьюпорт 390×844, СВЕЖАЯ загрузка на этой ширине,
  // fonts.ready, прокрутка до низа и обратно с догрузкой отложенных картинок, оконный и полный кадр.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(CONFIG.url, { waitUntil: 'load' });
  await page.evaluate(async () => { await document.fonts.ready; });
  // условия съёмки — строкой, как у ГЕОМЕТРИИ (судья 2026-09-16, находка 8)
  say('УСЛОВИЯ 390: ' + JSON.stringify(await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight, clientWidth: document.documentElement.clientWidth, clientHeight: document.documentElement.clientHeight, dpr: window.devicePixelRatio }))));
  say('ПРОКРУТКА 390 (свежая загрузка): ' + JSON.stringify(await page.evaluate(PROKRUTKA)));
  const got = await page.evaluate(GOTOVNOST);
  say('ГОТОВНОСТЬ 390: ' + JSON.stringify(got));
  // Стоп — по картинкам, которые могут попасть в кадр шириной clientWidth; за правым краем
  // (карточки ленты дальше первой: x ≥ 390) Chrome лениво не грузит в холодном браузере,
  // а в тёплом грузит из кэша — на байты кадра это не влияет (измерено 2026-09-16: холодный
  // 15/16 и тёплый 16/16 прогоны побайтово равны). Число за краем — строкой лога.
  const zaKrajem = await page.evaluate(() => [...document.images].filter(i => i.getBoundingClientRect().left >= document.documentElement.clientWidth).map(i => ({ src: (i.currentSrc || i.src).split('/').pop(), x: Math.round(i.getBoundingClientRect().left), загружена: i.complete && i.naturalWidth > 0 })));
  say('за правым краем окна (в кадр не входят): ' + JSON.stringify(zaKrajem));
  const wKadrze = await page.evaluate(() => { const w = [...document.images].filter(i => i.getBoundingClientRect().left < document.documentElement.clientWidth); return { всего: w.length, загружено: w.filter(i => i.complete && i.naturalWidth > 0).length }; });
  say('в полосе кадра: ' + wKadrze.всего + ', загружено ' + wKadrze.загружено);
  if (wKadrze.загружено !== wKadrze.всего) throw new Error('СТОП: в полосе кадра загружено ' + wKadrze.загружено + ' из ' + wKadrze.всего + ' картинок');
  // имя файла героя — доказательство свежей загрузки: сверяется с visitor/README.md рукой (находка 7); хеш в код не вшит — он меняется со сборкой
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
  // места с DOM при scrollY = 0 (для карты диффов): рамки в целых px, как в miejsca.json сессии вида
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
  // Контроль места «okruszki» (пункт 8 списка события): на игре обязано быть, на главной — отсутствовать.
  // Ожидание вне {jest, brak} — отказ, не молчаливый пропуск (судья 2026-09-16, находка 1);
  // «есть» = элемент в DOM с ненулевой коробкой (рамка MIEJSCA даёт w = h = 1 у 0×0) — находка 3.
  const OKRUSZKI_KONTROLA = (miejscaLista, w) => {
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
  await page.evaluate(async () => { await document.fonts.ready; });
  say('ПРОКРУТКА 1440: ' + JSON.stringify(await page.evaluate(PROKRUTKA)));
  say('ГОТОВНОСТЬ 1440: ' + JSON.stringify(await page.evaluate(GOTOVNOST)));
  const ids = [...CONFIG.layers, ...CONFIG.blocks];
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
    '1440': geom['1440'], '390': geom['390'],
    почему_файл: 'Геометрия эталона для сверки числом (П39, пункт 14; П41 — кадры блоков): условия съёмки, отступ кадров блоков, высота страницы и положение якорей (слои — центрируются К_ЯКОРЮ, заголовки блоков — К_ВЕРХУ) на каждом вьюпорте. Сверяется npm run accept:frames -- check. Обнуляется вместе с кадрами.',
    страница: CONFIG.page,
    снято: CONFIG.snieto,
    сборка: CONFIG.build,
    драйвер: 'Playwright MCP (headless Chromium), полоса прокрутки скрыта, dpr 1; ГОТОВНОСТЬ после ПРОКРУТКИ под сроком 3 с на кадр (обход пункта 19); К_ЯКОРЮ/К_ВЕРХУ + проверка scrollY + осадка 700 мс и 2 rAF одним вызовом; полный кадр — fullPage',
    отступ_блока: 100,
  };
  const miejscaJson = {
    '1440': { scrollY: scrollYs, miejsca: miejsca['1440'] },
    '390': { scrollY: scrollYs, miejsca: miejsca['390'] },
    _: 'места с DOM при scrollY = 0, прогон ' + CONFIG.run + ', сборка ' + CONFIG.build,
  };
  // В песочнице MCP нет ни require, ни process: JSON кладётся на страницу,
  // а browser_evaluate с filename сохраняет его файлом (объектом, не строкой — факт 1 доклада 1а).
  await page.evaluate((d) => { window.__sesja = d; }, { log, geometria, miejsca: miejscaJson });
  return log.join('\\n');
}`;

writeFileSync(`${ROOT}/${run}/${strona}.js`, code);
console.log(`${ROOT}/${run}/${strona}.js`);
