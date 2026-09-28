// Красные (и зелёные) прогоны блока Б раунда 4 по перечню: [находка, файл теста]. Вывод — <папка>/<находка>.txt.
//   node krasnye-B.mjs <папка вывода> <находка> [<находка> ...]
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const S = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const T = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/testy';
const FAJLY = {
  'R4-B-K-4': `${T}/schet.test.mjs`,
  'R4-B-P-2': `${T}/schet.test.mjs`,
  'R4-B-Z-3': `${T}/schet.test.mjs`,
  'R4-B-Z-4': `${T}/schet.test.mjs`,
  'R4-B-K-5': `${T}/schet.test.mjs`,
  'R4-B-P-3': `${T}/schet.test.mjs`,
  'R4-B-K-2': `${T}/sravnenie.test.mjs`,
  'R4-B-P-4': `${T}/sravnenie.test.mjs`,
  'R4-B-K-3': `${T}/sravnenie.test.mjs`,
  'R4-B-Z-5': `${T}/sravnenie.test.mjs`,
  'R4-B-P-6': `${T}/sravnenie.test.mjs`,
  'R4-B-Z-8': `${T}/sravnenie.test.mjs`,
  'R4-B-Z-2': `${T}/uborka.test.mjs`,
};
const argi = process.argv.slice(2);
const zagolovok = (argi.find((a) => a.startsWith('--zagolovok=')) ?? '').slice('--zagolovok='.length);
const [papka, ...nahodki] = argi.filter((a) => !a.startsWith('--zagolovok='));
mkdirSync(papka, { recursive: true });
for (const n of nahodki) {
  const r = spawnSync(process.execPath, [join(S, 'testy.mjs'), join(S, 'ref/dist-7th-3b78f28'), FAJLY[n], `--test-name-pattern=^${n}[: ]`], { encoding: 'utf8' });
  writeFileSync(join(papka, `${n}.txt`), `${zagolovok ? `${zagolovok}\n` : ''}${r.stdout}${r.stderr}\nкод возврата: ${r.status}\n`);
  console.log(n, 'код', r.status);
}
