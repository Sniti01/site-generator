// Раунд 4, блок Б: каждый мутант — через запускатель testy.mjs; печать упавших тестов (✖) и кода.
// node progon-mutantov.mjs
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const SCR = join(ZDES, '..', '..', '..');
const DIST = join(SCR, 'ref', 'dist-7th-3b78f28');
const mutanty = [
  ['MH-B3-1-celikom', 'head.test.mjs'],
  ['MH-B3-1-cel-imeni', 'head.test.mjs'],
  ['MH-B3-1-tekushchee', 'head.test.mjs'],
  ['MH-B3-3', 'head.test.mjs'],
  ['MI-B3-2', 'phrases.test.mjs'],
];
for (const [m, t] of mutanty) {
  const r = spawnSync(process.execPath, [join(SCR, 'testy.mjs'), DIST, join(ZDES, m, t)], { encoding: 'utf8' });
  const upavshie = [...new Set(r.stdout.split('\n').filter((s) => /^\s*✖/.test(s) && !/failing tests/.test(s)).map((s) => s.trim().replace(/ \([\d.]+ms\)$/, '')))];
  console.log(`${m}: код ${r.status}; упавшие: ${upavshie.length ? '\n  ' + upavshie.join('\n  ') : 'НИ ОДНОГО'}`);
}
