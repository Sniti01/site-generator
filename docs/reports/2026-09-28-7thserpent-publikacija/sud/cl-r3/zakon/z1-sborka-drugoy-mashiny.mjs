// CL3-Z-1: шаг 9 листа владельца — «я запущу npm run live:check» на этой машине (D:\SEO\cloud\site-generator),
// а живой сайт выложен workflow из сборки раннера (/home/runner/work/…). Тот же коммит, те же исходники; сборки
// разнятся ровно тем, что сторож sverka-dist нормализует (SV1-Z-1): cid компонентов ядра и хеши имён CSS.
// Инструмент сравнивает HTML побайтно — и говорит ПЛОХО на каждой странице.
import { server, vProcesse, progon, pechat, sborkaInstrumenta } from './stend.mjs';
import { vykladCi, zamenaCid, imenaCss, skolkoInyh } from './sborka-ci.mjs';
import { sPravkami } from './pravka.mjs';

console.log(`cid ядра, иные на раннере: ${zamenaCid.size} (${[...zamenaCid].map(([a, b]) => `${a}→${b}`).join(', ')})`);
console.log(`CSS с иным именем: ${[...imenaCss].map(([a, b]) => `${a}→${b}`).join(', ')}`);
const { vsego, inyh } = skolkoInyh();
console.log(`HTML сборки иные на раннере: ${inyh} из ${vsego}`);

const sborka = sborkaInstrumenta(); // dist/ этой машины (+ строка ящика)

let zakr = vProcesse(server({ vyklad: vykladCi() }));
const r = await progon({ sborka });
await zakr();
pechat('Z1 живой сайт — сборка CI, dist/ — этой машины (тот же коммит)', r);

// Правка z1: сверка после нормализации cid и хешей имён CSS (как sverka-dist).
const P = await sPravkami(['z1']);
zakr = vProcesse(server({ vyklad: vykladCi() }));
const rp = await progon({ sborka, mod: P });
await zakr();
pechat('Z1 с правкой z1', rp);
console.log(`  справка: ${rp.spravki.find((s) => s.startsWith('HTML = сборка после нормализации')) ?? '—'}`);

// Правка не прячет вставку: сайт CI + Web Analytics на главной.
const wa = (rel, t) => (rel === 'index.html' ? t.replace('</body>', '<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token":"x"}\'></script></body>') : t);
zakr = vProcesse(server({ vyklad: vykladCi({ pravka: wa }) }));
const rw = await progon({ sborka, mod: P });
await zakr();
pechat('Z1 с правкой z1: сайт CI + вставка Web Analytics — ловится', rw);

// И не прячет чужой CSS с тем же «index»: другое имя до хеша — не маскируется.
const chuzhoy = (rel, t) => (rel === 'index.html' ? t.replace('</head>', '<link rel="stylesheet" href="/_astro/tracker.AbCdEf12.css"></head>') : t);
zakr = vProcesse(server({ vyklad: vykladCi({ pravka: chuzhoy }) }));
const rc = await progon({ sborka, mod: P });
await zakr();
pechat('Z1 с правкой z1: сайт CI + лишняя таблица стилей — ловится', rc);

const html = r.proverki.find((c) => c.imya === 'HTML страниц = сборка (dist)');
console.log(`ИТОГ: как есть ${r.schet} (ПЛОХО: ${r.plokho.map((c) => c.imya).join('; ')}; факт строки: «${html.otkuda.slice(0, 160)}…»); с правкой z1 ${rp.schet}; вставка WA с правкой — ${rw.schet} (${rw.plokho.map((c) => c.otkuda.slice(0, 40)).join('; ')}); лишний CSS с правкой — ${rc.schet}`);
