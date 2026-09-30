// CL25-Z-3: новая подсказка проверки «robots.txt: вне нашего файла — только блок хостера» (cbe35eb) формулирует правило
// шире, чем проверка: «вне него — только управляемые блоки без запретов поисковикам». Проверка пропускает только блок
// хостера (adm.tools); управляемый блок с другим именем без единого запрета поисковикам — ПЛОХО, и подсказка при этом
// называет правило, которому такой блок удовлетворяет.
import { progon, zapisat, nashRobots, PUTI_SBORKI, CL } from './obshchee.mjs';

const CHUZHOY = '# BEGIN Yoast Managed content\nUser-agent: GPTBot\nDisallow: /\n# END Yoast Managed content\n';
const VARIANTY = [
  ['Y1 чужой управляемый блок (запрет только GPTBot) после файла владельца', { mimo: nashRobots + '\n' + CHUZHOY }],
  ['Y2 тот же блок перед файлом владельца', { mimo: CHUZHOY + '\n' + nashRobots }],
];
const out = [];
for (const [imya, v] of VARIANTY) {
  const r = await progon(v);
  const vne = r.proverki.find((c) => c.imya === 'robots.txt: вне нашего файла — только блок хостера');
  const rb = CL.razobratRobots(v.mimo, nashRobots, PUTI_SBORKI);
  out.push(`== ${imya} ==`, `итог ${r.okCount}/${r.vsego}; ПЛОХО: ${r.plokho.join(' | ') || '—'}`);
  out.push(`  имя проверки: «${vne.imya}»`, `  ${vne.ok ? 'ok' : 'ПЛОХО'} — ${vne.otkuda}`);
  out.push(`  блоки: ${JSON.stringify(rb.bloki)}; ограничения поисковикам: ${JSON.stringify(rb.ogranicheniya)}; вне сборки: ${JSON.stringify(rb.zapretyVneSborki)}`);
  out.push(`  закрыто поисковикам: ${JSON.stringify(CL.zakrytoPoiskovikam(v.mimo, PUTI_SBORKI))}`);
  const pravilo = /вне него — только управляемые блоки без запретов поисковикам/.test(vne.otkuda);
  out.push(`  подсказка называет правило «только управляемые блоки без запретов поисковикам»: ${pravilo}; блок управляемый и без запретов поисковикам: ${rb.bloki.length === 1 && rb.ogranicheniya.length === 0}`, '');
}
zapisat('CL25-Z-3-vyvod.txt', out);
