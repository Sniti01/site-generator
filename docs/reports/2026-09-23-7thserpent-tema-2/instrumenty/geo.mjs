// node geo.mjs <run-папка> <strona...> — кладёт geometria.json из <strona>.sesja.json рядом с кадрами <strona>/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const [, , dir, ...strony] = process.argv;
for (const s of strony) {
  const src = join(dir, s + '.sesja.json');
  if (!existsSync(src)) { console.error('нет ' + src); process.exit(2); }
  const d = JSON.parse(readFileSync(src, 'utf8'));
  if (!d.geometria) { console.log(s + ': геометрии нет (visitor)'); continue; }
  writeFileSync(join(dir, s, 'geometria.json'), JSON.stringify(d.geometria, null, 2) + '\n');
  console.log(s + ': geometria.json, высота 1440 ' + d.geometria['1440'].высота + ', 390 ' + d.geometria['390'].высота);
}
