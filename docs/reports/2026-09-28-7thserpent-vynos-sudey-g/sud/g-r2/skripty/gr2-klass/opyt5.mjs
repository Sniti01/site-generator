// Раунд 2, опыт 5: Г2 (@property --font-display в @layer base импортированного листа) — где оно в сжатом выводе.
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const { wejscie } = await import(`file:///${SAYT}/tools/znak.mjs`);
const r = createRequire(join(SAYT, 'package.json'));
const v = createRequire(r.resolve('@tailwindcss/vite'));
const tw = await import(pathToFileURL(v.resolve('@tailwindcss/node')).href);
const { Scanner } = await import(pathToFileURL(v.resolve('@tailwindcss/oxide')).href);
const p = join(SAYT, 'src/styles/global.css');
const f = join(import.meta.dirname, 'listy', 'm1.css').split('\\').join('/');
const css = wejscie().css.replace("@import '@factory/core/styles/a11y.css';", `@import '@factory/core/styles/a11y.css';\n@import '${f}';`);
const c = await tw.compile(css, { base: dirname(p), from: p, shouldRewriteUrls: true, onDependency: () => {} });
const out = tw.optimize(c.build(new Scanner({ sources: [{ ...c.root, negated: false }].concat(c.sources) }).scan()), { minify: true }).code;
const i = out.indexOf('@property --font-display');
console.log(i, JSON.stringify(out.slice(Math.max(0, i - 160), i + 80)));
