// GL25-O-6: откат держится только до следующей выкладки головы main, и выкладка головы случается без слова владельца:
// Re-run последнего push-прогона (коммит = голова — сторож пропускает), push по путям workflow — в том числе core/**,
// package.json, package-lock.json, общим с первым сайтом (сессия первого сайта), Run workflow из main. Строка «ОТКАТ»,
// описание входа и шапка workflow об этом молчат; лист говорит только «Re-run старых прогонов не нажимать».
// Не нарушение правила «коммит запуска = голова main» — предел отката, которого нет в текстах.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const KOPIYA = join(TUT, 'kopiya');
const SV = await import(pathToFileURL(join(KOPIYA, 'sites/7thserpent.com/tools/storozha-vykladki.mjs')).href);
const require = createRequire(join(KOPIYA, 'sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs'));
const { parse } = require('yaml');
const REPO = 'D:/SEO/cloud/site-generator';
const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8' });
const out = [];
const log = (s = '') => out.push(s);

const H = '4444444444444444444444444444444444444444'; // голова main (плохой коммит)
const R = '5555555555555555555555555555555555555555'; // коммит отката
const ls = (sha) => `${sha}\trefs/heads/main\n`;
log('== 1. откат R при голове H, затем — без слова владельца об отмене отката:');
const otkat = SV.golova({ kommit: R, lsRemote: ls(H), otkat: true });
log(`  Run workflow из метки R со входом on: ok=${otkat.ok}: ${otkat.stroki[0]}`);
const rerun = SV.golova({ kommit: H, lsRemote: ls(H), otkat: false });
log(`  Re-run последнего push-прогона H (попытка 2, вход off): ok=${rerun.ok}: ${rerun.stroki[0]}`);
log('  → живой сайт снова H; сторож не знает, что на сервере откат, — его правило этого и не требует.');

const WF_TEKST = readFileSync(join(KOPIYA, '.github/workflows/deploy-7thserpent.yml'), 'utf8');
const WF = parse(WF_TEKST);
const p2 = WF.on.push.paths;
const p1 = parse(git('show', 'f22bb92:.github/workflows/deploy-ac4bf.yml').stdout).on.push.paths;
log('');
log(`== 2. пути push, общие с первым сайтом: ${p2.filter((p) => p1.includes(p)).join(', ')}`);
log('  push сессии первого сайта по ним запускает и выкладку второго — голову H поверх отката R.');

log('');
log('== 3. что говорят тексты об отмене отката');
const opis = WF.on.workflow_dispatch.inputs.SERPENT_ROLLBACK.description;
const shapka = WF_TEKST.split('\n').filter((s) => /^#/.test(s)).join('\n');
const slova = /до следующей|Re-run последнего|вернёт голову|держится|поверх отката/;
log(`  строка ОТКАТ: ${slova.test(otkat.stroki[0]) ? 'говорит' : 'молчит'}`);
log(`  описание входа: ${slova.test(opis) ? 'говорит' : 'молчит'}`);
log(`  шапка workflow: ${slova.test(shapka) ? 'говорит' : 'молчит'}`);

writeFileSync(join(TUT, 'GL25-O-6-vyvod.txt'), out.join('\n') + '\n');
