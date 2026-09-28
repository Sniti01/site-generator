// Мутации tools/znak.mjs в памяти (крюк загрузчика): краснеет ли tools/testy/znak.test.mjs целиком, и что судья
// с мутацией говорит на входах-последствиях (posledstvie.mjs). Файл на диске не трогается.
//   node mutacii.mjs
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const TUT = import.meta.dirname;
const KRYUK = pathToFileURL(join(TUT, 'kryuk.mjs')).href;
const MUTACII = [
  { imya: 'контроль', iz: '', na: '' },
  { imya: 'M1 продолжение строки → пробел', iz: "return nl ? '' : c ?? '';", na: "return nl ? ' ' : c ?? '';" },
  { imya: 'M2 без U+FFFD', iz: 'return n === 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff) ?', na: 'return false ?' },
  { imya: 'M3 catch compile() глотает', iz: 'bledy.push(`гарнитура: Tailwind сайта не собрал', na: 'void (`гарнитура: Tailwind сайта не собрал' },
  { imya: 'M4 CSS-wide — только initial', iz: "new Set(['initial', 'inherit', 'unset', 'revert', 'revert-layer', 'default'])", na: "new Set(['initial'])" },
  { imya: 'M5 ветвь tailwindcss/ убрана', iz: "if (id.startsWith('tailwindcss/')) return", na: 'if (false) return' },
  { imya: 'M6 IDENT без экранирования', iz: 'const IDENT = ', na: 'const IDENT = /^-?[a-zA-Z_][-\\w]*/; const IDENT_X = ' },
  { imya: 'M7 строка списка без пропуска экранирования', iz: "j += s[j] === '\\\\' ? 2 : 1;", na: 'j += 1;' },
  { imya: 'M13 --selftest кодом 0', iz: 'process.exit(2);', na: 'process.exit(0);' },
  { imya: 'N1 Tailwind не судит при любом отказе «гарнитура:»', iz: '/^(лист:|гарнитура: (--font-display|сброс|список))/', na: '/^(лист:|гарнитура:)/' },
  { imya: 'N2 every → some у вывода Tailwind', iz: "!naStranice.every((v) => /^(['\"])Bodoni Moda\\1\\s*(,|$)/.test(v))", na: "!naStranice.some((v) => /^(['\"])Bodoni Moda\\1\\s*(,|$)/.test(v))" },
  { imya: 'N3 ветвь относительного пути резолвера убрана', iz: "if (id.startsWith('.') || id.startsWith('/')) return resolve(base, id);", na: '' },
  { imya: 'N4 сторож: dist из хука, но без public', iz: 'const w = wejscie({ dist: fileURLToPath(dir) });', na: 'const w = { ...wejscie({ dist: fileURLToPath(dir) }), publiczne: null };' },
];
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const out = [];
for (const m of MUTACII) {
  const env = { ...ENV, PROV_MUTACIYA: JSON.stringify(m), FORCE_COLOR: '0', NO_COLOR: '1' };
  const r = spawnSync(process.execPath, ['--import', KRYUK, '--test', '--test-reporter=spec', 'tools/testy/znak.test.mjs'], { cwd: SAYT, encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 });
  const v = `${r.stdout}${r.stderr}`;
  const fail = /ℹ fail (\d+)/.exec(v)?.[1];
  const pass = /ℹ pass (\d+)/.exec(v)?.[1];
  const upavshie = [...new Set(v.split('\n').filter((l) => /^\s*✖ /.test(l)).map((l) => l.trim()))].slice(0, 6);
  const p = spawnSync(process.execPath, ['--import', KRYUK, join(TUT, 'posledstvie.mjs')], { cwd: TUT, encoding: 'utf8', env, maxBuffer: 16 * 1024 * 1024 });
  out.push(`== ${m.imya}: ${v.includes('не применилась') ? 'МУТАЦИЯ НЕ ПРИМЕНИЛАСЬ' : `pass ${pass}, fail ${fail} → ${fail === '0' ? 'ВЫЖИЛА' : 'красный'}`}; код ${r.status}${upavshie.length ? '\n   ✖ ' + upavshie.join('\n   ✖ ') : ''}\n${p.stdout}${p.stderr ? '   stderr: ' + p.stderr.split('\n')[0] : ''}`);
  console.log(out.at(-1).split('\n')[0]);
}
writeFileSync(join(TUT, 'mutacii.txt'), out.join('\n') + '\n');
