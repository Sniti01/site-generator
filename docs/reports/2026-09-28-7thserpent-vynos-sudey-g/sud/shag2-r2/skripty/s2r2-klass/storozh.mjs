// node storozh.mjs <mutant|nastoyashchiy>
// Сторож сборки из astro.config.mjs: (1) то, что сверяет тест S2R1-Z-1 (свойство obyazatelnaPodpis интеграции),
// (2) хук astro:build:done на мини-сайте (копия входов судьи, у /media/ снят artCaption) и копии dist (у /media/
// снята подпись). Мутант — хук зовёт sverkaSborki без списка (крюк kryuk.mjs, в памяти).
import { register } from 'node:module';
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deepStrictEqual } from 'node:assert';

const MOYA = dirname(fileURLToPath(import.meta.url));
const rezhim = process.argv[2];
if (rezhim === 'mutant') register(pathToFileURL(join(MOYA, 'kryuk.mjs')).href);
const REPO = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = join(MOYA, '../../ref/dist-7th-3b78f28');
const { OBYAZATELNAYA_PODPIS } = await import(pathToFileURL(join(REPO, 'gates/sverka.mjs')).href);

const SAYT = join(MOYA, 'sayt-' + rezhim);
rmSync(SAYT, { recursive: true, force: true });
for (const p of ['structure', 'src/data/game-art.json', 'src/data/icons.ts', 'src/content/tresc']) {
  mkdirSync(dirname(join(SAYT, p)), { recursive: true });
  cpSync(join(REPO, p), join(SAYT, p), { recursive: true });
}
const DIST = join(MOYA, 'dist-' + rezhim);
rmSync(DIST, { recursive: true, force: true });
cpSync(REF, DIST, { recursive: true });
const md = join(SAYT, 'src/content/tresc/media.md');
const s = readFileSync(md, 'utf8');
const s2 = s.replace(/^artCaption:.*\r?\n/m, '');
if (s2 === s) throw new Error('artCaption не снят');
writeFileSync(md, s2);
const hf = join(DIST, 'media/index.html');
const h = readFileSync(hf, 'utf8');
const PODPIS = /<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/;
if (!PODPIS.test(h)) throw new Error('подписи нет');
writeFileSync(hf, h.replace(PODPIS, ''));

const cfg = (await import(pathToFileURL(join(REPO, 'astro.config.mjs')).href)).default;
const integ = cfg.integrations.find((i) => i?.name === 'sayt:sverka-dist');
try {
  deepStrictEqual(integ.obyazatelnaPodpis, OBYAZATELNAYA_PODPIS);
  console.log(`${rezhim}: утверждение теста S2R1-Z-1 (свойство интеграции = данные) — ВЫПОЛНЕНО`);
} catch {
  console.log(`${rezhim}: утверждение теста S2R1-Z-1 — НЕ выполнено`);
}
integ.hooks['astro:config:done']({ config: { root: pathToFileURL(SAYT + '/') } });
try {
  integ.hooks['astro:build:done']({ dir: pathToFileURL(DIST + '/'), logger: { error: () => {}, info: (m) => console.log('  info:', m) } });
  console.log(`${rezhim}: сторож сборки на /media/ без подписи — ЗЕЛЁНЫЙ`);
} catch (e) {
  console.log(`${rezhim}: сторож сборки — отказ: ${e.message.split('\n').filter((x) => /обязательна/.test(x)).join(' | ')}`);
}
rmSync(SAYT, { recursive: true, force: true });
rmSync(DIST, { recursive: true, force: true });
