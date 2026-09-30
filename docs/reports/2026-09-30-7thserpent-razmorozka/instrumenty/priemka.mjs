// Приёмка сессии 25 (П113) без браузера — журналы в zamery/ папки материалов. Форма — priemka.mjs сессии 24
// (docs/reports/2026-09-29-7thserpent-zhivoy/instrumenty/): отличия — опорная сборка main f22bb92 (копия вне репозитория,
// снята до правок); ждём, что итоговая сборка отличается от неё ровно robots.txt, равным телу сервера (sha256 замера П113);
// счёт сторожей сборки — как в сессии 24 (гейты 2/2, h1 18, anchors 18, links 670, коридоры 14 + 4 null, голова 18 стр., сверка
// dist 17 стр., мастеров 0, 8 слов — 17 стр., чужих 0); «без изменений» — пустой git diff f22bb92 по путям; в public/ меняется
// ровно robots.txt, в tools/ — ровно названные файлы (П113 «Как прочитано» п. 15). Сборки первого сайта нет — его файлов
// сессия не касается. Только node, npm и git; порядок «коммит, сборка, пробы»: запускать на чистом дереве после коммита;
// пробы (proverki) — отдельно.
//   node priemka.mjs <dist опорной сборки второго сайта>
// Код 0 — журналы записаны (вердикты — в журналах и в priemka-itog.txt).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const zdes = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(zdes, '../../../..');
const ZAMERY = resolve(zdes, '../zamery');
const MAIN = 'f22bb92';
const SHA_SERVERA = 'd1a2779c345a3e8466362d2adc8f783df61d70c735ba21108a15d6b7618d8bb3';
const [opornaya] = process.argv.slice(2).map((p) => resolve(p ?? ''));
if (!existsSync(join(opornaya, 'index.html'))) {
  console.error('node priemka.mjs <dist опорной сборки второго сайта>');
  process.exit(2);
}
mkdirSync(ZAMERY, { recursive: true });
const itog = [];
const zapisat = (imya, tekst) => writeFileSync(join(ZAMERY, `priemka-${imya}.txt`), (tekst.endsWith('\n') ? tekst : `${tekst}\n`).replace(/\r/g, ''));
const git = (...args) => spawnSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const kommit = git('rev-parse', '--short', 'HEAD').stdout.trim();
const gryaz = git('status', '--short', '--untracked-files=no').stdout.trim();
itog.push(`${'kommit'.padEnd(26)} ${kommit}; отслеживаемые файлы ${gryaz ? 'ИЗМЕНЕНЫ' : 'чистые'}`);

// Сборка и счёт сторожей.
const sborka = spawnSync('npm run build -w 7thserpent.com', { cwd: REPO, shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
const t = `${sborka.stdout ?? ''}${sborka.stderr ?? ''}`.replace(/\x1b\[[0-9;]*m/g, '');
zapisat('build', `$ npm run build -w 7thserpent.com\n(папка: .; коммит ${kommit})\n\n${t}\nкод выхода: ${sborka.status}`);
itog.push(`${'build'.padEnd(26)} код ${sborka.status}`);
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
const vseSchet = SCHET.every(([, re]) => re.test(t));
zapisat('schet', ['счёт сторожей сборки против сессии 24 (журнал priemka-build.txt):', ...SCHET.map(([imya, re]) => `${re.test(t) ? 'ok   ' : 'НЕТ  '} ${imya}`), `итог: ${vseSchet ? 'как в сессии 24' : 'НЕ КАК В СЕССИИ 24'}`].join('\n'));
itog.push(`${'schet'.padEnd(26)} ${vseSchet ? 'как в сессии 24' : 'НЕ КАК В СЕССИИ 24'}`);

// dist против опорной: ровно robots.txt, равный телу сервера.
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
const dist = join(REPO, 'sites/7thserpent.com/dist');
{
  const [fa, fb] = [faily(opornaya), faily(dist)];
  const [sa, sb] = [new Set(fa), new Set(fb)];
  const tolkoA = fa.filter((f) => !sb.has(f));
  const tolkoB = fb.filter((f) => !sa.has(f));
  const raznye = fa.filter((f) => sb.has(f) && !readFileSync(join(opornaya, f)).equals(readFileSync(join(dist, f))));
  const robots = readFileSync(join(dist, 'robots.txt'));
  const shaR = createHash('sha256').update(robots).digest('hex');
  const kakZhdali = !tolkoA.length && !tolkoB.length && raznye.length === 1 && raznye[0] === 'robots.txt' && shaR === SHA_SERVERA;
  zapisat('dist-protiv-opornoy', [
    `A (опорная сборка ${MAIN}): ${opornaya} — файлов ${fa.length}`,
    `B (итоговая сборка сессии, ${kommit}): ${dist} — файлов ${fb.length}`,
    `только в A: ${tolkoA.length}`, ...tolkoA.map((f) => `  ${f}`),
    `только в B: ${tolkoB.length}`, ...tolkoB.map((f) => `  ${f}`),
    `различаются: ${raznye.length}`, ...raznye.map((f) => `  ${f}`),
    `dist/robots.txt: ${robots.length} байт, sha256 ${shaR} — ${shaR === SHA_SERVERA ? 'равен телу сервера (замер П113)' : 'НЕ РАВЕН телу сервера'}`,
    `ждали: различается ровно robots.txt, равный телу сервера — ${kakZhdali ? 'да' : 'НЕТ'}`,
  ].join('\n'));
  itog.push(`${'dist-protiv-opornoy'.padEnd(26)} ${kakZhdali ? 'ровно robots.txt = тело сервера' : 'ИНАЧЕ'}: файлов ${fa.length}/${fb.length}, только в A ${tolkoA.length}, только в B ${tolkoB.length}, различаются ${raznye.length}`);
}

// Ни байта против main и ожидаемые изменения.
const protivMain = (...puti) => git('diff', '--name-status', MAIN, 'HEAD', '--', ...puti).stdout.trim();
const S = 'sites/7thserpent.com';
const NI_BAJTA = [
  ['первый сайт', ['sites/ac4bf-thewatch.com']],
  ['ядро', ['core']],
  ['корень: package.json, package-lock.json, .gitattributes', ['package.json', 'package-lock.json', '.gitattributes']],
  ['workflow первого сайта (deploy-ac4bf.yml)', ['.github/workflows/deploy-ac4bf.yml']],
  ['зона Tailwind второго сайта (global.css)', [`${S}/src/styles/global.css`]],
  ['файлы сайта: src/, structure/, astro.config.mjs, package.json сайта', [`${S}/src`, `${S}/structure`, `${S}/astro.config.mjs`, `${S}/package.json`]],
  ['список принятой сборки и данные гейтов (gates/)', [`${S}/gates`]],
  ['замороженные судьи второго сайта (sverka, znak, geity)', [`${S}/tools/sverka.mjs`, `${S}/tools/znak.mjs`, `${S}/tools/geity.mjs`]],
  ['образец сессии 24 (obrazec-khostera.json)', [`${S}/tools/testy/obrazec-khostera.json`]],
  ['материалы прежних докладов (сессии 22–24)', ['docs/reports/2026-09-28-7thserpent-publikacija', 'docs/reports/2026-09-28-7thserpent-publikacija.md', 'docs/reports/2026-09-29-7thserpent-yashchik', 'docs/reports/2026-09-29-7thserpent-yashchik.md', 'docs/reports/2026-09-29-7thserpent-zhivoy', 'docs/reports/2026-09-29-7thserpent-zhivoy.md']],
];
const stroki = [];
for (const [imya, puti] of NI_BAJTA) {
  const d = protivMain(...puti);
  stroki.push(`---- ${imya} (${MAIN}..HEAD):`, d || '(пусто — ни байта)');
  itog.push(`${('ni-bajta: ' + imya).slice(0, 60).padEnd(26)} ${d ? 'ЕСТЬ ИЗМЕНЕНИЯ' : 'ни байта'}`);
}
// Ожидаемые изменения: public/ — ровно robots.txt; tools/ — ровно названные файлы (новый — образец владельца); workflow второго сайта.
const OZHIDAEMO = [
  ['public/ сайта — ровно robots.txt', [`${S}/public`], [`M\t${S}/public/robots.txt`]],
  ['tools/ сайта — ровно check-live, сторожа, их пробы и образец владельца', [`${S}/tools`], [`M\t${S}/tools/check-live.mjs`, `M\t${S}/tools/storozha-vykladki.mjs`, `M\t${S}/tools/testy/check-live.test.mjs`, `A\t${S}/tools/testy/obrazec-vladelca.json`, `M\t${S}/tools/testy/storozha-vykladki.test.mjs`]],
  ['workflow второго сайта — изменён (шаги 3–4)', ['.github/workflows/deploy-7thserpent.yml'], ['M\t.github/workflows/deploy-7thserpent.yml']],
];
for (const [imya, puti, zhdem] of OZHIDAEMO) {
  const d = protivMain(...puti).split('\n').filter(Boolean).sort();
  const ok = JSON.stringify(d) === JSON.stringify([...zhdem].sort());
  stroki.push(`---- ${imya} (${MAIN}..HEAD):`, ...(d.length ? d : ['(пусто)']), `ждали: ${zhdem.join(' | ')} — ${ok ? 'да' : 'НЕТ'}`);
  itog.push(`${('ozhidaemo: ' + imya).slice(0, 60).padEnd(26)} ${ok ? 'как ждали' : 'ИНАЧЕ'}`);
}
stroki.push(`---- все изменения ветки (${MAIN}..HEAD):`, protivMain('.'));
zapisat('ni-bajta', stroki.join('\n'));

// Окончания: изменённые и новые файлы против main — LF; перенормализация — дерево чистое.
const izmeneny = git('diff', '--name-only', '--diff-filter=AM', MAIN).stdout.split('\n').filter(Boolean);
const nabor = new Set(izmeneny);
const vseEol = git('ls-files', '--eol');
if (vseEol.status !== 0 || vseEol.stdout === undefined) throw new Error(`git ls-files --eol: ${vseEol.error?.message ?? vseEol.stderr}`);
const eol = vseEol.stdout.split('\n').filter((s) => nabor.has(s.split('\t').at(-1)));
if (eol.length !== izmeneny.length) throw new Error(`окончания: строк ${eol.length}, изменённых файлов ${izmeneny.length}`);
const plohie = eol.filter((s) => !/^i\/(lf|none|-text)\s+w\/(lf|none|-text)\s/.test(s));
const renorm = git('add', '--renormalize', '.');
const status = git('status', '--short', '--untracked-files=no').stdout.trim();
zapisat('okonchaniya', [
  `изменённых и новых файлов против ${MAIN}: ${izmeneny.length}`, ...eol, '', `не LF (i/ или w/): ${plohie.length}`, ...plohie, '',
  `перенормализация (git add --renormalize .): код ${renorm.status}; git status --short после:`, status || '(пусто)',
].join('\n'));
itog.push(`${'okonchaniya'.padEnd(26)} файлов ${izmeneny.length}, не LF ${plohie.length}, после перенормализации ${status ? 'ЕСТЬ ИЗМЕНЕНИЯ' : 'дерево чистое'}`);
zapisat('itog', itog.join('\n'));
console.log(itog.join('\n'));
