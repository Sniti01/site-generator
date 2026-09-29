// CL23-P, образцы прозы: что печатают строки и справки о Cloudflare на сайте без Cloudflare и на сайте с ним.
import { progon, otchet, zapisat, zamenit, vTelo, B } from './obshchee.mjs';

const vyvod = [];

// а) Здоровый образец без Cloudflare: зелёные строки и справки, где назван Cloudflare или его заголовок кэша.
const zdorov = await progon();
vyvod.push(otchet('а) здоровый образец без Cloudflare — строки и справки с Cloudflare / Cf-Cache-Status / «кэш»', zdorov, { stroki: [/Cloudflare|Cf-Cache-Status|кэш/], spravki: /Cloudflare|Cf-Cache-Status|кэш/ }));

// б) Образец с Cloudflare (прежний здоровый): зелёная строка блока robots.txt и красная строка проверки 11.
const sCf = await progon(() => {}, { cf: true });
vyvod.push(otchet('б) образец с Cloudflare — строка «блока Cloudflare нет» и проверка 11', sCf, { stroki: ['robots.txt: блока Cloudflare нет', 'запросы не идут через Cloudflare'] }));

// в) Сайт без Cloudflare, вставка хостера в HTML главной (скрипт счётчика хостера со своего пути).
const vstavka = await progon((k) => zamenit(k, `${B}/`, vTelo('</main>', '</main><script src="/.hoster/stat.js"></script>')));
vyvod.push(otchet('в) без Cloudflare, вставка хостера на главной — подсказка проверки 8 и проверка 11', vstavka, { stroki: ['HTML страниц = сборка (dist)', 'запросы не идут через Cloudflare'] }));

zapisat('n1-vyvod.txt', vyvod.join('\n\n'));
