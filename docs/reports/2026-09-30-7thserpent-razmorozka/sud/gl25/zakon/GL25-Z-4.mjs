// GL25-Z-4 — откат на коммит ДО вливания (Run workflow из ветки или метки коммита ≤ f22bb92) и Re-run прогонов #1–#5
// идут СТАРЫМ workflow: входа SERPENT_ROLLBACK в форме нет, сторожа головы нет, строки «ОТКАТ» не будет — это записано
// (П113 п. 10). Не записано: пока в корне www лежит файл подтверждения Google, сторож папки старых правил (f22bb92)
// останавливает такой запуск до mirror (сервер цел) — и его строка СТОП советует «удали их в файловом менеджере
// панели», то есть удалить файл подтверждения Search Console. Шапка workflow и описание входа отката не говорят,
// что откат входом — только на коммиты с этим workflow (вливание сессии 25 и позже).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const KOPIYA = `${PAPKA}/kopiya`;
const SAYT = `${KOPIYA}/sites/7thserpent.com`;
// rabochie-staryi/ — извлечено staryi-izvlech.mjs (git show f22bb92:…, только чтение).
const STARYI = await import(pathToFileURL(join(PAPKA, 'rabochie-staryi/storozha-vykladki.mjs')).href);
const NOVYI = await import(pathToFileURL(`${SAYT}/tools/storozha-vykladki.mjs`).href);
const yaml = createRequire(`${SAYT}/tools/testy/storozha-vykladki.test.mjs`)('yaml');

const out = [];
const p = (s = '') => out.push(s);

// 1. Старый workflow: какие входы покажет форма Run workflow на коммите ≤ f22bb92, есть ли сторож головы.
const WFs = yaml.parse(readFileSync(join(PAPKA, 'rabochie-staryi/deploy-7thserpent.yml'), 'utf8'));
p(`workflow f22bb92: входы формы — ${Object.keys(WFs.on.workflow_dispatch.inputs ?? {}).join(', ')}; шаг «Коммит запуска — голова main» — ${WFs.jobs.deploy.steps.some((s) => /голова main/.test(s.name ?? '')) ? 'есть' : 'НЕТ'}; -x для google*.html в mirror — ${/google/.test(JSON.stringify(WFs.jobs.deploy.steps)) ? 'есть' : 'НЕТ'}`);

// 2. Корень прежней выкладки + файл Google — как его видит cls -1 -a -F.
const fajly = Object.keys(JSON.parse(readFileSync(`${SAYT}/gates/sborka-prinyataya.json`, 'utf8')).fajly);
const verkh = [...new Set(fajly.map((f) => f.split('/')[0]))];
const papki = new Set(fajly.filter((f) => f.includes('/')).map((f) => f.split('/')[0]));
const GOOGLE = 'google0123456789abcdef.html';
const koren = ['./', '../', ...verkh.map((n) => (papki.has(n) ? `${n}/` : n)), GOOGLE].join('\n') + '\n';
const index = '<!doctype html><html><head><title>x</title><link rel="canonical" href="https://www.7thserpent.com/"></head><body></body></html>';

const s = STARYI.papka(koren, index, verkh, null);
const kontrol = STARYI.papka(koren.replace(`${GOOGLE}\n`, ''), index, verkh, null);
const n = NOVYI.papka(koren, index, verkh, null, { [GOOGLE]: `google-site-verification: ${GOOGLE}` });
p();
p(`[сторож папки f22bb92, корень с файлом Google] ok = ${s.ok}`);
for (const x of s.stroki) p(`  ${x}`);
p(`[он же без файла Google — контроль] ok = ${kontrol.ok}`);
p(`[сторож папки сессии 25, верная копия файла] ok = ${n.ok}`);

// 3. Что говорят тексты этой правки об отказе на коммиты до вливания.
const WF_TEKST = readFileSync(`${KOPIYA}/.github/workflows/deploy-7thserpent.yml`, 'utf8');
const WF = yaml.parse(WF_TEKST);
const opisanie = WF.on.workflow_dispatch.inputs.SERPENT_ROLLBACK.description;
const shapka = WF_TEKST.split('\n').filter((x) => x.startsWith('#')).join('\n');
const predel = /до вливания|до этого сторожа|этой сессии и позже|только на коммиты|старых коммит/;
p();
p(`описание входа: «${opisanie}»`);
p(`  называет предел «откат — только на коммиты с этим workflow»: ${predel.test(opisanie) ? 'да' : 'НЕТ'}`);
p(`шапка: строки об откате и Re-run —`);
for (const x of shapka.split('\n').filter((y) => /Откат|откат|Re-run/.test(y))) p(`  ${x}`);
p(`  шапка говорит, что откат входом — только на коммиты с этим workflow: ${/Откат[^.]*(до вливания|только на коммиты|этой сессии и позже)/.test(shapka) ? 'да' : 'НЕТ'}`);
p(`  шапка говорит, что старый workflow остановится на файле Google и его СТОП велит удалить файл: ${/google[^\n]*(удал|не удаля)/i.test(shapka) ? 'да' : 'НЕТ'}`);

p();
p('ИТОГ:');
p(`  ${!s.ok && kontrol.ok ? 'ДА' : 'НЕТ'} — откат на коммит до вливания и Re-run #5 (workflow f22bb92) стоят на стороже папки из-за файла Google (сервер не тронут)`);
p(`  ${/удали их в файловом менеджере панели/.test(s.stroki.join(' ')) ? 'ДА' : 'НЕТ'} — строка этого СТОП советует удалить записи, среди них — файл подтверждения Search Console`);
p('  Предел: прогоны #1–#4 созданы на более ранних коммитах — их workflow здесь не проверялся (сторож папки белым списком —');
p('  с сессии 22; вероятно, тот же стоп).');

const vyvod = `${out.join('\n')}\n`;
writeFileSync(join(PAPKA, 'GL25-Z-4-vyvod.txt'), vyvod);
console.log(vyvod);
