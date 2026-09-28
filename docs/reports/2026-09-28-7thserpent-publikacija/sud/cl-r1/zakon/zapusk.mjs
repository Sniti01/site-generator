// Прогон всех скриптов папки с записью вывода в <имя>.txt рядом; печатает строки ИТОГ.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const skripty = ['derzhit.mjs', 'petlya.mjs', 'z1-kesh.mjs', 'z2-disallow-kommentariy.mjs', 'z3-obfuskaciya.mjs', 'z4-soobshcheniya.mjs', 'z5-kommentarii-vne-blokov.mjs'];
for (const s of skripty) {
  const r = spawnSync(process.execPath, [join(TUT, s)], { encoding: 'utf8' });
  const vyvod = r.stdout + (r.stderr ? `\n[stderr]\n${r.stderr}` : '');
  writeFileSync(join(TUT, s.replace(/\.mjs$/, '.txt')), vyvod);
  const itog = vyvod.split('\n').filter((l) => l.startsWith('ИТОГ') || /^=== .*: \d+\/\d+$/.test(l));
  console.log(`${s}: код ${r.status}`);
  for (const l of itog) console.log(`  ${l}`);
}
