// Копия файлов коммита для скептиков «судью судят» (сессия 25): node kopiya-suda.mjs <коммит> <папка вне репозитория> <путь>…
// Каждый путь (от корня репозитория) — `git show <коммит>:<путь>` байтами в <папка>/<путь>; печать — путь, байты, sha256.
// Репозиторий не меняется; папка — только вне репозитория.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const [kommit, papka, ...puti] = process.argv.slice(2);
if (!kommit || !papka || !isAbsolute(papka) || resolve(papka).toLowerCase().startsWith(REPO.toLowerCase()) || !puti.length) {
  console.error('node kopiya-suda.mjs <коммит> <абсолютная папка вне репозитория> <путь>…');
  process.exit(2);
}
for (const p of puti) {
  const r = spawnSync('git', ['show', `${kommit}:${p}`], { cwd: REPO, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(`${p}: git show — код ${r.status}: ${String(r.stderr)}`);
    process.exit(1);
  }
  const cel = join(papka, p);
  mkdirSync(dirname(cel), { recursive: true });
  writeFileSync(cel, r.stdout);
  console.log(`${p}: ${r.stdout.length} байт, sha256 ${createHash('sha256').update(r.stdout).digest('hex').slice(0, 12)}…`);
}
