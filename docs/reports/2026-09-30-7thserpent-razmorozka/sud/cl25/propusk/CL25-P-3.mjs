// CL25-P-3: новая подсказка отказа «вне нашего файла» (cbe35eb) говорит правило, которого проверка не держит:
// «правила robots.txt задаёт наш файл (правила владельца, П113): вне него — только управляемые блоки без запретов
// поисковикам». (1) Чужой управляемый блок без единого запрета (Yoast, «User-agent: *» + «Allow: /») — ПЛОХО с этой
// подсказкой: он и есть «управляемый блок без запретов поисковикам» — подсказка спорит с отказом. (2) Блок хостера,
// который задаёт свои правила (закрывает GPTBot, CL25-P-1), — зелёный: «правила задаёт наш файл» проверка не держит.
import { progon, nashRobots, BLOK24, vyvod } from './stend.mjs';

const out = [];
const p = (...a) => out.push(a.join(' '));
const sluchai = [
  ['1. чужой управляемый блок без запретов (Yoast): User-agent: * / Allow: /', '# BEGIN Yoast Managed content\nUser-agent: *\nAllow: /\n# END Yoast Managed content\n\n' + nashRobots],
  ['2. блок хостера сессии 24 со своими правилами (закрывает GPTBot)', BLOK24 + nashRobots],
];
for (const [imya, telo] of sluchai) {
  const r = await progon(telo);
  p(`== ${imya} ==`);
  p(`check-live: ${r.itog}; ПЛОХО: ${r.plokho.join(', ') || '—'}`);
  for (const s of r.robotsStroki.filter((x) => x.includes('вне нашего файла'))) p(`   ${s}`);
  p('');
}
p('Итог: подсказка называет законным «управляемые блоки без запретов поисковикам» — а законен только блок хостера (adm.tools);');
p('и говорит «правила robots.txt задаёт наш файл» — а блок хостера со своими правилами проходит зелёным.');
vyvod('CL25-P-3-vyvod.txt', out);
