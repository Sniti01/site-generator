// Пишет обёртки m-<мутант>.test.mjs: крюк + весь sverka.test.mjs.
import { writeFileSync } from 'node:fs';
for (const m of ['net', 'khuk', 'metki', 'klassy', 'popover', 'predki']) {
  writeFileSync(
    new URL(`./m-${m}.test.mjs`, import.meta.url),
    `import { register } from 'node:module';\nregister(new URL('./kryuk.mjs', import.meta.url).href, { data: { rezhim: '${m}' } });\nawait import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/testy/sverka.test.mjs');\n`
  );
}
