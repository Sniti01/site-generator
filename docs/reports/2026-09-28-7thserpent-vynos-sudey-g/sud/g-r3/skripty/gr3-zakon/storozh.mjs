// Сторож sayt:znak-dist на эталонной сборке 3b78f28 (только чтение): чистый сайт — сверено.
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const Z = await import(pathToFileURL(join(SAYT, 'tools/znak.mjs')).href);
const soobshcheniya = [];
const logger = { error: (s) => soobshcheniya.push(`error: ${s}`), info: (s) => soobshcheniya.push(`info: ${s}`) };
try {
  await Z.default().hooks['astro:build:done']({ dir: pathToFileURL(REF + '/'), logger });
  console.log('сторож: прошёл');
} catch (e) {
  console.log(`сторож: ОТКАЗ ${e.message}`);
}
console.log(soobshcheniya.join('\n'));
