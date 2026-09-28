// Свои мутанты ветвей правки раунда 2 блока Г (до раунда 3 «судью судят»): znak.mjs подменяется в памяти крюком
// загрузчика (g/kryuk-znak.mjs), прогон — весь tools/testy/znak.test.mjs. Мутант обязан уронить хотя бы один тест;
// строка мутации в исходнике — ровно одна.
//   node gr2/moi/mutacii.mjs <журнал>
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const KRYUK = pathToFileURL(join(import.meta.dirname, '../../g/kryuk-znak.mjs')).href;
const ISHODNIK = readFileSync(join(SAYT, 'tools/znak.mjs'), 'utf8');
const MUTACII = [
  ['M1 K-1: нераскрытый @import не судится', 'if (u.oper && /^@import\\b/i.test(p)) neRaskryty.push(u.prelude);', ''],
  ['M2 K-2: @property --font-display в выводе не судится', "?.[1] === '--font-display') registraciya.push", "?.[1] === '--nichego') registraciya.push"],
  ['M3 K-3: грани не из пакета не судятся', 'const chuzhie = grani.filter((g) => !klyuchi.has(klyuchGrani(g.u)));', 'const chuzhie = [];'],
  ['M4 Z-1: перехват не судится', 'if (!tema && klyuchi.has(klyuchGrani(g.u))) perehvat.push(', 'if (false) perehvat.push('],
  ['M5 Z-1: грань в блоке отнимает знаки', 'if (!g.vlozhena) ostatok = bez(ostatok, vzyala);', 'ostatok = bez(ostatok, vzyala);'],
  ['M6 Z-1: italic годится для роли темы', "if (deskriptor(u, 'font-style') === 'italic') return false;", ''],
  ['M7 Z-1: любой вес годится для роли темы', 'return Math.min(a, b) <= 600 && 600 <= Math.max(a, b);', 'return true;'],
  ['M8 Z-1: unicode-range не читается (весь Юникод)', 'if (v === null) return VSE_ZNAKI;', 'return VSE_ZNAKI;'],
  ['M9 Z-1: прямой порядок вместо обратного', 'for (const g of [...grani].reverse()) {', 'for (const g of [...grani]) {'],
  ['M10 Z-1: любой src — src темы', 'const tema = src.length === srcTemy.length && src.every((s, k) => s === srcTemy[k]);', 'const tema = true;'],
  ['M11 Z-3: CDO/CDC где угодно на верхнем уровне', "if (glub === 0 && !bufer.trim() && (s.startsWith('<!--', i)", "if (glub === 0 && (s.startsWith('<!--', i)"],
  ['M12 GR1-K-5: CDO/CDC не судится', "|| s.startsWith('-->', i))) cdo = true;", "|| s.startsWith('-->', i))) cdo = false;"],
  ['M13 Z-7: «npm run znak» всегда', "${tolkoIkonki ? 'npm run znak, затем сборка.' :", "${true ? 'npm run znak, затем сборка.' :"],
  ['M14 Z-1: пропуск оракула по импорту гарнитуры (прежний)', "/^(лист:|гарнитура: (--font-display|сброс|список))/", "/^(лист:|гарнитура: (--font-display|сброс|список|среди операторов|импорт Бодони))/"],
];
// M15 (bold и normal годятся для роли темы) первого прогона — эквивалентный мутант для граней пакета: ветвь убрана
// из znak.mjs (вес не числом — годится, запас), мутанта больше нет.
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const out = [];
for (const [imya, iz, na] of MUTACII) {
  const n = ISHODNIK.split(iz).length - 1;
  if (n !== 1) { out.push(`== ${imya}: строка мутации встречается ${n} раз — не запускаю`); continue; }
  const r = spawnSync(process.execPath, ['--import', KRYUK, '--test', '--test-reporter=spec', 'tools/testy/znak.test.mjs'], {
    cwd: SAYT,
    encoding: 'utf8',
    env: { ...ENV, ZNAK_MUTACIYA: JSON.stringify({ imya, iz, na }), FORCE_COLOR: '0', NO_COLOR: '1' },
    maxBuffer: 64 * 1024 * 1024,
  });
  const v = `${r.stdout}${r.stderr}`;
  const l = v.split('\n');
  const k = l.findIndex((x) => /failing tests:/.test(x));
  const upali = l.slice(0, k < 0 ? l.length : k).filter((x) => /^\s*✖ /.test(x)).map((x) => x.trim());
  const itog = l.filter((x) => /^ℹ (tests|pass|fail)/.test(x)).join('; ');
  out.push(`== ${imya}: ${/ℹ fail 0\b/.test(v) ? 'НЕ упал ни один тест' : 'КРАСНЫЙ'} — ${itog}; код node ${r.status}`);
  out.push(upali.slice(0, 12).map((x) => `   ${x}`).join('\n'));
}
writeFileSync(process.argv[2], out.join('\n') + '\n');
console.log(out.filter((s) => s.startsWith('==')).join('\n'));
