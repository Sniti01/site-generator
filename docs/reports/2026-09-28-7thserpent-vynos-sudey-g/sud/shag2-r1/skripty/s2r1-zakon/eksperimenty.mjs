// Опыты над правкой 3b96e41 — копии в своей папке; репозиторий и эталонная сборка только читаются.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const R = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const TU = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r1/s2r1-zakon';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const { sverkaStranicy, sverkaSborki, vhody, default: sverka } = await import(pathToFileURL(`${R}/tools/sverka.mjs`).href);
const { OBYAZATELNAYA_PODPIS } = await import(pathToFileURL(`${R}/gates/sverka.mjs`).href);
const DANNYE = new Set(OBYAZATELNAYA_PODPIS);
const DVA = ['/remake/', '/movie/'];

// Мини-сайт: входы сверки (структура, кадры, иконки, содержание) — копия.
const SAYT = join(TU, 'sayt');
const DKOP = join(TU, 'dist');
rmSync(SAYT, { recursive: true, force: true });
rmSync(DKOP, { recursive: true, force: true });
for (const p of ['structure/structure.json', 'src/data/game-art.json', 'src/data/icons.ts', 'src/content/tresc']) cpSync(join(R, p), join(SAYT, p), { recursive: true });
cpSync(DIST, DKOP, { recursive: true });

const zam = (s, iz, na) => {
  if (!(typeof iz === 'string' ? s.includes(iz) : iz.test(s))) throw new Error('нет образца: ' + String(iz).slice(0, 80));
  return s.replace(iz, na);
};
const PODPIS = /<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/;

console.log('--- E0: нынешняя сборка, список данных —', sverkaSborki(DIST, R, { obyazatelnaPodpis: DANNYE }).zamechaniya.length, 'замечаний');

// E1: подпись снята на /media/ (содержание и печать) — сторож сборки со списком из двух (astro.config.mjs разошёлся с данными).
const md = join(SAYT, 'src/content/tresc/media.md');
writeFileSync(md, zam(readFileSync(md, 'utf8'), /artCaption: .*\n/, ''));
const mh = join(DKOP, 'media/index.html');
writeFileSync(mh, zam(readFileSync(mh, 'utf8'), PODPIS, ''));
console.log('--- E1: /media/ без подписи');
console.log('  сверка со списком данных:', JSON.stringify(sverkaSborki(DKOP, SAYT, { obyazatelnaPodpis: DANNYE }).zamechaniya));
console.log('  сверка со списком из двух:', JSON.stringify(sverkaSborki(DKOP, SAYT, { obyazatelnaPodpis: new Set(DVA) }).zamechaniya));
const hook = async (integr) => {
  const h = integr.hooks;
  h['astro:config:done']({ config: { root: pathToFileURL(SAYT + '/') } });
  try {
    h['astro:build:done']({ dir: pathToFileURL(DKOP + '/'), logger: { error() {}, info(m) { console.log('    лог:', m); } } });
    return 'сборка ЗЕЛЁНАЯ';
  } catch (e) {
    return 'сборка падает: ' + e.message.split('\n').slice(0, 2).join(' / ');
  }
};
console.log('  сторож sverka({ obyazatelnaPodpis: OBYAZATELNAYA_PODPIS }):', await hook(sverka({ obyazatelnaPodpis: OBYAZATELNAYA_PODPIS })));
console.log("  сторож sverka({ obyazatelnaPodpis: ['/remake/', '/movie/'] }):", await hook(sverka({ obyazatelnaPodpis: DVA })));
console.log('  сторож sverka():', await hook(sverka()));

// E2: законные формы печати — судья молчит, тест П103 п. 4?
const V = vhody(R);
const po = (url) => ({ page: V.struktura.pages.find((p) => p.url === url), dane: V.soderzhanie.find((s) => s.dane?.url === url)?.dane, html: readFileSync(join(DIST, url.slice(1), 'index.html'), 'utf8') });
const sv = (x, html, dane = x.dane) => sverkaStranicy({ page: x.page, dane, html, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: DANNYE });
console.log('--- E2: законные формы печати подписи');
for (const url of OBYAZATELNAYA_PODPIS) {
  const x = po(url);
  const pereставлен = zam(x.html, 'class="podpis-geroya t-caption"', 'class="t-caption podpis-geroya"');
  const atrPervym = zam(x.html, /<p class="podpis-geroya t-caption" (data-astro-cid-[a-z0-9]+)>/, '<p $1 class="podpis-geroya t-caption">');
  for (const [imya, h] of [['классы в другом порядке', pereставлен], ['атрибут области первым', atrPervym]]) {
    const z = sv(x, h);
    const testVidit = PODPIS.test(h);
    console.log(`  ${url} ${imya}: судья ${z.length ? 'ОТКАЗ ' + JSON.stringify(z) : 'молчит'}; образец теста П103 п. 4 ${testVidit ? 'находит подпись' : 'НЕ находит подпись → тест красный («в сборке нет подписи кадра»)'}`);
  }
}
// Другая формулировка и знаки HTML в подписи.
{
  const x = po('/movie/');
  const nov = 'Pictured: Max Payne & Mona <b> — "the game" 2001';
  const esc = nov.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const h = zam(x.html, /(<p class="podpis-geroya t-caption"[^>]*>)[^<]*(<\/p>)/, `$1${esc}$2`);
  console.log('  /movie/ другая формулировка со знаками HTML:', JSON.stringify(sv(x, h, { ...x.dane, artCaption: nov })));
}
// Страница вне списка без подписи и с подписью.
{
  const x = po('/story/');
  console.log('  /story/ вне списка без подписи:', JSON.stringify(sv(x, x.html)));
}

// E3: новая страница с подписью — «строкой сюда» (gates/sverka.mjs) по прозе данных; тест П103 п. 4 (равенство списков)?
{
  const sm = join(SAYT, 'src/content/tresc/story.md');
  writeFileSync(md, readFileSync(join(R, 'src/content/tresc/media.md'), 'utf8'));
  writeFileSync(sm, zam(readFileSync(sm, 'utf8'), /\nlead:/, '\nartCaption: "Pictured: a Max Payne 2 scene, not the ending"\nlead:'));
  const Vn = vhody(SAYT);
  const dannyeZavtra = [...OBYAZATELNAYA_PODPIS, '/story/'];
  const S_PODPISYU = ['/remake/', '/movie/', '/media/', '/mods/', '/quotes/', '/voice-and-face/'];
  const vSoderzhanii = Vn.soderzhanie.filter((s) => s.dane?.artCaption).map((s) => s.dane.url).sort();
  console.log('--- E3: /story/ с подписью, строка «/story/» в данных');
  try {
    assert.deepEqual([...dannyeZavtra].sort(), vSoderzhanii);
    console.log('  равенство «данные = содержание»: проходит');
    assert.deepEqual(vSoderzhanii, [...S_PODPISYU].sort(), 'подпись кадра стоит не там, где назвал владелец (П103 п. 4)');
    console.log('  равенство «содержание = шесть»: проходит');
  } catch (e) {
    console.log('  ТЕСТ КРАСНЫЙ:', e.message.split('\n')[0]);
  }
}
