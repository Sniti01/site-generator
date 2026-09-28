// Опыт: сканер Tailwind сайта (oxide, как @tailwindcss/vite в сборке) берёт из разметки произвольное свойство
// [--font-display:Georgia] кандидатом; судья знака источников разметки не читает (sverka получает только global.css).
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const TUT = dirname(fileURLToPath(import.meta.url));
const req = createRequire(join(SAYT, 'package.json'));
const twv = createRequire(req.resolve('@tailwindcss/vite'));
const { Scanner } = await import(pathToFileURL(twv.resolve('@tailwindcss/oxide')).href);
const papka = join(TUT, 'razmetka');
mkdirSync(papka, { recursive: true });
writeFileSync(join(papka, 'Base.astro'), '<html lang="en" class="[--font-display:Georgia]"><body><h1 class="t-headline">x</h1></body></html>\n');
const s = new Scanner({ sources: [{ base: papka.replace(/\\/g, '/'), pattern: '**/*', negated: false }] });
const kand = s.scan();
console.log('кандидаты сканера:', JSON.stringify(kand));
const { sverka, wejscie } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
const w = wejscie();
const { bledy } = await sverka({ ...w, publiczne: null });
console.log('судья (входы: global.css, znak.json, гарнитура; разметки во входах нет):', bledy.length ? bledy.join(' | ') : 'СВЕРЕНО');
console.log('ключи входов wejscie():', Object.keys(w).join(', '));
