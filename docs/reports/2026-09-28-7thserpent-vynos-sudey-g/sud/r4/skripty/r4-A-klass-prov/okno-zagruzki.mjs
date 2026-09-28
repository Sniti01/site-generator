// R4-A-K-7 заново, другой правкой: words.mjs (цифры перестают быть словами) меняется модулем, который
// вычисляется первым в графе входа, — после того как загрузчик прочёл words.mjs, но до вычисления corpus.mjs.
import { mkdirSync, writeFileSync, readdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const ZDES = dirname(fileURLToPath(import.meta.url));
const REPO = 'D:/SEO/cloud/site-generator/core/text';
const m = join(ZDES, 'm');
if (!existsSync(join(m, 'node_modules'))) throw new Error('нет ссылки m/node_modules (gotovit-mutacii.mjs)');
const koren = join(m, 'okno');
rmSync(koren, { recursive: true, force: true });
mkdirSync(join(koren, 'text'), { recursive: true });
for (const f of readdirSync(REPO).filter((x) => x.endsWith('.mjs') && !x.endsWith('.test.mjs'))) copyFileSync(join(REPO, f), join(koren, 'text', f));
const wf = join(koren, 'text', 'words.mjs');
const STAR = "match(/[\\p{L}\\p{N}']+/gu)";
const NOV = "match(/[\\p{L}']+/gu)";
writeFileSync(
  join(koren, 'pravka.mjs'),
  `import { readFileSync, writeFileSync } from 'node:fs';
const s = readFileSync(${JSON.stringify(wf)}, 'utf8');
if (!s.includes(${JSON.stringify(STAR)})) throw new Error('нет строки');
writeFileSync(${JSON.stringify(wf)}, s.replace(${JSON.stringify(STAR)}, ${JSON.stringify(NOV)}));
`
);
const p = join(koren, 'korpus');
mkdirSync(join(p, 'raw'), { recursive: true });
writeFileSync(join(p, 'raw', 'd0.html.gz'), gzipSync('<p>one two 3 four five six seven eight nine ten</p>'));
writeFileSync(join(p, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html.gz' }) + '\n');
const kesh = join(koren, 'kesh');
const cu = pathToFileURL(join(koren, 'text', 'corpus.mjs')).href;
const pu = pathToFileURL(join(koren, 'pravka.mjs')).href;
const G = 'one two four five six seven eight nine'; // 8-грамма нового кода (без «3»)
const vyvod = (kod) => `const u = ukazatelKorpusa(${JSON.stringify(p)}, { kesh: ${JSON.stringify(kesh)} });
const b = ukazatelKorpusa(${JSON.stringify(p)}, { kesh: null });
console.log(JSON.stringify({ kod: ${JSON.stringify(kod)}, izKesha: u.izKesha, oshibkaKesha: u.oshibkaKesha, sKeshem: u.nayti(${JSON.stringify(G)}, 'tochno'), bezKesha: b.nayti(${JSON.stringify(G)}, 'tochno') }));`;
writeFileSync(join(koren, 'vhod1.mjs'), `import ${JSON.stringify(pu)};\nimport { ukazatelKorpusa } from ${JSON.stringify(cu)};\n${vyvod('старый код, правка в окне загрузки')}\n`);
writeFileSync(join(koren, 'vhod2.mjs'), `import { ukazatelKorpusa } from ${JSON.stringify(cu)};\n${vyvod('новый код')}\n`);
console.log(execFileSync(process.execPath, [join(koren, 'vhod1.mjs')], { encoding: 'utf8' }).trim());
console.log('файлов кеша:', readdirSync(kesh).length);
console.log(execFileSync(process.execPath, [join(koren, 'vhod2.mjs')], { encoding: 'utf8' }).trim());
