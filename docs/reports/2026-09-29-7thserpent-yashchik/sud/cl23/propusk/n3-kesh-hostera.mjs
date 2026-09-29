// CL23-P: кэш на пути, который не Cloudflare (nginx хостера впереди Apache, П108; x-ray замера — «wnp…/wn…/wa…»).
// Шапка 30b3730: «кэш на пути бывает только у Cloudflare, а его на сайте нет — П108». До правки такой сайт краснел
// проверкой 11 («без cf-ray … проверки кэша пусты», дифф b8016eb..30b3730, строки 73–74 старого кода), после — нет.
import { progon, otchet, zapisat, zamenit, sZag, B, BEZ, HOSTER, STRANICY, METKA } from './obshchee.mjs';

const vyvod = [];
const STROKI = ['HTML: Cache-Control (max-age=0, must-revalidate)', 'HTML не из кэша Cloudflare', 'запросы не идут через Cloudflare', 'robots.txt без параметра (его берут роботы)', 'HTML страниц = сборка (dist)'];
const vseHtml = [...STRANICY.map((p) => `${B}${p.url}`), `${B}/404/`, `${B}/net-takoy-stranicy-${METKA}/`];

// а) Все страницы — из кэша nginx хостера сутки (Age 86400, X-Cache-Status HIT), тело пока равно сборке.
const a = await progon((k) => {
  for (const u of vseHtml) zamenit(k, u, (o) => sZag(o, { age: '86400', 'x-cache-status': 'HIT' }));
});
vyvod.push(otchet('а) HTML из кэша nginx хостера (Age 86400, X-Cache-Status: HIT), тело = сборка', a, { stroki: STROKI }));

// б) То же с X-Cache «HIT from nginx» и Age на главной.
const b = await progon((k) => zamenit(k, `${B}/`, (o) => sZag(o, { age: '172800', 'x-cache': 'HIT from nginx' })));
vyvod.push(otchet('б) главная из кэша (X-Cache: HIT from nginx, Age 172800)', b, { stroki: STROKI }));

// в) robots.txt без параметра — из кэша хостера (прежняя безвредная редакция, Age 3600): причина в строке 4.
const v = await progon((k) => zamenit(k, BEZ, (o) => sZag({ ...o, telo: HOSTER + 'User-agent: *\nAllow: /\n' }, { age: '3600', 'x-cache-status': 'HIT' })));
vyvod.push(otchet('в) robots.txt без параметра из кэша хостера (Age 3600, X-Cache-Status: HIT), прежняя безвредная редакция', v, { stroki: STROKI }));

zapisat('n3-vyvod.txt', vyvod.join('\n\n'));
