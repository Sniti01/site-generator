// node opyt-khuk.mjs <net|khuk>: хук astro:build:done сторожа из настоящего astro.config.mjs на мини-сайте, где у /media/
// снята подпись (в содержании и в копии dist). Мини-сайт и копия dist — в моей папке.
import { register } from 'node:module';
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MOYA = dirname(fileURLToPath(import.meta.url));
const rezhim = process.argv[2];
register(pathToFileURL(join(MOYA, 'kryuk.mjs')).href, { data: { rezhim } });
const REPO = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const SAYT = join(MOYA, 'sayt');
const DIST = join(MOYA, 'dist');
rmSync(SAYT, { recursive: true, force: true });
rmSync(DIST, { recursive: true, force: true });
for (const p of ['structure', 'src/data/game-art.json', 'src/data/icons.ts', 'src/content/tresc']) {
  mkdirSync(dirname(join(SAYT, p)), { recursive: true });
  cpSync(join(REPO, p), join(SAYT, p), { recursive: true });
}
cpSync(REF, DIST, { recursive: true });
const md = join(SAYT, 'src/content/tresc/media.md');
const s = readFileSync(md, 'utf8');
const s2 = s.replace(/^artCaption:.*\r?\n/m, '');
if (s2 === s) throw new Error('artCaption не снят');
writeFileSync(md, s2);
const hf = join(DIST, 'media/index.html');
const h = readFileSync(hf, 'utf8');
const h2 = h.replace(/<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/, '');
if (h2 === h) throw new Error('подпись не снята');
writeFileSync(hf, h2);

const cfg = (await import(pathToFileURL(join(REPO, 'astro.config.mjs')).href)).default;
const integ = cfg.integrations.find((i) => i?.name === 'sayt:sverka-dist');
const { OBYAZATELNAYA_PODPIS } = await import(pathToFileURL(join(REPO, 'gates/sverka.mjs')).href);
console.log(`${rezhim}: список на объекте интеграции = данным: ${JSON.stringify(integ.obyazatelnaPodpis) === JSON.stringify(OBYAZATELNAYA_PODPIS)}`);
integ.hooks['astro:config:done']({ config: { root: pathToFileURL(SAYT + '/') } });
try {
  integ.hooks['astro:build:done']({ dir: pathToFileURL(DIST + '/'), logger: { error: () => {}, info: (m) => console.log(`  info: ${m}`) } });
  console.log(`${rezhim}: сборка ЗЕЛЁНАЯ при снятой подписи /media/`);
} catch (e) {
  console.log(`${rezhim}: отказ — ${e.message.split('\n').filter((x) => /обязательн/.test(x)).join(' | ')}`);
}
