#!/usr/bin/env node
/**
 * Dopisuje wpisy `zrzuty` do `src/data/games.json` — kadry Steam wybrane
 * z arkusza kandydatów (`fetch-game-art.mjs --kandydaci` → `input/kadry/<slot>/lista.json`).
 *
 *   node tools/zrzuty-add.mjs <picks.json> [--dry-run]
 *   picks.json: [{ "slot": "karaiby", "i": 3, "opis": "Edward na bukszprycie…" }, …]
 *   przykłady — docs/reports/2026-09-16-paczki-abc/narzedzia/picks-*.json
 *
 * Skąd `ss`: z `lista.json` slotu po indeksie `i` (adres pełnego kadru
 * w witrynie Steam — pobierze go potem `fetch-game-art.mjs`). Wpis już obecny
 * pod tym `i` — pomijany z komunikatem; lista `zrzuty` gry po dopisaniu
 * sortowana po `i`.
 *
 * Co sprawdza, zanim napisze: plik jest CRLF bez gołych LF; serializator
 * `games-ser.mjs` odtwarza plik bajt w bajt (inaczej zapis przepisałby styl
 * całego pliku — STOP); slot istnieje w rejestrze; kadr `i` jest na liście.
 * `--dry-run` — wszystko to samo bez zapisu. Narzędzie prawienia, nie sędzia
 * (backlog 50 p. 11): pisze rejestr wprost, bez cięcia po znaczniku.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { serialize } from './games-ser.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const picksPath = args.find((a) => !a.startsWith('--'));
if (!picksPath) throw new Error('podaj picks.json');

const path = join(root, 'src/data/games.json');
const raw = readFileSync(path, 'utf8');
if ((raw.match(/(?<!\r)\n/g) || []).length) throw new Error('games.json: gołe LF przed prawką — stop');
const m = JSON.parse(raw);
if (serialize(m) !== raw) throw new Error('games.json: serializator nie odtwarza pliku — stop (node tools/games-ser.mjs src/data/games.json)');

const picks = JSON.parse(readFileSync(picksPath, 'utf8'));
let dopisane = 0;
for (const p of picks) {
  const g = m.games.find((x) => (x.slot ?? x.era) === p.slot);
  if (!g) throw new Error(`brak slotu ${p.slot}`);
  const lista = JSON.parse(readFileSync(join(root, `input/kadry/${p.slot}/lista.json`), 'utf8'));
  const z = lista.zrzuty.find((x) => x.i === p.i);
  if (!z) throw new Error(`brak kadru [${p.i}] u ${p.slot}`);
  g.zrzuty ??= [];
  if (g.zrzuty.some((x) => x.i === p.i)) {
    console.log(`jest juz   ${p.slot} [${p.i}]`);
    continue;
  }
  g.zrzuty.push({ i: p.i, ss: z.ss, opis: p.opis });
  g.zrzuty.sort((a, b) => a.i - b.i);
  console.log(`dopisane   ${p.slot} [${p.i}] ${p.opis}`);
  dopisane += 1;
}
const out = serialize(m);
if ((out.match(/(?<!\r)\n/g) || []).length) throw new Error('gołe LF po prawce — stop');
if (dryRun) {
  console.log(`\nProba: games.json bez zapisu; dopisano by ${dopisane}.`);
} else {
  writeFileSync(path, out);
  console.log(`\ngames.json: dopisano ${dopisane}.`);
}
