// Раунд 2, опыт 3: что делает конвейер CSS Vite сайта (после плагина Tailwind) с оператором @import url(), который
// Tailwind оставил в выводе (А7). preprocessCSS Vite — библиотечный вызов в памяти, без сборки и без astro.
//   node opyt3.mjs > opyt3.txt
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const require = createRequire(join(SAYT, 'package.json'));
const vite = await import(pathToFileURL(require.resolve('vite')).href);
const PAPKA = join(import.meta.dirname, 'vite-opyt');
mkdirSync(PAPKA, { recursive: true });
writeFileSync(join(PAPKA, 'zlo.css'), ':root { --font-display: Georgia, serif; }\n');
// Так выглядит начало вывода Tailwind по А7 (оператор @import первым, дальше тема).
const kod = "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */\n@import url('./zlo.css');\n@layer theme { :root { --font-display: \"Bodoni Moda\", serif; } }\n.t-headline { font-family: var(--font-display); }\n";
const konfig = await vite.resolveConfig({ root: PAPKA, configFile: false, logLevel: 'silent' }, 'build');
const r = await vite.preprocessCSS(kod, join(PAPKA, 'global.css').replace(/\\/g, '/'), konfig);
console.log(`vite ${vite.version}\n--- вход:\n${kod}--- после конвейера CSS Vite:\n${r.code}`);
