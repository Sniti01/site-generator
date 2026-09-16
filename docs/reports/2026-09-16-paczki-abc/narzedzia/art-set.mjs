// Ставит/заменяет `art:` у рядов файла содержания (CRLF), прямой записью строк.
//   node art-set.mjs <plan.json>  — [{ file: "assassins-creed-1.md", rows: { "fabula": "jerozolima-k03", ... } }]
// Проверки: файл CRLF без голых LF; ряд найден ровно один раз; ключ существует в src/assets/gry|foto.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const plan = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (const p of plan) {
  const path = `src/content/tresc/${p.file}`;
  const raw = readFileSync(path, 'utf8');
  if ((raw.match(/(?<!\r)\n/g) || []).length) throw new Error(`${p.file}: голые LF`);
  const lines = raw.split('\r\n');
  const changes = [];
  for (const [id, key] of Object.entries(p.rows)) {
    if (!existsSync(`src/assets/gry/${key}.jpg`) && !existsSync(`src/assets/foto/${key}.jpg`)) throw new Error(`${p.file}: нет файла для ключа ${key}`);
    const starts = lines.map((l, i) => (l === `  - id: ${id}` ? i : -1)).filter((i) => i >= 0);
    if (starts.length !== 1) throw new Error(`${p.file}: ряд ${id} найден ${starts.length} раз`);
    const s = starts[0];
    let e = s + 1;
    while (e < lines.length && !/^  - id: /.test(lines[e]) && !/^[a-z]/.test(lines[e]) && lines[e] !== '---') e += 1;
    const block = lines.slice(s, e);
    const artIdx = block.findIndex((l) => /^    art: /.test(l));
    if (artIdx >= 0) {
      changes.push(`${id}: ${block[artIdx].trim()} → art: ${key}`);
      lines[s + artIdx] = `    art: ${key}`;
    } else {
      let anchor = block.findIndex((l) => /^    meta: /.test(l));
      if (anchor < 0) anchor = block.findIndex((l) => /^    title: /.test(l));
      if (anchor < 0) throw new Error(`${p.file}: у ряда ${id} нет meta/title`);
      // meta может быть многострочным (>-)? — проверяем, что следующая строка — поле, а не продолжение
      let ins = s + anchor + 1;
      while (ins < e && /^      /.test(lines[ins])) ins += 1;
      lines.splice(ins, 0, `    art: ${key}`);
      e += 1;
      changes.push(`${id}: + art: ${key}`);
    }
  }
  const out = lines.join('\r\n');
  if ((out.match(/(?<!\r)\n/g) || []).length) throw new Error(`${p.file}: голые LF после`);
  writeFileSync(path, out);
  console.log(p.file + ': ' + changes.join('; '));
}
