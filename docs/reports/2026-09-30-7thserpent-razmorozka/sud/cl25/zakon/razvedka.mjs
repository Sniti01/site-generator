// Разведка: байты блока хостера и прежнего файла из образца сессии 24; байты файла владельца.
import { readFileSync, writeFileSync } from 'node:fs';
const K = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-cl25/zakon/kopiya/sites/7thserpent.com';
const O = JSON.parse(readFileSync(`${K}/tools/testy/obrazec-khostera.json`, 'utf8'));
const out = [];
const telo = O.otvety[`https://www.7thserpent.com/robots.txt?live-check=${O.metka}`].telo;
const KON = '# END adm.tools Managed content\n\n';
const blok = telo.slice(0, telo.indexOf(KON) + KON.length);
out.push('== блок хостера (JSON-строкой) ==', JSON.stringify(blok), `байт ${Buffer.byteLength(blok)}`);
out.push('== прежний файл (JSON-строкой) ==', JSON.stringify(telo.slice(blok.length)));
out.push('== пары образца 24: ключи ==', JSON.stringify(Object.keys(O)), JSON.stringify(O.robotsPary.map((p) => ({ para: p.para, s: p.s.status, bez: p.bez.status }))));
const nash = readFileSync(`${K}/public/robots.txt`);
out.push('== файл владельца ==', `байт ${nash.length}, CR ${[...nash].filter((b) => b === 13).length}, последний байт ${nash[nash.length - 1]}`);
out.push('== адреса ответов образца 24 ==', ...Object.keys(O.otvety));
writeFileSync('C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-cl25/zakon/razvedka-vyvod.txt', out.join('\n') + '\n');
