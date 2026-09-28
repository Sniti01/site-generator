// SV2 — повтор образцов «опасного прохода» раунда 1 (sv-r1/opasno: papka-klass, domen-klass, cep-pervoy) на правке 6419c9b:
// держит ли правка то, что закрывала. Образцы переписаны сюда (скрипты раунда 1 при запуске пишут в репозиторий).
import { papka, indeks, domen, pervayaVykladka } from './storozh.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ZDES = fileURLToPath(new URL('.', import.meta.url));
const AC4BF = '<!doctype html><html><head><title>AC4BF</title><link rel="canonical" href="https://www.ac4bf-thewatch.com/"></head><body></body></html>';
const SEMDTD = '<!doctype html><html><head><link rel="canonical" href="https://7dtd.com.pl/"></head><body></body></html>';
const NASH = '<!doctype html><html><head><link rel="canonical" href="https://www.7thserpent.com/"></head><body></body></html>';
const skachaet = (spisok, soderzhimoe) => (spisok.split('\n').map((s) => s.trim()).includes('index.html') ? soderzhimoe : null);

const PAPKA = [
  ['K1', './\n../\n7dtd.com.pl/\nac4bf-thewatch.com/\n7thserpent.com/\n', null, 'отказ'],
  ['K2', './\n../\nwww/\n', null, 'отказ'],
  ['K3', './\n../\n.htaccess\n404/\n_astro/\nguides/\nindex.html\nrobots.txt\n', AC4BF, 'отказ'],
  ['K4', './\n../\n_astro/\nindex.html\nrobots.txt\n', SEMDTD, 'отказ'],
  ['K5', './\n../\n', null, 'проход'],
  ['K6', './\n../\n.htaccess\n_astro/\nindex.html\nprivacy/\n', NASH, 'проход'],
  ['A1', './\n../\n.htaccess\n404/\n_astro/\nguides/\nrobots.txt\nsitemap-index.xml\nsitemap-0.xml\n', null, 'отказ'],
  ['A2', './\n../\nBaseLayout.Ab12cd.css\nhero.Xy_1.webp\nbodoni-moda-latin-600-normal.Dg.woff2\n', null, 'отказ'],
  ['A3', './\n../\n.htaccess\nindex.php\nwp-admin/\nwp-content/\nwp-includes/\nwp-config.php\n', null, 'отказ'],
  ['A4', './\n../\n_astro/\nIndex.html\nrobots.txt\n', AC4BF, 'отказ'],
  ['A5', './\n../\n_astro/\nINDEX.HTML\n', AC4BF, 'отказ'],
  ['A6', './\n../\nimages/\nindex.htm\n', AC4BF, 'отказ'],
  ['A7', './\n../\n_astro/\nguides/\nindex.html@\nrobots.txt\n', AC4BF, 'отказ'],
  ['A8', './\n../\n7dtd.com.pl\nac4bf-thewatch.com\n7thserpent.com\n', null, 'отказ'],
  ['A9', './\n../\nзмій.укр/\nсерпент.укр/\n', null, 'отказ'],
  ['A10', './\n../\nwww\n', null, 'отказ'],
];
const stroki = [];
let plokhih = 0;
for (const [id, spisok, naServere, zhdem] of PAPKA) {
  const sk = skachaet(spisok, naServere);
  const p = papka(spisok, sk);
  const i = p.ok ? indeks(sk) : null;
  const itog = p.ok && i.ok ? 'проход' : 'отказ';
  if (itog !== zhdem) plokhih += 1;
  stroki.push(`${id} ${itog === zhdem ? 'держит' : 'НЕ ДЕРЖИТ'}: ${itog} (надо ${zhdem})`);
}

const otv = (status, telo = '', location = '') => ({ status, telo, location });
const W = 'https://www.7thserpent.com/';
const G = 'https://7thserpent.com/';
const ZAGL = '<html><head><title>Сайт створено</title></head><body><h1>Сайт успішно створено</h1></body></html>';
const NGINX404 = '<html>\r\n<head><title>404 Not Found</title></head>\r\n<body>\r\n<center><h1>404 Not Found</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n';
const PERVOGO404 = '<!doctype html><html><head><link rel="canonical" href="https://www.ac4bf-thewatch.com/404/"></head><body><h1>Nie ma takiej strony</h1></body></html>';
const CHUZHOY_NC = '<html><body><h1>404</h1><p>Tenant route is not configured for this path</p></body></html>';
// Вход по умолчанию off; каталог пуст (index.html нет) → pervaya по серверу.
const pervyiPoServeru = pervayaVykladka('off', null).pervaya;
const DOMEN = [
  ['D1', 'вход off, каталог пуст, заглушка 200', { [W]: otv(200, ZAGL), [G]: otv(200, ZAGL) }, pervyiPoServeru, false],
  ['D1b', 'вход off, каталог пуст, 403', { [W]: otv(403, 'Forbidden'), [G]: otv(403, 'Forbidden') }, pervyiPoServeru, false],
  ['D2', 'первая, 404 nginx', { [W]: otv(404, NGINX404), [G]: otv(404, NGINX404) }, true, false],
  ['D3', 'первая, 404 первого сайта', { [W]: otv(404, PERVOGO404), [G]: otv(404, PERVOGO404) }, true, false],
  ['D4', 'первая, чужая 404 со словами «not configured»', { [W]: otv(404, CHUZHOY_NC), [G]: otv(404, CHUZHOY_NC) }, true, false],
];
for (const [id, chto, karta, pervyi, zhdem] of DOMEN) {
  const r = await domen({ poluchit: async (u) => karta[u], pervyi });
  if (r.ok !== zhdem) plokhih += 1;
  stroki.push(`${id} ${r.ok === zhdem ? 'держит' : 'НЕ ДЕРЖИТ'}: ${chto} — ${r.ok ? 'проход' : 'отказ'}`);
}
stroki.push(`ИТОГ: образцов раунда 1 — ${PAPKA.length + DOMEN.length}, не держит ${plokhih}`);
const vyvod = stroki.join('\n') + '\n';
writeFileSync(join(ZDES, 'r1-povtor.txt'), vyvod);
process.stdout.write(vyvod);
