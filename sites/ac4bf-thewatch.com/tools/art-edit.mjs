#!/usr/bin/env node
/**
 * Prawi manifest zdjęć Commons `src/data/art.json` — sloty, które potem
 * pobiera `core/media/fetch-art.mjs`.
 *
 *   node tools/art-edit.mjs add <slots.json> [--dry-run]  — dopisuje sloty (po `id`; istniejący
 *                                                            dostaje pola z pliku, reszta zostaje)
 *   node tools/art-edit.mjs set <id> '<json>' [--dry-run] — scala pola w slot (file, crop, subject, author…)
 *   node tools/art-edit.mjs del <id> [--dry-run]
 *   przykłady — docs/reports/2026-09-16-paczki-abc/narzedzia/slots-*.json
 *
 * Styl pliku: `JSON.stringify(…, null, 2)` z CRLF i końcowym CRLF — narzędzie
 * sprawdza round-trip PRZED prawką i staje przy różnicy, żeby nie przepisać
 * stylu całego pliku; po prawce — brak gołych LF. `--dry-run` drukuje wynik
 * bez zapisu. Narzędzie prawienia, nie sędzia (backlog 50 p. 11).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const [cmd, a, b] = args.filter((x) => x !== '--dry-run');

const path = join(root, 'src/data/art.json');
const raw = readFileSync(path, 'utf8');
if ((raw.match(/(?<!\r)\n/g) || []).length) throw new Error('art.json: gołe LF przed prawką — stop');
const art = JSON.parse(raw);
const ser = (o) => `${JSON.stringify(o, null, 2).replace(/\n/g, '\r\n')}\r\n`;
if (ser(art) !== raw) throw new Error('art.json: styl pliku to nie stringify(…, 2) + CRLF — stop');

if (cmd === 'add') {
  const slots = JSON.parse(readFileSync(a, 'utf8'));
  for (const s of slots) {
    const i = art.slots.findIndex((x) => x.id === s.id);
    if (i >= 0) {
      art.slots[i] = { ...art.slots[i], ...s };
      console.log(`scalony    ${s.id}`);
    } else {
      art.slots.push(s);
      console.log(`dopisany   ${s.id}`);
    }
  }
} else if (cmd === 'set') {
  const s = art.slots.find((x) => x.id === a);
  if (!s) throw new Error(`brak slotu ${a}`);
  const patch = JSON.parse(b);
  Object.assign(s, patch);
  console.log(`ustawione  ${a}: ${Object.keys(patch).join(', ')}`);
} else if (cmd === 'del') {
  const i = art.slots.findIndex((x) => x.id === a);
  if (i < 0) throw new Error(`brak slotu ${a}`);
  art.slots.splice(i, 1);
  console.log(`usuniety   ${a}`);
} else {
  throw new Error('add <slots.json> | set <id> <json> | del <id>');
}

const out = ser(art);
if ((out.match(/(?<!\r)\n/g) || []).length) throw new Error('gołe LF po prawce — stop');
if (dryRun) {
  console.log(`\nProba: art.json bez zapisu; slotow byloby ${art.slots.length}.`);
} else {
  writeFileSync(path, out);
  console.log(`\nart.json: slotow ${art.slots.length}.`);
}
