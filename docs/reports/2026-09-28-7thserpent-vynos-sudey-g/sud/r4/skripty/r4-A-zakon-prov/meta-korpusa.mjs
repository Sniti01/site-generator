// Документы живых корпусов, которые идут по ветке <meta> (нет charset в манифесте, байты не UTF-8):
// метка <meta>, кодировка декодера и сколько 8-грамм «точно» различают чтение по <meta> и запасную windows-1252.
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dokumentyKorpusa, tekstDokumentaKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';
import { izvlechDokument } from 'file:///D:/SEO/cloud/site-generator/core/text/extract.mjs';
import { slova, vRezhime, bezAdresov, N_GRAM } from 'file:///D:/SEO/cloud/site-generator/core/text/words.mjs';

const gramm = (t) => {
  const x = izvlechDokument(t);
  const s = new Set();
  for (const p of [x.vplotnuyu, x.cherezProbel]) {
    const ws = vRezhime([p].flat().flatMap((q) => slova(bezAdresov(q))), 'tochno');
    for (let i = 0; i + N_GRAM <= ws.length; i++) s.add(ws.slice(i, i + N_GRAM).join(' '));
  }
  return s;
};
for (const papka of ['D:/SEO/cloud/site-generator/sites/7thserpent.com/input/corpus', 'D:/SEO/cloud/site-generator/sites/ac4bf-thewatch.com/input/corpus']) {
  if (!existsSync(papka)) {
    console.log(`нет ${papka}`);
    continue;
  }
  let vsego = 0;
  for (const d of dokumentyKorpusa(papka)) {
    vsego++;
    if (d.charset) continue;
    let b = readFileSync(d.fajl);
    if (d.fajl.endsWith('.gz')) b = gunzipSync(b);
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(b);
      continue;
    } catch {}
    const golova = b.subarray(0, 8192).toString('latin1').split(/<body\b/i)[0];
    const m = /<meta\b[^>]*?charset\s*=\s*["']?\s*([-\w.:]+)/i.exec(golova);
    let enc = null;
    try {
      enc = m ? new TextDecoder(m[1].toLowerCase()).encoding : null;
    } catch {}
    const a = gramm(tekstDokumentaKorpusa(d));
    const w = gramm(new TextDecoder('windows-1252').decode(b));
    const tolkoMeta = [...a].filter((g) => !w.has(g));
    console.log(`${papka.split('/').at(-3)} ${d.url}: метка ${m?.[1] ?? '—'} → ${enc ?? 'запасная'}; 8-грамм только при чтении по <meta>: ${tolkoMeta.length}${tolkoMeta.length ? ` («${tolkoMeta[0]}»)` : ''}`);
  }
  console.log(`${papka}: документов ${vsego}`);
}
