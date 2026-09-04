#!/usr/bin/env node
// Gate: każdy literalny rozmiar pisma należy do jednej z ról typograficznych,
// a każdy literalny odstęp stoi na stopniu skali. Reguła bez sprawdzenia żyje
// do pierwszego spieszącego się wykonawcy — więc reguła ma tu swoje sprawdzenie.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(astro|css)$/.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(srcDir);
const globalCss = readFileSync(join(root, 'src/styles/global.css'), 'utf8');

// Role czytamy z global.css, żeby lista nie rozjechała się z arkuszem.
const roleSizes = new Set(['1.0625rem']); // rozmiar bazowy body
for (const block of globalCss.matchAll(/\.t-[a-z]+\s*\{([^}]*)\}/g)) {
  const size = block[1].match(/font-size:\s*([^;]+);/);
  if (size) roleSizes.add(size[1].trim());
}

// Stopnie skali odstępów, plus zero.
const scale = new Set(['0']);
for (const step of globalCss.matchAll(/--space-[a-z0-9]+:\s*(\d+)px;/g)) scale.add(`${step[1]}px`);

// Wartości konstrukcyjne, nie odstępy: wysokość kontrolki, włos, grubość obwódki.
const structuralAllow = new Set(['1px', '2px', '3px', '-1px']);

const spacingProps = /(?:^|[;{\s])(padding|margin|gap|row-gap|column-gap)(-(?:block|inline|top|right|bottom|left)(?:-(?:start|end))?)?:\s*([^;}]+)/g;

const problems = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const rel = relative(root, file).replace(/\\/g, '/');
  const lines = source.split('\n');

  lines.forEach((line, index) => {
    const where = `${rel}:${index + 1}`;

    const size = line.match(/font-size:\s*([^;]+);/);
    if (size) {
      const value = size[1].trim();
      if (!value.startsWith('var(') && !roleSizes.has(value)) {
        problems.push(`${where}  font-size: ${value} — poza rolami typograficznymi`);
      }
    }

    for (const match of line.matchAll(spacingProps)) {
      for (const value of match[3].trim().split(/\s+/)) {
        if (value.startsWith('var(') || value.startsWith('calc(') || value.startsWith('clamp(')) continue;
        if (value === 'auto' || value === 'inherit' || value === 'initial') continue;
        if (!/^-?\d+(\.\d+)?px$/.test(value)) continue;
        if (scale.has(value) || structuralAllow.has(value)) continue;
        problems.push(`${where}  ${match[1]}: ${value} — poza skalą odstępów`);
      }
    }
  });
}

if (problems.length) {
  for (const problem of problems) console.error(problem);
  console.error(`\nTokeny: ${problems.length} naruszeń.`);
  process.exit(1);
}

console.log(`Tokeny: ${files.length} plików, wszystkie rozmiary w rolach, wszystkie odstępy na skali.`);
