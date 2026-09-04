#!/usr/bin/env node
/**
 * Składa pobrane zdjęcia w jeden arkusz podglądowy, żeby obejrzeć wybór
 * jednym rzutem oka zamiast otwierać sześć plików.
 *
 *   node tools/contact-sheet.mjs [katalog] [plik-wyjsciowy]
 */

import sharp from 'sharp';
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, isAbsolute } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2] ?? 'src/assets/foto';
const dir = isAbsolute(arg) ? arg : join(root, arg);
const out =
  process.argv[3] ?? join(root, `.impeccable/review/arkusz-${arg.replace(/[\/]$/, '').split(/[\/]/).pop()}.jpg`);

if (!existsSync(dir)) {
  console.error(`Brak ${dir} — najpierw uruchom odpowiedni skrypt pobierania`);
  process.exit(1);
}

const files = readdirSync(dir).filter((name) => /\.(jpe?g|png|webp)$/i.test(name)).sort();
if (!files.length) {
  console.error(`Katalog ${dir} jest pusty.`);
  process.exit(1);
}

const cellW = 640;
const cellH = 300;
const cols = 2;
const rows = Math.ceil(files.length / cols);
const labelH = 26;

const tiles = await Promise.all(
  files.map(async (name, index) => {
    const image = await sharp(join(dir, name))
      .resize(cellW, cellH, { fit: 'cover' })
      .jpeg({ quality: 82 })
      .toBuffer();
    return {
      input: image,
      left: (index % cols) * cellW,
      top: Math.floor(index / cols) * (cellH + labelH) + labelH,
    };
  }),
);

const labels = files.map((name, index) => ({
  input: Buffer.from(
    `<svg width="${cellW}" height="${labelH}">
       <rect width="${cellW}" height="${labelH}" fill="#111"/>
       <text x="10" y="18" font-family="monospace" font-size="14" fill="#eee">${name}</text>
     </svg>`,
  ),
  left: (index % cols) * cellW,
  top: Math.floor(index / cols) * (cellH + labelH),
}));

await sharp({
  create: {
    width: cols * cellW,
    height: rows * (cellH + labelH),
    channels: 3,
    background: '#111111',
  },
})
  .composite([...labels, ...tiles])
  .jpeg({ quality: 84 })
  .toFile(out);

console.log(`Arkusz: ${out} (${files.length} kadrow)`);
