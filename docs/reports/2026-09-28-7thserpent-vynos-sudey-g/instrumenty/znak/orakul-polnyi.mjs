// Оракул на полном global.css сайта: compile() Tailwind сайта, импорты — из node_modules без сети.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(join(SAYT, 'package.json'));
const tw = await import(pathToFileURL(req.resolve('tailwindcss')).href);
const compile = tw.compile ?? tw.default?.compile;
const twDir = dirname(req.resolve('tailwindcss/package.json'));

const nayti = (id, base) => {
  if (id.startsWith('.') || id.startsWith('/')) return resolve(base, id);
  if (id === 'tailwindcss') return join(twDir, 'index.css');
  if (id.startsWith('tailwindcss/')) return join(twDir, id.slice('tailwindcss/'.length));
  return createRequire(join(base, 'x.js')).resolve(id);
};
const zagruzki = [];
const loadStylesheet = async (id, base) => {
  const f = nayti(id, base);
  zagruzki.push(`${id} → ${f}`);
  return { path: f, base: dirname(f), content: readFileSync(f, 'utf8') };
};

const cssPut = join(SAYT, 'src/styles/global.css');
const t0 = performance.now();
const c = await compile(readFileSync(cssPut, 'utf8'), { base: dirname(cssPut), from: cssPut, loadStylesheet, onDependency: () => {} });
const out = c.build([]);
const t1 = performance.now();
console.log(`компиляция: ${Math.round(t1 - t0)} мс; загрузок листов ${zagruzki.length}`);
for (const z of zagruzki) console.log('  ' + z);
const m = [...out.matchAll(/--font-display\s*:\s*([^;]*);/g)].map((x) => x[1]);
console.log('--font-display в выводе:', JSON.stringify(m));
const m2 = [...out.matchAll(/--(accent|ink|bg)\s*:\s*([^;]*);/g)].map((x) => `${x[1]}=${x[2]}`);
console.log('краски знака в выводе:', JSON.stringify(m2));
// второй прогон — время
const t2 = performance.now();
await compile(readFileSync(cssPut, 'utf8'), { base: dirname(cssPut), from: cssPut, loadStylesheet, onDependency: () => {} });
console.log(`вторая компиляция: ${Math.round(performance.now() - t2)} мс`);
