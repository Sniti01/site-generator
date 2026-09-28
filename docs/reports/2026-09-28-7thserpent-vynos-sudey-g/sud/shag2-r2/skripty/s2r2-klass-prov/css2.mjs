// Все вхождения классов шапки в CSS сборки с окружением правила (селектор и тело), по порядку.
import { readFileSync } from 'node:fs';
const css = readFileSync('C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28/_astro/CtaBand.BMbqpUCi.css', 'utf8');
for (const k of ['hdr__burger-close', 'hdr__drawer', 'hdr__nav[']) {
  let i = -1;
  while ((i = css.indexOf(k, i + 1)) !== -1) {
    const nach = Math.max(css.lastIndexOf('}', i), 0);
    const kon = css.indexOf('}', i);
    const pred = css.slice(Math.max(0, nach - 40), nach + 1);
    console.log(`${k} @${i}: …${pred}| ${css.slice(nach + 1, kon + 1)}`);
  }
}
