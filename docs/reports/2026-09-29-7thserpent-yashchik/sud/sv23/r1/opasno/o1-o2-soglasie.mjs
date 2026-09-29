// SV23-O-1 и SV23-O-2: сторож домена при первой выкладке — без входа и со входом SERPENT_DOMAIN_BOUND=on — на образцах,
// которых слово владельца («печатает, что отвечает, и не останавливает» при «домен привязан») не описывает:
//   O-1 — «не понять»: ответа нет, печатать нечего (сертификат, отказ соединения, временная ошибка имени);
//   O-2 — ответ есть, но он опровергает «домен привязан»: канонический www не разрешается при живом голом имени,
//         редирект на чужой хост, чужой canonical, петля, редирект на несуществующее имя.
// Последствие берётся из .htaccess сборки (он едет первой выкладкой): 301 на https://www.7thserpent.com/ для http,
// для голого имени и для http без www — при битом https или неразрешимом www сайт не откроется ни по одному имени.
// Сети нет: ответы — из образца (iz), запрос вне образца — ошибка.
import { readFileSync } from 'node:fs';
import { SV, REPO, W, G, otv, oshibka, iz, ZAGLUSHKA, vyvod } from './obshchee-o.mjs';

const PERVOGO = '<!doctype html><html><head><title>AC4BF — The Watch</title><link rel="canonical" href="https://www.ac4bf-thewatch.com/"></head><body></body></html>';
const PRODAZHA = '<html><head><title>Домен 7thserpent.com продаётся</title></head><body>Купите домен</body></html>';
const CHUZHOI = 'https://prodazha-domenov.example/lot/7thserpent';
const OBRAZCY = [
  ['O-1', 'www: сертификат не на это имя; голое: заглушка хостера 200', { [W]: oshibka('ERR_TLS_CERT_ALTNAME_INVALID'), [G]: otv(200, ZAGLUSHKA) }],
  ['O-1', 'оба: сертификат просрочен', { [W]: oshibka('CERT_HAS_EXPIRED'), [G]: oshibka('CERT_HAS_EXPIRED') }],
  ['O-1', 'оба: порт https не принимает соединение', { [W]: oshibka('ECONNREFUSED'), [G]: oshibka('ECONNREFUSED') }],
  ['O-1', 'оба: временная ошибка имени', { [W]: oshibka('EAI_AGAIN'), [G]: oshibka('EAI_AGAIN') }],
  ['O-2', 'канонический www не разрешается; голое: заглушка хостера 200', { [W]: oshibka('ENOTFOUND'), [G]: otv(200, ZAGLUSHKA) }],
  ['O-2', 'оба: 302 на чужой хост, там «домен продаётся»', { [W]: otv(302, '', CHUZHOI), [G]: otv(302, '', CHUZHOI), [CHUZHOI]: otv(200, PRODAZHA) }],
  ['O-2', 'www: страница первого сайта (canonical ac4bf); голое: 301 на www', { [W]: otv(200, PERVOGO), [G]: otv(301, '', W) }],
  ['O-2', 'www: петля редиректов; голое не разрешается', { [W]: otv(301, '', W), [G]: oshibka('ENOTFOUND') }],
  ['O-2', 'www: редирект на имя, которого нет; голое не разрешается', { [W]: otv(301, '', 'https://net-takogo-imeni.example/'), 'https://net-takogo-imeni.example/': oshibka('ENOTFOUND'), [G]: oshibka('ENOTFOUND') }],
];

const stroki = [];
const htaccess = readFileSync(`${REPO}/sites/7thserpent.com/public/.htaccess`, 'utf8').split(/\r?\n/);
stroki.push('.htaccess сборки (едет первой выкладкой) — правило одного адреса:', ...htaccess.filter((s) => /Rewrite(Cond|Rule)|WHEN BINDING|FIRST, traffic|certificate gives/.test(s)).map((s) => `  ${s}`), '');

let proshlo = { 'O-1': 0, 'O-2': 0 };
for (const [id, imya, karta] of OBRAZCY) {
  const bez = await SV.domen({ poluchit: iz(karta), pervyi: true });
  const so = await SV.domen({ poluchit: iz(karta), pervyi: true, soglasen: true });
  if (!bez.ok && so.ok) proshlo[id] += 1;
  stroki.push(`${id} · ${imya}`);
  stroki.push(`  без входа: ${bez.ok ? 'ПРОХОД' : 'СТОП'}; со входом on: ${so.ok ? 'ПРОХОД' : 'СТОП'}`);
  stroki.push(...so.stroki.map((s) => `    ${s}`));
  const podskazka = bez.stroki.at(-1);
  stroki.push(`  подсказка стопа без входа зовёт ко входу: ${/SERPENT_DOMAIN_BOUND = on/.test(podskazka) ? 'да' : 'нет'}`);
  stroki.push('');
}
stroki.push(`ИТОГ: со входом on проходят все образцы O-1 (${proshlo['O-1']} из ${OBRAZCY.filter(([id]) => id === 'O-1').length}) и O-2 (${proshlo['O-2']} из ${OBRAZCY.filter(([id]) => id === 'O-2').length}); без входа каждый — стоп.`);
stroki.push('Строка прохода утверждает «домен покажет её сразу» во всех образцах — и там, где домен не ответил, и там, где он ведёт на чужой хост или на имя, которого нет.');
vyvod('o1-o2-vyvod.txt', stroki);
