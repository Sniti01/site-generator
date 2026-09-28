// Проверка GR2-K-1: @import url() / удалённый @import первым в global.css — судья и путь сборки + конвейер CSS Vite.
// Мутации — в памяти (w.css) и листы в своей папке; репозиторий не меняется.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const { sverka, wejscie, drzewoCss, deklaracje } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
const PAPKA = import.meta.dirname;
const LISTY = join(PAPKA, 'listy');
mkdirSync(LISTY, { recursive: true });
const put = (p) => p.replace(/\\/g, '/');

const require = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);
const vite = await import(pathToFileURL(require.resolve('vite')).href);
const cssPut = join(SAYT, 'src/styles/global.css');
async function tw(css, minify) {
  const c = await twNode.compile(css, { base: dirname(cssPut), from: cssPut, shouldRewriteUrls: true, onDependency: () => {} });
  const ist = (c.root === 'none' ? [] : c.root === null ? [{ base: SAYT, pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
  const k = c.features & twNode.Features.Utilities ? new Scanner({ sources: ist }).scan() : [];
  return twNode.optimize(c.build(k), { minify }).code;
}
const config = await vite.resolveConfig({ root: SAYT, configFile: false, logLevel: 'silent' }, 'build');

const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const zlo = join(LISTY, 'zlo-k1.css');
writeFileSync(zlo, ':root { --font-display: Georgia, serif; }\n');
const ZLO = put(zlo);

const SLUCHAI = [
  ['контроль: чистые входы', (css) => css],
  ['контроль: обычный @import первым', (css) => `@import '${ZLO}';\n${css}`],
  ['К1-1 @import url() первым', (css) => `@import url('${ZLO}');\n${css}`],
  ['К1-2 @import url() без кавычек первым', (css) => `@import url(${ZLO});\n${css}`],
  ['К1-3 @import "https://…" первым', (css) => `@import "https://fonts.example.net/zlo.css";\n${css}`],
  ['К1-4 @import url(https://…) первым', (css) => `@import url(https://fonts.example.net/zlo.css);\n${css}`],
];

for (const [imya, mut] of SLUCHAI) {
  const w = czyste();
  w.css = mut(w.css);
  const { bledy } = await sverka(w);
  console.log(`== ${imya}\n   судья: ${bledy.length ? `ОТКАЗ (${bledy.length}): ${bledy.map((b) => b.slice(0, 200)).join(' | ')}` : 'СВЕРЕНО'}`);
  for (const minify of [false, true]) {
    try {
      const out = await tw(w.css, minify);
      const oper = drzewoCss(out).uzly.filter((u) => u.oper).map((u) => u.prelude);
      const fdTw = deklaracje(drzewoCss(out).uzly).filter((d) => d.imie === 'font-display').map((d) => `${d.gde}: ${d.wartosc}`);
      console.log(`   Tailwind minify=${minify}: операторы ${JSON.stringify(oper)}; --font-display ${JSON.stringify(fdTw)}`);
      if (minify) {
        const r = await vite.preprocessCSS(out, cssPut, config);
        const t = drzewoCss(r.code);
        const oper2 = t.uzly.filter((u) => u.oper).map((u) => u.prelude);
        const fd2 = deklaracje(t.uzly).filter((d) => d.imie === 'font-display').map((d) => `${d.gde}: ${d.wartosc}`);
        console.log(`   после Vite preprocessCSS: операторы ${JSON.stringify(oper2)}; --font-display ${JSON.stringify(fd2)}; начало: ${JSON.stringify(r.code.slice(0, 140))}`);
      }
    } catch (e) {
      console.log(`   исключение: ${String(e.message).split('\n')[0]}`);
    }
  }
}
