// Набор знаков файла темы (fontkitten) и порядок граней в выводе 600.css — для правила «перехват начертания темы».
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const require = createRequire(join(SAYT, 'package.json'));
const fk = await import(pathToFileURL(require.resolve('fontkitten')).href);
const papka = join(dirname(require.resolve('@fontsource/bodoni-moda/latin-600.css')), 'files');
const font = fk.create(readFileSync(join(papka, 'bodoni-moda-latin-600-normal.woff')));
const nabor = font.characterSet;
console.log('characterSet:', Array.isArray(nabor), nabor?.length);
const hex = (n) => n.toString(16).toUpperCase().padStart(4, '0');
const intervaly = [];
for (const n of [...nabor].sort((a, b) => a - b)) {
  const p = intervaly.at(-1);
  if (p && n === p[1] + 1) p[1] = n; else intervaly.push([n, n]);
}
console.log(intervaly.map(([a, b]) => (a === b ? hex(a) : `${hex(a)}-${hex(b)}`)).join(','));
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const cssPut = join(SAYT, 'src/styles/global.css');
const c = await twNode.compile("@import '@fontsource/bodoni-moda/600.css';", { base: dirname(cssPut), from: cssPut, shouldRewriteUrls: true, onDependency: () => {} });
const out = twNode.optimize(c.build([]), { minify: false }).code;
console.log('порядок граней 600.css:', [...out.matchAll(/bodoni-moda-([a-z-]+)-600-normal\.woff2/g)].map((m) => m[1]).join(', '));
const tl = readFileSync(join(SAYT, 'src/styles/global.css'), 'utf8');
console.log('font-weight в global.css:', [...tl.matchAll(/font-weight:[^;]*;/g)].map((m) => m[0]).join(' | '));
