// Обзор кодировок живого корпуса: какие документы идут по какой ветке tekstSyrya.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dokumentyKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

const papki = process.argv.slice(2);
for (const papka of papki) {
  const docs = dokumentyKorpusa(papka);
  const schet = {};
  const primery = [];
  for (const d of docs) {
    let b = readFileSync(d.fajl);
    if (d.fajl.endsWith('.gz')) b = gunzipSync(b);
    let vetka;
    const bom = (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) || (b[0] === 0xfe && b[1] === 0xff) || (b[0] === 0xff && b[1] === 0xfe);
    let valid = true;
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(b);
    } catch {
      valid = false;
    }
    const golova = b.subarray(0, 8192).toString('latin1').split(/<body\b/i)[0];
    const m = /<meta\b[^>]*?charset\s*=\s*["']?\s*([-\w.:]+)/i.exec(golova);
    let metkaOk = false;
    if (d.charset) {
      try {
        new TextDecoder(d.charset.toLowerCase().replace(/^["']|["']$/g, ''));
        metkaOk = true;
      } catch {}
    }
    if (bom) vetka = 'bom';
    else if (metkaOk) vetka = `metka:${d.charset.toLowerCase()}${valid ? '' : ':neUTF8'}`;
    else if (valid) vetka = `utf8-valid${m ? ':meta=' + m[1].toLowerCase() : ''}`;
    else vetka = `neUTF8:meta=${m ? m[1].toLowerCase() : '-'}`;
    schet[vetka] = (schet[vetka] ?? 0) + 1;
    if (vetka.startsWith('neUTF8') || vetka.includes(':neUTF8') || (d.charset && !metkaOk)) primery.push(`${vetka} ${d.url} (charset=${d.charset}) body-idx=${b.toString('latin1').search(/<body\b/i)}`);
  }
  console.log(papka, docs.length);
  console.log(JSON.stringify(schet, null, 1));
  console.log(primery.join('\n'));
}
