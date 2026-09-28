// В каком окружении Vite сборка Astro сайта разрешает импорты global.css (мутант N6 раунда 3: ssr или client)?
// Копия сайта вне репозитория, в её node_modules — пакет pkg-usl с exports по условиям node, browser, style, default;
// global.css копии импортирует pkg-usl/list.css; сборка копии без гейтов; какой лист попал в CSS dist копии.
// Рядом — createResolver Vite (как у плагина) на ssr и на client — что отвечает каждый.
//   node gr3/moi/okruzhenie.mjs
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const REPO = 'D:/SEO/cloud/site-generator';
const { sdelatKopiyu, udalitKopiyu, sobrat, prochest, zapisat } = await import(pathToFileURL(join(REPO, 'sites/7thserpent.com/tools/kopiya.mjs')).href);
const k = sdelatKopiyu(mkdtempSync(join(tmpdir(), 'znak-okruzhenie-')));
try {
  const pkg = join(k.sayt, 'node_modules', 'pkg-usl');
  mkdirSync(pkg, { recursive: true });
  writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: 'pkg-usl', version: '1.0.0', exports: { './list.css': { node: './node.css', browser: './browser.css', import: './import.css', style: './style.css', default: './default.css' } } }));
  for (const u of ['node', 'browser', 'import', 'style', 'default']) writeFileSync(join(pkg, `${u}.css`), `.usl-${u} { color: red; }\n`);
  const POSLE = "@import '@factory/core/styles/a11y.css';";
  const css = prochest(k, 'src/styles/global.css');
  if (css.split(POSLE).length !== 2) throw new Error('порча не применилась');
  zapisat(k, 'src/styles/global.css', css.replace(POSLE, `${POSLE}\n@import 'pkg-usl/list.css';`));
  const r = sobrat(k);
  console.log(`сборка копии: код ${r.kod}`);
  const astro = join(k.sayt, 'dist', '_astro');
  const vDist = new Set();
  for (const f of readdirSync(astro).filter((x) => x.endsWith('.css'))) for (const m of readFileSync(join(astro, f), 'utf8').matchAll(/\.usl-(\w+)/g)) vDist.add(m[1]);
  console.log(`в CSS dist копии: ${[...vDist].join(', ') || 'ни одного .usl-*'}`);
  const req = createRequire(join(k.sayt, 'package.json'));
  const vite = await import(pathToFileURL(createRequire(req.resolve('astro/package.json')).resolve('vite')).href);
  const cfg = await vite.resolveConfig({ environments: { ssr: {} }, root: k.sayt, configFile: false, logLevel: 'silent' }, 'build');
  const cssR = cfg.createResolver({ ...cfg.resolve, extensions: ['.css'], mainFields: ['style'], conditions: ['style', 'development|production'], tryIndex: false, preferRelative: true });
  const importer = resolve(k.sayt, 'src/styles/__placeholder__.ts');
  for (const ssr of [true, false]) console.log(`createResolver ${ssr ? 'ssr' : 'client'}: ${await cssR('pkg-usl/list.css', importer, false, ssr)}`);
  if (r.kod !== 0) console.log(r.vyvod.split('\n').slice(-25).join('\n'));
} finally {
  udalitKopiyu(k);
}
