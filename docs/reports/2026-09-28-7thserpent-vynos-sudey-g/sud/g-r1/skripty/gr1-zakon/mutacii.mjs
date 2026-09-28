// GR1-Z: откат новых ветвей tools/znak.mjs (блок Г) мутацией в памяти (крюк загрузчика) — краснеет ли
// tools/testy/znak.test.mjs целиком. Файл на диске не трогается.
//   node mutacii.mjs
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const KRYUK = pathToFileURL(join(import.meta.dirname, 'kryuk-znak.mjs')).href;
const MUTACII = [
  { imya: 'контроль (без мутации)', iz: 'export const razekranirovat', na: 'export const razekranirovat' },
  { imya: 'M1 продолжение строки раскрывается пробелом, а не ничем', iz: "return nl ? '' : c ?? '';", na: "return nl ? ' ' : c ?? '';" },
  { imya: 'M2 0, суррогат, >U+10FFFF — не U+FFFD', iz: 'return n === 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff) ?', na: 'return false ?' },
  { imya: 'M3 сбой compile() Tailwind глотается (нет отказа)', iz: 'bledy.push(`гарнитура: Tailwind сайта не собрал', na: 'void (`гарнитура: Tailwind сайта не собрал' },
  { imya: 'M4 CSS-wide keywords — только initial', iz: "new Set(['initial', 'inherit', 'unset', 'revert', 'revert-layer', 'default'])", na: "new Set(['initial'])" },
  { imya: 'M5 ветвь tailwindcss/<подпуть> убрана', iz: "if (id.startsWith('tailwindcss/')) return", na: 'if (false) return' },
  { imya: 'M6 экранирование в элементах списка --font-display не читается', iz: 'const IDENT = ', na: 'const IDENT = /^-?[a-zA-Z_][-\\w]*/; const IDENT_X = ' },
  { imya: 'M7 экранирование в строке списка не пропускается', iz: "j += s[j] === '\\\\' ? 2 : 1;", na: 'j += 1;' },
  { imya: 'M8 имя правила без раскрытия экранирования', iz: "const prelude = razekranirovat(u.prelude ?? '').trim();", na: "const prelude = (u.prelude ?? '').trim();" },
  { imya: 'M9 имя гарнитуры без раскрытия экранирования', iz: 'const imyaGarnitury = (v) => razekranirovat(v)', na: 'const imyaGarnitury = (v) => String(v)' },
  { imya: 'M10 своя гарнитура — любое имя с «bodoni moda»', iz: "imyaGarnitury(d.wartosc) === 'bodoni moda'", na: "imyaGarnitury(d.wartosc).includes('bodoni moda')" },
  { imya: 'M11 сторож: папка сборки из хука не берётся (всегда dist/ сайта)', iz: 'const w = wejscie({ dist: fileURLToPath(dir) });', na: 'const w = wejscie({ dist: true });' },
  { imya: 'M12 сторож: отказ не роняет сборку', iz: "throw new Error(`Знак сайта разошёлся", na: "void (`Знак сайта разошёлся" },
  { imya: 'M13 --selftest отвечает кодом 0', iz: 'process.exit(2);', na: 'process.exit(0);' },
  { imya: 'M14 пустой элемент списка разрешён', iz: 'elementy.every((e) => e.length > 0 &&', na: 'elementy.every((e) => true &&' },
  { imya: 'M15 Tailwind не спрашивается', iz: 'const naStranice = await fontDisplayTailwind(w.css);', na: "const naStranice = [\"'Bodoni Moda'\"];" },
];
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const out = [];
for (const m of MUTACII) {
  const r = spawnSync(process.execPath, ['--import', KRYUK, '--test', '--test-reporter=spec', 'tools/testy/znak.test.mjs'], {
    cwd: SAYT,
    encoding: 'utf8',
    env: { ...ENV, ZNAK_MUTACIYA: JSON.stringify(m), FORCE_COLOR: '0', NO_COLOR: '1' },
    maxBuffer: 64 * 1024 * 1024,
  });
  const v = `${r.stdout}${r.stderr}`;
  const fail = /ℹ fail (\d+)/.exec(v)?.[1];
  const pass = /ℹ pass (\d+)/.exec(v)?.[1];
  const upavshie = v.split('\n').filter((l) => /^\s*✖ /.test(l)).map((l) => l.trim()).filter((l, k, a) => a.indexOf(l) === k).slice(0, 8);
  const neprim = v.includes('не применилась');
  out.push(`== ${m.imya}: ${neprim ? 'МУТАЦИЯ НЕ ПРИМЕНИЛАСЬ' : `pass ${pass}, fail ${fail} → ${fail === '0' ? 'ВЫЖИЛА (тест не краснеет)' : 'красный'}`}; код node ${r.status}${upavshie.length ? '\n   ' + upavshie.join('\n   ') : ''}`);
  console.log(out.at(-1));
}
writeFileSync(join(import.meta.dirname, 'mutacii.txt'), out.join('\n') + '\n');
