#!/usr/bin/env node
/**
 * Замер контраста составных сочетаний главной второго сайта (сессия 9, П79):
 * текст поверх арта, скрима и дымки — то, чего гейт контраста не считает
 * (DESIGN.md сайта, «Правило посчитанного контраста», «Правило замера по
 * пикселю»).
 *
 *   node kontrast-art.mjs <папка кадров> <boxes.json>
 *
 * Вход — снимки `ka-<ширина>-<кадр>.png` со СКРЫТЫМ текстом и рамки строк
 * текста в координатах того же окна (`boxes.json`: { <ширина>: { <кадр>:
 * [{ t, color, x, y, w, h, text }] } }); снимает оба скрипт для Playwright
 * MCP `kontrast-art-snyatie.js` рядом. Для каждой строки берётся самый
 * светлый пиксель фона под её рамкой (худший случай для светлого текста)
 * и 99-й перцентиль; контраст — по WCAG 2.x (относительная яркость sRGB)
 * против вычисленного цвета текста. Итог — самый тесный худший пиксель;
 * код 1, если он ниже 4,5.
 *
 * ПРЕДЕЛЫ (названы, не чинятся):
 * - зерно снято (`.grain` скрыт): его граница считается отдельно
 *   (DESIGN.md, сессия 8) — худший пиксель здесь без зерна;
 * - рамка строки — прямоугольник `getClientRects`: он шире глифов
 *   (межстрочье и боковые поля входят), поэтому худший пиксель — оценка
 *   сверху для фона, т. е. контраст — оценка снизу;
 * - текст светлее фона предполагается; если нет — печатается «ТЕКСТ
 *   ТЕМНЕЕ» и считается та же формула (она симметрична);
 * - рамка вне кадра (ниже окна) — «вне кадра», не считается и не падает:
 *   такие строки надо снять отдельным кадром (скрипт съёмки делает это
 *   для полосы чипов и прокручивает к полосам цитаты и призыва);
 * - цвет текста — `getComputedStyle(...).color` родителя текстового узла;
 *   прозрачность в цвете не учитывается (на главной её нет).
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

let worstAll = Infinity;
let liczba = 0;
for (const [w, kadry] of Object.entries(raw)) {
  for (const [name, boxes] of Object.entries(kadry)) {
    const file = join(dir, `ka-${w}-${name}.png`);
    const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
    console.log(`\n== ${w}px, ${name} (${info.width}×${info.height})`);
    const perTarget = new Map();
    for (const b of boxes) {
      const x0 = Math.max(0, Math.floor(b.x)), y0 = Math.max(0, Math.floor(b.y));
      const x1 = Math.min(info.width, Math.ceil(b.x + b.w)), y1 = Math.min(info.height, Math.ceil(b.y + b.h));
      if (x1 <= x0 || y1 <= y0) { console.log(`   вне кадра: ${b.t} «${b.text}»`); continue; }
      const lums = [];
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * info.width + x) * info.channels;
        lums.push(L(data[i], data[i + 1], data[i + 2]));
      }
      lums.sort((a, c) => a - c);
      const max = lums[lums.length - 1];
      const p99 = lums[Math.floor(lums.length * 0.99)];
      const lt = L(...parse(b.color));
      const cWorst = ratio(lt, max), cP99 = ratio(lt, p99);
      const darker = lt < max;
      liczba += 1;
      const cur = perTarget.get(b.t) ?? { worst: Infinity };
      if (cWorst < cur.worst) perTarget.set(b.t, { worst: cWorst, p99: cP99, text: b.text, darker });
      worstAll = Math.min(worstAll, cWorst);
    }
    for (const [t, v] of perTarget) {
      console.log(`   ${t.padEnd(18)} худший пиксель ${v.worst.toFixed(2)}:1, p99 ${v.p99.toFixed(2)}:1  «${v.text}»${v.darker ? '  ТЕКСТ ТЕМНЕЕ' : ''}`);
    }
  }
}
if (!liczba) {
  console.error('\nНи одной строки в кадре — замер пуст, это отказ, а не «всё хорошо».');
  process.exit(1);
}
console.log(`\nИтог: строк ${liczba}; самый тесный худший пиксель — ${worstAll.toFixed(2)}:1 (порог 4,5:1).`);
process.exit(worstAll >= 4.5 ? 0 : 1);
