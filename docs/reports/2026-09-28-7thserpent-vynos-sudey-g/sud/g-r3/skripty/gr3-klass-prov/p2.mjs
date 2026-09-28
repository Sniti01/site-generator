// gr3-klass-prov: GR3-K-2 (псевдоним Vite) и свой член класса — PostCSS Vite после Tailwind (css.postcss в vite:
// astro.config.mjs или postcss.config.* в корне сайта). Сборка Vite одного листа global.css (репозиторий — только чтение)
// в свою папку; судья знака — на тех же входах.
import { writeFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(join(SAYT, 'package.json'));
const vite = await import(pathToFileURL(req.resolve('vite')).href);
const tailwindcss = (await import(pathToFileURL(req.resolve('@tailwindcss/vite')).href)).default;
const { sverka, wejscie } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');

const P = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/gr3/gr3-klass-prov/vite';
mkdirSync(join(P, 'koren'), { recursive: true });
writeFileSync(join(P, 'fake-600.css'), "@font-face { font-family: 'Bodoni Moda'; font-style: normal; font-weight: 600; src: local('Georgia'); }\n");
const GLOBAL = join(SAYT, 'src/styles/global.css');
const podmena = { postcssPlugin: 'podmena-bodoni', AtRule: { 'font-face': (r) => { if (/Bodoni Moda/.test(r.toString())) r.walkDecls('src', (d) => { d.value = "local('Georgia')"; }); } } };

async function sobrat(imya, dop) {
  const out = join(P, `out-${imya}`);
  await vite.build({
    configFile: false, logLevel: 'error', root: join(P, 'koren'), cacheDir: join(P, 'cache'), publicDir: false,
    plugins: [tailwindcss()], ...dop,
    build: { outDir: out, emptyOutDir: true, rollupOptions: { input: { global: GLOBAL } } },
  });
  const css = readdirSync(join(out, 'assets')).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(out, 'assets', f), 'utf8')).join('\n');
  const grani = [...css.matchAll(/@font-face\{[^}]*Bodoni Moda[^}]*\}/g)].map((m) => m[0].slice(0, 200));
  console.log(`=== ${imya}: граней Bodoni Moda ${grani.length}\n  ${grani.join('\n  ')}`);
}
await sobrat('kontrol', {});
await sobrat('alias', { resolve: { alias: [{ find: '@fontsource/bodoni-moda/latin-600.css', replacement: join(P, 'fake-600.css') }] } });
await sobrat('postcss-svoi', { css: { postcss: { plugins: [podmena] } } });
const { bledy } = await sverka({ ...wejscie(), publiczne: null });
console.log(`=== судья знака на тех же входах: ${bledy.length ? 'ОТКАЗ ' + bledy.join(' | ') : 'СВЕРЕНО'}`);
