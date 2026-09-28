// Два прогона случаев: прежняя редакция znak.mjs (3b78f28, крюком в памяти) и нынешняя; итог — JSON каждого.
//   node verdikty-progon.mjs
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const Z = import.meta.dirname;
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const progon = (s, vyvod, staryi) => {
  const r = spawnSync(process.execPath, [...(staryi ? ['--import', './kryuk-staryi.mjs'] : []), 'sverka-verdiktov-sluchai.mjs', vyvod], {
    cwd: Z,
    encoding: 'utf8',
    env: { ...ENV, ...(staryi ? { ZNAK_STARYI: join(Z, 'znak-3b78f28.mjs') } : {}) },
  });
  console.log(`${s}: код ${r.status}; ${r.stdout.trim()}${r.status ? ' ' + r.stderr.slice(-500) : ''}`);
};
progon('прежняя редакция 3b78f28', 'verdikty-staryi.json', true);
progon('нынешняя редакция', 'verdikty-novyi.json', false);
