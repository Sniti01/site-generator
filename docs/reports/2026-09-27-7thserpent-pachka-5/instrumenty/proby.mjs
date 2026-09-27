// Прогонщик проб пачки 5 (сессия 18, П98: «Пробы — только node tools/proby-tresci.mjs и копии через node, без npm run
// и без Ctrl+C; порядок — коммит, сборка, пробы; пока идут пробы — никто не читает репозиторий»). Запускает по очереди,
// только `node`, КАК ЕСТЬ: постоянные пробы договора `tools/proby-tresci.mjs` и замороженные разовые пробы пачек 1, 2
// и 4 со сверкой dist/ и пробами сверки (`--proba`). Во время проб журналы пишутся ВНЕ репозитория — в папку,
// названную первым аргументом (скретчпад); в папку материалов их копирует ведущий после окончания всех проб.
// После последней пробы — `git status --porcelain -- sites core`: пробы подменяют файлы сайта и обязаны вернуть их.
//   node proby.mjs <папка журналов вне репозитория>
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const zdes = dirname(fileURLToPath(import.meta.url));
const koren = resolve(zdes, '../../../..');
const vyvod = process.argv[2];
if (!vyvod || resolve(vyvod).toLowerCase().startsWith(koren.toLowerCase())) {
  console.error('node proby.mjs <папка журналов ВНЕ репозитория>');
  process.exit(2);
}
mkdirSync(vyvod, { recursive: true });
const sayt = join(koren, 'sites/7thserpent.com');
const R = 'docs/reports';
const SHAGI = [
  ['пробы договора (33)', 'proby-tresci.txt', sayt, ['tools/proby-tresci.mjs']],
  ['пробы пачки 1 Q1–Q9 и сверка', 'proby-p1.txt', koren, [`${R}/2026-09-25-7thserpent-pachka-1/instrumenty/proby-p1.mjs`]],
  ['пробы пачки 2 R1–R24 и сверка', 'proby-p2.txt', koren, [`${R}/2026-09-26-7thserpent-pachka-2/instrumenty/proby-p2.mjs`]],
  ['проба сверки пачки 2', 'proba-sverki-p2.txt', koren, [`${R}/2026-09-26-7thserpent-pachka-2/instrumenty/proby-p2.mjs`, '--proba']],
  ['пробы ветви gallery и сверка', 'proby-p4.txt', koren, [`${R}/2026-09-27-7thserpent-pachka-4/instrumenty/proby-p4.mjs`]],
  ['проба сверки ветви gallery', 'proba-sverki-p4.txt', koren, [`${R}/2026-09-27-7thserpent-pachka-4/instrumenty/proby-p4.mjs`, '--proba']],
];
const itog = [];
for (const [imya, fajl, papka, args] of SHAGI) {
  const r = spawnSync(process.execPath, args, { cwd: papka, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const tekst = `$ node ${args.join(' ')}\n(папка: ${papka.replace(/\\/g, '/')})\n\n${r.stdout ?? ''}${r.stderr ?? ''}\nкод выхода: ${r.status}\n`;
  writeFileSync(join(vyvod, fajl), tekst.replace(/\r/g, ''));
  const posled = (r.stdout ?? '').trim().split('\n').filter(Boolean).pop() ?? '';
  itog.push(`${imya.padEnd(31)} код ${r.status} — ${posled}`);
  console.log(`${imya}: код ${r.status}`);
}
const st = spawnSync('git', ['status', '--porcelain', '--', 'sites', 'core'], { cwd: koren, encoding: 'utf8' }).stdout.trim();
itog.push(st ? `после проб: sites или core ОТЛИЧАЮТСЯ от HEAD:\n${st}` : 'после проб: sites и core совпадают с HEAD');
writeFileSync(join(vyvod, 'proby-itog.txt'), itog.join('\n') + '\n');
console.log(itog[itog.length - 1]);
