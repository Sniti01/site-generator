// Обзор кодировок живого корпуса второго сайта: какая ветка tekstSyrya берёт документ,
// что нашла бы регулярка <meta charset> и что нашёл бы разбор браузера (упрощённый prescan WHATWG).
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dokumentyKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

const PAPKA = process.argv[2] ?? 'D:/SEO/cloud/site-generator/sites/7thserpent.com/input/corpus';
const docs = dokumentyKorpusa(PAPKA);
const bajty = (f) => (f.endsWith('.gz') ? gunzipSync(readFileSync(f)) : readFileSync(f));
const vetki = {};
const zapisi = [];
for (const d of docs) {
  const b = bajty(d.fajl);
  let vetka;
  const bom = (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) || (b[0] === 0xfe && b[1] === 0xff) || (b[0] === 0xff && b[1] === 0xfe);
  let metkaOk = false;
  if (d.charset) {
    try { new TextDecoder(d.charset.toLowerCase().replace(/^["']|["']$/g, '')); metkaOk = true; } catch {}
  }
  let utf8 = true;
  try { new TextDecoder('utf-8', { fatal: true }).decode(b); } catch { utf8 = false; }
  const golova = b.subarray(0, 8192).toString('latin1').split(/<body\b/i)[0];
  const m = /<meta\b[^>]*?charset\s*=\s*["']?\s*([-\w.:]+)/i.exec(golova);
  const vyshe7F = b.some((x) => x > 0x7f);
  if (bom) vetka = 'bom';
  else if (metkaOk) vetka = 'http:' + d.charset.toLowerCase();
  else if (utf8) vetka = vyshe7F ? 'utf8-valid' : 'ascii';
  else vetka = 'meta:' + (m ? m[1].toLowerCase() : '(нет)→1252');
  vetki[vetka] = (vetki[vetka] ?? 0) + 1;
  // Где заявленный meta (в первых 8 КБ) расходится с веткой без HTTP-метки
  if (!bom && !metkaOk) zapisi.push({ url: d.url, fajl: d.fajl, http: d.charset, utf8, vyshe7F, meta: m ? m[1] : null, kontekst: m ? golova.slice(Math.max(0, m.index - 60), m.index + 80).replace(/\s+/g, ' ') : null });
}
console.log('документов', docs.length);
console.log(vetki);
console.log('--- без действующей HTTP-метки, с meta, отличной от utf-8, и байтами выше 0x7F:');
for (const z of zapisi) if (z.meta && !/^utf-?8$/i.test(z.meta) && z.vyshe7F) console.log(JSON.stringify(z));
console.log('--- без действующей HTTP-метки, не UTF-8:');
for (const z of zapisi) if (!z.utf8) console.log(JSON.stringify(z));
