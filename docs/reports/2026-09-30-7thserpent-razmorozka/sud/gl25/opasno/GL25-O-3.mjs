// GL25-O-3: Run workflow из ветки или метки, чей коммит старше сторожа, идёт workflow этого коммита — без сторожа головы
// и без входа отката: выкладка не головы main без входа и без строки «ОТКАТ». Проверка: у каждой ветки origin/* и метки —
// есть ли .github/workflows/deploy-7thserpent.yml, workflow_dispatch, mirror и команда golova; что сейчас случайно держит
// такой запуск (старый сторож папки и файл Google в корне www).
// Только чтение репозитория: git log, git show (ссылки последнего fetch, без сети). Старые сторожа — копиями в эту папку.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const KOPIYA = join(TUT, 'kopiya');
const require = createRequire(join(KOPIYA, 'sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs'));
const { parse } = require('yaml');
const SV = await import(pathToFileURL(join(KOPIYA, 'sites/7thserpent.com/tools/storozha-vykladki.mjs')).href);
const REPO = 'D:/SEO/cloud/site-generator';
const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const out = [];
const log = (s = '') => out.push(s);

// Вершины веток origin/* и меток — git log --no-walk с украшениями.
const ssylki = [];
for (const s of git('log', '--remotes=origin', '--tags', '--no-walk', '--format=%H%x09%D').stdout.trim().split('\n')) {
  const [k, d] = s.split('\t');
  for (const imya of (d ?? '').split(', ').map((x) => x.replace(/^tag: /, '').trim())) {
    if (/^origin\//.test(imya) && imya !== 'origin/HEAD' && !imya.includes('->')) ssylki.push({ imya, k });
    else if (d.includes(`tag: ${imya}`)) ssylki.push({ imya, k });
  }
}
const MAIN = git('log', '-1', '--format=%H', 'origin/main').stdout.trim();
log(`origin/main = ${MAIN}; ветки origin/* и метки: ${ssylki.length}`);
log('');
log('ссылка | коммит | предок main? | workflow есть | workflow_dispatch | mirror --reverse | golova | вход SERPENT_ROLLBACK');
const bezStorozha = [];
for (const { imya, k } of ssylki.sort((a, b) => a.imya.localeCompare(b.imya))) {
  const predok = git('log', '--format=%H', `origin/main..${k}`).stdout.trim() === '';
  const f = git('show', `${k}:.github/workflows/deploy-7thserpent.yml`);
  if (f.status !== 0) {
    log(`${imya} | ${k.slice(0, 7)} | ${predok ? 'да' : 'нет'} | нет | — | — | — | —`);
    continue;
  }
  const wf = parse(f.stdout);
  const dispatch = 'workflow_dispatch' in (wf?.on ?? {});
  const run = (wf?.jobs?.deploy?.steps ?? []).map((x) => x.run ?? '').join('\n');
  const mirror = /mirror --reverse/.test(run);
  const golova = /storozha-vykladki\.mjs golova/.test(run);
  const vkhod = Boolean(wf?.on?.workflow_dispatch?.inputs?.SERPENT_ROLLBACK);
  log(`${imya} | ${k.slice(0, 7)} | ${predok ? 'да' : 'нет'} | да | ${dispatch ? 'да' : 'нет'} | ${mirror ? 'да' : 'нет'} | ${golova ? 'да' : 'нет'} | ${vkhod ? 'да' : 'нет'}`);
  if (dispatch && mirror && !golova) bezStorozha.push({ imya, k, predok });
}
log('');
log('Ветки и метки с workflow выкладки без сторожа головы и без входа отката (Run workflow из них выложит свой коммит):');
for (const b of bezStorozha) log(`  ${b.imya} (${b.k.slice(0, 7)})${b.k === MAIN ? ' — сейчас голова main; после вливания сессии 25 — старый коммит main' : ' — старый коммит main'}`);
log('После вливания каждая из них — откат без входа и без строки «ОТКАТ»; сторож головы в их workflow не существует.');

// Шаги старого workflow до mirror — сверки коммита с головой нет.
const b0 = bezStorozha.find((b) => b.k !== MAIN) ?? bezStorozha[0];
if (b0) {
  const wf = parse(git('show', `${b0.k}:.github/workflows/deploy-7thserpent.yml`).stdout);
  log('');
  log(`Шаги workflow на ${b0.imya} (${b0.k.slice(0, 7)}) до первого mirror --reverse:`);
  for (const x of wf.jobs.deploy.steps) {
    log(`  - ${x.name ?? x.uses}`);
    if (/mirror --reverse/.test(x.run ?? '')) break;
  }
}

// Что сейчас случайно держит такой запуск: старый сторож папки не знает файла Google и останавливает корень с ним.
log('');
log('Что держит сейчас (случайно): старый сторож папки против корня www с нашей выкладкой и файлом Google.');
const KOREN_S_GOOGLE = './\n../\n.htaccess\n404/\n_astro/\ngoogle0123456789abcdef.html\nindex.html\nprivacy/\nrobots.txt\n';
const KOREN_BEZ = './\n../\n.htaccess\n404/\n_astro/\nindex.html\nprivacy/\nrobots.txt\n';
const nash = '<!doctype html><html><head><title>x</title><link rel="canonical" href="https://www.7thserpent.com/"></head><body></body></html>';
const VERKH = ['.htaccess', '404', '_astro', 'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon.ico', 'favicon.svg', 'icon-192.png', 'index.html', 'privacy', 'robots.txt', 'sitemap-0.xml', 'sitemap-index.xml', 'pc', 'max-payne-1'];
for (const b of bezStorozha) {
  const papkaStarogo = join(TUT, 'stare', b.k.slice(0, 7));
  mkdirSync(papkaStarogo, { recursive: true });
  const f = join(papkaStarogo, 'storozha-vykladki.mjs');
  writeFileSync(f, git('show', `${b.k}:sites/7thserpent.com/tools/storozha-vykladki.mjs`).stdout);
  const ST = await import(pathToFileURL(f).href);
  const s = ST.papka(KOREN_S_GOOGLE, nash, VERKH);
  const z = ST.papka(KOREN_BEZ, nash, VERKH);
  log(`  ${b.imya} (${b.k.slice(0, 7)}): корень с файлом Google → ok=${s.ok}: ${s.stroki.join(' | ').slice(0, 220)}`);
  log(`  ${b.imya} (${b.k.slice(0, 7)}): тот же корень без файла Google → ok=${z.ok}: ${z.stroki.join(' | ').slice(0, 160)}`);
}
const n = SV.papka(KOREN_S_GOOGLE, nash, VERKH, null, { 'google0123456789abcdef.html': 'google-site-verification: google0123456789abcdef.html' });
log(`  новый сторож (22878b2), тот же корень с файлом Google и верной копией → ok=${n.ok}`);
log('Итог: пока файл Google лежит в корне www, старый сторож папки останавливает такой запуск до mirror — защита случайная;');
log('без файла (например, подтверждение перенесено в TXT DNS) Run workflow из этих веток выкладывает старый коммит без стопа.');

// Что говорят шапка нового workflow.
const wfNovyi = git('show', '22878b2:.github/workflows/deploy-7thserpent.yml').stdout;
log('');
log('Шапка нового workflow (22878b2) — строки о пределе:');
for (const s of wfNovyi.split('\n').filter((x) => /в любом запуске|Re-run запусков|созданных до этого сторожа|стоп до секретов и сервера/.test(x))) log(`  ${s.trim()}`);
log('О Run workflow из ветки или метки старше сторожа — ни слова: предел назван только для Re-run старых запусков.');

writeFileSync(join(TUT, 'GL25-O-3-vyvod.txt'), out.join('\n') + '\n');
