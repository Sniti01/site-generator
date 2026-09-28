// Куски разметки /remake/ для порч: герой, кнопки, связанные, призыв, подвал.
import { readFileSync } from 'node:fs';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const h = readFileSync(DIST + '/remake/index.html', 'utf8');
const kusok = (iz, dlina) => {
  const i = h.indexOf(iz);
  console.log(`--- ${iz} @${i}\n` + h.slice(i, i + dlina).replace(/srcset="[^"]*"/g, 'srcset="…"') + '\n');
};
kusok('<body', 400);
kusok('<main', 2600);
kusok('<section class="link-list', 700);
kusok('<section class="cta', 900);
kusok('<footer', 2200);
