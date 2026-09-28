// Оракул Tailwind на полном global.css: что выходит на страницу при видах основного @theme и при сбросах.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(join(SAYT, 'package.json'));
const tw = await import(pathToFileURL(req.resolve('tailwindcss')).href);
const compile = tw.compile ?? tw.default?.compile;
const twDir = dirname(req.resolve('tailwindcss/package.json'));
const CSS_PUT = join(SAYT, 'src/styles/global.css');
const nayti = (id, base) => {
  if (id.startsWith('.') || id.startsWith('/')) return resolve(base, id);
  if (id === 'tailwindcss') return join(twDir, 'index.css');
  if (id.startsWith('tailwindcss/')) return join(twDir, id.slice('tailwindcss/'.length));
  return createRequire(join(base, 'x.js')).resolve(id);
};
const loadStylesheet = async (id, base) => {
  const f = nayti(id, base);
  return { path: f, base: dirname(f), content: readFileSync(f, 'utf8') };
};
async function fd(css) {
  try {
    const c = await compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, loadStylesheet, onDependency: () => {} });
    const out = c.build([]);
    return { fd: [...out.matchAll(/--font-display\s*:\s*([^;}]*)[;}]/g)].map((m) => m[1].trim()), var: /var\(--font-display/.test(out), kraski: [...out.matchAll(/--(accent|ink|bg)\s*:\s*([^;}]*)[;}]/g)].map((m) => `${m[1]}=${m[2].trim()}`) };
  } catch (e) {
    return { oshibka: e.message.split('\n')[0] };
  }
}
const css = readFileSync(CSS_PUT, 'utf8');
const sluchai = [
  ['как есть', css],
  ['@theme inline', css.replace('\n@theme {', '\n@theme inline {')],
  ['@theme static', css.replace('\n@theme {', '\n@theme static {')],
  ['@theme reference', css.replace('\n@theme {', '\n@theme reference {')],
  ['@theme default', css.replace('\n@theme {', '\n@theme default {')],
  ['--font-display: initial в конце', css + '\n@theme { --font-display: initial; }'],
  ['поздний @theme default с другой гарнитурой', css + "\n@theme default { --font-display: 'Playfair Display'; }"],
  ['поздний @theme с другой гарнитурой', css + "\n@theme { --font-display: 'Playfair Display'; }"],
  ['--font--*: initial в конце', css + '\n@theme { --font--*: initial; }'],
  ['--font-display-*: initial в конце', css + '\n@theme { --font-display-*: initial; }'],
  ['--fonts-*: initial в конце', css + '\n@theme { --fonts-*: initial; }'],
  ['--font-displayx-*: initial в конце', css + '\n@theme { --font-displayx-*: initial; }'],
];
for (const [imya, c] of sluchai) console.log(imya.padEnd(44), JSON.stringify(await fd(c)));
