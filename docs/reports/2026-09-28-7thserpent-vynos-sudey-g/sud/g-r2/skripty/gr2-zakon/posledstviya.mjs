// Последствия выживших мутантов: входы sluchai-mut.mjs на настоящем судье и на каждом мутанте M1–M5.
//   node posledstviya.mjs > posledstviya.txt
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MUTACII } from './mutacii.mjs';

const TUT = import.meta.dirname;
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
for (const m of MUTACII.filter((x) => /^(K0|M[1-5]) /.test(x.imya))) {
  const r = spawnSync(process.execPath, ['--no-deprecation', '--import', pathToFileURL(join(TUT, 'kryuk.mjs')).href, join(TUT, 'sluchai-mut.mjs')], {
    cwd: TUT,
    encoding: 'utf8',
    env: { ...ENV, GR2_MUT: JSON.stringify(m) },
    maxBuffer: 64 * 1024 * 1024,
  });
  console.log(`== ${m.imya} (код ${r.status})\n${r.stdout}${r.stderr}`);
}
