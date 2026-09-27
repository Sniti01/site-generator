// Окончания строк сессии (инвариант 1): все файлы, изменённые против main, — `git ls-files --eol` (индекс и рабочее
// дерево, текст — LF, двоичные — «-text» с i/-text), плюс перенормализация, как в пачке 5: на чистом дереве
// `git add --renormalize .`, затем число файлов, которые она добавила в индекс (`git diff --cached --name-only`), —
// обязано быть 0. (`--dry-run` не годится: он печатает «add» для каждого отслеживаемого файла.) Пишет вывод в stdout.
//   node okonchaniya.mjs            — из корня репозитория, на чистом дереве
import { spawnSync } from 'node:child_process';

const git = (...a) => spawnSync('git', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).stdout;
const fajly = git('diff', '--name-only', 'main').split('\n').filter(Boolean);
const eol = git('ls-files', '--eol', '--', ...fajly).split('\n').filter(Boolean);
let tekst = 0, neLf = 0, dvoichnyh = 0;
for (const s of eol) {
  const [i, w] = s.split(/\s+/);
  if (i === 'i/-text') { dvoichnyh += 1; continue; }
  tekst += 1;
  if (i !== 'i/lf' || w !== 'w/lf') { neLf += 1; console.log('НЕ LF: ' + s); }
}
console.log(`изменено против main: ${fajly.length}; текстовых ${tekst}, не LF ${neLf}; двоичных ${dvoichnyh}`);
const doIndeksa = git('diff', '--cached', '--name-only').split('\n').filter(Boolean);
if (doIndeksa.length) { console.log('в индексе уже есть изменения — перенормализацию мерить на чистом индексе'); process.exit(2); }
git('add', '--renormalize', '.');
const pere = git('diff', '--cached', '--name-only').split('\n').filter(Boolean);
console.log(`перенормализация (git add --renormalize ., затем git diff --cached --name-only): файлов ${pere.length}`);
for (const s of pere) console.log('  ' + s);
process.exit(neLf || pere.length ? 1 : 0);
