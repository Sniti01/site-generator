// Сессия 20 (П102 «Как прочитано» п. 7): старые судьи на сборке main — КАК ЕСТЬ, только node, журналы ВНЕ
// репозитория (папка — первым аргументом). Сначала судьи без проб (читают dist/ и корпус), затем прогонщик проб
// пачки 5 (`docs/reports/2026-09-27-7thserpent-pachka-5/instrumenty/proby.mjs` как есть: пробы договора и разовые
// пробы пачек 1, 2, 4 со сверками и `--proba`). Порядок — коммит, сборка, пробы; пока идут пробы, репозиторий
// никто не читает. Каждый журнал начинается строкой «$ <команда>» и папкой, кончается кодом выхода.
//   node stare-sudi.mjs <папка журналов вне репозитория> <сборка>
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const koren = 'D:/SEO/cloud/site-generator';
const vyvod = process.argv[2];
const sborka = process.argv[3];
if (!vyvod || resolve(vyvod).toLowerCase().startsWith(resolve(koren).toLowerCase()) || !/^[0-9a-f]{7,40}$/.test(sborka ?? '')) {
  console.error('node stare-sudi.mjs <папка журналов ВНЕ репозитория> <сборка>');
  process.exit(2);
}
mkdirSync(vyvod, { recursive: true });
const sayt = join(koren, 'sites/7thserpent.com');
const R = 'docs/reports';
const SHAGI = [
  ['копия сторожа, 15 страниц', 'chuzhie-p5.txt', koren, [`${R}/2026-09-27-7thserpent-pachka-5/instrumenty/chuzhie-p5.mjs`, 'sites/7thserpent.com/dist']],
  ['копия сторожа, проба', 'chuzhie-p5-proba.txt', koren, [`${R}/2026-09-27-7thserpent-pachka-5/instrumenty/chuzhie-p5.mjs`, 'sites/7thserpent.com/dist', '--proba']],
  ['разбор реплик /quotes/', 'chuzhie-repliki.txt', koren, [`${R}/2026-09-27-7thserpent-pachka-4/instrumenty/chuzhie-repliki.mjs`, 'sites/7thserpent.com/dist']],
  ['разбор реплик, проба', 'chuzhie-repliki-proba.txt', koren, [`${R}/2026-09-27-7thserpent-pachka-4/instrumenty/chuzhie-repliki.mjs`, 'sites/7thserpent.com/dist', '--proba']],
  ['разбор глав гайда', 'chuzhie-glavy.txt', koren, [`${R}/2026-09-27-7thserpent-dogovor-p5/instrumenty/chuzhie-glavy.mjs`, 'sites/7thserpent.com/dist']],
  ['разбор глав, проба', 'chuzhie-glavy-proba.txt', koren, [`${R}/2026-09-27-7thserpent-dogovor-p5/instrumenty/chuzhie-glavy.mjs`, 'sites/7thserpent.com/dist', '--proba']],
  ['срез окончаний, 15 страниц', 'srez-okonchaniy.txt', koren, [`${R}/2026-09-27-7thserpent-pachka-5/instrumenty/srez-okonchaniy-15.mjs`, 'sites/7thserpent.com/dist', sborka]],
  ['glowa', 'glowa.txt', sayt, ['tools/glowa.mjs']],
  ['glowa, самопроверка', 'glowa-selftest.txt', sayt, ['tools/glowa.mjs', '--selftest']],
  ['сторож брифов', 'brief-check.txt', sayt, ['tools/brief-strony.mjs', '--check']],
  ['сторож брифов, самопроверка', 'brief-selftest.txt', sayt, ['tools/brief-strony.mjs', '--selftest']],
  ['сверка знака', 'znak-check.txt', sayt, ['tools/znak.mjs', '--check']],
  ['сверка знака и dist/', 'znak-check-dist.txt', sayt, ['tools/znak.mjs', '--check', '--dist']],
  ['сверка знака, самопроверка', 'znak-selftest.txt', sayt, ['tools/znak.mjs', '--selftest']],
  ['пробы (прогонщик пачки 5)', 'proby-progon.txt', koren, [`${R}/2026-09-27-7thserpent-pachka-5/instrumenty/proby.mjs`, join(vyvod, 'proby')]],
];
const itog = [`сборка ${sborka}; HEAD ${spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: koren, encoding: 'utf8' }).stdout.trim()}`];
for (const [imya, fajl, papka, args] of SHAGI) {
  const r = spawnSync(process.execPath, args, { cwd: papka, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const tekst = `$ node ${args.join(' ')}\n(папка: ${papka})\n\n${r.stdout ?? ''}${r.stderr ?? ''}\nкод выхода: ${r.status}\n`;
  writeFileSync(join(vyvod, fajl), tekst.replace(/\r/g, ''));
  itog.push(`${imya.padEnd(32)} код ${r.status}`);
  console.log(`${imya}: код ${r.status}`);
}
writeFileSync(join(vyvod, 'itog.txt'), itog.join('\n') + '\n');
