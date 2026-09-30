// Извлечь (только чтение git) сторожа и workflow в том виде, в каком они в main до вливания сессии 25 (f22bb92), —
// для проверки Re-run прогонов #1–#5 и отката на коммиты до вливания (GL25-Z-4, derzhit-staryi).
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const RAB = join(PAPKA, 'rabochie-staryi');
mkdirSync(RAB, { recursive: true });
const out = [];
for (const [put, imya] of [
  ['sites/7thserpent.com/tools/storozha-vykladki.mjs', 'storozha-vykladki.mjs'],
  ['.github/workflows/deploy-7thserpent.yml', 'deploy-7thserpent.yml'],
]) {
  const r = spawnSync('git', ['-C', 'D:/SEO/cloud/site-generator', 'show', `f22bb92:${put}`], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(r.stderr.toString());
  writeFileSync(join(RAB, imya), r.stdout);
  out.push(`f22bb92:${put} → rabochie-staryi/${imya}: ${r.stdout.length} байт, sha256 ${createHash('sha256').update(r.stdout).digest('hex')}`);
}
const vyvod = `${out.join('\n')}\n`;
writeFileSync(join(PAPKA, 'staryi-izvlech.txt'), vyvod);
console.log(vyvod);
