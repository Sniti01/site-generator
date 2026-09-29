// SV23-O-6: повторный запуск (Re-run) запуска первой выкладки. GitHub повторяет запуск с теми же входами и тем же
// коммитом (документация «Re-running workflows and jobs»; здесь не измерено), то есть SERPENT_FIRST=on и
// SERPENT_DOMAIN_BOUND=on снова. Образец: сайт уже живой и новее первой выкладки (страница max-payne-2 и ассет
// _astro/b.css пришли позже, карта sitemap-0.xml живой выкладки их знает), повтор несёт сборку коммита первой
// выкладки. Сторожа по порядку workflow: papka, indeks, glubina, pervaya, domen — без входа и со входом; sverka-dist
// сверяет сборку коммита с его же списком (проходит по построению: сборка от даты не зависит, дата подписи —
// из содержания, content.config.ts:120–143). Затем mirror --delete стёр бы то, чего нет в сборке первой выкладки.
import { readFileSync } from 'node:fs';
import { SV, WF_PUT, W, G, otv, iz, nash, vyvod } from './obshchee-o.mjs';

// Сборка первой выкладки: верх и файлы (верх — как в пробе, VERKH).
const VERKH = ['.htaccess', '404', '_astro', 'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon.ico', 'favicon.svg', 'icon-192.png', 'index.html', 'privacy', 'robots.txt', 'sitemap-0.xml', 'sitemap-index.xml', 'pc', 'max-payne-1'];
const FAJLY_PERVOJ = ['.htaccess', '404/index.html', '_astro/a.css', 'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon.ico', 'favicon.svg', 'icon-192.png', 'index.html', 'privacy/index.html', 'robots.txt', 'sitemap-0.xml', 'sitemap-index.xml', 'pc/index.html', 'max-payne-1/index.html'];
// Живая выкладка — новее: плюс страница и ассет.
const FAJLY_ZHIVYE = [...FAJLY_PERVOJ, 'max-payne-2/index.html', '_astro/b.css'].sort();
const kornevye = [...new Set(FAJLY_ZHIVYE.map((f) => (f.includes('/') ? `${f.split('/')[0]}/` : f)))].sort();
const CLS = ['./', '../', ...kornevye].join('\n');
const FIND = ['./', ...[...new Set(FAJLY_ZHIVYE.filter((f) => f.includes('/')).map((f) => `./${f.split('/')[0]}/`))], ...FAJLY_ZHIVYE.map((f) => `./${f}`)].join('\n');
const KARTA = `<?xml version="1.0" encoding="UTF-8"?><urlset>${['/', '/pc/', '/max-payne-1/', '/max-payne-2/', '/privacy/'].map((p) => `<url><loc>https://www.7thserpent.com${p}</loc></url>`).join('')}</urlset>`;
const INDEX = nash('/');
const DOMEN_ZHIVOI = { [W]: otv(200, nash('/')), [G]: otv(301, '', W) };

const stroki = ['Повтор запуска первой выкладки на живом, более новом сайте (входы запуска: SERPENT_FIRST=on, SERPENT_DOMAIN_BOUND=on):'];
const p = SV.papka(CLS, INDEX, VERKH, KARTA);
stroki.push(`  papka: ${p.ok ? 'проход' : 'СТОП'} — ${p.stroki.join(' | ')}`);
const ind = SV.indeks(INDEX);
stroki.push(`  indeks: ${ind.ok ? 'проход' : 'СТОП'} — ${ind.stroki.join(' | ')}`);
const gl = SV.glubina(FIND, INDEX, FAJLY_PERVOJ, KARTA, '');
stroki.push(`  glubina: ${gl.ok ? 'проход' : 'СТОП'} — ${gl.stroki.join(' | ')}`);
const pv = SV.pervayaVykladka('on', INDEX, FIND);
stroki.push(`  pervaya: ${pv.pervaya ? 'on' : 'off'} — ${pv.pochemu}`);
const bez = await SV.domen({ poluchit: iz(DOMEN_ZHIVOI), pervyi: pv.pervaya });
const so = await SV.domen({ poluchit: iz(DOMEN_ZHIVOI), pervyi: pv.pervaya, soglasen: true });
stroki.push(`  domen без входа (прежде, до сессии 23 — так же): ${bez.ok ? 'проход' : 'СТОП'} — ${bez.stroki.at(-1)}`);
stroki.push(`  domen со входом on (повтор несёт вход): ${so.ok ? 'ПРОХОД' : 'стоп'} — ${so.stroki.at(-1)}`);
const sotryot = FAJLY_ZHIVYE.filter((f) => !FAJLY_PERVOJ.includes(f));
stroki.push(`  mirror --delete сборки первой выкладки стёр бы: ${sotryot.join(', ')} — откат живого сайта к сборке первой выкладки`);
stroki.push('');
const wf = readFileSync(WF_PUT, 'utf8');
stroki.push(`workflow: «run_attempt» в файле — ${wf.includes('run_attempt') ? 'есть' : 'нет'}; вход шагу домена — ${/SERPENT_DOMAIN_BOUND: (\$\{\{.*)/.exec(wf)?.[1] ?? '?'}`);
stroki.push('Итог: из сторожей эту цепочку прежде останавливал только сторож домена (первая по входу, домен отвечает); вход, повторённый');
stroki.push('повтором, её пропускает. Класс «повтор старого запуска = откат» у обычных ручных и push-запусков был и до сессии 23 (не первая —');
stroki.push('сторож домена пропускает, сверки нет) — вне предмета суда; вход прибавляет к нему запуск первой выкладки.');
vyvod('o6-vyvod.txt', stroki);
