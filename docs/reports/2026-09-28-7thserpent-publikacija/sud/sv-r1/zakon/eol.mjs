// Окончания строк в текстовых файлах dist: есть ли CR, которые могли прийти из os.EOL Windows (а не из байтов git).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const D = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/dist';
const P = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/public';
const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));
const schet = (b) => ({ cr: b.filter((x) => x === 13).length, lf: b.filter((x) => x === 10).length });
let sCR = 0;
for (const f of obhod(D)) {
  if (!/\.(html|css|xml|txt|svg|js|json|webmanifest)$|\.htaccess$/.test(f)) continue;
  const r = relative(D, f).replace(/\\/g, '/');
  const { cr, lf } = schet(readFileSync(f));
  if (cr) { sCR += 1; }
  let iz = '';
  try { const pb = readFileSync(join(P, r)); iz = pb.equals(readFileSync(f)) ? ' (= public/ побайтно)' : ' (≠ public/)'; } catch { iz = ' (сгенерирован)'; }
  if (cr || /sitemap|\.htaccess|robots/.test(r)) console.log(`${r}: CR ${cr}, LF ${lf}${iz}`);
}
console.log(`ИТОГ: текстовых файлов dist с CR: ${sCR}`);
