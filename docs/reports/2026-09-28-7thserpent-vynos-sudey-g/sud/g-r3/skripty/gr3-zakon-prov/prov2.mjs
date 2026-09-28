// Свой член класса GR3-Z-2: разрешатель плагина (Vite, условия style + production + свои Vite) и разрешатель
// @tailwindcss/node (условие style) выбирают РАЗНЫЕ листы — судья судит не тот лист, что собирает сборка (пропуск,
// а не ложный отказ). Мини-корень с пакетом в своей папке; и сверка настоящих импортов сайта обоими разрешателями.
//   node prov2.mjs > prov2.txt
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(req.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const vite = await import(pathToFileURL(viteReq.resolve('vite')).href);
const P = import.meta.dirname;
const out = [];
const razreshatel = async (root) => {
  const cfg = await vite.resolveConfig({ root, configFile: false, logLevel: 'silent' }, 'build');
  // Как в @tailwindcss/vite 4.3.3: {...resolve, extensions:['.css'], mainFields:['style'], conditions:['style','development|production'], tryIndex:false, preferRelative:true}
  const r = cfg.createResolver({ ...cfg.resolve, extensions: ['.css'], mainFields: ['style'], conditions: ['style', 'development|production'], tryIndex: false, preferRelative: true });
  return async (id, base) => (await r(id, join(base, '__placeholder__.ts'), true, false)) ?? (await r(id, join(base, '__placeholder__.ts'), false, false));
};

// Мини-корень: пакет «pkg-uslovie», у которого в exports перед style стоит другое условие.
const KOREN = join(P, 'mini-koren2');
const USLOVIYA = ['import', 'browser', 'module', 'production', 'default'];
for (const u of USLOVIYA) {
  const d = join(KOREN, 'node_modules', `pkg-${u}`);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'package.json'), JSON.stringify({ name: `pkg-${u}`, version: '1.0.0', exports: { './list.css': { [u]: './zlo.css', style: './dobro.css' } } }));
  writeFileSync(join(d, 'zlo.css'), `:root { --font-display: Georgia, serif; } /* ${u}: zlo */\n`);
  writeFileSync(join(d, 'dobro.css'), `.dobro { color: green; } /* ${u}: dobro */\n`);
}
mkdirSync(join(KOREN, 'src/styles'), { recursive: true });
writeFileSync(join(KOREN, 'package.json'), '{"name":"mini","private":true}');
const rv = await razreshatel(KOREN);
const base = join(KOREN, 'src/styles');
out.push('== мини-корень: exports { "./list.css": { <условие>: zlo.css, style: dobro.css } }');
for (const u of USLOVIYA) {
  const vhod = `@import 'pkg-${u}/list.css';\n`;
  const sobrat = async (opc) => {
    try {
      const k = await twNode.compile(vhod, { base, from: join(base, 'global.css'), shouldRewriteUrls: true, onDependency: () => {}, ...opc });
      return twNode.optimize(k.build([]), { minify: true }).code.replace(/\/\*![^*]*\*\//, '').trim();
    } catch (e) { return `ОШИБКА ${String(e.message).split('\n')[0]}`; }
  };
  const plagin = await sobrat({ customCssResolver: rv });
  const sudya = await sobrat({});
  out.push(`   ${u}: плагин (Vite) → ${plagin} || судья (@tailwindcss/node) → ${sudya}${plagin !== sudya ? '   ← РАЗНЫЕ ЛИСТЫ' : ''}`);
}

// Настоящие импорты сайта: оба разрешателя — один и тот же файл?
const rs = await razreshatel(SAYT);
const CSS = join(SAYT, 'src/styles/global.css');
const importy = [...readFileSync(CSS, 'utf8').matchAll(/^@import\s+'([^']+)'/gm)].map((m) => m[1]);
out.push('\n== импорты global.css: разрешатель плагина против @tailwindcss/node (без customCssResolver)');
for (const id of importy) {
  const v = await rs(id, dirname(CSS));
  let n;
  try { n = await twNode.compile(`@import '${id}';`, { base: dirname(CSS), from: CSS, shouldRewriteUrls: true, onDependency: () => {} }).then(() => 'собрал'); } catch (e) { n = `ОШИБКА ${String(e.message).split('\n')[0]}`; }
  const zavisimosti = [];
  try { await twNode.compile(`@import '${id}';`, { base: dirname(CSS), from: CSS, shouldRewriteUrls: true, onDependency: (p) => zavisimosti.push(p) }); } catch {}
  const f = zavisimosti.find((p) => !/tailwindcss[\\/](theme|preflight|utilities)\.css$/.test(p)) ?? zavisimosti[0];
  out.push(`   ${id}\n      Vite: ${v}\n      node: ${f ?? n}${v && f && v.replace(/\\/g, '/').toLowerCase() !== f.replace(/\\/g, '/').toLowerCase() ? '   ← РАЗНЫЕ' : ''}`);
}
console.log(out.join('\n'));
