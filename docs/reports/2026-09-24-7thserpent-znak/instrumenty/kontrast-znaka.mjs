// Контраст знака над содержимым под полупрозрачной шапкой (сессия 11, П83; «судью
// судят», раунд 1 — R1-KONTRAST-2, -4, -5, -6; раунд 2 — R2-POLNOTA-1, -2; раунд 3 —
// R3-POLNOTA-1, -2).
// Шапка ядра — `color-mix(in oklab, var(--bg) 88%, transparent)` с размытием: над артом
// и панелями фон под знаком — составное сочетание, гейт контраста его не считает
// (gates/contrast.mjs, «полупрозрачная шапка поверх содержимого»).
//
// ГАРАНТИЯ — ГРАНИЦА. Размытие усредняет подложку и светлее белого её не сделает, поэтому
// худший фон под шапкой — шапка над белым. Инструмент кладёт под шапку белый лист
// (fixed, z-index 49 — ниже шапки 50) и проверяет, что лист лёг ровно между шапкой
// и содержимым (elementsFromPoint в центре знака: сначала шапка, потом лист, потом
// содержимое), снимает фон шапки с экрана и считает контраст красок знака (фонарь,
// снег) и кольца фокуса ссылки знака (его вычисленный outline-color в :focus-visible,
// сверенный с токеном --accent-text) против него — при любом содержимом под шапкой,
// ширине, плотности и прокрутке, ПОКА браузер понимает color-mix() (Chrome 111,
// Firefox 113, Safari 16.2 и новее). Без color-mix() объявление фона шапки
// недействительно, запасного фона у .hdr ядра нет — шапка прозрачна, и граница
// не держится (запасной фон — ядро, бэклог 60 п. 6). Пересчитывать, если меняются
// доля color-mix шапки, токен --bg или порядок слоёв. Зерно граница не учитывает — как
// и пары гейта (абзац о зерне в gates/contrast.mjs).
//
// ЗАМЕР — ИЛЛЮСТРАЦИЯ И СТРАЖ ГРАНИЦЫ. Прокрутка всей страницы шагом 5 px (мгновенная:
// у сайта плавная прокрутка), знак скрыт, зерно снято (display: none), снимок — ВСЯ
// полоса шапки (высота — по самой шапке) во всю ширину окна, рамка знака вырезается
// в памяти: снимок, обрезанный по рамке, считает размытие шапки по обрезанной
// подложке (R1-KONTRAST-2). Худший пиксель фона — самый светлый: краски знака светлые
// на тёмном. Замер светлее границы — отказ: граница перестала быть границей.
// Плотности — 1 и 2 (граница от плотности не зависит: фон шапки однороден).
//
// ОТКАЗ (exit 1): граница или замер ниже порога — фонарь и кольцо фокуса 3:1
// (графический объект и индикатор фокуса), снег 4,5:1 (буквы имени); замер светлее
// границы; лист не между шапкой и содержимым; кольцо фокуса не цвета --accent-text;
// токен краски не #rrggbb; сервер отдаёт не dist/. Выгрузка — ../zamery/kontrast-znaka.json.
//
//   node kontrast-znaka.mjs [адрес]
//   node kontrast-znaka.mjs [адрес] --selftest — мутации в странице (тёмный фонарь,
//     прозрачная шапка, лист над шапкой, кольцо не того цвета) на 390 × 844, DPR 1,
//     замер — первые 600 px прокрутки; выгрузка ../zamery/kontrast-znaka-selftest.json
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PW, CHROME, REPO, ZAMERY, sborkaIliOtkaz, pochodzenie } from './sborka.mjs';

const { chromium } = createRequire(PW)('playwright-core');
const sharp = createRequire(join(REPO, 'package.json'))('sharp');
const ARGI = process.argv.slice(2);
const SELFTEST = ARGI.includes('--selftest');
const URL_ = ARGI.find((a) => !a.startsWith('--')) ?? 'http://localhost:4331/';
const POROG = { фонарь: 3, снег: 4.5, обводка_фокуса: 3 };

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (c) => { const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c ?? ''); return m ? '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('') : null; };
const cr = (a, b) => +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);

const sb = await sborkaIliOtkaz(URL_, 'kontrast-znaka');
const browser = await chromium.launch({ executablePath: CHROME });

async function okno(w, h, dpr, mut, doY) {
  const bledy = [];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const tag = `${w} DPR ${dpr}`;
  try {
    await page.goto(URL_, { waitUntil: 'load' });
    const p = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      await document.fonts.ready;
      for (const i of document.images) i.loading = 'eager';
      await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
      for (const g of document.querySelectorAll('.grain')) g.style.display = 'none';
      return { H: document.body.scrollHeight, niezaladowane: [...document.images].filter((i) => !(i.complete && i.naturalWidth > 0)).length };
    });
    if (mut?.css) await page.addStyleTag({ content: mut.css });
    await page.waitForTimeout(100);
    const g = await page.evaluate(() => {
      const css = getComputedStyle(document.documentElement);
      const krasy = Object.fromEntries(['accent', 'ink', 'accent-text'].map((t) => [t, css.getPropertyValue(`--${t}`).trim()]));
      const b = document.querySelector('.hdr__brand').getBoundingClientRect();
      const hdr = document.querySelector('.hdr').getBoundingClientRect();
      return { krasy, ramka: { x: Math.floor(b.x), y: Math.floor(b.y), w: Math.ceil(b.width), h: Math.ceil(b.height) }, pasa: Math.ceil(hdr.bottom) };
    });
    const zle = Object.entries(g.krasy).filter(([, v]) => !/^#[0-9a-f]{6}$/i.test(v));
    if (zle.length) { bledy.push(`${tag}: токены краски не #rrggbb — ${zle.map(([k, v]) => `--${k}: «${v}»`).join(', ')}`); return { bledy }; }
    // Кольцо фокуса — вычисленное, в :focus-visible с клавиатуры.
    for (let k = 0; k < 25; k++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => document.activeElement?.classList.contains('hdr__brand'))) break; }
    const kolco = await page.evaluate(() => { const a = document.activeElement; return a?.classList.contains('hdr__brand') && a.matches(':focus-visible') ? getComputedStyle(a).outlineColor : null; });
    await page.evaluate(() => document.activeElement?.blur());
    const kolcoHex = rgbHex(kolco);
    if (!kolcoHex) bledy.push(`${tag}: фокус на ссылке знака не встал — кольцо не снято`);
    else if (kolcoHex !== g.krasy['accent-text'].toLowerCase()) bledy.push(`${tag}: кольцо фокуса ${kolco}, а не --accent-text ${g.krasy['accent-text']}`);
    const K = { accent: L(...hex(g.krasy.accent)), ink: L(...hex(g.krasy.ink)), kolco: kolcoHex ? L(...hex(kolcoHex)) : L(...hex(g.krasy['accent-text'])) };
    await page.evaluate(() => { document.querySelector('.hdr__brand .znak').style.visibility = 'hidden'; });
    const wyciag = async () => {
      const buf = await page.screenshot({ clip: { x: 0, y: 0, width: w, height: g.pasa } });
      const r = g.ramka;
      const { data, info } = await sharp(buf).extract({ left: Math.round(r.x * dpr), top: Math.round(r.y * dpr), width: Math.round(r.w * dpr), height: Math.round(r.h * dpr) }).raw().toBuffer({ resolveWithObject: true });
      let naj = { L: -1 };
      for (let i = 0; i < data.length; i += info.channels) { const l = L(data[i], data[i + 1], data[i + 2]); if (l > naj.L) naj = { L: l, rgb: [data[i], data[i + 1], data[i + 2]] }; }
      return naj;
    };
    // Граница: белый лист под шапкой, над содержимым.
    await page.evaluate((z) => {
      const list = document.createElement('div');
      list.id = 'bialy-list';
      list.style.cssText = `position:fixed;inset:0 0 auto 0;height:80px;background:#fff;z-index:${z}`;
      document.body.append(list);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, mut?.zListu ?? 49);
    await page.waitForTimeout(150);
    const sloj = await page.evaluate(({ x, y, w: rw, h: rh }) => {
      const st = document.elementsFromPoint(x + rw / 2, y + rh / 2);
      const iH = st.findIndex((e) => e.closest('.hdr'));
      const iL = st.findIndex((e) => e.id === 'bialy-list');
      const iM = st.findIndex((e) => e.closest('main'));
      return { iH, iL, iM, verh: st.slice(0, 4).map((e) => `${e.localName}${e.id ? `#${e.id}` : ''}${[...e.classList].slice(0, 1).map((c) => `.${c}`).join('')}`) };
    }, g.ramka);
    if (!(sloj.iH >= 0 && sloj.iL > sloj.iH && (sloj.iM === -1 || sloj.iM > sloj.iL))) bledy.push(`${tag}: белый лист не между шапкой и содержимым (сверху: ${sloj.verh.join(' > ')})`);
    const gran = await wyciag();
    await page.evaluate(() => document.getElementById('bialy-list').remove());
    // Замер: вся страница (или до doY) шагом 5.
    let naj = { L: -1 };
    const kon = Math.min(p.H - h, doY ?? Infinity);
    for (let y = 0; y <= kon; y += 5) {
      await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
      await page.waitForTimeout(30);
      const n = await wyciag();
      if (n.L > naj.L) naj = { ...n, y };
    }
    const granica = { фонарь: cr(K.accent, gran.L), снег: cr(K.ink, gran.L), обводка_фокуса: cr(K.kolco, gran.L) };
    const zamer = { фонарь: cr(K.accent, naj.L), снег: cr(K.ink, naj.L) };
    for (const [nazwa, pary] of [['граница', granica], ['замер', zamer]]) for (const [k, v] of Object.entries(pary)) if (v < POROG[k]) bledy.push(`${tag}, ${nazwa}: ${k} ${v}:1 ниже порога ${POROG[k]}:1`);
    if (naj.L > gran.L) bledy.push(`${tag}: замер светлее границы — rgb(${naj.rgb.join(' ')}) при scrollY ${naj.y} против rgb(${gran.rgb.join(' ')}): граница перестала быть границей`);
    if (p.niezaladowane) bledy.push(`${tag}: не загружено картинок — ${p.niezaladowane}; замер не по всей странице`);
    return {
      bledy,
      okno: { krasy: g.krasy, kolco_fokusa: kolco, polosa_shapki: g.pasa, sloj: sloj.verh, niezagruzheno_kartinok: p.niezaladowane, granica_fon_nad_belym: `rgb(${gran.rgb.join(' ')})`, granica, zamer_hudshiy_fon: `rgb(${naj.rgb.join(' ')})`, zamer_scrollY: naj.y, zamer },
    };
  } finally {
    await ctx.close();
  }
}

try {
  if (!SELFTEST) {
    const wynik = { instrument: 'kontrast-znaka.mjs', brauzer: `Chromium ${browser.version()}`, ...pochodzenie(import.meta.url), sborka: sb, porog: POROG, okna: {}, bledy: [] };
    for (const [w, h, dpr] of [[390, 844, 1], [1440, 900, 1], [390, 844, 2], [1440, 900, 2]]) {
      const r = await okno(w, h, dpr, null);
      wynik.bledy.push(...r.bledy);
      wynik.okna[`${w} DPR ${dpr}`] = r.okno;
    }
    writeFileSync(join(ZAMERY, 'kontrast-znaka.json'), JSON.stringify(wynik, null, 2) + '\n');
    console.log(JSON.stringify({ brauzer: wynik.brauzer, okna: Object.fromEntries(Object.entries(wynik.okna).map(([k, v]) => [k, { granica: v?.granica, zamer: v?.zamer, zamer_scrollY: v?.zamer_scrollY, kolco: v?.kolco_fokusa }])), bledy: wynik.bledy }, null, 2));
    if (wynik.bledy.length) process.exitCode = 1;
  } else {
    const proby = [
      { nazwa: 'чистая страница', mut: null, zhdem: null },
      { nazwa: 'тёмный фонарь', mut: { css: ':root { --accent: #5a4a30 !important }' }, zhdem: 'фонарь' },
      { nazwa: 'прозрачная шапка', mut: { css: '.hdr { background: transparent !important }' }, zhdem: 'ниже порога' },
      { nazwa: 'лист над шапкой', mut: { zListu: 51 }, zhdem: 'белый лист не между' },
      { nazwa: 'кольцо фокуса не того цвета', mut: { css: '.hdr__brand:focus-visible { outline-color: #8899aa !important }' }, zhdem: 'кольцо фокуса' },
    ];
    const wyniki = [];
    for (const p of proby) {
      const { bledy } = await okno(390, 844, 1, p.mut, 600);
      const ok = p.zhdem === null ? bledy.length === 0 : bledy.some((b) => b.includes(p.zhdem));
      wyniki.push({ nazwa: p.nazwa, zhdem: p.zhdem, ok, bledy });
      console.log(`${ok ? 'ok ' : 'НЕТ'}  ${p.nazwa}: ждём ${p.zhdem ? `отказ «${p.zhdem}»` : 'сверено'}, факт ${bledy.length ? bledy.join('; ') : 'сверено'}`);
    }
    writeFileSync(join(ZAMERY, 'kontrast-znaka-selftest.json'), JSON.stringify({ instrument: 'kontrast-znaka.mjs', ...pochodzenie(import.meta.url), proby: wyniki }, null, 2) + '\n');
    const zle = wyniki.filter((w) => !w.ok).length;
    console.log(`kontrast-znaka --selftest: ${wyniki.length - zle}/${wyniki.length}`);
    if (zle) process.exitCode = 1;
  }
} finally {
  await browser.close();
}
