// Разведка законных форм живого robots.txt с файлом владельца: что скажет check-live (копия cbe35eb).
import { progon, otchet, zapisat, nashRobots, BLOK_ZHIVOY, PREZHNIY, sha } from './obshchee.mjs';

const CRLF = (t) => t.replace(/\n/g, '\r\n');
const BOM = '﻿';
const FORMY = [
  ['F0 файл владельца как есть (живой образец)', { mimo: nashRobots }],
  // 1 — блок хостера снова включён
  ['F1 живой блок хостера (байты сессии 24) перед файлом владельца', { mimo: BLOK_ZHIVOY + nashRobots }],
  ['F2 живой блок после файла владельца, хостер вставил перевод строки', { mimo: nashRobots + '\n' + BLOK_ZHIVOY }],
  ['F3 живой блок после файла владельца встык (файл без перевода строки в конце)', { mimo: nashRobots + BLOK_ZHIVOY }],
  ['F4 живой блок после файла владельца через пустую строку', { mimo: nashRobots + '\n\n' + BLOK_ZHIVOY }],
  ['F5 живой блок перед файлом, всё тело CRLF', { mimo: CRLF(BLOK_ZHIVOY + nashRobots) }],
  // 2 — окончания, BOM, регистр
  ['F6 файл владельца с CRLF', { mimo: CRLF(nashRobots) }],
  ['F7 BOM + файл владельца', { mimo: BOM + nashRobots }],
  ['F8 файл владельца + перевод строки в конце', { mimo: nashRobots + '\n' }],
  ['F9 файл владельца + CRLF в конце', { mimo: nashRobots + '\r\n' }],
  ['F10 BOM + живой блок + файл владельца', { mimo: BOM + BLOK_ZHIVOY + nashRobots }],
  ['F11 живой блок + BOM + файл владельца (хостер приписал блок к файлу с BOM)', { mimo: BLOK_ZHIVOY + BOM + nashRobots }],
  ['F12 ключи строчными (user-agent, disallow, allow, sitemap)', { mimo: nashRobots.replace(/User-Agent:|User-agent:/g, 'user-agent:').replace(/Disallow:/g, 'disallow:').replace(/Allow:/g, 'allow:').replace('Sitemap:', 'sitemap:') }],
  ['F13 только «Sitemap:» строчными', { mimo: nashRobots.replace('Sitemap:', 'sitemap:') }],
  ['F14 «User-Agent» → «User-agent» во всех группах', { mimo: nashRobots.replace(/User-Agent:/g, 'User-agent:') }],
  // 3 — правка правил на сервере (панель)
  ['F15 на сервере добавлен бот GPTBot перед группой Googlebot', { mimo: nashRobots.replace('User-agent: Googlebot', 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: Googlebot') }],
  ['F16 на сервере убран бот serpstatbot', { mimo: nashRobots.replace('User-agent: serpstatbot\nDisallow: /\n\n', '') }],
  ['F17 на сервере добавлен бот в конец (после Sitemap)', { mimo: nashRobots + '\n\nUser-agent: GPTBot\nDisallow: /' }],
  ['F18 блок хостера включён со своим перечнем (как в сессии 24) — законно', { mimo: BLOK_ZHIVOY + nashRobots }],
  // 4 — комментарии и пустые строки хостера вокруг файла
  ['F19 комментарий хостера перед файлом', { mimo: '# robots.txt served by adm.tools hosting\n' + nashRobots }],
  ['F20 комментарий хостера после файла с переводом строки', { mimo: nashRobots + '\n# robots.txt served by adm.tools hosting\n' }],
  ['F21 комментарий хостера после файла встык', { mimo: nashRobots + '# robots.txt served by adm.tools hosting\n' }],
  ['F22 пустые строки вокруг файла', { mimo: '\n\n' + nashRobots + '\n\n' }],
  ['F23 пробелы в конце строк файла', { mimo: nashRobots.replace(/\n/g, ' \n') }],
  // образец сессии 24 против нынешнего файла и прежний файл «нашим»
  ['F24 образец сессии 24 (блок + прежний файл), наш — прежний', { mimo: BLOK_ZHIVOY + PREZHNIY, nash: PREZHNIY }],
];
const out = [`файл владельца: ${Buffer.byteLength(nashRobots)} байт, sha256 ${sha(nashRobots)}; блок хостера: ${Buffer.byteLength(BLOK_ZHIVOY)} байт`];
for (const [imya, v] of FORMY) out.push(...otchet(imya, await progon(v)), '');
zapisat('formy-vyvod.txt', out);
