#!/usr/bin/env node
/**
 * Stawia albo podmienia `art:` u rzędów pliku treści (`src/content/tresc/<plik>.md`)
 * — zapis wierszy wprost, bez cięcia po znaczniku (CLAUDE.md, inwariant 1).
 *
 *   node tools/art-set.mjs <plan.json> [--dry-run]
 *   plan.json: [{ "file": "assassins-creed-1.md", "rows": { "fabula": "jerozolima-k03", … } }, …]
 *   przykłady — docs/reports/2026-09-16-paczki-abc/narzedzia/plan-*.json
 *
 * Jak znajduje rząd: wiersz `  - id: <id>` we frontmatterze, dokładnie jeden;
 * blok rzędu — do następnego `  - id:`, pola na poziomie zero albo `---`.
 * Gdy rząd ma `art:` — podmiana w miejscu; gdy nie ma — wstawka po `meta:`
 * (albo po `title:`, gdy `meta` brak), za kontynuacją wielowierszowego pola.
 *
 * Co sprawdza, zanim napisze: plik CRLF bez gołych LF (i po prawce); rząd
 * znaleziony dokładnie raz; klucz kadru ma plik w `src/assets/gry/` albo
 * `src/assets/foto/` (`.jpg`). `--dry-run` — to samo bez zapisu. Narzędzie
 * prawienia, nie sędzia (backlog 50 p. 11).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const planPath = args.find((a) => !a.startsWith('--'));
if (!planPath) throw new Error('podaj plan.json');

const plan = JSON.parse(readFileSync(planPath, 'utf8'));
for (const p of plan) {
  const path = join(root, 'src/content/tresc', p.file);
  const raw = readFileSync(path, 'utf8');
  if ((raw.match(/(?<!\r)\n/g) || []).length) throw new Error(`${p.file}: gołe LF przed prawką — stop`);
  const lines = raw.split('\r\n');
  const zmiany = [];
  for (const [id, key] of Object.entries(p.rows)) {
    if (!existsSync(join(root, `src/assets/gry/${key}.jpg`)) && !existsSync(join(root, `src/assets/foto/${key}.jpg`))) {
      throw new Error(`${p.file}: brak pliku dla klucza ${key}`);
    }
    const starts = lines.map((l, i) => (l === `  - id: ${id}` ? i : -1)).filter((i) => i >= 0);
    if (starts.length !== 1) throw new Error(`${p.file}: rząd ${id} znaleziony ${starts.length} razy`);
    const s = starts[0];
    let e = s + 1;
    while (e < lines.length && !/^  - id: /.test(lines[e]) && !/^[a-z]/.test(lines[e]) && lines[e] !== '---') e += 1;
    const block = lines.slice(s, e);
    const artIdx = block.findIndex((l) => /^    art: /.test(l));
    if (artIdx >= 0) {
      zmiany.push(`${id}: ${block[artIdx].trim()} → art: ${key}`);
      lines[s + artIdx] = `    art: ${key}`;
    } else {
      let anchor = block.findIndex((l) => /^    meta: /.test(l));
      if (anchor < 0) anchor = block.findIndex((l) => /^    title: /.test(l));
      if (anchor < 0) throw new Error(`${p.file}: rząd ${id} bez meta/title`);
      // Pole może być wielowierszowe (`>-`): wstawka za kontynuacją, przed następnym polem.
      let ins = s + anchor + 1;
      while (ins < e && /^      /.test(lines[ins])) ins += 1;
      lines.splice(ins, 0, `    art: ${key}`);
      e += 1;
      zmiany.push(`${id}: + art: ${key}`);
    }
  }
  const out = lines.join('\r\n');
  if ((out.match(/(?<!\r)\n/g) || []).length) throw new Error(`${p.file}: gołe LF po prawce — stop`);
  if (!dryRun) writeFileSync(path, out);
  console.log(`${dryRun ? '(proba) ' : ''}${p.file}: ${zmiany.join('; ')}`);
}
