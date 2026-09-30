// ДЕРЖИТ / ПРЕДЕЛ (для листа): Re-run прогонов #1–#5 и откат на коммит до вливания (Run workflow из ветки или метки
// коммита ≤ f22bb92) идут СТАРЫМ workflow — без сторожа головы и без входа SERPENT_ROLLBACK. Что их остановит сейчас,
// когда в корне www лежит файл подтверждения Google: сторож папки старых правил (f22bb92) на том же корне против
// сторожа папки копии (сессия 25) с верной копией файла.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const SAYT = `${PAPKA}/kopiya/sites/7thserpent.com`;
const STARYI = await import(pathToFileURL(join(PAPKA, 'rabochie-staryi/storozha-vykladki.mjs')).href);
const NOVYI = await import(pathToFileURL(`${SAYT}/tools/storozha-vykladki.mjs`).href);

const out = [];
const p = (s = '') => out.push(s);

// Корень прежней выкладки — первый уровень принятого списка сборки (как его видит cls -1 -a -F), плюс файл Google.
const fajly = Object.keys(JSON.parse(readFileSync(`${SAYT}/gates/sborka-prinyataya.json`, 'utf8')).fajly);
const verkh = [...new Set(fajly.map((f) => f.split('/')[0]))];
const papki = new Set(fajly.filter((f) => f.includes('/')).map((f) => f.split('/')[0]));
const GOOGLE = 'google0123456789abcdef.html';
const koren = ['./', '../', ...verkh.map((n) => (papki.has(n) ? `${n}/` : n)), GOOGLE].join('\n') + '\n';
const index = '<!doctype html><html><head><title>x</title><link rel="canonical" href="https://www.7thserpent.com/"></head><body></body></html>';
p(`корень (cls -1 -a -F), записей ${koren.trim().split('\n').length}: ${koren.trim().split('\n').join(' ')}`);

const s = STARYI.papka(koren, index, verkh, null);
p();
p(`[сторож папки f22bb92 — Re-run #1–#5 или откат на коммит до вливания] ok = ${s.ok}`);
for (const x of s.stroki) p(`  ${x}`);

const n = NOVYI.papka(koren, index, verkh, null, { [GOOGLE]: `google-site-verification: ${GOOGLE}` });
p();
p(`[сторож папки сессии 25 с верной копией файла Google] ok = ${n.ok}`);
for (const x of n.stroki) p(`  ${x}`);

const bezGoogle = STARYI.papka(koren.replace(`${GOOGLE}\n`, ''), index, verkh, null);
p();
p(`[сторож папки f22bb92 на том же корне без файла Google — контроль] ok = ${bezGoogle.ok}`);
for (const x of bezGoogle.stroki) p(`  ${x}`);

p();
p('ИТОГ:');
p(`  ${!s.ok && bezGoogle.ok ? 'ДА' : 'НЕТ'} — старый workflow останавливается сторожем папки именно на файле Google (без него — проход): Re-run старых прогонов и откат на коммит до вливания — стоп до mirror, сервер не тронут, файл Google цел`);
p(`  ${n.ok ? 'ДА' : 'НЕТ'} — новый сторож папки тот же корень пропускает`);
p('  Следствие для листа: откат входом SERPENT_ROLLBACK возможен только на коммиты с workflow этой сессии и позже; откат на коммит до вливания — стоп старого сторожа папки (без строки ОТКАТ), пока файл Google в корне.');

const vyvod = `${out.join('\n')}\n`;
writeFileSync(join(PAPKA, 'derzhit-staryi.txt'), vyvod);
console.log(vyvod);
