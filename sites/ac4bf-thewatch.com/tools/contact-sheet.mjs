#!/usr/bin/env node
/**
 * Składa pobrane kadry w jeden arkusz podglądowy, żeby obejrzeć wybór
 * jednym rzutem oka zamiast otwierać kilkanaście plików.
 *
 *   node tools/contact-sheet.mjs [katalog] [plik-wyjsciowy]
 *   npm run art:sheet -- input/kadry/karaiby
 *
 * Od 2026-09-15 (П57, «kadry rzędom») arkusz służy WYBOROWI kadru do rzędu:
 * kafel 16:9 z `fit: contain` (640×360), żeby HUD i znak wodny przy krawędziach
 * zrzutu były widoczne — dawne 640×300 `cover` ścinało górę i dół; trzy
 * kolumny; podpis — `<slot> [nn] szer×wys` z lista.json obok kadrów (pisze ją
 * `fetch-game-art.mjs --kandydaci`), a bez listy — nazwa pliku. Wyjście
 * domyślne — `input/kadry/arkusze/<nazwa-katalogu>.jpg`, POZA git
 * (`.gitignore`): arkusz to te same kadry wydawcy plakietką, a klasa
 * licencji jest zapisana dla pokazu na stronach, nie dla składu w repozytorium.
 */

import sharp from 'sharp';
import { readdirSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, isAbsolute, basename } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2] ?? 'src/assets/foto';
const dir = isAbsolute(arg) ? arg : join(root, arg);
const nazwa = basename(dir.replace(/[\\/]$/, ''));
const out = process.argv[3] ?? join(root, 'input/kadry/arkusze', `${nazwa}.jpg`);

if (!existsSync(dir)) {
  console.error(`Brak ${dir} — najpierw uruchom odpowiedni skrypt pobierania`);
  process.exit(1);
}

const files = readdirSync(dir).filter((name) => /\.(jpe?g|png|webp)$/i.test(name)).sort();
if (!files.length) {
  console.error(`Katalog ${dir} jest pusty.`);
  process.exit(1);
}

// Podpisy z lista.json (kandydaci ze Steam): slot, indeks, wymiary.
const listaPath = join(dir, 'lista.json');
const lista = existsSync(listaPath) ? JSON.parse(readFileSync(listaPath, 'utf8')) : null;
const podpis = (name) => {
  const wpis = lista?.zrzuty?.find((z) => z.plik === name);
  return wpis ? `${lista.slot} [${String(wpis.i).padStart(2, '0')}] ${wpis.width}×${wpis.height}` : name;
};

const cellW = 640;
const cellH = 360;
const cols = 3;
const rows = Math.ceil(files.length / cols);
const labelH = 26;

const tiles = await Promise.all(
  files.map(async (name, index) => {
    const image = await sharp(join(dir, name))
      .resize(cellW, cellH, { fit: 'contain', background: '#111111' })
      .jpeg({ quality: 82 })
      .toBuffer();
    return {
      input: image,
      left: (index % cols) * cellW,
      top: Math.floor(index / cols) * (cellH + labelH) + labelH,
    };
  }),
);

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const labels = files.map((name, index) => ({
  input: Buffer.from(
    `<svg width="${cellW}" height="${labelH}">
       <rect width="${cellW}" height="${labelH}" fill="#111"/>
       <text x="10" y="18" font-family="monospace" font-size="14" fill="#eee">${escape(podpis(name))}</text>
     </svg>`,
  ),
  left: (index % cols) * cellW,
  top: Math.floor(index / cols) * (cellH + labelH),
}));

mkdirSync(dirname(out), { recursive: true });
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
