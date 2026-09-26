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
//   - кадр — тот же: ключ файла кандидата (имя до первой точки) «до» = «после»; при том же кандидате —
//     тот же файл `src` целиком (хеш Astro), иначе нарушение («судью судят», раунд 1, P3-R1-INSTR-7);
//   - кандидат «после» обязан быть не меньше кандидата «до» — это и есть «растяжение не больше»;
//   - растяжение печатается по точной пропорции мастера (ширина/высота из src/data/game-art.json,
//     ключ — имя файла кандидата до первой точки): max(ширина рамки, высота рамки × пропорция) × DPR /
//     ширина кандидата. Рамка в выгрузке округлена до целых — одинаково в обеих колонках.
// Число инструмента печатается рядом; клетка, где оно «после» больше не более чем на 0,02 при той же
// рамке и том же файле кандидата, — «шум округления»; больше 0,02 — нарушение (раунд 1, P3-R1-INSTR-10).
// ВХОД ОТКАЗЫВАЕТ (выход 2, раунд 1, P3-R1-INSTR-5, -6, -8, -9; раунд 2, P3-R2-INSTR-1, -2): файл
// не читается или не JSON-массив; массив пуст; два файла побайтно равны; ключ клетки повторяется; у клетки
// нечисловые кандидат, DPR, нарисованная ширина или растяжение (кадр не загрузился), рамка — не два
// числа, нет src; нет записи game-art.json для кадра. ПРЕДЕЛ (P3-R1-INSTR-8, P3-R2-INSTR-3): сборки
// в выгрузке нет — какая сборка «до» и какая «после», знает только тот, кто снимал; отказ на равных файлах
// ловит лишь грубую подмену (два честных прогона разных сборок с теми же числами тоже побайтно равны —
// так вышло у 103c0e8 и 1d68052, их сравнивали с «до» порознь). В ветви «лучше» кандидат с лестницей
// srcset не сверяется (P3-R2-INSTR-9).
// Выход: 0 — нигде не хуже; 1 — есть клетка с меньшим кандидатом, другой рамкой, другим кадром, без пары
// или с ростом числа инструмента сверх 0,02; 2 — вход.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const vkhod = (s) => {
  console.error('вход: ' + s);
  process.exit(2);
};
const [, , fDo, fPosle] = process.argv;
if (!fDo || !fPosle) vkhod('node sravnenie-rastyazheniya.mjs <до.json> <после.json>');
let bDo, bPosle;
try {
  bDo = readFileSync(fDo);
  bPosle = readFileSync(fPosle);
} catch (e) {
  vkhod(e.message);
}
if (bDo.equals(bPosle)) vkhod('файлы «до» и «после» побайтно равны — сравнивать нечего');
const chitat = (b, f) => {
  let o;
  try {
    const t = b.toString('utf8');
    o = JSON.parse(t.slice(t.indexOf('[')));
  } catch (e) {
    vkhod(`${f}: не JSON (${e.message})`);
  }
  if (!Array.isArray(o)) vkhod(`${f}: не массив`);
  return o;
};
const koren = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
let art;
try {
  art = JSON.parse(readFileSync(join(koren, 'sites/7thserpent.com/src/data/game-art.json'), 'utf8'));
} catch (e) {
  vkhod('game-art.json: ' + e.message);
}
const klyuchKadra = (src) => String(src).split('.')[0];
const proporciya = (src) => {
  const k = klyuchKadra(src);
  if (!art[k]) vkhod('нет записи game-art.json для кадра ' + src);
  return art[k].width / art[k].height;
};
const klyuch = (r) => `${r.adres} ${r.okno}@${r.dpr}`;
const karta = (stroki, f) => {
  const m = new Map();
  for (const r of stroki) {
    const k = klyuch(r);
    if (m.has(k)) vkhod(`${f}: клетка ${k} повторяется`);
    const chislo = (x) => typeof x === 'number' && Number.isFinite(x) && x > 0;
    // Раунд 2 (P3-R2-INSTR-1, -2): кадр, который не загрузился, rastyazhenie.js пишет с narisovano и
    // rastyazhenie null при живых кандидате и рамке; рамка — ровно два числа.
    if (!chislo(r.kandidat) || !chislo(r.dpr) || !Array.isArray(r.ramka) || r.ramka.length !== 2 || !r.ramka.every(chislo) ||
        !chislo(r.narisovano) || !chislo(r.rastyazhenie) || typeof r.src !== 'string' || !r.src) {
      vkhod(`${f}: у клетки ${k} нечисловые кандидат, DPR, рамка, нарисовано или растяжение, или нет src`);
    }
    m.set(k, r);
  }
  return m;
};
const strokiDo = chitat(bDo, fDo);
const strokiPosle = chitat(bPosle, fPosle);
if (!strokiDo.length || !strokiPosle.length) vkhod('пустой вход — «клеток 0» не выдаётся');
const DO = karta(strokiDo, fDo);
const POSLE = karta(strokiPosle, fPosle);

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
  if (klyuchKadra(a.src) !== klyuchKadra(b.src)) {
    narusheniy += 1;
    stroki.push(`НАРУШЕНИЕ ${k}: кадр сменился (${a.src} → ${b.src})`);
    continue;
  }
  const p = proporciya(b.src);
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
  } else if (a.src !== b.src) {
    vid = `НАРУШЕНИЕ: тот же кандидат ${a.kandidat}, другой файл (${a.src} → ${b.src})`;
    narusheniy += 1;
  } else if (b.rastyazhenie > a.rastyazhenie) {
    if (b.rastyazhenie - a.rastyazhenie <= 0.02 + 1e-9) {
      vid += `; шум округления инструмента ×${a.rastyazhenie} → ×${b.rastyazhenie}`;
      shuma += 1;
    } else {
      vid = `НАРУШЕНИЕ: число инструмента выросло сверх округления ×${a.rastyazhenie} → ×${b.rastyazhenie}`;
      narusheniy += 1;
    }
  }
  stroki.push(`${k.padEnd(28)} рамка ${b.ramka.join('×').padEnd(9)} кандидат ${String(a.kandidat).padStart(4)} → ${String(b.kandidat).padStart(4)}  точно ×${tDo.toFixed(2)} → ×${tPosle.toFixed(2)}  (инструмент ×${a.rastyazhenie} → ×${b.rastyazhenie})  ${vid}`);
}
const tozhe = vse.length - luchshe - narusheniy;
console.log(`до: ${fDo} (строк ${strokiDo.length})\nпосле: ${fPosle} (строк ${strokiPosle.length})\n`);
console.log(stroki.join('\n'));
console.log(`\nклеток ${vse.length}; лучше ${luchshe}; то же ${tozhe}; нарушений ${narusheniy}; шум округления инструмента ${shuma}`);
process.exit(narusheniy ? 1 : 0);
