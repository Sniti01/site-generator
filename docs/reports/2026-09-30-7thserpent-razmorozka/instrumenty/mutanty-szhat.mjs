// Мутанты скептика — только изменённые файлы (сессия 25): node mutanty-szhat.mjs <папка материалов скептика> <копия коммита>
// В каждой папке `mutant-*/` материалов удаляются файлы, побайтно равные тому же пути в копии файлов коммита под судом
// (`kopiya-suda.mjs`): остаются только файлы, которые мутант изменил. Печать — что осталось у каждого мутанта.
import { readdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join, relative, isAbsolute } from 'node:path';

const [papka, kopiya] = process.argv.slice(2);
if (!papka || !kopiya || !isAbsolute(papka) || !isAbsolute(kopiya)) {
  console.error('node mutanty-szhat.mjs <абсолютная папка материалов скептика> <абсолютная папка копии коммита>');
  process.exit(2);
}
const fajly = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fajly(join(d, e.name)) : [join(d, e.name)]));
for (const m of readdirSync(papka, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name.startsWith('mutant-'))) {
  const koren = join(papka, m.name);
  const ostalos = [];
  for (const f of fajly(koren)) {
    const put = relative(koren, f);
    const obrazec = join(kopiya, put);
    if (existsSync(obrazec) && readFileSync(obrazec).equals(readFileSync(f))) rmSync(f);
    else ostalos.push(put.replace(/\\/g, '/'));
  }
  // Пустые папки после удаления.
  const pustye = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) pustye(join(d, e.name));
    if (!readdirSync(d).length) rmSync(d, { recursive: true });
  };
  pustye(koren);
  console.log(`${m.name}: осталось ${ostalos.length} — ${ostalos.join(', ') || '—'}`);
}
