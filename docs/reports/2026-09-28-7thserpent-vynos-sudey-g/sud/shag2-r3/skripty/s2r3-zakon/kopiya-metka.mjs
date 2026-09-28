// Копия /remake/ с меткой маршрута у section.hero вместо метки блока героя (опыт 3) — для просмотра через server.mjs.
import { readFileSync, writeFileSync } from 'node:fs';

const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r3/s2r3-zakon';
const h = readFileSync(`${REF}/remake/index.html`, 'utf8');
const p = h.replace(/(<section class="hero" aria-labelledby="page-title") data-astro-cid-[a-z0-9]+>/, '$1 data-astro-cid-n67f4zmd>');
if (p === h) throw new Error('порча не применилась');
writeFileSync(`${PAPKA}/remake-metka.html`, p);
console.log('готово');
