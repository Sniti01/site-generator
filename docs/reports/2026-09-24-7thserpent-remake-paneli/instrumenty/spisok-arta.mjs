#!/usr/bin/env node
// Лист арта главной второго сайта для приёмки глазами (сессия 10, П81): все кадры
// издателя из src/data/game-art.json — превью (обрезка под плитку), ключ, игра, вид,
// адрес витрины, размер; внизу — класс лицензии. Тот же вид, что spisok-arta.jpg
// сессии 9 (docs/reports/2026-09-23-7thserpent-glavnaya/), теперь на 20 кадров.
//
//   node spisok-arta.mjs <папка вывода>
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
const out = process.argv[2];
if (!out) { console.error('spisok-arta.mjs <папка вывода>'); process.exit(2); }
const credits = JSON.parse(readFileSync(join(ROOT, 'sites/7thserpent.com/src/data/game-art.json'), 'utf8'));
const keys = Object.keys(credits);

const COLS = 3, TW = 520, TH = 290, LH = 64, GAP = 8, PAD = 0;
const rows = Math.ceil(keys.length / COLS);
const W = COLS * TW + (COLS - 1) * GAP;
const FOOT = 56;
const H = rows * (TH + LH + GAP) + FOOT;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const layers = [];
let licenses = new Set();
for (const [n, key] of keys.entries()) {
  const c = credits[key];
  licenses.add(c.license);
  const x = (n % COLS) * (TW + GAP) + PAD;
  const y = Math.floor(n / COLS) * (TH + LH + GAP);
  const img = await sharp(join(ROOT, 'sites/7thserpent.com/src/assets/gry', c.file)).resize(TW, TH, { fit: 'cover', position: key.endsWith('-art') ? 'right' : 'centre' }).toBuffer();
  layers.push({ input: img, left: x, top: y });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${LH}">
    <rect width="100%" height="100%" fill="#131820"/>
    <text x="6" y="22" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#eca84a">${esc(key)}</text>
    <text x="104" y="22" font-family="Arial, sans-serif" font-size="13" fill="#e5eaee">${esc(`${c.game} — ${c.kind}`).slice(0, 90)}</text>
    <text x="6" y="46" font-family="Arial, sans-serif" font-size="11" fill="#9aa4ae">${esc(`${c.source} · ${c.width}×${c.height}`)}</text>
  </svg>`;
  layers.push({ input: Buffer.from(svg), left: x, top: y + TH });
}
if (licenses.size !== 1) throw new Error('классов лицензии больше одного: ' + [...licenses].join(' | '));
const foot = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${FOOT}">
  <rect width="100%" height="100%" fill="#0b0e13"/>
  <text x="6" y="34" font-family="Arial, sans-serif" font-size="14" fill="#e5eaee">${esc(`License class (every record, ${keys.length} files): ${[...licenses][0]}`)}</text>
</svg>`;
layers.push({ input: Buffer.from(foot), left: 0, top: H - FOOT });
await sharp({ create: { width: W, height: H, channels: 3, background: '#0b0e13' } }).composite(layers).jpeg({ quality: 82, mozjpeg: true }).toFile(join(out, 'spisok-arta.jpg'));
console.log(`spisok-arta.jpg: ${keys.length} кадров, ${W}×${H}`);
