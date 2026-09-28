// Сверка законной печати блока А раунда 4: текст каждого документа корпусов обоих сайтов прежним кодом (HEAD, копия
// sverka-A/text) и новым (репозиторий); затем сторож 8 слов на сборке dist-7th-3b78f28 новым указателем (без кеша).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import * as staryi from './sverka-A/text/corpus.mjs';
import * as novyi from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';
import { sudSborki, adres } from 'file:///D:/SEO/cloud/site-generator/core/gates/phrases.mjs';
import { dannye } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/phrases.mjs';

const KORPUSA = ['D:/SEO/cloud/site-generator/sites/7thserpent.com/input/corpus', 'D:/SEO/cloud/site-generator/sites/ac4bf-thewatch.com/input/corpus'];
for (const k of KORPUSA) {
  const docs = novyi.dokumentyKorpusa(k);
  const raznye = docs.filter((d) => staryi.tekstDokumentaKorpusa(d) !== novyi.tekstDokumentaKorpusa(d));
  console.log(k, 'документов', docs.length, 'текст иной', raznye.length, raznye.map((d) => d.url).join(' '));
}

const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const html = [];
const obhod = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) obhod(p);
    else if (f === 'index.html') html.push(p);
  }
};
obhod(DIST);
const stranicy = [];
for (const f of html) {
  const url = adres('/' + relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, ''));
  if (!dannye.stranica(url)) continue;
  stranicy.push({ url, html: readFileSync(f, 'utf8') });
}
for (const [imya, m] of [['новый', novyi], ['прежний', staryi]]) {
  const uk = m.ukazatelKorpusa(KORPUSA[0], { imena: dannye.imena ?? [], kesh: null });
  const { otkazy, itogi } = sudSborki(stranicy, uk, dannye);
  console.log(imya, 'документов', uk.dokumentov, 'пустых', uk.pustyh, 'восьмиграмм', JSON.stringify(uk.vosmigramm), 'страниц', itogi.length, 'отказов', otkazy.length);
  // Отпечаток итогов без узлов разбора: одинаковые итоги — одинаковый отпечаток.
  const json = JSON.stringify(itogi, (k, v) => (v && typeof v === 'object' && 'nodeName' in v ? undefined : v));
  console.log(imya, 'отпечаток итогов', createHash('sha256').update(json).digest('hex').slice(0, 16), 'длина', json.length);
  for (const o of otkazy) console.log(' ', o.url, o.chto);
}
