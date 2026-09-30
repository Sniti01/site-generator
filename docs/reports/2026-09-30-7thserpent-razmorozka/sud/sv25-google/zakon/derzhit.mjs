// Что держит (роль «законные формы»): живое состояние сервера и законные формы файла подтверждения — через команду
// сторожа копии (f57bbb9) с пятью аргументами, как в workflow; прочие сторожа — с remote-top, где лежит копия файла.
// Каждый случай — в своей свежей рабочей папке «rab-…» (удаляется только она).
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SV, TUT, G, STROKA, cls, nash, karta, zaglushkaHostera, rabochaya, ubrat, komanda, shagPapki, zapis, VERKH, FAJLY } from './obshchee-z.mjs';

const out = [];
const S = STROKA();
const G2 = 'google0a1b2c3d4e5f6789.html';
const S2 = STROKA(G2);
const dlinnyi = 'googleZyXw0123456789abcdefghijklmnopqr.html';
// [имя, список cls, опции shagPapki, ждём код, куски вывода]
const sluchai = [
  ['живое: наша выкладка + файл Google, как его отдаёт Search Console (без перевода строки)', cls([G]), { skachano: { [G]: S } }, 0, ['наша сборка', `файл подтверждения Google ${G}`]],
  ['живое: то же, файл с LF в конце (редактор панели)', cls([G]), { skachano: { [G]: S + '\n' } }, 0, ['наша сборка']],
  ['живое: то же, файл с CRLF в конце (textarea панели, FTP ASCII из Windows)', cls([G]), { skachano: { [G]: S + '\r\n' } }, 0, ['наша сборка']],
  ['живое: вывод cls с CRLF', cls([G], { crlf: true }), { skachano: { [G]: S } }, 0, ['наша сборка']],
  ['код прописными шестнадцатеричными', cls(['googleABCDEF0123456789.html']), { skachano: { 'googleABCDEF0123456789.html': STROKA('googleABCDEF0123456789.html') } }, 0, ['googleABCDEF0123456789.html']],
  ['код 8 знаков', cls(['google0a1b2c3d.html']), { skachano: { 'google0a1b2c3d.html': STROKA('google0a1b2c3d.html') } }, 0, ['google0a1b2c3d.html']],
  ['код 32 знака, буквы вне hex', cls([dlinnyi]), { skachano: { [dlinnyi]: STROKA(dlinnyi) } }, 0, ['googleZyXw']],
  ['два файла подтверждения (два владельца или смена), оба верные', cls([G2, G]), { skachano: { [G]: S, [G2]: S2 + '\n' } }, 0, [G, G2]],
  ['первая выкладка: в корне только файл Google', cls([G], { bezNashey: true }), { index: null, sitemap: null, skachano: { [G]: S } }, 0, ['без нашей сборки', G]],
  ['свежий каталог: заглушка, .well-known/, cgi-bin/ и файл Google (папку пропускает; заглушку судит indeks)', cls(['.well-known/', 'cgi-bin/', 'index.html', G], { bezNashey: true }), { index: zaglushkaHostera, sitemap: null, skachano: { [G]: S } }, 0, ['свежий каталог хостера', 'служебные папки .well-known, cgi-bin', G]],
  ['наша выкладка, ссылка .well-known@ хостера и файл Google', cls(['.well-known@', G]), { skachano: { [G]: S } }, 0, ['наша сборка']],
  ['наша выкладка, своя старая страница из карты и файл Google', cls(['max-payne-4/', G]), { sitemap: karta().replace('</urlset>', '<url><loc>https://www.7thserpent.com/max-payne-4/</loc></url></urlset>'), skachano: { [G]: S } }, 0, ['наша сборка']],
  ['файла Google нет — как было (скачаны только index.html и карта)', cls([]), {}, 0, ['наша сборка']],
  ['пустой корень, remote-top не создан (скачивать нечего)', './\n../\n', { bezRemoteTop: true }, 0, ['пустой корень']],
  ['файл Google в корне, remote-top не создан — стоп «не скачан» (верное направление)', cls([G]), { bezRemoteTop: true }, 1, ['не скачан']],
  ['один верный, второй с чужим именем внутри — стоп только второго', cls([G2, G]), { skachano: { [G]: S, [G2]: S } }, 1, [`${G2} (внутри не строка`]],
];
for (const [imya, spisok, opcii, zhdem, kuski] of sluchai) {
  const d = rabochaya();
  try {
    const r = shagPapki(d, spisok, opcii);
    const ok = r.kod === zhdem && kuski.every((k) => r.vyvod.includes(k));
    out.push(`${ok ? 'ДЕРЖИТ' : 'НЕ ДЕРЖИТ'} | papka | ${imya} | код ${r.kod} (ждём ${zhdem})`);
    out.push(`    ${r.vyvod}`);
  } finally {
    ubrat(d);
  }
}

// Прочие сторожа — с remote-top, где рядом с index.html и картой лежит копия файла Google (не мешает ли она им).
const d = rabochaya();
try {
  mkdirSync(join(d, 'remote-top'), { recursive: true });
  writeFileSync(join(d, 'remote-top', 'index.html'), nash('/'));
  writeFileSync(join(d, 'remote-top', 'sitemap-0.xml'), karta());
  writeFileSync(join(d, 'remote-top', G), S);
  const fajlyDist = Object.keys(SV.spisokSborki(join(d, 'dist')).fajly);
  const papkiDist = [...new Set(fajlyDist.filter((f) => f.includes('/')).map((f) => f.split('/')[0]))];
  const findDist = (dop) => ['./', ...papkiDist.map((p) => `./${p}/`), ...fajlyDist.map((f) => `./${f}`), ...dop.map((f) => `./${f}`)].join('\n') + '\n';
  writeFileSync(join(d, 'remote-before.txt'), findDist([G]));
  writeFileSync(join(d, 'remote-before-oshibki.txt'), '');
  writeFileSync(join(d, 'remote-files-pervaya.txt'), findDist([G]));
  const drugie = [
    ['indeks: наш index.html, рядом копия файла Google', ['indeks', join(d, 'remote-top', 'index.html')], 0, 'наш'],
    ['glubina: find с файлом Google в корне', ['glubina', join(d, 'remote-before.txt'), join(d, 'remote-top', 'index.html'), join(d, 'dist'), join(d, 'remote-top', 'sitemap-0.xml'), join(d, 'remote-before-oshibki.txt')], 0, 'чужого нет'],
    ['pervaya: наша выкладка и файл Google — не первая', ['pervaya', join(d, 'remote-top', 'index.html'), join(d, 'remote-before.txt')], 0, 'первая выкладка: нет'],
    ['pereschet: после выкладки файл Google на месте — не в счёте и назван', ['pereschet', join(d, 'remote-before.txt'), join(d, 'dist')], 0, `не в счёте — файл подтверждения Google ${G}`],
  ];
  for (const [imya, argi, zhdem, kusok] of drugie) {
    const r = komanda(argi);
    const ok = r.kod === zhdem && r.vyvod.includes(kusok);
    out.push(`${ok ? 'ДЕРЖИТ' : 'НЕ ДЕРЖИТ'} | ${imya} | код ${r.kod} (ждём ${zhdem})`);
    out.push(`    ${r.vyvod}`);
  }
} finally {
  ubrat(d);
}

// Образец имени и glob скачивания: всё, что берёт FAJL_GOOGLE, берёт и glob google*.html (скачивание — надмножество).
const glob = /^google.*\.html$/;
const imena = [G, G2, 'googleABCDEF0123456789.html', 'google0a1b2c3d.html', dlinnyi, 'google-verify.html', 'google.html', 'Google0123456789abcdef.html', 'google0123456789abcdef.htm'];
const narushenie = imena.filter((n) => SV.FAJL_GOOGLE.test(n) && !glob.test(n));
out.push(`${narushenie.length ? 'НЕ ДЕРЖИТ' : 'ДЕРЖИТ'} | образец FAJL_GOOGLE ⊆ glob google*.html: ${imena.map((n) => `${n}=${SV.FAJL_GOOGLE.test(n) ? 'образец' : '—'}/${glob.test(n) ? 'glob' : '—'}`).join(', ')}`);
// -x в workflow копии — тот же образец (source), до «$SITE/dist/ .».
const wf = readFileSync(join(TUT, 'kopiya', '.github', 'workflows', 'deploy-7thserpent.yml'), 'utf8');
const x = ` -x '${SV.FAJL_GOOGLE.source}' `;
out.push(`${wf.includes(x) && wf.indexOf(x) < wf.indexOf(' $SITE/dist/ .;') ? 'ДЕРЖИТ' : 'НЕ ДЕРЖИТ'} | workflow: mirror -x '${SV.FAJL_GOOGLE.source}' до «$SITE/dist/ .»; скачивание --include-glob=google*.html: ${wf.includes('--include-glob=google*.html . remote-top') ? 'есть' : 'нет'}; papka получает remote-top пятым: ${/papka remote-root\.txt remote-top\/index\.html \$SITE\/dist remote-top\/sitemap-0\.xml remote-top\n/.test(wf) ? 'да' : 'нет'}`);
out.push(`справка: верх принятой сборки (${VERKH.length}): ${VERKH.join(', ')}; файлов принятой ${FAJLY.length}; имён образца Google в верхе — ${VERKH.filter((n) => SV.FAJL_GOOGLE.test(n)).length}`);
zapis('derzhit-vyvod.txt', out);
