// Один прогон судьи знака (той редакции, что загружена) по перечню случаев: настоящие входы и порчи строк R5.
// Входы собираются здесь (как wejscie), чтобы прежняя редакция без вывоза wejscie судила те же входы.
//   node [--import kryuk-staryi.mjs] sverka-verdiktov-sluchai.mjs <вывод.json>
import { readFileSync, writeFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const { sverka } = await import(pathToFileURL(join(SAYT, 'tools/znak.mjs')).href);
const req = createRequire(join(SAYT, 'package.json'));
const IMPORT_GARNITURY = '@fontsource/bodoni-moda/latin-600.css';
const IKONOCHNY = /^(favicon|icon-|apple-touch-icon)|\.webmanifest$/;
const katalog = (dir) => (existsSync(dir) ? new Map(readdirSync(dir).filter((f) => IKONOCHNY.test(f)).map((f) => [f, lstatSync(join(dir, f)).isFile() ? readFileSync(join(dir, f)) : 'nie-plik'])) : new Map());
const fontCssPath = req.resolve(IMPORT_GARNITURY);
const ff = [...readFileSync(fontCssPath, 'utf8').matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]).find((b) => /font-style:\s*normal/.test(b) && /font-weight:\s*600/.test(b));
const woff = /url\(\.\/files\/([^)]+\.woff)\)/.exec(ff)[1];
const baza = () => ({
  css: readFileSync(join(SAYT, 'src/styles/global.css'), 'utf8'),
  znak: JSON.parse(readFileSync(join(SAYT, 'src/data/znak.json'), 'utf8')),
  fontPlik: woff,
  fontBuf: readFileSync(join(dirname(fontCssPath), 'files', woff)),
  publiczne: katalog(join(SAYT, 'public')),
});

const SLUCHAI = [];
SLUCHAI.push(['настоящие входы (--check)', (w) => w]);
SLUCHAI.push(['настоящие входы и dist сборки 3b78f28 (--check --dist)', (w) => ({ ...w, dist: katalog(DIST) })]);
const FD = '--font-display';
const klyuchi = [];
for (let n = 2; n <= FD.length; n++) klyuchi.push(`${FD.slice(0, n)}-*`);
klyuchi.push('--*', '--color-*', '--fonts-*', '--font-displayx-*', '--font-sans-*');
const mesta = [
  ...['', ' inline', ' static', ' reference', ' default'].map((vid) => [`поздний @theme${vid}`, (css, k) => `${css}\n@theme${vid} { ${k}: initial; }`]),
  ['основной @theme, после --font-display', (css, k) => css.replace(/(\n\s*--font-display:[^;]*;)/, `$1\n  ${k}: initial;`)],
  ['основной @theme, в начале', (css, k) => css.replace('\n@theme {', `\n@theme {\n  ${k}: initial;`)],
  ['свой @theme перед основным', (css, k) => css.replace('\n@theme {', `\n@theme { ${k}: initial; }\n@theme {`)],
];
for (const k of klyuchi) for (const [gde, mut] of mesta) SLUCHAI.push([`R5-SVERKA-1: ${k} — ${gde}`, (w) => ({ ...w, css: mut(w.css, k) })]);
const spisok = (v) => (w) => ({ ...w, css: w.css.replace(/--font-display:[^;]*;/, `--font-display: ${v};`) });
for (const v of ["'Bodoni Moda',, serif", "'Bodoni Moda', 'Public Sans' 'X'", "'Bodoni Moda', 10px", "'Bodoni Moda', serif,", "'Bodoni Moda', initial", "'Bodoni Moda', \"x\" y", "'Bodoni Moda', 3d", "'Bodoni Moda', ui-serif, Georgia, 'Times New Roman', serif", "'Bodoni Moda', Times New Roman, serif", '"Bodoni Moda", serif', "'Bodoni Moda'"]) SLUCHAI.push([`R5-SVERKA-5: ${v}`, spisok(v)]);
const dop = (imya, css) => SLUCHAI.push([imya, (w) => ({ ...w, css: w.css + css })]);
dop('R5-SVERKA-3: продолжение строки в имени своей @font-face', "\n@font-face { font-family: 'Bodoni \\\nModa'; src: url(x.woff2); }");
dop('R5-SVERKA-3: @font-f\\61 ce', "\n@font-f\\61 ce { font-family: 'Bodoni Moda'; src: url(x.woff2); }");
dop('R5-SVERKA-3: @\\66ont-face', "\n@\\66ont-face { font-family: 'Bodoni Moda'; src: url(x.woff2); }");
dop('R5-SVERKA-2: @property --acc\\65nt', "\n@property --acc\\65nt { syntax: '<color>'; inherits: false; initial-value: #ff0000; }");
dop('R5-SVERKA-2: @prop\\65rty --accent', "\n@prop\\65rty --accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }");
dop('R5-SVERKA-4: экранированный пробел в имени своей @font-face', '\n@font-face { font-family: Bodoni\\ Moda; src: url(x.woff2); }');
SLUCHAI.push(['R5-SVERKA-4: --font-display в двойных кавычках', spisok('"Bodoni Moda", ui-serif, Georgia, serif')]);
dop('R5-SVERKA-4: @property --font-display', "\n@property --font-display { syntax: '*'; inherits: true; }");
dop('R5-SVERKA-4: @PROPERTY прописными', "\n@PROPERTY --accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }");
dop("R5-SVERKA-7: своя @font-face 'Bodoni Moda Fallback'", "\n@font-face { font-family: 'Bodoni Moda Fallback'; src: local('Georgia'); size-adjust: 104%; }");
dop('R5-SVERKA-7: своя @font-face Bodoni Moda SC', '\n@font-face { font-family: Bodoni Moda SC; src: url(x.woff2); }');

// Случаи «судью судят» блока Г — с ожиданием теста (раздел 6 журнала).
const { sluchaiGr } = await import('./sluchai-gr.mjs');
for (const [imya, mut, zhdem] of sluchaiGr()) SLUCHAI.push([imya, mut, zhdem]);

const out = [];
for (const [imya, mut, zhdem] of SLUCHAI) {
  const { bledy } = await sverka(mut(baza()));
  out.push({ imya, otkaz: bledy.length > 0, bledy, ...(zhdem ? { zhdem } : {}) });
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`случаев ${out.length}, отказов ${out.filter((x) => x.otkaz).length}`);
