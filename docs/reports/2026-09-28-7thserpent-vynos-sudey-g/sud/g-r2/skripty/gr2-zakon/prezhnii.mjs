// Те же законные правки (zakon1.mjs) на судье до раунда 1 (58c4896): был ли отказ до правки 2f19988.
//   node prezhnii.mjs > prezhnii.txt
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const TUT = import.meta.dirname;
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const r = spawnSync(process.execPath, ['--import', pathToFileURL(join(TUT, 'kryuk.mjs')).href, join(TUT, 'zakon1.mjs')], {
  cwd: TUT,
  encoding: 'utf8',
  env: { ...ENV, GR2_MUT: JSON.stringify({ imya: 'судья 58c4896', celik: join(TUT, 'znak-58c4896.mjs.txt') }) },
});
console.log(`код ${r.status}\n${r.stdout}${r.stderr}`);
