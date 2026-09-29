// Приёмка сессии 23 (П108) без браузера — журналы в zamery/ папки материалов. Копия priemka.mjs сессии 22
// (docs/reports/2026-09-28-7thserpent-publikacija/instrumenty/): отличия — сборка main b8016eb; ждём, что против неё
// различаются ровно privacy/index.html, robots.txt и .htaccess, новых и пропавших файлов нет; адрес ящика на /privacy/ —
// правилом check-live (adres-proverka.mjs); список принятой сборки gates/sborka-prinyataya.json = `spisok` этой сборки
// с меткой из самого списка (побайтно). Только node, npm и git; порядок «коммит, сборка, пробы»: запускать на чистом
// дереве после коммита кода; пробы (proverki) — отдельно.
//   node priemka.mjs <dist второго сайта сборки main> <dist первого сайта сборки main> <журнал сборки первого сайта на старте>
// Код 0 — журналы записаны (вердикты — в журналах и в priemka-itog.txt).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const zdes = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(zdes, '../../../..');
const ZAMERY = resolve(zdes, '../zamery');
const MAIN = 'b8016eb';
const [mainSeven, mainAc4bf, startAc4bf] = process.argv.slice(2).map((p) => resolve(p ?? ''));
if (!existsSync(join(mainSeven, 'index.html')) || !existsSync(join(mainAc4bf, 'index.html')) || !existsSync(startAc4bf)) {
  console.error('node priemka.mjs <dist второго сайта сборки main> <dist первого сайта сборки main> <журнал сборки первого сайта на старте>');
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
/** Две сборки: только в A, только в B, различаются; `ozhidanie` — { tolkoB, raznye } ровно такими наборами. */
const sravnit = (imya, a, b, podpisA, ozhidanie = { tolkoB: [], raznye: [] }) => {
  const fa = faily(a);
  const fb = faily(b);
  const sa = new Set(fa);
  const sb = new Set(fb);
  const tolkoA = fa.filter((f) => !sb.has(f));
  const tolkoB = fb.filter((f) => !sa.has(f));
  const raznye = fa.filter((f) => sb.has(f) && !readFileSync(join(a, f)).equals(readFileSync(join(b, f))));
  const kakZhdali = !tolkoA.length && tolkoB.join() === [...ozhidanie.tolkoB].sort().join() && raznye.join() === [...ozhidanie.raznye].sort().join();
  zapisat(imya, [
    `A (${podpisA}): ${a} — файлов ${fa.length}`,
    `B (сессия): ${b} — файлов ${fb.length}`,
    `только в A: ${tolkoA.length}`, ...tolkoA.map((f) => `  ${f}`),
    `только в B: ${tolkoB.length}`, ...tolkoB.map((f) => `  ${f}`),
    `различаются: ${raznye.length}`, ...raznye.map((f) => `  ${f}`),
    `HTML в A: ${fa.filter((f) => f.endsWith('.html')).length}; побайтно равны в B: ${fa.filter((f) => f.endsWith('.html') && sb.has(f) && !raznye.includes(f)).length}`,
    `ждали: только в B — ${ozhidanie.tolkoB.join(', ') || '—'}; различаются — ${ozhidanie.raznye.join(', ') || '—'}; итог — ${kakZhdali ? 'как ждали' : 'НЕ КАК ЖДАЛИ'}`,
  ].join('\n'));
  itog.push(`${imya.padEnd(26)} ${kakZhdali ? 'как ждали' : 'НЕ КАК ЖДАЛИ'}: файлов ${fa.length}/${fb.length}, только в A ${tolkoA.length}, только в B ${tolkoB.length}, различаются ${raznye.length}`);
};
// Журнал сборки без времени, длительностей, ANSI и шапок запуска.
const bezVremeni = (t) => t
  .replace(/\x1b\[[0-9;]*m/g, '')
  .replace(/\r/g, '')
  .split('\n')
  .filter((s) => !/^\$ |^\(папка: |^код выхода: |^время: |^HEAD [0-9a-f]+$|^код \d+$|^--- stderr ---$|^> /.test(s))
  .map((s) => s.replace(/^\d\d:\d\d:\d\d\s*/, '').replace(/\(\+?\d+(\.\d+)?\s*m?s\)/g, '(<t>)').replace(/\b\d+(\.\d+)?\s*m?s\b/g, '<t>').trimEnd())
  .filter((s) => s !== '');

const SEVEN = join(REPO, 'sites/7thserpent.com');
zapusk('build', 'npm run build -w 7thserpent.com');
zapusk('check', 'npx astro check', SEVEN);
zapusk('accept', 'npm run accept', SEVEN);
zapusk('tree-check', 'npm run tree:check', SEVEN);
zapusk('brief-check', 'npm run brief:check', SEVEN);
sravnit('dist-protiv-main', mainSeven, join(SEVEN, 'dist'), `сборка main ${MAIN}`, { tolkoB: [], raznye: ['.htaccess', 'privacy/index.html', 'robots.txt'] });
zapusk('adres', `node "${join(zdes, 'adres-proverka.mjs')}" "${SEVEN}"`);
{
  // Список принятой сборки = spisok этой сборки с меткой самого списка, побайтно (вывод console.log — с переводом строки).
  const prinyatyi = readFileSync(join(SEVEN, 'gates/sborka-prinyataya.json'), 'utf8');
  const metka = JSON.parse(prinyatyi).sborka;
  const r = spawnSync(process.execPath, ['tools/storozha-vykladki.mjs', 'spisok', 'dist', metka], { cwd: SEVEN, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const ravny = r.status === 0 && r.stdout === prinyatyi;
  zapisat('spisok', [`метка списка: ${metka}`, `spisok dist ${metka}: код ${r.status}`, `gates/sborka-prinyataya.json = spisok этой сборки побайтно: ${ravny ? 'да' : 'НЕТ'}`, `файлов в списке: ${JSON.parse(prinyatyi).fajlov}`, r.stderr ?? ''].join('\n'));
  itog.push(`${'spisok'.padEnd(26)} список = сборка (${metka}): ${ravny ? 'да' : 'НЕТ'}`);
}
zapusk('build-ac4bf', 'npm run build -w ac4bf-thewatch.com');
sravnit('dist-ac4bf-protiv-main', mainAc4bf, join(REPO, 'sites/ac4bf-thewatch.com/dist'), `сборка main ${MAIN}`);
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
const protivMain = (...puti) => git('diff', '--name-status', MAIN, 'HEAD', '--', ...puti).stdout.trim();
const NI_BAJTA = [
  ['первый сайт', ['sites/ac4bf-thewatch.com']],
  ['ядро', ['core']],
  ['корень: package.json, package-lock.json, .gitattributes', ['package.json', 'package-lock.json', '.gitattributes']],
  ['deploy-ac4bf.yml', ['.github/workflows/deploy-ac4bf.yml']],
  ['зона Tailwind второго сайта (global.css)', ['sites/7thserpent.com/src/styles/global.css']],
  ['маршрут, схема, структура второго сайта', ['sites/7thserpent.com/src/pages', 'sites/7thserpent.com/src/content.config.ts', 'sites/7thserpent.com/structure']],
  ['прочие файлы содержания второго сайта (кроме privacy.md)', ['sites/7thserpent.com/src/content', ':(exclude)sites/7thserpent.com/src/content/tresc/privacy.md']],
  ['замороженные судьи второго сайта (sverka, znak, geity, gates/sverka, gates/head, gates/phrases)', ['sites/7thserpent.com/tools/sverka.mjs', 'sites/7thserpent.com/tools/znak.mjs', 'sites/7thserpent.com/tools/geity.mjs', 'sites/7thserpent.com/gates/sverka.mjs', 'sites/7thserpent.com/gates/head.mjs', 'sites/7thserpent.com/gates/phrases.mjs']],
  ['лист владельца сессии 22 и материалы прежних докладов', ['docs/reports/2026-09-28-7thserpent-publikacija', 'docs/reports/2026-09-28-7thserpent-publikacija.md']],
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
