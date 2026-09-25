// Генератор скриптов сверки вычисленных стилей для browser_run_code_unsafe (Playwright MCP),
// сессия 13 трека «второй сайт» (П87, приёмка: «вычисленные стили главной и /404/ до и после —
// 0 различий»). Способ — сессии 12 (`zamery/glavnaya-stili.json` доклада пачки 0), записан
// заново: скрипт той сессии в репозитории не сохранился.
//
// node stili-gen.mjs <прогон> <glowna|404> <1440|390|390-yashik> <лист-до> <лист-после> [порт-до] [порт-после]
//   → пишет .playwright-mcp/sesja-13/<прогон>/stili-<страница>-<состояние>.js
//   <лист-до>, <лист-после> — имена общего листа стилей сборок (`LinkList.*.css`), обязаны
//   различаться, порты — тоже: скрипт сверяет, что на порту отвечает та сборка, что каждый
//   лист страницы загружен и несёт правила (`sheet.cssRules.length > 0`; лист, не отданный
//   сервером, бросает при чтении правил), и останавливается, если нет.
//
// Что делает скрипт в браузере:
//   1. Одна вкладка, вьюпорт состояния, DPR 1. «До» и «после» грузятся по очереди в ту же
//      вкладку: load, document.fonts.ready, прокрутка в 0, осадка 1,5 с и 2 rAF (стрелка ленты
//      меняет состояние скриптом после загрузки — сессия 12). Для «390-yashik» — щелчок по
//      `.hdr__burger` и ещё 1,5 с; проверяется `aria-expanded="true"` и класс `menu-otwarte`.
//   2. Снимок: documentElement, body и каждый элемент body в порядке документа — сам элемент,
//      ::before, ::after; все свойства getComputedStyle строкой «имя:значение». Метка строки —
//      номер, тег, id и классы: расхождение меток — различие.
//   3. Сравнение: число элементов, метки и строки по порядку. Различие — строка, у которой
//      хоть одно «имя:значение» не совпало.
//   4. Контроли на странице «после» (каждый — с перезагрузкой и тем же состоянием):
//      К1 — вернуть ушедшее правило `@layer utilities{.lowercase{text-transform:lowercase}}`:
//           ждём 0 различий. Это повтор основной сверки внутри одной сборки (правило инертно:
//           класса нет в HTML; перезагрузка воспроизводима), а не довод зрячести: К1 = 0 даёт
//           и слепая сверка. К1 ≠ 0 — правило не инертно или перезагрузка не воспроизводима.
//      К2 — `letter-spacing` у h1 на 0.001em больше: ждём ≥1 различие, и среди них строку h1
//           (наследники h1 меняются вместе с ним законно);
//      К3 — `a::after{outline-offset:1px}`: ждём ≥1 различие, и все — в строках ::after.
//      Зрячесть доказывают К2 и К3; условия проверяются по полному списку различий (первые 8 —
//      только для печати). Не видят — «СЛЕПА», итог «отказ»; К1 ≠ 0 — итог «отказ».
//   5. Итог — в window.__stili (выгрузка browser_evaluate в файл) и строкой возврата.
// ПРЕДЕЛЫ (названы): не снимаются ::first-letter, ::first-line, ::marker, ::selection,
// ::placeholder, ::backdrop и псевдоэлементы полосы прокрутки; не сверяются печать,
// принудительные цвета, prefers-reduced-motion и prefers-reduced-transparency, :target, active,
// плотности кроме 1, ширины кроме 1440 и 390, прокрутка кроме 0 (стили, зависящие от прокрутки
// через animation-timeline, — только в точке 0); элементы <head> не снимаются. Наведение
// и фокус: в состояниях без ящика их нет; в «390-yashik» щелчок оставляет :hover на цепочке
// .hdr__burger (с html, body и шапкой) и :focus на кнопке — одинаково в «до» и «после»,
// то есть это состояние сверяется, а прочие наведения и фокусы — нет.
import { mkdirSync, writeFileSync } from 'node:fs';

const [, , run, strona, sost, listDo, listPosle, portDo = '4341', portPosle = '4342'] = process.argv;
const PUTI = { glowna: '/', '404': '/404/' };
const SOST = { '1440': { w: 1440, h: 900, yashik: false }, '390': { w: 390, h: 844, yashik: false }, '390-yashik': { w: 390, h: 844, yashik: true } };
if (!run || !PUTI[strona] || !SOST[sost] || !listDo || !listPosle) {
  console.error('node stili-gen.mjs <прогон> <glowna|404> <1440|390|390-yashik> <лист-до> <лист-после> [порт-до] [порт-после]');
  process.exit(2);
}
if (listDo === listPosle || portDo === portPosle) {
  console.error('лист «до» и лист «после» (и порты) обязаны различаться: иначе сверяется сборка сама с собой');
  process.exit(2);
}
const ROOT = new URL('../../../../.playwright-mcp/sesja-13', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const CONFIG = {
  run, strona, sost, ...SOST[sost],
  do: `http://127.0.0.1:${portDo}${PUTI[strona]}`, posle: `http://127.0.0.1:${portPosle}${PUTI[strona]}`,
  listDo, listPosle,
};

const code = `async (page) => {
  const CONFIG = ${JSON.stringify(CONFIG)};
  const SNIMOK = () => {
    const els = [document.documentElement, document.body, ...document.body.querySelectorAll('*')];
    const rows = [];
    for (let k = 0; k < els.length; k++) {
      const el = els[k];
      const kl = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).join('.') : '';
      const metka = k + ' ' + el.tagName + (el.id ? '#' + el.id : '') + kl;
      for (const ps of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, ps);
        const v = [];
        for (let i = 0; i < cs.length; i++) { const p = cs[i]; v.push(p + ':' + cs.getPropertyValue(p)); }
        rows.push([metka + (ps || ''), v.join('\\n')]);
      }
    }
    return { elementov: els.length, rows };
  };
  const OSADKA = () => new Promise(r => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(r)), 1500));
  const zagruzit = async (url, list) => {
    await page.goto(url, { waitUntil: 'load' });
    const listy = await page.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => {
      let pravil = -1;
      try { pravil = l.sheet ? l.sheet.cssRules.length : -1; } catch (e) { pravil = -1; }
      return { href: l.getAttribute('href'), pravil };
    }));
    if (!listy.some(h => h.href.endsWith('/' + list))) throw new Error('СТОП: на ' + url + ' нет листа ' + list + ' (листы: ' + listy.map(h => h.href).join(', ') + ')');
    const nezagr = listy.filter(h => !(h.pravil > 0));
    if (nezagr.length) throw new Error('СТОП: на ' + url + ' лист не загружен или пуст: ' + nezagr.map(h => h.href + ' (правил ' + h.pravil + ')').join(', '));
    await page.evaluate(async () => { await document.fonts.ready; window.scrollTo({ top: 0, behavior: 'instant' }); });
    await page.evaluate(OSADKA);
    if (CONFIG.yashik) {
      await page.click('.hdr__burger');
      await page.evaluate(OSADKA);
      const ok = await page.evaluate(() => document.querySelector('.hdr__burger').getAttribute('aria-expanded') === 'true' && document.documentElement.classList.contains('menu-otwarte'));
      if (!ok) throw new Error('СТОП: ящик меню не открылся на ' + url);
    }
    const s = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio, y: window.scrollY }));
    if (s.w !== CONFIG.w || s.dpr !== 1 || s.y !== 0) throw new Error('СТОП: состояние ' + JSON.stringify(s));
    return listy;
  };
  const sravnit = (a, b) => {
    const r = [];
    if (a.elementov !== b.elementov) r.push({ chto: 'число элементов', do: a.elementov, posle: b.elementov });
    if (a.rows.length !== b.rows.length) r.push({ chto: 'число строк', do: a.rows.length, posle: b.rows.length });
    const m = Math.min(a.rows.length, b.rows.length);
    for (let i = 0; i < m; i++) {
      if (a.rows[i][0] !== b.rows[i][0]) { r.push({ stroka: i, chto: 'метка', do: a.rows[i][0], posle: b.rows[i][0] }); continue; }
      if (a.rows[i][1] !== b.rows[i][1]) {
        const pa = a.rows[i][1].split('\\n'), pb = b.rows[i][1].split('\\n');
        const sa = new Set(pa), sb = new Set(pb);
        r.push({ stroka: i, metka: a.rows[i][0], ushlo: pa.filter(x => !sb.has(x)).slice(0, 5), prishlo: pb.filter(x => !sa.has(x)).slice(0, 5) });
      }
    }
    return { strok: a.rows.length, elementov: a.elementov, svoystv_v_stroke_0: a.rows[0][1].split('\\n').length, razlichiy: r.length, metki: r.map(x => x.metka || ('(' + x.chto + ')')), pervye: r.slice(0, 8) };
  };

  await page.setViewportSize({ width: CONFIG.w, height: CONFIG.h });
  const listyDo = await zagruzit(CONFIG.do, CONFIG.listDo);
  const A = await page.evaluate(SNIMOK);
  const listyPosle = await zagruzit(CONFIG.posle, CONFIG.listPosle);
  const B = await page.evaluate(SNIMOK);
  const osnovnoe = sravnit(A, B);

  const kontrol = async (imya, mut) => {
    await zagruzit(CONFIG.posle, CONFIG.listPosle);
    await page.evaluate(mut);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    return { imya, ...sravnit(B, await page.evaluate(SNIMOK)) };
  };
  const k1 = await kontrol('К1 вернуть .lowercase в слой утилит', () => { const s = document.createElement('style'); s.textContent = '@layer utilities{.lowercase{text-transform:lowercase}}'; document.head.appendChild(s); });
  const k2 = await kontrol('К2 letter-spacing h1 +0.001em', () => { const h = document.querySelector('h1'); const ls = parseFloat(getComputedStyle(h).letterSpacing) || 0; h.style.letterSpacing = 'calc(' + ls + 'px + 0.001em)'; });
  const k3 = await kontrol('К3 a::after{outline-offset:1px}', () => { const s = document.createElement('style'); s.textContent = 'a::after{outline-offset:1px}'; document.head.appendChild(s); });
  const k1Ok = k1.razlichiy === 0;
  const zryachest = k2.razlichiy >= 1 && k2.metki.some(m => /\\bH1\\b/.test(m))
    && k3.razlichiy >= 1 && k3.metki.every(m => m.endsWith('::after'));
  const itog = osnovnoe.razlichiy === 0 && k1Ok && zryachest ? 'сверено' : 'отказ';
  for (const k of [k1, k2, k3]) delete k.metki;
  delete osnovnoe.metki;
  const d = { run: CONFIG.run, strona: CONFIG.strona, sost: CONFIG.sost, do: CONFIG.do, posle: CONFIG.posle, listyDo, listyPosle, osnovnoe, kontrol: [k1, k2, k3], k1Ok, zryachest, itog };
  await page.evaluate((x) => { window.__stili = x; }, d);
  return CONFIG.strona + ' ' + CONFIG.sost + ': элементов ' + osnovnoe.elementov + ', строк ' + osnovnoe.strok + ', свойств в строке ' + osnovnoe.svoystv_v_stroke_0 + ', различий ' + osnovnoe.razlichiy
    + '; К1 (повтор внутри сборки) ' + k1.razlichiy + (k1Ok ? '' : ' — ПРАВИЛО НЕ ИНЕРТНО')
    + '; зрячесть: К2 ' + k2.razlichiy + ', К3 ' + k3.razlichiy + ' — ' + (zryachest ? 'видит' : 'СЛЕПА') + '; итог ' + itog;
}`;

mkdirSync(`${ROOT}/${run}`, { recursive: true });
const out = `${ROOT}/${run}/stili-${strona}-${sost}.js`;
writeFileSync(out, code);
console.log(out);
