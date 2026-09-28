// Какие знаки Cf (и селекторы вариантов) уже стоят в текстах сайта: содержание и печать dist.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const obhod = (d, ext) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? obhod(join(d, e.name), ext) : ext.test(e.name) ? [join(d, e.name)] : []));
const kod = (c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
for (const [imya, koren, ext] of [['содержание', join(REPO, 'src/content'), /\.md$/], ['dist', REF, /\.html$/]]) {
  const itog = {};
  for (const f of obhod(koren, ext)) {
    for (const c of readFileSync(f, 'utf8')) if (/[\p{Cf}\uFE00-\uFE0F]/u.test(c)) (itog[kod(c)] ??= new Set()).add(f.slice(koren.length));
  }
  console.log(imya, Object.fromEntries(Object.entries(itog).map(([k, v]) => [k, [...v].slice(0, 5)])));
}
