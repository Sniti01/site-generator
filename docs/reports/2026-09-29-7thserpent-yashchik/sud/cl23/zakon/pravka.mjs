// Проверка предлагаемого правила CL23-Z-1/2/3 на копии: pravka/sites/7thserpent.com/ — копия 30b3730 с правкой
// ветки «robots.txt без параметра» (вставки — pravka/vstavka-1.txt и vstavka-2.txt). Репозиторий не трогается.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-cl23-z';
const IZ = `${PAPKA}/sites/7thserpent.com`;
const V = `${PAPKA}/pravka/sites/7thserpent.com`;
for (const d of ['tools/testy', 'structure', 'public']) mkdirSync(`${V}/${d}`, { recursive: true });
for (const f of ['tools/testy/check-live.test.mjs', 'structure/structure.json', 'public/robots.txt']) copyFileSync(`${IZ}/${f}`, `${V}/${f}`);

let t = readFileSync(`${IZ}/tools/check-live.mjs`, 'utf8');
const EOL = t.includes('\r\n') ? '\r\n' : '\n';
const vstavka = (f) => readFileSync(`${PAPKA}/pravka/${f}`, 'utf8').replace(/\r?\n$/, '').split(/\r?\n/).join(EOL);
const odin = (metka) => {
  const i = t.indexOf(metka);
  if (i < 0 || t.indexOf(metka, i + 1) >= 0) throw new Error(`метка не одна: ${metka}`);
  const nachalo = t.lastIndexOf(EOL, i) + EOL.length;
  return [nachalo, t.indexOf(EOL, i)];
};
// 1: перед строкой «if (vred.length)» — сравнение без блоков хостера.
const [n1] = odin('    if (vred.length) [bezFakt, bezOtkuda]');
t = t.slice(0, n1) + vstavka('vstavka-1.txt') + EOL + t.slice(n1);
// 2: строка «не равен ответу мимо кэша и не из кэша … отдаёт не наш сервер» — ветка «только блок хостера» и новая подсказка.
const [n2, k2] = odin('else if (mimo.status === 200 && !keshBez) [bezFakt, bezOtkuda] = [false, `не равен ответу мимо кэша');
t = t.slice(0, n2) + vstavka('vstavka-2.txt') + t.slice(k2);
writeFileSync(`${V}/tools/check-live.mjs`, t);
console.log(`правка: EOL ${EOL === '\r\n' ? 'CRLF' : 'LF'}, файл ${V}/tools/check-live.mjs`);
