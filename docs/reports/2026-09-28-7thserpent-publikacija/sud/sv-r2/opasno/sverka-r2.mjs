// SV2 «опасный проход» — нормализация сверки сборки (spisokSborki, sverkaDist; правка SV1-Z-1).
// Ищем: сборку CI, которая НЕ та (или сломана), но после нормализации равна принятой. Маленькие свои dist, без сборки.
import { spisokSborki, sverkaDist } from './storozh.mjs';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ZDES = fileURLToPath(new URL('.', import.meta.url));
const KOREN = join(ZDES, 'vkhod-sverka');
rmSync(KOREN, { recursive: true, force: true });

const page = (url, css, cidA = 'yadro111', cidB = 'sayt2222') =>
  `<!doctype html><html><head><link rel="canonical" href="https://www.7thserpent.com${url}">${css.map((c) => `<link rel="stylesheet" href="/_astro/${c}">`).join('')}</head><body><div data-astro-cid-${cidA}><p data-astro-cid-${cidB}>x</p></div></body></html>`;

/** Своя сборка: { путь: текст }. */
function sdelat(imya, fajly) {
  const d = join(KOREN, imya);
  for (const [f, t] of Object.entries(fajly)) {
    mkdirSync(dirname(join(d, f)), { recursive: true });
    writeFileSync(join(d, f), t);
  }
  return d;
}

const CSS_INDEX = (a = 'yadro111', b = 'sayt2222') => `.a[data-astro-cid-${a}]{color:red}.b[data-astro-cid-${b}]{color:blue}`;
const CSS_CTA = (b = 'sayt2222') => `.c[data-astro-cid-${b}]{margin:0}`;
const baza = {
  'index.html': page('/', ['index.AAAAAAAA.css']),
  '404/index.html': page('/404/', ['index.AAAAAAAA.css', 'Cta.BBBBBBBB.css']),
  '_astro/index.AAAAAAAA.css': CSS_INDEX(),
  '_astro/Cta.BBBBBBBB.css': CSS_CTA(),
  'robots.txt': 'User-agent: *\nAllow: /\n',
};
const prin = { sborka: 'lokalno', ...spisokSborki(sdelat('prinyataya', baza)) };

// Сборка с двумя CSS одного имени после снятия хеша (page.*.css): index → X, 404 → Y.
const bazaKol = {
  'index.html': page('/', ['page.AAAAAAAA.css']),
  '404/index.html': page('/404/', ['page.BBBBBBBB.css']),
  '_astro/page.AAAAAAAA.css': '.x[data-astro-cid-yadro111]{display:none}',
  '_astro/page.BBBBBBBB.css': '.y[data-astro-cid-sayt2222]{display:block}',
  'robots.txt': 'User-agent: *\nAllow: /\n',
};
const prinKol = { sborka: 'lokalno-kolliziya', ...spisokSborki(sdelat('prinyataya-kol', bazaKol)) };

const OBRAZCY = [
  // [id, что, сборка CI, принятый список, ждём ok]
  ['N0', 'законная сборка CI: cid ядра иной, CSS index с другим хешем, ссылки на него — новые', {
    'index.html': page('/', ['index.CCCCCCCC.css'], 'runner99'),
    '404/index.html': page('/404/', ['index.CCCCCCCC.css', 'Cta.BBBBBBBB.css'], 'runner99'),
    '_astro/index.CCCCCCCC.css': CSS_INDEX('runner99'),
    '_astro/Cta.BBBBBBBB.css': CSS_CTA(),
    'robots.txt': baza['robots.txt'],
  }, prin, true],
  ['N1', 'CSS переименован (хеш другой), а страницы ссылаются на старое имя — файла по ссылке в сборке НЕТ (сайт без стилей)', {
    'index.html': page('/', ['index.AAAAAAAA.css'], 'runner99'),
    '404/index.html': page('/404/', ['index.AAAAAAAA.css', 'Cta.BBBBBBBB.css'], 'runner99'),
    '_astro/index.CCCCCCCC.css': CSS_INDEX('runner99'),
    '_astro/Cta.BBBBBBBB.css': CSS_CTA(),
    'robots.txt': baza['robots.txt'],
  }, prin, false],
  ['N1b', 'одна страница ссылается на несуществующий index.ZZZZZZZZ.css, остальные — на настоящий', {
    'index.html': page('/', ['index.ZZZZZZZZ.css']),
    '404/index.html': page('/404/', ['index.AAAAAAAA.css', 'Cta.BBBBBBBB.css']),
    '_astro/index.AAAAAAAA.css': CSS_INDEX(),
    '_astro/Cta.BBBBBBBB.css': CSS_CTA(),
    'robots.txt': baza['robots.txt'],
  }, prin, false],
  ['N1c', 'страница ссылается на CSS Cta вместо index (другое имя до хеша) — контроль', {
    'index.html': page('/', ['Cta.BBBBBBBB.css']),
    '404/index.html': page('/404/', ['index.AAAAAAAA.css', 'Cta.BBBBBBBB.css']),
    '_astro/index.AAAAAAAA.css': CSS_INDEX(),
    '_astro/Cta.BBBBBBBB.css': CSS_CTA(),
    'robots.txt': baza['robots.txt'],
  }, prin, false],
  ['N2', 'два CSS с одним именем после снятия хеша (page.*.css): ссылки переставлены — index получает стили 404 и наоборот', {
    'index.html': page('/', ['page.BBBBBBBB.css']),
    '404/index.html': page('/404/', ['page.AAAAAAAA.css']),
    '_astro/page.AAAAAAAA.css': bazaKol['_astro/page.AAAAAAAA.css'],
    '_astro/page.BBBBBBBB.css': bazaKol['_astro/page.BBBBBBBB.css'],
    'robots.txt': bazaKol['robots.txt'],
  }, prinKol, false],
  ['N2b', 'два CSS page.*.css, у сборки CI другие хеши (законно) — контроль ложного отказа', {
    'index.html': page('/', ['page.CCCCCCCC.css']),
    '404/index.html': page('/404/', ['page.DDDDDDDD.css']),
    '_astro/page.CCCCCCCC.css': bazaKol['_astro/page.AAAAAAAA.css'],
    '_astro/page.DDDDDDDD.css': bazaKol['_astro/page.BBBBBBBB.css'],
    'robots.txt': bazaKol['robots.txt'],
  }, prinKol, true],
  ['N3', 'cid двух компонентов переставлены согласованно во ВСЕЙ сборке (HTML и CSS) — стили идут за атрибутом', {
    'index.html': page('/', ['index.AAAAAAAA.css'], 'sayt2222', 'yadro111'),
    '404/index.html': page('/404/', ['index.AAAAAAAA.css', 'Cta.BBBBBBBB.css'], 'sayt2222', 'yadro111'),
    '_astro/index.AAAAAAAA.css': CSS_INDEX('sayt2222', 'yadro111'),
    '_astro/Cta.BBBBBBBB.css': CSS_CTA('yadro111'),
    'robots.txt': baza['robots.txt'],
  }, prin, true],
  ['N4', 'cid переставлены только в HTML одной страницы (CSS прежний) — стили не у тех элементов', {
    'index.html': baza['index.html'],
    '404/index.html': page('/404/', ['index.AAAAAAAA.css', 'Cta.BBBBBBBB.css'], 'sayt2222', 'yadro111'),
    '_astro/index.AAAAAAAA.css': CSS_INDEX(),
    '_astro/Cta.BBBBBBBB.css': CSS_CTA(),
    'robots.txt': baza['robots.txt'],
  }, prin, false],
  ['N5', 'в сборке CI буквально «data-astro-cid-#1» и «#2» (метки нормализации) вместо значений — селекторы CSS недействительны', {
    'index.html': page('/', ['index.AAAAAAAA.css'], '#1', '#2'),
    '404/index.html': page('/404/', ['index.AAAAAAAA.css', 'Cta.BBBBBBBB.css'], '#1', '#2'),
    '_astro/index.AAAAAAAA.css': CSS_INDEX('#1', '#2'),
    '_astro/Cta.BBBBBBBB.css': CSS_CTA('#2'),
    'robots.txt': baza['robots.txt'],
  }, prin, false],
];

const stroki = [];
let opasnyh = 0;
for (const [id, chto, fajly, spisok, zhdem] of OBRAZCY) {
  const d = sdelat(id, fajly);
  const r = sverkaDist(d, spisok);
  const opasno = r.ok && !zhdem;
  if (opasno) opasnyh += 1;
  stroki.push(`${id} ${opasno ? 'ОПАСНЫЙ ПРОХОД' : r.ok === zhdem ? 'как надо' : 'иначе (ложный отказ)'} — ${chto}: ${r.ok ? 'проход' : 'отказ'} | ${r.stroki[0]}`);
}
rmSync(KOREN, { recursive: true, force: true });
stroki.push(`ИТОГ: образцов ${OBRAZCY.length}, опасных проходов ${opasnyh}`);
const vyvod = stroki.join('\n') + '\n';
writeFileSync(join(ZDES, 'sverka-r2.txt'), vyvod);
process.stdout.write(vyvod);
