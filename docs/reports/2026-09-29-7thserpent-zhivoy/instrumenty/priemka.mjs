// Приёмка сессии 24 (П111) без браузера — журналы в zamery/ папки материалов. Форма — priemka.mjs сессии 23
// (docs/reports/2026-09-29-7thserpent-yashchik/instrumenty/): отличия — опорная сборка main add241a (копия вне
// репозитория, снята до правок); ждём, что итоговая сборка равна ей побайтно (ни одного иного, нового или пропавшего
// файла); счёт сторожей сборки — как в сессии 23 (h1 18, anchors 18, коридоры 14 + 4 null, голова 18 стр., сверка dist
// 17 стр., 8 слов — 17 стр., чужих 0); сборки первого сайта нет — его файлов сессия не касается (П111 «Как прочитано»
// п. 9): «без изменений» — пустой git diff add241a по путям. Только node, npm и git; порядок «коммит, сборка, пробы»:
// запускать на чистом дереве после коммита; пробы (proverki) — отдельно.
//   node priemka.mjs <dist опорной сборки второго сайта>
// Код 0 — журналы записаны (вердикты — в журналах и в priemka-itog.txt).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const zdes = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(zdes, '../../../..');
const ZAMERY = resolve(zdes, '../zamery');
const MAIN = 'add241a';
const [opornaya] = process.argv.slice(2).map((p) => resolve(p ?? ''));
if (!existsSync(join(opornaya, 'index.html'))) {
  console.error('node priemka.mjs <dist опорной сборки второго сайта>');
  process.exit(2);
}
const itog = [];
const zapisat = (imya, tekst) => writeFileSync(join(ZAMERY, `priemka-${imya}.txt`), (tekst.endsWith('\n') ? tekst : `${tekst}\n`).replace(/\r/g, ''));
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
/** Две сборки: только в A, только в B, различаются; ждём — ничего. */
const sravnit = (imya, a, b, podpisA) => {
  const fa = faily(a);
  const fb = faily(b);
  const sa = new Set(fa);
  const sb = new Set(fb);
  const tolkoA = fa.filter((f) => !sb.has(f));
  const tolkoB = fb.filter((f) => !sa.has(f));
  const raznye = fa.filter((f) => sb.has(f) && !readFileSync(join(a, f)).equals(readFileSync(join(b, f))));
  const kakZhdali = !tolkoA.length && !tolkoB.length && !raznye.length;
  zapisat(imya, [
    `A (${podpisA}): ${a} — файлов ${fa.length}`,
    `B (итоговая сборка сессии): ${b} — файлов ${fb.length}`,
    `только в A: ${tolkoA.length}`, ...tolkoA.map((f) => `  ${f}`),
    `только в B: ${tolkoB.length}`, ...tolkoB.map((f) => `  ${f}`),
    `различаются: ${raznye.length}`, ...raznye.map((f) => `  ${f}`),
    `ждали: ни байта — ${kakZhdali ? 'да' : 'НЕТ'}`,
  ].join('\n'));
  itog.push(`${imya.padEnd(26)} ${kakZhdali ? 'ни байта' : 'ЕСТЬ РАЗЛИЧИЯ'}: файлов ${fa.length}/${fb.length}, только в A ${tolkoA.length}, только в B ${tolkoB.length}, различаются ${raznye.length}`);
};

const SEVEN = join(REPO, 'sites/7thserpent.com');
const sborka = zapusk('build', 'npm run build -w 7thserpent.com');
{
  // Счёт сторожей сборки — строками журнала, как в сессии 23.
  const t = `${sborka.stdout ?? ''}${sborka.stderr ?? ''}`.replace(/\x1b\[[0-9;]*m/g, '');
  const SCHET = [
    ['гейты сайта 2/2', /Гейты сайта: 2\/2 прошли/],
    ['h1 18', /h1: 18 stron, na każdej dokładnie jeden nagłówek/],
    ['anchors 18', /kotwice: 18 stron/],
    ['коридоры 14 + 4 null', /korytarz: 18 stron — w korytarzu 14, bez korytarza \(null w umowie\) 4/],
    ['голова 18 стр.', /glowa: 18 стр\./],
    ['сверка dist 17 стр.', /сверка dist: страниц маршрута 17/],
    ['мастеров в сборке 0', /утечка мастеров: исходных картинок \d+ \(src\), в сборке ни одной/],
    ['8 слов — 17 стр., чужих 0', /8 слов: страниц 17,.*чужих 8-грамм вне исключений — 0/],
    ['сборка завершена', /Complete!/],
  ];
  const stroki = SCHET.map(([imya, re]) => `${re.test(t) ? 'ok   ' : 'НЕТ  '} ${imya}`);
  const vse = SCHET.every(([, re]) => re.test(t));
  zapisat('schet', [`счёт сторожей сборки против сессии 23 (журнал priemka-build.txt):`, ...stroki, `итог: ${vse ? 'как в сессии 23' : 'НЕ КАК В СЕССИИ 23'}`].join('\n'));
  itog.push(`${'schet'.padEnd(26)} ${vse ? 'как в сессии 23' : 'НЕ КАК В СЕССИИ 23'}`);
}
sravnit('dist-protiv-opornoy', opornaya, join(SEVEN, 'dist'), `опорная сборка ${MAIN}`);

// git — без оболочки.
const git = (...args) => spawnSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const protivMain = (...puti) => git('diff', '--name-status', MAIN, 'HEAD', '--', ...puti).stdout.trim();
const NI_BAJTA = [
  ['первый сайт', ['sites/ac4bf-thewatch.com']],
  ['ядро', ['core']],
  ['корень: package.json, package-lock.json, .gitattributes', ['package.json', 'package-lock.json', '.gitattributes']],
  ['workflow: deploy-ac4bf.yml, deploy-7thserpent.yml', ['.github/workflows']],
  ['зона Tailwind второго сайта (global.css)', ['sites/7thserpent.com/src/styles/global.css']],
  ['файлы сайта: src/, public/, structure/, astro.config.mjs, package.json сайта', ['sites/7thserpent.com/src', 'sites/7thserpent.com/public', 'sites/7thserpent.com/structure', 'sites/7thserpent.com/astro.config.mjs', 'sites/7thserpent.com/package.json']],
  ['список принятой сборки и данные гейтов (gates/)', ['sites/7thserpent.com/gates']],
  ['check-live.mjs и сторожа выкладки', ['sites/7thserpent.com/tools/check-live.mjs', 'sites/7thserpent.com/tools/storozha-vykladki.mjs']],
  ['замороженные судьи второго сайта (sverka, znak, geity)', ['sites/7thserpent.com/tools/sverka.mjs', 'sites/7thserpent.com/tools/znak.mjs', 'sites/7thserpent.com/tools/geity.mjs']],
  ['материалы прежних докладов (сессии 22, 23)', ['docs/reports/2026-09-28-7thserpent-publikacija', 'docs/reports/2026-09-28-7thserpent-publikacija.md', 'docs/reports/2026-09-29-7thserpent-yashchik', 'docs/reports/2026-09-29-7thserpent-yashchik.md']],
];
const stroki = [];
for (const [imya, puti] of NI_BAJTA) {
  const d = protivMain(...puti);
  stroki.push(`---- ${imya} (${MAIN}..HEAD):`, d || '(пусто — ни байта)');
  itog.push(`${('ni-bajta: ' + imya).slice(0, 60).padEnd(26)} ${d ? 'ЕСТЬ ИЗМЕНЕНИЯ' : 'ни байта'}`);
}
stroki.push(`---- все изменения ветки (${MAIN}..HEAD):`, protivMain('.'));
zapisat('ni-bajta', stroki.join('\n'));
const izmeneny = git('diff', '--name-only', '--diff-filter=AM', MAIN).stdout.split('\n').filter(Boolean);
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
  `изменённых и новых файлов против ${MAIN}: ${izmeneny.length}`, ...eol, '', `не LF (i/ или w/): ${plohie.length}`, ...plohie, '',
  `перенормализация (git add --renormalize .): код ${renorm.status}; git status --short после:`, status || '(пусто)',
].join('\n'));
itog.push(`${'okonchaniya'.padEnd(26)} файлов ${izmeneny.length}, не LF ${plohie.length}, после перенормализации ${status ? 'ЕСТЬ ИЗМЕНЕНИЯ' : 'дерево чистое'}`);
zapisat('itog', itog.join('\n'));
console.log(itog.join('\n'));
