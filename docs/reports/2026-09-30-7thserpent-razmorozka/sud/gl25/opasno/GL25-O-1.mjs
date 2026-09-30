// GL25-O-1: сторож головы сверяет коммит один раз — третьим шагом задания; mirror идёт минуты спустя (npm ci, корпус,
// сборка, apt-get lftp, сторож папки, домен). Push в main в этом окне (например, откат плохого коммита revert-ом) —
// и прогон выкладывает коммит, который уже не голова main, без входа отката; новый прогон ждёт в очереди concurrency.
// Скрипт: разбор workflow копии; сторож копии в два момента времени; предлагаемая проба — красная на workflow копии,
// зелёная на мутанте со второй сверкой перед mirror. Workflow копии не меняется (мутант — в памяти).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const KOPIYA = join(TUT, 'kopiya');
const require = createRequire(join(KOPIYA, 'sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs'));
const { parse } = require('yaml');
const SV = await import(pathToFileURL(join(KOPIYA, 'sites/7thserpent.com/tools/storozha-vykladki.mjs')).href);
const WF_TEKST = readFileSync(join(KOPIYA, '.github/workflows/deploy-7thserpent.yml'), 'utf8');
const out = [];
const log = (s = '') => out.push(s);

const WF = parse(WF_TEKST);
const shagi = WF.jobs.deploy.steps;
const golovy = shagi.map((s, n) => [n, s]).filter(([, s]) => /storozha-vykladki\.mjs golova/.test(s.run ?? ''));
const iM = shagi.findIndex((s) => /mirror --reverse/.test(s.run ?? ''));
log('== 1. workflow копии: где сверка головы и где mirror');
shagi.forEach((s, n) => log(`  ${String(n).padStart(2)} ${s.name ?? s.uses}${/golova/.test(s.run ?? '') ? '   <- golova' : ''}${n === iM ? '   <- mirror --reverse --delete' : ''}`));
log(`команда golova — в шагах: ${golovy.map(([n]) => n).join(', ')} (раз: ${golovy.length}); mirror — шаг ${iM}`);
log(`между последней сверкой и mirror шагов: ${iM - golovy.at(-1)[0] - 1} (${shagi.slice(golovy.at(-1)[0] + 1, iM).map((s) => s.name ?? s.uses).join(' → ')})`);
log(`concurrency: ${JSON.stringify(WF.concurrency)} — новый прогон ждёт конца текущего, текущий не отменяется`);
log('Длительность задания — прогон #4 (П111 «Как прочитано» п. 2): 19:49:45–19:53:39 UTC, 3 мин 54 с; сторож головы — 3-й шаг,');
log('mirror — 13-й: окно между сверкой и выкладкой — время шагов 4–12, порядка трёх минут в каждом прогоне.');

// 2. Сторож копии в два момента.
const X = '1111111111111111111111111111111111111111';
const Y = '2222222222222222222222222222222222222222';
const ls = (sha) => `${sha}\trefs/heads/main\n`;
log('');
log('== 2. push X → прогон X; через минуту push Y (revert X) → прогон Y ждёт в очереди');
const t1 = SV.golova({ kommit: X, lsRemote: ls(X) });
log(`  шаг 3 прогона X (голова = X): ok=${t1.ok}: ${t1.stroki.join(' | ')}`);
const t2 = SV.golova({ kommit: X, lsRemote: ls(Y) });
log(`  перед mirror прогона X голова уже Y — сверки нет; будь она, сторож сказал бы: ok=${t2.ok}: ${t2.stroki.join(' | ').slice(0, 150)}…`);
log('  фактически: mirror выкладывает X (не голову main, без входа отката); прогон Y стартует только после конца прогона X');
log('  (очередь concurrency) и доходит до своего mirror ещё через ~3 минуты — всё это время живой сайт — отменённый X.');

// 3. Предлагаемая проба и мутант.
const proba = (wf) => {
  const st = wf.jobs.deploy.steps;
  const g = st.map((s, n) => [n, s]).filter(([, s]) => /storozha-vykladki\.mjs golova/.test(s.run ?? ''));
  const m = st.findIndex((s) => s.name === 'Выкладка по FTPS');
  const oshibki = [];
  if (g.length !== 2) oshibki.push(`golova — ${g.length} раз, ждём 2`);
  const iNode = st.findIndex((s) => /^actions\/setup-node@/.test(s.uses ?? ''));
  if (!g.length || g[0][0] !== iNode + 1) oshibki.push('первая сверка — не сразу после setup-node');
  if (!g.length || g.at(-1)[0] !== m - 1) oshibki.push(`последняя сверка — не шаг прямо перед «Выкладка по FTPS» (шаг ${g.at(-1)?.[0]}, mirror — ${m})`);
  if (g.length === 2 && JSON.stringify(g[0][1].env) !== JSON.stringify(g[1][1].env)) oshibki.push('env сверок различается');
  return oshibki;
};
const shagSverki = [
  '      # Коммит запуска — всё ещё голова main (GL25-O-1): push в main за время сборки — стоп до mirror.',
  '      - name: Коммит запуска — всё ещё голова main',
  '        env:',
  "          GIT_TERMINAL_PROMPT: '0'",
  "          SERPENT_ROLLBACK: ${{ github.run_attempt == 1 && inputs.SERPENT_ROLLBACK || 'off' }}",
  '        run: |',
  '          git ls-remote "$GITHUB_SERVER_URL/$GITHUB_REPOSITORY" refs/heads/main > golova-main.txt 2> golova-main-oshibki.txt || echo "git ls-remote закончился ненулевым кодом" >> golova-main-oshibki.txt',
  '          node $SITE/tools/storozha-vykladki.mjs golova golova-main.txt golova-main-oshibki.txt',
  '',
].join(WF_TEKST.includes('\r\n') ? '\r\n' : '\n');
const yakor = '      - name: Выкладка по FTPS';
if (!WF_TEKST.includes(yakor)) throw new Error('нет якоря шага выкладки');
const MUTANT = WF_TEKST.replace(yakor, shagSverki + yakor);
log('');
log('== 3. предлагаемая проба «сверка головы — сразу после setup-node и шагом прямо перед Выкладка по FTPS, env одинаков»');
const k = proba(WF);
log(`  workflow копии: ${k.length ? 'КРАСНАЯ — ' + k.join('; ') : 'зелёная'}`);
const m = proba(parse(MUTANT));
log(`  мутант со второй сверкой: ${m.length ? 'КРАСНАЯ — ' + m.join('; ') : 'зелёная'}`);

writeFileSync(join(TUT, 'GL25-O-1-vyvod.txt'), out.join('\n') + '\n');
