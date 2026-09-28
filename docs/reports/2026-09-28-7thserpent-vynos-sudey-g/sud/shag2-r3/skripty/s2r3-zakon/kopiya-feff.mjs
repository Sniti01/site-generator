// Копия /remake/ с U+FEFF вместо пробелов в подписи (опыт 2) — для просмотра через server.mjs.
import { readFileSync, writeFileSync } from 'node:fs';

const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r3/s2r3-zakon';
const PODPIS = /(<p class="podpis-geroya t-caption" data-astro-cid-[a-z0-9]+>)([\s\S]*?)(<\/p>)/;
const h = readFileSync(`${REF}/remake/index.html`, 'utf8');
const p = h.replace(PODPIS, (m, a, t, b) => a + t.replace(/ /g, '\uFEFF') + b);
if (p === h) throw new Error('порча не применилась');
writeFileSync(`${PAPKA}/remake-feff.html`, p);
console.log('готово');
