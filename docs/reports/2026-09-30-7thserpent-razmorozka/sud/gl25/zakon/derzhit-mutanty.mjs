// ДЕРЖИТ (пробы охраняют законные формы): мутанты сторожа головы, каждый ломает законный проход; пробы копии обязаны
// упасть. Мутант пишется в копию сторожа (tools/storozha-vykladki.mjs копии — настоящая копия), прогон проб, затем
// исходные байты возвращаются; в конце — сверка sha256 с исходным.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const STOROZH = `${PAPKA}/kopiya/sites/7thserpent.com/tools/storozha-vykladki.mjs`;
const TEST = `${PAPKA}/kopiya/sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs`;
const ISKHOD = readFileSync(STOROZH);
const sha = (b) => createHash('sha256').update(b).digest('hex');
const SHA0 = sha(ISKHOD);
const tekst = ISKHOD.toString('utf8');

const zamena = (iz, v) => {
  const n = tekst.split(iz).length - 1;
  if (n !== 1) throw new Error(`образец для мутанта встречается ${n} раз: ${iz}`);
  return tekst.replace(iz, v);
};
const MUTANTY = [
  ['M1 CRLF вывода git — не допустим', "const stroki = String(tekst ?? '').replace(/\\r\\n?/g, '\\n').split('\\n').filter((s) => s.trim());", "const stroki = String(tekst ?? '').split('\\n').filter((s) => s.trim());"],
  ['M2 пустая строка в конце вывода — вторая строка', "const stroki = String(tekst ?? '').replace(/\\r\\n?/g, '\\n').split('\\n').filter((s) => s.trim());", "const stroki = String(tekst ?? '').replace(/\\r\\n?/g, '\\n').split('\\n');"],
  ['M3 любое предупреждение git — стоп', '  if (!g) {\n    return itog(false, [bezopasno(`СТОП: голову main не узнать', '  if (!g || osh) {\n    return itog(false, [bezopasno(`СТОП: голову main не узнать'],
  ['M4 без файла ошибок — ошибка входа', "else if (komanda === 'golova' && argi.length >= 1 && argi.length <= 2 && existsSync(argi[0])) {", "else if (komanda === 'golova' && argi.length === 2 && existsSync(argi[0]) && existsSync(argi[1])) {"],
  ['M5 вход отката на голове — «ОТКАТ» вместо прохода', '  if (kommit === g) return itog(true', '  if (kommit === g && !otkat) return itog(true'],
  ['M6 пустой вход отката — ошибка входа', "export function otkatIzVkhoda(znachenie) {\n  if (znachenie === undefined || znachenie === '' || znachenie === 'off') return false;", "export function otkatIzVkhoda(znachenie) {\n  if (znachenie === undefined || znachenie === 'off') return false;"],
];

const out = [`исходный сторож копии: sha256 ${SHA0}`];
try {
  for (const [imya, iz, v] of MUTANTY) {
    writeFileSync(STOROZH, zamena(iz, v));
    const r = spawnSync(process.execPath, ['--test', TEST], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const fail = Number(/ℹ fail (\d+)/.exec(r.stdout)?.[1] ?? NaN);
    const upavshie = [...r.stdout.matchAll(/^\s*✖ (.+?) \(\d/gm)].map((m) => m[1]).filter((x, i, a) => a.indexOf(x) === i);
    out.push('', `[${fail > 0 ? 'ПОЙМАН' : 'НЕ ПОЙМАН'}] ${imya}: упало ${fail}`, ...upavshie.slice(0, 4).map((x) => `  ✖ ${x}`));
  }
} finally {
  writeFileSync(STOROZH, ISKHOD);
}
const SHA1 = sha(readFileSync(STOROZH));
out.push('', `сторож копии возвращён: sha256 ${SHA1} — ${SHA1 === SHA0 ? 'равен исходному' : 'НЕ РАВЕН'}`);
const vyvod = `${out.join('\n')}\n`;
writeFileSync(join(PAPKA, 'derzhit-mutanty.txt'), vyvod);
console.log(vyvod);
