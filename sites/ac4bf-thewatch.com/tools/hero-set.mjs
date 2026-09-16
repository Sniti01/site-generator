#!/usr/bin/env node
/**
 * Wstawia bohatera (`art`, `lead`, `primary`, `secondary`) do frontmattera
 * pliku treści — zaraz po `url:` (i po `era:`, gdy jest); zapis wierszy wprost.
 *
 *   node tools/hero-set.mjs <hero.json> [--dry-run]
 *   hero.json: { "file": "eivor.md", "art": "assassins-creed-valhalla-k00",
 *                "lead": ["wiersz 1", "wiersz 2"], "primary": { "href": "#kim-jest", "label": "…" },
 *                "secondary": { "href": "/assassins-creed-valhalla/", "label": "…" } }
 *   przykłady — docs/reports/2026-09-16-paczki-abc/narzedzia/hero-*.json
 *
 * `lead` idzie jako `>-` z wierszami po dwie spacje — łamanie z pliku
 * wejściowego, nie z narzędzia. `href` zaczynający się od `#` bierze
 * apostrofy (YAML: kotwica bez nich to komentarz). Drukuje liczbę znaków
 * bez spacji (lead + podpisy przycisków) — do korytarza strony.
 *
 * Co sprawdza, zanim napisze: plik CRLF bez gołych LF (i po prawce); we
 * frontmatterze nie ma jeszcze żadnego z czterech pól; plik kadru istnieje
 * w `src/assets/gry/` albo `foto/`; jest wiersz `url:`. `--dry-run` — to samo
 * bez zapisu. Narzędzie prawienia, nie sędzia (backlog 50 p. 11).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const heroPath = args.find((a) => !a.startsWith('--'));
if (!heroPath) throw new Error('podaj hero.json');

const h = JSON.parse(readFileSync(heroPath, 'utf8'));
const path = join(root, 'src/content/tresc', h.file);
const raw = readFileSync(path, 'utf8');
if ((raw.match(/(?<!\r)\n/g) || []).length) throw new Error(`${h.file}: gołe LF przed prawką — stop`);
const lines = raw.split('\r\n');
const fmEnd = lines.indexOf('---', 1);
if (fmEnd < 0) throw new Error(`${h.file}: brak końca frontmattera`);
const top = lines.slice(0, fmEnd);
for (const k of ['art', 'lead', 'primary', 'secondary']) {
  if (top.some((l) => l.startsWith(`${k}:`))) throw new Error(`${h.file}: pole już jest — ${k}`);
}
if (!existsSync(join(root, `src/assets/gry/${h.art}.jpg`)) && !existsSync(join(root, `src/assets/foto/${h.art}.jpg`))) {
  throw new Error(`${h.file}: brak pliku kadru ${h.art}`);
}
const urlIdx = lines.findIndex((l) => l.startsWith('url: '));
if (urlIdx < 0) throw new Error(`${h.file}: brak wiersza url:`);

const q = (s) => (s.startsWith('#') ? `'${s}'` : s);
const block = [
  `art: ${h.art}`,
  'lead: >-',
  ...h.lead.map((l) => `  ${l}`),
  'primary:',
  `  href: ${q(h.primary.href)}`,
  `  label: ${h.primary.label}`,
  'secondary:',
  `  href: ${q(h.secondary.href)}`,
  `  label: ${h.secondary.label}`,
];
const at = lines[urlIdx + 1]?.startsWith('era: ') ? urlIdx + 2 : urlIdx + 1;
lines.splice(at, 0, ...block);
const out = lines.join('\r\n');
if ((out.match(/(?<!\r)\n/g) || []).length) throw new Error(`${h.file}: gołe LF po prawce — stop`);
if (!dryRun) writeFileSync(path, out);

const bezSpacji = (s) => s.replace(/\s+/g, '').length;
const lead = h.lead.join(' ');
console.log(
  `${dryRun ? '(proba) ' : ''}${h.file}: bohater ${dryRun ? 'wszedłby' : 'wstawiony'} po wierszu ${at}; ` +
    `znaków bez spacji: ${bezSpacji(lead + h.primary.label + h.secondary.label)} (lead ${bezSpacji(lead)})`,
);
