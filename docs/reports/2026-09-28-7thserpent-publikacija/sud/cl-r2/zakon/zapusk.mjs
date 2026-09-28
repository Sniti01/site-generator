// Прогон всех скриптов папки с записью вывода в <имя>.txt рядом; печатает строки ИТОГ.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const skripty = ['h0.mjs', 'derzhit.mjs', 'z1-adres-tekstom.mjs', 'z2-obfuskaciya-prichina.mjs', 'z3-always-https-v-ok.mjs', 'z4-vstavki-prichina.mjs', 'z5-revalidated.mjs', 'z6-x-robots.mjs', 'z7-cookie-mesto.mjs', 'z8-glavnaya-ne-200.mjs', 'z9-bez-pri-sboe-mimo.mjs'];
for (const s of skripty) {
  const r = spawnSync(process.execPath, [join(TUT, s)], { encoding: 'utf8' });
  const vyvod = r.stdout + (r.stderr ? `\n[stderr]\n${r.stderr}` : '');
  writeFileSync(join(TUT, s.replace(/\.mjs$/, '.txt')), vyvod);
  console.log(`${s}: код ${r.status}`);
  for (const l of vyvod.split('\n').filter((x) => x.startsWith('ИТОГ'))) console.log(`  ${l}`);
}
