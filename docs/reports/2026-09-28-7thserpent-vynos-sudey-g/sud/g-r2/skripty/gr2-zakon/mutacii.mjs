// Защита правки 2f19988 тестом: каждая новая ветвь tools/znak.mjs откатывается в памяти (крюк загрузчика), прогон —
// node --test tools/testy/znak.test.mjs (без сборки). Журнал — по мутации: сколько тестов упало и какие.
//   node mutacii.mjs <журнал> [имя мутации]
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const KRYUK = pathToFileURL(join(import.meta.dirname, 'kryuk.mjs')).href;
export const MUTACII = [
  { imya: 'K0 контроль (без мутации)', zameny: [] },
  { imya: 'M1 вывод Tailwind не читается — ветвь отказа снята', zameny: [{ iz: 'if (nechitaemo.length) bledy.push(', na: 'if (false) bledy.push(' }] },
  { imya: 'M2 своя @font-face на странице без url() — не судится', zameny: [{ iz: 'if (!adresa.length || !adresa.every(', na: 'if (!adresa.every(' }] },
  { imya: 'M3 root null (без source()) — сканер ничего не читает', zameny: [{ iz: "c.root === null ? [{ base: siteRoot, pattern: '**/*', negated: false }]", na: 'c.root === null ? []' }] },
  { imya: "M4 root 'none' (source(none)) — сканер читает корень сайта", zameny: [{ iz: "c.root === 'none' ? []", na: "c.root === 'none' ? [{ base: siteRoot, pattern: '**/*', negated: false }]" }] },
  { imya: 'M5 обход своей @font-face на странице — только верхний уровень', zameny: [{ iz: '            obojti(u.children ?? []);', na: '            void 0;' }] },
  { imya: 'M6 пропуск оракула без «среди операторов|импорт Бодони»', zameny: [{ iz: '|список|среди операторов|импорт Бодони))/', na: '|список))/' }] },
  { imya: 'M7 без кандидатов (контроль: ждём красный)', zameny: [{ iz: 'if (c.features & twNode.Features.Utilities) {', na: 'if (false) {' }] },
  { imya: 'M8 CDO/CDC судится и внутри блоков', zameny: [{ iz: 'if (glub === 0 && /<!--|-->/.test(prelude))', na: 'if (/<!--|-->/.test(prelude))' }] },
];
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tolko = process.argv[3];
  const { NODE_TEST_CONTEXT, ...ENV } = process.env;
  const out = [];
  for (const m of MUTACII.filter((x) => !tolko || x.imya.startsWith(tolko))) {
    const r = spawnSync(process.execPath, ['--import', KRYUK, '--test', '--test-reporter=spec', 'tools/testy/znak.test.mjs'], {
      cwd: SAYT,
      encoding: 'utf8',
      env: { ...ENV, GR2_MUT: JSON.stringify(m), FORCE_COLOR: '0', NO_COLOR: '1' },
      maxBuffer: 256 * 1024 * 1024,
    });
    const v = `${r.stdout}${r.stderr}`;
    const chislo = (k) => (new RegExp(`ℹ ${k} (\\d+)`).exec(v) ?? [])[1];
    const upali = v.split('\n').filter((l) => /^\s*✖ /.test(l)).map((l) => '   ' + l.trim());
    out.push(`== ${m.imya}: код ${r.status}; tests ${chislo('tests')}, pass ${chislo('pass')}, fail ${chislo('fail')}, todo ${chislo('todo')}`);
    if (upali.length) out.push([...new Set(upali)].slice(0, 20).join('\n'));
    if (r.status !== 0 && !upali.length) out.push(v.slice(-1500));
  }
  writeFileSync(process.argv[2], out.join('\n') + '\n');
  console.log(out.filter((s) => s.startsWith('==')).join('\n'));
}
