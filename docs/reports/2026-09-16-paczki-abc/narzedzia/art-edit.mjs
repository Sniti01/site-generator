// Правка art.json (CRLF, формат JSON.stringify(…, null, 2) — проверено round-trip).
//   node art-edit.mjs add <slots.json>          — добавить слоты (по id; существующий — заменить поля)
//   node art-edit.mjs set <id> <json-patch>     — слить поля в слот (например file, crop, subject)
//   node art-edit.mjs del <id>
import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/data/art.json';
const raw = readFileSync(path, 'utf8');
if ((raw.match(/(?<!\r)\n/g) || []).length) throw new Error('art.json: голые LF до правки');
const art = JSON.parse(raw);
const [cmd, a, b] = process.argv.slice(2);

if (cmd === 'add') {
  const slots = JSON.parse(readFileSync(a, 'utf8'));
  for (const s of slots) {
    const i = art.slots.findIndex((x) => x.id === s.id);
    if (i >= 0) art.slots[i] = { ...art.slots[i], ...s };
    else art.slots.push(s);
  }
} else if (cmd === 'set') {
  const s = art.slots.find((x) => x.id === a);
  if (!s) throw new Error('нет слота ' + a);
  Object.assign(s, JSON.parse(b));
} else if (cmd === 'del') {
  const i = art.slots.findIndex((x) => x.id === a);
  if (i < 0) throw new Error('нет слота ' + a);
  art.slots.splice(i, 1);
} else throw new Error('cmd?');

const out = JSON.stringify(art, null, 2).replace(/\n/g, '\r\n') + '\r\n';
if ((out.match(/(?<!\r)\n/g) || []).length) throw new Error('голые LF после правки');
writeFileSync(path, out);
console.log('art.json: слотов', art.slots.length);
