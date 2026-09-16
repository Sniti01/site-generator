// Вставляет "блоки": [{ "block": "hero-key-art" }] в запись страницы pages-s2.json (LF) перед "related":
//   node s2-hero.mjs <url>
import { readFileSync, writeFileSync } from 'node:fs';
const p = 'structure/pages-s2.json';
let raw = readFileSync(p, 'utf8');
if (raw.includes('\r\n')) throw new Error('pages-s2.json: CRLF?');
const u = process.argv[2];
const i = raw.indexOf(`"url": "${u}"`);
if (i < 0) throw new Error('нет ' + u);
const j = raw.indexOf('"related":', i);
const entryEnd = raw.indexOf('\n    }', i);
if (j < 0 || j > entryEnd) throw new Error('нет related у ' + u);
if (raw.slice(i, entryEnd).includes('hero-key-art')) throw new Error('уже есть у ' + u);
const lineStart = raw.lastIndexOf('\n', j) + 1;
const indent = raw.slice(lineStart, j);
raw = raw.slice(0, lineStart) + indent + '"блоки": [{ "block": "hero-key-art" }],\n' + raw.slice(lineStart);
JSON.parse(raw);
writeFileSync(p, raw);
console.log('pages-s2.json: блок hero-key-art у ' + u);
