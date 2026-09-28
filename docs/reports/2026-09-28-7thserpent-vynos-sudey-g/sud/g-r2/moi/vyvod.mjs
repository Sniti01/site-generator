// Что выводит путь сборки Tailwind сайта на формах раунда 2 (K-1: @import url(), удалённый; грани пакета темы).
import { readFileSync, readdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const require = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const cssPut = join(SAYT, 'src/styles/global.css');
const vyvod = async (css) => {
  const c = await twNode.compile(css, { base: dirname(cssPut), from: cssPut, shouldRewriteUrls: true, onDependency: () => {} });
  return twNode.optimize(c.build([]), { minify: false }).code;
};
const d = mkdtempSync(join(tmpdir(), 'znak-gr2-'));
writeFileSync(join(d, 'zlo.css'), ':root { --font-display: Georgia, serif; }\n');
const put = (p) => p.replace(/\\/g, '/');
const SLUCHAI = {
  'import-url': `@import url('${put(join(d, 'zlo.css'))}');\n.a { color: red; }`,
  'import-udalennyi': '@import "https://fonts.example.net/zlo.css";\n.a { color: red; }',
  'import-v-media': "@media print { @import '@fontsource/bodoni-moda/latin-600.css'; }\n.a { color: red; }",
  'import-url-paketa': "@import url('@fontsource/bodoni-moda/latin-600.css');\n.a { color: red; }",
  'paket-latin-600': "@import '@fontsource/bodoni-moda/latin-600.css';",
  'paket-600': "@import '@fontsource/bodoni-moda/600.css';",
};
for (const [k, css] of Object.entries(SLUCHAI)) {
  let out;
  try { out = await vyvod(css); } catch (e) { out = `ОШИБКА: ${e.message.split('\n')[0]}`; }
  console.log(`=== ${k}\n${out.slice(0, 1500)}\n`);
}
const paket = dirname(require.resolve('@fontsource/bodoni-moda/latin-600.css'));
const vse = readdirSync(paket).filter((f) => f.endsWith('.css'));
const t0 = performance.now();
const vsyo = await vyvod(vse.map((f) => `@import '@fontsource/bodoni-moda/${f}';`).join('\n'));
console.log(`=== весь пакет: ${vse.length} листов, ${vsyo.length} знаков, граней ${(vsyo.match(/@font-face/g) || []).length}, ${Math.round(performance.now() - t0)} мс`);
console.log(`global.css сайта: @import в выводе — ${(await vyvod(readFileSync(cssPut, 'utf8'))).match(/@import/g)?.length ?? 0}`);
