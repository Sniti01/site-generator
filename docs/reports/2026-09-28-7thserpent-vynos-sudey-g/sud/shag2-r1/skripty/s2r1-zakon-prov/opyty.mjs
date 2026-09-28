// Опыты проверяющего s2r1-zakon-prov: Z-1, Z-3, Z-4 и свой член класса. Репозиторий — только чтение.
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MOYA = dirname(fileURLToPath(import.meta.url));
const REPO = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = join(MOYA, '../../ref/dist-7th-3b78f28');
const S = await import(pathToFileURL(join(REPO, 'tools/sverka.mjs')).href);
const { OBYAZATELNAYA_PODPIS } = await import(pathToFileURL(join(REPO, 'gates/sverka.mjs')).href);
const log = (...a) => console.log(...a);

// Мини-сайт: входы судьи (структура, записи кадров, иконки, содержание) — копия в моей папке.
const SAYT = join(MOYA, 'sayt');
rmSync(SAYT, { recursive: true, force: true });
for (const p of ['structure', 'src/data/game-art.json', 'src/data/icons.ts', 'src/content/tresc']) {
  mkdirSync(dirname(join(SAYT, p)), { recursive: true });
  cpSync(join(REPO, p), join(SAYT, p), { recursive: true });
}
const DIST = join(MOYA, 'dist');
rmSync(DIST, { recursive: true, force: true });
cpSync(REF, DIST, { recursive: true });
const PODPIS = /<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/;

// ---- Z-1: сторож сборки берёт список из config?
{
  const md = join(SAYT, 'src/content/tresc/media.md');
  const s = readFileSync(md, 'utf8');
  const s2 = s.replace(/^artCaption:.*\r?\n/m, '');
  if (s2 === s) throw new Error('artCaption не снят');
  writeFileSync(md, s2);
  const hf = join(DIST, 'media/index.html');
  const h = readFileSync(hf, 'utf8');
  if (!PODPIS.test(h)) throw new Error('подписи нет');
  writeFileSync(hf, h.replace(PODPIS, ''));
  const logger = { error: () => {}, info: (m) => log('    info:', m) };
  const progon = (imya, integ) => {
    integ.hooks['astro:config:done']({ config: { root: pathToFileURL(SAYT + '/') } });
    try {
      integ.hooks['astro:build:done']({ dir: pathToFileURL(DIST + '/'), logger });
      log(`Z-1 ${imya}: сборка ЗЕЛЁНАЯ`);
    } catch (e) {
      log(`Z-1 ${imya}: отказ — ${e.message.split('\n').filter((x) => /обязательна/.test(x)).join(' | ')}`);
    }
  };
  let izConfig = null;
  try {
    const cfg = (await import(pathToFileURL(join(REPO, 'astro.config.mjs')).href)).default;
    izConfig = cfg.integrations.find((i) => i?.name === 'sayt:sverka-dist');
  } catch (e) {
    log('Z-1 config не импортировался:', e.message.slice(0, 200));
  }
  if (izConfig) progon('интеграция из astro.config.mjs', izConfig);
  progon('sverka({ obyazatelnaPodpis: OBYAZATELNAYA_PODPIS })', S.default({ obyazatelnaPodpis: OBYAZATELNAYA_PODPIS }));
  progon("sverka({ obyazatelnaPodpis: ['/remake/', '/movie/'] })", S.default({ obyazatelnaPodpis: ['/remake/', '/movie/'] }));
  progon('sverka()', S.default());
  // вернуть
  writeFileSync(md, s);
  writeFileSync(hf, h);
}

// ---- Z-3: законные формы печати — судья молчит, образец теста не видит подписи?
{
  const V = S.vhody(REPO);
  for (const url of OBYAZATELNAYA_PODPIS) {
    const page = V.struktura.pages.find((p) => p.url === url);
    const dane = V.soderzhanie.find((s) => s.dane?.url === url).dane;
    const h = readFileSync(join(REF, url.slice(1), 'index.html'), 'utf8');
    const formy = {
      'классы переставлены': h.replace('class="podpis-geroya t-caption"', 'class="t-caption podpis-geroya"'),
      'метка области первой': h.replace(/<p class="podpis-geroya t-caption" (data-astro-cid-[a-z0-9]+)>/, '<p $1 class="podpis-geroya t-caption">'),
    };
    for (const [imya, x] of Object.entries(formy)) {
      if (x === h) throw new Error(`${url} ${imya}: порча не применилась`);
      const z = S.sverkaStranicy({ page, dane, html: x, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: new Set(OBYAZATELNAYA_PODPIS) });
      log(`Z-3 ${url} ${imya}: судья ${z.length ? z.join(' | ') : '[]'}; образец теста ${PODPIS.test(x) ? 'видит' : 'НЕ видит'}`);
    }
  }
}

// ---- Z-4: следуем прозе gates/sverka.mjs — новая подпись на /story/ и строка в данных.
{
  const md = join(SAYT, 'src/content/tresc/story.md');
  const s = readFileSync(md, 'utf8');
  writeFileSync(md, s.replace(/^(url: \/story\/\r?\n)/m, '$1artCaption: "Proba"\n'));
  const V = S.vhody(SAYT);
  const dannye = [...OBYAZATELNAYA_PODPIS, '/story/'].sort();
  const vSod = V.soderzhanie.filter((x) => x.dane?.artCaption).map((x) => x.dane.url).sort();
  const S_PODPISYU = ['/remake/', '/movie/', '/media/', '/mods/', '/quotes/', '/voice-and-face/'];
  log(`Z-4 данные = содержание: ${JSON.stringify(dannye) === JSON.stringify(vSod)}; содержание = S_PODPISYU теста: ${JSON.stringify(vSod) === JSON.stringify([...S_PODPISYU].sort())}`);
  writeFileSync(md, s);
}

// ---- Свой член класса: страница из списка теряет героя — обязательность молчит.
{
  const V = S.vhody(REPO);
  const url = '/404/';
  const page = V.struktura.pages.find((p) => p.url === url);
  const dane = V.soderzhanie.find((s) => s.dane?.url === url).dane;
  const h = readFileSync(join(REF, '404/index.html'), 'utf8');
  const z = S.sverkaStranicy({ page, dane, html: h, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: new Set([url]) });
  log(`СВОЙ-1 ${url} в списке обязательных, героя нет, artCaption нет: судья ${z.length ? z.join(' | ') : '[] (молчит)'}`);
  // И /media/ целиком: структура без hero-key-art (порча в памяти) при списке данных — ветка обязательности вне проверки.
  const m = V.struktura.pages.find((p) => p.url === '/media/');
  const mPage = JSON.parse(JSON.stringify(m));
  mPage.blocks = mPage.blocks.filter((b) => b.block !== 'hero-key-art');
  const mDane = { ...V.soderzhanie.find((s) => s.dane?.url === '/media/').dane };
  delete mDane.artCaption;
  const mh = readFileSync(join(REF, 'media/index.html'), 'utf8');
  const z2 = S.sverkaStranicy({ page: mPage, dane: mDane, html: mh, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: new Set(OBYAZATELNAYA_PODPIS) });
  log(`СВОЙ-1 /media/ без hero-key-art в структуре: замечание об обязательности ${z2.some((y) => /обязательна/.test(y)) ? 'есть' : 'НЕТ'}; прочие: ${z2.join(' | ').slice(0, 300)}`);
}
