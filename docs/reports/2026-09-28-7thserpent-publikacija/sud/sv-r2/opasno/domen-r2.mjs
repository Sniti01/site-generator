// SV2 «опасный проход» — «не привязан» только по положительным признакам (sostoyanieHosta, domen), первая выкладка.
// Ищем: «не привязан» при домене, который показывает (или после выкладки покажет) каталог робота. Без сети.
import { domen, sostoyanieHosta } from './storozh.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ZDES = fileURLToPath(new URL('.', import.meta.url));
const W = 'https://www.7thserpent.com/';
const G = 'https://7thserpent.com/';
const NC = (h) => `<html><body><h1>Website ${h} not configured</h1></body></html>`;
const o = (status, telo = '', location = '') => ({ status, telo, location });
const e = (kod) => ({ oshibka: kod });
const iz = (karta) => async (url) => {
  if (!(url in karta)) throw new Error(`запрос вне образца: ${url}`);
  return karta[url];
};

const OBRAZCY = [
  // [id, что, ответы, ждём ok при первой выкладке]
  ['H1', 'www ENOTFOUND, голый — заглушка «not configured» (https → http)', { [W]: e('ENOTFOUND'), [G]: o(302, '', 'http://7thserpent.com/'), 'http://7thserpent.com/': o(404, NC('7thserpent.com')) }, true],
  ['H2', 'редирект на наш хост с другим портом, заглушка с портом', { [W]: o(302, '', 'http://www.7thserpent.com:8080/'), 'http://www.7thserpent.com:8080/': o(404, NC('www.7thserpent.com:8080')), [G]: e('ENOTFOUND') }, false],
  ['H3', 'редирект на наш хост с другим портом, заглушка без порта', { [W]: o(302, '', 'http://www.7thserpent.com:8080/'), 'http://www.7thserpent.com:8080/': o(404, NC('www.7thserpent.com')), [G]: e('ENOTFOUND') }, false],
  ['H4', 'редирект на наш хост с портом по умолчанию (:80) — тот же источник', { [W]: o(302, '', 'http://www.7thserpent.com:80/'), 'http://www.7thserpent.com/': o(404, NC('www.7thserpent.com')), [G]: e('ENOTFOUND') }, true],
  ['H5', 'www → 301 на голый → заглушка голого (www-редирект настроен вне хостера, каталог не показан)', { [W]: o(301, '', G), [G]: o(302, '', 'http://7thserpent.com/'), 'http://7thserpent.com/': o(404, NC('7thserpent.com')) }, true],
  ['H6', 'заглушка «not configured» со статусом 200', { [W]: o(200, NC('www.7thserpent.com')), [G]: e('ENOTFOUND') }, false],
  ['H7', 'заглушка хоста с точкой на конце (www.7thserpent.com.)', { [W]: o(302, '', 'http://www.7thserpent.com./'), 'http://www.7thserpent.com./': o(404, NC('www.7thserpent.com.')), [G]: e('ENOTFOUND') }, false],
  ['H8', 'www ENOTFOUND, голый — таймаут', { [W]: e('ENOTFOUND'), [G]: e('TimeoutError') }, false],
  ['H9', 'www ENOTFOUND, голый — 200 наш сайт', { [W]: e('ENOTFOUND'), [G]: o(200, '<link rel="canonical" href="https://www.7thserpent.com/">') }, false],
  ['H10', 'заглушка чужого хоста после редиректа с нашего', { [W]: o(302, '', 'http://other.example/'), 'http://other.example/': o(404, NC('other.example')), [G]: e('ENOTFOUND') }, false],
  ['H11', 'заглушка нашего хоста, но в теле ещё и наш сайт (canonical) — 404', { [W]: o(404, NC('www.7thserpent.com') + '<link rel="canonical" href="https://www.7thserpent.com/404/">'), [G]: e('ENOTFOUND') }, true],
  ['H12', 'ENOTFOUND на втором скачке (редирект на наш же голый хост, которого нет в DNS)', { [W]: o(301, '', G), [G]: e('ENOTFOUND') }, false],
];

const stroki = [];
let opasnyh = 0;
for (const [id, chto, karta, zhdem] of OBRAZCY) {
  let r;
  try {
    r = await domen({ poluchit: iz(karta), pervyi: true });
  } catch (x) {
    r = { ok: false, stroki: [`исключение: ${x.message} (команда — код 2, шаг падает)`] };
  }
  const opasno = r.ok && !zhdem;
  if (opasno) opasnyh += 1;
  stroki.push(`${id} ${opasno ? 'ОПАСНЫЙ ПРОХОД' : r.ok === zhdem ? 'как надо' : 'иначе (ложный отказ)'} — ${chto}: ${r.ok ? 'проход' : 'отказ'} | ${r.stroki.join(' | ')}`);
}
// H13: некорректный Location — исключение, не «не привязан».
try {
  await sostoyanieHosta(iz({ [W]: o(302, '', 'http://[::1') }), 'www.7thserpent.com');
  stroki.push('H13 некорректный Location: без исключения');
} catch (x) {
  stroki.push(`H13 как надо — некорректный Location: исключение «${x.message}» → команда код 2, шаг падает`);
}
stroki.push(`ИТОГ: образцов ${OBRAZCY.length + 1}, опасных проходов ${opasnyh}`);
const vyvod = stroki.join('\n') + '\n';
writeFileSync(join(ZDES, 'domen-r2.txt'), vyvod);
process.stdout.write(vyvod);
