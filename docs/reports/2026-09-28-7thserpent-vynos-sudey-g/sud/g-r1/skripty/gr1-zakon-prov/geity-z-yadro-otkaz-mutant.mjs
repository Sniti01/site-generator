#!/usr/bin/env node
/**
 * ГЕЙТЫ САЙТА — то, что зовёт `npm run gates` (а `npm run build` — до `astro build`): четыре гейта
 * ядра (`core/gates/run.mjs`: контраст, токены, ресурсы, структура) и сверка знака без браузера
 * (`tools/znak.mjs --check`: краски — токены темы, гарнитура — тема, иконки `public/` — то, что пишет
 * инструмент; П84 п. 2, П104 блок Г). Идут оба до конца, даже когда первый отказал (как гейты ядра
 * между собой: поправлять обычно надо всё разом); отказ любого — код 1, и сборка не идёт.
 *
 * Новый гейт ИСТОЧНИКОВ ядра приходит в `core/gates/run.mjs`, гейт этого сайта — сюда. Сторожа
 * РЕЗУЛЬТАТА (читают `dist/`) — интеграции в `astro.config.mjs`, среди них сверка иконок `dist/`
 * (`znak.mjs`, прежний режим `--dist`). Реестр — `docs/11_PRIEMKA.md`.
 *
 *   node tools/geity.mjs
 */
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAYT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GEITY = [
  ['гейты ядра', ['C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/gr1/gr1-zakon-prov/z-yadro-otkaz.mjs']],
  ['знак', ['C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/gr1/gr1-zakon-prov/z-znak-otkaz.mjs']],
];

const otkazali = [];
for (const [imya, argi] of GEITY) {
  const r = spawnSync(process.execPath, argi, { cwd: SAYT, stdio: 'inherit' });
  if (r.status !== 0) otkazali.push(`${imya} (код ${r.status ?? r.signal})`);
  if (otkazali.length) break;
  console.log('');
}
if (otkazali.length) {
  console.error(`Гейты сайта: не прошли — ${otkazali.join(', ')}. Сборка не идёт.`);
  process.exit(1);
}
console.log(`Гейты сайта: ${GEITY.length}/${GEITY.length} прошли (гейты ядра, знак).`);
