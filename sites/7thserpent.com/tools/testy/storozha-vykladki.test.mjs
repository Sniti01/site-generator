// Пробы сторожей выкладки `tools/storozha-vykladki.mjs` (П106, шаг 5) — на образцах вывода lftp (`cls -1 -a -F`,
// `find .`), скачанного index.html и ответов домена, без сети и без сервера FTP; сборка — своя папка во временном
// каталоге. Последний блок — договор самого workflow `.github/workflows/deploy-7thserpent.yml` (разбор YAML):
// триггеры, предохранители, TZ, корпус, пароль, команды сторожей — те, что есть у сторожа, циклов оболочки нет.
// «Судью судят», раунд 1 (SV1-O — «опасный проход», SV1-Z — «законные формы»): находки — пробами с их id.
//   npm run proverki (сборка копии не нужна)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { parse } from 'yaml';
import * as SV from '../storozha-vykladki.mjs';
import { SAYT } from './obshchee.mjs';

const { sekrety, domen, papka, indeks, spisokSborki, sverkaDist, pereschet, razobratSpisok, razobratFind, KANON } = SV;
const REPO = join(SAYT, '../..');
const STOROZH = join(SAYT, 'tools/storozha-vykladki.mjs');
const nash = (url = '/') => `<!doctype html><html><head><title>x</title><link rel="canonical" href="https://www.7thserpent.com${url}"></head><body></body></html>`;
const pervogo = `<!doctype html><html><head><link rel="canonical" href="https://www.ac4bf-thewatch.com/"></head></html>`;
const zaglushkaHostera = '<html><head><title>Сайт створено</title></head><body><h1>Сайт успішно створено</h1></body></html>';

/* ---------- секреты ---------- */

const SEKRETY = { SERPENT_FTP_HOST: 'ax572417.ftp.tools', SERPENT_FTP_PORT: '21', SERPENT_FTP_USER: 'ax572417_serpent', SERPENT_FTP_PASSWORD: 'p4ss-SECRET', SERPENT_CORPUS_KEY: '-----BEGIN OPENSSH PRIVATE KEY-----\nKEYBODY\n-----END OPENSSH PRIVATE KEY-----', AC4BF_FTP_USER: 'ax572417_claude' };
const bezZnacheniy = (r) => {
  const vse = r.stroki.join('\n');
  for (const v of Object.values(SEKRETY)) for (const kus of v.split('\n')) if (kus.length > 2) assert.ok(!vse.includes(kus), `значение секрета в выводе: ${kus}`);
};

test('секреты: все шесть, пользователи разные — проход', () => {
  const r = sekrety(SEKRETY);
  assert.equal(r.ok, true, r.stroki.join(' | '));
  bezZnacheniy(r);
});

for (const [imya, izm, kusok] of [
  ['нет пароля', { SERPENT_FTP_PASSWORD: '' }, 'SERPENT_FTP_PASSWORD'],
  ['пароль из пробелов', { SERPENT_FTP_PASSWORD: '   ' }, 'SERPENT_FTP_PASSWORD'],
  ['нет хоста', { SERPENT_FTP_HOST: undefined }, 'SERPENT_FTP_HOST'],
  ['SV1-Z-4 нет ключа корпуса', { SERPENT_CORPUS_KEY: '' }, 'SERPENT_CORPUS_KEY'],
  ['порт не число', { SERPENT_FTP_PORT: 'ftp' }, 'SERPENT_FTP_PORT'],
  ['SV1-O-6 логин с кавычкой', { SERPENT_FTP_USER: 'ax572417_"x' }, 'SERPENT_FTP_USER'],
  ['SV1-O-6 хост с пробелом', { SERPENT_FTP_HOST: 'ax572417.ftp.tools; ls' }, 'SERPENT_FTP_HOST'],
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

test('SV1-O-6 пароль с кавычкой и точкой с запятой — проход: пароль в команду lftp не идёт (LFTP_PASSWORD)', () => {
  const r = sekrety({ ...SEKRETY, SERPENT_FTP_PASSWORD: 'Kq7"mZ;v9Tr2' });
  assert.equal(r.ok, true, r.stroki.join(' | '));
});

/* ---------- первая выкладка и домен ---------- */

test('SV1-O-2 первая выкладка: вход on или на сервере нет нашего index.html', () => {
  const { pervayaVykladka } = SV;
  assert.equal(typeof pervayaVykladka, 'function', 'нет функции pervayaVykladka');
  assert.equal(pervayaVykladka('on', nash('/')).pervaya, true);
  assert.equal(pervayaVykladka('off', null).pervaya, true);
  assert.equal(pervayaVykladka('off', zaglushkaHostera).pervaya, true);
  assert.equal(pervayaVykladka('', nash('/')).pervaya, false);
  assert.equal(pervayaVykladka('off', nash('/')).pervaya, false);
});

const otv = (status, telo = '', location = '') => ({ status, telo, location });
const oshibka = (kod) => ({ oshibka: kod });
const iz = (karta) => async (url) => {
  if (!(url in karta)) throw new Error(`запрос вне образца: ${url}`);
  return karta[url];
};
const NOT_CONFIGURED = (h = '7thserpent.com') => `<html><body><h1>Website ${h} not configured</h1><p>Domain address record points to our server, but this site is not served</p></body></html>`;
const W = 'https://www.7thserpent.com/';
const G = 'https://7thserpent.com/';

const DOMEN = [
  // [имя, ответы, первая выкладка, ждём ok, кусок строки]
  ['имя не разрешается (оба хоста)', { [W]: oshibka('ENOTFOUND'), [G]: oshibka('ENOTFOUND') }, true, true, 'не привязан'],
  ['заглушка «not configured» через https → http', { [W]: otv(302, '', 'http://www.7thserpent.com/'), 'http://www.7thserpent.com/': otv(404, NOT_CONFIGURED('www.7thserpent.com')), [G]: otv(302, '', 'http://7thserpent.com/'), 'http://7thserpent.com/': otv(404, NOT_CONFIGURED()) }, true, true, '«not configured»'],
  ['SV1-O-3 404 без заглушки «not configured» — отвечает, первая — стоп', { [W]: otv(404, '<html><title>404 Not Found</title></html>'), [G]: oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['SV1-O-3 404 первого сайта — отвечает, первая — стоп', { [W]: otv(404, pervogo), [G]: oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['SV1-O-3 «not configured» чужого домена — отвечает, первая — стоп', { [W]: otv(404, NOT_CONFIGURED('example.com')), [G]: oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['наша сборка отвечает, первая выкладка — стоп', { [W]: otv(200, nash('/')), [G]: otv(301, '', W) }, true, false, 'СТОП'],
  ['наша сборка отвечает, не первая — проход со строкой', { [W]: otv(200, nash('/')), [G]: otv(301, '', W) }, false, true, 'обновит живой сайт'],
  ['наша 404 (canonical нашего сайта) — привязан, первая — стоп', { [W]: otv(404, nash('/404/')), [G]: oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['голый хост отвечает парковкой, www не разрешается — первая — стоп', { [W]: oshibka('ENOTFOUND'), [G]: otv(200, '<html>parked</html>') }, true, false, 'СТОП'],
  ['403 пустого каталога — первая — стоп', { [W]: otv(403, 'Forbidden'), [G]: oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['ошибка сертификата — не понять, первая — стоп', { [W]: oshibka('ERR_TLS_CERT_ALTNAME_INVALID'), [G]: oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['SV1-Z-2 таймаут — стоп со словами «не удалось узнать» и «повтори»', { [W]: oshibka('TimeoutError'), [G]: oshibka('ENOTFOUND') }, true, false, 'не удалось узнать'],
  ['SV1-Z-2 EAI_AGAIN — стоп со словами «не удалось узнать»', { [W]: oshibka('EAI_AGAIN'), [G]: oshibka('ENOTFOUND') }, true, false, 'не удалось узнать'],
  ['ENOTFOUND после редиректа — домен ответил редиректом, первая — стоп', { [W]: otv(301, '', 'https://parked.example/'), 'https://parked.example/': oshibka('ENOTFOUND'), [G]: oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['петля редиректов — первая — стоп', { [W]: otv(301, '', W), [G]: oshibka('ENOTFOUND') }, true, false, 'больше 5 редиректов'],
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
  ['папка домена с www/', './\n../\nwww/\nlogs/\n', null, false, 'папка www'],
  ['папка домена с WWW/ заглавными', './\n../\nWWW/\n', null, false, 'папка www'],
  ['корень первого сайта', './\n../\n.htaccess\n404/\n_astro/\nguides/\nindex.html\nrobots.txt\nsitemap-index.xml\n', pervogo, false, 'ac4bf-thewatch.com'],
  ['index.html в списке, содержимого нет', './\n../\nindex.html\n', null, false, 'содержимого сторож не получил'],
  ['SV1-O-1 A1 корень первого сайта без index.html', './\n../\n.htaccess\n404/\n_astro/\nguides/\nrobots.txt\nsitemap-index.xml\nsitemap-0.xml\n', null, false, 'без нашей сборки'],
  ['SV1-O-1 A2 робот в папке _astro первого сайта', 'BaseLayout.Ab12cd.css\nhero.Xy_1.webp\npublic-sans.woff2\n', null, false, 'без нашей сборки'],
  ['SV1-O-1 A3 сайт на PHP', './\n../\nindex.php\nwp-admin/\nwp-content/\n', null, false, 'index.php'],
  ['SV1-O-1 A4 Index.html первого сайта', './\n../\nIndex.html\n_astro/\n', null, false, 'Index.html'],
  ['SV1-O-1 A5 INDEX.HTML', './\n../\nINDEX.HTML\n', null, false, 'INDEX.HTML'],
  ['SV1-O-1 A6 index.htm', './\n../\nindex.htm\n', null, false, 'index.htm'],
  ['SV1-O-4 A8 папки доменов без отметки типа', './\n../\n7dtd.com.pl\nac4bf-thewatch.com\n7thserpent.com\n', null, false, 'без нашей сборки'],
  ['SV1-O-4 A9 папки доменов кириллицей (IDN)', './\n../\nзмій.укр/\nсерпент.укр/\n', null, false, 'папки с именами доменов'],
  ['SV1-O-4 A10 www без косой', './\n../\nwww\n', null, false, 'www'],
  ['SV1-Z-3 ссылка на файл robots.txt@ — своя строка, не «папки доменов»', './\n../\nrobots.txt@\n', null, false, 'ссылка'],
  ['пустой корень', './\n../\n', null, true, 'пустой'],
  ['пустой корень с CRLF', './\r\n../\r\n', null, true, 'пустой'],
  ['пустой вывод lftp (MLSD без ./ ../)', '', null, true, 'пустой'],
  ['заглушка хостера (index.html без canonical)', './\n../\nindex.html\n', zaglushkaHostera, true, 'заглушка'],
  ['свежий каталог хостера: .well-known/ и cgi-bin/', './\n../\n.well-known/\ncgi-bin/\n', null, true, 'служебные'],
  ['прежняя наша выкладка', './\n../\n.htaccess\n404/\n_astro/\nindex.html\nprivacy/\nrobots.txt\n', nash('/'), true, 'наша сборка'],
  ['прежняя наша выкладка и .well-known/ сертификата', './\n../\n.htaccess\n.well-known/\n404/\n_astro/\nindex.html\n', nash('/'), true, 'наша сборка'],
];
for (const [imya, spisok, index, zhdem, kusok] of PAPKA) {
  test(`папка робота: ${imya}`, () => {
    const r = papka(spisok, index);
    assert.equal(r.ok, zhdem, r.stroki.join(' | '));
    assert.ok(r.stroki.join(' ').includes(kusok), r.stroki.join(' | '));
  });
}

test('папка робота: отказ не печатает имён доменов аккаунта', () => {
  const r = papka('./\n../\n7dtd.com.pl/\nac4bf-thewatch.com/\n', null);
  assert.ok(!r.stroki.join(' ').includes('7dtd.com.pl'), r.stroki.join(' | '));
});

const INDEKS = [
  ['index.html нет', null, true, 'нет'],
  ['наш', nash('/'), true, 'наш'],
  ['наш, атрибуты в другом порядке и одинарные кавычки', `<link href='${KANON}' rel='canonical'>`, true, 'наш'],
  ['первого сайта', pervogo, false, 'не наш'],
  ['заглушка хостера без canonical', zaglushkaHostera, false, 'заглушка хостера'],
  ['canonical http без www', '<link rel="canonical" href="http://7thserpent.com/">', false, 'не наш'],
  ['canonical страницы, не главной', nash('/privacy/'), false, 'не наш'],
  ['два canonical', nash('/') + '<link rel="canonical" href="https://www.ac4bf-thewatch.com/">', false, 'не наш'],
  ['SV1-Z-6 пустой файл — «пуст или оборван»', '', false, 'пуст или оборван'],
  ['SV1-Z-6 оборванный файл без <html — «пуст или оборван»', '<!doctype ht', false, 'пуст или оборван'],
];
for (const [imya, html, zhdem, kusok] of INDEKS) {
  test(`index.html до mirror: ${imya}`, () => {
    const r = indeks(html);
    assert.equal(r.ok, zhdem, r.stroki.join(' | '));
    assert.ok(r.stroki.join(' ').includes(kusok), r.stroki.join(' | '));
  });
}

test('разбор списка: ./ и ../ отброшены, CRLF и пробелы по краям — как LF', () => {
  assert.deepEqual(razobratSpisok('./\r\n../\r\n _astro/ \r\nindex.html\r\n'), ['_astro/', 'index.html']);
  assert.deepEqual(razobratFind('./\n./index.html\n./_astro/\n./_astro/a.css\r\n'), ['index.html', '_astro/a.css']);
});

/* ---------- сборка: список, сверка, пересчёт ---------- */

const CID_YADRA = 'm3tnyskv';
const CID_SAYTA = 'abcd1234';
function sborka() {
  const d = mkdtempSync(join(tmpdir(), 'storozha-vykladki-'));
  const html = (url) => nash(url).replace('<body>', `<body><div data-astro-cid-${CID_YADRA}><p data-astro-cid-${CID_SAYTA}>x</p></div><link rel="stylesheet" href="/_astro/index.Cz6femgl.css">`);
  for (const [f, t] of [['index.html', html('/')], ['.htaccess', 'ErrorDocument 404 /404/index.html\n'], ['robots.txt', 'User-agent: *\n'], ['404/index.html', html('/404/')], ['privacy/index.html', html('/privacy/')], ['sitemap-index.xml', '<x/>'], ['sitemap-0.xml', '<y/>'], ['_astro/index.Cz6femgl.css', `.a[data-astro-cid-${CID_YADRA}]{color:red}.b[data-astro-cid-${CID_SAYTA}]{}`], ['_astro/a.webp', 'RIFF']]) {
    mkdirSync(join(d, f, '..'), { recursive: true });
    writeFileSync(join(d, f), t);
  }
  return d;
}
/** Сборка «на раннере»: другое значение cid ядра и другой хеш в имени CSS — как у сборки CI (SV1-Z-1). */
function kakNaRannere(d) {
  const zamenit = (f, iz, na) => writeFileSync(join(d, f), readFileSync(join(d, f), 'utf8').split(iz).join(na));
  for (const f of ['index.html', '404/index.html', 'privacy/index.html', '_astro/index.Cz6femgl.css']) zamenit(f, CID_YADRA, '545q7pxz');
  renameSync(join(d, '_astro/index.Cz6femgl.css'), join(d, '_astro/index.Q1w2E3r4.css'));
  for (const f of ['index.html', '404/index.html', 'privacy/index.html']) zamenit(f, 'index.Cz6femgl.css', 'index.Q1w2E3r4.css');
}

test('сверка сборки CI с принятой: равна — проход; байт, лишний, недостающий — отказ', () => {
  const d = sborka();
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    assert.equal(prin.fajlov, 9);
    assert.equal(sverkaDist(d, prin).ok, true);
    writeFileSync(join(d, '_astro/a.webp'), 'RIFX');
    const inye = sverkaDist(d, prin);
    assert.equal(inye.ok, false);
    assert.ok(inye.stroki[0].includes('иные байты 1: _astro/a.webp'), inye.stroki[0]);
    writeFileSync(join(d, '_astro/a.webp'), 'RIFF');
    writeFileSync(join(d, 'lishniy.html'), 'x');
    assert.ok(sverkaDist(d, prin).stroki[0].includes('лишние 1: lishniy.html'));
    rmSync(join(d, 'lishniy.html'));
    rmSync(join(d, 'robots.txt'));
    assert.ok(sverkaDist(d, prin).stroki[0].includes('нет 1: robots.txt'));
    assert.throws(() => sverkaDist(d, { sborka: 'x' }), /norm/);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV1-Z-1 сборка CI отличается только значениями cid ядра и хешем имени CSS — проход, названо', () => {
  const d = sborka();
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    kakNaRannere(d);
    const r = sverkaDist(d, prin);
    assert.equal(r.ok, true, r.stroki.join(' | '));
    assert.ok(r.stroki.join(' ').includes('data-astro-cid'), r.stroki.join(' | '));
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV1-Z-1 сборка CI с иным текстом страницы — отказ, в выводе — список сборки CI', () => {
  const d = sborka();
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    kakNaRannere(d);
    writeFileSync(join(d, 'privacy/index.html'), readFileSync(join(d, 'privacy/index.html'), 'utf8').replace('>x<', '>y<'));
    const r = sverkaDist(d, prin);
    assert.equal(r.ok, false);
    assert.ok(r.stroki[0].includes('иные байты 1: privacy/index.html'), r.stroki[0]);
    assert.ok(r.stroki.some((s) => s.includes('"norm"')), 'список сборки CI не напечатан');
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV1-Z-1 перестановка cid между элементами — отказ (нормализация по порядку появления)', () => {
  const d = sborka();
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    const f = join(d, 'index.html');
    writeFileSync(f, readFileSync(f, 'utf8').replace(`<div data-astro-cid-${CID_YADRA}><p data-astro-cid-${CID_SAYTA}>`, `<div data-astro-cid-${CID_SAYTA}><p data-astro-cid-${CID_YADRA}>`));
    assert.equal(sverkaDist(d, prin).ok, false);
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
    const bez = pereschet(findIz(d).replace('./_astro/a.webp\n', ''), d);
    assert.ok(!bez.ok && bez.stroki[0].includes('нет на сервере: _astro/a.webp'), bez.stroki[0]);
    const sluzhebnye = pereschet(findIz(d) + './_astro/.nfs000000000284a1c200000017\n./.in.index.html.\n', d);
    assert.ok(!sluzhebnye.ok && sluzhebnye.stroki.join(' ').includes('служебные файлы сервера'), sluzhebnye.stroki.join(' | '));
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

test('команда: папка и index.html — коды 0 и 1; домен пишет признак первой выкладки в GITHUB_OUTPUT', () => {
  const d = mkdtempSync(join(tmpdir(), 'storozha-vykladki-'));
  try {
    writeFileSync(join(d, 'root.txt'), './\n../\nwww/\n');
    writeFileSync(join(d, 'index.html'), pervogo);
    assert.equal(spawnSync(process.execPath, [STOROZH, 'papka', join(d, 'root.txt')]).status, 1);
    assert.equal(spawnSync(process.execPath, [STOROZH, 'indeks', join(d, 'index.html')]).status, 1);
    assert.equal(spawnSync(process.execPath, [STOROZH, 'indeks', join(d, 'net.html')]).status, 0);
    writeFileSync(join(d, 'root.txt'), './\n../\n');
    assert.equal(spawnSync(process.execPath, [STOROZH, 'papka', join(d, 'root.txt'), join(d, 'net.html')]).status, 0);
    // Признак первой выкладки без сети: команда `pervaya` пишет pervaya=on|off в файл GITHUB_OUTPUT.
    writeFileSync(join(d, 'out.txt'), '');
    const r = spawnSync(process.execPath, [STOROZH, 'pervaya', join(d, 'net.html')], { encoding: 'utf8', env: { ...process.env, SERPENT_FIRST: 'off', GITHUB_OUTPUT: join(d, 'out.txt') } });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(d, 'out.txt'), 'utf8'), 'pervaya=on\n');
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

/* ---------- договор workflow ---------- */

const WF_TEKST = readFileSync(join(REPO, '.github/workflows/deploy-7thserpent.yml'), 'utf8');
const WF = parse(WF_TEKST);
const job = WF.jobs.deploy;
const shagi = job.steps;
const shag = (kusok) => shagi.find((s) => (s.name ?? s.uses ?? '').includes(kusok));
const i = (kusok) => shagi.indexOf(shag(kusok));

test('workflow: триггеры — push в main по путям сайта, ядра, корневых манифестов и своего файла; ручной запуск со входом SERPENT_FIRST', () => {
  assert.deepEqual(WF.on.push.branches, ['main']);
  assert.deepEqual(WF.on.push.paths, ['sites/7thserpent.com/**', 'core/**', 'package.json', 'package-lock.json', '.github/workflows/deploy-7thserpent.yml']);
  assert.deepEqual(WF.on.workflow_dispatch.inputs.SERPENT_FIRST.options, ['off', 'on']);
  assert.equal(WF.on.workflow_dispatch.inputs.SERPENT_FIRST.default, 'off');
});

test('workflow: push выкладывает только при SERPENT_DEPLOY=on, живой — при SERPENT_LIVE=on', () => {
  assert.equal(job.if, "github.event_name == 'workflow_dispatch' || vars.SERPENT_DEPLOY == 'on'");
  assert.equal(shag('Проверка живого сайта').if, "vars.SERPENT_LIVE == 'on'");
  assert.equal(shag('Проверка живого сайта').run, 'npm run live:check -w $SITE');
});

test('SV1-O-2 workflow: первая выкладка — по входу или по серверу; домен и сверка сборки — после сторожа папки, перед выкладкой', () => {
  const p = shag('Первая выкладка?');
  assert.equal(p.id, 'pervaya');
  assert.equal(p.env.SERPENT_FIRST, "${{ inputs.SERPENT_FIRST || 'off' }}");
  assert.match(p.run, /storozha-vykladki\.mjs pervaya remote-top\/index\.html/);
  assert.equal(shag('Домен уже привязан').env.SERPENT_PERVAYA, '${{ steps.pervaya.outputs.pervaya }}');
  assert.equal(shag('сборка CI равна принятой').if, "steps.pervaya.outputs.pervaya == 'on'");
  const vykladka = i('Выкладка по FTPS');
  assert.ok(i('Сторож папки робота') < i('Первая выкладка?') && i('Первая выкладка?') < i('Домен уже привязан') && i('Домен уже привязан') < vykladka);
  assert.ok(i('сборка CI равна принятой') > i('Первая выкладка?') && i('сборка CI равна принятой') < vykladka);
});

test('workflow: TZ Europe/Warsaw, FTPS принудительно, сертификат проверяется, запись через временный файл', () => {
  assert.equal(job.env.TZ, 'Europe/Warsaw');
  assert.equal(job.env.SITE, 'sites/7thserpent.com');
  for (const s of ['set ftp:ssl-force true;', 'set ftp:ssl-protect-data true;', 'set ssl:verify-certificate yes;', 'set cmd:fail-exit yes;', 'set xfer:use-temp-file yes;']) assert.ok(job.env.LFTP_SET.includes(s), s);
});

test('SV1-O-6 workflow: пароль — только через LFTP_PASSWORD и open --env-password, в команде lftp его нет', () => {
  assert.doesNotMatch(WF_TEKST, /\$SERPENT_FTP_PASSWORD/);
  for (const s of shagi.filter((x) => /lftp -e/.test(x.run ?? ''))) {
    assert.equal(s.env.LFTP_PASSWORD, '${{ secrets.SERPENT_FTP_PASSWORD }}', s.name);
    for (const stroka of s.run.split('\n').filter((x) => x.includes('lftp -e'))) assert.match(stroka, /open --env-password -u /, s.name);
  }
});

test('SV1-Z-4 workflow: сторож секретов (с ключом корпуса) — до выгрузки корпуса; корпус — ключом в input/corpus/raw, без сохранения ключа', () => {
  const k = shag('Корпус');
  assert.match(k.uses, /^actions\/checkout@/);
  assert.equal(k.with['ssh-key'], '${{ secrets.SERPENT_CORPUS_KEY }}');
  assert.equal(k.with.path, 'sites/7thserpent.com/input/corpus/raw');
  assert.equal(k.with['persist-credentials'], false);
  assert.ok(i('Секреты на месте') < shagi.indexOf(k));
  assert.ok(shagi.indexOf(k) < i('Сборка с гейтами'));
  assert.deepEqual(Object.keys(shag('Секреты на месте').env).sort(), ['AC4BF_FTP_USER', 'SERPENT_CORPUS_KEY', 'SERPENT_FTP_HOST', 'SERPENT_FTP_PASSWORD', 'SERPENT_FTP_PORT', 'SERPENT_FTP_USER']);
});

test('workflow: порядок — секреты, сборка, сторож папки, домен — до выкладки; пересчёт — после', () => {
  const vykladka = i('Выкладка по FTPS');
  for (const k of ['Секреты на месте', 'Сборка с гейтами', 'Сторож папки робота', 'Домен уже привязан']) assert.ok(i(k) >= 0 && i(k) < vykladka, k);
  assert.ok(i('Пересчёт на сервере') > vykladka);
  assert.match(shag('Выкладка по FTPS').run, /mirror --reverse --delete --verbose --parallel=4 \$SITE\/dist\/ \./);
});

test('workflow: команды сторожей — те, что знает сторож; циклов оболочки нет', () => {
  const run = shagi.map((s) => s.run ?? '').join('\n');
  const komandy = [...run.matchAll(/storozha-vykladki\.mjs (\S+)/g)].map((m) => m[1]);
  assert.deepEqual(komandy.sort(), ['domen', 'indeks', 'papka', 'pereschet', 'pervaya', 'sekrety', 'sverka-dist'].sort());
  assert.doesNotMatch(run, /(^|[\s;])(for|while|until)\s/m);
});
