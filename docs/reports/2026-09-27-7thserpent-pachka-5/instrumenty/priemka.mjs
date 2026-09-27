// Прогонщик приёмки пачки 5 (сессия 18, П98, «Приёмка») — без браузера и без проб: по команде на журнал
// в zamery/, каждый журнал начинается строкой «$ <команда>» и папкой, кончается кодом выхода; сводка кодов —
// zamery/priemka-itog.txt. Пробы (tools/proby-tresci.mjs и разовые пробы пачек 1, 2, 4) сюда не входят:
// их порядок — коммит, сборка, пробы, и пока они идут, репозиторий никто не читает (запускаются отдельно).
// Сам прогонщик пишет журналы в папку материалов — дерево после него грязное; перенормализацию и окончания
// снимать после коммита журналов, на чистом дереве (факт доклада доработки П96, раздел 8 п. 3).
// Байты CR в выводе (astro check печатает их под Windows) срезаются при записи — журналы в docs/ живут в LF
// (инвариант 1); число срезанных CR пишется последней строкой журнала.
//   node priemka.mjs <сборка>          — <сборка>: хеш коммита, с которого собран dist/
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const sborka = process.argv[2];
if (!/^[0-9a-f]{7,40}$/.test(sborka ?? '')) {
  console.error('node priemka.mjs <хеш сборки>');
  process.exit(2);
}
const zdes = dirname(fileURLToPath(import.meta.url));
const koren = join(zdes, '../../../..');
const sayt = join(koren, 'sites/7thserpent.com');
const zamery = join(zdes, '../zamery');
const R = 'docs/reports';
const TRESC = ['gameplay', 'max-payne-3-guide', 'movie'].map((s) => `sites/7thserpent.com/src/content/tresc/${s}.md`);
const SHAGI = [
  ['сборка (гейты и сторожа)', 'priemka-build.txt', sayt, 'npm', ['run', 'build']],
  ['astro check', 'priemka-check.txt', sayt, 'npm', ['run', 'check']],
  ['accept', 'priemka-accept.txt', sayt, 'npm', ['run', 'accept']],
  ['tree:check', 'priemka-tree-check.txt', sayt, 'npm', ['run', 'tree:check']],
  ['glowa', 'priemka-glowa.txt', sayt, 'npm', ['run', 'glowa']],
  ['brief:check', 'priemka-brief-check.txt', sayt, 'npm', ['run', 'brief:check']],
  ['слой утилит', 'sloy-utilit.txt', koren, 'node', [`${R}/2026-09-25-7thserpent-pachka-1/instrumenty/sloy.mjs`, 'sites/7thserpent.com/dist']],
  ['внешние загрузки статически', 'vneshnie-staticheski.txt', koren, 'node', [`${R}/2026-09-25-7thserpent-pachka-1/instrumenty/vneshnie.mjs`, 'sites/7thserpent.com/dist']],
  ['чужие 8 слов, 15 страниц', 'chuzhie.txt', koren, 'node', [`${R}/2026-09-27-7thserpent-pachka-5/instrumenty/chuzhie-p5.mjs`, 'sites/7thserpent.com/dist']],
  ['чужие 8 слов, проба', 'chuzhie-proba.txt', koren, 'node', [`${R}/2026-09-27-7thserpent-pachka-5/instrumenty/chuzhie-p5.mjs`, 'sites/7thserpent.com/dist', '--proba']],
  ['разбор реплик /quotes/', 'chuzhie-repliki.txt', koren, 'node', [`${R}/2026-09-27-7thserpent-pachka-4/instrumenty/chuzhie-repliki.mjs`, 'sites/7thserpent.com/dist']],
  ['разбор реплик, проба', 'chuzhie-repliki-proba.txt', koren, 'node', [`${R}/2026-09-27-7thserpent-pachka-4/instrumenty/chuzhie-repliki.mjs`, 'sites/7thserpent.com/dist', '--proba']],
  ['срез окончаний, 15 страниц', 'chuzhie-srez-okonchaniy.txt', koren, 'node', [`${R}/2026-09-27-7thserpent-pachka-5/instrumenty/srez-okonchaniy-15.mjs`, 'sites/7thserpent.com/dist', sborka]],
  ['детектор, исходники сессии', 'detektor-ishodniki.txt', koren, 'node', ['.claude/skills/impeccable/scripts/detect.mjs', '--json', ...TRESC]],
  ['детектор, сборка', 'detektor-dist.txt', koren, 'node', ['.claude/skills/impeccable/scripts/detect.mjs', '--json', 'sites/7thserpent.com/dist']],
  ['ни байта: ядро, первый сайт, корень', 'ni-bajta.txt', koren, 'git', ['diff', '--stat', 'main', '--', 'core', 'sites/ac4bf-thewatch.com', 'package.json', 'package-lock.json', '.gitattributes', '.gitignore']],
  ['копии против источников', 'kopii-otlichiya.txt', koren, 'node', [`${R}/2026-09-27-7thserpent-pachka-5/instrumenty/kopii-otlichiya.mjs`]],
];
const itog = [`HEAD ${spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: koren, encoding: 'utf8' }).stdout.trim()}; сборка ${sborka}`];
for (const [imya, fajl, papka, prog, args] of SHAGI) {
  const r = spawnSync(prog, args, { cwd: papka, encoding: 'utf8', shell: prog === 'npm', maxBuffer: 64 * 1024 * 1024 });
  const tekst = `$ ${prog} ${args.join(' ')}\n(папка: ${papka.replace(/\\/g, '/')})\n\n${r.stdout ?? ''}${r.stderr ?? ''}\nкод выхода: ${r.status}\n`;
  const cr = (tekst.match(/\r/g) ?? []).length;
  writeFileSync(join(zamery, fajl), tekst.replace(/\r/g, '') + (cr ? `(срезано байтов CR: ${cr})\n` : ''));
  itog.push(`${imya.padEnd(36)} код ${r.status}`);
  console.log(`${imya}: код ${r.status}`);
}
writeFileSync(join(zamery, 'priemka-itog.txt'), itog.join('\n') + '\n');
