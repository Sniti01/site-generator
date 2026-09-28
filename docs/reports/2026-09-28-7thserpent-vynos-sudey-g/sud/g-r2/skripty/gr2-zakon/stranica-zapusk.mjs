// Запуск stranica.mjs с вывозом cssStranicy в памяти (только добавлено слово export; логика не меняется).
//   node stranica-zapusk.mjs > stranica.txt
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const TUT = import.meta.dirname;
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const m = { imya: 'вывоз cssStranicy', zameny: [{ iz: 'async function cssStranicy(css)', na: 'export async function cssStranicy(css)' }] };
const r = spawnSync(process.execPath, ['--no-deprecation', '--import', pathToFileURL(join(TUT, 'kryuk.mjs')).href, join(TUT, 'stranica.mjs')], {
  cwd: TUT,
  encoding: 'utf8',
  env: { ...ENV, GR2_MUT: JSON.stringify(m) },
  maxBuffer: 64 * 1024 * 1024,
});
console.log(`код ${r.status}\n${r.stdout}${r.stderr}`);
