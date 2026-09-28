// Мутации corpus.mjs в копии core/text (своя папка, node_modules — ссылкой на репозиторий, цель не трогается):
// сторожат ли тесты раунда 3 проверку pustyh (A3-2) и уборку брошенных .tmp (A3-4).
// Запуск тестов копии — отдельно, запускателем testy.mjs.
import { mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, symlinkSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const REPO_TEXT = 'D:/SEO/cloud/site-generator/core/text';
const MUT = {
  'm-pustyh': ['if (!Number.isInteger(k.pustyh) || k.pustyh < 0 || k.pustyh > n) return null;', 'if (!Number.isInteger(k.pustyh)) return null;'],
  'm-tmp': ["else if (svoy && /\\.tmp$/.test(f) && Date.now() - statSync(p).mtimeMs > 3600 * 1000) unlinkSync(p);", '// уборка .tmp снята мутацией'],
};
for (const [imya, [iz, v]] of Object.entries(MUT)) {
  const k = join(ZDES, imya);
  if (existsSync(join(k, 'node_modules'))) unlinkSync(join(k, 'node_modules'));
  rmSync(k, { recursive: true, force: true });
  mkdirSync(join(k, 'text'), { recursive: true });
  symlinkSync('D:/SEO/cloud/site-generator/node_modules', join(k, 'node_modules'), 'junction');
  for (const f of readdirSync(REPO_TEXT).filter((x) => x.endsWith('.mjs'))) copyFileSync(join(REPO_TEXT, f), join(k, 'text', f));
  const c = join(k, 'text', 'corpus.mjs');
  const s = readFileSync(c, 'utf8');
  if (!s.includes(iz)) throw new Error(`${imya}: строки нет`);
  writeFileSync(c, s.replace(iz, v));
  console.log(imya, 'готова:', c);
}
