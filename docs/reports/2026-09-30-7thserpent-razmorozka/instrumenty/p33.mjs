// П33 для сессии 25 (П113): «любая сессия печатает в отчёте результат npm run accept и npm run gates, оба с кодом
// возврата». Инструмент приёмки сессии (priemka.mjs, форма сессии 24) их не запускал — пропуск нашла сверка доклада
// перед коммитом. Здесь — только запуск и журналы, своих вердиктов нет (вердикты — у самих accept и gates): сборка
// второго сайта (npm run build -w 7thserpent.com: accept требует свежий dist/), затем npm run accept и npm run gates
// в папке сайта — как у priemka.mjs сессии 23. Только node, npm и git; порядок «коммит, сборка, пробы»: запускать
// после коммита этого файла, на чистых отслеживаемых файлах.
//   node p33.mjs
// Журналы — zamery/p33-build.txt, p33-accept.txt, p33-gates.txt; итог — zamery/p33-itog.txt. Код 0 — журналы записаны.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const zdes = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(zdes, '../../../..');
const ZAMERY = resolve(zdes, '../zamery');
const SAYT = join(REPO, 'sites/7thserpent.com');
mkdirSync(ZAMERY, { recursive: true });
const git = (...args) => spawnSync('git', args, { cwd: REPO, encoding: 'utf8' });
const kommit = git('rev-parse', '--short', 'HEAD').stdout.trim();
const gryaz = git('status', '--short', '--untracked-files=no').stdout.trim();
const itog = [`${'kommit'.padEnd(10)} ${kommit}; отслеживаемые файлы ${gryaz ? 'ИЗМЕНЕНЫ' : 'чистые'}`];
const zapisat = (imya, tekst) => writeFileSync(join(ZAMERY, `p33-${imya}.txt`), (tekst.endsWith('\n') ? tekst : `${tekst}\n`).replace(/\r/g, ''));
const zapusk = (imya, komanda, cwd = REPO) => {
  const r = spawnSync(komanda, { cwd, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
  const tekst = `${r.stdout ?? ''}${r.stderr ?? ''}`.replace(/\x1b\[[0-9;]*m/g, '');
  zapisat(imya, `$ ${komanda}\n(папка: ${relative(REPO, cwd).replace(/\\/g, '/') || '.'}; коммит ${kommit})\n\n${tekst}\nкод выхода: ${r.status}`);
  itog.push(`${imya.padEnd(10)} код ${r.status}`);
  return r;
};

if (gryaz) {
  itog.push(`отслеживаемые файлы изменены — не запускаю:\n${gryaz}`);
} else {
  zapusk('build', 'npm run build -w 7thserpent.com');
  zapusk('accept', 'npm run accept', SAYT);
  zapusk('gates', 'npm run gates', SAYT);
}
writeFileSync(join(ZAMERY, 'p33-itog.txt'), `${itog.join('\n')}\n`);
console.log(itog.join('\n'));
