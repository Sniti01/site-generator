// Ветка <meta charset> на живых корпусах: чем текст документа по текущему коду отличается от текста
// с мутацией M1 (ветка снята — сразу windows-1252).
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dokumentyKorpusa, tekstDokumentaKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

for (const papka of ['D:/SEO/cloud/site-generator/sites/7thserpent.com/input/corpus', 'D:/SEO/cloud/site-generator/sites/ac4bf-thewatch.com/input/corpus']) {
  for (const d of dokumentyKorpusa(papka)) {
    if (d.charset) continue;
    let b = readFileSync(d.fajl);
    if (d.fajl.endsWith('.gz')) b = gunzipSync(b);
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(b);
      continue;
    } catch {}
    const tek = tekstDokumentaKorpusa(d);
    const w = new TextDecoder('windows-1252').decode(b);
    let raznyh = 0;
    for (let i = 0; i < Math.min(tek.length, w.length); i++) if (tek[i] !== w[i]) raznyh++;
    const i = [...tek].findIndex((c, j) => c !== w[j]);
    console.log(`${d.url}: знаков, отличных от windows-1252: ${raznyh}${i >= 0 ? ` — «${tek.slice(Math.max(0, i - 30), i + 30).replace(/\s+/g, ' ')}» против «${w.slice(Math.max(0, i - 30), i + 30).replace(/\s+/g, ' ')}»` : ''}`);
  }
}
