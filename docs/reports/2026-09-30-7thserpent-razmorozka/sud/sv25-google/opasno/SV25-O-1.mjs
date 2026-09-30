// SV25-O-1: пересчёт после выкладки не видит, что файл подтверждения владельца пропал (и что появился новый,
// несверенный файл того же образца): файлы Google корня он просто не считает, а списка «до» у него нет.
// Единственная защита файла от mirror --delete — `-x '^google[0-9A-Za-z]+\.html$'` внутри `lftp -e "…"`; поведение
// lftp здесь не измерено (шапка сторожа: «Поведение lftp (-X, -x …) здесь не измерено»), прежний `-x '^index\.html$'`
// знаков glob не имел, и живая выкладка add241a его не проверила (index.html всё равно кладёт put). Если -x не сработает
// (разбор кавычек lftp, будущая правка строки), mirror сотрёт файл владельца, а пересчёт даст зелёный.
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { SV, VERKH, NASH, KOREN_NASH, FIND_NASH, GOOGLE, STROKA, distNash, rabochaya, komanda, vyvod, shag, isklyucheniyaMirror, mirrorKoren, razborLftp } from './obshchee-o.mjs';

const { papka, pereschet, FAJL_GOOGLE } = SV;
const stroki = [];
const dist = distNash('o1-dist');

// 1. До выкладки: корень — наша прежняя выкладка и файл владельца; копия сверена — сторож папки пропускает.
const koren = KOREN_NASH() + `${GOOGLE}\n`;
const p = papka(koren, NASH, VERKH, null, { [GOOGLE]: STROKA(GOOGLE) });
stroki.push(`1. сторож папки до выкладки: ${p.ok ? 'ПРОХОД' : 'СТОП'} — ${p.stroki.join(' | ')}`);

// 2. Выкладка: модель mirror --reverse --delete с исключениями из workflow копии.
const run = shag('Выкладка по FTPS').run;
const isk = isklyucheniyaMirror(run);
stroki.push(`2. исключения mirror в workflow (как их передаёт bash): ${isk.map((i) => `-${i.vid} ${i.tekst}`).join('  ')}`);
const zapisiKornya = koren.split('\n').filter((s) => s && s !== './' && s !== '../');
const vA = mirrorKoren(zapisiKornya, VERKH, isk, 'А');
const vB = mirrorKoren(zapisiKornya, VERKH, isk, 'Б');
const bezX = mirrorKoren(zapisiKornya, VERKH, isk.filter((i) => !i.tekst.startsWith('^google')), 'А');
const gx = isk.find((i) => i.tekst.startsWith('^google')).tekst;
stroki.push(`   вариант А (кавычки lftp сняты, знаки внутри буквально — как я знаю разборщик lftp): образец ${razborLftp(gx, 'А')} на «${GOOGLE}» — ${new RegExp(razborLftp(gx, 'А')).test(GOOGLE)}; файл владельца: ${vA.ostavit.includes(GOOGLE) ? 'не тронут' : 'СТЁРТ'}`);
stroki.push(`   вариант Б (гипотеза, не замер: разборщик экранирует знаки glob в кавычках): образец ${razborLftp(gx, 'Б')} на «${GOOGLE}» — ${new RegExp(razborLftp(gx, 'Б')).test(GOOGLE)}; файл владельца: ${vB.udalit.includes(GOOGLE) ? 'СТЁРТ mirror --delete' : 'не тронут'}`);
const vV = mirrorKoren(zapisiKornya, VERKH, isk, 'В');
stroki.push(`   вариант В (гипотеза, не замер: одинарные кавычки lftp не снимает — они часть образца): образец ${razborLftp(gx, 'В')} — ${new RegExp(razborLftp(gx, 'В')).test(GOOGLE)}; файл владельца: ${vV.udalit.includes(GOOGLE) ? 'СТЁРТ mirror --delete' : 'не тронут'}`);
stroki.push(`   правка workflow без этого -x (перестановка, опечатка в строке): файл владельца: ${bezX.udalit.includes(GOOGLE) ? 'СТЁРТ mirror --delete' : 'не тронут'}`);
// index.html при любом варианте ложится на сервер: не исключён — выложит mirror, исключён — put. Живая выкладка #4 варианты не различает.
const ix = (v) => (mirrorKoren(['index.html'], VERKH, isk, v).zamenit.includes('index.html') ? 'выложит mirror, затем put' : 'исключён, выложит put');
stroki.push(`   index.html: А — ${ix('А')}; Б — ${ix('Б')}; В — ${ix('В')}: итог на сервере один и тот же, прежние выкладки о работе -x ничего не говорят`);

// 3. Пересчёт после выкладки — функция сторожа на find сервера.
const posle = {
  'П1: файл владельца на месте': FIND_NASH() + `./${GOOGLE}\n`,
  'П2: файл владельца стёрт mirror': FIND_NASH(),
  'П3: файл владельца на месте, рядом новый файл того же образца (после суда папки, не сверен)': FIND_NASH() + `./${GOOGLE}\n./googledeadbeefdeadbeef.html\n`,
};
let opasnyh = 0;
for (const [chto, find] of Object.entries(posle)) {
  const r = pereschet(find, dist);
  const opasno = r.ok && !chto.startsWith('П1');
  if (opasno) opasnyh += 1;
  stroki.push(`3. пересчёт, ${chto}: ${r.ok ? 'ПРОХОД' : 'СТОП'}${opasno ? ' — ОПАСНЫЙ ПРОХОД' : ''} — ${r.stroki.join(' | ')}`);
}

// 4. То же командой сторожа (как в шаге «Пересчёт на сервере»): файл владельца стёрт — код 0.
const w = rabochaya('o1-komanda');
writeFileSync(join(w, 'remote-files.txt'), posle['П2: файл владельца стёрт mirror']);
const k = komanda('pereschet', join(w, 'remote-files.txt'), dist);
stroki.push(`4. команда pereschet remote-files.txt dist, файл владельца стёрт: код ${k.kod} — ${k.vyvod}`);

// 5. Шаг workflow: пересчёту не передаётся список корня до выкладки, хотя он лежит в той же рабочей папке задания.
const runP = shag('Пересчёт на сервере').run;
const runS = shag('Сторож папки робота').run;
stroki.push(`5. шаг «Пересчёт на сервере»: ${runP.split('\n').filter((s) => s.includes('pereschet')).map((s) => s.trim()).join('')}`);
stroki.push(`   remote-root.txt пишет шаг «Сторож папки робота» того же задания: ${runS.includes('> remote-root.txt') ? 'да' : 'нет'}; передан пересчёту: ${runP.includes('remote-root') || runP.includes('remote-top') ? 'да' : 'нет'}`);
stroki.push(`   образец сторожа FAJL_GOOGLE = ${FAJL_GOOGLE.source}; пересчёт исключает его и на сервере, и в dist, наличие «до» не сверяет`);

stroki.push(`ИТОГ: опасных проходов пересчёта ${opasnyh} из 2 (файл владельца пропал — зелёный; новый несверенный файл — зелёный). Строки прохода П1 и П2 различаются только хвостом «не в счёте — файл подтверждения Google …»; журнал задания без токена не читается (403), ведущий видит только итог шага.`);
vyvod('SV25-O-1-vyvod.txt', stroki);
