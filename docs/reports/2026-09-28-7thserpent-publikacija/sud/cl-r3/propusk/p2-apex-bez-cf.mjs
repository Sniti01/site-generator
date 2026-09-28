// CL3-P-2: «запросы идут через Cloudflare» судит только ответы 200 канонического хоста. Образец — голый домен
// 7thserpent.com в DNS «серым облаком» (DNS only, запись A прямо на хостер): его ответы — от nginx хостера, без cf-ray;
// редирект на https://www… хостер делает сам (.htaccess), поэтому редиректы здоровы. Ряд 05 /privacy/ («every request
// passes through Cloudflare») для запросов на голый домен неверен: TLS и IP читателя — у хостера напрямую.
import { progon, vyvesti, stroka, otvet, B, igra } from './obshchee.mjs';

const NGINX = { server: 'nginx' };
const r = await progon((k) => {
  for (const put of ['/', igra]) {
    k.set(`https://7thserpent.com${put}`, otvet(301, '', NGINX, `${B}${put}`));
    k.set(`http://7thserpent.com${put}`, otvet(301, '', NGINX, `${B}${put}`));
  }
});
vyvesti('p2-apex-bez-cf', [
  'голый домен без Cloudflare (4 ответа 301 от nginx, без cf-ray):',
  `итог инструмента: ${r.itog}`,
  stroka(r.najti('запросы идут через Cloudflare')),
  stroka(r.najti('голый → www /: статус')),
  stroka(r.najti('http голый → https www /: Location')),
]);
