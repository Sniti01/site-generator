// Сессия 20 (П102 «Как прочитано» п. 7): новые судьи блока Б по папке сборки — для сверки вердиктов со старыми
// на одной сборке. Только чтение; судьи — функции ядра, данные — gates/ сайта, как в сборке.
//   node novye-sudi.mjs <dist>
// Печатает по судье: что судил и вердикт (отказы поимённо). Код 0 — вывод записан (вердикт читается из вывода).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const zdes = dirname(fileURLToPath(import.meta.url));
const koren = resolve(zdes, '../../../..');
const sayt = join(koren, 'sites/7thserpent.com');
const imp = (p) => import(pathToFileURL(join(koren, p)).href);
const P = await imp('core/gates/phrases.mjs');
const H = await imp('core/gates/head.mjs');
const M = await imp('core/gates/masters.mjs');
const C = await imp('core/text/corpus.mjs');
const DF = await imp('sites/7thserpent.com/gates/phrases.mjs');
const DH = await imp('sites/7thserpent.com/gates/head.mjs');
const B = await imp('sites/7thserpent.com/tools/brief-strony.mjs');

const dist = resolve(process.argv[2] ?? '');
const stranicy = H.stranicyDist(dist).map((s) => ({ url: s.url, html: readFileSync(s.file, 'utf8') }));
console.log(`сборка: ${dist}; страниц ${stranicy.length}`);

// 1. Сторож 8 слов и судья исключений (вместо chuzhie-p5, среза окончаний, chuzhie-repliki, chuzhie-glavy).
const uk = C.ukazatelKorpusa(join(sayt, 'input/corpus'), { imena: DF.IMENA });
const frazy = P.sudSborki(stranicy.filter((s) => DF.dannye.stranica(s.url)), uk, DF.dannye);
console.log(`\n== сторож 8 слов и судья исключений (core/gates/phrases.mjs, exceptions.mjs): документов корпуса ${uk.dokumentov}, 8-грамм точно ${uk.vosmigramm.tochno}, срез ${uk.vosmigramm.srez}`);
for (const x of frazy.itogi) {
  console.log(`  ${x.url.padEnd(22)} строк ${x.strok}, слов ${x.slov}; исключений с совпадениями ${x.razresheno.size}`);
  for (const [tekst, gg] of x.razresheno) console.log(`      «${tekst}» — 8-грамм ${gg.length}: ${[...new Set(gg.map((g) => g.split(':')[0]))].join(', ')}`);
}
for (const o of frazy.otkazy) console.log(`  ОТКАЗ ${o.url}: ${o.chto}`);
console.log(`  итог: отказов ${frazy.otkazy.length}`);

// 2. Судья головы и крошек (вместо tools/glowa.mjs).
const struktura = JSON.parse(readFileSync(join(sayt, 'structure/structure.json'), 'utf8'));
const golova = H.suditNabor(stranicy, struktura, DH.ozhidanie);
console.log(`\n== судья головы и крошек (core/gates/head.mjs): страниц ${stranicy.length}`);
for (const o of golova) console.log(`  ОТКАЗ ${o.url}: [${o.vid}] ${o.chto}`);
console.log(`  итог: отказов ${golova.length}`);

// 3. Сторож утечки мастеров (новый; бэклог 59 п. 6, 61 п. 2). Круг — растровые картинки всего src/ (раунд 1 блока Б, B1-G-13).
const ut = M.utechki(dist, join(sayt, 'src'));
console.log(`\n== сторож утечки мастеров (core/gates/masters.mjs): исходных картинок ${ut.masterov}`);
for (const u of ut.utechki) console.log(`  УТЕЧКА ${u.fajl} = ${u.master}`);
console.log(`  итог: утечек ${ut.utechki.length}`);

// 4. Сторож брифов на фундаменте ядра (tools/brief-strony.mjs --check: та же функция chuzhie).
const papkaBrifov = join(sayt, 'input/briefs');
let chuzhih = 0;
const brify = readdirSync(papkaBrifov).filter((f) => f.endsWith('.md')).sort();
for (const f of brify) {
  const r = B.chuzhie(readFileSync(join(papkaBrifov, f), 'utf8'), uk);
  chuzhih += r.length;
  for (const x of r) console.log(`  ЧУЖОЕ ${f}: строка ${x.stroka} (${x.rezhim}) — ${x.dokument}`);
}
console.log(`\n== сторож брифов (tools/brief-strony.mjs на ядре): брифов ${brify.length}; строк с чужой 8-граммой ${chuzhih}`);

// 5. Одна сверка dist (блок В; вместо сверок пачек 1, 2, 4).
const S = await imp('sites/7thserpent.com/tools/sverka.mjs');
const sv = S.sverkaSborki(dist, sayt, { obyazatelnaPodpis: new Set(['/remake/', '/movie/']) });
console.log(`\n== сверка dist (tools/sverka.mjs): страниц маршрута ${sv.stranic}; замечаний ${sv.zamechaniya.length}`);
for (const o of sv.zamechaniya) console.log(`  ЗАМЕЧАНИЕ ${o.url}: ${o.chto}`);
