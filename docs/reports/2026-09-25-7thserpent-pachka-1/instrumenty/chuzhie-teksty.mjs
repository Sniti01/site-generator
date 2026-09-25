// Чужие 8-словные последовательности в текстах страниц пачки 1 — функциями сторожа брифов
// (`tools/brief-strony.mjs`: slova, bezImen, ukazatel, chuzhie, tekstDokumenta) по всем
// скачанным документам корпуса. Текст страницы — видимый текст <main> собранной страницы,
// по строке на элемент (абзац, заголовок, пункт списка). Только чтение.
// node chuzhie-teksty.mjs <dist> [--proba]  — --proba: вставить в текст 10 слов документа корпуса и ждать поимки.
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const B = await import(pathToFileURL(join(root, 'tools/brief-strony.mjs')).href);
const dist = process.argv[2];
const proba = process.argv.includes('--proba');
const manifest = readFileSync(join(root, 'input/corpus/manifest.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const last = new Map();
for (const r of manifest) last.set(r.url, r);
const docs = [];
for (const r of last.values()) {
  if (r.outcome !== 'ok' || !r.file) continue;
  const p = join(root, 'input/corpus', r.file);
  if (!existsSync(p)) continue;
  docs.push({ url: r.url, tekst: B.tekstDokumenta(gunzipSync(readFileSync(p)).toString('utf8')) });
}
const uk = B.ukazatel(docs);
console.log(`корпус: документов ${docs.length}`);
let vsego = 0;
for (const url of ['/pc/', '/games-like-max-payne/', '/media/']) {
  const h = readFileSync(join(dist, url.slice(1), 'index.html'), 'utf8');
  const main = h.slice(h.indexOf('<main'), h.indexOf('</main>'))
    .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<\/(p|h1|h2|h3|li|a)>/g, '\n');
  let tekst = B.tekstDokumenta(main).split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
  if (proba && url === '/pc/') {
    const d = docs.find((x) => B.slova(x.tekst).length > 300);
    tekst += '\n' + B.slova(d.tekst).slice(200, 210).join(' ');
  }
  const naydeno = B.chuzhie(tekst, uk);
  vsego += naydeno.length;
  const stroki = tekst.split('\n');
  console.log(`${url}: строк ${stroki.length}, слов ${B.slova(tekst).length}, чужих последовательностей: ${naydeno.length}`);
  for (const n of naydeno) console.log(`  строка ${n.stroka}: «${stroki[n.stroka - 1].slice(0, 120)}» — ${n.dokument}`);
}
console.log(`итого чужих: ${vsego}`);
process.exit(vsego ? 1 : 0);
