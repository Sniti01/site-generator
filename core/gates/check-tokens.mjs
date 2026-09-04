#!/usr/bin/env node
// Gate: każdy literalny rozmiar pisma należy do jednej z ról typograficznych,
// a każdy literalny odstęp stoi na stopniu skali. Reguła bez sprawdzenia żyje
// do pierwszego spieszącego się wykonawcy — więc reguła ma tu swoje sprawdzenie.
//
// Skanowane są dwa katalogi: `src/` witryny i cały pakiet `core/`. Drugi jest
// tu dlatego, że komponent wyniesiony do rdzenia wypada spod bramki witryny,
// z której wyszedł, i przestaje być liczony — a wyniesienie nie może być
// sposobem na obejście skali. Role i skalę czyta się przy tym z global.css
// **witryny**: komponent rdzenia ma mieścić się w skali każdej witryny,
// która go używa, więc liczy się osobno dla każdej z nich.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const coreRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = dirname(coreRoot);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(astro|css)$/.test(entry)) out.push(full);
  }
  return out;
}

export default function checkTokens(siteRoot) {
  const globalCss = readFileSync(join(siteRoot, 'src/styles/global.css'), 'utf8');

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

  // `base` decyduje tylko o tym, jak wygląda ścieżka w komunikacie: pliki
  // witryny jako `src/...`, pliki rdzenia jako `core/...`.
  const areas = [
    { name: 'src/', dir: join(siteRoot, 'src'), base: siteRoot },
    { name: 'core/', dir: coreRoot, base: repoRoot },
  ];

  const problems = [];
  const counts = [];
  let scanned = 0;

  for (const area of areas) {
    const files = walk(area.dir);
    counts.push(`${files.length} w ${area.name}`);
    scanned += files.length;

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const rel = relative(area.base, file).replace(/\\/g, '/');
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
  }

  if (problems.length) {
    for (const problem of problems) console.error(problem);
    console.error(`\nTokeny: ${problems.length} naruszeń.`);
    return false;
  }

  console.log(
    `Tokeny: ${scanned} plików (${counts.join(' + ')}), wszystkie rozmiary w rolach, wszystkie odstępy na skali.`,
  );
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ok = checkTokens(process.argv[2] ? resolve(process.argv[2]) : process.cwd());
  if (!ok) process.exit(1);
}
