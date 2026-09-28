// A3-5: окно между чтением исходника загрузчиком ESM и снятием VERSIYA при вычислении corpus.mjs.
// Исходник extract.mjs меняется ПОСЛЕ того, как загрузчик его прочёл, но ДО вычисления corpus.mjs (модуль-«правщик»
// вычисляется первым: весь граф читается до вычисления любого модуля). VERSIYA снимается с нового исходника,
// указатель строит старый код; сравнение при записи (versiya() === VERSIYA) равенство видит — кеш пишется
// под новым ключом со старым указателем; новый процесс с новым кодом берёт его из кеша.
import { mkdirSync, writeFileSync, readdirSync, copyFileSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const ZDES = dirname(fileURLToPath(import.meta.url));
const REPO_TEXT = 'D:/SEO/cloud/site-generator/core/text';
const koren = join(ZDES, 'a3-5');
try { unlinkSync(join(koren, 'node_modules')); } catch {}
rmSync(koren, { recursive: true, force: true });
mkdirSync(join(koren, 'text'), { recursive: true });
symlinkSync('D:/SEO/cloud/site-generator/node_modules', join(koren, 'node_modules'), 'junction');
for (const f of readdirSync(REPO_TEXT).filter((x) => x.endsWith('.mjs') && !x.endsWith('.test.mjs'))) copyFileSync(join(REPO_TEXT, f), join(koren, 'text', f));
const ex = join(koren, 'text', 'extract.mjs');
writeFileSync(
  join(koren, 'pravshchik.mjs'),
  `import { readFileSync, writeFileSync } from 'node:fs';\nconst s = readFileSync(${JSON.stringify(ex)}, 'utf8');\nif (!s.includes("new Set(['script', 'style', 'template'])")) throw new Error('нет строки');\nwriteFileSync(${JSON.stringify(ex)}, s.replace("new Set(['script', 'style', 'template'])", "new Set(['script', 'template'])"));\n`
);
const p = join(koren, 'korpus');
mkdirSync(join(p, 'raw'), { recursive: true });
writeFileSync(join(p, 'raw', 'd0.html.gz'), gzipSync('<p>one two three four five six seven eight</p><style>alpha bravo charlie delta echo foxtrot golf hotel</style>'));
writeFileSync(join(p, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html.gz' }) + '\n');
const kesh = join(koren, 'kesh');
const corpusUrl = pathToFileURL(join(koren, 'text', 'corpus.mjs')).href;
const pravUrl = pathToFileURL(join(koren, 'pravshchik.mjs')).href;
const G = 'alpha bravo charlie delta echo foxtrot golf hotel';
writeFileSync(
  join(koren, 'vhod-staryi.mjs'),
  `import ${JSON.stringify(pravUrl)};\nimport { ukazatelKorpusa } from ${JSON.stringify(corpusUrl)};\nconst u = ukazatelKorpusa(${JSON.stringify(p)}, { kesh: ${JSON.stringify(kesh)} });\nconsole.log(JSON.stringify({ kod: 'загружен до правки', izKesha: u.izKesha, oshibkaKesha: u.oshibkaKesha, g: u.nayti(${JSON.stringify(G)}, 'tochno') }));\n`
);
writeFileSync(
  join(koren, 'vhod-novyi.mjs'),
  `import { ukazatelKorpusa } from ${JSON.stringify(corpusUrl)};\nconst u = ukazatelKorpusa(${JSON.stringify(p)}, { kesh: ${JSON.stringify(kesh)} });\nconst b = ukazatelKorpusa(${JSON.stringify(p)}, { kesh: null });\nconsole.log(JSON.stringify({ kod: 'новый', izKesha: u.izKesha, g: u.nayti(${JSON.stringify(G)}, 'tochno'), bezKesha: b.nayti(${JSON.stringify(G)}, 'tochno') }));\n`
);
console.log(execFileSync(process.execPath, [join(koren, 'vhod-staryi.mjs')], { encoding: 'utf8' }).trim());
console.log('файлы кеша:', readdirSync(kesh));
console.log(execFileSync(process.execPath, [join(koren, 'vhod-novyi.mjs')], { encoding: 'utf8' }).trim());
unlinkSync(join(koren, 'node_modules')); // ссылку снять, цель не трогать
