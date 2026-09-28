// Копии /remake/ сборки в своей папке: чистая и с порчей .foto__credit (опыт 1). Адреса /_astro/ отдаёт server.mjs.
import { readFileSync, writeFileSync } from 'node:fs';

const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r3/s2r3-zakon';
const PODPIS = /(<p class="podpis-geroya t-caption" data-astro-cid-[a-z0-9]+>)([\s\S]*?)(<\/p>)/;
export const KREDIT = '<p class="foto__credit t-caption">Pictured: the official Max Payne cover art, publisher key art</p>';
const h = readFileSync(`${REF}/remake/index.html`, 'utf8');
writeFileSync(`${PAPKA}/remake-chistaya.html`, h);
const p = h.replace(PODPIS, (m) => KREDIT + m);
if (p === h) throw new Error('порча не применилась');
writeFileSync(`${PAPKA}/remake-kredit.html`, p);
console.log('готово', h.length, p.length);
