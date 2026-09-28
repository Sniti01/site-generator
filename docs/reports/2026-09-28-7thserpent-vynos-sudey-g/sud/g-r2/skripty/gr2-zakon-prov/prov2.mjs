// GR2-Z-2: откуда кандидат с --font-display при сканировании корня сайта (как плагин Vite при root === null).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(`${SAYT}/package.json`);
const viteReq = createRequire(req.resolve('@tailwindcss/vite'));
const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);
const sc = new Scanner({ sources: [{ base: SAYT, pattern: '**/*', negated: false }] });
const kand = sc.scan();
console.log('кандидатов:', kand.length, 'с font-display:', kand.filter((k) => k.includes('font-display')));
const faily = sc.files.filter((f) => { try { return readFileSync(f, 'utf8').includes('--font-display:Georgia'); } catch { return false; } });
console.log('файлов зоны:', sc.files.length, '; с «--font-display:Georgia»:', faily);
console.log('tools/testy в зоне:', sc.files.filter((f) => /tools[\\/]testy/.test(f)));
