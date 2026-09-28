// Правила CSS сборки с hdr__burger-close / hdr__drawer / hdr__nav и display:none; какие страницы подключают файл.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const css = readFileSync(join(DIST, '_astro/CtaBand.BMbqpUCi.css'), 'utf8');
for (const k of ['hdr__burger-close', 'hdr__drawer', 'hdr__nav']) {
  const re = new RegExp(`(@media[^{]*\\{)?[^{}]*\\.${k}\\[data-astro-cid-qu2zoq4f\\][^{},]*\\{[^}]*\\}`, 'g');
  for (const m of css.match(re) ?? []) console.log(k, '::', m.slice(0, 200));
}
for (const url of ['remake', 'movie', 'media', 'mods', 'quotes', 'voice-and-face']) {
  const h = readFileSync(join(DIST, url, 'index.html'), 'utf8');
  console.log(url, h.includes('CtaBand.BMbqpUCi.css') ? 'подключает CtaBand' : 'НЕ подключает');
}
