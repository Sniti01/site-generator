// GL25-Z-3 — откат по листу: «Run workflow со входом SERPENT_ROLLBACK = on», но в форме Run workflow ветка осталась
// по умолчанию (main): коммит запуска — голова main. Сторож даёт обычный проход «коммит запуска … = голова main —
// выкладывается он» и молчит, что вход отката не сработал; прогон зелёный — владелец считает, что откатил, а на сайт
// ушла голова main (та, от которой он откатывался). Проба сторожа требует в этом случае НЕ писать «ОТКАТ» — и только.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const STOROZH = `${PAPKA}/kopiya/sites/7thserpent.com/tools/storozha-vykladki.mjs`;
const SV = await import(pathToFileURL(STOROZH).href);
const RAB = join(PAPKA, 'rabochie-z3');
mkdirSync(RAB, { recursive: true });

const out = [];
const p = (s = '') => out.push(s);
const GOLOVA = 'f22bb920398794800ae78474dbe5d5a839ce6c76';
writeFileSync(join(RAB, 'golova-main.txt'), `${GOLOVA}\trefs/heads/main\n`);
writeFileSync(join(RAB, 'golova-main-oshibki.txt'), '');

// Run workflow: ветка main (по умолчанию), вход SERPENT_ROLLBACK = on, первая попытка → env on.
const r = spawnSync(process.execPath, [STOROZH, 'golova', join(RAB, 'golova-main.txt'), join(RAB, 'golova-main-oshibki.txt')], {
  encoding: 'utf8',
  env: { ...process.env, GITHUB_SHA: GOLOVA, SERPENT_ROLLBACK: 'on', GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/main', GITHUB_RUN_ATTEMPT: '1' },
});
p('[Run workflow: ветка main (не переключена), вход SERPENT_ROLLBACK = on]');
p(`код ${r.status}`);
p(`stdout: ${r.stdout.trim()}`);

// Та же строка, что без входа, — побайтно.
const bez = SV.golova({ kommit: GOLOVA, lsRemote: `${GOLOVA}\trefs/heads/main\n`, otkat: false }).stroki.join('\n');
const so = SV.golova({ kommit: GOLOVA, lsRemote: `${GOLOVA}\trefs/heads/main\n`, otkat: true }).stroki.join('\n');
p();
p(`строка со входом on и без входа — одна и та же: ${bez === so ? 'ДА' : 'нет'}`);
p(`строка говорит, что вход отката не сработал (коммит — голова, отката нет): ${/отката нет|вход .*не (нужен|понадобился|сработал)|не откат/i.test(so) ? 'да' : 'НЕТ'}`);
p(`строка говорит, как откатить (ветка или метка нужного коммита): ${/ветк|метк/i.test(so) ? 'да' : 'НЕТ'}`);
p();
p('ИТОГ: зелёный прогон «отката», который выложил голову main; отличие от настоящего отката — только отсутствие строки');
p('«ОТКАТ: …» в журнале шага. Опасного прохода нет (голова main — законная выкладка), но действие владельца не исполнено');
p('и строка об этом молчит.');

const vyvod = `${out.join('\n')}\n`;
writeFileSync(join(PAPKA, 'GL25-Z-3-vyvod.txt'), vyvod);
console.log(vyvod);
