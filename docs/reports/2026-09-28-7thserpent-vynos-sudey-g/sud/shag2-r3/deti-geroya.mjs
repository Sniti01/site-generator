// Печать детей героя, теневые корни, iframe/object/embed, meta в <body> и javascript: по всем страницам маршрута сборки.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const H = await import(pathToFileURL('D:/SEO/cloud/site-generator/core/text/html.mjs').href);
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const stranicy = ['', ...readdirSync(DIST, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name !== '_astro').map((e) => e.name)];
const vse = [];
const obhod = (d, pref) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory() && e.name !== '_astro') obhod(join(d, e.name), `${pref}${e.name}/`);
    else if (e.name === 'index.html') vse.push(pref);
  }
};
obhod(DIST, '/');
for (const url of vse) {
  const doc = H.razobrat(readFileSync(join(DIST, url.slice(1), 'index.html'), 'utf8'));
  const hero = H.pervyi(doc, (u) => H.imya(u) === 'section' && H.klassy(u).has('hero'));
  const deti = hero ? hero.childNodes.filter(H.element).map((u) => `${H.imya(u)}.${[...H.klassy(u)].join('.')}`) : null;
  const tenevye = H.elementy(doc, (u) => H.imya(u) === 'template').length;
  const nositeli = H.elementy(doc, (u) => ['iframe', 'frame', 'object', 'embed'].includes(H.imya(u))).length;
  const { body } = H.chasti(doc);
  const metaBody = H.elementy(body, (u) => H.imya(u) === 'meta').length;
  const js = H.elementy(doc, (u) => (u.attrs ?? []).some((a) => /^\s*javascript:/i.test(a.value) || a.name === 'srcdoc')).length;
  console.log(url.padEnd(24), JSON.stringify({ deti, template: tenevye, iframe_i_prochie: nositeli, meta_v_body: metaBody, javascript_srcdoc: js }));
}
