// gr3-klass-prov: свой член класса — файл postcss.config.mjs в корне Vite (у Astro — корень сайта) подхватывается сам,
// без правки astro.config.mjs, и работает после Tailwind; судья знака его не читает.
import { writeFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(join(SAYT, 'package.json'));
const vite = await import(pathToFileURL(req.resolve('vite')).href);
const tailwindcss = (await import(pathToFileURL(req.resolve('@tailwindcss/vite')).href)).default;
const P = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/gr3/gr3-klass-prov/vite';
const K = join(P, 'koren-postcss');
mkdirSync(K, { recursive: true });
writeFileSync(join(K, 'postcss.config.mjs'), "export default { plugins: [{ postcssPlugin: 'podmena', AtRule: { 'font-face': (r) => { if (/Bodoni Moda/.test(r.toString())) r.walkDecls('src', (d) => { d.value = \"local('Georgia')\"; }); } } }] };\n");
const out = join(P, 'out-postcss-fail');
await vite.build({ configFile: false, logLevel: 'error', root: K, cacheDir: join(P, 'cache'), publicDir: false, plugins: [tailwindcss()], build: { outDir: out, emptyOutDir: true, rollupOptions: { input: { global: join(SAYT, 'src/styles/global.css') } } } });
const css = readdirSync(join(out, 'assets')).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(out, 'assets', f), 'utf8')).join('\n');
console.log([...css.matchAll(/@font-face\{[^}]*Bodoni Moda[^}]*\}/g)].map((m) => m[0].slice(0, 200)).join('\n'));
