// GR3-klass K3: разрешатель плагина @tailwindcss/vite (Vite: resolve.alias, conditions, mainFields) против
// разрешателя оракула (@tailwindcss/node по умолчанию). Сборка Vite одного листа global.css репозитория (только чтение)
// в свою папку: с псевдонимом на лист гарнитуры темы и без него. Судья знака — на тех же входах (он astro.config не читает).
import { writeFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const require = createRequire(join(SAYT, 'package.json'));
const vite = await import(pathToFileURL(require.resolve('vite')).href);
const tailwindcss = (await import(pathToFileURL(require.resolve('@tailwindcss/vite')).href)).default;
const { sverka, wejscie } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/gr3/gr3-klass/vite';
mkdirSync(join(PAPKA, 'koren'), { recursive: true });
writeFileSync(join(PAPKA, 'fake-600.css'), "@font-face { font-family: 'Bodoni Moda'; font-style: normal; font-weight: 600; src: local('Georgia'); }\n");
const GLOBAL = join(SAYT, 'src/styles/global.css');

async function sobrat(imya, alias) {
  const out = join(PAPKA, `out-${imya}`);
  await vite.build({
    configFile: false,
    logLevel: 'warn',
    root: join(PAPKA, 'koren'),
    cacheDir: join(PAPKA, 'cache'),
    publicDir: false,
    plugins: [tailwindcss()],
    resolve: { alias },
    build: { outDir: out, emptyOutDir: true, write: true, rollupOptions: { input: { global: GLOBAL } } },
  });
  const cssy = readdirSync(join(out, 'assets')).filter((f) => f.endsWith('.css'));
  const css = cssy.map((f) => readFileSync(join(out, 'assets', f), 'utf8')).join('\n');
  const grani = [...css.matchAll(/@font-face\{[^}]*Bodoni Moda[^}]*\}/g)].map((m) => m[0]);
  console.log(`=== сборка ${imya}: css ${cssy.join(', ')}; граней Bodoni Moda ${grani.length}`);
  for (const g of grani) console.log(`  ${g.slice(0, 220)}`);
}
await sobrat('bez-psevdonima', []);
await sobrat('s-psevdonimom', [{ find: '@fontsource/bodoni-moda/latin-600.css', replacement: join(PAPKA, 'fake-600.css').replace(/\\/g, '/') }]);
const { bledy } = await sverka({ ...wejscie(), publiczne: null });
console.log(`=== судья знака на тех же входах (astro.config.mjs он не читает): ${bledy.length ? 'ОТКАЗ ' + bledy.join(' | ') : 'СВЕРЕНО'}`);
