// Живость зоны Tailwind маркерами — сессия 13 трека «второй сайт» (П87 п. 2; инвариант 8
// корневого CLAUDE.md, запись DECISIONS.md 2026-09-04 «`@source '../../../../core'` проверен
// пробой»). Маркер — утилита с произвольным значением `z-[N]`, которой в репозитории нет;
// Tailwind печатает её правилом `.z-\[N\]{z-index:N}` в слое утилит, только если прочитал файл.
//
// node markery.mjs <dist> --est 71,72 --net 73,74
// node markery.mjs --selftest
//
// «есть»: в каком-то листе `*.css` сборки прямой ребёнок `@layer utilities` — ровно правило
// `.z-\[N\]` с телом ровно `z-index:N`. «нет»: ни в одном листе нет ни подстроки `z-\[N\]`,
// ни объявления `z-index:N` (с любыми пробелами после двоеточия). Код 1 — если хоть один
// маркер не там, где ждали, или проверять не на чем: в сборке нет листов или ни в одном нет
// `@layer utilities`. Код 2 — неверные аргументы: неизвестный флаг, пустой или нечисловой
// список, маркер в обоих списках. Оба списка обязательны: «нет» без хотя бы одного «есть» в той
// же сборке ничего не доказывает (зона могла не читаться вовсе).
// ПРЕДЕЛ (назван): маркер «нет» с иным написанием (другая утилита для того же слова) этой
// проверкой не ловится — проверяется только форма `z-[N]`.
import { razobrat, chitatPapku } from './sverka-css.mjs';

export function proverit(fajly, est, net) {
  const listy = [...fajly.keys()].filter(p => p.endsWith('.css')).sort();
  const teksty = listy.map(p => [p, fajly.get(p).toString('utf8')]);
  const stroki = [];
  let oshibok = 0;
  let sloev = 0;
  const derevya = teksty.map(([p, t]) => [p, razobrat(t)]);
  for (const [, d] of derevya) for (const x of d) if (x.tip === 'blok' && x.prelude === '@layer utilities') sloev++;
  if (listy.length === 0) { oshibok++; stroki.push('НЕТ в сборке нет ни одного листа *.css — проверять не на чем'); }
  else if (sloev === 0) { oshibok++; stroki.push('НЕТ ни в одном листе нет @layer utilities — проверять не на чем'); }
  for (const n of est) {
    const gde = [];
    for (const [p, d] of derevya) {
      for (const x of d) {
        if (x.tip !== 'blok' || x.prelude !== '@layer utilities') continue;
        for (const y of x.deti)
          if (y.tip === 'blok' && y.prelude === `.z-\\[${n}\\]` && y.deti.length === 1 && y.deti[0].tip === 'decl' && y.deti[0].tekst === `z-index:${n}`) gde.push(p);
      }
    }
    const ok = gde.length > 0;
    if (!ok) oshibok++;
    stroki.push(`${ok ? 'да ' : 'НЕТ'} z-[${n}] ждали В CSS: ${ok ? 'есть — ' + gde.join(', ') + ' (@layer utilities › .z-\\[' + n + '\\]{z-index:' + n + '})' : 'нет'}`);
  }
  for (const n of net) {
    const re = new RegExp(`z-index:\\s*${n}(?![0-9])`);
    const gde = teksty.filter(([, t]) => t.includes(`z-\\[${n}\\]`) || re.test(t)).map(([p]) => p);
    const ok = gde.length === 0;
    if (!ok) oshibok++;
    stroki.push(`${ok ? 'да ' : 'НЕТ'} z-[${n}] ждали НЕ в CSS: ${ok ? 'нет ни селектора, ни z-index:' + n : 'есть — ' + gde.join(', ')}`);
  }
  return { oshibok, stroki, listov: listy.length, sloev };
}

// Разбор аргументов: код 2 на всё, что не «<dist> --est N,N --net N,N».
export function argumenty(args) {
  const FLAGI = new Set(['--est', '--net']);
  const poz = [], o = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      if (!FLAGI.has(args[i])) return { oshibka: 'неизвестный флаг ' + args[i] };
      if (o[args[i]] !== undefined) return { oshibka: 'флаг дважды: ' + args[i] };
      const v = args[i + 1];
      if (v === undefined || v.startsWith('--')) return { oshibka: 'флаг без значения: ' + args[i] };
      if (!/^\d+(,\d+)*$/.test(v)) return { oshibka: `${args[i]}: ждали числа через запятую, получено «${v}»` };
      o[args[i]] = v.split(',').map(Number);
      i++;
    } else poz.push(args[i]);
  }
  if (poz.length !== 1) return { oshibka: 'ждали ровно одну папку сборки' };
  if (!o['--est']) return { oshibka: 'нет --est: «нет» без «есть» ничего не доказывает' };
  if (!o['--net']) return { oshibka: 'нет --net' };
  const obshchie = o['--est'].filter(n => o['--net'].includes(n));
  if (obshchie.length) return { oshibka: 'маркер в обоих списках: ' + obshchie.join(',') };
  return { dist: poz[0], est: o['--est'], net: o['--net'] };
}

function samoproverka() {
  const sb = (css) => new Map([['_astro/a.css', Buffer.from(css)], ['index.html', Buffer.from('')]]);
  const U = (s) => `@layer theme{:root{--x:1}}@layer utilities{.relative{position:relative}${s}}`;
  const sluchai = [
    ['есть в слое', sb(U('.z-\\[71\\]{z-index:71}')), [71], [], 0],
    ['нет вовсе', sb(U('')), [], [71], 0],
    ['ждали есть — нет', sb(U('')), [71], [], 1],
    ['ждали нет — есть', sb(U('.z-\\[71\\]{z-index:71}')), [], [71], 1],
    ['есть вне слоя утилит — не засчитывается', sb('.z-\\[71\\]{z-index:71}' + U('')), [71], [], 1],
    ['есть под @media в слое — не засчитывается', sb(U('@media (width>=40rem){.z-\\[71\\]{z-index:71}}')), [71], [], 1],
    ['z-index:71 в другом правиле — «нет» отказывает', sb(U('') + '.x{z-index: 71}'), [], [71], 1],
    ['z-index:710 — не 71', sb(U('') + '.x{z-index:710}'), [], [71], 0],
    ['другое тело — не засчитывается', sb(U('.z-\\[71\\]{z-index:72}')), [71], [], 1],
    // Раунд 1 «судью судят» сессии 13 (zona-1):
    ['папка без листов CSS — отказ', new Map([['index.html', Buffer.from('')]]), [], [73], 1],
    ['листы без @layer utilities — отказ', sb('.a{color:red}'), [], [73], 1],
  ];
  let proshlo = 0;
  for (const [imya, f, est, net, zhdem] of sluchai) {
    const r = proverit(f, est, net);
    const ok = (r.oshibok > 0 ? 1 : 0) === zhdem;
    if (ok) proshlo++;
    console.log(`${ok ? 'да ' : 'НЕТ'} ${imya}: ошибок ${r.oshibok}, ждали ${zhdem ? '>0' : '0'}`);
  }
  const argi = [
    ['опечатка --ets', ['d', '--ets', '71', '--net', '73'], false],
    ['без --est', ['d', '--net', '73,74'], false],
    ['без списков', ['d'], false],
    ['нечисловой --net 7y', ['d', '--est', '71', '--net', '7y'], false],
    ['пустой --est', ['d', '--est', '', '--net', '73'], false],
    ['маркер в обоих списках', ['d', '--est', '71', '--net', '71'], false],
    ['две папки', ['d', 'e', '--est', '71', '--net', '73'], false],
    ['флаг дважды', ['d', '--est', '71', '--est', '72', '--net', '73'], false],
    ['верные аргументы', ['d', '--est', '71,72', '--net', '73,74'], true],
  ];
  for (const [imya, a, zhdem] of argi) {
    const r = argumenty(a);
    const ok = !r.oshibka === zhdem;
    if (ok) proshlo++;
    console.log(`${ok ? 'да ' : 'НЕТ'} аргументы — ${imya}: ${r.oshibka ? 'код 2 (' + r.oshibka + ')' : 'приняты'}, ждали ${zhdem ? 'приняты' : 'код 2'}`);
  }
  const vsego = sluchai.length + argi.length;
  console.log(`самопроверка: ${proshlo}/${vsego}`);
  process.exit(proshlo === vsego ? 0 : 1);
}

const args = process.argv.slice(2);
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('/markery.mjs')) {
  if (args[0] === '--selftest') samoproverka();
  const a = argumenty(args);
  if (a.oshibka) { console.error(a.oshibka + '\nnode markery.mjs <dist> --est 71,72 --net 73,74'); process.exit(2); }
  const r = proverit(chitatPapku(a.dist), a.est, a.net);
  console.log(`сборка ${a.dist}: листов CSS ${r.listov}, блоков @layer utilities ${r.sloev}`);
  console.log(r.stroki.join('\n'));
  console.log(r.oshibok ? `ИТОГ: ${r.oshibok} ошибок — маркеры не там, где ждали, или проверять не на чем` : 'ИТОГ: все маркеры там, где ждали');
  process.exit(r.oshibok ? 1 : 0);
}
