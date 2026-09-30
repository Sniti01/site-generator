// SV25-O-3 (низкая, класс прежний): razobratSpisok обрезает края каждой строки cls (String.prototype.trim — пробел,
// табуляция, NBSP, U+FEFF, разделители строк). Двойник имени файла Google с таким знаком по краю сливается с настоящим
// файлом: сторож видит два одинаковых имени, сверяет обе записи по копии настоящего и пропускает. `-x` lftp сверяет
// сырое имя — двойник под исключение не попадает, его в dist нет — mirror --delete его стирает без стопа сторожа.
// Прежде (9a6a933) такой корень был стопом («записи, которых нет ни в этой сборке…»). Тот же класс у имён сборки
// (« favicon.ico») был и до П113 — это показывает контроль К1.
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { SV, VERKH, NASH, KOREN_NASH, GOOGLE, STROKA, distNash, rabochaya, komanda, vyvod, shag, isklyucheniyaMirror, mirrorKoren, globV } from './obshchee-o.mjs';

const { papka, razobratSpisok } = SV;
const z = (...k) => String.fromCharCode(...k);
const stroki = [];
const dist = distNash('o3-dist');
const w = rabochaya('o3');
const staryi = spawnSync('git', ['-C', 'D:/SEO/cloud/site-generator', 'show', '9a6a933:sites/7thserpent.com/tools/storozha-vykladki.mjs'], { encoding: 'utf8' });
if (staryi.status !== 0) throw new Error(`git show: ${staryi.stderr}`);
mkdirSync(join(w, 'staryi/tools'), { recursive: true });
writeFileSync(join(w, 'staryi/tools/storozha-vykladki.mjs'), staryi.stdout);
const SV0 = await import(pathToFileURL(join(w, 'staryi/tools/storozha-vykladki.mjs')).href);
const isk = isklyucheniyaMirror(shag('Выкладка по FTPS').run);
const pokaz = (s) => JSON.stringify(s).replace(/[\u00a0\ufeff\u2028]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

const DVOJNIKI = [
  ['Д1 пробел в конце', `${GOOGLE} `],
  ['Д2 пробел в начале', ` ${GOOGLE}`],
  ['Д3 NBSP в конце', `${GOOGLE}${z(0xa0)}`],
  ['Д4 U+FEFF в начале', `${z(0xfeff)}${GOOGLE}`],
  ['Д5 табуляция в конце', `${GOOGLE}\t`],
];
let opasnyh = 0;
for (const [chto, dv] of DVOJNIKI) {
  const koren = KOREN_NASH() + `${GOOGLE}\n${dv}\n`;
  const r = papka(koren, NASH, VERKH, null, { [GOOGLE]: STROKA(GOOGLE) });
  const r0 = SV0.papka(koren, NASH, VERKH, null);
  const m = mirrorKoren([GOOGLE, dv], VERKH, isk, 'А');
  const skachaetsya = globV('google*.html').test(dv);
  const opasno = r.ok && m.udalit.includes(dv);
  if (opasno) opasnyh += 1;
  stroki.push(`${chto} ${pokaz(dv)}: сторож ${r.ok ? 'ПРОХОД' : 'СТОП'}${opasno ? ' — ОПАСНЫЙ ПРОХОД: mirror --delete сотрёт двойник' : ''}; до П113 — ${r0.ok ? 'проход' : 'стоп'}`);
  stroki.push(`    имена после razobratSpisok: ${pokaz(razobratSpisok(`${GOOGLE}\n${dv}\n`))}; скачает ли двойника --include-glob=google*.html: ${skachaetsya}; модель mirror: стереть ${pokaz(m.udalit)}, не трогать ${pokaz(m.ostavit)}`);
  stroki.push(`    строка сторожа: ${r.stroki.join(' | ')}`);
}

// Двойник без настоящего файла — стоп «не скачан» (скачивание по glob двойника не берёт): безопасно.
const odin = papka(KOREN_NASH() + `${GOOGLE} \n`, NASH, VERKH, null, {});
stroki.push(`К0 двойник без настоящего файла: ${odin.ok ? 'ПРОХОД' : 'СТОП'} — ${odin.stroki.join(' | ').slice(0, 140)}…`);
// Контроль: класс прежний — « favicon.ico» рядом с нашей выкладкой проходил и до П113.
const fav = ' favicon.ico';
const k1 = papka(KOREN_NASH() + `${fav}\n`, NASH, VERKH, null, {});
const k10 = SV0.papka(KOREN_NASH() + `${fav}\n`, NASH, VERKH, null);
stroki.push(`К1 « favicon.ico» рядом с нашей выкладкой: сейчас ${k1.ok ? 'проход' : 'стоп'}, до П113 ${k10.ok ? 'проход' : 'стоп'}; модель mirror: ${pokaz(mirrorKoren([fav], VERKH, isk, 'А').udalit)} — стереть`);

// Командой, как в workflow (двойник Д1): копия настоящего файла скачана, двойник glob не берёт.
const kd = join(w, 'komanda');
mkdirSync(join(kd, 'remote-top'), { recursive: true });
writeFileSync(join(kd, 'remote-root.txt'), KOREN_NASH() + `${GOOGLE}\n${GOOGLE} \n`);
writeFileSync(join(kd, 'remote-top', 'index.html'), NASH);
writeFileSync(join(kd, 'remote-top', GOOGLE), STROKA(GOOGLE));
const k = komanda('papka', join(kd, 'remote-root.txt'), join(kd, 'remote-top', 'index.html'), dist, join(kd, 'remote-top', 'sitemap-0.xml'), join(kd, 'remote-top'));
stroki.push(`команда papka (Д1): код ${k.kod} — ${k.vyvod}`);
stroki.push(`ИТОГ: опасных проходов ${opasnyh} из ${DVOJNIKI.length} (двойник стирается mirror --delete без стопа). Предел: как cls и MLSD/LIST этого сервера показывают имена с пробелами по краям, не измерено; класс «обрезка краёв имени» — прежний (К1).`);
vyvod('SV25-O-3-vyvod.txt', stroki);
