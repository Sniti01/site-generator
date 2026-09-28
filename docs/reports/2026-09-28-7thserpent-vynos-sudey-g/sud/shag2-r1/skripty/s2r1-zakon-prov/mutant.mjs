// node --test-name-pattern=<шаблон> mutant.mjs <sudya|dannye|oba|net> [dop]
// Регистрирует крюк и грузит настоящий sverka.test.mjs (и, с «dop», предлагаемые тесты Z-2 а/б).
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MOYA = dirname(fileURLToPath(import.meta.url));
const [rezhim, dop] = process.argv.slice(2);
register(pathToFileURL(join(MOYA, 'kryuk.mjs')).href, {
  data: { sudya: rezhim === 'sudya' || rezhim === 'oba', dannye: rezhim === 'dannye' || rezhim === 'oba' },
});
process.env.PROVERKI_DIST = join(MOYA, '../../ref/dist-7th-3b78f28');
if (dop) await import(pathToFileURL(join(MOYA, 'dop.test.mjs')).href);
else await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/testy/sverka.test.mjs');
