// CL25-P-6: проверка 4 («без параметра — его берут роботы») при кэше Cloudflare считает прежнюю редакцию нашего
// файла безвредной: строки нашего файла вне целого файла — не чужие (razobratRobots, i < 0), и справка говорит «вреда
// нет». Это обещание прежнего файла («всё открыто» — любая его редакция безвредна). С файлом владельца прежняя редакция
// без закрытой группы открывает бота, которого владелец закрыл: роботы видят serpstatbot открытым — проверка 4 ok,
// справка «вреда нет». Прогон красный только следом Cloudflare (П108) — поэтому низкая.
import { robotsCc } from './robots-cc.mjs';
import { progon, nashRobots, BEZ, vyvod } from './stend.mjs';

const out = [];
const p = (...a) => out.push(a.join(' '));
const BEZ_P = 'robots.txt без параметра (его берут роботы)';
const staraya = nashRobots.replace('User-agent: serpstatbot\nDisallow: /\n\n', '');
if (staraya === nashRobots) throw new Error('замена не сработала');
const sluchai = [
  ['A. без параметра из кэша Cloudflare (HIT) — файл владельца без группы serpstatbot', staraya, 'serpstatbot'],
  ['B. без параметра из кэша Cloudflare (HIT) — «User-Agent: AhrefsBot / Allow: /» и Sitemap (все строки — из нашего файла)', 'User-Agent: AhrefsBot\nAllow: /\n\nSitemap: https://www.7thserpent.com/sitemap-index.xml', 'AhrefsBot'],
];
for (const [imya, bez, bot] of sluchai) {
  const r = await progon(nashRobots, { bez, cf: true });
  p(`== ${imya} ==`);
  p(`check-live: ${r.itog}; ПЛОХО: ${r.plokho.join(', ') || '—'}`);
  const c = r.proverki.find((x) => x.imya === BEZ_P);
  p(`   ${c.ok ? 'ok   ' : 'ПЛОХО'} ${c.imya}: ${c.fakt} — ${c.otkuda}`);
  for (const s of r.spravki.filter((x) => x.includes('без параметра'))) p(`   справка: ${s}`);
  p(`   robots.cc ${bot} / — файл владельца: ${robotsCc(nashRobots, [bot], '/', { shirokiy: true }).zakryto ? 'закрыт' : 'открыт'}; что видят роботы (${BEZ}): ${robotsCc(bez, [bot], '/', { shirokiy: true }).zakryto ? 'закрыт' : 'открыт'}`);
  p('');
}
p('Итог: при кэше на пути проверка 4 зелёная и справка «вреда нет», а роботы видят открытым бота, закрытого владельцем;');
p('красный прогона — только «запросы не идут через Cloudflare».');
vyvod('CL25-P-6-vyvod.txt', out);
