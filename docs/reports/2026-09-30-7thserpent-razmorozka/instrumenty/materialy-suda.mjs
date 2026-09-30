// Материалы скептика в папку доклада (сессия 25): node materialy-suda.mjs <папка скептика вне репозитория> <папка в материалах>
// Все файлы папки скептика, кроме `kopiya/` (копия файлов коммита под судом — она в git и так), — байтами в папку материалов;
// окончания не трогаются. Печать — число файлов и байтов.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, dirname, isAbsolute } from 'node:path';

const [iz, v] = process.argv.slice(2);
if (!iz || !v || !isAbsolute(iz) || !isAbsolute(v)) {
  console.error('node materialy-suda.mjs <абсолютная папка скептика> <абсолютная папка в материалах>');
  process.exit(2);
}
const fajly = [];
const obhod = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) {
      if (relative(iz, p).replace(/\\/g, '/') !== 'kopiya') obhod(p);
    } else fajly.push(p);
  }
};
obhod(iz);
let bajt = 0;
for (const f of fajly) {
  const b = readFileSync(f);
  const cel = join(v, relative(iz, f));
  mkdirSync(dirname(cel), { recursive: true });
  writeFileSync(cel, b);
  bajt += b.length;
}
console.log(`файлов ${fajly.length}, байт ${bajt}: ${fajly.map((f) => relative(iz, f).replace(/\\/g, '/')).join(', ')}`);
