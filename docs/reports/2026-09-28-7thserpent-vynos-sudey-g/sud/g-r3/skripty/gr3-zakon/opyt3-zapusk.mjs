// opyt3.mjs на настоящем znak.mjs и под мутантами M20 (root null — сканер пуст) и M21 (root none — корень сайта).
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const KRYUK = pathToFileURL(join(import.meta.dirname, '../../g/kryuk-znak.mjs')).href;
const M = [
  ['настоящий', null],
  ['M20 root null — сканер пуст', { iz: "c.root === null ? [{ base: siteRoot, pattern: '**/*', negated: false }]", na: 'c.root === null ? []' }],
  ['M21 root none — корень сайта', { iz: "c.root === 'none' ? []", na: "c.root === 'none' ? [{ base: siteRoot, pattern: '**/*', negated: false }]" }],
];
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
for (const [imya, m] of M) {
  const r = spawnSync(process.execPath, ['--import', KRYUK, join(import.meta.dirname, 'opyt3.mjs')], {
    encoding: 'utf8', env: { ...ENV, ZNAK_MUTACIYA: m ? JSON.stringify({ imya, ...m }) : '' },
  });
  console.log(`== ${imya} (код ${r.status})\n${r.stdout}${r.stderr}`);
}
