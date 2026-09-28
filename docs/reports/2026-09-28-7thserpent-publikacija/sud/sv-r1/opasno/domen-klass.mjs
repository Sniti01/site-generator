// SV1 «опасный проход» — «домен уже привязан?» и договор workflow вокруг него (коммит e6cd82f).
// Сети нет: ответы домена — подставной poluchit; workflow — копия из git show, разбор пакетом yaml репозитория.
import { domen } from './storozh.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ZDES = fileURLToPath(new URL('.', import.meta.url));
const { parse } = await import(pathToFileURL('D:/SEO/cloud/site-generator/node_modules/yaml/dist/index.js').href);

const otv = (status, telo = '', location = '') => ({ status, telo, location });
const iz = (karta) => async (url) => {
  if (!(url in karta)) throw new Error(`запрос вне образца: ${url}`);
  return karta[url];
};
const W = 'https://www.7thserpent.com/';
const G = 'https://7thserpent.com/';
const ZAGL = '<html><head><title>Сайт створено</title></head><body><h1>Сайт успішно створено</h1></body></html>';
const NGINX404 = '<html>\r\n<head><title>404 Not Found</title></head>\r\n<body>\r\n<center><h1>404 Not Found</h1></center>\r\n<hr><center>nginx</center>\r\n</body>\r\n</html>\r\n';
const APACHE404 = '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN"><html><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>The requested URL was not found on this server.</p></body></html>';
const PERVOGO404 = '<!doctype html><html><head><link rel="canonical" href="https://www.ac4bf-thewatch.com/404/"></head><body><h1>Nie ma takiej strony</h1></body></html>';
const CHUZHOY_NC = '<html><body><h1>404</h1><p>Tenant route is not configured for this path</p></body></html>';

const stroki = [];
const OBRAZCY = [
  // [id, что это, ответы, первая выкладка (вход), ждём ok]
  ['D0', 'контроль: имя не разрешается, первая', { [W]: { oshibka: 'ENOTFOUND' }, [G]: { oshibka: 'ENOTFOUND' } }, true, true],
  ['D0b', 'контроль: заглушка хостера 200 на привязанном сайте, первая', { [W]: otv(200, ZAGL), [G]: otv(200, ZAGL) }, true, false],
  ['D1', 'вход по умолчанию (off): сайт заведён, DNS на хостер, заглушка хостера 200 — первая выкладка по факту', { [W]: otv(200, ZAGL), [G]: otv(200, ZAGL) }, false, false],
  ['D1b', 'вход по умолчанию (off): сайт заведён, каталог пуст — 403', { [W]: otv(403, 'Forbidden'), [G]: otv(403, 'Forbidden') }, false, false],
  ['D2', 'первая: привязанный сайт с пустым каталогом отвечает 404 nginx (заглушку удалили, как велит indeks)', { [W]: otv(404, NGINX404), [G]: otv(404, NGINX404) }, true, false],
  ['D2b', 'первая: привязанный сайт отвечает 404 Apache', { [W]: otv(404, APACHE404), [G]: otv(404, APACHE404) }, true, false],
  ['D3', 'первая: домен отдаёт 404-страницу первого сайта (чужой сайт аккаунта за доменом)', { [W]: otv(404, PERVOGO404), [G]: otv(404, PERVOGO404) }, true, false],
  ['D4', 'первая: чужая живая 404 со словами «not configured» в тексте', { [W]: otv(404, CHUZHOY_NC), [G]: otv(404, CHUZHOY_NC) }, true, false],
];
let opasnyh = 0;
for (const [id, chto, karta, pervyi, zhdem] of OBRAZCY) {
  const r = await domen({ poluchit: iz(karta), pervyi });
  const opasno = r.ok && !zhdem;
  if (opasno) opasnyh += 1;
  stroki.push(`${id} ${opasno ? 'ОПАСНЫЙ ПРОХОД' : r.ok === zhdem ? 'как надо' : 'иначе'} — ${chto}: ${r.ok ? 'проход' : 'СТОП'} | ${r.stroki.join(' | ')}`);
}

// Договор workflow: откуда берётся «первая», чем она управляет, где стоит сторож домена.
const wf = parse(readFileSync(join(ZDES, 'deploy-7thserpent.yml'), 'utf8'));
const vhod = wf.on.workflow_dispatch.inputs.SERPENT_FIRST;
const shagi = wf.jobs.deploy.steps;
const nomer = (kusok) => shagi.findIndex((s) => (s.name ?? '').includes(kusok));
const nameFirst = shagi.filter((s) => JSON.stringify(s).includes('SERPENT_FIRST')).map((s) => `«${s.name}» (${s.if ? 'if: ' + s.if : 'env'})`);
stroki.push(`workflow: вход SERPENT_FIRST — варианты ${JSON.stringify(vhod.options)}, по умолчанию «${vhod.default}»; на push вход пуст → «${"${{ inputs.SERPENT_FIRST || 'off' }}"}» = off`);
stroki.push(`workflow: SERPENT_FIRST читают шаги: ${nameFirst.join('; ')}`);
stroki.push(`workflow: порядок — «Домен уже привязан?» шаг ${nomer('Домен уже привязан')}, сторож папки и index.html шаг ${nomer('Сторож папки робота')}, выкладка шаг ${nomer('Выкладка по FTPS')}; сторож домена не получает от сервера ничего (нет ли нашего index.html), «первая» — только слово входа`);
stroki.push(`ИТОГ: образцов ${OBRAZCY.length}, опасных проходов ${opasnyh}`);
const vyvod = stroki.join('\n') + '\n';
writeFileSync(join(ZDES, 'domen-klass.txt'), vyvod);
process.stdout.write(vyvod);
