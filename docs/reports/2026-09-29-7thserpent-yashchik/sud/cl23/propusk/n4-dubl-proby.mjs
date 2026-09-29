// CL23-P: проба «CL2-P-9 (П108 — наоборот) … — образец с Cloudflare» (порча () => {}, { cf: true }, ждём [BEZ_CF])
// и тест «образец с Cloudflare (прежний здоровый …)» — один и тот же вход; первая проверяет подмножество второго.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { progon, zapisat, PAPKA } from './obshchee.mjs';

const proby = readFileSync(join(PAPKA, 'sites/7thserpent.com/tools/testy/check-live.test.mjs'), 'utf8').split('\n');
const stroki = proby.map((s, i) => [i + 1, s]).filter(([, s]) => s.includes("progon(() => {}, { cf: true })") || s.includes("'CL2-P-9 (П108"));
const r1 = await progon(() => {}, { cf: true });
const r2 = await progon(() => {}, { cf: true });
const vyvod = [
  'Строки проб с этим входом (номер: текст):',
  ...stroki.map(([n, s]) => `  ${n}: ${s.trim()}`),
  `Выходы двух прогонов одинаковы: ${JSON.stringify({ p: r1.proverki, s: r1.spravki }) === JSON.stringify({ p: r2.proverki, s: r2.spravki })}`,
  `ПЛОХО: ${r1.plokho.join(' ; ')}`,
];
zapisat('n4-vyvod.txt', vyvod.join('\n'));
