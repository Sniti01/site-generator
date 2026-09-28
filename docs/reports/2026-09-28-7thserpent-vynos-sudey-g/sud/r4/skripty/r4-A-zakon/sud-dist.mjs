// Сторож 8 слов на эталонной сборке 3b78f28 с живым корпусом; кеш — в своей папке.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { sudSborki, adres } from 'file:///D:/SEO/cloud/site-generator/core/gates/phrases.mjs';
import { ukazatelKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';
import { dannye } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/phrases.mjs';

const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-A-zakon';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const t0 = Date.now();
const uk = ukazatelKorpusa('D:/SEO/cloud/site-generator/sites/7thserpent.com/input/corpus', { imena: dannye.imena ?? [], kesh: join(ZDES, 'kesh') });
console.log('указатель', Date.now() - t0, 'мс', uk.dokumentov, uk.pustyh, uk.izKesha, uk.oshibkaKesha);
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
const { otkazy, itogi } = sudSborki(stranicy, uk, dannye);
console.log('страниц', itogi.length, 'отказов', otkazy.length);
for (const o of otkazy) console.log(o.url, o.chto);
