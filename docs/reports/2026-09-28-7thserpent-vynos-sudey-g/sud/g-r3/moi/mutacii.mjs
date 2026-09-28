// Свои мутанты ветвей правки раунда 3 блока Г (последнего): znak.mjs подменяется в памяти крюком загрузчика
// (g/kryuk-znak.mjs), прогон — весь tools/testy/znak.test.mjs. Мутант обязан уронить хотя бы один тест; строка мутации
// в исходнике — ровно одна.
//   node gr3/moi/mutacii.mjs <журнал>
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const KRYUK = pathToFileURL(join(import.meta.dirname, '../../g/kryuk-znak.mjs')).href;
const ISHODNIK = readFileSync(join(SAYT, 'tools/znak.mjs'), 'utf8');
const MUTACII = [
  ['N1 K-1: «только под условием» не судится', '} else if (!naStranice.some((d) => d.naKorne)) {', '} else if (false) {'],
  ['N2 K-1: условие блока не переходит к детям', "obhod(u.children ?? [], uslovno || !(u.tip === 'at' && /^@layer\\b/i.test(p)));", 'obhod(u.children ?? [], uslovno);'],
  ['N3 K-1: любой селектор — корень', "const korenSelektor = (p) => { const s = p.split(',').map((x) => x.trim()); return s.every((x) => [':root', ':host', 'html'].includes(x)) && s.some((x) => x !== ':host'); };", 'const korenSelektor = () => true;'],
  ['N4 K-2: compile() без разрешателей Vite', 'shouldRewriteUrls: true, onDependency: () => {}, ...r });', 'shouldRewriteUrls: true, onDependency: () => {} });'],
  ['N5 K-2: одна попытка разрешения (без «только псевдонимы»)', 'for (const tolkoPsevdonimy of [true, false]) {', 'for (const tolkoPsevdonimy of [false]) {'],
  ['N6 K-2: окружение client вместо ssr', 'let s = await r(id, importer, tolkoPsevdonimy, true);', 'let s = await r(id, importer, tolkoPsevdonimy, false);'],
  ['N7 K-2: настройки сайта не доходят до разрешателя', 'const cfg = await vite.resolveConfig({ ...bezPlaginov, environments:', 'const cfg = await vite.resolveConfig({ environments:'],
  ['N8 конвейер: чужой плагин Vite не судится', ".filter((p) => !String(p?.name ?? '').startsWith('@tailwindcss/vite'));", '.filter(() => false);'],
  ['N9 конвейер: vite.css не судится', 'if (nastroyki.css && Object.keys(nastroyki.css).length) out.push(', 'if (false) out.push('],
  ['N10 конвейер: файл PostCSS не судится', 'if (f) { out.push(`PostCSS', 'if (false) { out.push(`PostCSS'],
  ['N11 конвейер: поле postcss не судится', "if (polya && typeof polya === 'object' && 'postcss' in polya) {", 'if (false) {'],
  ['N12 конвейер: поиск PostCSS только в корне Vite', 'if (dirname(d) === d) break;', 'break;'],
  ['N13 конвейер: paths tsconfig не судятся', 'if (tsconfig && /"paths"\\s*:/.test(tsconfig)) out.push(', 'if (false) out.push('],
  ['N14 K-3: родовое имя первым не судится', ' && !(e.length > 1 && RODOVYE.has(e[0].imya))', ''],
  ['N15 Z-1: var() не читается никогда', "if (razekranirovat(m[0]).toLowerCase() !== 'var') return false;", 'return false;'],
  ['N16 Z-1: var() читается всегда', 'if (!chitaetsya) return false;', ''],
  ['N17 Z-1: запас var() не читается', 'vn[2] !== undefined && spisokGarniturChitaetsya(vn[2], razreshit, glubina + 1);', 'vn[2] !== undefined;'],
  ['N18 Z-1: значение имени не читается', 'chitaetsya = znachenie !== undefined ? spisokGarniturChitaetsya(znachenie, razreshit, glubina + 1) :', 'chitaetsya = znachenie !== undefined ? true :'],
  ['N19 Z-1: без предела глубины', 'if (glubina > 8) return false;', ''],
  ['N20 Z-1: var() разрешается и по объявлениям под условием', 'const naKorne = new Map(obyavleniya.filter((d) => d.naKorne).map((d) => [d.imie, d.wartosc]));', 'const naKorne = new Map(obyavleniya.map((d) => [d.imie, d.wartosc]));'],
  ['N21 командой — снова await на верхнем уровне', "if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) zapusk();", "if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await zapusk();"],
];
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const out = [];
for (const [imya, iz, na] of MUTACII) {
  const n = ISHODNIK.split(iz).length - 1;
  if (n !== 1) { out.push(`== ${imya}: строка мутации встречается ${n} раз — не запускаю`); continue; }
  const r = spawnSync(process.execPath, ['--import', KRYUK, '--test', '--test-reporter=spec', 'tools/testy/znak.test.mjs'], {
    cwd: SAYT,
    encoding: 'utf8',
    env: { ...ENV, ZNAK_MUTACIYA: JSON.stringify({ imya, iz, na }), FORCE_COLOR: '0', NO_COLOR: '1' },
    maxBuffer: 64 * 1024 * 1024,
    timeout: 300000,
  });
  const v = `${r.stdout}${r.stderr}`;
  const l = v.split('\n');
  const k = l.findIndex((x) => /failing tests:/.test(x));
  const upali = l.slice(0, k < 0 ? l.length : k).filter((x) => /^\s*✖ /.test(x)).map((x) => x.trim());
  const itog = l.filter((x) => /^ℹ (tests|pass|fail)/.test(x)).join('; ');
  out.push(`== ${imya}: ${/ℹ fail 0\b/.test(v) ? 'НЕ упал ни один тест' : 'КРАСНЫЙ'} — ${itog}; код node ${r.status}`);
  out.push(upali.slice(0, 12).map((x) => `   ${x}`).join('\n'));
}
writeFileSync(process.argv[2], out.join('\n') + '\n');
console.log(out.filter((s) => s.startsWith('==')).join('\n'));
