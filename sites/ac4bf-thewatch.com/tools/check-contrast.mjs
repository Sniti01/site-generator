#!/usr/bin/env node
// Gate: kontrast każdej pary, która naprawdę występuje na stronie.
// DESIGN.md wymaga liczby, nie oka: tekst ≥ 4,5:1, elementy UI ≥ 3:1.
// Pary są deklarowane tutaj i muszą pokrywać każde zestawienie z global.css.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles/global.css'), 'utf8');

/** Zbiera `--nazwa: #hex;` z bloku @theme oraz z bloków epok. */
function collectTokens(source) {
  const out = new Map();
  const re = /--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g;
  let m;
  while ((m = re.exec(source)) !== null) out.set(m[1], m[2]);
  return out;
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const tokens = collectTokens(css);

function tok(name) {
  const value = tokens.get(name);
  if (!value) {
    console.error(`BRAK TOKENU: --${name} nie istnieje w src/styles/global.css`);
    process.exitCode = 1;
    return '#000000';
  }
  return value;
}

// Epoki: akcent wędruje po zejściu, więc każda para liczy się osobno.
const eras = ['jerozolima', 'wlochy', 'karaiby', 'londyn', 'japonia'];

const pairs = [
  // tekst na tłach szasi
  ['ink', 'bg', 4.5, 'tekst główny na tle strony'],
  ['ink', 'bg-band', 4.5, 'tekst główny na paśmie'],
  ['ink', 'surface', 4.5, 'tekst główny na karcie'],
  ['ink', 'surface-2', 4.5, 'tekst główny na karcie podniesionej'],
  ['ink-muted', 'bg', 4.5, 'tekst drugorzędny na tle strony'],
  ['ink-muted', 'bg-band', 4.5, 'tekst drugorzędny na paśmie'],
  ['ink-muted', 'surface', 4.5, 'tekst drugorzędny na karcie'],
  ['ink-muted', 'surface-2', 4.5, 'tekst drugorzędny na karcie podniesionej'],
  // marka
  ['accent-text', 'bg', 4.5, 'link/akcent tekstowy na tle strony'],
  ['accent-text', 'bg-band', 4.5, 'link/akcent tekstowy na paśmie'],
  ['accent-text', 'surface', 4.5, 'link/akcent tekstowy na karcie'],
  ['accent-text', 'surface-2', 4.5, 'link/akcent tekstowy na karcie podniesionej'],
  ['ink-on-accent', 'accent', 4.5, 'napis w wypełnionym przycisku'],
  ['accent', 'bg', 3, 'wypełnienie akcentu jako element UI'],
  ['accent-2', 'bg', 3, 'mosiądz jako element UI'],
  ['accent-2', 'surface', 3, 'mosiądz na karcie'],
  // pergamin (karta epoki)
  ['ink-parchment', 'parchment', 4.5, 'tekst na pergaminie'],
  ['ink-parchment-muted', 'parchment', 4.5, 'tekst drugorzędny na pergaminie'],
  // ostrzeżenie
  ['danger', 'bg', 4.5, 'komunikat o zagrożeniu'],
];

for (const era of eras) {
  pairs.push([`era-${era}-text`, 'bg', 4.5, `akcent tekstowy epoki ${era} na tle strony`]);
  pairs.push([`era-${era}-text`, 'surface', 4.5, `akcent tekstowy epoki ${era} na karcie`]);
  pairs.push([`era-${era}`, 'bg', 3, `wypełnienie epoki ${era} jako element UI`]);
  pairs.push([`era-${era}-ink`, `era-${era}`, 4.5, `napis na wypełnieniu epoki ${era}`]);
}

let failed = 0;
const rows = [];

for (const [fg, bg, min, label] of pairs) {
  const value = ratio(tok(fg), tok(bg));
  const ok = value >= min;
  if (!ok) failed += 1;
  rows.push({ ok, value, min, label, fg, bg });
}

const width = Math.max(...rows.map((r) => r.label.length));
for (const r of rows) {
  const mark = r.ok ? 'ok  ' : 'BŁĄD';
  console.log(
    `${mark} ${r.label.padEnd(width)}  ${r.value.toFixed(2)}:1  (min ${r.min}:1)  --${r.fg} / --${r.bg}`,
  );
}

console.log(`\n${rows.length - failed}/${rows.length} par przechodzi.`);
if (failed > 0) {
  console.error(`Kontrast: ${failed} par poniżej progu.`);
  process.exit(1);
}
