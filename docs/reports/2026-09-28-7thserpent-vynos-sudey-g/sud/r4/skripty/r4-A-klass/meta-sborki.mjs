// Все <meta> сборки второго сайта: имена (name / property / itemprop / http-equiv) и сколько раз;
// какие из них — вне POLYA_META (голова судьи), с примером содержимого.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { razobrat, elementy, vHtml, imya, atr } from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs';
import { POLYA_META } from 'file:///D:/SEO/cloud/site-generator/core/text/extract.mjs';

const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const vse = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? vse(join(d, f)) : f.endsWith('.html') ? [join(d, f)] : []));
const schet = new Map();
for (const f of vse(DIST)) {
  const doc = razobrat(readFileSync(f, 'utf8'));
  for (const m of elementy(doc, (u) => vHtml(u) && imya(u) === 'meta')) {
    const klyuch = ['name', 'property', 'itemprop', 'http-equiv', 'charset'].filter((a) => atr(m, a) !== undefined).map((a) => `${a}=${atr(m, a)}`).join(' ');
    const z = schet.get(klyuch) ?? { n: 0, primer: atr(m, 'content'), vne: ![atr(m, 'name'), atr(m, 'property')].some((v) => POLYA_META.includes((v ?? '').toLowerCase())) };
    z.n += 1;
    schet.set(klyuch, z);
  }
}
for (const [k, z] of schet) console.log(z.vne ? 'ВНЕ ' : 'в   ', z.n, k, '|', (z.primer ?? '').slice(0, 90));
