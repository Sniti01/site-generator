// Пробы сверки dist/ инструмента proby-p1.mjs: копия сборки портится одним местом — сверка
// обязана сказать ПЛОХО (код 1). Только скретчпад.
import { cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const SRC = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/dist';
const TOOL = 'D:/SEO/cloud/site-generator/docs/reports/2026-09-25-7thserpent-pachka-1/instrumenty/proby-p1.mjs';
const BASE = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/c00f4415-8064-4efa-8550-0b1a8618a4c3/scratchpad/proba-dist';
const porcha = [
  ['nota-snyata', 'media', (h) => h.replace(/<p class="ft__art-note[^"]*"[^>]*>[\s\S]*?<\/p>/, '')],
  ['nota-na-pc', 'pc', (h) => h.replace('<div class="ft__legal', '<p>Games: Max Payne.</p><div class="ft__legal')],
  ['cta-snyat', 'pc', (h) => h.replace(/<section class="cta"[\s\S]*?<\/section>/, '')],
  ['cta-href', 'games-like-max-payne', (h) => h.replace(/(cta__btn[^>]*href=")[^"]*"|(href=")\/max-payne-1\/("[^>]*cta__btn)/, (m, a, b, c) => (a ? a + '/remake/"' : b + '/remake/' + c))],
  ['cta-ne-posledniy', 'media', (h) => { const s = h.match(/<section class="cta"[\s\S]*?<\/section>/)[0]; return h.replace(s, '').replace(/(<section class="layer)/, s + '$1'); }],
  ['kadr-snyat', 'media', (h) => h.replace(/<div class="foto kadr-ryadu"[\s\S]*?<\/div>/, '')],
];
let vse = true;
for (const [imya, str, f] of porcha) {
  const d = join(BASE, imya);
  rmSync(d, { recursive: true, force: true });
  cpSync(SRC, d, { recursive: true });
  const p = join(d, str, 'index.html');
  const h = readFileSync(p, 'utf8');
  const h2 = f(h);
  if (h2 === h) { console.log(`${imya}: порча не применилась — проба не судится`); vse = false; continue; }
  writeFileSync(p, h2);
  const r = spawnSync('node', [TOOL, '--tolko-dist', '--dist', d], { encoding: 'utf8' });
  const ok = r.status === 1;
  if (!ok) vse = false;
  console.log(`${ok ? 'ok   ' : 'ПЛОХО'} ${imya}: код ${r.status} — ${(r.stdout.split('\n').find((l) => /^\s{6}\S/.test(l)) || '').trim()}`);
}
console.log(vse ? 'сверка dist видит все порчи' : 'ЕСТЬ НЕ ПОЙМАННЫЕ');
process.exit(vse ? 0 : 1);
