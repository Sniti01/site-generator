// Самопроверка скептика: запретное сочетание (собрано из кодов знаков) в своих скриптах и выводах папки — счёт по файлам.
// Копия сайта и рабочие папки не смотрятся (там чужой код и вывод git).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const S = String.fromCharCode(115, 101, 100);
const out = [];
for (const imya of readdirSync(PAPKA).sort()) {
  const f = join(PAPKA, imya);
  if (!statSync(f).isFile() || !/\.(mjs|txt)$/.test(imya)) continue;
  const t = readFileSync(f, 'utf8').toLowerCase();
  const n = t.split(S).length - 1;
  out.push(`${n === 0 ? 'чисто' : `НАЙДЕНО ${n}`} — ${imya}`);
}
const vyvod = `${out.join('\n')}\n`;
writeFileSync(join(PAPKA, 'proverka-podstroki.txt'), vyvod);
console.log(vyvod);
