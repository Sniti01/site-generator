// Прогон всех скриптов доказательств по порядку (стенд окончательный); коды выхода — в progon-vseh-vyvod.txt.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-cl25/propusk';
const SKRIPTY = ['razbor-obrazcov.mjs', 'derzhit-poisk.mjs', 'derzhit-obrazcy.mjs', 'CL25-P-1.mjs', 'CL25-P-2.mjs', 'CL25-P-3.mjs', 'CL25-P-4.mjs', 'CL25-P-5.mjs', 'CL25-P-6.mjs', 'CL25-P-7.mjs'];
const out = [];
for (const s of SKRIPTY) {
  const r = spawnSync(process.execPath, [`${PAPKA}/${s}`], { encoding: 'utf8' });
  out.push(`${s}: код ${r.status}${r.stderr ? ` — stderr: ${r.stderr.trim().slice(0, 300)}` : ''}`);
}
writeFileSync(`${PAPKA}/progon-vseh-vyvod.txt`, `${out.join('\n')}\n`);
