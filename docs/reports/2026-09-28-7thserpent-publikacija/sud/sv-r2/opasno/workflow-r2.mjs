// SV2 — договор workflow вокруг признака первой выкладки и порядок шагов (6419c9b, git show; разбор — пакет yaml репозитория).
// Выражения GitHub не исполняются — модель: условие шага сверки и толкование SERPENT_PERVAYA сторожем домена
// для трёх значений выхода шага «Первая выкладка?»: 'on', 'off', '' (выход не записан).
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ZDES = fileURLToPath(new URL('.', import.meta.url));
const { parse } = await import(pathToFileURL('D:/SEO/cloud/site-generator/node_modules/yaml/dist/index.js').href);
const wf = parse(execFileSync('git', ['-C', 'D:/SEO/cloud/site-generator', 'show', '6419c9b:.github/workflows/deploy-7thserpent.yml']).toString());
const shagi = wf.jobs.deploy.steps;
const i = (k) => shagi.findIndex((s) => (s.name ?? s.uses ?? '').includes(k));
const stroki = [];

const sverka = shagi[i('сборка CI равна принятой')];
const dom = shagi[i('Домен уже привязан')];
stroki.push(`условие сверки: «${sverka.if}»; SERPENT_PERVAYA домена: «${dom.env.SERPENT_PERVAYA}»; сторож домена: pervyi = SERPENT_PERVAYA !== 'off'`);
for (const v of ['on', 'off', '']) {
  const sverkaIdet = v === 'on';
  const domenStrog = v !== 'off';
  stroki.push(`  выход «${v}»: сверка сборки ${sverkaIdet ? 'идёт' : 'пропущена'}, домен ${domenStrog ? 'как для первой' : 'как для обновления'}${sverkaIdet !== domenStrog ? ' — РАСХОЖДЕНИЕ' : ''}`);
}
const vykl = shagi[i('Выкладка по FTPS')];
stroki.push(`mirror: «${vykl.run.match(/mirror[^;]*/)[0]}» — исключений (-x/--exclude) для .well-known/ и cgi-bin/: ${/--exclude|\s-x\s/.test(vykl.run) ? 'есть' : 'НЕТ'}`);
stroki.push(`порядок: секреты ${i('Секреты на месте')}, корпус ${i('Корпус')}, npm ci ${i('Зависимости')}, сборка ${i('Сборка с гейтами')}, сторож папки ${i('Сторож папки')}, первая ${i('Первая выкладка?')}, домен ${i('Домен уже привязан')}, сверка ${i('сборка CI равна принятой')}, выкладка ${i('Выкладка по FTPS')}, пересчёт ${i('Пересчёт')}`);
stroki.push(`npm ci: «${shagi[i('Зависимости')].run}» — сырьё корпуса на диске во время скриптов установки зависимостей: ${i('Корпус') < i('Зависимости') && !/--ignore-scripts/.test(shagi[i('Зависимости')].run) ? 'ДА' : 'нет'}`);
stroki.push(`вход SERPENT_FIRST: варианты ${JSON.stringify(wf.on.workflow_dispatch.inputs.SERPENT_FIRST.options)}, тип ${wf.on.workflow_dispatch.inputs.SERPENT_FIRST.type}; env шага «Первая выкладка?»: «${shagi[i('Первая выкладка?')].env.SERPENT_FIRST}»`);
const vyvod = stroki.join('\n') + '\n';
writeFileSync(join(ZDES, 'workflow-r2.txt'), vyvod);
process.stdout.write(vyvod);
