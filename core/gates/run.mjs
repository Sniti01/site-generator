#!/usr/bin/env node
// Wejście do bramek: to jego woła `npm run build` witryny.
//
// Bramki idą wszystkie, nawet gdy pierwsza upadnie — `&&` w skrypcie npm
// pokazywał tylko pierwszą awarię, a poprawiać zwykle trzeba obie naraz.
// Regresją jest kod wyjścia ≠ 0; liczby w raportach zmieniają się legalnie
// (DECISIONS.md, wpis o przeprowadzce bramek).
//
// Nowa bramka dochodzi tutaj, do listy — nie do package.json każdej witryny.

import { resolve } from 'node:path';
import checkContrast from './check-contrast.mjs';
import checkTokens from './check-tokens.mjs';

const gates = [
  ['kontrast', checkContrast],
  ['tokeny', checkTokens],
];

const siteRoot = process.argv[2] ? resolve(process.argv[2]) : process.cwd();
const failed = [];

for (const [name, run] of gates) {
  const ok = await run(siteRoot);
  if (!ok) failed.push(name);
  console.log('');
}

if (failed.length > 0) {
  console.error(`Bramki: ${failed.join(', ')} — nie przechodzi. Budowanie przerwane.`);
  process.exit(1);
}

console.log(`Bramki: ${gates.length}/${gates.length} przechodzi.`);
