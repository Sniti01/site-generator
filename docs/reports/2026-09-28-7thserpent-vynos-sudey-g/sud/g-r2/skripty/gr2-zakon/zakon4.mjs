// Доводы к zakon1: (а) дескрипторы дополнительных @font-face 'Bodoni Moda' пакета темы против файла темы (normal 600;
// роль заголовка — font-weight 600, обычное начертание) и есть ли unicode-range; (б) «-->» и «<!--» внутри строки
// селектора — строка, а не CDO/CDC: lightningcss сайта правило оставляет.
//   node zakon4.mjs > zakon4.txt
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(`${SAYT}/package.json`);
const papka = dirname(req.resolve('@fontsource/bodoni-moda/latin-600.css'));
const opisat = (f) => {
  const b = /@font-face\s*{([^}]*)}/.exec(readFileSync(join(papka, f), 'utf8'))[1];
  const pole = (k) => (new RegExp(`${k}:\\s*([^;}]*)`).exec(b) ?? [])[1] ?? 'нет';
  return `${f}: font-style ${pole('font-style')}, font-weight ${pole('font-weight')}, unicode-range ${pole('unicode-range')}`;
};
for (const f of ['latin-600.css', 'latin-600-italic.css', 'latin-400.css', 'latin-700.css', 'latin-ext-600.css']) console.log(opisat(f));

const viteReq = createRequire(req.resolve('@tailwindcss/vite'));
const nodeReq = createRequire(viteReq.resolve('@tailwindcss/node'));
const { transform } = nodeReq('lightningcss');
for (const css of ['.q[data-strelka="-->"] { color: red; }', '.q[title^="<!--"] { color: red; }']) {
  const r = transform({ filename: 'x.css', code: Buffer.from(css), minify: false });
  console.log(`lightningcss: ${css} → ${r.code.toString().replace(/\s+/g, ' ').trim()} (предупреждений: ${r.warnings.length})`);
}
