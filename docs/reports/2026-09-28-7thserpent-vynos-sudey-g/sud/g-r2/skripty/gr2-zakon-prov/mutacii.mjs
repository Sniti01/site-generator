// Мутанты ветвей 2f19988 в памяти: (1) весь znak.test.mjs под мутантом — сколько упало; (2) prov1.mjs под мутантом
// на случаях, где ветвь срабатывает, — меняется ли вердикт.  node mutacii.mjs <журнал>
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const KRYUK = pathToFileURL(join(import.meta.dirname, 'kryuk.mjs')).href;
const MUTACII = [
  { imya: 'K0 контроль', zameny: [], sluchai: [] },
  { imya: 'M1 ветвь «вывод не читается» снята', zameny: [{ iz: 'if (nechitaemo.length) bledy.push(', na: 'if (false) bledy.push(' }], sluchai: ['Z6'] },
  { imya: 'M2 грань без url() не судится', zameny: [{ iz: 'if (!adresa.length || !adresa.every(', na: 'if (!adresa.every(' }], sluchai: ['Z4/M2'] },
  { imya: 'M3 root null — сканер пуст', zameny: [{ iz: "c.root === null ? [{ base: siteRoot, pattern: '**/*', negated: false }]", na: 'c.root === null ? []' }], sluchai: ['Z2'] },
  { imya: "M4 root 'none' — сканер по корню", zameny: [{ iz: "c.root === 'none' ? []", na: "c.root === 'none' ? [{ base: siteRoot, pattern: '**/*', negated: false }]" }], sluchai: ['Z5'] },
  { imya: 'M5 обход граней — только верхний уровень', zameny: [{ iz: '            obojti(u.children ?? []);', na: '            void 0;' }], sluchai: ['Z4/M5'] },
  { imya: 'M7 без кандидатов (контроль красноты)', zameny: [{ iz: 'if (c.features & twNode.Features.Utilities) {', na: 'if (false) {' }], sluchai: [] },
  { imya: 'СВОЙ M9 CDO/CDC не судится вовсе', zameny: [{ iz: 'if (glub === 0 && /<!--|-->/.test(prelude))', na: 'if (false)' }], sluchai: [] },
];
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const out = [];
for (const m of MUTACII) {
  const env = { ...ENV, GR2P_MUT: m.zameny.length ? JSON.stringify(m) : '', FORCE_COLOR: '0', NO_COLOR: '1' };
  const r = spawnSync(process.execPath, ['--import', KRYUK, '--test', '--test-reporter=spec', 'tools/testy/znak.test.mjs'], { cwd: SAYT, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
  const v = `${r.stdout}${r.stderr}`;
  const chislo = (k) => (new RegExp(`ℹ ${k} (\\d+)`).exec(v) ?? [])[1];
  out.push(`== ${m.imya}: код ${r.status}; tests ${chislo('tests')}, pass ${chislo('pass')}, fail ${chislo('fail')}, todo ${chislo('todo')}`);
  const upali = [...new Set(v.split('\n').filter((l) => /^\s*✖ /.test(l)).map((l) => '   ' + l.trim()))];
  if (upali.length) out.push(upali.slice(0, 12).join('\n'));
  if (r.status !== 0 && !upali.length) out.push(v.slice(-1500));
  for (const f of m.sluchai) {
    const p = spawnSync(process.execPath, ['--import', KRYUK, join(import.meta.dirname, 'prov1.mjs'), f], { cwd: import.meta.dirname, encoding: 'utf8', env });
    out.push(`   под мутантом, случаи «${f}»:\n${`${p.stdout}${p.stderr}`.split('\n').map((l) => '     ' + l.slice(0, 220)).join('\n')}`);
  }
}
writeFileSync(process.argv[2], out.join('\n') + '\n');
