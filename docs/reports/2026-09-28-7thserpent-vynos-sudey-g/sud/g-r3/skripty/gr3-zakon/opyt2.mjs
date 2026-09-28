// (а) Что Tailwind сайта выводит на страницу при --font-display: 'Bodoni Moda', var(--font-serif): есть ли --font-serif.
// (б) Разрешатель листов: плагин @tailwindcss/vite передаёт compile() customCssResolver Vite (корень, алиасы),
//     судья — нет. Корень Vite `/src/...`: Vite разрешает от корня сайта, @tailwindcss/node — нет.
//   node opyt2.mjs > opyt2.txt
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(req.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);
const vite = await import(pathToFileURL(viteReq.resolve('vite')).href);
const CSS_PUT = join(SAYT, 'src/styles/global.css');

// (а)
const css = readFileSync(CSS_PUT, 'utf8').replace(/--font-display:[^;]*;/, "--font-display: 'Bodoni Moda', var(--font-serif);");
const c = await twNode.compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, shouldRewriteUrls: true, onDependency: () => {} });
const ist = [{ ...c.root, negated: false }, ...c.sources];
const kod = twNode.optimize(c.build(new Scanner({ sources: ist }).scan()), { minify: false }).code;
console.log('(а) объявления --font-display и --font-serif на странице:');
for (const m of kod.matchAll(/--font-(display|serif)\s*:[^;]*;/g)) console.log('   ', m[0]);
console.log('   font-family с var(--font-display):', [...kod.matchAll(/font-family:\s*var\(--font-display\)/g)].length);

// (б)
const config = await vite.resolveConfig({ root: SAYT, configFile: false, logLevel: 'silent' }, 'build');
const cssResolver = config.createResolver({ ...config.resolve, extensions: ['.css'], mainFields: ['style'], conditions: ['style', 'production'], tryIndex: false, preferRelative: true });
const importer = join(dirname(CSS_PUT), '__placeholder__.ts');
console.log('\n(б) разрешение «/src/styles/global.css» из папки global.css:');
console.log('    Vite (как плагин сборки):', await cssResolver('/src/styles/global.css', importer, false, false));
try {
  await twNode.compile("@import '/src/styles/global.css';", { base: dirname(CSS_PUT), from: CSS_PUT, shouldRewriteUrls: true, onDependency: () => {} });
  console.log('    @tailwindcss/node без customCssResolver (как судья): разрешил');
} catch (e) {
  console.log('    @tailwindcss/node без customCssResolver (как судья): ОШИБКА', String(e.message).split('\n')[0]);
}
// Мини-корень: тот же лист со своим /src/styles/dop.css — через разрешатель Vite compile() проходит, без него — падает.
const KOREN = join(import.meta.dirname, 'mini-koren');
mkdirSync(join(KOREN, 'src/styles'), { recursive: true });
writeFileSync(join(KOREN, 'src/styles/dop.css'), ".dop { color: red; }\n");
const cfg2 = await vite.resolveConfig({ root: KOREN, configFile: false, logLevel: 'silent' }, 'build');
const r2 = cfg2.createResolver({ ...cfg2.resolve, extensions: ['.css'], mainFields: ['style'], conditions: ['style', 'production'], tryIndex: false, preferRelative: true });
const base2 = join(KOREN, 'src/styles');
const vhod = "@import '/src/styles/dop.css';\n";
for (const [imya, opc] of [
  ['с customCssResolver Vite (сборка)', { customCssResolver: async (id, b) => r2(id, join(b, '__placeholder__.ts'), false, false) }],
  ['без него (судья)', {}],
]) {
  try {
    const k = await twNode.compile(vhod, { base: base2, from: join(base2, 'global.css'), shouldRewriteUrls: true, onDependency: () => {}, ...opc });
    console.log(`    мини-корень, ${imya}: собрано — ${twNode.optimize(k.build([]), { minify: true }).code.trim()}`);
  } catch (e) {
    console.log(`    мини-корень, ${imya}: ОШИБКА ${String(e.message).split('\n')[0]}`);
  }
}
