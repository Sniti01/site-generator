// Мутационное испытание сверки proby-p2.mjs (раунд 2, форма линзы «сверка»): у каждого zam.push
// в sverka и sverkaKartinki — своя мутанта (замечание не пишется); прогон --proba по dist/ сайта.
// Мутанта выживает, если проба сверки остаётся полной. Мутанты — в .astro/mut сайта (игнорируется git).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = 'D:/SEO/cloud/site-generator/docs/reports/2026-09-26-7thserpent-pachka-2/instrumenty/proby-p2.mjs';
const DIR = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/.astro/mut';
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });
const t = readFileSync(SRC, 'utf8');
const L = t.split('\n');
const oblasti = ['function sverkaKartinki(', 'function sverka('].map((imya) => {
  const a = L.findIndex((l) => l.startsWith(imya));
  const b = L.findIndex((l, i) => i > a && l === '}');
  return [a, b];
});
const run = (f) => spawnSync('node', [f, '--proba'], { encoding: 'utf8', cwd: 'D:/SEO/cloud/site-generator/sites/7thserpent.com' });
const base = run(SRC);
console.log('исход:', base.stdout.trim().split('\n').pop());
let vyzhilo = 0, vsego = 0;
for (const [a, b] of oblasti) for (let i = a; i < b; i++) {
  const l = L[i];
  const idx = [];
  let p = -1; while ((p = l.indexOf('zam.push(', p + 1)) >= 0) idx.push(p);
  for (const k of idx) {
    vsego++;
    const M = [...L];
    M[i] = l.slice(0, k) + '((..._x) => 0)(' + l.slice(k + 'zam.push('.length);
    const f = `${DIR}/m${i + 1}_${k}.mjs`;
    writeFileSync(f, M.join('\n'));
    const r = run(f);
    const lines = r.stdout.split('\n');
    const upali = lines.filter((x) => x.startsWith('ПЛОХО')).map((x) => x.slice(6, 46).trim());
    const itog = lines.filter((x) => x.startsWith('проба сверки')).pop() ?? ('КОД ' + r.status + ' ' + r.stderr.slice(0, 200));
    const msg = (l.slice(k).match(/zam\.push\((\.\.\.[a-zA-Z]+|[`'][^`']{0,60})/) || [])[1];
    if (!upali.length) vyzhilo++;
    console.log(`${upali.length ? 'убита    ' : 'ВЫЖИЛА   '} стр ${i + 1} «${msg}» — ${itog}${upali.length ? ' — ловят: ' + upali.join('; ').slice(0, 160) : ''}`);
  }
}
console.log(`мутант: ${vsego}, выжило ${vyzhilo}`);
rmSync(DIR, { recursive: true, force: true });
