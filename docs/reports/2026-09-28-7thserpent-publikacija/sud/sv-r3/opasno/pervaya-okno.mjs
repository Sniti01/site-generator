// SV3-O-5: «не первая» (SV2-O-3) = наш index.html + 7 ключевых файлов из 165. Первая выкладка, оборванная после
// последнего ключевого файла, при повторе — «не первая»: сверка сборки с принятой пропущена, домен судится мягко.
// Порядок записи mirror у lftp не измерен — две модели: (А) имена по порядку, папки вперемешку с файлами, вглубь;
// (Б) на каждом уровне сначала файлы, затем папки. Для каждой точки обрыва — вердикт настоящей pervayaVykladka.
import { SV, PRIN, NASH, vyvod } from './obshchee.mjs';

const { pervayaVykladka, KLYUCHEVYE } = SV;
const fajly = Object.keys(PRIN.fajly);
function derevo(spisok) {
  const k = { f: [], d: new Map() };
  for (const p of spisok) {
    const ch = p.split('/');
    let u = k;
    for (const c of ch.slice(0, -1)) {
      if (!u.d.has(c)) u.d.set(c, { f: [], d: new Map() });
      u = u.d.get(c);
    }
    u.f.push(ch.at(-1));
  }
  return k;
}
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
function poryadokA(u, pref = '') {
  const vse = [...u.f.map((n) => ({ n, f: true })), ...[...u.d.keys()].map((n) => ({ n, f: false }))].sort((a, b) => cmp(a.n, b.n));
  return vse.flatMap((x) => (x.f ? [pref + x.n] : poryadokA(u.d.get(x.n), `${pref}${x.n}/`)));
}
function poryadokB(u, pref = '') {
  return [...u.f.sort(cmp).map((n) => pref + n), ...[...u.d.keys()].sort(cmp).flatMap((n) => poryadokB(u.d.get(n), `${pref}${n}/`))];
}
const stroki = [];
for (const [imya, por] of [['А', poryadokA(derevo(fajly))], ['Б', poryadokB(derevo(fajly))]]) {
  let okno = 0;
  const primery = [];
  for (let i = 1; i < por.length; i += 1) {
    const zalito = por.slice(0, i);
    const find = ['./', ...zalito.map((f) => `./${f}`)].join('\n');
    const index = zalito.includes('index.html') ? NASH : null;
    const r = pervayaVykladka('off', index, find);
    if (!r.pervaya) {
      okno += 1;
      if (primery.length < 1) primery.push(`обрыв после ${i} из ${por.length} (не залиты: ${por.slice(i).join(', ')}) → первая: нет — ${r.pochemu}`);
    }
  }
  stroki.push(`модель ${imya}: точек обрыва, где повтор — «не первая», а выкладка не закончена: ${okno} из ${por.length - 1}; ${primery[0] ?? '—'}`);
}
// Модель В: mirror не рвётся на ошибке одного файла — пишет остальные и выходит с кодом 1 в конце (шаг красный,
// пересчёт не идёт). Первая выкладка, у которой не лёг ровно один файл, при повторе:
let neKlyuch = 0;
let neKlyuchNePervaya = 0;
for (const f of fajly) {
  if (KLYUCHEVYE.includes(f)) continue;
  neKlyuch += 1;
  const find = ['./', ...fajly.filter((x) => x !== f).map((x) => `./${x}`)].join('\n');
  if (!pervayaVykladka('off', NASH, find).pervaya) neKlyuchNePervaya += 1;
}
stroki.push(`модель В (не лёг один файл из ${fajly.length}): повтор — «не первая» в ${neKlyuchNePervaya} случаях из ${fajly.length} (все файлы, кроме 7 ключевых: ${neKlyuch}) — сверка сборки при повторе пропущена`);
stroki.push(`ключевые: ${KLYUCHEVYE.join(', ')}`);
stroki.push('ИТОГ: при обрыве окно узкое (2–4 страницы), при ошибке одного файла — любой из 158 не ключевых: «прежняя выкладка закончена» решается по 7 именам из 165; не воспроизведено на lftp: порядок записи и поведение mirror при ошибке файла не измерены');
vyvod('pervaya-okno', stroki);
