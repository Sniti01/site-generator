// Путь сторожа сборки: интеграция из astro.config.mjs сайта на копии сайта (содержание + dist) в своей папке.
// Порча: у /mods/ снята подпись кадра — в содержании (artCaption) и в печати. Ждём: сторож из конфига отказывает;
// тот же сторож с прежним литералом конфига (8b04600: ['/remake/', '/movie/']) молчит — и ни один тест конфиг не читает.
// Плюс: схема tekst() пропускает artCaption из одного U+200B.
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'file:///D:/SEO/cloud/site-generator/node_modules/zod/index.js';
import konfig from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/astro.config.mjs';
import sverka from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';

const TUT = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r1/s2r1-klass/kopiya';
const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
if (existsSync(TUT)) rmSync(TUT, { recursive: true });
for (const p of ['structure', 'src/data', 'src/content/tresc']) cpSync(join(SAYT, p), join(TUT, 'sayt', p), { recursive: true });
cpSync(DIST, join(TUT, 'dist'), { recursive: true });
// порча: /mods/ без подписи
const md = join(TUT, 'sayt/src/content/tresc/mods.md');
const s = readFileSync(md, 'utf8');
const s2 = s.replace(/^artCaption: .*\r?\n/m, '');
if (s2 === s) throw new Error('порча содержания не применилась');
writeFileSync(md, s2);
const h = join(TUT, 'dist/mods/index.html');
const t = readFileSync(h, 'utf8');
const t2 = t.replace(/<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/, '');
if (t2 === t) throw new Error('порча печати не применилась');
writeFileSync(h, t2);

const logger = { info: () => {}, error: () => {} };
const progon = (integr) => {
  integr.hooks['astro:config:done']({ config: { root: pathToFileURL(join(TUT, 'sayt') + '/') } });
  try {
    integr.hooks['astro:build:done']({ dir: pathToFileURL(join(TUT, 'dist') + '/'), logger });
    return 'МОЛЧИТ';
  } catch (e) {
    return 'ОТКАЗ — ' + e.message.split('\n').slice(0, 3).join(' | ');
  }
};
const izKonfiga = konfig.integrations.find((i) => i && i.name === 'sayt:sverka-dist');
console.log('сторож из astro.config.mjs:', progon(izKonfiga));
console.log('сторож с прежним литералом конфига:', progon(sverka({ obyazatelnaPodpis: ['/remake/', '/movie/'] })));
console.log('сторож с адресом без слеша:', progon(sverka({ obyazatelnaPodpis: ['/remake/', '/movie/', '/media/', '/mods', '/quotes/', '/voice-and-face/'] })));

const tekst = () => z.string().trim().min(1);
for (const [imya, v] of [['U+200B', '\u200B'], ['U+2060', '\u2060'], ['U+00AD', '\u00AD'], ['пробел', ' ']]) {
  const r = tekst().optional().safeParse(v);
  console.log(`схема tekst() artCaption ${imya}:`, r.success ? `ПРОХОДИТ (${JSON.stringify(r.data)})` : 'отказ');
}
