// SV23-O2 · причины стопа после правки раунда 1.
// Часть 1 (вход on): ошибка сертификата или сети на ЧУЖОМ хосте после редиректа приписывается домену — совет «выпусти
// сертификат Let's Encrypt в панели хостера для обоих имён» или «проверь DNS», хотя домен ведёт на чужой хост.
// Часть 2 (без входа): смешанные случаи — одно имя отвечает, другое с ошибкой сертификата, не привязано, не отвечает
// или оба ведут не на этот сайт: стоп без входа зовёт «новый запуск со входом SERPENT_DOMAIN_BOUND = on», а со входом
// тот же домен — снова стоп другой причиной (вход не поможет). Образец N1 — O-1 раунда 1 (www: сертификат не на это
// имя; голое: заглушка хостера 200). Сети нет: ответы — подставной poluchit.
import { SV, W, G, otv, oshibka, iz, vyvod, ZAGLUSHKA, PERVOGO, poslednyaya, itogStroka } from './obshchee-o2.mjs';

const CHUZHOI = 'https://prodazha-domenov.example/lot/7thserpent';
const CHAST1 = [
  ['P1 · оба имени — 302 на чужой хост, у чужого хоста сертификат не на его имя', { [W]: otv(302, '', CHUZHOI), [G]: otv(302, '', CHUZHOI), [CHUZHOI]: oshibka('ERR_TLS_CERT_ALTNAME_INVALID') }],
  ['P2 · оба имени — 302 на чужой хост, чужой хост не отвечает (таймаут)', { [W]: otv(302, '', CHUZHOI), [G]: otv(302, '', CHUZHOI), [CHUZHOI]: oshibka('TimeoutError') }],
  ['P3 · www не разрешается, голое — 302 на чужой сайт', { [W]: oshibka('ENOTFOUND'), [G]: otv(302, '', CHUZHOI), [CHUZHOI]: otv(200, '<title>Домен продаётся</title>') }],
];
const CHAST2 = [
  ['N1 · www: сертификат не на это имя; голое: заглушка хостера 200 (O-1 раунда 1)', { [W]: oshibka('ERR_TLS_CERT_ALTNAME_INVALID'), [G]: otv(200, ZAGLUSHKA) }],
  ['N2 · www не разрешается; голое: заглушка хостера 200', { [W]: oshibka('ENOTFOUND'), [G]: otv(200, ZAGLUSHKA) }],
  ['N3 · оба имени — 302 на чужой сайт', { [W]: otv(302, '', CHUZHOI), [G]: otv(302, '', CHUZHOI), [CHUZHOI]: otv(200, '<title>Домен продаётся</title>') }],
  ['N4 · www — таймаут; голое: заглушка хостера 200', { [W]: oshibka('TimeoutError'), [G]: otv(200, ZAGLUSHKA) }],
  ['N5 · оба имени — страница первого сайта (canonical ac4bf)', { [W]: otv(200, PERVOGO), [G]: otv(200, PERVOGO) }],
  ['N6 · www — просроченный сертификат; голое — 301 на www', { [W]: oshibka('CERT_HAS_EXPIRED'), [G]: otv(301, '', W) }],
];

const stroki = ['Часть 1 — первая выкладка, вход on: чья ошибка?', ''];
for (const [imya, karta] of CHAST1) {
  const r = await SV.domen({ poluchit: iz(karta), pervyi: true, soglasen: true });
  stroki.push(`${imya}: сторож — ${itogStroka(r)}`);
  for (const s of r.stroki.slice(0, 2)) stroki.push(`  ${s}`);
  stroki.push(`  итог: ${poslednyaya(r)}`, '');
}

stroki.push('Часть 2 — первая выкладка: без входа стоп зовёт ко входу; со входом — снова стоп', '');
let zovyot = 0;
for (const [imya, karta] of CHAST2) {
  const bez = await SV.domen({ poluchit: iz(karta), pervyi: true, soglasen: false });
  const so = await SV.domen({ poluchit: iz(karta), pervyi: true, soglasen: true });
  const zovet = poslednyaya(bez).includes('со входом SERPENT_DOMAIN_BOUND = on');
  if (zovet && !so.ok) zovyot += 1;
  stroki.push(`${imya}`);
  for (const s of bez.stroki.slice(0, 2)) stroki.push(`  ${s}`);
  stroki.push(`  без входа: ${itogStroka(bez)}; зовёт ко входу: ${zovet ? 'да' : 'нет'} — ${poslednyaya(bez)}`);
  stroki.push(`  со входом: ${itogStroka(so)} — ${poslednyaya(so)}`, '');
}
stroki.push(`ИТОГ части 2: стоп без входа зовёт ко входу, а со входом тот же домен — снова стоп: ${zovyot} из ${CHAST2.length}.`);
stroki.push('Проба раунда «ошибка сертификата, без согласия — вход не предлагается» держится на образце, где оба имени с ошибкой;');
stroki.push('в смешанном случае (одно имя отвечает) строка «домен уже отвечает» зовёт ко входу и об ошибке сертификата молчит.');
vyvod('o2-prichina-vyvod.txt', stroki);
