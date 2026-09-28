// Законные формы, которые инструмент ДОЛЖЕН держать: здоровый стек из dist/ и public/ с вариациями.
import { progon, pechat, HOSTER, nashRobots, B } from './stend.mjs';

const varianty = [
  ['H0 образец: dist/ как есть, .htaccess как в public/, блок хостера перед файлом', {}],
  ['H1 Cache-Control дважды (nginx + Apache) — Headers.get склеит через запятую', { htmlZag: [['cache-control', 'max-age=0']] }],
  ['H2 robots: блок хостера с CRLF, наш файл с LF', { robotsTelo: () => HOSTER.replace(/\n/g, '\r\n') + nashRobots }],
  ['H3 robots: BOM в начале ответа (снимается text())', { robotsTelo: () => '﻿' + HOSTER + nashRobots }],
  ['H4 robots: блок хостера ПОСЛЕ нашего файла, без пустой строки', { robotsTelo: () => nashRobots + HOSTER }],
  ['H5 robots: блок хостера без пустой строки перед нашим файлом, пробелы в метках', { robotsTelo: () => HOSTER.replace(/\n\n$/, '\n').replace('# BEGIN adm.tools', '  #BEGIN adm.tools').replace(/# END adm\.tools Managed content/, '# END adm.tools Managed Content   ') + nashRobots }],
  ['H6 sitemap-0.xml с отступами и переносами (pretty)', { kartaTelo: (b) => Buffer.from(b.toString('utf8').replace(/<url>/g, '\n  <url>\n    ').replace(/<\/urlset>/, '\n</urlset>\n')) }],
  ['H7 заголовки в ВЕРХНЕМ регистре, CF-Cache-Status', { robotsZag: (u) => [['CF-Cache-Status', u.includes('?') ? 'MISS' : 'HIT'], ['AGE', '5']] }],
  ['H8 title страницы 404 с &mdash; вместо тире (сущность)', { telo404: (b) => Buffer.from(b.toString('utf8').replace('<title>Page not found — 7thserpent.com</title>', '<title>Page not found &mdash; 7thserpent.com</title>')) }],
  ['H9 canonical главной без кавычек и с / в конце тега', { htmlTelo: (p, b) => (p === '/' ? Buffer.from(b.toString('utf8').replace('<link rel="canonical" href="https://www.7thserpent.com/">', '<LINK href=https://www.7thserpent.com/ rel=canonical />')) : b) }],
];

for (const [imya, v] of varianty) pechat(imya, await progon(v));
