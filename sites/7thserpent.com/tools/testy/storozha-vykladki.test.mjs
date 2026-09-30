// Пробы сторожей выкладки `tools/storozha-vykladki.mjs` (П106, шаг 5) — на образцах вывода lftp (`cls -1 -a -F`,
// `find .`), скачанного index.html и ответов домена, без сети и без сервера FTP; сборка — своя папка во временном
// каталоге. Последний блок — договор самого workflow `.github/workflows/deploy-7thserpent.yml` (разбор YAML):
// триггеры, предохранители, TZ, корпус, пароль, команды сторожей — те, что есть у сторожа, циклов оболочки нет.
// «Судью судят»: раунд 1 (SV1-O — «опасный проход», SV1-Z — «законные формы»), раунд 2 (SV2-O, SV2-Z) — пробами с их id.
// Сессия 23 (П108): вход SERPENT_DOMAIN_BOUND («домен привязан — согласен») у сторожа домена; «судью судят» — SV23-*.
// Сессия 25 (П113): файл подтверждения Google в корне — сторож папки сверяет скачанную копию, mirror его не трогает,
// пересчёт не считает; «судью судят» — SV25-*.
//   npm run proverki (сборка копии не нужна)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { parse } from 'yaml';
import * as SV from '../storozha-vykladki.mjs';
import { SAYT } from './obshchee.mjs';

const { sekrety, domen, papka, indeks, spisokSborki, sverkaDist, pereschet, razobratSpisok, razobratFind, KANON, KLYUCHEVYE } = SV;
const REPO = join(SAYT, '../..');
const STOROZH = join(SAYT, 'tools/storozha-vykladki.mjs');
const nash = (url = '/') => `<!doctype html><html><head><title>x</title><link rel="canonical" href="https://www.7thserpent.com${url}"></head><body></body></html>`;
const pervogo = `<!doctype html><html><head><link rel="canonical" href="https://www.ac4bf-thewatch.com/"></head></html>`;
const zaglushkaHostera = '<html><head><title>Сайт створено</title></head><body><h1>Сайт успішно створено</h1></body></html>';
/** Верх сборки (имена первого уровня dist) — для сторожа папки. */
const VERKH = ['.htaccess', '404', '_astro', 'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon.ico', 'favicon.svg', 'icon-192.png', 'index.html', 'privacy', 'robots.txt', 'sitemap-0.xml', 'sitemap-index.xml', 'pc', 'max-payne-1'];

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
  ['SV2-Z-7 логин с переводом строки в конце', { SERPENT_FTP_USER: 'ax572417_serpent\n' }, 'SERPENT_FTP_USER'],
  ['SV2-Z-7 порт с пробелом', { SERPENT_FTP_PORT: ' 21' }, 'SERPENT_FTP_PORT'],
  ['SV2-Z-7 хост со схемой ftp://', { SERPENT_FTP_HOST: 'ftp://ax572417.ftp.tools' }, 'SERPENT_FTP_HOST'],
  ['SV2-Z-7 хост строкой доступа user@host:21', { SERPENT_FTP_HOST: 'ax572417_serpent@ax572417.ftp.tools:21' }, 'SERPENT_FTP_HOST'],
  ['пользователь = пользователь первого сайта', { SERPENT_FTP_USER: 'ax572417_claude' }, 'совпадает с AC4BF_FTP_USER'],
  ['пользователь = первого сайта, другой регистр', { SERPENT_FTP_USER: 'AX572417_Claude' }, 'совпадает с AC4BF_FTP_USER'],
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

test('SV2-Z-7 логины вида ax572417_claude, с точкой, дефисом и @ — проход', () => {
  for (const u of ['ax572417_x', 'a.b-c', 'robot@7thserpent.com']) assert.equal(sekrety({ ...SEKRETY, SERPENT_FTP_USER: u }).ok, true, u);
});

/* ---------- первая выкладка и домен ---------- */

const findPolnyy = ['./', ...KLYUCHEVYE.map((f) => './' + f), './_astro/', './_astro/a.css'].join('\n');
test('SV1-O-2, SV2-O-3 первая выкладка: вход on, или нет нашего index.html, или на сервере нет всех ключевых файлов', () => {
  const { pervayaVykladka } = SV;
  assert.equal(typeof pervayaVykladka, 'function', 'нет функции pervayaVykladka');
  assert.equal(pervayaVykladka('on', nash('/'), findPolnyy).pervaya, true);
  assert.equal(pervayaVykladka('off', null, null).pervaya, true);
  assert.equal(pervayaVykladka('off', zaglushkaHostera, null).pervaya, true);
  assert.equal(pervayaVykladka('', nash('/'), findPolnyy).pervaya, false);
  assert.equal(pervayaVykladka('off', nash('/'), findPolnyy).pervaya, false);
  // SV2-O-3: наш index.html есть, а ключевых файлов нет — первая выкладка оборвалась после index.html.
  const bez404 = findPolnyy.replace('./404/index.html\n', '');
  const r = pervayaVykladka('off', nash('/'), bez404);
  assert.equal(r.pervaya, true);
  assert.match(r.pochemu, /404\/index\.html/);
  assert.equal(pervayaVykladka('off', nash('/'), null).pervaya, true);
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
  ['SV2-Z-6 заглушка: имя в <b>, &nbsp; и голое имя на запрос www — не привязан', { [W]: otv(404, '<h1>Website&nbsp;<b>7thserpent.com</b>&nbsp;not configured</h1>'), [G]: otv(404, 'Website <b>7thserpent.com</b> not configured') }, true, true, '«not configured»'],
  ['SV1-O-3 404 без заглушки «not configured» — отвечает, первая — стоп', { [W]: otv(404, '<html><title>404 Not Found</title></html>'), [G]: oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['SV1-O-3 404 первого сайта — отвечает, первая — стоп', { [W]: otv(404, pervogo), [G]: oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['SV1-O-3 «not configured» чужого домена — отвечает, первая — стоп', { [W]: otv(404, NOT_CONFIGURED('example.com')), [G]: oshibka('ENOTFOUND') }, true, false, 'СТОП'],
  ['наша сборка отвечает, первая выкладка — стоп', { [W]: otv(200, nash('/')), [G]: otv(301, '', W) }, true, false, 'СТОП'],
  ['наша сборка отвечает, не первая — проход со строкой', { [W]: otv(200, nash('/')), [G]: otv(301, '', W) }, false, true, 'обновит живой сайт'],
  ['SV2-Z-4 не первая, оба хоста — таймаут: проход, «не удалось узнать»', { [W]: oshibka('TimeoutError'), [G]: oshibka('TimeoutError') }, false, true, 'не удалось узнать'],
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

/* — сессия 23 (П108): вход SERPENT_DOMAIN_BOUND — владелец согласен, что домен привязан — */
// Заглушка хостера — по замеру домена 2026-09-29: 200, <title> «Поздравляем, сайт создан!», без canonical.
const ZAGLUSHKA_SOZDAN = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Поздравляем, сайт создан!</title></head><body><h1>Поздравляем, сайт создан!</h1></body></html>';
const S403 = '<html><head><title>403 Forbidden</title></head><body><h1>Forbidden</h1></body></html>';
// Согласие покрывает домен, который отвечает по обоим именам с этого хоста (SV23-O-1, O-2, Z-1): ошибка сети или
// сертификата, неразрешимое имя, чужой конечный хост, чужой canonical, петля, негодный Location — стоп и со входом.
const DOMEN_VKHOD = [
  // [имя, ответы, первая выкладка, согласие, ждём ok, куски строки, куски, которых быть не должно]
  ['заглушка хостера «Поздравляем, сайт создан!» на обоих хостах, первая, согласие — проход, ответ напечатан', { [W]: otv(200, ZAGLUSHKA_SOZDAN), [G]: otv(200, ZAGLUSHKA_SOZDAN) }, true, true, true, ['ОТВЕЧАЕТ', '«Поздравляем, сайт создан!»', 'SERPENT_DOMAIN_BOUND'], ['СТОП']],
  ['та же заглушка, первая, без согласия — стоп, как прежде, с именем входа и «Run workflow, не Re-run»', { [W]: otv(200, ZAGLUSHKA_SOZDAN), [G]: otv(200, ZAGLUSHKA_SOZDAN) }, true, false, false, ['СТОП', '«Поздравляем, сайт создан!»', 'SERPENT_DOMAIN_BOUND', 'Run workflow', 'не Re-run'], []],
  ['403 пустого каталога (заглушку удалили), первая, согласие — проход', { [W]: otv(403, S403), [G]: otv(403, S403) }, true, true, true, ['ОТВЕЧАЕТ', 'ответ 403', 'SERPENT_DOMAIN_BOUND'], []],
  ['наша сборка отвечает (повтор оборванной первой), первая, согласие — проход', { [W]: otv(200, nash('/')), [G]: otv(301, '', W) }, true, true, true, ['ОТВЕЧАЕТ', 'SERPENT_DOMAIN_BOUND'], []],
  ['домен не привязан, первая, согласие — проход, как без входа', { [W]: oshibka('ENOTFOUND'), [G]: oshibka('ENOTFOUND') }, true, true, true, ['домен не привязан'], []],
  ['не первая, согласие — как без входа: обновит живой сайт', { [W]: otv(200, nash('/')), [G]: otv(301, '', W) }, false, true, true, ['обновит живой сайт'], []],
  ['SV23-O-1, Z-1 ошибка сертификата, первая, согласие — стоп: сертификат в панели хостера', { [W]: oshibka('ERR_TLS_CERT_ALTNAME_INVALID'), [G]: oshibka('CERT_HAS_EXPIRED') }, true, true, false, ['СТОП', 'ошибка TLS или сертификата ERR_TLS_CERT_ALTNAME_INVALID', 'Let\'s Encrypt'], []],
  ['SV23-O-1, Z-1 ошибка сертификата, первая, без согласия — стоп, вход не предлагается', { [W]: oshibka('DEPTH_ZERO_SELF_SIGNED_CERT'), [G]: oshibka('DEPTH_ZERO_SELF_SIGNED_CERT') }, true, false, false, ['СТОП', 'ошибка TLS или сертификата', 'Let\'s Encrypt'], ['SERPENT_DOMAIN_BOUND']],
  ['SV23-O-1 таймаут на обоих хостах, первая, согласие — стоп: новый Run workflow (SV23-Z2-1)', { [W]: oshibka('TimeoutError'), [G]: oshibka('TimeoutError') }, true, true, false, ['СТОП', 'TimeoutError', 'Run workflow'], []],
  ['SV23-O-1 таймаут, первая, без согласия — стоп, вход не предлагается', { [W]: oshibka('TimeoutError'), [G]: oshibka('ENOTFOUND') }, true, false, false, ['не удалось узнать', 'повтори'], ['SERPENT_DOMAIN_BOUND']],
  ['SV23-O-2 www не разрешается, голое имя — заглушка, первая, согласие — стоп: имя не привязано', { [W]: oshibka('ENOTFOUND'), [G]: otv(200, ZAGLUSHKA_SOZDAN) }, true, true, false, ['СТОП', 'не привязано'], []],
  ['SV23-O-2 www ведёт на чужой хост, первая, согласие — стоп: не этот сайт', { [W]: otv(302, '', 'https://parked.example/'), 'https://parked.example/': otv(200, '<title>Parked</title>'), [G]: otv(200, ZAGLUSHKA_SOZDAN) }, true, true, false, ['СТОП', 'parked.example', 'не на этот сайт'], []],
  ['SV23-O-2 отвечает первый сайт (canonical ac4bf), первая, согласие — стоп: не этот сайт', { [W]: otv(200, pervogo), [G]: otv(200, pervogo) }, true, true, false, ['СТОП', 'canonical чужого сайта', 'не на этот сайт'], []],
  ['SV23-O-2 петля редиректов, первая, согласие — стоп', { [W]: otv(301, '', W), [G]: otv(200, ZAGLUSHKA_SOZDAN) }, true, true, false, ['СТОП', 'больше 5 редиректов'], []],
  ['SV23-Z-4 редирект на негодный Location, первая, согласие — стоп строкой, не код 2', { [W]: otv(301, '', 'http://'), [G]: otv(200, ZAGLUSHKA_SOZDAN) }, true, true, false, ['СТОП', 'негодный адрес «http://»'], []],
  ['SV23-Z-4 редирект на негодный Location, не первая — проход строкой, не код 2', { [W]: otv(301, '', 'https://www.7thserpent.com:99999/'), [G]: otv(301, '', W) }, false, false, true, ['негодный адрес', 'обновит живой сайт'], []],
];
for (const [imya, karta, pervyi, soglasen, zhdem, kuski, zapret] of DOMEN_VKHOD) {
  test(`домен, вход SERPENT_DOMAIN_BOUND: ${imya}`, async () => {
    const r = await domen({ poluchit: iz(karta), pervyi, soglasen });
    assert.equal(r.ok, zhdem, r.stroki.join(' | '));
    for (const kusok of kuski) assert.ok(r.stroki.join(' ').includes(kusok), `${kusok}: ${r.stroki.join(' | ')}`);
    for (const kusok of zapret) assert.ok(!r.stroki.join(' ').includes(kusok), `лишнее «${kusok}»: ${r.stroki.join(' | ')}`);
    // SV23-Z-2: обещания «покажет её сразу» нет ни в одном исходе.
    assert.doesNotMatch(r.stroki.join(' '), /покажет её сразу/, r.stroki.join(' | '));
  });
}

/** Знаки из кодов (в исходнике проб их нет сырыми): управляющие, разделители строк, двунаправленные, заполнители. */
const z = (...k) => String.fromCharCode(...k);
/** Чему не место в строке журнала GitHub: знаки выше и начала команд раннера. */
const ZHURNAL_ZLO = new RegExp(`[${z(0)}-${z(0x1f)}${z(0x7f)}-${z(0x9f)}${z(0x2028, 0x2029)}${z(0x202a)}-${z(0x202e)}${z(0x2066)}-${z(0x2069)}${z(0x3164, 0x2800)}]|##\\[|::`);

test('SV23-O-3, Z-5 строка ответа в публичный журнал: <title> вне комментариев, svg и скриптов, сущности раскрыты, без управляющих знаков и команд раннера, обрез с «…»', async () => {
  const s = (telo) => domen({ poluchit: iz({ [W]: otv(200, telo), [G]: otv(200, ZAGLUSHKA_SOZDAN) }), pervyi: false }).then((r) => r.stroki[0]);
  assert.match(await s('<title>&laquo;Сайт&raquo; &#1055;&#x41F; &amp; ok</title>'), /«Сайт» ПП & ok/);
  assert.match(await s('<!-- <title>ложный</title> --><svg><title>иконка</title></svg><script>"<title>x</title>"</script><title>настоящий</title>'), /«настоящий»/);
  assert.match(await s('<title>a < b</title>'), /«a < b»/);
  const dlinnyy = await s(`<title>${'я'.repeat(150)}</title>`);
  assert.match(dlinnyy, new RegExp(`«${'я'.repeat(100)}…»`));
  const zloy = await s(`<title>${z(0x1b)}[30;40mскрыто ##[warning]подмена ::set-output name=x::y ${z(0x202e)}обратно&#10;::error::вторая строка</title>`);
  assert.doesNotMatch(zloy, ZHURNAL_ZLO, JSON.stringify(zloy));
  assert.match(zloy, /скрыто/);
});

/* — раунд 2 (SV23-O2, SV23-Z2; последний раунд, П108) — */

test('SV23-O2-3, O2-1 редирект через чужой хост: ошибка сети или сертификата на чужом хосте — «не этот сайт», не «сертификат в панели»; возврат на наше имя через чужой хост — не свой', async () => {
  const tlsChuzhoy = await domen({ poluchit: iz({ [W]: otv(302, '', 'https://parked.example/'), [G]: otv(302, '', 'https://parked.example/'), 'https://parked.example/': oshibka('ERR_TLS_CERT_ALTNAME_INVALID') }), pervyi: true, soglasen: true });
  assert.equal(tlsChuzhoy.ok, false);
  assert.match(tlsChuzhoy.stroki.join(' '), /не на этот сайт/);
  assert.doesNotMatch(tlsChuzhoy.stroki.join(' '), /Let's Encrypt/);
  const cherez = await domen({ poluchit: iz({ [W]: otv(302, '', 'https://tracker.example/r'), 'https://tracker.example/r': otv(302, '', W + 'x'), [`${W}x`]: otv(200, ZAGLUSHKA_SOZDAN), [G]: otv(200, ZAGLUSHKA_SOZDAN) }), pervyi: true, soglasen: true });
  assert.equal(cherez.ok, false, cherez.stroki.join(' | '));
  assert.match(cherez.stroki.join(' '), /tracker\.example/);
});

test('SV23-O2-2 без входа вход предлагается, только когда он поможет: сертификат, неразрешимое имя, чужой хост, canonical первого сайта — стоп своей причиной', async () => {
  for (const [karta, prichina] of [
    [{ [W]: oshibka('ERR_TLS_CERT_ALTNAME_INVALID'), [G]: otv(200, ZAGLUSHKA_SOZDAN) }, /Let's Encrypt/],
    [{ [W]: oshibka('ENOTFOUND'), [G]: otv(200, ZAGLUSHKA_SOZDAN) }, /не привязано/],
    [{ [W]: otv(302, '', 'https://parked.example/'), 'https://parked.example/': otv(200, '<title>Parked</title>'), [G]: otv(302, '', 'https://parked.example/') }, /не на этот сайт/],
    [{ [W]: otv(200, pervogo), [G]: otv(200, pervogo) }, /не на этот сайт/],
  ]) {
    const r = await domen({ poluchit: iz(karta), pervyi: true });
    assert.equal(r.ok, false, r.stroki.join(' | '));
    assert.match(r.stroki.join(' '), prichina, r.stroki.join(' | '));
    assert.doesNotMatch(r.stroki.join(' '), /SERPENT_DOMAIN_BOUND/, r.stroki.join(' | '));
  }
  const pomozhet = await domen({ poluchit: iz({ [W]: otv(200, ZAGLUSHKA_SOZDAN), [G]: otv(200, ZAGLUSHKA_SOZDAN) }), pervyi: true });
  assert.match(pomozhet.stroki.join(' '), /SERPENT_DOMAIN_BOUND = on/);
});

test('SV23-Z2-1 со входом при сети или сертификате — «новый запуск кнопкой Run workflow с теми же входами (не Re-run)»', async () => {
  for (const karta of [{ [W]: oshibka('TimeoutError'), [G]: oshibka('TimeoutError') }, { [W]: oshibka('CERT_HAS_EXPIRED'), [G]: oshibka('CERT_HAS_EXPIRED') }]) {
    const r = await domen({ poluchit: iz(karta), pervyi: true, soglasen: true });
    assert.equal(r.ok, false);
    assert.match(r.stroki.join(' '), /новый запуск кнопкой Run workflow с теми же входами \(не Re-run/, r.stroki.join(' | '));
  }
});

test('SV23-O2-5 коды TLS и сертификата Node — «ошибка TLS или сертификата»', async () => {
  for (const kod of ['INVALID_PURPOSE', 'PATH_LENGTH_EXCEEDED', 'INVALID_CA', 'ERROR_IN_CERT_NOT_BEFORE_FIELD', 'CRL_HAS_EXPIRED', 'UNSPECIFIED', 'ERR_SSL_WRONG_VERSION_NUMBER', 'CERT_NOT_YET_VALID', 'SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'HOSTNAME_MISMATCH']) {
    const r = await domen({ poluchit: iz({ [W]: oshibka(kod), [G]: oshibka(kod) }), pervyi: true });
    assert.match(r.stroki[0], /ошибка TLS или сертификата/, `${kod}: ${r.stroki[0]}`);
    assert.match(r.stroki.join(' '), /Let's Encrypt/, kod);
  }
  const set = await domen({ poluchit: iz({ [W]: oshibka('ECONNRESET'), [G]: oshibka('ECONNRESET') }), pervyi: true });
  assert.doesNotMatch(set.stroki.join(' '), /сертификат/);
});

test('SV23-O2-6, O2-7 журнал: «:::», U+2028, заполнители, два «##[», команды в canonical и Location, длинный canonical — ни управляющих знаков, ни «::», ни «##[»; сущности — одним проходом, без свойств объекта', async () => {
  const s = (telo, dop = {}) => domen({ poluchit: iz({ [W]: otv(200, telo), [G]: otv(200, ZAGLUSHKA_SOZDAN), ...dop }), pervyi: false }).then((r) => r.stroki[0]);
  for (const t of [`<title>a:::b ##[x] ##[y] ${z(0x2028)}::error::z${z(0x2029)} ${z(0x3164, 0x2800)}</title>`, `<link rel="canonical" href="https://evil.example/::error::x${z(7)}##[debug]${'я'.repeat(200000)}">`]) {
    const stroka = await s(t);
    assert.doesNotMatch(stroka, ZHURNAL_ZLO, JSON.stringify(stroka.slice(0, 300)));
    assert.ok(stroka.length < 1500, `длина ${stroka.length}`);
  }
  // Негодный IPv6 (`zz` — не шестнадцатеричное): new URL бросает — Location печатается строкой «негодный адрес».
  const loc = await domen({ poluchit: iz({ [W]: otv(301, '', 'http://[::1:zz]/::error::x##[debug]'), [G]: otv(200, ZAGLUSHKA_SOZDAN) }), pervyi: false });
  assert.match(loc.stroki[0], /негодный адрес/, loc.stroki[0]);
  assert.doesNotMatch(loc.stroki[0], ZHURNAL_ZLO, loc.stroki[0]);
  assert.match(await s('<title>&#x26;lt;b&#x26;gt; &constructor; &toString; &rsquo;&copy;</title>'), /«&lt;b&gt; &constructor; &toString; ’©»/);
  assert.match(await s('<title>a <b>b</b></title>'), /«a <b>b<\/b>»/);
});

test('SV23-Z2-3 имя с точкой в конце — своё; canonical только в комментарии — не в счёт; петля — своя подсказка', async () => {
  const tochka = await domen({ poluchit: iz({ [W]: otv(301, '', 'https://www.7thserpent.com./'), 'https://www.7thserpent.com./': otv(200, ZAGLUSHKA_SOZDAN), [G]: otv(200, ZAGLUSHKA_SOZDAN) }), pervyi: true, soglasen: true });
  assert.equal(tochka.ok, true, tochka.stroki.join(' | '));
  const komm = await domen({ poluchit: iz({ [W]: otv(200, `<!-- ${pervogo} -->${ZAGLUSHKA_SOZDAN}`), [G]: otv(200, ZAGLUSHKA_SOZDAN) }), pervyi: true, soglasen: true });
  assert.equal(komm.ok, true, komm.stroki.join(' | '));
  const petlya = await domen({ poluchit: iz({ [W]: otv(301, '', G), [G]: otv(301, '', W) }), pervyi: true, soglasen: true });
  assert.equal(petlya.ok, false);
  assert.match(petlya.stroki.join(' '), /петля редиректов/, petlya.stroki.join(' | '));
});

test('SV23-O2-4 команда domen на GitHub снимает сопоставители проблем setup-node до строк ответа', () => {
  const d = mkdtempSync(join(tmpdir(), 'storozha-sopost-'));
  try {
    const { SERPENT_DOMAIN_BOUND, ...env } = process.env;
    const r = spawnSync(process.execPath, ['--import', BEZ_SETI, STOROZH, 'domen'], { encoding: 'utf8', env: { ...env, SETI_ZHURNAL: join(d, 'seti.txt'), SERPENT_PERVAYA: 'off', GITHUB_ACTIONS: 'true' } });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const stroki = r.stdout.split(/\r?\n/);
    assert.deepEqual(stroki.slice(0, 3), ['::remove-matcher owner=tsc::', '::remove-matcher owner=eslint-stylish::', '::remove-matcher owner=eslint-compact::']);
    assert.match(stroki[3], /^www\.7thserpent\.com: /);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV23 сторож домена: ни одна строка не посылает в Cloudflare — его на сайте нет (П108)', async () => {
  for (const [, karta, pervyi] of DOMEN) {
    const r = await domen({ poluchit: iz(karta), pervyi });
    assert.doesNotMatch(r.stroki.join(' '), /cloudflare/i, r.stroki.join(' | '));
  }
  for (const [, karta, pervyi, soglasen] of DOMEN_VKHOD) {
    const r = await domen({ poluchit: iz(karta), pervyi, soglasen });
    assert.doesNotMatch(r.stroki.join(' '), /cloudflare/i, r.stroki.join(' | '));
  }
});

test('SV23 вход SERPENT_DOMAIN_BOUND: on — согласие; off, пусто и нет — нет; иное — ошибка входа', () => {
  const { soglasieIzVkhoda } = SV;
  assert.equal(typeof soglasieIzVkhoda, 'function', 'нет функции soglasieIzVkhoda');
  assert.equal(soglasieIzVkhoda('on'), true);
  for (const z of ['off', '', undefined]) assert.equal(soglasieIzVkhoda(z), false, String(z));
  for (const z of ['yes', 'ON', 'true', ' on', 'on ']) assert.equal(soglasieIzVkhoda(z), null, JSON.stringify(z));
});

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
  ['SV2-O-1 P1a наш index.html и WordPress рядом', './\n../\n_astro/\nindex.html\nwp-admin/\nwp-content/\nwp-config.php\n', nash('/'), false, 'рядом с нашей сборкой'],
  ['SV2-O-1 P1b копия нашей главной в корне первого сайта (guides/)', './\n../\n_astro/\nguides/\nindex.html\n', nash('/'), false, 'guides'],
  ['SV2-O-1 P1d папка поддомена blog/ рядом с нашей выкладкой', './\n../\n_astro/\nblog/\nindex.html\n', nash('/'), false, 'blog'],
  ['SV2-O-1 P1e .ssh/, mail/, tmp/ рядом с нашей выкладкой', './\n../\n.ssh/\n_astro/\nindex.html\nmail/\ntmp/\n', nash('/'), false, 'рядом с нашей сборкой'],
  ['SV2-Z-1 оборванная первая выкладка: часть нашей сборки без index.html — отказ с верной причиной', './\n../\n.htaccess\n404/\n_astro/\n', null, false, 'оборванная'],
  ['SV2-Z-1 оборванная на index.html (.in.index.html.)', './\n../\n.htaccess\n.in.index.html.\n404/\n_astro/\napple-touch-icon.png\nfavicon.ico\n', null, false, 'оборванная'],
  ['SV2-Z-1 файлы хостера .htaccess и favicon.ico — удалить', './\n../\n.htaccess\nfavicon.ico\n', null, false, 'файлы хостера'],
  ['пустой корень', './\n../\n', null, true, 'пустой'],
  ['пустой корень с CRLF', './\r\n../\r\n', null, true, 'пустой'],
  ['пустой вывод lftp (MLSD без ./ ../)', '', null, true, 'пустой'],
  ['заглушка хостера (index.html без canonical)', './\n../\nindex.html\n', zaglushkaHostera, true, 'заглушка'],
  ['свежий каталог хостера: .well-known/ и cgi-bin/', './\n../\n.well-known/\ncgi-bin/\n', null, true, 'служебные'],
  ['прежняя наша выкладка', './\n../\n.htaccess\n404/\n_astro/\nindex.html\nprivacy/\nrobots.txt\n', nash('/'), true, 'наша сборка'],
  ['прежняя наша выкладка и .well-known/ сертификата', './\n../\n.htaccess\n.well-known/\n404/\n_astro/\nindex.html\n', nash('/'), true, 'наша сборка'],
  ['SV2-Z-8 прежняя наша выкладка и ссылка .well-known@ хостера', './\n../\n.well-known@\n_astro/\nindex.html\n', nash('/'), true, 'наша сборка'],
  ['прежняя наша выкладка и остаток .in. оборванной второй', './\n../\n.in.robots.txt.\n_astro/\nindex.html\n', nash('/'), true, 'наша сборка'],
];
for (const [imya, spisok, index, zhdem, kusok] of PAPKA) {
  test(`папка робота: ${imya}`, () => {
    const r = papka(spisok, index, VERKH);
    assert.equal(r.ok, zhdem, r.stroki.join(' | '));
    assert.ok(r.stroki.join(' ').includes(kusok), r.stroki.join(' | '));
  });
}

/* — раунд 3 — */
const nashaKarta = (puti) => `<?xml version="1.0"?><urlset>${puti.map((p) => `<url><loc>https://www.7thserpent.com${p}</loc></url>`).join('')}</urlset>`;

test('SV3-O-2 приставка .in. пропускает только временный файл lftp для файла сборки', () => {
  for (const s of ['.in.backup/', '.in.wp-config.php.', '.in.7dtd.com.pl/', '.in.x@']) {
    const r = papka(`./\n../\n_astro/\nindex.html\n${s}\n`, nash('/'), VERKH);
    assert.equal(r.ok, false, `${s}: ${r.stroki.join(' | ')}`);
  }
  assert.equal(papka('./\n../\n_astro/\nindex.html\n.in.robots.txt.\n', nash('/'), VERKH).ok, true);
});

test('SV3-Z-1 своя старая страница (есть в карте прежней выкладки) рядом с нашей сборкой — проход', () => {
  const r = papka('./\n../\n_astro/\nindex.html\nmax-payne-4/\n', nash('/'), VERKH, nashaKarta(['/', '/max-payne-4/']));
  assert.equal(r.ok, true, r.stroki.join(' | '));
  const bezKarty = papka('./\n../\n_astro/\nindex.html\nmax-payne-4/\n', nash('/'), VERKH, null);
  assert.equal(bezKarty.ok, false);
  assert.doesNotMatch(bezKarty.stroki.join(' '), /верх/);
  // Карта чужого хоста не в счёт.
  assert.equal(papka('./\n../\n_astro/\nindex.html\nblog/\n', nash('/'), VERKH, '<urlset><url><loc>https://www.ac4bf-thewatch.com/blog/</loc></url></urlset>').ok, false);
});

test('SV3-Z-2 оборванная первая выкладка без _astro (файлы корня легли первыми) — своя причина', () => {
  const r = papka('./\n../\n.htaccess\napple-touch-icon.png\nfavicon-16x16.png\n.in.favicon-32x32.png.\n', null, VERKH);
  assert.equal(r.ok, false);
  assert.match(r.stroki.join(' '), /оборванная первая выкладка или файлы хостера/);
});

test('SV3-Z-3 имена файлов в отказе печатаются, имена доменов — нет', () => {
  const r = papka('./\n../\n_astro/\nindex.html\nfavicon-48x48.png\nwp-config.php\n7dtd.com.pl\n', nash('/'), VERKH);
  const s = r.stroki.join(' ');
  assert.match(s, /favicon-48x48\.png/);
  assert.match(s, /wp-config\.php/);
  assert.doesNotMatch(s, /7dtd\.com\.pl/);
});

test('SV3-O-3 глубина: чужое внутри наших папок при прежней выкладке — отказ; старые ассеты и своя старая страница — проход', () => {
  const { glubina } = SV;
  assert.equal(typeof glubina, 'function', 'нет функции glubina');
  const fajly = ['index.html', '.htaccess', 'robots.txt', 'mods/index.html', 'media/index.html', 'privacy/index.html', '_astro/index.Cz6femgl.css', '_astro/a.webp'];
  const find = (dop) => ['./', ...fajly.map((f) => './' + f), ...dop.map((f) => './' + f)].join('\n');
  for (const chuzhoe of [['mods/index.php', 'mods/uploads/x.zip'], ['media/wp-content/uploads/x.jpg'], ['privacy/.htpasswd'], ['_astro/cache/x.bin']]) {
    const r = glubina(find(chuzhoe), nash('/'), fajly, null);
    assert.equal(r.ok, false, `${chuzhoe}: ${r.stroki.join(' | ')}`);
  }
  assert.equal(glubina(find(['_astro/old.Ab12Cd34.css', '_astro/old.webp', '.well-known/acme-challenge/t', 'cgi-bin/x.cgi', '.in.robots.txt.', '_astro/.nfs0001']), nash('/'), fajly, null).ok, true);
  assert.equal(glubina(find(['max-payne-4/index.html']), nash('/'), fajly, nashaKarta(['/max-payne-4/'])).ok, true);
  assert.equal(glubina(find(['max-payne-4/index.html']), nash('/'), fajly, null).ok, false);
  // Не прежняя выкладка — корень уже судил сторож папки: глубина не судится.
  assert.equal(glubina('./\n./index.html\n./.well-known/x\n', zaglushkaHostera, fajly, null).ok, true);
});

test('папка робота: отказ не печатает имён доменов аккаунта', () => {
  for (const s of ['./\n../\n7dtd.com.pl/\nac4bf-thewatch.com/\n', './\n../\n_astro/\nindex.html\nac4bf-thewatch.com\n']) {
    const r = papka(s, nash('/'), VERKH);
    assert.equal(r.ok, false);
    assert.ok(!r.stroki.join(' ').includes('ac4bf-thewatch.com'), r.stroki.join(' | '));
  }
});

/* — файл подтверждения Google (сессия 25, П113): имя — «google» + буквенно-цифровой код + «.html», внутри одна строка
 *   «google-site-verification: <то же имя>» (по образцам Search Console — 16 шестнадцатеричных знаков, без перевода строки
 *   в конце). Сторож папки пропускает его, только сверив содержимое скачанной копии; иное — стоп, как было. — */
const GOOGLE = 'google0123456789abcdef.html';
const STROKA_GOOGLE = `google-site-verification: ${GOOGLE}`;
const SPISOK_G = `./\n../\n_astro/\n${GOOGLE}\nindex.html\n`;

test('П113 файл подтверждения Google в корне со строкой подтверждения того же имени — проход: рядом с нашей сборкой, один в пустом корне, в свежем каталоге хостера', () => {
  const ryadom = papka(SPISOK_G, nash('/'), VERKH, null, { [GOOGLE]: STROKA_GOOGLE });
  assert.equal(ryadom.ok, true, ryadom.stroki.join(' | '));
  assert.match(ryadom.stroki.join(' '), /наша сборка/);
  assert.ok(ryadom.stroki.join(' ').includes(`файл подтверждения Google ${GOOGLE}`), ryadom.stroki.join(' | '));
  for (const telo of [`${STROKA_GOOGLE}\n`, `${STROKA_GOOGLE}\r\n`]) {
    assert.equal(papka(SPISOK_G, nash('/'), VERKH, null, { [GOOGLE]: telo }).ok, true, JSON.stringify(telo));
  }
  const odin = papka(`./\n../\n${GOOGLE}\n`, null, VERKH, null, { [GOOGLE]: STROKA_GOOGLE });
  assert.equal(odin.ok, true, odin.stroki.join(' | '));
  assert.ok(odin.stroki.join(' ').includes(`файл подтверждения Google ${GOOGLE}`), odin.stroki.join(' | '));
  const svezhiy = papka(`./\n../\n.well-known/\n${GOOGLE}\nindex.html\n`, zaglushkaHostera, VERKH, null, { [GOOGLE]: STROKA_GOOGLE });
  assert.equal(svezhiy.ok, true, svezhiy.stroki.join(' | '));
  // Код — буквы и цифры (форма Google «буквенно-цифровая строка»), не только шестнадцатеричные.
  const inoy = 'googleAbC123xyz.html';
  assert.equal(papka(`./\n../\n_astro/\n${inoy}\nindex.html\n`, nash('/'), VERKH, null, { [inoy]: `google-site-verification: ${inoy}` }).ok, true);
  // Раунд 1 (законные формы): вывод cls с CRLF, ссылка .well-known@ хостера рядом — проход; два верных файла — проход, оба
  // названы (буква П113; ровно ли один — вопрос владельцу, SV25-O-2).
  assert.equal(papka(SPISOK_G.replace(/\n/g, '\r\n'), nash('/'), VERKH, null, { [GOOGLE]: STROKA_GOOGLE }).ok, true);
  assert.equal(papka(`./\n../\n.well-known@\n_astro/\n${GOOGLE}\nindex.html\n`, nash('/'), VERKH, null, { [GOOGLE]: STROKA_GOOGLE }).ok, true);
  const vtoroy = 'googlefedcba9876543210.html';
  const dva = papka(`./\n../\n_astro/\n${GOOGLE}\n${vtoroy}\nindex.html\n`, nash('/'), VERKH, null, { [GOOGLE]: STROKA_GOOGLE, [vtoroy]: `google-site-verification: ${vtoroy}` });
  assert.equal(dva.ok, true, dva.stroki.join(' | '));
  assert.ok(dva.stroki.join(' ').includes(GOOGLE) && dva.stroki.join(' ').includes(vtoroy), dva.stroki.join(' | '));
});

test('П113, SV25-Z-1, Z-2 файл подтверждения Google: не скачан или внутри иное — стоп называет причину (без содержимого) и ведёт к верному действию', () => {
  const SC = /загрузи его в корень www поверх этого/;
  const sluchai = [
    ['не скачан', undefined, 'не скачан — скачивание корня его не принесло'],
    ['пустой', '', 'файл пуст'],
    ['чужое имя внутри', 'google-site-verification: googleffffffffffffffff.html', 'внутри имя другого файла googleffffffffffffffff.html'],
    ['страница HTML', `<html><body>${STROKA_GOOGLE}</body></html>`, 'внутри не строка подтверждения Google с этим именем'],
    ['BOM', z(0xfeff) + STROKA_GOOGLE, 'в начале BOM (EF BB BF)'],
    ['два перевода строки', `${STROKA_GOOGLE}\n\n`, 'в конце лишнее после строки подтверждения: LF, LF'],
    ['пробел в начале', ` ${STROKA_GOOGLE}`, 'внутри не строка подтверждения Google с этим именем'],
    ['пробел в конце', `${STROKA_GOOGLE} `, 'в конце лишнее после строки подтверждения: пробел'],
    ['табуляция в конце', `${STROKA_GOOGLE}\t`, 'в конце лишнее после строки подтверждения: табуляция'],
    ['одинокий CR', `${STROKA_GOOGLE}\r`, 'в конце лишнее после строки подтверждения: CR'],
    ['пробел перед LF', `${STROKA_GOOGLE} \n`, 'в конце лишнее после строки подтверждения: пробел, LF'],
    ['неразрывный пробел в конце', STROKA_GOOGLE + z(0xa0), 'в конце лишнее после строки подтверждения: неразрывный пробел'],
    ['вторая строка', `${STROKA_GOOGLE}\n<script>alert(1)</script>`, 'в конце лишнее после строки подтверждения: текст, 26 знаков'],
    ['без пробела после двоеточия', `google-site-verification:${GOOGLE}`, 'внутри не строка подтверждения Google с этим именем'],
    ['другой регистр ключа', `Google-Site-Verification: ${GOOGLE}`, 'внутри не строка подтверждения Google с этим именем'],
  ];
  for (const [imya, telo, kusok] of sluchai) {
    const r = papka(SPISOK_G, nash('/'), VERKH, null, telo === undefined ? {} : { [GOOGLE]: telo });
    const t = r.stroki.join(' ');
    assert.equal(r.ok, false, `${imya}: ${t}`);
    assert.match(t, /^СТОП/, imya);
    assert.ok(t.includes(kusok), `${imya}: ${t}`);
    assert.ok(t.includes(GOOGLE), `${imya}: имени файла нет в строке`);
    // Содержимое файла в журнал не идёт: ни строки подтверждения, ни чужого текста.
    assert.ok(!t.includes('<script>') && !t.includes('google-site-verification:'), `${imya}: содержимое в строке`);
    assert.doesNotMatch(t, /удали его/, imya);
    if (telo === undefined) {
      assert.match(t, /файл в панели не трогай/, imya);
      assert.match(t, /новый запуск кнопкой Run workflow/, imya);
      assert.doesNotMatch(t, SC, imya);
    } else assert.match(t, SC, imya);
  }
  // Без папки скачанного (вызов сторожа в прежней форме) — тоже стоп: сверить нечем.
  assert.equal(papka(SPISOK_G, nash('/'), VERKH).ok, false);
  // SV25-Z-2: index.html в списке, но не получен, и файл Google не скачан — стоп называет сбой скачивания корня с обоими.
  const oba = papka(SPISOK_G, null, VERKH, null, {});
  assert.equal(oba.ok, false);
  assert.match(oba.stroki.join(' '), /скачивание корня не принесло ни index\.html, ни/, oba.stroki.join(' | '));
});

test('SV25-O-3 двойник имени файла Google с невидимым знаком по краю — стоп: после обрезки имя в списке дважды', () => {
  for (const dvoynik of [`${GOOGLE} `, ` ${GOOGLE}`, `${GOOGLE}\t`, z(0xa0) + GOOGLE, z(0xfeff) + GOOGLE]) {
    const r = papka(`./\n../\n_astro/\n${GOOGLE}\n${dvoynik}\nindex.html\n`, nash('/'), VERKH, null, { [GOOGLE]: STROKA_GOOGLE });
    assert.equal(r.ok, false, `${JSON.stringify(dvoynik)}: ${r.stroki.join(' | ')}`);
    assert.match(r.stroki.join(' '), /в списке корня дважды/, JSON.stringify(dvoynik));
  }
});

test('SV25-Z-3, Z-4 тексты при файле Google: «удали содержимое» — кроме файла подтверждения, счёт — без него; один файл Google — «пустой корень, кроме файла подтверждения»', () => {
  const r = papka(`./\n../\n.htaccess\n404/\n_astro/\n${GOOGLE}\n`, null, VERKH, null, { [GOOGLE]: STROKA_GOOGLE });
  assert.equal(r.ok, false, r.stroki.join(' | '));
  assert.match(r.stroki.join(' '), /оборванная первая выкладка/);
  assert.ok(r.stroki.join(' ').includes(`кроме файла подтверждения Google ${GOOGLE}`), r.stroki.join(' | '));
  assert.match(r.stroki.join(' '), /\(3 записей\)/, r.stroki.join(' | '));
  const odin = papka(`./\n../\n${GOOGLE}\n`, null, VERKH, null, { [GOOGLE]: STROKA_GOOGLE });
  assert.equal(odin.ok, true);
  assert.match(odin.stroki.join(' '), /пустой корень, кроме файла подтверждения Google/, odin.stroki.join(' | '));
  assert.doesNotMatch(odin.stroki.join(' '), /хостера/, odin.stroki.join(' | '));
});

test('П113 файл подтверждения Google: имя не той формы, папка или ссылка с таким именем — стоп, как было', () => {
  for (const s of ['google-verify.html', 'Google0123456789abcdef.html', 'google0123456789abcdef.htm', 'google.html', 'google0123456789abcdef.html.bak', `${GOOGLE}/`, `${GOOGLE}@`]) {
    const imya = s.replace(/[/@]$/, '');
    const r = papka(`./\n../\n_astro/\n${s}\nindex.html\n`, nash('/'), VERKH, null, { [imya]: `google-site-verification: ${imya}` });
    assert.equal(r.ok, false, `${s}: ${r.stroki.join(' | ')}`);
  }
});

test('П113 файл подтверждения Google глубже корня — чужое внутри наших папок (глубина), как было; корень глубина не судит', () => {
  const { glubina } = SV;
  const fajly = ['index.html', 'privacy/index.html', '_astro/a.css'];
  assert.equal(glubina(['./', ...fajly.map((f) => './' + f), `./privacy/${GOOGLE}`].join('\n'), nash('/'), fajly, null).ok, false);
  assert.equal(glubina(['./', ...fajly.map((f) => './' + f), `./${GOOGLE}`].join('\n'), nash('/'), fajly, null).ok, true);
});

test('П113 файл подтверждения Google в самой сборке — стоп сторожа папки до выкладки: mirror его не выложит', () => {
  const r = papka('./\n../\n', null, [...VERKH, GOOGLE], null, {});
  assert.equal(r.ok, false, r.stroki.join(' | '));
  assert.match(r.stroki.join(' '), /в сборке файл подтверждения Google/);
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
  ['SV1-Z-6, SV2-Z-3 пустой файл', '', false, 'пуст или без </html>'],
  ['SV1-Z-6 оборванный файл', '<!doctype ht', false, 'пуст или без </html>'],
  ['SV2-Z-3 заглушка хостера без </html> — не «прошлая выкладка»', '<html><head><title>Сайт створено</title></head><body><h1>Сайт</h1></body>', false, 'заглушка хостера или повреждённый файл'],
];
for (const [imya, html, zhdem, kusok] of INDEKS) {
  test(`index.html до mirror: ${imya}`, () => {
    const r = indeks(html);
    assert.equal(r.ok, zhdem, r.stroki.join(' | '));
    assert.ok(r.stroki.join(' ').includes(kusok), r.stroki.join(' | '));
    assert.ok(!r.stroki.join(' ').includes('прошлая выкладка не закончилась'), r.stroki.join(' | '));
  });
}

test('разбор списка: ./ и ../ отброшены, CRLF и пробелы по краям — как LF', () => {
  assert.deepEqual(razobratSpisok('./\r\n../\r\n _astro/ \r\nindex.html\r\n'), ['_astro/', 'index.html']);
  assert.deepEqual(razobratFind('./\n./index.html\n./_astro/\n./_astro/a.css\r\n'), ['index.html', '_astro/a.css']);
});

/* ---------- сборка: список, сверка, пересчёт ---------- */

const CID_YADRA = 'm3tnyskv';
const CID_SAYTA = 'abcd1234';
function sborka(dop = {}) {
  const d = mkdtempSync(join(tmpdir(), 'storozha-vykladki-'));
  const html = (url, css = 'index.Cz6femgl.css') => nash(url).replace('<body>', `<body><div data-astro-cid-${CID_YADRA}><p data-astro-cid-${CID_SAYTA}>x</p></div><link rel="stylesheet" href="/_astro/${css}"><img src="/_astro/a.webp" srcset="/_astro/a.webp 1200w" alt="">`);
  const fajly = {
    'index.html': html('/'),
    '.htaccess': 'ErrorDocument 404 /404/index.html\n',
    'robots.txt': 'User-agent: *\n',
    '404/index.html': html('/404/'),
    'privacy/index.html': html('/privacy/'),
    'sitemap-index.xml': '<x/>',
    'sitemap-0.xml': '<y/>',
    '_astro/index.Cz6femgl.css': `.a[data-astro-cid-${CID_YADRA}]{color:red}.b[data-astro-cid-${CID_SAYTA}]{}`,
    '_astro/a.webp': 'RIFF',
    ...dop,
  };
  for (const [f, t] of Object.entries(fajly)) {
    mkdirSync(join(d, f, '..'), { recursive: true });
    writeFileSync(join(d, f), typeof t === 'function' ? t(html) : t);
  }
  return d;
}
const zamenitV = (d, f, iz, na) => writeFileSync(join(d, f), readFileSync(join(d, f), 'utf8').split(iz).join(na));
/** Сборка «на раннере»: другое значение cid ядра и другой хеш в имени CSS — как у сборки CI (SV1-Z-1). */
function kakNaRannere(d, css = [['index.Cz6femgl.css', 'index.Q1w2E3r4.css']]) {
  const html = ['index.html', '404/index.html', 'privacy/index.html'];
  // Сборка на раннере меняет cid ядра везде — во всех страницах и во всех CSS.
  for (const f of [...html, ...readdirSync(join(d, '_astro')).filter((x) => x.endsWith('.css')).map((x) => `_astro/${x}`)]) zamenitV(d, f, CID_YADRA, '545q7pxz');
  for (const [a, b] of css) {
    renameSync(join(d, '_astro', a), join(d, '_astro', b));
    for (const f of html) zamenitV(d, f, a, b);
  }
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

test('SV1-Z-1 сборка CI отличается только значениями cid и хешем имени CSS — проход, названо', () => {
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
    zamenitV(d, 'privacy/index.html', '>x<', '>y<');
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
    zamenitV(d, 'index.html', `<div data-astro-cid-${CID_YADRA}><p data-astro-cid-${CID_SAYTA}>`, `<div data-astro-cid-${CID_SAYTA}><p data-astro-cid-${CID_YADRA}>`);
    assert.equal(sverkaDist(d, prin).ok, false);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV2-O-5 N1 CSS переименован, а страницы ссылаются на старое имя — отказ (битая ссылка)', () => {
  const d = sborka();
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    renameSync(join(d, '_astro/index.Cz6femgl.css'), join(d, '_astro/index.Q1w2E3r4.css'));
    const r = sverkaDist(d, prin);
    assert.equal(r.ok, false, r.stroki.join(' | '));
    assert.match(r.stroki.join(' '), /битые ссылки|иные байты/);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV2-O-5 N1b одна страница ссылается на несуществующий CSS — отказ', () => {
  const d = sborka();
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    zamenitV(d, 'privacy/index.html', 'index.Cz6femgl.css', 'index.ZZZZZZZZ.css');
    const r = sverkaDist(d, prin);
    assert.equal(r.ok, false, r.stroki.join(' | '));
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

const DVA_CSS = {
  '_astro/index.AAAAAAAA.css': `.a[data-astro-cid-${CID_YADRA}]{color:red}`,
  '_astro/index.BBBBBBBB.css': `.b[data-astro-cid-${CID_SAYTA}]{color:blue}`,
  'index.html': (html) => html('/', 'index.AAAAAAAA.css'),
  'privacy/index.html': (html) => html('/privacy/', 'index.BBBBBBBB.css'),
};
test('SV2-O-5 N2 два CSS с одним именем, ссылки переставлены — отказ', () => {
  const d = sborka(DVA_CSS);
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    zamenitV(d, 'index.html', 'index.AAAAAAAA.css', 'index.TMP.css');
    zamenitV(d, 'privacy/index.html', 'index.BBBBBBBB.css', 'index.AAAAAAAA.css');
    zamenitV(d, 'index.html', 'index.TMP.css', 'index.BBBBBBBB.css');
    assert.equal(sverkaDist(d, prin).ok, false);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV2-Z-2 N2b законная пара index.*.css с одним именем на раннере — проход', () => {
  const d = sborka(DVA_CSS);
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    // На раннере хеши обоих имён другие, и пара могла поменяться местами в сортировке сырых имён.
    kakNaRannere(d, [['index.AAAAAAAA.css', 'index.ZZZZZZZZ.css'], ['index.BBBBBBBB.css', 'index.00000000.css']]);
    const r = sverkaDist(d, prin);
    assert.equal(r.ok, true, r.stroki.join(' | '));
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

const DVA_CSS_CID = {
  '_astro/Card.AAAAAAAA.css': `.a[data-astro-cid-${CID_YADRA}]{color:red}`,
  '_astro/Card.BBBBBBBB.css': `.a[data-astro-cid-${CID_SAYTA}]{color:red}`,
  'index.html': (html) => html('/', 'Card.AAAAAAAA.css'),
  'privacy/index.html': (html) => html('/privacy/', 'Card.BBBBBBBB.css'),
};
test('SV3-O-6 пара CSS, различная только значением cid, ссылки переставлены — отказ', () => {
  const d = sborka(DVA_CSS_CID);
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    zamenitV(d, 'index.html', 'Card.AAAAAAAA.css', 'Card.TMP.css');
    zamenitV(d, 'privacy/index.html', 'Card.BBBBBBBB.css', 'Card.AAAAAAAA.css');
    zamenitV(d, 'index.html', 'Card.TMP.css', 'Card.BBBBBBBB.css');
    assert.equal(sverkaDist(d, prin).ok, false);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV3-Z-4 та же пара на раннере (иной cid ядра и хеш одного имени) — проход', () => {
  const d = sborka(DVA_CSS_CID);
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    kakNaRannere(d, [['Card.AAAAAAAA.css', 'Card.ZZZZZZZZ.css']]);
    const r = sverkaDist(d, prin);
    assert.equal(r.ok, true, r.stroki.join(' | '));
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV3-Z-5 «/_astro/» в robots.txt и комментариях — не ссылки; битая ссылка — код 1 у spisok', () => {
  const d = sborka({ 'robots.txt': 'User-agent: *\n# /_astro/ stylesheets are not blocked\nAllow: /_astro/*\nDisallow: /_astro/*.map$\n' });
  try {
    const s = spisokSborki(d);
    assert.deepEqual(s.bityeSsylki, [], s.bityeSsylki.join(' | '));
    zamenitV(d, 'privacy/index.html', 'index.Cz6femgl.css', 'index.ZZZZZZZZ.css');
    const r = spawnSync(process.execPath, [STOROZH, 'spisok', d], { encoding: 'utf8' });
    assert.equal(r.status, 1, r.stderr);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV3-Z-6 .well-known в сборке — отказ папки до выкладки (mirror его не выложит); пересчёт фильтрует обе стороны', () => {
  const d = sborka({ '.well-known/security.txt': 'Contact: x' });
  try {
    const f = join(d, 'root.txt');
    writeFileSync(f, './\n../\n');
    const r = spawnSync(process.execPath, [STOROZH, 'papka', f, join(d, 'net.html'), d], { encoding: 'utf8' });
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stdout, /\.well-known/);
    assert.equal(pereschet(findIz(d), d).ok, true);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV2-O-6 N5 метка нормализации «data-astro-cid-#1» буквально в сборке — отказ', () => {
  const d = sborka();
  try {
    const prin = { sborka: 'abc1234', ...spisokSborki(d) };
    zamenitV(d, 'index.html', `data-astro-cid-${CID_YADRA}`, 'data-astro-cid-#1');
    assert.equal(sverkaDist(d, prin).ok, false);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

const findIz = (d) => ['./', ...Object.keys(spisokSborki(d).fajly).map((f) => './' + f), './_astro/', './404/', './privacy/'].join('\n') + '\n';

test('пересчёт на сервере: ровно dist — проход; лишний, недостающий, без ключевого — отказ; служебные папки хостера — не считаются', () => {
  const d = sborka();
  try {
    assert.equal(pereschet(findIz(d), d).ok, true);
    assert.equal(pereschet(findIz(d).replace(/\n/g, '\r\n'), d).ok, true);
    assert.equal(pereschet(findIz(d) + './.well-known/\n./.well-known/acme-challenge/x\n./cgi-bin/\n./cgi-bin/y.cgi\n', d).ok, true);
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

test('П113 пересчёт: файл подтверждения Google в корне сервера не считается и назван; глубже корня и не той формы — лишний', () => {
  const d = sborka();
  try {
    const r = pereschet(findIz(d) + `./${GOOGLE}\n`, d);
    assert.equal(r.ok, true, r.stroki.join(' | '));
    assert.ok(r.stroki.join(' ').includes(`файл подтверждения Google ${GOOGLE}`), r.stroki.join(' | '));
    assert.equal(pereschet(findIz(d) + `./privacy/${GOOGLE}\n`, d).ok, false);
    assert.equal(pereschet(findIz(d) + './google-verify.html\n', d).ok, false);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV25-O-1, Z-5 пересчёт со списком корня до выкладки: файл подтверждения Google, сверенный до выкладки, обязан остаться; новый — стоп', () => {
  const d = sborka();
  try {
    const koren = `./\n../\n_astro/\n${GOOGLE}\nindex.html\n`;
    const ok = pereschet(findIz(d) + `./${GOOGLE}\n`, d, koren);
    assert.equal(ok.ok, true, ok.stroki.join(' | '));
    assert.ok(ok.stroki.join(' ').includes(`файл подтверждения Google ${GOOGLE}`), ok.stroki.join(' | '));
    const propal = pereschet(findIz(d), d, koren);
    assert.equal(propal.ok, false, propal.stroki.join(' | '));
    assert.ok(propal.stroki.join(' ').includes(`файл подтверждения Google ${GOOGLE} был в корне до выкладки, а после неё его нет`), propal.stroki.join(' | '));
    const vtoroy = 'googlefedcba9876543210.html';
    const novyy = pereschet(findIz(d) + `./${GOOGLE}\n./${vtoroy}\n`, d, koren);
    assert.equal(novyy.ok, false, novyy.stroki.join(' | '));
    assert.ok(novyy.stroki.join(' ').includes(`новый файл подтверждения Google ${vtoroy}`), novyy.stroki.join(' | '));
    // Без файла Google до и после — проход, как было; список корня с CRLF — так же.
    assert.equal(pereschet(findIz(d), d, './\n../\n_astro/\nindex.html\n').ok, true);
    assert.equal(pereschet(findIz(d) + `./${GOOGLE}\n`, d, koren.replace(/\n/g, '\r\n')).ok, true);
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

test('SV2-Z-5 команда domen без SERPENT_PERVAYA (on|off) — код 2, без сети', () => {
  const { SERPENT_PERVAYA, ...env } = process.env;
  for (const znach of [undefined, '', 'yes']) {
    const r = spawnSync(process.execPath, [STOROZH, 'domen'], { encoding: 'utf8', env: znach === undefined ? env : { ...env, SERPENT_PERVAYA: znach } });
    assert.equal(r.status, 2, `${znach}: ${r.stdout}${r.stderr}`);
  }
});

// Сеть в дочернем процессе подменена до запуска сторожа (SV23-O-4): fetch не ходит наружу, а пишет адрес в журнал
// SETI_ZHURNAL и отвечает заглушкой хостера — проба считает запросы, а не только код выхода.
const BEZ_SETI = `data:text/javascript;base64,${Buffer.from(
  "import { appendFileSync } from 'node:fs';\n" +
    "globalThis.fetch = async (url) => { appendFileSync(process.env.SETI_ZHURNAL, String(url) + '\\n'); return new Response('<title>Поздравляем, сайт создан!</title>', { status: 200 }); };\n"
).toString('base64')}`;
test('SV23 команда domen: вход SERPENT_DOMAIN_BOUND доходит до сторожа; иное значение — код 2 до сети; наружу — ни одного запроса', () => {
  const { SERPENT_DOMAIN_BOUND, ...env } = process.env;
  const d = mkdtempSync(join(tmpdir(), 'storozha-domen-'));
  try {
    let n = 0;
    const zapusk = (vkhod) => {
      n += 1;
      const zhurnal = join(d, `seti-${n}.txt`);
      const r = spawnSync(process.execPath, ['--import', BEZ_SETI, STOROZH, 'domen'], { encoding: 'utf8', env: { ...env, SETI_ZHURNAL: zhurnal, SERPENT_PERVAYA: 'on', ...(vkhod === undefined ? {} : { SERPENT_DOMAIN_BOUND: vkhod }) } });
      let zaprosy = [];
      try {
        zaprosy = readFileSync(zhurnal, 'utf8').split('\n').filter(Boolean);
      } catch {
        zaprosy = [];
      }
      return { ...r, zaprosy };
    };
    const da = zapusk('on');
    assert.equal(da.status, 0, da.stdout + da.stderr);
    assert.match(da.stdout, /SERPENT_DOMAIN_BOUND/);
    assert.match(da.stdout, /«Поздравляем, сайт создан!»/);
    assert.deepEqual(da.zaprosy, ['https://www.7thserpent.com/', 'https://7thserpent.com/']);
    for (const net of ['off', '', undefined]) {
      const r = zapusk(net);
      assert.equal(r.status, 1, `${net}: ${r.stdout}${r.stderr}`);
      assert.match(r.stdout, /СТОП/);
      assert.equal(r.zaprosy.length, 2, `${net}: ${r.zaprosy.join(' ')}`);
    }
    for (const plokho of ['yes', 'ON', 'true', 'on\n']) {
      const r = zapusk(plokho);
      assert.equal(r.status, 2, `${JSON.stringify(plokho)}: ${r.stdout}${r.stderr}`);
      assert.match(r.stderr, /SERPENT_DOMAIN_BOUND/);
      assert.deepEqual(r.zaprosy, [], `${JSON.stringify(plokho)}: запросы до проверки входа`);
    }
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('команда: папка и index.html — коды 0 и 1; признак первой выкладки — в GITHUB_OUTPUT', () => {
  const d = mkdtempSync(join(tmpdir(), 'storozha-vykladki-'));
  try {
    writeFileSync(join(d, 'root.txt'), './\n../\nwww/\n');
    writeFileSync(join(d, 'index.html'), pervogo);
    assert.equal(spawnSync(process.execPath, [STOROZH, 'papka', join(d, 'root.txt')]).status, 1);
    assert.equal(spawnSync(process.execPath, [STOROZH, 'indeks', join(d, 'index.html')]).status, 1);
    assert.equal(spawnSync(process.execPath, [STOROZH, 'indeks', join(d, 'net.html')]).status, 0);
    writeFileSync(join(d, 'root.txt'), './\n../\n');
    mkdirSync(join(d, 'dist', '_astro'), { recursive: true });
    writeFileSync(join(d, 'dist', 'index.html'), nash('/'));
    assert.equal(spawnSync(process.execPath, [STOROZH, 'papka', join(d, 'root.txt'), join(d, 'net.html'), join(d, 'dist')]).status, 0);
    // Прежняя наша выкладка и чужая папка рядом — отказ и через команду (верх сборки — из dist и принятого списка).
    writeFileSync(join(d, 'root.txt'), './\n../\n_astro/\nindex.html\nwp-admin/\n');
    writeFileSync(join(d, 'index.html'), nash('/'));
    assert.equal(spawnSync(process.execPath, [STOROZH, 'papka', join(d, 'root.txt'), join(d, 'index.html'), join(d, 'dist')]).status, 1);
    writeFileSync(join(d, 'out.txt'), '');
    const { GITHUB_ACTIONS, GITHUB_OUTPUT, ...env } = process.env;
    const r = spawnSync(process.execPath, [STOROZH, 'pervaya', join(d, 'net.html'), join(d, 'net.txt')], { encoding: 'utf8', env: { ...env, SERPENT_FIRST: 'off', GITHUB_OUTPUT: join(d, 'out.txt') } });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(readFileSync(join(d, 'out.txt'), 'utf8'), 'pervaya=on\n');
    // SV2-O-4: на GitHub без GITHUB_OUTPUT признак не записать — код 2, а не «да» без выхода.
    const bezVykhoda = spawnSync(process.execPath, [STOROZH, 'pervaya', join(d, 'net.html'), join(d, 'net.txt')], { encoding: 'utf8', env: { ...env, SERPENT_FIRST: 'off', GITHUB_ACTIONS: 'true' } });
    assert.equal(bezVykhoda.status, 2, bezVykhoda.stdout + bezVykhoda.stderr);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('П113 команда papka: пятый аргумент — папка скачанного; файл Google сверяется по содержимому (коды 0 и 1)', () => {
  const d = mkdtempSync(join(tmpdir(), 'storozha-google-'));
  try {
    mkdirSync(join(d, 'remote-top'), { recursive: true });
    mkdirSync(join(d, 'dist', '_astro'), { recursive: true });
    writeFileSync(join(d, 'dist', 'index.html'), nash('/'));
    writeFileSync(join(d, 'root.txt'), SPISOK_G);
    writeFileSync(join(d, 'remote-top', 'index.html'), nash('/'));
    writeFileSync(join(d, 'remote-top', GOOGLE), STROKA_GOOGLE);
    const argi = ['papka', join(d, 'root.txt'), join(d, 'remote-top', 'index.html'), join(d, 'dist'), join(d, 'remote-top', 'sitemap-0.xml'), join(d, 'remote-top')];
    const da = spawnSync(process.execPath, [STOROZH, ...argi], { encoding: 'utf8' });
    assert.equal(da.status, 0, da.stdout + da.stderr);
    assert.ok(da.stdout.includes(GOOGLE), da.stdout);
    writeFileSync(join(d, 'remote-top', GOOGLE), '<html>not a verification file</html>');
    const chuzhoy = spawnSync(process.execPath, [STOROZH, ...argi], { encoding: 'utf8' });
    assert.equal(chuzhoy.status, 1, chuzhoy.stdout + chuzhoy.stderr);
    rmSync(join(d, 'remote-top', GOOGLE));
    const netu = spawnSync(process.execPath, [STOROZH, ...argi], { encoding: 'utf8' });
    assert.equal(netu.status, 1, netu.stdout + netu.stderr);
    assert.match(netu.stdout, /не скачан/);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('SV25-O-1 команда pereschet: третий аргумент — список корня до выкладки (коды 0 и 1); без него — как было', () => {
  const d = sborka();
  // Входы команды — вне папки сборки: пересчёт считает каждый файл сборки.
  const t = mkdtempSync(join(tmpdir(), 'storozha-pereschet-'));
  try {
    writeFileSync(join(t, 'koren.txt'), `./\n../\n_astro/\n${GOOGLE}\nindex.html\n`);
    writeFileSync(join(t, 'find-s.txt'), findIz(d) + `./${GOOGLE}\n`);
    writeFileSync(join(t, 'find-bez.txt'), findIz(d));
    const zapusk = (...a) => spawnSync(process.execPath, [STOROZH, 'pereschet', ...a], { encoding: 'utf8' });
    const da = zapusk(join(t, 'find-s.txt'), d, join(t, 'koren.txt'));
    assert.equal(da.status, 0, da.stdout + da.stderr);
    const propal = zapusk(join(t, 'find-bez.txt'), d, join(t, 'koren.txt'));
    assert.equal(propal.status, 1, propal.stdout);
    assert.match(propal.stdout, /был в корне до выкладки, а после неё его нет/);
    assert.equal(zapusk(join(t, 'find-bez.txt'), d).status, 0);
    // Список корня назван, но его нет — ошибка входа.
    assert.equal(zapusk(join(t, 'find-s.txt'), d, join(t, 'net.txt')).status, 2);
  } finally {
    rmSync(d, { recursive: true, force: true });
    rmSync(t, { recursive: true, force: true });
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

test('SV23 workflow: вход SERPENT_DOMAIN_BOUND («домен привязан — согласен») — выбор off/on, по умолчанию off; только сторожу домена и только в первой попытке запуска (SV23-O-6); push — off', () => {
  const v = WF.on.workflow_dispatch.inputs.SERPENT_DOMAIN_BOUND;
  assert.ok(v, 'нет входа SERPENT_DOMAIN_BOUND');
  assert.equal(v.type, 'choice');
  assert.deepEqual(v.options, ['off', 'on']);
  assert.equal(v.default, 'off');
  const d = shag('Домен уже привязан');
  // Повтор (Re-run) не несёт согласия: повтор старого запуска первой выкладки откатил бы живой сайт (SV23-O-6).
  assert.equal(d.env.SERPENT_DOMAIN_BOUND, "${{ github.run_attempt == 1 && inputs.SERPENT_DOMAIN_BOUND || 'off' }}");
  // SV23-Z-6: шаг домена — ровно команда сторожа, без условия, без продолжения при ошибке, без глушителей.
  assert.equal(d.run, 'node $SITE/tools/storozha-vykladki.mjs domen');
  assert.equal(d.if, undefined);
  assert.equal(d['continue-on-error'], undefined);
  assert.deepEqual(Object.keys(d.env).sort(), ['SERPENT_DOMAIN_BOUND', 'SERPENT_PERVAYA']);
  assert.equal(job['continue-on-error'], undefined);
  // SV23-O-5: имя входа в дереве YAML — только во входах (свой ключ, своё и SERPENT_FIRST описания) и в env шага домена.
  const gde = [];
  const obhod = (o, put) => {
    if (typeof o === 'string') {
      if (o.includes('SERPENT_DOMAIN_BOUND')) gde.push(put);
      return;
    }
    if (o && typeof o === 'object') {
      for (const [k, x] of Object.entries(o)) {
        if (k.includes('SERPENT_DOMAIN_BOUND')) gde.push(`${put}.${k}#ключ`);
        obhod(x, `${put}.${k}`);
      }
    }
  };
  obhod(WF, '');
  const iD = shagi.indexOf(d);
  assert.deepEqual(gde.sort(), [
    '.on.workflow_dispatch.inputs.SERPENT_DOMAIN_BOUND#ключ',
    '.on.workflow_dispatch.inputs.SERPENT_DOMAIN_BOUND.description',
    '.on.workflow_dispatch.inputs.SERPENT_FIRST.description',
    `.jobs.deploy.steps.${iD}.env.SERPENT_DOMAIN_BOUND#ключ`,
    `.jobs.deploy.steps.${iD}.env.SERPENT_DOMAIN_BOUND`,
  ].sort());
  // SV23-Z-3: форма Run workflow подписывает поля описанием — оно начинается с имени входа.
  assert.match(v.description, /^SERPENT_DOMAIN_BOUND — /);
  assert.match(WF.on.workflow_dispatch.inputs.SERPENT_FIRST.description, /^SERPENT_FIRST — /);
  // SV23-Z2-2: повтор согласия не несёт — описание поля говорит, как повторять.
  assert.match(v.description, /после красного прогона — новый Run workflow с обоими входами/);
});

test('SV23 workflow: без Cloudflare — ни в шапке, ни в шагах (П108)', () => {
  assert.doesNotMatch(WF_TEKST, /cloudflare/i);
});

test('workflow: push выкладывает только при SERPENT_DEPLOY=on, живой — при SERPENT_LIVE=on', () => {
  assert.equal(job.if, "github.event_name == 'workflow_dispatch' || vars.SERPENT_DEPLOY == 'on'");
  assert.equal(shag('Проверка живого сайта').if, "vars.SERPENT_LIVE == 'on'");
  assert.equal(shag('Проверка живого сайта').run, 'npm run live:check -w $SITE');
});

test('SV1-O-2, SV2-O-3, SV2-O-4 workflow: первая выкладка — по входу или по серверу (index.html и ключевые файлы); пустой признак — первая', () => {
  const p = shag('Первая выкладка?');
  assert.equal(p.id, 'pervaya');
  assert.equal(p.env.SERPENT_FIRST, "${{ inputs.SERPENT_FIRST || 'off' }}");
  assert.match(p.run, /storozha-vykladki\.mjs pervaya remote-top\/index\.html remote-before\.txt/);
  assert.match(shag('Сторож папки робота').run, /find \.; bye" > remote-before\.txt/);
  assert.equal(shag('Домен уже привязан').env.SERPENT_PERVAYA, '${{ steps.pervaya.outputs.pervaya }}');
  assert.equal(shag('сборка CI равна принятой').if, "steps.pervaya.outputs.pervaya != 'off'");
  const vykladka = i('Выкладка по FTPS');
  assert.ok(i('Сторож папки робота') < i('Первая выкладка?') && i('Первая выкладка?') < i('Домен уже привязан') && i('Домен уже привязан') < vykladka);
  assert.ok(i('сборка CI равна принятой') > i('Первая выкладка?') && i('сборка CI равна принятой') < vykladka);
});

test('SV2-O-1, SV3-Z-1, SV3-O-3, SV3-O-4 workflow: папка — по сборке и карте прежней выкладки; find и глубина — после суда корня; ошибки find — не в журнал', () => {
  const run = shag('Сторож папки робота').run;
  // П113: вместе с index.html и картой — файлы подтверждения Google корня (их сверяет сторож папки).
  assert.match(run, /mirror --no-recursion --include-glob=index\.html --include-glob=sitemap-0\.xml --include-glob=google\*\.html \. remote-top/);
  assert.match(run, /storozha-vykladki\.mjs papka remote-root\.txt remote-top\/index\.html \$SITE\/dist remote-top\/sitemap-0\.xml/);
  assert.match(run, /find \.; bye" > remote-before\.txt 2> remote-before-oshibki\.txt/);
  assert.match(run, /storozha-vykladki\.mjs glubina remote-before\.txt remote-top\/index\.html \$SITE\/dist remote-top\/sitemap-0\.xml/);
  const [iPapka, iIndeks, iFind, iGlubina] = ['papka remote-root', 'indeks remote-top', 'find .; bye', 'glubina remote-before'].map((k) => run.indexOf(k));
  assert.ok(iPapka < iIndeks && iIndeks < iFind && iFind < iGlubina, `${iPapka} ${iIndeks} ${iFind} ${iGlubina}`);
});

test('П113 workflow: файл подтверждения Google — скачивается с index.html и картой, сторож папки получает папку скачанного, mirror не трогает его (-x образцом имени сторожа)', () => {
  const run = shag('Сторож папки робота').run;
  assert.match(run, /mirror --no-recursion --include-glob=index\.html --include-glob=sitemap-0\.xml --include-glob=google\*\.html \. remote-top; bye/);
  assert.match(run, /storozha-vykladki\.mjs papka remote-root\.txt remote-top\/index\.html \$SITE\/dist remote-top\/sitemap-0\.xml remote-top\n/);
  assert.equal(typeof SV.FAJL_GOOGLE, 'object', 'нет образца имени FAJL_GOOGLE');
  const v = shag('Выкладка по FTPS').run;
  const x = ` -x '${SV.FAJL_GOOGLE.source}' `;
  assert.ok(v.includes(x), v);
  assert.ok(v.indexOf(x) < v.indexOf(' $SITE/dist/ .;'), v);
  // Образец имени — только корень: начало и конец строки якорями.
  assert.match(SV.FAJL_GOOGLE.source, /^\^google.*\\\.html\$$/);
  // SV25-O-1: пересчёт получает список корня до выкладки — файл Google, сверенный до mirror, обязан остаться.
  assert.match(shag('Пересчёт на сервере').run, /storozha-vykladki\.mjs pereschet remote-files\.txt \$SITE\/dist remote-root\.txt(\n|$)/);
});

test('SV3-O-5 workflow: главная выкладывается последней — mirror без index.html, затем put', () => {
  assert.match(shag('Выкладка по FTPS').run, /mirror [^;]*-x '\^index\\\.html\$' \$SITE\/dist\/ \.; put \$SITE\/dist\/index\.html -o index\.html; bye/);
});

test('workflow: TZ Europe/Warsaw, FTPS принудительно, сертификат проверяется, запись через временный файл', () => {
  assert.equal(job.env.TZ, 'Europe/Warsaw');
  assert.equal(job.env.SITE, 'sites/7thserpent.com');
  for (const s of ['set ftp:ssl-force true;', 'set ftp:ssl-protect-data true;', 'set ssl:verify-certificate yes;', 'set cmd:fail-exit yes;', 'set xfer:use-temp-file yes;']) assert.ok(job.env.LFTP_SET.includes(s), s);
});

test('SV2-O-2, SV2-Z-8, SV3-O-1 workflow: mirror --delete не трогает служебные записи хостера — ни папкой, ни ссылкой или файлом', () => {
  assert.match(shag('Выкладка по FTPS').run, /mirror --reverse --delete --verbose --parallel=4 -X \.well-known -X \.well-known\/ -X cgi-bin -X cgi-bin\/ /);
});

test('SV1-O-6 workflow: пароль — только через LFTP_PASSWORD и open --env-password, в команде lftp его нет', () => {
  assert.doesNotMatch(WF_TEKST, /\$SERPENT_FTP_PASSWORD/);
  for (const s of shagi.filter((x) => /lftp -e/.test(x.run ?? ''))) {
    assert.equal(s.env.LFTP_PASSWORD, '${{ secrets.SERPENT_FTP_PASSWORD }}', s.name);
    for (const stroka of s.run.split('\n').filter((x) => x.includes('lftp -e'))) assert.match(stroka, /open --env-password -u /, s.name);
  }
});

test('SV1-Z-4, SV2-O-7 workflow: сторож секретов — до выгрузки корпуса; корпус — после npm ci, перед сборкой, ключом, без сохранения ключа', () => {
  const k = shag('Корпус');
  assert.match(k.uses, /^actions\/checkout@/);
  assert.equal(k.with['ssh-key'], '${{ secrets.SERPENT_CORPUS_KEY }}');
  assert.equal(k.with.path, 'sites/7thserpent.com/input/corpus/raw');
  assert.equal(k.with['persist-credentials'], false);
  assert.ok(i('Секреты на месте') < shagi.indexOf(k));
  assert.ok(i('Зависимости') < shagi.indexOf(k) && shagi.indexOf(k) < i('Сборка с гейтами'));
  assert.deepEqual(Object.keys(shag('Секреты на месте').env).sort(), ['AC4BF_FTP_USER', 'SERPENT_CORPUS_KEY', 'SERPENT_FTP_HOST', 'SERPENT_FTP_PASSWORD', 'SERPENT_FTP_PORT', 'SERPENT_FTP_USER']);
});

test('workflow: порядок — секреты, сборка, сторож папки, домен — до выкладки; пересчёт — после', () => {
  const vykladka = i('Выкладка по FTPS');
  for (const k of ['Секреты на месте', 'Сборка с гейтами', 'Сторож папки робота', 'Домен уже привязан']) assert.ok(i(k) >= 0 && i(k) < vykladka, k);
  assert.ok(i('Пересчёт на сервере') > vykladka);
});

test('workflow: команды сторожей — те, что знает сторож; циклов оболочки нет', () => {
  const run = shagi.map((s) => s.run ?? '').join('\n');
  const komandy = [...run.matchAll(/storozha-vykladki\.mjs (\S+)/g)].map((m) => m[1]);
  assert.deepEqual(komandy.sort(), ['domen', 'glubina', 'indeks', 'papka', 'pereschet', 'pervaya', 'sekrety', 'sverka-dist'].sort());
  assert.doesNotMatch(run, /(^|[\s;])(for|while|until)\s/m);
});
