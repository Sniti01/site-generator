// Какие именно 8-граммы строк совпали с документом (диагностика к chuzhie-teksty.mjs). Только чтение.
// node chuzhie-kakie.mjs <url-документа> "<строка>"
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const B = await import(pathToFileURL(join(root, 'tools/brief-strony.mjs')).href);
const [, , url, stroka] = process.argv;
const manifest = readFileSync(join(root, 'input/corpus/manifest.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const rec = [...manifest].reverse().find((r) => r.url === url && r.file);
const norm = ` ${B.bezImen(B.slova(B.tekstDokumenta(gunzipSync(readFileSync(join(root, 'input/corpus', rec.file))).toString('utf8')))).join(' ')} `;
for (const otrezok of stroka.split(/[·|]/)) {
  const ws = B.bezImen(B.slova(otrezok));
  for (let j = 0; j + B.N_GRAM <= ws.length; j++) {
    const g = ws.slice(j, j + B.N_GRAM).join(' ');
    if (norm.includes(` ${g} `)) console.log('совпало:', g);
  }
}
