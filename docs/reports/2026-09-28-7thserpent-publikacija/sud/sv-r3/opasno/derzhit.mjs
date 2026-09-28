// Что из правки раунда 2 держит класс — образцы, которые скептик пробовал и которые сторож отбил (или которые
// замаскированы следующим сторожем). Сети нет: domen зовётся только с неверным признаком (выход до запроса) и
// с подставным poluchit.
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SV, VERKH, NASH, KOREN_NASH, PRIN, REPO, SAYT, ZDES, STOROZH_PUT, vyvod, sborka, ubrat } from './obshchee.mjs';

const { papka, indeks, pervayaVykladka, domen, sverkaDist, spisokSborki, sekrety, KLYUCHEVYE } = SV;
const stroki = [];
const v = (ok) => (ok ? 'проход' : 'отказ');

// 1. Папка: корень первого сайта (настоящий верх его dist) с копией нашей главной — чужие имена видны.
const ac = join(REPO, 'sites/ac4bf-thewatch.com/dist');
const acKoren = ['./', '../', ...readdirSync(ac).map((n) => (statSync(join(ac, n)).isDirectory() ? `${n}/` : n))].join('\n');
stroki.push(`P-1 корень ac4bf (верх его dist, ${readdirSync(ac).length} записей) + наша главная: papka ${v(papka(acKoren, NASH, VERKH).ok)} | ${papka(acKoren, NASH, VERKH).stroki[0].slice(0, 110)}`);
// 2. Имена только из верха сборки, но главной нет / главная хостера / главная первого сайта.
const tolkoVerkh = './\n../\n.htaccess\n404/\n_astro/\nprivacy/\nrobots.txt\nsitemap-0.xml\nsitemap-index.xml\n';
const pervogo = '<!doctype html><html><head><link rel="canonical" href="https://www.ac4bf-thewatch.com/"></head></html>';
const zagl = '<html><head><title>Сайт створено</title></head><body><h1>Сайт успішно створено</h1></body></html>';
stroki.push(`P-2 имена из верха сборки без index.html: papka ${v(papka(tolkoVerkh, null, VERKH).ok)}; с заглушкой хостера: papka ${v(papka(tolkoVerkh + 'index.html\n', zagl, VERKH).ok)}; с главной ac4bf: papka ${v(papka(tolkoVerkh + 'index.html\n', pervogo, VERKH).ok)}`);
// 3. Формы имён: index.html папкой, другой регистр, .IN., имя домена, www, ссылка на нашу папку.
for (const [chto, zap] of [['index.html/ папкой', 'index.html/'], ['Privacy/ (регистр)', 'Privacy/'], ['.IN.x.', '.IN.x.'], ['7dtd.com.pl/', '7dtd.com.pl/'], ['Www', 'Www'], ['_astro@ (ссылка)', '_astro@'], ['google0123.html', 'google0123.html']]) {
  stroki.push(`P-3 наша выкладка + ${chto}: papka ${v(papka(KOREN_NASH() + zap + '\n', NASH, VERKH).ok)}`);
}
// 4. «Не первая» с ключевыми файлами чужой фабричной сборки: pervaya скажет «нет», но папка до неё отказывает.
const acFind = ['./', ...KLYUCHEVYE.map((f) => `./${f}`), './guides/', './guides/index.html'].join('\n');
stroki.push(`P-4 корень ac4bf + наша главная: pervaya → первая: ${pervayaVykladka('off', NASH, acFind).pervaya ? 'да' : 'нет'}; но papka (раньше, bash -e) → ${v(papka(acKoren, NASH, VERKH).ok)} — замаскировано`);
// 5. Команды: pervaya на GitHub без GITHUB_OUTPUT, domen без признака — код 2 до сети.
const { GITHUB_OUTPUT, SERPENT_PERVAYA, ...env } = process.env;
const r1 = spawnSync(process.execPath, [STOROZH_PUT, 'pervaya'], { encoding: 'utf8', env: { ...env, GITHUB_ACTIONS: 'true', SERPENT_FIRST: 'off' } });
const r2 = ['', 'ON', 'on ', 'true'].map((z) => spawnSync(process.execPath, [STOROZH_PUT, 'domen'], { encoding: 'utf8', env: { ...env, SERPENT_PERVAYA: z } }).status);
stroki.push(`P-5 pervaya при GITHUB_ACTIONS=true без GITHUB_OUTPUT: код ${r1.status}; domen при SERPENT_PERVAYA '', 'ON', 'on ', 'true': коды ${r2.join(', ')}`);
// 6. Workflow: сверка при пустом признаке идёт; признак — только из шага.
const wf = readFileSync(join(REPO, '.github/workflows/deploy-7thserpent.yml'), 'utf8');
stroki.push(`P-6 workflow: сверка — if: steps.pervaya.outputs.pervaya != 'off': ${wf.includes("if: steps.pervaya.outputs.pervaya != 'off'") ? 'да (пустой — сверка идёт)' : 'нет'}; SERPENT_PERVAYA из выхода шага: ${wf.includes('SERPENT_PERVAYA: ${{ steps.pervaya.outputs.pervaya }}') ? 'да' : 'нет'}`);
// 7. Сверка сборки: метки нормализации в сырой сборке, CSS разных имён переставлены, локальная dist = принятая.
const baza = {
  'index.html': '<link rel="stylesheet" href="/_astro/A.AAAAAAAA.css"><p data-astro-cid-aaaa1111>x</p>',
  'pc/index.html': '<link rel="stylesheet" href="/_astro/B.BBBBBBBB.css"><p data-astro-cid-bbbb2222>y</p>',
  '_astro/A.AAAAAAAA.css': 'p[data-astro-cid-aaaa1111]{color:red}',
  '_astro/B.BBBBBBBB.css': 'p[data-astro-cid-bbbb2222]{color:red}',
};
const a = sborka('d-prin', baza);
const prin = { sborka: 'obrazec', ...spisokSborki(a) };
const normImya = Object.keys(prin.norm).find((k) => k.startsWith('_astro/A.#'));
const obrazcy = [
  ['CSS разных имён (A/B, одно содержимое) — ссылки переставлены', { 'index.html': baza['index.html'].replace('A.AAAAAAAA', 'B.BBBBBBBB'), 'pc/index.html': baza['pc/index.html'].replace('B.BBBBBBBB', 'A.AAAAAAAA') }],
  ['в сырой HTML буквально нормализованное имя /_astro/A.#….css', { 'index.html': baza['index.html'].replace('_astro/A.AAAAAAAA.css', normImya) }],
  ['в сырой HTML метка data-astro-cid-#1', { 'index.html': baza['index.html'].replace('data-astro-cid-aaaa1111', 'data-astro-cid-#1') }],
  ['ссылка на CSS без файла', { 'pc/index.html': baza['pc/index.html'].replace('B.BBBBBBBB', 'B.CCCCCCCC') }],
];
for (const [chto, izm] of obrazcy) {
  const b = sborka('d-ci', { ...baza, ...izm });
  stroki.push(`P-7 сверка: ${chto}: ${v(sverkaDist(b, prin).ok)}`);
  ubrat(b);
}
ubrat(a);
const lok = sverkaDist(join(SAYT, 'dist'), PRIN);
stroki.push(`P-7 сверка: локальная dist сайта против принятого списка ${PRIN.sborka}: ${v(lok.ok)} | ${lok.stroki[0].slice(0, 90)}`);
// 8. «not configured» — прочие ответы при первой выкладке — стоп.
const W = 'https://www.7thserpent.com/';
const G = 'https://7thserpent.com/';
const STUB = (h) => `<html><body><h1>Website ${h} not configured</h1></body></html>`;
const formy = [
  ['заглушка в HTML-комментарии нашей 404', { [W]: { status: 404, telo: `<!-- ${'Website 7thserpent.com not configured'} --><link rel="canonical" href="https://www.7thserpent.com/404/">` }, [G]: { oshibka: 'ENOTFOUND' } }],
  ['заглушка со статусом 200', { [W]: { status: 200, telo: STUB('www.7thserpent.com') }, [G]: { oshibka: 'ENOTFOUND' } }],
  ['заглушка на хосте с портом', { [W]: { status: 301, location: 'https://www.7thserpent.com:8443/', telo: '' }, 'https://www.7thserpent.com:8443/': { status: 404, telo: STUB('www.7thserpent.com') }, [G]: { oshibka: 'ENOTFOUND' } }],
  ['заглушка «7thserpent.com.example.net»', { [W]: { status: 404, telo: STUB('7thserpent.com.example.net') }, [G]: { oshibka: 'ENOTFOUND' } }],
  ['редирект на чужой хост с заглушкой нашего имени', { [W]: { status: 302, location: 'https://parking.example/', telo: '' }, 'https://parking.example/': { status: 404, telo: STUB('www.7thserpent.com') }, [G]: { oshibka: 'ENOTFOUND' } }],
];
for (const [chto, karta] of formy) {
  const r = await domen({ poluchit: async (u) => karta[u] ?? { oshibka: 'ENOTFOUND' }, pervyi: true });
  stroki.push(`P-8 domen, первая: ${chto}: ${v(r.ok)}`);
}
const skript = await domen({ poluchit: async (u) => (u === W ? { status: 404, telo: '<html><script>var m="Website 7thserpent.com not configured"</script><h1>Our site</h1></html>' } : { oshibka: 'ENOTFOUND' }), pervyi: true });
stroki.push(`P-8 справка: фраза в тексте <script> 404-страницы — ${v(skript.ok)} (теги сняты, текст скрипта остаётся; форма хостера не такая — не находка)`);
// 9. Секреты: строгие образцы.
const S = { SERPENT_FTP_HOST: 'ax572417.ftp.tools', SERPENT_FTP_PORT: '21', SERPENT_FTP_USER: 'ax572417_serpent', SERPENT_FTP_PASSWORD: 'p', SERPENT_CORPUS_KEY: 'k', AC4BF_FTP_USER: 'ax572417_claude' };
for (const [chto, izm] of [['логин \\t', { SERPENT_FTP_USER: 'ax572417_serpent\t' }], ['хост с косой', { SERPENT_FTP_HOST: 'ax572417.ftp.tools/www' }], ['порт 021\\r', { SERPENT_FTP_PORT: '021\r' }], ['логин первого сайта с пробелом в AC4BF', { SERPENT_FTP_USER: 'ax572417_claude', AC4BF_FTP_USER: ' ax572417_claude\n' }]]) {
  stroki.push(`P-9 sekrety: ${chto}: ${v(sekrety({ ...S, ...izm }).ok)}`);
}
vyvod('derzhit', stroki);
