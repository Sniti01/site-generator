// GL25-O-2: вход отката пропускает любой коммит, не только коммит из истории main. Run workflow из ветки, которая ВПЕРЕДИ
// main (неслитая, непринятая работа), со входом SERPENT_ROLLBACK = on выкладывает её под строкой «ОТКАТ»; а строка СТОП
// того же запуска без входа сама называет это откатом («выкладка откатила бы живой сайт к этому коммиту») и советует
// «откат на этот коммит — … со входом SERPENT_ROLLBACK = on». Сторож не знает, предок ли коммит головы: в его входе этого
// нет, а checkout — глубиной 1 (истории на раннере нет).
// Вход: настоящий вывод git ls-remote (ls-remote-nastoyashchiy.txt, скрипт nastoyashchiy-ls-remote.mjs), коммиты — git log.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const KOPIYA = join(TUT, 'kopiya');
const STOROZH = join(KOPIYA, 'sites/7thserpent.com/tools/storozha-vykladki.mjs');
const SV = await import(pathToFileURL(STOROZH).href);
const require = createRequire(join(KOPIYA, 'sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs'));
const { parse } = require('yaml');
const REPO = 'D:/SEO/cloud/site-generator';
const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8' });
const out = [];
const log = (s = '') => out.push(s);

const LS = join(TUT, 'ls-remote-nastoyashchiy.txt');
const OSH = join(TUT, 'ls-remote-nastoyashchiy-oshibki.txt');
const HEAD_MAIN = SV.golovaIzLsRemote(readFileSync(LS, 'utf8'));
const VPEREDI = git('log', '-1', '--format=%H', '22878b2').stdout.trim();
const STARYI = git('log', '-1', '--format=%H', 'add241a').stdout.trim();
const schet = (diap) => git('log', '--format=%H', diap).stdout.trim().split('\n').filter(Boolean).length;

log('== 1. кто кому предок (git log, без сети)');
log(`голова main на GitHub (настоящий ls-remote): ${HEAD_MAIN}`);
log(`22878b2 (ветка сессии 25, не влита): коммитов впереди main — ${schet(`${HEAD_MAIN}..${VPEREDI}`)}, позади — ${schet(`${VPEREDI}..${HEAD_MAIN}`)} → не откат, а неслитая работа`);
log(`add241a (прежний коммит main): впереди — ${schet(`${HEAD_MAIN}..${STARYI}`)}, позади — ${schet(`${STARYI}..${HEAD_MAIN}`)} → настоящий откат`);

const { GITHUB_SHA: _a, SERPENT_ROLLBACK: _b, ...env0 } = process.env;
const zapusk = (sha, vkhod) => spawnSync(process.execPath, [STOROZH, 'golova', LS, OSH], { encoding: 'utf8', env: { ...env0, GITHUB_SHA: sha, SERPENT_ROLLBACK: vkhod } });
log('');
log('== 2. команда golova копии: неслитая ветка против настоящего отката');
for (const [imya, sha] of [['неслитая ветка 22878b2', VPEREDI], ['прежний коммит main add241a', STARYI]]) {
  for (const vkhod of ['off', 'on']) {
    const z = zapusk(sha, vkhod);
    log(`-- ${imya}, вход ${vkhod}: код ${z.status}`);
    log(`   ${z.stdout.trim()}`);
  }
}
const bez = zapusk(VPEREDI, 'off').stdout;
log('');
log('== 3. что утверждает строка СТОП для неслитой ветки');
log(`  «откатила бы живой сайт к этому коммиту» — ${/откатила бы живой сайт к этому коммиту/.test(bez) ? 'есть' : 'нет'}; на деле коммит впереди main — выкладка двинула бы сайт ВПЕРЁД, к непринятой работе`);
log(`  совет «откат на этот коммит — Run workflow из ветки или метки этого коммита со входом SERPENT_ROLLBACK = on» — ${/откат на этот коммит — Run workflow из ветки или метки этого коммита со входом SERPENT_ROLLBACK = on/.test(bez) ? 'есть' : 'нет'}`);
log('  следование совету → код 0 и «ОТКАТ: выкладывается коммит 22878b2…» (раздел 2): строки «ОТКАТ» у неслитой ветки и у настоящего отката — одной формы.');

log('');
log('== 4. чем сторож мог бы отличить');
log(`  параметры golova: ${String(SV.golova).match(/^function golova\(([^)]*)\)/)[1]} — предка в них нет`);
const WF = parse(readFileSync(join(KOPIYA, '.github/workflows/deploy-7thserpent.yml'), 'utf8'));
const co = WF.jobs.deploy.steps[0];
log(`  первый checkout: uses ${co.uses}, with ${JSON.stringify(co.with)} — fetch-depth не задан (у actions/checkout по умолчанию 1): истории main на раннере нет`);
log('  после вливания сессии 25 каждая следующая ветка сессии (впереди main) несёт этот workflow со входом — Run workflow из неё');
log('  со входом on выложит непринятую работу под словом «ОТКАТ».');

writeFileSync(join(TUT, 'GL25-O-2-vyvod.txt'), out.join('\n') + '\n');
