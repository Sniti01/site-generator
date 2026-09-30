// CL25-Z-5 (вне диффа шага 2 — логика razobratRobots не менялась): файл на сервере отличается от нашего только пробелами
// по краям строк (панель хостера дописала пробел или отступ) — «наш файл целиком» ПЛОХО, а подсказка печатает
// «первая расходящаяся строка: «undefined» (в ответе: «—»)»: сравнение строк идёт после trim, расхождения не находит (k = -1).
import { progon, zapisat, nashRobots, BLOK_ZHIVOY, PREZHNIY } from './obshchee.mjs';

const VARIANTY = [
  ['W1 файл владельца, пробел в конце каждой строки', { mimo: nashRobots.replace(/\n/g, ' \n') }],
  ['W2 файл владельца, пробел в конце одной строки (Allow: / )', { mimo: nashRobots.replace('Allow: /', 'Allow: / ') }],
  ['W3 файл владельца с отступом первой строки', { mimo: '  ' + nashRobots }],
  ['W4 блок хостера + файл владельца, табуляция в конце строки Sitemap', { mimo: BLOK_ZHIVOY + nashRobots + '\t' }],
  ['W5 контроль до П113: прежний файл, пробел в конце строки Allow, наш — прежний', { mimo: PREZHNIY.replace('Allow: /', 'Allow: / '), nash: PREZHNIY }],
];
const out = [];
for (const [imya, v] of VARIANTY) {
  const r = await progon(v);
  const c = r.proverki.find((x) => x.imya === 'robots.txt: наш файл целиком');
  out.push(`== ${imya} ==`, `итог ${r.okCount}/${r.vsego}; ПЛОХО: ${r.plokho.join(' | ') || '—'}`, `  наш файл целиком: ${c.ok ? 'ok' : 'ПЛОХО'} — ${c.otkuda}`, '');
}
zapisat('CL25-Z-5-vyvod.txt', out);
