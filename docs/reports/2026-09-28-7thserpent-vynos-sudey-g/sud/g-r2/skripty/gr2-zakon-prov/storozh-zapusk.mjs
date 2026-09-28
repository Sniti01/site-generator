// Два прогона сторожа: без порчи и с краской --accent, переопределённой в листе (в памяти, крюком).
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const KRYUK = pathToFileURL(join(import.meta.dirname, 'kryuk.mjs')).href;
const PORCHA = { imya: 'краска вне :root', zameny: [{ iz: "css: readFileSync(join(siteRoot, 'src/styles/global.css'), 'utf8'),", na: "css: readFileSync(join(siteRoot, 'src/styles/global.css'), 'utf8') + '\\n.ft { --accent: #ff0000; }\\n'," }] };
const out = [];
for (const [imya, mut] of [['без порчи', ''], ['краска --accent в .ft', JSON.stringify(PORCHA)]]) {
  const r = spawnSync(process.execPath, ['--import', KRYUK, join(import.meta.dirname, 'storozh.mjs')], { cwd: import.meta.dirname, encoding: 'utf8', env: { ...process.env, GR2P_MUT: mut } });
  out.push(`== ${imya}: код ${r.status}\n${r.stdout}`);
}
writeFileSync(join(import.meta.dirname, 'storozh.txt'), out.join('\n'));
