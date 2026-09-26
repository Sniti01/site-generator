// Сравнение растяжения героя «до» и «после» правки sizes (сессия 16, П93 п. 0г: «Принято, если по
// таблице rastyazhenie (те же окна и DPR) растяжение «после» нигде не больше «до»»). Только чтение.
//
//   node sravnenie-rastyazheniya.mjs <до.json> <после.json>
//
// Вход — выгрузки window.__rast копии rastyazhenie.js (массив клеток: адрес, окно, DPR, рамка,
// кандидат, src, нарисовано, растяжение). Клетка сравнивается с клеткой того же адреса, окна и DPR;
// набор клеток обязан совпасть.
// ПОЧЕМУ НЕ ЧИСЛО ИНСТРУМЕНТА. rastyazhenie.js считает пропорцию кадра как naturalWidth/naturalHeight,
// а при srcset с дескриптором w обе величины пересчитаны по sizes и округлены до целых: сменился sizes —
// сменилось округление, и «нарисовано» гуляет на 1–3 px при той же рамке и том же кандидате
// (1024×768 при DPR 3 у /max-payne-1/: ×2 «до» и ×2,01 «после»). Поэтому здесь:
//   - рамка «до» и «после» обязана совпасть (те же правила CSS — та же рамка);
//   - кандидат «после» обязан быть не меньше кандидата «до» — это и есть «растяжение не больше»;
//   - растяжение печатается по точной пропорции мастера (ширина/высота из src/data/game-art.json,
//     ключ — имя файла кандидата до первой точки): max(ширина рамки, высота рамки × пропорция) × DPR /
//     ширина кандидата. Рамка в выгрузке округлена до целых — одинаково в обеих колонках.
// Число инструмента печатается рядом; клетка, где оно «после» больше, а рамка и кандидат те же, —
// помечается «шум округления», не нарушение.
// Выход: 0 — нигде не хуже; 1 — есть клетка с меньшим кандидатом, другой рамкой или без пары; 2 — вход.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , fDo, fPosle] = process.argv;
if (!fDo || !fPosle) {
  console.error('node sravnenie-rastyazheniya.mjs <до.json> <после.json>');
  process.exit(2);
}
const chitat = (f) => {
  const t = readFileSync(f, 'utf8');
  return JSON.parse(t.slice(t.indexOf('[')));
};
const koren = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const art = JSON.parse(readFileSync(join(koren, 'sites/7thserpent.com/src/data/game-art.json'), 'utf8'));
const proporciya = (src) => {
  const k = src.split('.')[0];
  if (!art[k]) throw new Error('нет записи game-art.json для кадра ' + src);
  return art[k].width / art[k].height;
};
const klyuch = (r) => `${r.adres} ${r.okno}@${r.dpr}`;
const DO = new Map(chitat(fDo).map((r) => [klyuch(r), r]));
const POSLE = new Map(chitat(fPosle).map((r) => [klyuch(r), r]));

const stroki = [];
let narusheniy = 0;
let shuma = 0;
let luchshe = 0;
const vse = [...new Set([...DO.keys(), ...POSLE.keys()])];
for (const k of vse) {
  const a = DO.get(k);
  const b = POSLE.get(k);
  if (!a || !b) {
    narusheniy += 1;
    stroki.push(`НАРУШЕНИЕ ${k}: клетки нет ${a ? '«после»' : '«до»'}`);
    continue;
  }
  const p = proporciya(b.src);
  if (proporciya(a.src) !== p) {
    narusheniy += 1;
    stroki.push(`НАРУШЕНИЕ ${k}: кадр сменился (${a.src} → ${b.src})`);
    continue;
  }
  const tochno = (r) => (Math.max(r.ramka[0], r.ramka[1] * p) * r.dpr) / r.kandidat;
  const tDo = tochno(a);
  const tPosle = tochno(b);
  const ramkaTa = a.ramka[0] === b.ramka[0] && a.ramka[1] === b.ramka[1];
  let vid = 'то же';
  if (!ramkaTa) {
    vid = `НАРУШЕНИЕ: рамка ${a.ramka.join('×')} → ${b.ramka.join('×')}`;
    narusheniy += 1;
  } else if (b.kandidat < a.kandidat) {
    vid = `НАРУШЕНИЕ: кандидат ${a.kandidat} → ${b.kandidat}`;
    narusheniy += 1;
  } else if (b.kandidat > a.kandidat) {
    vid = `лучше: кандидат ${a.kandidat} → ${b.kandidat}`;
    luchshe += 1;
  }
  if (ramkaTa && b.kandidat === a.kandidat && b.rastyazhenie > a.rastyazhenie) {
    vid += `; шум округления инструмента ×${a.rastyazhenie} → ×${b.rastyazhenie}`;
    shuma += 1;
  }
  stroki.push(`${k.padEnd(28)} рамка ${b.ramka.join('×').padEnd(9)} кандидат ${String(a.kandidat).padStart(4)} → ${String(b.kandidat).padStart(4)}  точно ×${tDo.toFixed(2)} → ×${tPosle.toFixed(2)}  (инструмент ×${a.rastyazhenie} → ×${b.rastyazhenie})  ${vid}`);
}
console.log(`до: ${fDo}\nпосле: ${fPosle}\n`);
console.log(stroki.join('\n'));
console.log(`\nклеток ${vse.length}; лучше ${luchshe}; то же ${vse.length - luchshe - narusheniy}; нарушений ${narusheniy}; шум округления инструмента ${shuma}`);
process.exit(narusheniy ? 1 : 0);
