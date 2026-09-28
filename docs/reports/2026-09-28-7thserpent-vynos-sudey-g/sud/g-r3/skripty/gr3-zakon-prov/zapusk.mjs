// (1) Случаи proba.mjs под мутантами; (2) мутанты против всего tools/testy/znak.test.mjs (node --test с крюком, как g/mutacii-znak.mjs).
//   node zapusk.mjs <журнал> [testy]
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const P = import.meta.dirname;
const KRYUK = pathToFileURL(join(P, 'kryuk.mjs')).href;
const ISH = readFileSync(join(SAYT, 'tools/znak.mjs'), 'utf8');
const CSS_IZ = "css: readFileSync(join(siteRoot, 'src/styles/global.css'), 'utf8'),";
const CSS_NA = "css: readFileSync(join(siteRoot, 'src/styles/global.css'), 'utf8') + '\\n.ft { --accent: #ff0000; }\\n',";
const M = {
  M14: [['if (!m) return true;', 'if (!m) return false;']],
  M16: [["if (!m || (m[2] && m[1].includes('?')) || !/^[0-9a-f]*\\?*$/i.test(m[1])) return VSE_ZNAKI;", "if (!m || (m[2] && m[1].includes('?')) || !/^[0-9a-f]*\\?*$/i.test(m[1])) return [];"]],
  M17: [["parseInt(m[1].replace(/\\?/g, 'f'), 16)", "parseInt(m[1].replace(/\\?/g, '0'), 16)"]],
  M20: [["c.root === null ? [{ base: siteRoot, pattern: '**/*', negated: false }]", 'c.root === null ? []']],
  M21: [["c.root === 'none' ? []", "c.root === 'none' ? [{ base: siteRoot, pattern: '**/*', negated: false }]"]],
  M23: [["        if (bledy.length) {\n          logger.error", "        if (bledy.some((b) => /^(public|dist)\\//.test(b))) {\n          logger.error"]],
  K1: [['return { bledy, pliki, kraski };\n}', 'return { bledy: [], pliki, kraski };\n}']],
};
for (const [k, z] of Object.entries(M)) for (const [iz] of z) if (ISH.split(iz).length - 1 !== 1) throw new Error(`${k}: замена не единственна`);
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const run = (args, zameny, imya) => spawnSync(process.execPath, ['--import', KRYUK, ...args], {
  cwd: SAYT, encoding: 'utf8', env: { ...ENV, ZNAK_MUTACIYA: zameny.length ? JSON.stringify({ imya, zameny }) : '', FORCE_COLOR: '0', NO_COLOR: '1' }, maxBuffer: 64 * 1024 * 1024,
});
const out = [];
const PROBY = [
  ['z3-bez-source', [], 'настоящий'], ['z3-bez-source', M.M20, 'M20'],
  ['z3-none-src', [], 'настоящий'], ['z3-none-src', M.M21, 'M21'],
  ['z3-none-bez-source-voobshche', [], 'настоящий'], ['z3-none-bez-source-voobshche', M.M21, 'M21'],
  ['storozh', [], 'настоящий, чистый источник'],
  ['storozh', [[CSS_IZ, CSS_NA]], 'настоящий, .ft { --accent } в источнике'],
  ['storozh', [[CSS_IZ, CSS_NA], ...M.M23], 'M23, .ft { --accent } в источнике'],
];
for (const [sl, zameny, imya] of PROBY) {
  const r = run([join(P, 'proba.mjs'), sl], zameny, imya);
  out.push(`== ${sl} [${imya}] код ${r.status}\n${r.stdout.trim()}${r.stderr.trim() ? `\n   stderr: ${r.stderr.trim().slice(0, 300)}` : ''}`);
}
if (process.argv[3] === 'testy') {
  for (const k of ['K1', 'M14', 'M16', 'M17', 'M20', 'M21', 'M23']) {
    const r = run(['--test', '--test-reporter=spec', 'tools/testy/znak.test.mjs'], M[k], k);
    const v = `${r.stdout}${r.stderr}`;
    out.push(`== тесты под ${k}: pass ${/ℹ pass (\d+)/.exec(v)?.[1] ?? '?'}, fail ${/ℹ fail (\d+)/.exec(v)?.[1] ?? '?'}, todo ${/ℹ todo (\d+)/.exec(v)?.[1] ?? '?'}; код ${r.status}`);
  }
  const r = run(['--test', '--test-reporter=spec', 'tools/testy/znak.test.mjs'], [], 'без мутации');
  const v = `${r.stdout}${r.stderr}`;
  out.push(`== тесты без мутации: pass ${/ℹ pass (\d+)/.exec(v)?.[1] ?? '?'}, fail ${/ℹ fail (\d+)/.exec(v)?.[1] ?? '?'}, todo ${/ℹ todo (\d+)/.exec(v)?.[1] ?? '?'}; код ${r.status}`);
}
writeFileSync(process.argv[2], out.join('\n') + '\n');
console.log('готово');
