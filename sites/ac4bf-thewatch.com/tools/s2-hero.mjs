#!/usr/bin/env node
/**
 * Dopisuje stronie w `structure/pages-s2.json` blok bohatera:
 * `"блоки": [{ "block": "hero-key-art" }],` w wierszu przed `"related":` —
 * zapis tekstu wprost, w stylu pliku (LF, wcięcie wiersza `related`).
 *
 *   node tools/s2-hero.mjs <url> [--dry-run]
 *   node tools/s2-hero.mjs /assassins-creed-valhalla/eivor/
 *   (z Git Bash adres z wiodącym `/` przechodzi konwersję ścieżek MSYS —
 *   uruchamiać z PowerShell albo z `MSYS_NO_PATHCONV=1`)
 *
 * Po wstawce plik przechodzi `JSON.parse` (inaczej — wyjątek, bez zapisu);
 * potem `npm run tree` przenosi zmianę do `structure.json`. Co sprawdza:
 * plik jest LF (nie CRLF); adres istnieje; wpis ma `related`; wpis nie ma
 * jeszcze `hero-key-art`. `--dry-run` — to samo bez zapisu. Narzędzie
 * prawienia, nie sędzia (backlog 50 p. 11).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const u = args.find((a) => !a.startsWith('--'));
if (!u) throw new Error('podaj adres strony, np. /eivor/');

const path = join(root, 'structure/pages-s2.json');
let raw = readFileSync(path, 'utf8');
if (raw.includes('\r\n')) throw new Error('pages-s2.json: CRLF — plik struktury jest LF, stop');
const i = raw.indexOf(`"url": "${u}"`);
if (i < 0) throw new Error(`brak strony ${u}`);
const j = raw.indexOf('"related":', i);
const entryEnd = raw.indexOf('\n    }', i);
if (j < 0 || j > entryEnd) throw new Error(`strona ${u} bez related`);
if (raw.slice(i, entryEnd).includes('hero-key-art')) throw new Error(`strona ${u} już ma hero-key-art`);
const lineStart = raw.lastIndexOf('\n', j) + 1;
const indent = raw.slice(lineStart, j);
raw = `${raw.slice(0, lineStart)}${indent}"блоки": [{ "block": "hero-key-art" }],\n${raw.slice(lineStart)}`;
JSON.parse(raw);
if (!dryRun) writeFileSync(path, raw);
console.log(`${dryRun ? '(proba) ' : ''}pages-s2.json: blok hero-key-art u ${u}${dryRun ? ' — bez zapisu' : ''}`);
