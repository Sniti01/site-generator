#!/usr/bin/env node
/**
 * Замер контраста составных сочетаний главной второго сайта (сессия 9, П79):
 * текст поверх арта, скрима и дымки — то, чего гейт контраста не считает
 * (DESIGN.md сайта, «Правило посчитанного контраста», «Правило замера по
 * пикселю»).
 *
 *   node kontrast-art.mjs <папка кадров> <boxes.json>
 *
 * Вход — снимки `ka-<Ш>x<В>-<место>.png` со СКРЫТЫМ текстом и рамки строк
 * текста в координатах того же окна (`boxes.json`: { "<Ш>x<В>": { uslovia:
 * { dpr, clientWidth, innerHeight }, kadry: { <место>: [{ t, color, x, y, w, h,
 * text }] } } }); снимает оба скрипт для Playwright MCP
 * `kontrast-art-snyatie.js` рядом — на полосе ширин, с загрузкой страницы
 * заново на каждой.
 *
 * Для каждой строки берутся самый светлый и самый тёмный пиксели фона под её
 * рамкой; худший контраст — меньший из двух (для светлого текста решает
 * светлый пиксель, для тёмного — тёмный; находка M3). Контраст — по WCAG 2.x
 * (относительная яркость sRGB) против вычисленного цвета текста. Печатается
 * минимум по каждому месту и ширине, худшая строка (по координате y) и итог;
 * код 1 — если где-либо ниже 4,5, если хоть одна строка вне кадра или
 * срезана его краем (находка M5), если размер снимка не равен окну или
 * DPR не 1 (находка M2).
 *
 * ПРЕДЕЛЫ (названы, не чинятся):
 * - зерно снято (`.grain` скрыт) и в замере не учтено вовсе: граница его
 *   влияния, посчитанная в сессии 8, — только для пар токенов (опасность
 *   на фоне, 5,69 → 5,35), к составным сочетаниям не переносится (находка
 *   M4); запас до порога — в итоге замера;
 * - рамка строки — прямоугольник `getClientRects` по текстовому узлу, то есть
 *   область содержимого строки (подъём и спуск шрифта, без половинного
 *   интерлиньяжа) во всю её длину; она шире глифов, поэтому худший пиксель —
 *   оценка сверху для фона, а контраст — оценка снизу (находка M8);
 * - колонка текста скрывается целиком: рамки чипов и кнопок и начало трассы
 *   (они внутри колонки) в фон не входят — под буквами их нет (находка M6);
 * - цвет текста — `getComputedStyle(...).color` родителя текстового узла;
 *   прозрачность в цвете не учитывается (на главной её нет);
 * - замер проходит только по окнам, которые снял скрипт: ширина вне полосы
 *   не судится.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const sharp = createRequire(new URL('../../../../package.json', import.meta.url))('sharp');
const [dir, boxesPath] = process.argv.slice(2);
if (!dir || !boxesPath) {
  console.error('kontrast-art.mjs <папка кадров> <boxes.json>');
  process.exit(2);
}
let raw = JSON.parse(readFileSync(boxesPath, 'utf8'));
if (typeof raw === 'string') raw = JSON.parse(raw);

const lin = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const parse = (css) => css.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const oshibki = [];
let worstAll = { c: Infinity };
let linii = 0;
const tablica = [];

for (const [okno, { uslovia, kadry }] of Object.entries(raw)) {
  const [W, H] = okno.split('x').map(Number);
  if (!uslovia || uslovia.dpr !== 1) oshibki.push(`${okno}: DPR ${uslovia?.dpr} — рамки в CSS-пикселях, снимок в физических; замер только при DPR 1`);
  const stroka = { okno };
  for (const [name, boxes] of Object.entries(kadry)) {
    const file = join(dir, `ka-${okno}-${name}.png`);
    const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
    if (info.width !== W || info.height !== H) {
      oshibki.push(`${okno} ${name}: снимок ${info.width}×${info.height}, ожидали ${W}×${H}`);
      continue;
    }
    const poMestu = new Map();
    for (const b of boxes) {
      const x0 = Math.floor(b.x), y0 = Math.floor(b.y), x1 = Math.ceil(b.x + b.w), y1 = Math.ceil(b.y + b.h);
      if (x0 < 0 || y0 < 0 || x1 > info.width || y1 > info.height) {
        oshibki.push(`${okno} ${name}: строка «${b.text}» (${b.t}, y ${b.y.toFixed(1)}) ${x1 <= 0 || y1 <= 0 || x0 >= info.width || y0 >= info.height ? 'вне кадра' : 'срезана краем кадра'}`);
        continue;
      }
      let lmax = 0, lmin = 1;
      const lums = [];
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * info.width + x) * info.channels;
        const l = L(data[i], data[i + 1], data[i + 2]);
        lums.push(l);
        if (l > lmax) lmax = l;
        if (l < lmin) lmin = l;
      }
      lums.sort((a, c) => a - c);
      const lt = L(...parse(b.color));
      const c = Math.min(ratio(lt, lmax), ratio(lt, lmin));
      const p = Math.min(ratio(lt, lums[Math.floor(lums.length * 0.99)]), ratio(lt, lums[Math.floor(lums.length * 0.01)]));
      linii += 1;
      const cur = poMestu.get(b.t) ?? { c: Infinity, p99: Infinity };
      if (c < cur.c) Object.assign(cur, { c, y: b.y, text: b.text });
      if (p < cur.p99) cur.p99 = p;
      poMestu.set(b.t, cur);
      if (c < worstAll.c) worstAll = { c, okno, t: b.t, y: b.y, text: b.text };
    }
    for (const [t, v] of poMestu) stroka[`${name} ${t}`] = v;
  }
  tablica.push(stroka);
}

// Печать: по каждому элементу — минимум по окнам и где он.
const elementy = [...new Set(tablica.flatMap((s) => Object.keys(s).filter((k) => k !== 'okno')))];
for (const el of elementy) {
  let min = { c: Infinity };
  let minP = Infinity;
  for (const s of tablica) {
    const v = s[el];
    if (!v) continue;
    if (v.c < min.c) min = { ...v, okno: s.okno };
    if (v.p99 < minP) minP = v.p99;
  }
  console.log(`${el.padEnd(30)} худший пиксель ${min.c.toFixed(2)}:1 на ${min.okno} (строка y ${min.y?.toFixed(1)} «${min.text}»), p99 не ниже ${minP.toFixed(2)}:1`);
}
const nizhe = tablica.flatMap((s) => Object.entries(s).filter(([k, v]) => k !== 'okno' && v.c < 4.5).map(([k, v]) => `${s.okno} ${k} ${v.c.toFixed(2)}`));
if (nizhe.length) console.log(`\nНиже 4,5:1 — ${nizhe.length}:\n  ${nizhe.join('\n  ')}`);
if (oshibki.length) console.log(`\nОшибки замера — ${oshibki.length}:\n  ${oshibki.join('\n  ')}`);
if (!linii) {
  console.error('\nНи одной строки не измерено — это отказ, а не «всё хорошо».');
  process.exit(1);
}
console.log(`\nИтог: окон ${tablica.length}, строк ${linii}; самый тесный худший пиксель — ${worstAll.c.toFixed(2)}:1 (${worstAll.okno}, ${worstAll.t}, y ${worstAll.y?.toFixed(1)}), порог 4,5:1.`);
process.exit(worstAll.c >= 4.5 && !oshibki.length ? 0 : 1);
