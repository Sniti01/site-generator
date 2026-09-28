// Пробы сторожей выкладки `tools/storozha-vykladki.mjs` (П106, шаг 5) — на образцах вывода lftp (`cls -1 -a -F`,
// `find .`), скачанного index.html и ответов домена, без сети и без сервера FTP; сборка — своя папка во временном
// каталоге. Последний блок — договор самого workflow `.github/workflows/deploy-7thserpent.yml` (разбор YAML):
// триггеры, предохранители, TZ, корпус, команды сторожей — те, что есть у сторожа, циклов оболочки нет.
//   npm run proverki (сборка копии не нужна)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { parse } from 'yaml';
import { sekrety, domen, papka, indeks, spisokSborki, sverkaDist, pereschet, razobratSpisok, razobratFind, KANON } from '../storozha-vykladki.mjs';
import { SAYT } from './obshchee.mjs';

const REPO = join(SAYT, '../..');
const STOROZH = join(SAYT, 'tools/storozha-vykladki.mjs');
const nash = (url = '/') => `<!doctype html><html><head><title>x</title><link rel="canonical" href="https://www.7thserpent.com${url}"></head><body></body></html>`;
const pervogo = `<!doctype html><html><head><link rel="canonical" href="https://www.ac4bf-thewatch.com/"></head></html>`;
const zaglushkaHostera = '<html><head><title>Сайт створено</title></head><body><h1>Сайт успішно створено</h1></body></html>';

/* ---------- секреты ---------- */

const SEKRETY = { SERPENT_FTP_HOST: 'ax572417.ftp.tools', SERPENT_FTP_PORT: '21', SERPENT_FTP_USER: 'ax572417_serpent', SERPENT_FTP_PASSWORD: 'p4ss-SECRET', AC4BF_FTP_USER: 'ax572417_claude' };
const bezZnacheniy = (r) => {
  const vse = r.stroki.join('\n');
  for (const v of Object.values(SEKRETY)) if (v.length > 2) assert.ok(!vse.includes(v), `значение секрета в выводе: ${v}`);
};

test('секреты: все пять, пользователи разные — проход', () => {
  const r = sekrety(SEKRETY);
  assert.equal(r.ok, true, r.stroki.join(' | '));
  bezZnacheniy(r);
});

for (const [imya, izm, kusok] of [
  ['нет пароля', { SERPENT_FTP_PASSWORD: '' }, 'SERPENT_FTP_PASSWORD'],
  ['пароль из пробелов', { SERPENT_FTP_PASSWORD: '   ' }, 'SERPENT_FTP_PASSWORD'],
  ['нет хоста', { SERPENT_FTP_HOST: undefined }, 'SERPENT_FTP_HOST'],
  ['порт не число', { SERPENT_FTP_PORT: 'ftp' }, 'SERPENT_FTP_PORT'],
  ['пользователь = пользователь первого сайта', { SERPENT_FTP_USER: 'ax572417_claude' }, 'совпадает с AC4BF_FTP_USER'],
  ['пользователь = первого сайта, другой регистр и пробел', { SERPENT_FTP_USER: ' AX572417_Claude ' }, 'совпадает с AC4BF_FTP_USER'],
  ['нет AC4BF_FTP_USER — не с чем сверить', { AC4BF_FTP_USER: '' }, 'нет AC4BF_FTP_USER'],
]) {
  test(`секреты: ${imya} — отказ`, () => {
    const r = sekrety({ ...SEKRETY, ...izm });
    assert.equal(r.ok, false);
    assert.ok(r.stroki.join(' ').includes(kusok), r.stroki.join(' | '));
    bezZnacheniy(r);
  });
}

/* ---------- домен ---------- */

const otv = (status, telo = '', location = '') => ({ status, telo, location });
const oshibka = (kod) => ({ oshibka: kod });
const iz = (karta) => async (url) => {
  if (!(url in karta)) throw new Error(`запрос вне образца: ${url}`);
  return karta[url];
};
const NOT_CONFIGURED = '<html><body><h1>Website 7thserpent.com not configured</h1><p>Domain address record points to our server, but this site is not served</p></body></html>';

const DOMEN = [
  // [имя, ответы, первая выкладка, ждём ok, кусок строки]
  ['имя не разрешается (оба хоста)', { 'https://www.7thserpent.com/': oshibka('ENOTFOUND'), 'https://7thserpent.com/': oshibka('ENOTFOUND') }, true, true, 'не привязан'],
  ['заглушка «not configured» через https → http', { 'https://www.7thserpent.com/': otv(302, '', 'http://www.7thserpent.com/'), 'http://www.7thserpent.com/': otv(404, NOT_CONFIGURED), 'https://7thserpent.com/': otv(302, '', 'http://7thserpent.com/'), 'http://7thserpent.com/': otv(404, NOT_CONFIGURED) }, true, true, '«not configured»'],
  ['404 хостера без нашей страницы', { 'https://www.7thserpent.com/': otv(404, '<html><title>404 Not Found</title></html>'), 'https://7thserpent.com/': oshibka('ENOTFOUND') }, true, true, '404 не нашей сборки'],
  ['наша сборка отвечает, первая выкладка — стоп', { 'https://www.7thserpent.com/': otv(200, nash('/')), 'https://7thserpent.com/': otv(301, '', 'https://www.7thserpent.com/') }, true, false, 'СТОП'],
  ['наша сборка отвечает, не первая — проход со строкой', { 'https://www.7thserpent.com/': otv(200, nash('/')), 'https://7thserpent.com/': otv(301, '', 'https://www.7thserpent.com/') }, false, true, 'обновит живой сайт'],
  ['наша 404 (canonical нашего сайта) — привязан, первая — стоп', { 'https://www.7thserpent.com/': otv(404, nash('/404/')), 'https://7thserpent.com/': oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['голый хост отвечает парковкой, www не разрешается — первая — стоп', { 'https://www.7thserpent.com/': oshibka('ENOTFOUND'), 'https://7thserpent.com/': otv(200, '<html>parked</html>') }, true, false, 'СТОП'],
  ['403 пустого каталога — первая — стоп', { 'https://www.7thserpent.com/': otv(403, 'Forbidden'), 'https://7thserpent.com/': oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['ошибка сертификата — не понять, первая — стоп', { 'https://www.7thserpent.com/': oshibka('ERR_TLS_CERT_ALTNAME_INVALID'), 'https://7thserpent.com/': oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['таймаут — не понять, первая — стоп', { 'https://www.7thserpent.com/': oshibka('TimeoutError'), 'https://7thserpent.com/': oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['временная ошибка DNS (EAI_AGAIN) — первая — стоп', { 'https://www.7thserpent.com/': oshibka('EAI_AGAIN'), 'https://7thserpent.com/': oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['петля редиректов — первая — стоп', { 'https://www.7thserpent.com/': otv(301, '', 'https://www.7thserpent.com/'), 'https://7thserpent.com/': oshibka('ENOTFOUND') }, true, false, 'больше 5 редиректов'],
];
for (const [imya, karta, pervyi, zhdem, kusok] of DOMEN) {
  test(`домен: ${imya}`, async () => {
    const r = await domen({ poluchit: iz(karta), pervyi });
    assert.equal(r.ok, zhdem, r.stroki.join(' | '));
    assert.ok(r.stroki.join(' ').includes(kusok), r.stroki.join(' | '));
  });
}

/* ---------- папка робота и index.html ---------- */

const PAPKA = [
  // [имя, вывод cls -1 -a -F, index.html | null, ждём ok, кусок]
  ['корень аккаунта с папками доменов', './\n../\n7dtd.com.pl/\nac4bf-thewatch.com/\n7thserpent.com/\nlogs/\n', null, false, 'папки с именами доменов'],
  ['корень аккаунта — одна папка домена ссылкой', './\n../\nac4bf-thewatch.com@\n', null, false, 'папки с именами доменов'],
  ['папка домена с www/', './\n../\nwww/\nlogs/\n', null, false, 'папка www'],
  ['папка домена с WWW/ заглавными', './\n../\nWWW/\n', null, false, 'папка www'],
  ['корень первого сайта', './\n../\n.htaccess\n404/\n_astro/\nguides/\nindex.html\nrobots.txt\nsitemap-index.xml\n', pervogo, false, 'ac4bf-thewatch.com'],
  ['index.html в списке, содержимого нет', './\n../\nindex.html\n', null, false, 'содержимого сторож не получил'],
  ['пустой корень', './\n../\n', null, true, 'папок доменов и www нет'],
  ['пустой корень с CRLF', './\r\n../\r\n', null, true, 'папок доменов и www нет'],
  ['заглушка хостера (index.html без canonical)', './\n../\nindex.html\n', zaglushkaHostera, true, 'папок доменов и www нет'],
  ['прежняя наша выкладка', './\n../\n.htaccess\n404/\n_astro/\nindex.html\nprivacy/\nrobots.txt\n', nash('/'), true, 'папок доменов и www нет'],
];
for (const [imya, spisok, index, zhdem, kusok] of PAPKA) {
  test(`папка робота: ${imya}`, () => {
    const r = papka(spisok, index);
    assert.equal(r.ok, zhdem, r.stroki.join(' | '));
    assert.ok(r.stroki.join(' ').includes(kusok), r.stroki.join(' | '));
  });
}

const INDEKS = [
  ['index.html нет', null, true],
  ['наш', nash('/'), true],
  ['наш, атрибуты в другом порядке и одинарные кавычки', `<link href='${KANON}' rel='canonical'>`, true],
  ['первого сайта', pervogo, false],
  ['заглушка хостера без canonical', zaglushkaHostera, false],
  ['canonical http без www', '<link rel="canonical" href="http://7thserpent.com/">', false],
  ['canonical страницы, не главной', nash('/privacy/'), false],
  ['два canonical', nash('/') + '<link rel="canonical" href="https://www.ac4bf-thewatch.com/">', false],
];
for (const [imya, html, zhdem] of INDEKS) {
  test(`index.html до mirror: ${imya}`, () => {
    const r = indeks(html);
    assert.equal(r.ok, zhdem, r.stroki.join(' | '));
  });
}

test('разбор списка: ./ и ../ отброшены, CRLF и пробелы по краям — как LF', () => {
  assert.deepEqual(razobratSpisok('./\r\n../\r\n _astro/ \r\nindex.html\r\n'), ['_astro/', 'index.html']);
  assert.deepEqual(razobratFind('./\n./index.html\n./_astro/\n./_astro/a.css\r\n'), ['index.html', '_astro/a.css']);
});

/* ---------- сборка: список, сверка, пересчёт ---------- */

function sborka() {
  const d = mkdtempSync(join(tmpdir(), 'storozha-vykladki-'));
  for (const [f, t] of [['index.html', nash('/')], ['.htaccess', 'ErrorDocument 404 /404/index.html\n'], ['robots.txt', 'User-agent: *\n'], ['404/index.html', nash('/404/')], ['privacy/index.html', nash('/privacy/')], ['sitemap-index.xml', '<x/>'], ['sitemap-0.xml', '<y/>'], ['_astro/a.css', 'a{}']]) {
    mkdirSync(join(d, f, '..'), { recursive: true });
    writeFileSync(join(d, f), t);
  }
  return d;
}

test('сверка сборки CI с принятой: равна — проход; байт, лишний, недостающий — отказ', () => {
  const d = sborka();
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    assert.equal(prin.fajlov, 8);
    assert.equal(sverkaDist(d, prin).ok, true);
    writeFileSync(join(d, '_astro/a.css'), 'a{ }');
    const inye = sverkaDist(d, prin);
    assert.equal(inye.ok, false);
    assert.ok(inye.stroki[0].includes('иные байты 1: _astro/a.css'), inye.stroki[0]);
    writeFileSync(join(d, '_astro/a.css'), 'a{}');
    writeFileSync(join(d, 'lishniy.html'), 'x');
    assert.ok(sverkaDist(d, prin).stroki[0].includes('лишние 1: lishniy.html'));
    rmSync(join(d, 'lishniy.html'));
    rmSync(join(d, 'robots.txt'));
    assert.ok(sverkaDist(d, prin).stroki[0].includes('нет 1: robots.txt'));
    assert.throws(() => sverkaDist(d, { sborka: 'x' }), /fajly/);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

const findIz = (d) => ['./', ...Object.keys(spisokSborki(d).fajly).map((f) => './' + f), './_astro/', './404/', './privacy/'].join('\n') + '\n';

test('пересчёт на сервере: ровно dist — проход; лишний, недостающий, без ключевого — отказ', () => {
  const d = sborka();
  try {
    assert.equal(pereschet(findIz(d), d).ok, true);
    assert.equal(pereschet(findIz(d).replace(/\n/g, '\r\n'), d).ok, true);
    const lishniy = pereschet(findIz(d) + './stary.html\n', d);
    assert.equal(lishniy.ok, false);
    assert.ok(lishniy.stroki[0].includes('лишние: stary.html'), lishniy.stroki[0]);
    const bez = pereschet(findIz(d).replace('./_astro/a.css\n', ''), d);
    assert.ok(!bez.ok && bez.stroki[0].includes('нет на сервере: _astro/a.css'), bez.stroki[0]);
    rmSync(join(d, '.htaccess'));
    const klyuch = pereschet(findIz(d), d);
    assert.ok(!klyuch.ok && klyuch.stroki[0].includes('ключевых нет: .htaccess'), klyuch.stroki[0]);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

/* ---------- команда ---------- */

test('команда: неверные аргументы и нечитаемый вход — код 2', () => {
  for (const argi of [[], ['bez-takoy'], ['papka'], ['papka', 'net-takogo-fajla.txt'], ['sverka-dist', 'net', 'net'], ['pereschet', 'net']]) {
    const r = spawnSync(process.execPath, [STOROZH, ...argi], { encoding: 'utf8' });
    assert.equal(r.status, 2, `${argi.join(' ') || '(пусто)'}: ${r.stdout}${r.stderr}`);
  }
});

test('команда: папка и index.html — коды 0 и 1', () => {
  const d = mkdtempSync(join(tmpdir(), 'storozha-vykladki-'));
  try {
    writeFileSync(join(d, 'root.txt'), './\n../\nwww/\n');
    writeFileSync(join(d, 'index.html'), pervogo);
    assert.equal(spawnSync(process.execPath, [STOROZH, 'papka', join(d, 'root.txt')]).status, 1);
    assert.equal(spawnSync(process.execPath, [STOROZH, 'indeks', join(d, 'index.html')]).status, 1);
    assert.equal(spawnSync(process.execPath, [STOROZH, 'indeks', join(d, 'net.html')]).status, 0);
    writeFileSync(join(d, 'root.txt'), './\n../\n');
    assert.equal(spawnSync(process.execPath, [STOROZH, 'papka', join(d, 'root.txt'), join(d, 'net.html')]).status, 0);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

/* ---------- договор workflow ---------- */

const WF = parse(readFileSync(join(REPO, '.github/workflows/deploy-7thserpent.yml'), 'utf8'));
const job = WF.jobs.deploy;
const shagi = job.steps;
const shag = (kusok) => shagi.find((s) => (s.name ?? s.uses ?? '').includes(kusok));

test('workflow: триггеры — push в main по путям сайта, ядра, корневых манифестов и своего файла; ручной запуск со входом SERPENT_FIRST', () => {
  assert.deepEqual(WF.on.push.branches, ['main']);
  assert.deepEqual(WF.on.push.paths, ['sites/7thserpent.com/**', 'core/**', 'package.json', 'package-lock.json', '.github/workflows/deploy-7thserpent.yml']);
  assert.deepEqual(WF.on.workflow_dispatch.inputs.SERPENT_FIRST.options, ['off', 'on']);
  assert.equal(WF.on.workflow_dispatch.inputs.SERPENT_FIRST.default, 'off');
});

test('workflow: push выкладывает только при SERPENT_DEPLOY=on, живой — при SERPENT_LIVE=on, первая — сверка сборки', () => {
  assert.equal(job.if, "github.event_name == 'workflow_dispatch' || vars.SERPENT_DEPLOY == 'on'");
  assert.equal(shag('Проверка живого сайта').if, "vars.SERPENT_LIVE == 'on'");
  assert.equal(shag('Проверка живого сайта').run, 'npm run live:check -w $SITE');
  assert.equal(shag('сборка CI равна принятой').if, "inputs.SERPENT_FIRST == 'on'");
  assert.equal(shag('Домен уже привязан').env.SERPENT_FIRST, "${{ inputs.SERPENT_FIRST || 'off' }}");
});

test('workflow: TZ Europe/Warsaw, FTPS принудительно, сертификат проверяется', () => {
  assert.equal(job.env.TZ, 'Europe/Warsaw');
  assert.equal(job.env.SITE, 'sites/7thserpent.com');
  for (const s of ['set ftp:ssl-force true;', 'set ftp:ssl-protect-data true;', 'set ssl:verify-certificate yes;', 'set cmd:fail-exit yes;']) assert.ok(job.env.LFTP_SET.includes(s), s);
});

test('workflow: корпус — приватный репозиторий ключом SERPENT_CORPUS_KEY в input/corpus/raw, без сохранения ключа', () => {
  const k = shag('Корпус');
  assert.match(k.uses, /^actions\/checkout@/);
  assert.equal(k.with['ssh-key'], '${{ secrets.SERPENT_CORPUS_KEY }}');
  assert.equal(k.with.path, 'sites/7thserpent.com/input/corpus/raw');
  assert.equal(k.with['persist-credentials'], false);
  // Корпус приходит до сборки: сторож 8 слов без него отказывает громко.
  assert.ok(shagi.indexOf(k) < shagi.indexOf(shag('Сборка с гейтами')));
});

test('workflow: порядок — секреты, домен, сборка, сверка первой, сторож папки — до выкладки; пересчёт — после', () => {
  const i = (kusok) => shagi.indexOf(shag(kusok));
  const vykladka = i('Выкладка по FTPS');
  for (const k of ['Секреты на месте', 'Домен уже привязан', 'Сборка с гейтами', 'сборка CI равна принятой', 'Сторож папки робота']) assert.ok(i(k) >= 0 && i(k) < vykladka, k);
  assert.ok(i('Пересчёт на сервере') > vykladka);
  assert.match(shag('Выкладка по FTPS').run, /mirror --reverse --delete --verbose --parallel=4 \$SITE\/dist\/ \./);
});

test('workflow: команды сторожей — те, что знает сторож; циклов оболочки нет', () => {
  const run = shagi.map((s) => s.run ?? '').join('\n');
  const komandy = [...run.matchAll(/storozha-vykladki\.mjs (\S+)/g)].map((m) => m[1]);
  assert.deepEqual(komandy.sort(), ['domen', 'indeks', 'papka', 'pereschet', 'sekrety', 'sverka-dist'].sort());
  assert.doesNotMatch(run, /(^|[\s;])(for|while|until)\s/m);
  // Секреты сторожа — все пять, среди них AC4BF_FTP_USER для сверки.
  assert.deepEqual(Object.keys(shag('Секреты на месте').env).sort(), ['AC4BF_FTP_USER', 'SERPENT_FTP_HOST', 'SERPENT_FTP_PASSWORD', 'SERPENT_FTP_PORT', 'SERPENT_FTP_USER']);
});
