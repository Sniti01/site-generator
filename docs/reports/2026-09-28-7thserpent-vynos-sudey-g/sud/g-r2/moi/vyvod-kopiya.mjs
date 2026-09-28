// Грань пакета темы в выводе Tailwind, когда лист на другом диске (копия proverki во временной папке, node_modules — ссылки).
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const require = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const k = mkdtempSync(join(tmpdir(), 'znak-gr2-kopiya-'));
mkdirSync(join(k, 'node_modules'));
symlinkSync('D:/SEO/cloud/site-generator/node_modules/@fontsource', join(k, 'node_modules/@fontsource'), 'junction');
const styles = join(k, 'sites/s/src/styles');
mkdirSync(styles, { recursive: true });
const cssPut = join(styles, 'global.css');
const css = "@import '@fontsource/bodoni-moda/latin-600.css';";
writeFileSync(cssPut, css);
const c = await twNode.compile(css, { base: styles, from: cssPut, shouldRewriteUrls: true, onDependency: () => {} });
console.log(twNode.optimize(c.build([]), { minify: false }).code);
rmSync(join(k, 'node_modules/@fontsource'));
rmSync(k, { recursive: true });
