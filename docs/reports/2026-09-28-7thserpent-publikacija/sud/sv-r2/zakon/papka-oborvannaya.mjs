// SV2-Z: повтор после ОБОРВАННОЙ первой выкладки. mirror -R кладёт файлы по порядку имён (lftp сортирует список),
// с --parallel=4; тяжелее всего _astro/ (70 webp) — обрыв там вероятнее всего. index.html по порядку имён идёт после
// .htaccess, 404/, _astro/, apple-touch-icon.png, cheats/, favicon*, gameplay/, games-like-max-payne/, icon-192.png.
// Обрыв до index.html (или на нём: остаётся временное .in.index.html.) — на сервере часть НАШЕЙ сборки без index.html.
// Что скажут сторожа при повторном запуске (как в workflow: papka, indeks, pervaya)?
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = SAYT + '/dist';
const S = await import(pathToFileURL(SAYT + '/tools/storozha-vykladki.mjs').href);

const verh = readdirSync(DIST).map((n) => (statSync(join(DIST, n)).isDirectory() ? n + '/' : n));
// порядок lftp: по имени (strcmp)
const poImeni = [...verh].sort((a, b) => (a.replace(/\/$/, '') < b.replace(/\/$/, '') ? -1 : 1));
const doIndex = poImeni.slice(0, poImeni.indexOf('index.html'));
console.log(`верх dist по порядку lftp до index.html (${doIndex.length}): ${doIndex.join(' ')}`);

const SOST = [
  ['S1 обрыв на _astro/ (самая тяжёлая часть)', ['./', '../', '.htaccess', '404/', '_astro/']],
  ['S2 обрыв на index.html: всё до него + временное .in.index.html.', ['./', '../', ...doIndex, '.in.index.html.']],
  ['S3 обрыв после index.html не наступил, MLSD без ./ ../', [...doIndex]],
];
for (const [imya, spisok] of SOST) {
  const tekst = spisok.join('\n') + '\n';
  const p = S.papka(tekst, null);
  const i = S.indeks(null);
  const v = S.pervayaVykladka('off', null);
  console.log(`${imya}: papka ${p.ok ? 'ПРОХОД' : 'ОТКАЗ'} — ${p.stroki.join(' | ')}`);
  console.log(`   indeks ${i.ok ? 'проход' : 'отказ'}; pervaya ${v.pervaya ? 'on' : 'off'} (${v.pochemu})`);
}

// Предлагаемое распознавание «наша оборванная выкладка»: каждая запись корня — имя верха dist, служебная папка
// хостера или временное имя lftp (.in.*); index.html нет. Проверка, что распознавание не пропускает отказы проб
// раунда 1 (корень первого сайта без index.html, папка _astro первого сайта, PHP, домены).
const VERH = new Set(verh);
const SLUZH = new Set(['.well-known/', 'cgi-bin/']);
const nashaOborvannaya = (tekst) => {
  const imena = S.razobratSpisok(tekst);
  return imena.length > 0 && !imena.includes('index.html') && imena.includes('_astro/') && imena.every((s) => VERH.has(s) || SLUZH.has(s) || /^\.in\./.test(s));
};
const OTKAZY_R1 = {
  'A1 корень первого сайта без index.html': './\n../\n.htaccess\n404/\n_astro/\nguides/\nrobots.txt\nsitemap-index.xml\nsitemap-0.xml\n',
  'A2 папка _astro первого сайта': 'BaseLayout.Ab12cd.css\nhero.Xy_1.webp\npublic-sans.woff2\n',
  'A3 PHP': './\n../\nindex.php\nwp-admin/\nwp-content/\n',
  'A8 домены без отметки': './\n../\n7dtd.com.pl\nac4bf-thewatch.com\n7thserpent.com\n',
  'www/': './\n../\nwww/\nlogs/\n',
};
for (const [imya, spisok] of SOST) console.log(`распознавание: ${imya} — ${nashaOborvannaya(spisok.join('\n') + '\n') ? 'наша оборванная' : 'нет'}`);
for (const [imya, t] of Object.entries(OTKAZY_R1)) console.log(`распознавание: ${imya} — ${nashaOborvannaya(t) ? 'НАША ОБОРВАННАЯ (плохо)' : 'нет (отказ остаётся)'}`);
