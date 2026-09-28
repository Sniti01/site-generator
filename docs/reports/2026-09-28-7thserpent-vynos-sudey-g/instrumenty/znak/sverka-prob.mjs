// Пробы теста знака = пробы --selftest znak.mjs на 3b78f28, по тексту (пробельные знаки не в счёт).
//   node sverka-prob.mjs <файл теста>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const REPO = 'D:/SEO/cloud/site-generator';
const staryi = execFileSync('git', ['show', '3b78f28:sites/7thserpent.com/tools/znak.mjs'], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const test = readFileSync(process.argv[2], 'utf8');
const vyrezat = (t, nachalo, konec) => {
  const i = t.indexOf(nachalo);
  const j = t.indexOf(konec, i);
  if (i < 0 || j < 0) throw new Error(`нет границ «${nachalo}» … «${konec}»`);
  return t.slice(i + nachalo.length, j);
};
const a = vyrezat(staryi, 'const proby = [', '\n  ];\n  let zle');
const b = vyrezat(test, 'const PROBY = [', '\n];');
const szhat = (s) => s.replace(/\s+/g, '');
const sa = szhat(a);
const sb = szhat(b);
const imena = (s) => [...s.matchAll(/^\s*\['([^']*)'/gm)].map((m) => m[1]);
console.log(`проб в 3b78f28: ${imena(a).length}; в тесте: ${imena(b).length}`);
if (sa === sb) {
  console.log('текст проб совпадает (без пробельных знаков)');
  process.exit(0);
}
let k = 0;
while (k < sa.length && sa[k] === sb[k]) k++;
console.log(`РАСХОЖДЕНИЕ с позиции ${k}:\n  3b78f28: ${JSON.stringify(sa.slice(Math.max(0, k - 60), k + 80))}\n  тест:    ${JSON.stringify(sb.slice(Math.max(0, k - 60), k + 80))}`);
process.exit(1);
