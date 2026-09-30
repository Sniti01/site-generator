// Сверка копии с коммитом f57bbb9: сторож, пробы, workflow — побайтно (git show — только чтение).
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const KOPIYA = join(TUT, 'kopiya');
const REPO = 'D:/SEO/cloud/site-generator';
const puti = [
  'sites/7thserpent.com/tools/storozha-vykladki.mjs',
  'sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs',
  '.github/workflows/deploy-7thserpent.yml',
  'sites/7thserpent.com/gates/sborka-prinyataya.json',
];
const sha = (b) => createHash('sha256').update(b).digest('hex');
const out = [];
for (const p of puti) {
  const vKommite = execFileSync('git', ['-C', REPO, 'show', `f57bbb9:${p}`], { maxBuffer: 64 * 1024 * 1024 });
  const vKopii = readFileSync(join(KOPIYA, p));
  out.push(`${sha(vKommite) === sha(vKopii) ? 'РАВНЫ ' : 'РАЗНЫЕ'} ${p} коммит ${vKommite.length} байт, копия ${vKopii.length} байт`);
}
writeFileSync(join(TUT, 'sverka-kopii.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));
