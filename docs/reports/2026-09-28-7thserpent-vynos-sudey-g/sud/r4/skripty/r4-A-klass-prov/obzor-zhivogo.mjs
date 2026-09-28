// Живые корпуса (только чтение): документы без метки в HTTP и не в UTF-8 — какая у них голова.
// Ищу формы K-1…K-3 и «мои» (неизвестная метка первой, «<body» в комментарии до meta, несколько meta с charset).
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { dokumentyKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

for (const s of ['7thserpent.com', 'ac4bf-thewatch.com']) {
  const papka = join('D:/SEO/cloud/site-generator/sites', s, 'input/corpus');
  if (!existsSync(papka)) continue;
  const docs = dokumentyKorpusa(papka);
  let bezMetki = 0;
  const ne8 = [];
  for (const d of docs) {
    const b0 = readFileSync(d.fajl);
    const b = d.fajl.endsWith('.gz') ? gunzipSync(b0) : b0;
    if (d.charset) continue;
    bezMetki += 1;
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(b);
      continue;
    } catch {}
    const g = b.subarray(0, 8192).toString('latin1');
    const golova = g.split(/<body\b/i)[0];
    const kommentarii = [...g.matchAll(/<!--[\s\S]*?(?:-->|$)/g)].map((x) => x[0]);
    const metyCs = [...golova.matchAll(/<meta\b[^>]*?charset[^>]*>/gi)].map((x) => x[0]);
    ne8.push({
      url: d.url,
      metyCs,
      charsetVKommentarii: kommentarii.some((c) => /charset/i.test(c)),
      bodyVKommentarii: kommentarii.some((c) => /<body\b/i.test(c)),
      bodyDoMeta: /<body\b/i.test(g) && metyCs.length === 0 && /<meta\b[^>]*charset/i.test(g),
    });
  }
  console.log(s, 'документов', docs.length, 'без метки', bezMetki, 'без метки и не UTF-8', ne8.length);
  for (const x of ne8) console.log('  ', JSON.stringify(x));
}
