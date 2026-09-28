// SV2-Z: папка робота против того, что панель хостера может положить в каталог нового сайта (НЕ ИЗМЕРЕНО: листинга
// свежего `7thserpent.com/www` у «Хостінг Україна» в репозитории нет; у первого сайта измерено только, что каталог
// домена содержит одну папку `www/` — доклад 2026-09-15-45-44, раздел 5). Формы — типовые для панелей:
// служебные папки ссылками (`.well-known@` на общий каталог ACME), .htaccess хостера, logs/, tmp/.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = SAYT + '/dist';
const S = await import(pathToFileURL(SAYT + '/tools/storozha-vykladki.mjs').href);
const verh = readdirSync(DIST).map((n) => (statSync(join(DIST, n)).isDirectory() ? n + '/' : n));
const nash = readFileSync(join(DIST, 'index.html'), 'utf8');

const FORMY = [
  ['свежий: .well-known/ и cgi-bin/ папками (контроль)', ['./', '../', '.well-known/', 'cgi-bin/'], null],
  ['свежий: .well-known — ссылка', ['./', '../', '.well-known@'], null],
  ['свежий: cgi-bin — ссылка', ['./', '../', 'cgi-bin@'], null],
  ['ВТОРАЯ выкладка: наша сборка + .well-known@ хостера', ['./', '../', ...verh, '.well-known@'], nash],
  ['свежий: .htaccess хостера', ['./', '../', '.htaccess'], null],
  ['свежий: logs/ и tmp/', ['./', '../', 'logs/', 'tmp/'], null],
  ['свежий: заглушка index.html + favicon.ico хостера', ['./', '../', 'index.html', 'favicon.ico'], '<html><body>Сайт створено</body></html>'],
];
for (const [imya, spisok, index] of FORMY) {
  const r = S.papka(spisok.join('\n') + '\n', index);
  console.log(`[${imya}] ${r.ok ? 'ПРОХОД' : 'ОТКАЗ'} — ${r.stroki.join(' | ')}`);
}
