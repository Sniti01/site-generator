// GR2-Z-3 и свой член класса: как lightningcss сайта (им же optimize() Tailwind) читает «-->» / «<!--» в селекторах.
import { createRequire } from 'node:module';

const req = createRequire('D:/SEO/cloud/site-generator/sites/7thserpent.com/package.json');
const viteReq = createRequire(req.resolve('@tailwindcss/vite'));
const nodeReq = createRequire(viteReq.resolve('@tailwindcss/node'));
const { transform } = nodeReq('lightningcss');
const LISTY = [
  '.q[data-strelka="-->"] { color: red; }',
  '.q[title^="<!--"] { color: red; }',
  '.a-->.b { color: red; }',
  '@supports (content: "-->") { .b { color: red; } }',
  '--> .x { color: red; }',
  '<!-- .x { color: red; }',
];
for (const l of LISTY) {
  const r = transform({ filename: 'x.css', code: Buffer.from(l), minify: false, errorRecovery: true });
  console.log(`== ${l}\n   → ${r.code.toString().replace(/\s+/g, ' ').trim() || '(пусто)'}\n   предупреждений: ${r.warnings.length}${r.warnings.map((w) => ' ' + w.message).join(';')}`);
}
