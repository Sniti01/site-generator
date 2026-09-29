// SV23-Z2, образец 1: законные ответы домена у этого хостера после удаления заглушки и после первой выкладки —
// вердикт сторожа домена при первой выкладке со входом on (раунд 2 «судью судят», предмет — 9ca1aa2).
// Сеть не трогается: функция запроса — подставная, как в пробах исполнителя. Ждём: «проход», если оба имени
// отвечают с этого хоста (имя сайта с точностью до регистра, порта по умолчанию и завершающей точки FQDN).
import { writeFileSync, readFileSync } from 'node:fs';

const SV = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs');
const { domen, canonicalOf } = SV;
const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-sv23-z2';
const VYVOD = `${PAPKA}/z2-1-formy-vyvod.txt`;

const W = 'https://www.7thserpent.com/';
const G = 'https://7thserpent.com/';
const WT = 'https://www.7thserpent.com./';
const otv = (status, telo = '', location = '') => ({ status, telo, location });
const osh = (kod) => ({ oshibka: kod });
const iz = (karta) => async (url) => {
  if (!(url in karta)) throw new Error(`запрос вне образца: ${url}`);
  return karta[url];
};
const A403 = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">\n<html><head>\n<title>403 Forbidden</title>\n</head><body>\n<h1>Forbidden</h1>\n<p>You don\'t have permission to access this resource.</p>\n</body></html>\n';
const N404 = '<html>\r\n<head><title>404 Not Found</title></head>\r\n<body>\r\n<center><h1>404 Not Found</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n';
const NC = (h) => `<html><body><h1>Website ${h} not configured</h1></body></html>`;
const NASH_INDEX = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/dist/index.html', 'utf8');
const NASH_404 = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/dist/404/index.html', 'utf8');
const s = (kanon) => `<!doctype html><html><head><title>Страница</title><link rel="canonical" href="${kanon}"></head><body></body></html>`;

const SLUCHAI = [
  // [имя, ответы, ждём ok при первой выкладке и входе on, пояснение]
  ['403 Apache на обоих именах (www пуст)', { [W]: otv(403, A403), [G]: otv(403, A403) }, true],
  ['404 nginx на обоих именах', { [W]: otv(404, N404), [G]: otv(404, N404) }, true],
  ['голое → 301 → www → 403 (панель: «с www»)', { [W]: otv(403, A403), [G]: otv(301, '', W) }, true],
  ['www → 301 → голое → 403 (панель: «без www»)', { [W]: otv(301, '', G), [G]: otv(403, A403) }, true],
  ['голое → 301 на https://www.7thserpent.com:443/ → 403', { [W]: otv(403, A403), [G]: otv(301, '', 'https://www.7thserpent.com:443/') }, true],
  ['голое → 301 на HTTPS://WWW.7THSERPENT.COM/ (заглавные) → 403', { [W]: otv(403, A403), [G]: otv(301, '', 'HTTPS://WWW.7THSERPENT.COM/') }, true],
  ['голое → 301 на //www.7thserpent.com/ (без схемы) → 403', { [W]: otv(403, A403), [G]: otv(301, '', '//www.7thserpent.com/') }, true],
  ['голое → 301 на http://www… → 301 на https://www… → 403', { [W]: otv(403, A403), [G]: otv(301, '', 'http://www.7thserpent.com/'), 'http://www.7thserpent.com/': otv(301, '', W) }, true],
  ['голое → 301 на https://www.7thserpent.com./ (завершающая точка FQDN) → 403', { [W]: otv(403, A403), [G]: otv(301, '', WT), [WT]: otv(403, A403) }, true],
  ['оборванная первая: наш .htaccess есть, index.html нет — www 403, голое → www', { [W]: otv(403, A403), [G]: otv(301, '', W) }, true],
  ['оборванная первая: наша главная (dist/index.html) есть, ключевых нет — www 200, голое → www', { [W]: otv(200, NASH_INDEX), [G]: otv(301, '', W) }, true],
  ['наша 404 (dist/404/index.html, canonical /404/) на корне', { [W]: otv(404, NASH_404), [G]: otv(301, '', W) }, true],
  ['canonical относительный «/»', { [W]: otv(200, s('/')), [G]: otv(301, '', W) }, true],
  ['canonical https://www.7thserpent.com:443/', { [W]: otv(200, s('https://www.7thserpent.com:443/')), [G]: otv(301, '', W) }, true],
  ['canonical заглавными HTTPS://WWW.7THSERPENT.COM/', { [W]: otv(200, s('HTTPS://WWW.7THSERPENT.COM/')), [G]: otv(301, '', W) }, true],
  ['canonical с завершающей точкой https://www.7thserpent.com./', { [W]: otv(200, s('https://www.7thserpent.com./')), [G]: otv(301, '', W) }, true],
  ['canonical чужого сайта — только в комментарии страницы', { [W]: otv(200, '<html><head><title>Страница</title><!-- <link rel="canonical" href="https://hoster.example/"> --></head></html>'), [G]: otv(301, '', W) }, true],
  // Стоп по делу — проверяется строка причины.
  ['www «not configured», голое 403 — www не привязан', { [W]: otv(404, NC('www.7thserpent.com')), [G]: otv(403, A403) }, false],
  ['петля: хостер www → голое, наш .htaccess голое → www', { [W]: otv(301, '', G), [G]: otv(301, '', W) }, false],
];

const out = [];
const rashozhdeniya = [];
for (const [imya, karta, zhdem] of SLUCHAI) {
  out.push(`== ${imya}`);
  const r = await domen({ poluchit: iz(karta), pervyi: true, soglasen: true });
  out.push(`  вход on, первая: ${r.ok ? 'проход' : 'СТОП'} (ждём ${zhdem ? 'проход' : 'стоп'})${r.ok === zhdem ? '' : '  <-- РАСХОЖДЕНИЕ'}`);
  for (const x of r.stroki) out.push(`    | ${x}`);
  if (r.ok !== zhdem) rashozhdeniya.push(imya);
  const bez = await domen({ poluchit: iz(karta), pervyi: true, soglasen: false });
  out.push(`  вход off, первая: ${bez.ok ? 'проход' : 'СТОП'} | ${bez.stroki.at(-1)}`);
}
out.push('');
out.push(`canonical dist/index.html: ${JSON.stringify(canonicalOf(NASH_INDEX))}; dist/404/index.html: ${JSON.stringify(canonicalOf(NASH_404))}`);
out.push(`расхождений: ${rashozhdeniya.length}${rashozhdeniya.length ? ` — ${rashozhdeniya.join('; ')}` : ''}`);
writeFileSync(VYVOD, out.join('\n') + '\n', 'utf8');
console.log(`записано: ${VYVOD}; расхождений ${rashozhdeniya.length}`);
