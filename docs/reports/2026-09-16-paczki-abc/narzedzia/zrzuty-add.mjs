// Дописывает записи zrzuty в games.json (CRLF, стиль файла — games-ser.mjs, round-trip проверен).
//   node zrzuty-add.mjs <picks.json>   — [{ slot, i, opis }]; ss берётся из input/kadry/<slot>/lista.json
import { readFileSync, writeFileSync } from 'node:fs';
import { serialize } from './games-ser.mjs';

const path = 'src/data/games.json';
const raw = readFileSync(path, 'utf8');
if ((raw.match(/(?<!\r)\n/g) || []).length) throw new Error('games.json: голые LF до правки');
const m = JSON.parse(raw);
if (serialize(m) !== raw) throw new Error('games.json: сериализатор не воспроизводит файл — стоп');

const picks = JSON.parse(readFileSync(process.argv[2], 'utf8'));
let added = 0;
for (const p of picks) {
  const g = m.games.find((x) => (x.slot ?? x.era) === p.slot);
  if (!g) throw new Error('нет слота ' + p.slot);
  const lista = JSON.parse(readFileSync(`input/kadry/${p.slot}/lista.json`, 'utf8'));
  const z = lista.zrzuty.find((x) => x.i === p.i);
  if (!z) throw new Error(`нет кадра [${p.i}] у ${p.slot}`);
  g.zrzuty ??= [];
  if (g.zrzuty.some((x) => x.i === p.i)) {
    console.log(`есть уже ${p.slot} [${p.i}]`);
    continue;
  }
  g.zrzuty.push({ i: p.i, ss: z.ss, opis: p.opis });
  g.zrzuty.sort((a, b) => a.i - b.i);
  added += 1;
}
const out = serialize(m);
if ((out.match(/(?<!\r)\n/g) || []).length) throw new Error('голые LF после правки');
writeFileSync(path, out);
console.log('games.json: добавлено', added);
