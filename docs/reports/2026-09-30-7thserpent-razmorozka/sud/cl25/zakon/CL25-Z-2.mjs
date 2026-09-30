// CL25-Z-2: файл владельца — без перевода строки в конце (П113: байт в байт с сервером). Любой безвредный текст,
// который сервер припишет ПОСЛЕ файла встык (блок хостера, комментарий), клеится к строке Sitemap. Google срезает
// комментарий от «#» до конца строки (robots.cc: GetKeyAndValueFrom) и читает тот же Sitemap; поисковики не закрыты.
// check-live краснеет тремя проверками. С прежним файлом (перевод строки в конце) та же приписка — зелёная.
// Пробы «после нашего файла» вставляют перевод строки сами (`nashRobots + '\n' + HOSTER`) — встык не проверен.
import { readFileSync } from 'node:fs';
import { progon, zapisat, nashRobots, BLOK_ZHIVOY, PREZHNIY, PUTI_SBORKI, SAYT, CL } from './obshchee.mjs';

/** Чтение строки по правилам Google (robots.cc): комментарий от «#» срезан, пробелы по краям сняты, ключ — до двоеточия. */
const poGoogle = (stroka) => {
  const s = stroka.replace(/#.*$/, '').trim();
  const d = s.indexOf(':');
  return d < 0 ? { klyuch: s, znachenie: '' } : { klyuch: s.slice(0, d).trim(), znachenie: s.slice(d + 1).trim() };
};
const KOMM = '# robots.txt served by adm.tools hosting\n';
const VARIANTY = [
  ['G1 файл владельца + живой блок хостера встык (приписан после файла)', { mimo: nashRobots + BLOK_ZHIVOY }],
  ['G2 файл владельца + комментарий хостера встык', { mimo: nashRobots + KOMM }],
  ['G3 контроль: файл владельца + перевод строки + живой блок', { mimo: nashRobots + '\n' + BLOK_ZHIVOY }],
  ['G4 контроль: прежний файл (с переводом строки в конце) + живой блок встык, наш — прежний', { mimo: PREZHNIY + BLOK_ZHIVOY, nash: PREZHNIY }],
];
const out = [`последний байт файла владельца: 0x${Buffer.from(nashRobots).at(-1).toString(16)} (0x0a — перевод строки); прежнего файла: 0x${Buffer.from(PREZHNIY).at(-1).toString(16)}`, ''];
for (const [imya, v] of VARIANTY) {
  const r = await progon(v);
  out.push(`== ${imya} ==`, `итог ${r.okCount}/${r.vsego}; ПЛОХО: ${r.plokho.join(' | ') || '—'}`, ...r.stroki.map((s) => `  ${s}`));
  const sitemapy = v.mimo.split('\n').filter((s) => /^sitemap/i.test(s.trim())).map((s) => poGoogle(s));
  out.push(`  по правилам Google строки Sitemap: ${JSON.stringify(sitemapy)}`);
  out.push(`  по правилам Google закрыто (zakrytoPoiskovikam, пути сборки образца): ${JSON.stringify(CL.zakrytoPoiskovikam(v.mimo, PUTI_SBORKI))}`, '');
}
const proby = readFileSync(`${SAYT}/tools/testy/check-live.test.mjs`, 'utf8');
const posle = proby.split('\n').map((s, i) => [i + 1, s]).filter(([, s]) => s.includes("nashRobots + '\\n") && /HOSTER|BEGIN adm/.test(s));
out.push('пробы «после нашего файла» — перевод строки вставлен самой пробой:', ...posle.map(([i, s]) => `  строка ${i}: ${s.trim().slice(0, 160)}`));
out.push(`встык (nashRobots + HOSTER или nashRobots + '#…') в пробах: ${/nashRobots \+ (HOSTER|'#)/.test(proby) ? 'есть' : 'нет'}`);
zapisat('CL25-Z-2-vyvod.txt', out);
