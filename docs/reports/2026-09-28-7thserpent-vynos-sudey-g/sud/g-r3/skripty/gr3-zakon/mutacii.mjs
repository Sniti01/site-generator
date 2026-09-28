// Мутанты новых ветвей tools/znak.mjs (раунды 1–2 блока Г и шаг 3): исходник подменяется в памяти крюком загрузчика
// (g/kryuk-znak.mjs), прогон — весь tools/testy/znak.test.mjs. Журнал: по мутанту — сколько упало и что.
//   node mutacii.mjs <журнал>
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const KRYUK = pathToFileURL(join(import.meta.dirname, '../../g/kryuk-znak.mjs')).href;
const ISH = readFileSync(join(SAYT, 'tools/znak.mjs'), 'utf8');
const M = [
  ['M1 нераскрытый @import не судится', "if (u.oper && /^@import\\b/i.test(p)) neRaskryty.push(u.prelude);", 'if (false) neRaskryty.push(u.prelude);'],
  ['M2 обход вывода без вложенных блоков', '            obojti(u.children ?? []);\n', '\n'],
  ['M3 @property --font-display на странице не судится', "=== '--font-display') registraciya.push", "=== '--nic') registraciya.push"],
  ['M4 чужая грань на странице не судится', 'const chuzhie = grani.filter((g) => !klyuchi.has(klyuchGrani(g.u)));', 'const chuzhie = [];'],
  ['M5 ключ грани без src', "const klyuchGrani = (u) => (u.decls ?? []).map(", "const klyuchGrani = (u) => (u.decls ?? []).filter((d) => d.imie.toLowerCase() !== 'src').map("],
  ['M6 пакет темы — только лист темы', "readdirSync(papka).filter((f) => f.endsWith('.css'))", "readdirSync(papka).filter((f) => f === 'latin-600.css')"],
  ['M7 каждая грань — «тема»', 'const tema = src.length === srcTemy.length && src.every((s, k) => s === srcTemy[k]);', 'const tema = true;'],
  ['M8 перехват и у чужих граней', 'if (!tema && klyuchi.has(klyuchGrani(g.u))) perehvat', 'if (!tema) perehvat'],
  ['M9 грань в блоке отнимает знаки', 'if (!g.vlozhena) ostatok = bez(ostatok, vzyala);', 'ostatok = bez(ostatok, vzyala);'],
  ['M10 знаки не отнимаются', 'if (!g.vlozhena) ostatok = bez(ostatok, vzyala);', ''],
  ['M11 роль темы не отбирается', 'if (!dlyaRoliTemy(g.u)) continue;', ''],
  ['M12 курсив годится для роли', "if (deskriptor(u, 'font-style') === 'italic') return false;", ''],
  ['M13 любой вес годится для роли', 'return Math.min(a, b) <= 600 && 600 <= Math.max(a, b);', 'return true;'],
  ['M14 вес не числом — не годится', 'if (!m) return true;', 'if (!m) return false;'],
  ['M15 unicode-range не читается (весь Юникод)', 'if (v === null) return VSE_ZNAKI;', 'return VSE_ZNAKI;'],
  ['M16 нечитаемый unicode-range — ни одного знака', "if (!m || (m[2] && m[1].includes('?')) || !/^[0-9a-f]*\\?*$/i.test(m[1])) return VSE_ZNAKI;", "if (!m || (m[2] && m[1].includes('?')) || !/^[0-9a-f]*\\?*$/i.test(m[1])) return [];"],
  ['M17 unicode-range: «?» не раскрывается', "parseInt(m[1].replace(/\\?/g, 'f'), 16)", "parseInt(m[1].replace(/\\?/g, '0'), 16)"],
  ['M18 грань берёт весь остаток (без unicode-range)', "const vzyala = peresech(ostatok, diapazony(deskriptor(g.u, 'unicode-range')));", 'const vzyala = ostatok;'],
  ['M19 CDO/CDC — и после текста в буфере', 'if (glub === 0 && !bufer.trim() && (', 'if (glub === 0 && ('],
  ['M20 root null — сканер пуст', "c.root === null ? [{ base: siteRoot, pattern: '**/*', negated: false }]", 'c.root === null ? []'],
  ['M21 root none — корень сайта', "c.root === 'none' ? []", "c.root === 'none' ? [{ base: siteRoot, pattern: '**/*', negated: false }]"],
  ['M22 нечитаемый вывод не судится', 'if (nechitaemo.length) bledy.push(', 'if (false) bledy.push('],
  ['M23 сторож роняет только на иконках', "        if (bledy.length) {\n          logger.error", "        if (bledy.some((b) => /^(public|dist)\\//.test(b))) {\n          logger.error"],
  ['M24 имя в обходе вывода — без раскрытия экранирования', "            const p = razekranirovat(u.prelude ?? '').trim();", "            const p = (u.prelude ?? '').trim();"],
  ['M25 ключ грани без сортировки', ".sort().join('; ');", ".join('; ');"],
  ['M26 пропуск оракула только по «лист:»', "if (!bledy.some((b) => /^(лист:|гарнитура: (--font-display|сброс|список))/.test(b))) {", "if (!bledy.some((b) => /^(лист:)/.test(b))) {"],
  ['контроль K1 всё сломано: sverka без отказов', 'return { bledy, pliki, kraski };\n}', 'return { bledy: [], pliki, kraski };\n}'],
];
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const out = [];
for (const [imya, iz, na] of M) {
  const n = ISH.split(iz).length - 1;
  if (n !== 1) { out.push(`== ${imya}: мутация встречается ${n} раз — пропущена`); continue; }
  const r = spawnSync(process.execPath, ['--import', KRYUK, '--test', '--test-reporter=spec', 'tools/testy/znak.test.mjs'], {
    cwd: SAYT, encoding: 'utf8', env: { ...ENV, ZNAK_MUTACIYA: JSON.stringify({ imya, iz, na }), FORCE_COLOR: '0', NO_COLOR: '1' }, maxBuffer: 64 * 1024 * 1024,
  });
  const v = `${r.stdout}${r.stderr}`;
  const fail = /ℹ fail (\d+)/.exec(v)?.[1] ?? '?';
  const upali = [...new Set(v.split('\n').filter((l) => /^\s*✖ /.test(l)).map((l) => l.trim().replace(/\s*\([\d.]+ms\)$/, '')))];
  out.push(`== ${imya}: упало ${fail}; код ${r.status}${fail === '0' ? '  ← ЖИВ' : ''}${fail === '?' ? `\n${v.slice(0, 600)}` : ''}`);
  for (const l of upali.slice(0, 8)) out.push(`   ${l}`);
}
writeFileSync(process.argv[2], out.join('\n') + '\n');
console.log(out.filter((s) => s.startsWith('==')).join('\n'));
