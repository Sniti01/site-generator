// Прогон всех скриптов папки с записью вывода в <имя>.txt рядом; печатает строки ИТОГ.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const skripty = ['h0.mjs', 'derzhit.mjs', 'z1-sborka-drugoy-mashiny.mjs', 'z2-drugoy-kommit.mjs', 'z3-blok-khostera-sluzhebnye.mjs', 'z4-htaccess-put.mjs', 'z5-staraya-kopiya-robots.mjs', 'z6-yasnost.mjs'];
for (const s of skripty) {
  const r = spawnSync(process.execPath, [join(TUT, s)], { encoding: 'utf8' });
  const vyvod = r.stdout + (r.stderr ? `\n[stderr]\n${r.stderr}` : '');
  writeFileSync(join(TUT, s.replace(/\.mjs$/, '.txt')), vyvod);
  console.log(`${s}: код ${r.status}`);
  for (const l of vyvod.split('\n').filter((x) => x.startsWith('ИТОГ'))) console.log(`  ${l}`);
}
