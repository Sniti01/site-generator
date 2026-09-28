// Малая страница для браузера: <main> героя /mods/ из сборки как есть + правила CSS сборки для героя, подписи, .foto__credit.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const D = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r3/s2r3-klass/';
const h = readFileSync(join(DIST, 'mods/index.html'), 'utf8');
const css = readFileSync(join(DIST, '_astro/CtaBand.BMbqpUCi.css'), 'utf8');
const vstr = (h.match(/<style>([\s\S]*?)<\/style>/) || [])[1];
const pravila = (css.match(/(@media[^{]*\{)?[^{}]*\{[^{}]*\}\}?/g) || []).filter((x) => /\.hero|\.foto|:root|\[hidden\]/.test(x)).join('');
const podpisCss = (vstr.match(/\.podpis-geroya\[[^}]*\}/) || [])[0];
const geroy = h.slice(h.indexOf('<main id="content">'), h.indexOf('<div class="byline'));
const stranica = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${pravila}${podpisCss}</style></head><body>${geroy}</main></body></html>`;
writeFileSync(join(D, 'mini.html'), stranica);
console.log(stranica.length, pravila.length, podpisCss);
