// CL23-P: крайние случаи проверки 11 на сайте без Cloudflare — след у одного ответа в разных местах прогона.
import { progon, otchet, zapisat, zamenit, sZag, otvet, urlset, B, KARTA, METKA, SRV, CF } from './obshchee.mjs';

const STROKI = ['запросы не идут через Cloudflare'];
const obrazcy = [
  ['cf-ray только у ответа 404 несуществующего адреса', (k) => zamenit(k, `${B}/net-takoy-stranicy-${METKA}/`, (o) => sZag(o, { 'cf-ray': '8c1a2b3c4d5e6f70-WAW' }))],
  ['server: Cloudflare (заглавная) только у sitemap-index.xml', (k) => zamenit(k, `${B}/sitemap-index.xml`, (o) => sZag(o, { server: 'Cloudflare' }))],
  ['cf-cache-status только у /404/ напрямую', (k) => zamenit(k, `${B}/404/`, (o) => sZag(o, { 'cf-cache-status': 'DYNAMIC' }))],
  ['лишний адрес карты (вне структуры) через Cloudflare', (k) => {
    k.set(`${B}/sitemap-0.xml`, otvet(200, urlset([...KARTA, `${B}/lishniy/`]), SRV));
    k.set(`${B}/lishniy/`, otvet(404, '<html><head><title>x</title></head></html>', CF));
  }],
  ['главная 503 (сервер хостера), голый хост через Cloudflare — причина в строке 11', (k) => {
    zamenit(k, `${B}/`, (o) => ({ ...o, status: 503 }));
    for (const u of ['https://7thserpent.com/', 'http://7thserpent.com/']) zamenit(k, u, (o) => sZag(o, CF));
  }],
];
const vyvod = [];
for (const [imya, f] of obrazcy) vyvod.push(otchet(imya, await progon(f), { stroki: STROKI }));
zapisat('n5-vyvod.txt', vyvod.join('\n\n'));
