// Печать цепочки предков подписи кадра на шести страницах: имя и атрибуты каждого звена до <html>.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const H = await import(pathToFileURL('D:/SEO/cloud/site-generator/core/text/html.mjs').href);
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
for (const url of ['/remake/', '/movie/', '/media/', '/mods/', '/quotes/', '/voice-and-face/', '/max-payne-3/', '/pc/']) {
  const doc = H.razobrat(readFileSync(join(DIST, url.slice(1), 'index.html'), 'utf8'));
  const p = H.pervyi(doc, (u) => H.klassy(u).has('podpis-geroya')) ?? H.pervyi(doc, (u) => H.klassy(u).has('hero'));
  const cep = [p, ...H.predki(p)].filter((u) => H.imya(u));
  console.log(url);
  for (const u of cep) console.log('   ', H.imya(u), JSON.stringify((u.attrs ?? []).map((a) => `${a.name}=${a.value}`)));
}
