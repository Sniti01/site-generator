// K-6: тест S2R1-Z-1 сверяет свойство интеграции; хук берёт список из замыкания. Мутант хука (без списка) — копия
// модуля судьи в моей папке, импорты — абсолютными адресами; репозиторий не трогается.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { deepStrictEqual } from 'node:assert';

const MOYA = dirname(fileURLToPath(import.meta.url));
const REPO = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const { OBYAZATELNAYA_PODPIS } = await import(pathToFileURL(join(REPO, 'gates/sverka.mjs')).href);
const trebuet = createRequire(join(REPO, 'tools/sverka.mjs'));
const yamlUrl = pathToFileURL(trebuet.resolve('yaml')).href;

const iskhod = readFileSync(join(REPO, 'tools/sverka.mjs'), 'utf8')
  .replace("from '@factory/core/text/html.mjs'", "from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs'")
  .replace("from 'yaml'", `from '${yamlUrl}'`);
const HOOK = 'sverkaSborki(fileURLToPath(dir), koren, { obyazatelnaPodpis: new Set(obyazatelnaPodpis) })';
if (!iskhod.includes(HOOK)) throw new Error('строки хука нет');
writeFileSync(join(MOYA, 'kopiya-sudyi.mjs'), iskhod);
writeFileSync(join(MOYA, 'mutant-sudyi.mjs'), iskhod.replace(HOOK, 'sverkaSborki(fileURLToPath(dir), koren)'));

// Мини-сайт (входы судьи) и dist только со страницами; у /media/ снята подпись в содержании и в печати.
const SAYT = join(MOYA, 'mini-sayt');
const DIST = join(MOYA, 'mini-dist');
rmSync(SAYT, { recursive: true, force: true });
rmSync(DIST, { recursive: true, force: true });
for (const p of ['structure', 'src/data/game-art.json', 'src/data/icons.ts', 'src/content/tresc']) {
  mkdirSync(dirname(join(SAYT, p)), { recursive: true });
  cpSync(join(REPO, p), join(SAYT, p), { recursive: true });
}
cpSync(REF, DIST, { recursive: true, filter: (s) => statSync(s).isDirectory() || /\.html$/i.test(s) });
const md = join(SAYT, 'src/content/tresc/media.md');
const m0 = readFileSync(md, 'utf8');
const m1 = m0.replace(/^artCaption:.*\r?\n/m, '');
if (m1 === m0) throw new Error('artCaption не снят');
writeFileSync(md, m1);
const hf = join(DIST, 'media/index.html');
const h0 = readFileSync(hf, 'utf8');
const h1 = h0.replace(/<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/, '');
if (h1 === h0) throw new Error('подпись не снята');
writeFileSync(hf, h1);

for (const imyaM of ['kopiya-sudyi.mjs', 'mutant-sudyi.mjs']) {
  const { default: sverka } = await import(pathToFileURL(join(MOYA, imyaM)).href);
  // Как astro.config.mjs, строка 63: sverka({ obyazatelnaPodpis: OBYAZATELNAYA_PODPIS }).
  const integ = sverka({ obyazatelnaPodpis: OBYAZATELNAYA_PODPIS });
  let test = 'выполнено';
  try { deepStrictEqual(integ.obyazatelnaPodpis, OBYAZATELNAYA_PODPIS); } catch { test = 'НЕ выполнено'; }
  integ.hooks['astro:config:done']({ config: { root: pathToFileURL(SAYT + '/') } });
  let storozh;
  try {
    integ.hooks['astro:build:done']({ dir: pathToFileURL(DIST + '/'), logger: { error() {}, info(s) { storozh = 'ЗЕЛЁНЫЙ: ' + s; } } });
  } catch (e) {
    storozh = 'отказ: ' + e.message.split('\n').filter((x) => /обязательна/.test(x)).join(' | ');
  }
  console.log(`${imyaM}: утверждение теста S2R1-Z-1 — ${test}; сторож — ${storozh}`);
}
rmSync(SAYT, { recursive: true, force: true });
rmSync(DIST, { recursive: true, force: true });
