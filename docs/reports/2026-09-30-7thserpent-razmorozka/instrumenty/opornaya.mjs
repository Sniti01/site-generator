// Опорная сборка сессии 25 (П113 «Как прочитано» п. 3): сборка второго сайта на коде main f22bb92, до правок кода.
//   node opornaya.mjs <папка копии dist вне репозитория>
// Сборка — npm run build -w 7thserpent.com из корня (гейты и сторожа), журнал — ../zamery/sborka-opornaya.txt (CR срезаны);
// счёт сторожей — строками журнала, как в сессии 24 (h1 18, anchors 18, links 670, коридоры 14 + 4 null, голова 18 стр.,
// сверка dist 17 стр., мастеров 0, 8 слов — 17 стр., чужих 0); dist/ копируется в папку аргумента (прежняя копия
// удаляется). Печать — код сборки, счёт, число файлов копии и sha256 её robots.txt. Порядок «коммит, сборка»: запускать
// на чистом дереве.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync, cpSync } from 'node:fs';
import { join, relative, dirname, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const zdes = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(zdes, '../../../..');
const ZAMERY = resolve(zdes, '../zamery');
const [kopiya] = process.argv.slice(2);
if (!kopiya || !isAbsolute(kopiya) || resolve(kopiya).startsWith(REPO)) {
  console.error('node opornaya.mjs <абсолютный путь копии dist вне репозитория>');
  process.exit(2);
}
const r = spawnSync('npm run build -w 7thserpent.com', { cwd: REPO, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
const zhurnal = `${r.stdout ?? ''}${r.stderr ?? ''}`.replace(/\r/g, '').replace(/\x1b\[[0-9;]*m/g, '');
writeFileSync(join(ZAMERY, 'sborka-opornaya.txt'), `$ npm run build -w 7thserpent.com\n(папка: .; коммит — опорный код f22bb92)\n\n${zhurnal}\nкод выхода: ${r.status}\n`);
const SCHET = [
  ['гейты сайта 2/2', /Гейты сайта: 2\/2 прошли/],
  ['h1 18', /h1: 18 stron, na każdej dokładnie jeden nagłówek/],
  ['anchors 18', /kotwice: 18 stron/],
  ['links 670', /linki: 18 stron, 670 linków wewnętrznych/],
  ['коридоры 14 + 4 null', /korytarz: 18 stron — w korytarzu 14, bez korytarza \(null w umowie\) 4/],
  ['голова 18 стр.', /glowa: 18 стр\./],
  ['сверка dist 17 стр.', /сверка dist: страниц маршрута 17/],
  ['мастеров в сборке 0', /утечка мастеров: исходных картинок \d+ \(src\), в сборке ни одной/],
  ['8 слов — 17 стр., чужих 0', /8 слов: страниц 17,.*чужих 8-грамм вне исключений — 0/],
  ['сборка завершена', /Complete!/],
];
console.log(`сборка: код ${r.status}`);
for (const [imya, re] of SCHET) console.log(`${re.test(zhurnal) ? 'ok   ' : 'НЕТ  '} ${imya}`);
const dist = join(REPO, 'sites/7thserpent.com/dist');
if (r.status !== 0 || !existsSync(join(dist, 'index.html'))) process.exit(1);
if (existsSync(kopiya)) rmSync(kopiya, { recursive: true, force: true });
cpSync(dist, kopiya, { recursive: true });
const faily = [];
const obhod = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) obhod(join(d, e.name));
    else faily.push(relative(kopiya, join(d, e.name)));
  }
};
obhod(kopiya);
const robots = readFileSync(join(kopiya, 'robots.txt'));
console.log(`копия: ${kopiya} — файлов ${faily.length}; robots.txt ${robots.length} байт, sha256 ${createHash('sha256').update(robots).digest('hex')}`);
