// Краснота тестов «ветвь без пробы» (R5-SVERKA-4) мутацией ветви: znak.mjs подменяется в памяти крюком загрузчика,
// прогон — node --test tools/testy/znak.test.mjs с шаблоном R5-SVERKA-4. Журнал — по мутации: какой подтест упал.
//   node mutacii-znak.mjs <журнал>
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const KRYUK = pathToFileURL(join(import.meta.dirname, 'kryuk-znak.mjs')).href;
const MUTACII = [
  { imya: 'R5-SVERKA-4 (а): экранирование прочим знаком не раскрывается', iz: "return nl ? '' : c ?? '';", na: "return nl ? '' : c ? '\\\\' + c : '';", zhdem: 'экранированный пробел в имени своей @font-face' },
  { imya: 'R5-SVERKA-4 (б): обратная ссылка кавычек — только одинарные', iz: "Bodoni Moda\\1\\s*(,|$)/.test(d.wartosc))) bledy.push(", na: "Bodoni Moda'\\s*(,|$)/.test(d.wartosc))) bledy.push(", zhdem: '--font-display в двойных кавычках' },
  { imya: 'R5-SVERKA-4 (в): @property --font-display не судится', iz: " || pr[1] === 'font-display'", na: '', zhdem: '@property --font-display' },
  { imya: 'R5-SVERKA-4 (г): имя @property с учётом регистра', iz: '$/i.exec(prelude)', na: '$/.exec(prelude)', zhdem: '@PROPERTY прописными' },
];
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const out = [];
for (const m of MUTACII) {
  const r = spawnSync(process.execPath, ['--import', KRYUK, '--test', '--test-reporter=spec', '--test-name-pattern=^R5-SVERKA-4', 'tools/testy/znak.test.mjs'], {
    cwd: SAYT,
    encoding: 'utf8',
    env: { ...ENV, ZNAK_MUTACIYA: JSON.stringify(m), FORCE_COLOR: '0', NO_COLOR: '1' },
    maxBuffer: 64 * 1024 * 1024,
  });
  const v = `${r.stdout}${r.stderr}`;
  const upal = v.split('\n').some((l) => l.includes('✖') && l.includes(m.zhdem));
  out.push(`== мутация: ${m.imya}\n   подтест «${m.zhdem}»: ${upal ? 'УПАЛ (красный)' : 'НЕ упал'}; код node ${r.status}`);
  out.push(v.split('\n').filter((l) => /^\s*(✔|✖) /.test(l)).map((l) => '   ' + l.trim()).join('\n'));
}
writeFileSync(process.argv[2], out.join('\n') + '\n');
console.log(out.filter((s) => s.startsWith('==')).join('\n'));
