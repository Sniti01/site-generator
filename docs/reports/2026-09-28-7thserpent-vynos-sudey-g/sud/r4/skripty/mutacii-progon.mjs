// Мутации блока А раунда 4 («тест не сторожит»): копия core/text (все модули и corpus.test.mjs — как в репозитории сейчас,
// до правки) в mutacii/<мутация>/text, в копии corpus.mjs откатывается сторожимая строка, прогоняется копия теста
// запускателем testy.mjs с шаблоном находки. node_modules копий — одна ссылка (junction) mutacii/node_modules на
// node_modules репозитория (versiya() и тест A3-5 ищут parse5 от своей папки). Вывод — krasnye/<находка>.txt,
// первой строкой — какая мутация.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, symlinkSync, rmSync, lstatSync } from 'node:fs';
import { join } from 'node:path';

const S = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const REPO = 'D:/SEO/cloud/site-generator/core/text';
const M = join(S, 'r4/mutacii');
const K = join(S, 'r4/krasnye');
mkdirSync(M, { recursive: true });
if (!existsSync(join(M, 'node_modules'))) symlinkSync('D:/SEO/cloud/site-generator/node_modules', join(M, 'node_modules'), 'junction');
if (!lstatSync(join(M, 'node_modules')).isSymbolicLink()) throw new Error('mutacii/node_modules — не ссылка');

// [папка мутации, находка (шаблон имени теста), что откатывается, было, стало]
const MUTACII = [
  ['Z-1', 'R4-A-Z-1', 'ветка <meta charset> tekstSyrya снята (m = null)', `const m = /<meta\\b[^>]*?charset\\s*=\\s*["']?\\s*([-\\w.:]+)/i.exec(golova);`, 'const m = null;'],
  ['K-5', 'R4-A-K-5', 'строка уборки брошенных .tmp своего корпуса снята', 'else if (svoy && /\\.tmp$/.test(f) && Date.now() - statSync(p).mtimeMs > 3600 * 1000) unlinkSync(p);', '// снято мутацией K-5'],
  ['Z-4', 'R4-A-Z-4', 'порог «старше часа» в уборке .tmp снят', ' && Date.now() - statSync(p).mtimeMs > 3600 * 1000) unlinkSync(p);', ') unlinkSync(p);'],
  ['K-6', 'R4-A-K-6', 'проверка pustyh — только Number.isInteger (диапазон 0…n снят)', 'if (!Number.isInteger(k.pustyh) || k.pustyh < 0 || k.pustyh > n) return null;', 'if (!Number.isInteger(k.pustyh)) return null;'],
  ['Z-2', 'R4-A-Z-2', 'верхняя половина диапазона pustyh (k.pustyh > n) снята', ' || k.pustyh > n) return null;', ') return null;'],
  ['Z-3-nomer', 'R4-A-Z-3', 'проверка «номер документа меньше их числа» (d[i] >= n) снята', 'if (d[i] >= n || (i && !(h[i] > h[i - 1]))) return null;', 'if (i && !(h[i] > h[i - 1])) return null;'],
  ['Z-3-poryadok', 'R4-A-Z-3', 'проверка «h строго растёт» снята', 'if (d[i] >= n || (i && !(h[i] > h[i - 1]))) return null;', 'if (d[i] >= n) return null;'],
  ['Z-3-dliny', 'R4-A-Z-3', 'проверка «длины h и d равны» снята', 'if (!h.length || h.length !== d.length) return null;', 'if (!h.length) return null;'],
  ['Z-5-zapis', 'R4-A-Z-5', 'первая половина A3-5 снята: сменившиеся после загрузки исходники не мешают записи кеша', "else if (fajlKesha && versiya() !== VERSIYA) oshibki.push('исходники core/text менялись после загрузки судьи — кеш не записан');\n", ''],
  ['Z-5-chtenie', 'R4-A-Z-5', 'вторая половина A3-5 снята: ключ — по исходникам на диске (versiya()), а не по версии при загрузке (VERSIYA)', "'\\0' + VERSIYA).digest('hex');", "'\\0' + versiya()).digest('hex');"],
];

const vyvody = new Map();
for (const [imya, nahodka, chto, bylo, stalo] of MUTACII) {
  const papka = join(M, imya, 'text');
  rmSync(join(M, imya), { recursive: true, force: true });
  mkdirSync(papka, { recursive: true });
  for (const f of readdirSync(REPO).filter((x) => x.endsWith('.mjs'))) copyFileSync(join(REPO, f), join(papka, f));
  const c = readFileSync(join(papka, 'corpus.mjs'), 'utf8');
  if (!c.includes(bylo)) throw new Error(`мутация ${imya} не легла: нет строки`);
  writeFileSync(join(papka, 'corpus.mjs'), c.replace(bylo, stalo));
  const r = spawnSync(process.execPath, [join(S, 'testy.mjs'), join(S, 'ref/dist-7th-3b78f28'), join(papka, 'corpus.test.mjs'), `--test-name-pattern=${nahodka}`], { encoding: 'utf8' });
  const kusok = `мутация ${imya}: ${chto} (копия ${join(M, imya, 'text', 'corpus.mjs')})\n${r.stdout}${r.stderr}\nкод возврата: ${r.status}\n`;
  vyvody.set(nahodka, [...(vyvody.get(nahodka) ?? []), kusok]);
  console.log(imya, nahodka, 'код', r.status);
}
for (const [nahodka, kuski] of vyvody) writeFileSync(join(K, `${nahodka}.txt`), kuski.join('\n==========\n'));
