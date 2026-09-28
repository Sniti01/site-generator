// Приёмка сессии 20 (П102) без браузера — журналы в zamery/ папки материалов. Только node и npm; порядок «коммит, сборка,
// пробы»: запускать на чистом дереве после коммита кода; пробы (proverki) — отдельно, после этой сборки.
//   node priemka.mjs <копия dist второго сайта с main> <копия dist первого сайта с main>
// Что делает: сборка второго сайта (гейты и сторожа), astro check, accept, tree:check, brief:check; dist второго сайта против
// сборки main — состав и байты; сборка первого сайта и его dist против main; git: первый сайт и ядро против main; окончания
// строк изменённых файлов и перенормализация. Код 0 — журналы записаны (вердикты читаются из журналов и из itog.txt).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const zdes = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(zdes, '../../../..');
const ZAMERY = resolve(zdes, '../zamery');
const [mainSeven, mainAc4bf] = process.argv.slice(2).map((p) => resolve(p ?? ''));
if (!existsSync(join(mainSeven, 'index.html')) || !existsSync(join(mainAc4bf, 'index.html'))) {
  console.error('node priemka.mjs <копия dist второго сайта с main> <копия dist первого сайта с main>');
  process.exit(2);
}
const itog = [];
const zapusk = (imya, komanda, cwd = REPO) => {
  const r = spawnSync(komanda, { cwd, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
  writeFileSync(join(ZAMERY, `priemka-${imya}.txt`), `$ ${komanda}\n(папка: ${relative(REPO, cwd) || '.'})\n\n${r.stdout ?? ''}${r.stderr ?? ''}\nкод выхода: ${r.status}\n`);
  itog.push(`${imya.padEnd(22)} код ${r.status}`);
  return r;
};
const faily = (koren) => {
  const out = [];
  const obhod = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) obhod(join(d, e.name));
      else out.push(relative(koren, join(d, e.name)).replace(/\\/g, '/'));
    }
  };
  obhod(koren);
  return out.sort();
};
const sravnit = (imya, a, b) => {
  const fa = faily(a);
  const fb = faily(b);
  const sa = new Set(fa);
  const sb = new Set(fb);
  const tolkoA = fa.filter((f) => !sb.has(f));
  const tolkoB = fb.filter((f) => !sa.has(f));
  const raznye = fa.filter((f) => sb.has(f) && !readFileSync(join(a, f)).equals(readFileSync(join(b, f))));
  const bajt = tolkoA.reduce((n, f) => n + readFileSync(join(a, f)).length, 0);
  const tekst = [
    `A (main): ${a} — файлов ${fa.length}`,
    `B (сессия): ${b} — файлов ${fb.length}`,
    `только в A: ${tolkoA.length} (${bajt} байт)`,
    ...tolkoA.map((f) => `  ${f}`),
    `только в B: ${tolkoB.length}`,
    ...tolkoB.map((f) => `  ${f}`),
    `различаются: ${raznye.length}`,
    ...raznye.map((f) => `  ${f}`),
    `HTML в A: ${fa.filter((f) => f.endsWith('.html')).length}; равны в B: ${fa.filter((f) => f.endsWith('.html') && sb.has(f) && !raznye.includes(f)).length}`,
  ].join('\n');
  writeFileSync(join(ZAMERY, `priemka-${imya}.txt`), tekst + '\n');
  itog.push(`${imya.padEnd(22)} только в main ${tolkoA.length}, только в сессии ${tolkoB.length}, различаются ${raznye.length}`);
};

const SEVEN = join(REPO, 'sites/7thserpent.com');
zapusk('build', 'npm run build -w 7thserpent.com');
zapusk('check', 'npx astro check', SEVEN);
zapusk('accept', 'npm run accept', SEVEN);
zapusk('tree-check', 'npm run tree:check', SEVEN);
zapusk('brief-check', 'npm run brief:check', SEVEN);
sravnit('dist-protiv-main', mainSeven, join(SEVEN, 'dist'));
zapusk('build-ac4bf', 'npm run build -w ac4bf-thewatch.com');
sravnit('dist-ac4bf-protiv-main', mainAc4bf, join(REPO, 'sites/ac4bf-thewatch.com/dist'));
// git — без оболочки.
const git = (...args) => spawnSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const niBajta = [
  '---- первый сайт против main (git diff --stat):',
  git('diff', '--stat', 'main', '--', 'sites/ac4bf-thewatch.com').stdout.trim() || '(пусто — ни байта)',
  '---- ядро против main (A — новый файл, M — изменён):',
  git('diff', '--name-status', 'main', '--', 'core').stdout.trim(),
  '---- корень репозитория против main (package.json, package-lock.json, .gitattributes):',
  git('diff', '--name-status', 'main', '--', 'package.json', 'package-lock.json', '.gitattributes').stdout.trim() || '(пусто)',
].join('\n');
writeFileSync(join(ZAMERY, 'priemka-ni-bajta.txt'), niBajta + '\n');
itog.push(`${'ni-bajta'.padEnd(22)} первый сайт: ${git('diff', '--stat', 'main', '--', 'sites/ac4bf-thewatch.com').stdout.trim() ? 'ЕСТЬ ИЗМЕНЕНИЯ' : 'ни байта'}`);
const izmeneny = git('diff', '--name-only', '--diff-filter=AM', 'main').stdout.split('\n').filter(Boolean);
const eol = git('ls-files', '--eol', '--', ...izmeneny).stdout.trim().split('\n');
const plohie = eol.filter((s) => !/^i\/(lf|none|-text)\s+w\/(lf|none|-text)\s/.test(s));
const renorm = git('add', '--renormalize', '.');
// Только отслеживаемые: перенормализация неотслеживаемых не касается, а журналы этой приёмки в zamery/ — неотслеживаемые.
const status = git('status', '--short', '--untracked-files=no').stdout.trim();
writeFileSync(
  join(ZAMERY, 'priemka-okonchaniya.txt'),
  [`изменённых и новых файлов против main: ${izmeneny.length}`, ...eol, '', `не LF (i/ или w/): ${plohie.length}`, ...plohie, '', `перенормализация (git add --renormalize .): код ${renorm.status}; git status --short после:`, status || '(пусто)'].join('\n') + '\n'
);
itog.push(`${'okonchaniya'.padEnd(22)} файлов ${izmeneny.length}, не LF ${plohie.length}, после перенормализации ${status ? 'ЕСТЬ ИЗМЕНЕНИЯ' : 'дерево чистое'}`);
writeFileSync(join(ZAMERY, 'priemka-itog.txt'), itog.join('\n') + '\n');
console.log(itog.join('\n'));
