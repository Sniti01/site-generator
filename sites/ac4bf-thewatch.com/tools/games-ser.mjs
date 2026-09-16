#!/usr/bin/env node
/**
 * Serializator `src/data/games.json` W STYLU PLIKU — żeby narzędzie prawiące
 * rejestr (`zrzuty-add.mjs`) zapisało go tak, jak leży w git, a diff pokazał
 * tylko dopisane wpisy. `JSON.stringify(…, null, 2)` rozrzuciłby każdą
 * jednowierszową krotkę na siedem linii i diff byłby o wszystkim.
 *
 *   node tools/games-ser.mjs src/data/games.json   — próba round-trip: czy plik
 *                                                    wychodzi z serializatora bajt w bajt
 *   import { serialize, check } from './games-ser.mjs'
 *
 * Styl (zmierzony na pliku, 2026-09-16): CRLF; `_` i `hero` — jak stringify;
 * gra bez `zrzuty` — jedną linią `{ "k": v, … }`; gra ze `zrzuty` — wielowierszowo,
 * a każdy element `zrzuty` — jedną linią; pola po `games` — po jednym w wierszu.
 * Każde narzędzie, które pisze tym serializatorem, najpierw sprawdza round-trip
 * na pliku wejściowym i STAJE przy różnicy — inaczej zapis przepisałby styl
 * całego pliku (backlog 50 p. 11; z `docs/reports/2026-09-16-paczki-abc/narzedzia/`).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const compact = (o) => `{ ${Object.entries(o).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ')} }`;

export function serialize(m) {
  const L = ['{'];
  L.push(`  "_": ${JSON.stringify(m._)},`);
  L.push('  "hero": {');
  const hk = Object.entries(m.hero);
  hk.forEach(([k, v], i) => L.push(`    ${JSON.stringify(k)}: ${JSON.stringify(v)}${i < hk.length - 1 ? ',' : ''}`));
  L.push('  },');
  L.push('  "games": [');
  m.games.forEach((g, gi) => {
    const last = gi === m.games.length - 1;
    const hasZ = Array.isArray(g.zrzuty) && g.zrzuty.length;
    if (g.slot && !hasZ) {
      L.push(`    ${compact(g)}${last ? '' : ','}`);
      return;
    }
    L.push('    {');
    const keys = Object.entries(g);
    keys.forEach(([k, v], ki) => {
      const comma = ki < keys.length - 1 ? ',' : '';
      if (k === 'zrzuty') {
        L.push('      "zrzuty": [');
        v.forEach((z, zi) => L.push(`        ${compact(z)}${zi < v.length - 1 ? ',' : ''}`));
        L.push(`      ]${comma}`);
      } else {
        L.push(`      ${JSON.stringify(k)}: ${JSON.stringify(v)}${comma}`);
      }
    });
    L.push(`    }${last ? '' : ','}`);
  });
  L.push('  ],');
  const rest = Object.entries(m).filter(([k]) => !['_', 'hero', 'games'].includes(k));
  rest.forEach(([k, v], i) => L.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)}${i < rest.length - 1 ? ',' : ''}`));
  L.push('}');
  return `${L.join('\r\n')}\r\n`;
}

/** Round-trip pliku: `equal` — serializator odtwarza go bajt w bajt. */
export function check(path) {
  const raw = readFileSync(path, 'utf8');
  const re = serialize(JSON.parse(raw));
  return { equal: re === raw, raw, re };
}

// Uruchomiony wprost (nie zaimportowany) — próba na podanym pliku.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && process.argv[2]) {
  const r = check(process.argv[2]);
  console.log(`round-trip ${process.argv[2]}: ${r.equal ? 'ok' : 'ZLE'}`);
  if (!r.equal) {
    const a = r.raw.split('\r\n');
    const b = r.re.split('\r\n');
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      if (a[i] !== b[i]) {
        console.log(`linia ${i + 1}\n  plik: ${a[i]}\n  ser:  ${b[i]}`);
        break;
      }
    }
    process.exit(1);
  }
}
