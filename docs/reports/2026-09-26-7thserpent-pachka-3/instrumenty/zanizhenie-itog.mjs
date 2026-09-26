// Текст итога замера занижения sizes героя (сессия 16) из выгрузки window.__zan инструмента
// zanizhenie.js — записанный шаг, а не ручное переформатирование («судью судят», раунд 1, P3-R1-INSTR-13).
//
//   node zanizhenie-itog.mjs <zanizhenie.json> > <zanizhenie.txt>
//
// Сравнения «больше 1» и «герой выше границы» — по неокруглённым числам; округление — только в печати.
import { readFileSync } from 'node:fs';

const f = process.argv[2];
if (!f) {
  console.error('node zanizhenie-itog.mjs <zanizhenie.json>');
  process.exit(2);
}
const t = readFileSync(f, 'utf8');
const z = JSON.parse(t.slice(t.indexOf('{')));
const r4 = (x) => x.toFixed(4);
const r1 = (x) => (Math.round(x * 10) / 10).toString();
const k = z.kletki;
const plokhie = k.filter((x) => !x.sverka);
// «больше 1» — сверх 1,0005: значение sizes раскладка округляет до 1/64 px (раунд 2, P3-R2-INSTR-5)
const shire = k.filter((x) => x.zanizhenie > 1.0005);
const L = [
  `сборка ${z.sborka}, сервер ${z.base}, DPR 1; инструмент instrumenty/zanizhenie.js, текст — instrumenty/zanizhenie-itog.mjs`,
  `часть 1 — клетки с навигацией: ${k.length} (4 страницы × ${k.length / 4} окон); разбор sizes против значения браузера (naturalWidth × w / ширина файла): расхождений больше 1 px или чужой кадр — ${plokhie.length}${plokhie.length ? ': ' + plokhie.map((x) => x.adres + ' ' + x.okno).join(', ') : ''}`,
  `часть 1 — клетки, где sizes меньше нарисованной ширины: ${shire.map((x) => `${x.adres} ${x.okno} ×${r4(x.zanizhenie)}`).join(', ') || 'нет'}`,
  'часть 2 — скан ширин 641–2560 шагом 1 px при высоте окна 600 (нижняя граница высоты героя — 600 px):',
  ...Object.entries(z.skan).map(([a, s]) => `  ${a}: наибольшее занижение ×${r4(s.hudshee.zanizhenie)} на ${s.hudshee.okno} (герой ${r1(s.hudshee.geroy)}, нарисовано ${r1(s.hudshee.narisovano)}, sizes ${r1(s.hudshee.znachenie)}); герой выше границы на ширинах ${s.rostOtrezki.join(', ') || 'нигде'}; занижение больше 1 на ширинах ${(s.zanizhenieOtrezki ?? []).join(', ') || 'нигде'}`),
  'до 640 px высота рамки арта от текста не зависит (полоса max(40vh, 260px)); герой там выше рамки, но нарисованная ширина — от рамки',
  '',
  'клетки части 1:',
  ...k.map((x) => `${x.adres} ${x.okno}: герой ${r1(x.geroy)} (граница ${r1(x.granica)}), рамка ${x.ramka.map(r1).join('×')}, нарисовано ${r1(x.narisovano)}, sizes ${r1(x.znachenie)} (браузер ${r1(x.brauzer)}), занижение ×${r4(x.zanizhenie)}, кандидат ${x.kandidat}${x.sverka ? '' : ' — РАСХОЖДЕНИЕ разбора'}`),
];
console.log(L.join('\n'));
