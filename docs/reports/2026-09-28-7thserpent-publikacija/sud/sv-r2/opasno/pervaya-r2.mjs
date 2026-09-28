// SV2 «опасный проход» — признак первой выкладки (pervayaVykladka, команда pervaya, GITHUB_OUTPUT, SERPENT_PERVAYA,
// условие шага сверки) и domen в режиме «не первая». Без сети: domen — импортом с подставными ответами.
import { pervayaVykladka, domen, papka, indeks, KLYUCHEVYE } from './storozh.mjs';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ZDES = fileURLToPath(new URL('.', import.meta.url));
const NASH = '<!doctype html><html><head><title>7th Serpent</title><link rel="canonical" href="https://www.7thserpent.com/"></head><body></body></html>';
const stroki = [];

/* G1: шаг «Первая выкладка?» зелёный, а GITHUB_OUTPUT не записан. */
const D = join(ZDES, 'vkhod-pervaya');
rmSync(D, { recursive: true, force: true });
mkdirSync(D, { recursive: true });
const env = { ...process.env, SERPENT_FIRST: 'off' };
delete env.GITHUB_OUTPUT;
const r = spawnSync(process.execPath, [join(ZDES, 'storozh.mjs'), 'pervaya', join(D, 'net-index.html')], { encoding: 'utf8', env });
stroki.push(`G1 команда pervaya без GITHUB_OUTPUT: код ${r.status}, вывод «${r.stdout.trim()}», файл выхода: ${existsSync(join(D, 'out.txt')) ? 'есть' : 'не записан'}`);
// Модель выражений workflow при пустом выходе шага (steps.pervaya.outputs.pervaya → ''):
const vykhod = '';
const sverkaIdet = vykhod === 'on'; // if: steps.pervaya.outputs.pervaya == 'on'
const pervyiDomen = vykhod !== 'off'; // domen: process.env.SERPENT_PERVAYA !== 'off'
const dG1 = await domen({ poluchit: async () => ({ oshibka: 'ENOTFOUND' }), pervyi: pervyiDomen });
stroki.push(`G1 при пустом выходе: domen считает первой (pervyi=${pervyiDomen}) — ${dG1.ok ? 'проход' : 'отказ'}; шаг сверки сборки: ${sverkaIdet ? 'идёт' : 'ПРОПУЩЕН'} — два шага толкуют один пустой признак противоположно`);

/* G2: оборванная первая выкладка. mirror кладёт файлы корня раньше подкаталогов (не измерено без lftp) — на сервере
   наш index.html, но нет 404/, privacy/, _astro/ целиком. Следующий запуск с входом по умолчанию. */
const oborvannaya = './\n../\n.htaccess\n_astro/\napple-touch-icon.png\nfavicon-16x16.png\nfavicon-32x32.png\nfavicon.ico\nfavicon.svg\nicon-192.png\nindex.html\nrobots.txt\nsitemap-0.xml\nsitemap-index.xml\n';
const nafind = ['.htaccess', '_astro/index.Cz6femgl.css', 'apple-touch-icon.png', 'favicon.ico', 'favicon.svg', 'index.html', 'robots.txt', 'sitemap-0.xml', 'sitemap-index.xml'];
const p2 = papka(oborvannaya, NASH);
const i2 = indeks(NASH);
const pv2 = pervayaVykladka('off', NASH);
stroki.push(`G2 оборванная первая выкладка: papka ${p2.ok ? 'проход' : 'отказ'}, indeks ${i2.ok ? 'проход' : 'отказ'}, pervaya=${pv2.pervaya ? 'on' : 'off'} (${pv2.pochemu}) → сверка сборки ПРОПУЩЕНА; ключевых файлов на сервере нет: ${KLYUCHEVYE.filter((k) => !nafind.includes(k)).join(', ')}`);

/* D5: «не первая» — domen пропускает любой ответ домена, не только наш сайт. */
const OTVETY = [
  ['домен отвечает 403 хостера (каталог привязан, Cloudflare держит в кэше ответ до выкладки)', { status: 403, telo: 'Forbidden', location: '' }],
  ['домен отвечает парковкой регистратора', { status: 200, telo: '<html><title>This domain is parked</title></html>', location: '' }],
  ['домен отвечает заглушкой хостера «Сайт успішно створено»', { status: 200, telo: '<html>Сайт успішно створено</html>', location: '' }],
  ['домен отвечает нашим сайтом (законное обновление)', { status: 200, telo: NASH, location: '' }],
];
for (const [chto, otvet] of OTVETY) {
  const d = await domen({ poluchit: async (url) => (url.startsWith('https://7thserpent.com') ? { status: 301, telo: '', location: 'https://www.7thserpent.com/' } : otvet), pervyi: pv2.pervaya });
  stroki.push(`D5 не первая (наш index.html на сервере), ${chto}: domen ${d.ok ? 'проход' : 'отказ'} | ${d.stroki[d.stroki.length - 1]}`);
}

/* G3: pervaya при входе не 'on' и не 'off' (ввод через API; choice GitHub проверяет — довод, не прогон). */
stroki.push(`G3 вход «ON» и наш index.html: pervaya=${pervayaVykladka('ON', NASH).pervaya ? 'on' : 'off'}; вход «ON» и пустой каталог: pervaya=${pervayaVykladka('ON', null).pervaya ? 'on' : 'off'} (ослабляет только в сторону «не первая», если index.html наш)`);

rmSync(D, { recursive: true, force: true });
const vyvod = stroki.join('\n') + '\n';
writeFileSync(join(ZDES, 'pervaya-r2.txt'), vyvod);
process.stdout.write(vyvod);
