// CL25-Z-1: живой блок хостера (законная форма, П113) содержит строку «User-Agent: AhrefsBot» — ту же, что первая строка
// файла владельца. Когда на сервере файл владельца изменён (правка в панели) и блок включён, подсказка «первая
// расходящаяся строка» указывает внутрь блока хостера, а справка ставит блок «после нашего файла», хотя он перед ним.
// С прежним файлом (первая строка — уникальный комментарий) и без блока указатель верный.
import { progon, zapisat, nashRobots, BLOK_ZHIVOY, PREZHNIY, CL } from './obshchee.mjs';

const zamena = (t, iz, na) => {
  if (!t.includes(iz)) throw new Error(`нет «${iz}»`);
  return t.replace(iz, na);
};
const sGPTBot = zamena(nashRobots, 'User-agent: Googlebot', 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: Googlebot');
const bezSerpstat = zamena(nashRobots, 'User-agent: serpstatbot\nDisallow: /\n\n', '');
const allowVDisallow = zamena(nashRobots, 'User-agent: Googlebot\nAllow: /', 'User-agent: Googlebot\nDisallow: /');
const prezhniyPlus = zamena(PREZHNIY, 'User-agent: *', 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: *');

// Подставной блок проб (HOSTER копии проб): «User-agent: AhrefsBot» — со строчной «a», не как в файле владельца.
const HOSTER_PROB = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const VARIANTY = [
  ['T  подставной блок проб + на сервере добавлен GPTBot (как пробы видят эту форму)', { mimo: HOSTER_PROB + sGPTBot }],
  ['A0 контроль: без блока, на сервере добавлен GPTBot перед Googlebot', { mimo: sGPTBot }],
  ['A  блок хостера + на сервере добавлен GPTBot перед Googlebot', { mimo: BLOK_ZHIVOY + sGPTBot }],
  ['B0 контроль: без блока, на сервере убран serpstatbot', { mimo: bezSerpstat }],
  ['B  блок хостера + на сервере убран serpstatbot', { mimo: BLOK_ZHIVOY + bezSerpstat }],
  ['C  блок хостера + у Googlebot Allow → Disallow (вред)', { mimo: BLOK_ZHIVOY + allowVDisallow }],
  ['S24 контроль: образец сессии 24 (блок + прежний файл) с добавленным GPTBot, наш — прежний', { mimo: BLOK_ZHIVOY + prezhniyPlus, nash: PREZHNIY }],
];
const out = [];
const nashaPervaya = nashRobots.split('\n')[0];
const vBloke = BLOK_ZHIVOY.split('\n').map((s, i) => [i + 1, s]).filter(([, s]) => s === nashaPervaya);
out.push(`первая строка файла владельца: «${nashaPervaya}»; в живом блоке хостера та же строка — строка(и) блока №: ${vBloke.map(([i]) => i).join(', ') || 'нет'}`);
out.push(`первая строка прежнего файла: «${PREZHNIY.split('\n')[0]}» — в блоке: ${BLOK_ZHIVOY.split('\n').includes(PREZHNIY.split('\n')[0]) ? 'есть' : 'нет'}`, '');
for (const [imya, v] of VARIANTY) {
  const r = await progon(v);
  const celikom = r.proverki.find((c) => c.imya === 'robots.txt: наш файл целиком');
  const poisk = r.proverki.find((c) => c.imya === 'robots.txt: поисковики не закрыты');
  out.push(`== ${imya} ==`, `итог ${r.okCount}/${r.vsego}; ПЛОХО: ${r.plokho.join(' | ') || '—'}`);
  out.push(`  наш файл целиком: ${celikom.ok ? 'ok' : 'ПЛОХО'} — ${celikom.otkuda}`);
  out.push(`  поисковики не закрыты: ${poisk.ok ? 'ok' : 'ПЛОХО'} — ${poisk.otkuda}`);
  for (const s of r.spravki.filter((x) => x.includes('блок хостера'))) out.push(`  справка: ${s}`);
  const rb = CL.razobratRobots(v.mimo, v.nash ?? nashRobots);
  out.push(`  razobratRobots: nashCelikom ${rb.nashCelikom}; bloki ${JSON.stringify(rb.bloki)}`, '');
}
zapisat('CL25-Z-1-vyvod.txt', out);
