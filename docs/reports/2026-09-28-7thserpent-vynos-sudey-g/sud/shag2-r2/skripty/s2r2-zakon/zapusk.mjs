// Обёртки-тесты: по одной на мутанта; каждая регистрирует крюк и грузит настоящий sverka.test.mjs.
// node zapusk.mjs — пишет файлы m-<режим>.test.mjs рядом.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MOYA = dirname(fileURLToPath(import.meta.url));
for (const rezhim of ['net', 'khuk', 'metki', 'klassy', 'popover', 'cfbidi', 'dannye']) {
  writeFileSync(
    join(MOYA, `m-${rezhim}.test.mjs`),
    `import { register } from 'node:module';
register(new URL('./kryuk.mjs', import.meta.url).href, { data: { rezhim: '${rezhim}' } });
await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/testy/sverka.test.mjs');
`
  );
}
