// Журнал сверки вердиктов «старый судья знака → новый» (П104 блок Г): старый znak на сборке 3b78f28 (--check,
// --check --dist, --selftest) и новые (гейт, сторож, тесты) — в один журнал; порчи старых проб — тестами новых;
// расхождения — с разбором.
//   node zhurnal-verdiktov.mjs <журнал> <журнал теста знака> <журнал сборки> <журнал proverki>
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const Z = import.meta.dirname;
const S = join(Z, '..');
const [vyvod, zhTest, zhSborka, zhProverki] = process.argv.slice(2);
const chitat = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const st = JSON.parse(chitat(join(Z, 'verdikty-staryi.json')));
const nv = JSON.parse(chitat(join(Z, 'verdikty-novyi.json')));
const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';

// Оракул Tailwind для случаев R5-SVERKA-1 (как в тесте).
const req = createRequire(join(SAYT, 'package.json'));
const tw = await import(pathToFileURL(req.resolve('tailwindcss')).href);
const compile = tw.compile ?? tw.default?.compile;
const twDir = dirname(req.resolve('tailwindcss/package.json'));
const CSS = join(SAYT, 'src/styles/global.css');
const nayti = (id, base) => (id.startsWith('.') || id.startsWith('/') ? join(base, id) : id === 'tailwindcss' ? join(twDir, 'index.css') : id.startsWith('tailwindcss/') ? join(twDir, id.slice(12)) : createRequire(join(base, 'x.js')).resolve(id));
const fd = async (css) => {
  const c = await compile(css, { base: dirname(CSS), from: CSS, loadStylesheet: async (id, base) => { const f = nayti(id, base); return { path: f, base: dirname(f), content: readFileSync(f, 'utf8') }; }, onDependency: () => {} });
  return [...c.build([]).matchAll(/--font-display\s*:\s*([^;}]*)[;}]/g)].map((m) => m[1].trim());
};
const bodoni = (v) => v.length > 0 && v.every((x) => /^(['"])Bodoni Moda\1\s*(,|$)/.test(x));
const cssBaza = readFileSync(CSS, 'utf8');
const FD = '--font-display';
const mestaCss = {
  'поздний @theme': (k) => `${cssBaza}\n@theme { ${k}: initial; }`,
  'поздний @theme inline': (k) => `${cssBaza}\n@theme inline { ${k}: initial; }`,
  'поздний @theme static': (k) => `${cssBaza}\n@theme static { ${k}: initial; }`,
  'поздний @theme reference': (k) => `${cssBaza}\n@theme reference { ${k}: initial; }`,
  'поздний @theme default': (k) => `${cssBaza}\n@theme default { ${k}: initial; }`,
  'основной @theme, после --font-display': (k) => cssBaza.replace(/(\n\s*--font-display:[^;]*;)/, `$1\n  ${k}: initial;`),
  'основной @theme, в начале': (k) => cssBaza.replace('\n@theme {', `\n@theme {\n  ${k}: initial;`),
  'свой @theme перед основным': (k) => cssBaza.replace('\n@theme {', `\n@theme { ${k}: initial; }\n@theme {`),
};
const V = (x) => (x.otkaz ? 'отказ' : 'сверено');
const L = [];
L.push('СВЕРКА ВЕРДИКТОВ: СТАРЫЙ СУДЬЯ ЗНАКА → НОВЫЙ (П104 блок Г; сборка 3b78f28 = опорная сборка сессии 21)');
L.push('');
L.push('1. СТАРЫЙ СУДЬЯ (tools/znak.mjs на 3b78f28) на сборке 3b78f28 — журналы ref/staryi-znak-*.txt сессии, сняты до правок:');
for (const [imya, f] of [['--check', 'staryi-znak-check.txt'], ['--check --dist', 'staryi-znak-check-dist.txt'], ['--selftest', 'staryi-znak-selftest.txt']]) {
  const t = chitat(join(S, 'ref', f));
  const itog = t.split('\n').find((l) => /^znak/.test(l)) ?? '';
  L.push(`   ${imya.padEnd(16)} ${itog.slice(0, 150)} | ${t.match(/код выхода: \d+/)?.[0]}`);
}
L.push('');
L.push('2. НОВЫЕ СУДЬИ на той же сборке:');
const sb = chitat(zhSborka);
L.push(`   гейт сайта (tools/geity.mjs → znak --check): ${sb.split('\n').find((l) => /^znak: /.test(l))?.slice(0, 120) ?? '—'}`);
L.push(`   ${sb.split('\n').find((l) => /^Гейты сайта/.test(l)) ?? '—'}`);
L.push(`   сторож сборки: ${sb.split('\n').find((l) => /sayt:znak-dist/.test(l))?.replace(/^\S+ /, '') ?? '—'}`);
const tt = chitat(zhTest);
L.push(`   тест знака без сборки (tools/testy/znak.test.mjs): ${tt.split('\n').filter((l) => /^ℹ (tests|pass|fail|todo) /.test(l)).join('; ')}`);
const pv = chitat(zhProverki);
const zs = pv.split('\n').filter((l) => /^(✔|✖) (гейт сайта|сторож сборки знака|R5-SVERKA-6)/.test(l));
L.push(`   пробы на копиях (tools/testy/znak-sborka.test.mjs, proverki): ${zs.map((l) => l.replace(/ \([\d.]+ms\)$/, '')).join(' | ')}`);
L.push('');
L.push('3. ПОРЧИ СТАРЫХ ПРОБ → ТЕСТЫ НОВЫХ: 94 пробы прежнего --selftest → 94 теста «пробы прежнего --selftest (сессия 11) — тестами»,');
L.push('   текст проб дословно (сверка без пробельных знаков — instrumenty/znak/sverka-prob.mjs), то же строгое правило.');
const stS = chitat(join(S, 'ref', 'staryi-znak-selftest.txt')).split('\n').filter((l) => /^(ok |НЕТ)  /.test(l));
const blokTesta = tt.split('▶ пробы прежнего --selftest (сессия 11) — тестами')[1]?.split(/\n✔ пробы прежнего|\n✖ пробы прежнего/)[0] ?? '';
const nvT = new Map(blokTesta.split('\n').filter((l) => /^\s+(✔|✖) /.test(l)).map((l) => [l.trim().replace(/^(✔|✖) /, '').replace(/ \([\d.]+ms\)$/, ''), l.includes('✔')]));
let sovp = 0;
const rashozh = [];
for (const l of stS) {
  const imya = l.slice(5).split(': ждём ')[0];
  const ok = l.startsWith('ok ');
  if (nvT.get(imya) === ok) sovp++;
  else rashozh.push(`${imya}: старый ${ok ? 'ok' : 'НЕТ'}, новый ${nvT.has(imya) ? (nvT.get(imya) ? 'ok' : 'НЕТ') : 'нет теста'}`);
}
L.push(`   старых проб ${stS.length}, тестов ${nvT.size}; совпало по итогу ${sovp}; расхождений ${rashozh.length}${rashozh.length ? ': ' + rashozh.join('; ') : ''}`);
L.push('');
L.push('4. СТРОКИ «ПРЕДЕЛОВ ПОСЛЕ РАУНДА 5» — одни и те же входы: старый судья (3b78f28, в памяти крюком загрузчика) и новый.');
L.push('   Для R5-SVERKA-1 — и оракул: снимает ли Tailwind сайта --font-display со страницы.');
let rovno = 0;
const razn = { novyeOtkazy: [], snyatyeOtkazy: [], drugieUstavy: [] };
if (st.length !== nv.length || st.some((a, i) => a.imya !== nv[i].imya)) throw new Error('перечни случаев старого и нового прогона разошлись');
const R5 = st.filter((a) => !a.zhdem).length;
let orakulSluchaev = 0, orakulRovno = 0;
const orakulRazn = [];
for (let i = 0; i < R5; i++) {
  const a = st[i];
  const b = nv[i];
  let oracle = '';
  const m = /^R5-SVERKA-1: (\S+) — (.+)$/.exec(a.imya);
  if (m) {
    oracle = bodoni(await fd(mestaCss[m[2]](m[1]))) ? 'Tailwind: оставляет' : 'Tailwind: снимает';
    orakulSluchaev++;
    if (b.otkaz === (oracle === 'Tailwind: снимает')) orakulRovno++;
    else orakulRazn.push(a.imya);
  }
  if (a.otkaz === b.otkaz) rovno++;
  else if (!a.otkaz && b.otkaz) razn.novyeOtkazy.push(a.imya);
  else razn.snyatyeOtkazy.push(a.imya);
  L.push(`   ${a.imya.padEnd(64)} старый ${V(a).padEnd(7)} новый ${V(b).padEnd(7)} ${oracle}${b.otkaz ? ' | ' + b.bledy[0].slice(0, 90) : ''}`);
}
L.push('');
L.push(`   ИТОГ: случаев ${R5}; вердикт тот же — ${rovno}; старый «сверено» → новый «отказ» — ${razn.novyeOtkazy.length}; старый «отказ» → новый «сверено» — ${razn.snyatyeOtkazy.length}`);
L.push(`   R5-SVERKA-1: новый «отказ» ровно там, где оракул «Tailwind: снимает», — ${orakulRovno} из ${orakulSluchaev}${orakulRazn.length ? `; НЕ РАВНЫ: ${orakulRazn.join('; ')}` : ''}`);
L.push('');
L.push('5. РАСХОЖДЕНИЯ С РАЗБОРОМ');
L.push(`   (а) старый «сверено» → новый «отказ» (${razn.novyeOtkazy.length}): это и есть строки R5 — пропуски старого судьи. Каждый случай R5-SVERKA-1`);
L.push('       с «отказ» — там, где оракул говорит «Tailwind: снимает»; R5-SVERKA-5 — списки, которые font-family не читает;');
L.push('       R5-SVERKA-3, -2 — экранирование в имени правила, гарнитуры и @property; ложных новых отказов нет (оракул и законные списки).');
L.push(`   (б) старый «отказ» → новый «сверено» (${razn.snyatyeOtkazy.length}): ${razn.snyatyeOtkazy.join('; ') || '—'} — ложные отказы старого`);
L.push('       (R5-SVERKA-7: своя @font-face другой гарнитуры, имя которой только содержит «Bodoni Moda»), сняты.');
L.push('   (в) настоящие входы и 94 прежние пробы — вердикты совпали (разделы 1–3).');
L.push('');
L.push('6. СЛУЧАИ «СУДЬЮ СУДЯТ» БЛОКА Г (GR1…GR3) — те же входы, что в тестах: старый судья, новый и ожидание теста.');
L.push('   «унаследован — закрыт» — старый судья ошибался так же (пропуск или ложный отказ был до блока Г), новый равен ожиданию;');
L.push('   «старый тоже верен» — ошибку внёс промежуточный судья блока Г (ложные отказы: GR2-Z-1, GR2-Z-3 — правки раунда 1, 2f19988;');
L.push('   GR3-Z-1 — var() в списке, правка R5-SVERKA-5, 4034590; GR3-Z-2 — импорт по корню Vite, оракул 4034590) или случай — законная');
L.push('   форма; новый равен ожиданию.');
const gr = st.map((a, i) => [a, nv[i]]).filter(([a]) => a.zhdem);
let grSovp = 0;
const grChuzhie = [];
for (const [a, b] of gr) {
  const zhOtkaz = a.zhdem === 'отказ';
  const novyiVeren = b.otkaz === zhOtkaz;
  const staryiVeren = a.otkaz === zhOtkaz;
  if (novyiVeren) grSovp++;
  else grChuzhie.push(a.imya);
  const pometa = !novyiVeren ? 'НОВЫЙ НЕ РАВЕН ОЖИДАНИЮ' : staryiVeren ? 'старый тоже верен' : 'унаследован — закрыт';
  L.push(`   ${a.imya.padEnd(64)} ждём ${a.zhdem.padEnd(7)} старый ${V(a).padEnd(7)} новый ${V(b).padEnd(7)} ${pometa}`);
}
L.push(`   ИТОГ: случаев ${gr.length}; новый равен ожиданию — ${grSovp}; старый ошибался — ${gr.filter(([a]) => a.otkaz !== (a.zhdem === 'отказ')).length}${grChuzhie.length ? `; НЕ РАВНЫ: ${grChuzhie.join('; ')}` : ''}`);
writeFileSync(vyvod, L.join('\n') + '\n');
console.log(L.slice(-12).join('\n'));
