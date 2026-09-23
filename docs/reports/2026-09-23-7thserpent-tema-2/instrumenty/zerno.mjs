// ВЕРХНЯЯ ГРАНИЦА влияния зерна Grain на пары гейта: soft-light (W3C Compositing), непрозрачность
// 0.085, шум — серый 0…1 с альфой ≤ 1, смешение в закодированном sRGB. Граница: фон осветлён белым
// шумом при полной альфе, текст затемнён чёрным (и наоборот — берём меньшее из двух отношений).
// Случай на деле недостижим (раунд 1 «судью судят», сессия 8: реальное зерно в Chrome на тёмном
// фоне только осветляет) — печатаемое отношение — нижняя граница контраста пары (влияние зерна
// сверху), не замер худшего пикселя.
import { readFileSync } from 'node:fs';
import { R } from './kontrast.mjs';
const D = (b) => (b <= 0.25 ? ((16 * b - 12) * b + 4) * b : Math.sqrt(b));
const soft = (b, s) => (s <= 0.5 ? b - (1 - 2 * s) * b * (1 - b) : b + (2 * s - 1) * (D(b) - b));
const A = 0.085;
const mix = (hex, s) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const o = c.map((b) => (1 - A) * b + A * soft(b, s));
  return '#' + o.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
};
const css = readFileSync(new URL('../../../../sites/7thserpent.com/src/styles/global.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const root = css.slice(css.search(/^[ \t]*:root\s*\{/m));
const t = (n) => root.match(new RegExp('--' + n + ':\\s*(#[0-9a-fA-F]{6})\\s*;'))[1];
const pairs = (await import('../../../../sites/7thserpent.com/gates/contrast.mjs')).default;
let min = Infinity, minRow = '';
for (const [fg, bg, prog, label] of pairs) {
  const f = t(fg), b = t(bg);
  const base = R(f, b);
  const w1 = R(mix(f, 0), mix(b, 1));
  const w2 = R(mix(f, 1), mix(b, 0));
  const w = Math.min(w1, w2);
  if (w - prog < min) { min = w - prog; minRow = `${fg}/${bg} ${w.toFixed(2)} (порог ${prog})`; }
  console.log(`${fg.padEnd(14)} / ${bg.padEnd(10)} ${base.toFixed(2)} → граница снизу ${w.toFixed(2)}  (порог ${prog})${w < prog ? '  НИЖЕ ПОРОГА' : ''}`);
}
console.log('наименьший запас (граница): ' + minRow);
