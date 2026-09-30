// Сборка шага сессии 25 со сторожами и сверкой с опорной: node sborka-shag.mjs <имя журнала> <dist опорной сборки>
// Сборка — npm run build -w 7thserpent.com из корня (гейты и сторожа), журнал — ../zamery/<имя>.txt (CR и цвета срезаны);
// счёт сторожей — как у opornaya.mjs (сессия 24); сверка dist/ с опорной копией — только в одной, различаются; ждём ровно
// одно различие — robots.txt, равный телу сервера (sha256 d1a2779c…8bb3, замер П113). Печать и журнал ../zamery/<имя>-dist.txt.
// Порядок «коммит, сборка»: запускать на чистом дереве.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const zdes = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(zdes, '../../../..');
const ZAMERY = resolve(zdes, '../zamery');
const SHA_SERVERA = 'd1a2779c345a3e8466362d2adc8f783df61d70c735ba21108a15d6b7618d8bb3';
const [imya, opornaya] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(imya ?? '') || !opornaya || !existsSync(join(opornaya, 'index.html'))) {
  console.error('node sborka-shag.mjs <имя журнала: латиница, цифры, дефис> <dist опорной сборки>');
  process.exit(2);
}
mkdirSync(ZAMERY, { recursive: true });
const r = spawnSync('npm run build -w 7thserpent.com', { cwd: REPO, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
const zhurnal = `${r.stdout ?? ''}${r.stderr ?? ''}`.replace(/\r/g, '').replace(/\x1b\[[0-9;]*m/g, '');
const kommit = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).stdout.trim();
const chisto = spawnSync('git', ['status', '--short', '--untracked-files=no'], { cwd: REPO, encoding: 'utf8' }).stdout.trim();
writeFileSync(join(ZAMERY, `${imya}.txt`), `$ npm run build -w 7thserpent.com\n(папка: .; коммит ${kommit}; отслеживаемые файлы ${chisto ? 'ИЗМЕНЕНЫ' : 'чистые'})\n\n${zhurnal}\nкод выхода: ${r.status}\n`);
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
const stroki = [`сборка: код ${r.status}; коммит ${kommit}; отслеживаемые файлы ${chisto ? 'ИЗМЕНЕНЫ' : 'чистые'}`];
for (const [i, re] of SCHET) stroki.push(`${re.test(zhurnal) ? 'ok   ' : 'НЕТ  '} ${i}`);
const dist = join(REPO, 'sites/7thserpent.com/dist');
const fajly = (koren) => {
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
if (r.status === 0 && existsSync(join(dist, 'index.html'))) {
  const [fa, fb] = [fajly(opornaya), fajly(dist)];
  const [sa, sb] = [new Set(fa), new Set(fb)];
  const tolkoA = fa.filter((f) => !sb.has(f));
  const tolkoB = fb.filter((f) => !sa.has(f));
  const raznye = fa.filter((f) => sb.has(f) && !readFileSync(join(opornaya, f)).equals(readFileSync(join(dist, f))));
  const robots = readFileSync(join(dist, 'robots.txt'));
  const shaR = createHash('sha256').update(robots).digest('hex');
  const kakZhdali = !tolkoA.length && !tolkoB.length && raznye.length === 1 && raznye[0] === 'robots.txt' && shaR === SHA_SERVERA;
  stroki.push(
    `dist против опорной: файлов ${fa.length}/${fb.length}; только в опорной ${tolkoA.length}${tolkoA.length ? ` (${tolkoA.join(', ')})` : ''}; только в итоговой ${tolkoB.length}${tolkoB.length ? ` (${tolkoB.join(', ')})` : ''}; различаются ${raznye.length}${raznye.length ? ` (${raznye.join(', ')})` : ''}`,
    `dist/robots.txt: ${robots.length} байт, sha256 ${shaR} — ${shaR === SHA_SERVERA ? 'равен телу сервера (замер П113)' : 'НЕ РАВЕН телу сервера'}`,
    `ждали — различается ровно robots.txt, равный телу сервера: ${kakZhdali ? 'да' : 'НЕТ'}`,
  );
}
writeFileSync(join(ZAMERY, `${imya}-dist.txt`), `${stroki.join('\n')}\n`);
console.log(stroki.join('\n'));
