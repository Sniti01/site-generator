// Приёмка сессии 21 (П104) без браузера — журналы в zamery/ папки материалов. Только node, npm и git; порядок «коммит,
// сборка, пробы»: запускать на чистом дереве после коммита кода; пробы (proverki) — отдельно, после этой сборки.
//   node priemka.mjs <dist второго сайта сборки 3b78f28> <dist первого сайта сборки main> <журнал сборки первого сайта на старте>
// Что делает: сборка второго сайта (гейты и сторожа), astro check, accept, tree:check, brief:check; dist второго сайта против
// сборки 3b78f28 — состав и байты (слова владельца: «побайтно равен сборке 3b78f28»); сборка первого сайта, его dist против
// main и журнал сборки строка в строку против журнала на старте (без времени); git: первый сайт против main, ядро против
// начала ветки (5ed34b9) — меняются только файлы судей сессии 20; корень репозитория; окончания строк изменённых против main
// файлов и перенормализация. Код 0 — журналы записаны (вердикты — в журналах и в priemka-itog.txt).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const zdes = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(zdes, '../../../..');
const ZAMERY = resolve(zdes, '../zamery');
const NACHALO = '5ed34b9';
const [dist3b78f28, mainAc4bf, startAc4bf] = process.argv.slice(2).map((p) => resolve(p ?? ''));
if (!existsSync(join(dist3b78f28, 'index.html')) || !existsSync(join(mainAc4bf, 'index.html')) || !existsSync(startAc4bf)) {
  console.error('node priemka.mjs <dist второго сайта сборки 3b78f28> <dist первого сайта сборки main> <журнал сборки первого сайта на старте>');
  process.exit(2);
}
const itog = [];
const zapisat = (imya, tekst) => writeFileSync(join(ZAMERY, `priemka-${imya}.txt`), tekst.endsWith('\n') ? tekst : `${tekst}\n`);
const zapusk = (imya, komanda, cwd = REPO) => {
  const r = spawnSync(komanda, { cwd, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
  zapisat(imya, `$ ${komanda}\n(папка: ${relative(REPO, cwd).replace(/\\/g, '/') || '.'})\n\n${r.stdout ?? ''}${r.stderr ?? ''}\nкод выхода: ${r.status}`);
  itog.push(`${imya.padEnd(26)} код ${r.status}`);
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
const sravnit = (imya, a, b, podpisA) => {
  const fa = faily(a);
  const fb = faily(b);
  const sa = new Set(fa);
  const sb = new Set(fb);
  const tolkoA = fa.filter((f) => !sb.has(f));
  const tolkoB = fb.filter((f) => !sa.has(f));
  const raznye = fa.filter((f) => sb.has(f) && !readFileSync(join(a, f)).equals(readFileSync(join(b, f))));
  zapisat(imya, [
    `A (${podpisA}): ${a} — файлов ${fa.length}`,
    `B (сессия): ${b} — файлов ${fb.length}`,
    `только в A: ${tolkoA.length}`, ...tolkoA.map((f) => `  ${f}`),
    `только в B: ${tolkoB.length}`, ...tolkoB.map((f) => `  ${f}`),
    `различаются: ${raznye.length}`, ...raznye.map((f) => `  ${f}`),
    `HTML в A: ${fa.filter((f) => f.endsWith('.html')).length}; равны в B: ${fa.filter((f) => f.endsWith('.html') && sb.has(f) && !raznye.includes(f)).length}`,
  ].join('\n'));
  const ravny = !tolkoA.length && !tolkoB.length && !raznye.length;
  itog.push(`${imya.padEnd(26)} ${ravny ? 'побайтно равны' : 'РАЗНЯТСЯ'}: файлов ${fa.length}/${fb.length}, только в A ${tolkoA.length}, только в B ${tolkoB.length}, различаются ${raznye.length}`);
};
// Журнал сборки без времени, длительностей, ANSI и шапки запуска (как zhurnal-bez-vremeni.mjs сессии 20).
const bezVremeni = (t) => t
  .replace(/\x1b\[[0-9;]*m/g, '')
  .replace(/\r/g, '')
  .split('\n')
  .filter((s) => !/^\$ |^\(папка: |^код выхода: |^время: /.test(s))
  .map((s) => s.replace(/^\d\d:\d\d:\d\d\s*/, '').replace(/\(\+?\d+(\.\d+)?\s*m?s\)/g, '(<t>)').replace(/\b\d+(\.\d+)?\s*m?s\b/g, '<t>').trimEnd())
  .filter((s) => s !== '');

const SEVEN = join(REPO, 'sites/7thserpent.com');
zapusk('build', 'npm run build -w 7thserpent.com');
zapusk('check', 'npx astro check', SEVEN);
zapusk('accept', 'npm run accept', SEVEN);
zapusk('tree-check', 'npm run tree:check', SEVEN);
zapusk('brief-check', 'npm run brief:check', SEVEN);
sravnit('dist-protiv-3b78f28', dist3b78f28, join(SEVEN, 'dist'), 'сборка 3b78f28');
zapusk('build-ac4bf', 'npm run build -w ac4bf-thewatch.com');
sravnit('dist-ac4bf-protiv-main', mainAc4bf, join(REPO, 'sites/ac4bf-thewatch.com/dist'), 'main');
{
  const a = bezVremeni(readFileSync(startAc4bf, 'utf8'));
  const b = bezVremeni(readFileSync(join(ZAMERY, 'priemka-build-ac4bf.txt'), 'utf8'));
  const raz = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) raz.push(`#${i}\n  A: ${a[i]}\n  B: ${b[i]}`);
  // Без порядка: оптимизация картинок Vite идёт параллельно, номер «(k/n)» снят.
  const bezNomera = (s) => s.replace(/\(\d+\/\d+\)$/, '(k/n)');
  const schet = (m) => m.reduce((k, s) => k.set(bezNomera(s), (k.get(bezNomera(s)) ?? 0) + 1), new Map());
  const [ka, kb] = [schet(a), schet(b)];
  const tolkoA = [...ka].filter(([s, c]) => (kb.get(s) ?? 0) < c).map(([s]) => s);
  const tolkoB = [...kb].filter(([s, c]) => (ka.get(s) ?? 0) < c).map(([s]) => s);
  // Гейты — до строки итога ядра «Bramki: …» включительно; нет её — громко, а не «0 различий».
  const geity = (m) => { const k = m.findIndex((s) => /^Bramki: /.test(s)); return k < 0 ? null : m.slice(0, k + 1); };
  const [ga, gb] = [geity(a), geity(b)];
  const razGeity = !ga || !gb ? 'граница гейтов не найдена' : ga.filter((s, i) => s !== gb[i]).length + Math.max(0, gb.length - ga.length);
  zapisat('build-ac4bf-sravnenie', [
    `A (старт): ${startAc4bf}`, `B (сессия): priemka-build-ac4bf.txt`,
    `строк: ${a.length} / ${b.length}`, `различий по порядку: ${raz.length}`, ...raz.slice(0, 15),
    `без порядка: только в A ${tolkoA.length}, только в B ${tolkoB.length}`, ...tolkoA.slice(0, 10).map((s) => `  A: ${s}`), ...tolkoB.slice(0, 10).map((s) => `  B: ${s}`),
    `гейты (до «Bramki: …» включительно): строк ${ga?.length ?? '—'} / ${gb?.length ?? '—'}, различий ${razGeity}`,
  ].join('\n'));
  itog.push(`${'build-ac4bf-sravnenie'.padEnd(26)} строк ${a.length}/${b.length}; без порядка — только в A ${tolkoA.length}, только в B ${tolkoB.length}; гейты — ${ga?.length ?? '—'}/${gb?.length ?? '—'} строк, различий ${razGeity}`);
}
// git — без оболочки.
const git = (...args) => spawnSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const pervyi = git('diff', '--stat', 'main', '--', 'sites/ac4bf-thewatch.com').stdout.trim();
// Файлы судей сессии 20 — то, что она добавила в core/text и core/gates (core/package.json с parse5 — не судья).
const sudi20 = new Set(git('diff', '--name-only', '--diff-filter=A', 'main', NACHALO, '--', 'core/text', 'core/gates').stdout.split('\n').filter(Boolean));
const yadro21 = git('diff', '--name-status', NACHALO, 'HEAD', '--', 'core').stdout.split('\n').filter(Boolean);
const chuzhieYadra = yadro21.filter((s) => !sudi20.has(s.split('\t').at(-1)) || !/^M\t/.test(s));
const koren = git('diff', '--name-status', NACHALO, 'HEAD', '--', 'package.json', 'package-lock.json', '.gitattributes').stdout.trim();
zapisat('ni-bajta', [
  '---- первый сайт против main (git diff --stat):', pervyi || '(пусто — ни байта)',
  `---- ядро: файлы судей сессии 20 (main..${NACHALO}): ${sudi20.size}`, ...[...sudi20].map((f) => `  ${f}`),
  `---- ядро в сессии 21 (${NACHALO}..HEAD, A — новый, M — изменён, D — удалён):`, ...(yadro21.length ? yadro21 : ['(пусто)']),
  `---- в ядре вне файлов судей сессии 20 или не правкой: ${chuzhieYadra.length}`, ...chuzhieYadra,
  `---- корень репозитория в сессии 21 (${NACHALO}..HEAD: package.json, package-lock.json, .gitattributes):`, koren || '(пусто)',
].join('\n'));
itog.push(`${'ni-bajta'.padEnd(26)} первый сайт: ${pervyi ? 'ЕСТЬ ИЗМЕНЕНИЯ' : 'ни байта'}; ядро в сессии 21 — файлов ${yadro21.length}, вне судей сессии 20 ${chuzhieYadra.length}`);
const izmeneny = git('diff', '--name-only', '--diff-filter=AM', 'main').stdout.split('\n').filter(Boolean);
// Окончания — по всем отслеживаемым, отбор изменённых — здесь: сотни путей аргументами переполняют командную строку Windows.
const nabor = new Set(izmeneny);
const vseEol = git('ls-files', '--eol');
if (vseEol.status !== 0 || vseEol.stdout === undefined) throw new Error(`git ls-files --eol: ${vseEol.error?.message ?? vseEol.stderr}`);
const eol = vseEol.stdout.split('\n').filter((s) => nabor.has(s.split('\t').at(-1)));
if (eol.length !== izmeneny.length) throw new Error(`окончания: строк ${eol.length}, изменённых файлов ${izmeneny.length}`);
const plohie = eol.filter((s) => !/^i\/(lf|none|-text)\s+w\/(lf|none|-text)\s/.test(s));
const renorm = git('add', '--renormalize', '.');
// Только отслеживаемые: перенормализация неотслеживаемых не касается, а журналы этой приёмки в zamery/ — неотслеживаемые.
const status = git('status', '--short', '--untracked-files=no').stdout.trim();
zapisat('okonchaniya', [
  `изменённых и новых файлов против main: ${izmeneny.length}`, ...eol, '', `не LF (i/ или w/): ${plohie.length}`, ...plohie, '',
  `перенормализация (git add --renormalize .): код ${renorm.status}; git status --short после:`, status || '(пусто)',
].join('\n'));
itog.push(`${'okonchaniya'.padEnd(26)} файлов ${izmeneny.length}, не LF ${plohie.length}, после перенормализации ${status ? 'ЕСТЬ ИЗМЕНЕНИЯ' : 'дерево чистое'}`);
zapisat('itog', itog.join('\n'));
console.log(itog.join('\n'));
