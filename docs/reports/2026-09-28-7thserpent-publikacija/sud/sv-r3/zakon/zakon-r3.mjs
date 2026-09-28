// «Судью судят», раунд 3 — линза «законные формы и ложный отказ» по коду раунда 2 (f534de5).
// Каждая проба печатает одну строку: id, что ждём от здорового пути, что дал сторож.
// Временные папки — в своей папке скретчпада, удаляются в конце.
import { mkdirSync, writeFileSync, readFileSync, rmSync, renameSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const STOROZH = SAYT + '/tools/storozha-vykladki.mjs';
const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/2a2fa1b5-b706-4952-b80c-ce6acb0f1174/scratchpad/sud/sv-r3/zakon';
const TMP = ZDES + '/tmp';
const SV = await import(pathToFileURL(STOROZH).href);
const { papka, pervayaVykladka, spisokSborki, sverkaDist, pereschet, sekrety, KLYUCHEVYE } = SV;

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const nash = (url = '/') => `<!doctype html><html><head><title>x</title><link rel="canonical" href="https://www.7thserpent.com${url}"></head><body></body></html>`;
const zaglushka = '<html><head><title>Сайт створено</title></head><body><h1>Сайт успішно створено</h1><img src="logo.png"></body></html>';
const PRIN = JSON.parse(readFileSync(SAYT + '/gates/sborka-prinyataya.json', 'utf8'));
const VERKH_PRIN = [...new Set(Object.keys(PRIN.fajly).map((f) => f.split('/')[0]))];
const DIST_VERKH = readdirSync(SAYT + '/dist');
const vyvod = (id, zhdem, r) => console.log(`${id} | ждём: ${zhdem} | сторож: ${r.ok ? 'ПРОХОД' : 'ОТКАЗ'} — ${r.stroki.join(' / ').slice(0, 420)}`);

/** Папка «верх сборки» для команды papka: имена первого уровня (пустые файлы и папки). */
function verkhPapka(imya, imena) {
  const d = join(TMP, imya);
  mkdirSync(d, { recursive: true });
  for (const n of imena) {
    if (/\.[a-z0-9]+$/i.test(n) || n.startsWith('.')) writeFileSync(join(d, n), '');
    else mkdirSync(join(d, n), { recursive: true });
  }
  return d;
}
function komanda(argi, env = {}) {
  const r = spawnSync(process.execPath, [STOROZH, ...argi], { encoding: 'utf8', env: { ...process.env, ...env } });
  return { ok: r.status === 0, kod: r.status, stroki: [`код ${r.status}: ${(r.stdout + r.stderr).trim()}`] };
}
const cls = (imena) => ['./', '../', ...imena].join('\n') + '\n';
const kornevye = (imena) => imena.map((n) => (DIST_VERKH.includes(n) && !/\.[a-z0-9]+$/i.test(n) && !n.startsWith('.') ? n + '/' : n));

/* ---------- Z1: сайт потерял страницу, добавленную после принятого списка ---------- */
{
  // Выкладка N добавила /max-payne-4/ (страница после принятого списка), выкладка N+1 её убрала (или переименовала).
  const distN1 = verkhPapka('dist-bez-mp4', DIST_VERKH);
  const index = join(TMP, 'index-nash.html');
  writeFileSync(index, nash('/'));
  const root = join(TMP, 'root-z1.txt');
  writeFileSync(root, cls(kornevye([...DIST_VERKH, 'max-payne-4/'])));
  vyvod('Z1a сайт потерял страницу max-payne-4/ (добавлена после принятого списка) — команда papka как в workflow', 'проход (mirror --delete уберёт свою старую страницу)', komanda(['papka', root, index, distN1]));
  const distRen = verkhPapka('dist-ren', [...DIST_VERKH, 'max-payne-4-remaster']);
  vyvod('Z1b страница переименована max-payne-4/ → max-payne-4-remaster/', 'проход', komanda(['papka', root, index, distRen]));
  const root2 = join(TMP, 'root-z1c.txt');
  writeFileSync(root2, cls(kornevye([...DIST_VERKH, 'og-2027.png'])));
  vyvod('Z1c сайт убрал свой файл верха og-2027.png (добавлен после принятого списка)', 'проход', komanda(['papka', root2, index, distN1]));
  // Контроль: страница из принятого списка, убранная из dist, — проход (принятый список её знает).
  const distBezRemake = verkhPapka('dist-bez-remake', DIST_VERKH.filter((n) => n !== 'remake'));
  const root3 = join(TMP, 'root-z1d.txt');
  writeFileSync(root3, cls(kornevye(DIST_VERKH)));
  vyvod('Z1d (контроль) убрана remake/ из принятого списка', 'проход', komanda(['papka', root3, index, distBezRemake]));
}

/* ---------- Z2: оборванная первая выкладка в порядке mirror (файлы корня — до папок) ---------- */
{
  const V = [...DIST_VERKH];
  for (const [id, imena] of [
    ['Z2a оборвана на файлах корня: .htaccess, apple-touch-icon.png, favicon-16x16.png, .in.favicon-32x32.png.', ['.htaccess', '.in.favicon-32x32.png.', 'apple-touch-icon.png', 'favicon-16x16.png']],
    ['Z2b оборвана на index.html: все файлы корня до него и .in.index.html.', ['.htaccess', '.in.index.html.', 'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon.ico', 'favicon.svg', 'icon-192.png']],
  ]) vyvod(id, 'отказ со своей причиной «оборванная первая выкладка»', papka(cls(imena), null, V));
}

/* ---------- Z3: имена файлов в строке отказа — «с именами доменов» ---------- */
{
  const V = [...new Set([...DIST_VERKH, ...VERKH_PRIN])];
  vyvod('Z3a наш корень и свой старый файл favicon-48x48.png', 'имя файла названо (или проход — см. Z1)', papka(cls(kornevye([...DIST_VERKH, 'favicon-48x48.png'])), nash('/'), V));
  vyvod('Z3b свежий каталог: заглушка index.html и logo.png хостера', 'отказ с именем logo.png, без «доменов»', papka(cls(['index.html', 'logo.png']), zaglushka, V));
  vyvod('Z3c WordPress рядом с нашей выкладкой (образец SV2-O-1 P1a)', 'отказ с именами wp-*', papka(cls(['_astro/', 'index.html', 'wp-admin/', 'wp-content/', 'wp-config.php']), nash('/'), V));
  vyvod('Z3d (контроль) папки доменов без отметки типа', 'отказ без имён доменов', papka(cls(['7dtd.com.pl', 'ac4bf-thewatch.com']), null, V));
}

/* ---------- сборка во временной папке ---------- */
const CID_YADRA = 'm3tnyskv';
const CID_SAYTA = 'abcd1234';
function sborka(imya, dop = {}) {
  const d = join(TMP, imya);
  const html = (url, css) => nash(url).replace('<body>', `<body><div data-astro-cid-${CID_YADRA}><p data-astro-cid-${CID_SAYTA}>x</p></div><link rel="stylesheet" href="/_astro/${css}"><img src="/_astro/a.webp" srcset="/_astro/a.webp 1200w" alt="">`);
  const fajly = {
    'index.html': html('/', 'index.AAAAAAAA.css'),
    '.htaccess': 'ErrorDocument 404 /404/index.html\n',
    'robots.txt': 'User-agent: *\nAllow: /\n',
    '404/index.html': html('/404/', 'index.AAAAAAAA.css'),
    'privacy/index.html': html('/privacy/', 'index.AAAAAAAA.css'),
    'sitemap-index.xml': '<x/>',
    'sitemap-0.xml': '<y/>',
    '_astro/index.AAAAAAAA.css': `.a[data-astro-cid-${CID_YADRA}]{color:red}`,
    '_astro/a.webp': 'RIFF',
    ...dop,
  };
  for (const [f, t] of Object.entries(fajly)) {
    mkdirSync(join(d, f, '..'), { recursive: true });
    writeFileSync(join(d, f), t);
  }
  return d;
}
const zamenitV = (d, f, iz, na) => writeFileSync(join(d, f), readFileSync(join(d, f), 'utf8').split(iz).join(na));

/* ---------- Z4: пара CSS с одним именем и одинаковым содержимым с точностью до cid ---------- */
{
  // Две страницы (обе index.astro в своих папках) с одинаковым стилем области: сборщик даёт два файла index.*.css,
  // содержимое различается только значением cid (своя область у каждого компонента).
  const d = sborka('z4', {
    '_astro/index.BBBBBBBB.css': `.a[data-astro-cid-${CID_SAYTA}]{color:red}`,
    'privacy/index.html': nash('/privacy/').replace('<body>', `<body><p data-astro-cid-${CID_SAYTA}>x</p><link rel="stylesheet" href="/_astro/index.BBBBBBBB.css">`),
  });
  const prin = { sborka: 'prinyataya', ...spisokSborki(d) };
  // Раннер: cid ядра иной везде; CSS с cid ядра получает иное имя (хеш содержимого), ссылки — тоже; CSS сайта — как был.
  for (const f of ['index.html', '404/index.html', 'privacy/index.html', '_astro/index.AAAAAAAA.css', '_astro/index.BBBBBBBB.css']) zamenitV(d, f, CID_YADRA, '545q7pxz');
  renameSync(join(d, '_astro/index.AAAAAAAA.css'), join(d, '_astro/index.ZZZZZZZZ.css'));
  for (const f of ['index.html', '404/index.html']) zamenitV(d, f, 'index.AAAAAAAA.css', 'index.ZZZZZZZZ.css');
  vyvod('Z4 пара index.*.css, различие — только значение cid; на раннере переименована одна', 'проход (законное переименование)', sverkaDist(d, prin));
  console.log('   ключи norm принятой:', Object.keys(prin.norm).filter((k) => k.endsWith('.css') || k.includes('~')).join(', '));
}

/* ---------- Z5: /_astro/ в тексте, который не ссылка ---------- */
{
  for (const [id, robots] of [
    ['Z5a robots.txt: Allow: /_astro/*', 'User-agent: *\nAllow: /\nAllow: /_astro/*\n'],
    ['Z5b robots.txt: комментарий «/_astro/… stylesheets»', '# What is deliberately NOT blocked:\n#   /_astro/… stylesheets and fonts\nUser-agent: *\nAllow: /\n'],
    ['Z5c robots.txt: Disallow: /_astro/*.map$', 'User-agent: *\nAllow: /\nDisallow: /_astro/*.map$\n'],
  ]) {
    const d = sborka('z5-' + id.slice(0, 3), { 'robots.txt': robots });
    const prin = { sborka: 'prinyataya', ...spisokSborki(d) };
    vyvod(id + ' — та же сборка против своего же списка', 'проход', sverkaDist(d, prin));
    console.log(`   spisok (так пишется принятый список): bityeSsylki=${JSON.stringify(prin.bityeSsylki)} — команда spisok кода отказа не даёт`);
  }
  // Контроль: ссылки с ?, #, srcset с шириной, url() в CSS, JSON-LD, шрифт в CSS — законны.
  const d = sborka('z5-kontrol', {
    'index.html': nash('/').replace('<body>', `<body><link rel="stylesheet" href="/_astro/index.AAAAAAAA.css?v=1"><a href="/_astro/a.webp#x">x</a><img srcset="/_astro/a.webp 480w,/_astro/a.webp 960w" src="/_astro/a.webp"><script type="application/ld+json">{"image":"https://www.7thserpent.com/_astro/a.webp"}</script>`),
    '_astro/index.AAAAAAAA.css': `@font-face{src:url(/_astro/f.woff2) format("woff2"),url("/_astro/f.woff") format("woff")}.a[data-astro-cid-${CID_YADRA}]{background:url('/_astro/a.webp')}`,
    '_astro/f.woff2': 'wOF2',
    '_astro/f.woff': 'wOFF',
  });
  vyvod('Z5k (контроль) ?, #, srcset с шириной, url() и шрифты в CSS, JSON-LD', 'проход', sverkaDist(d, { sborka: 'p', ...spisokSborki(d) }));
}

/* ---------- Z6: .well-known/ в dist (security.txt) — пересчёт ---------- */
{
  const d = sborka('z6', { '.well-known/security.txt': 'Contact: mailto:x@7thserpent.com\n' });
  const fajly = Object.keys(spisokSborki(d).fajly);
  const find = ['./', ...fajly.map((f) => './' + f), './_astro/', './404/', './privacy/', './.well-known/'].join('\n') + '\n';
  vyvod('Z6 dist с .well-known/security.txt, файл на сервере есть (find его показывает)', 'проход (или ясный отказ «mirror -X его не выкладывает»)', pereschet(find, d));
}

/* ---------- держит: законные формы раунда 2 ---------- */
{
  const findReal = ['./', ...Object.keys(PRIN.fajly).map((f) => './' + f), './_astro/', './404/', './privacy/', './.well-known/', './.well-known/acme-challenge/', './.well-known/acme-challenge/tok'].join('\n') + '\n';
  const p = (id, zhdem, r) => console.log(`${id} | ждём: ${zhdem} | сторож: pervaya=${r.pervaya ? 'on' : 'off'} — ${r.pochemu}`);
  p('D1 вторая выкладка (ящик): наш index.html, find полной сборки 816ba46 и .well-known/', 'off', pervayaVykladka('off', nash('/'), findReal));
  p('D2 то же, find с CRLF', 'off', pervayaVykladka('off', nash('/'), findReal.replace(/\n/g, '\r\n')));
  p('D3 то же, find без ./ (вывод от find без аргумента)', 'off', pervayaVykladka('off', nash('/'), findReal.replace(/\.\//g, '')));
  p('D4 вход по умолчанию на push (пустая строка → off в workflow)', 'off', pervayaVykladka('off', nash('/'), findReal));
  const big = findReal + Array.from({ length: 20000 }, (_, i) => `./_astro/x${i}.webp`).join('\n');
  p('D5 большой список (20 000 строк)', 'off', pervayaVykladka('off', nash('/'), big));
  p('D6 пустой вывод find (пустой корень)', 'on', pervayaVykladka('off', null, ''));
  const V = [...new Set([...DIST_VERKH, ...VERKH_PRIN])];
  vyvod('D7 вторая выкладка: корень = верх 816ba46, .well-known/, cgi-bin@, .in.robots.txt.', 'проход', papka(cls(kornevye([...VERKH_PRIN, '.well-known/', 'cgi-bin@', '.in.robots.txt.'])), nash('/'), V));
  vyvod('D8 сайт получил страницу: новая папка в dist, на сервере её ещё нет', 'проход', papka(cls(kornevye(VERKH_PRIN)), nash('/'), [...V, 'max-payne-4']));
  const S = { SERPENT_FTP_HOST: 'ax572417.ftp.tools', SERPENT_FTP_PORT: '21', SERPENT_FTP_USER: 'ax572417_serpent', SERPENT_FTP_PASSWORD: 'x', SERPENT_CORPUS_KEY: 'k', AC4BF_FTP_USER: 'ax572417_claude' };
  vyvod('D9 секреты: хост ax572417.ftp.tools, порт 21, логин ax572417_serpent (первый — ax572417_claude)', 'проход', sekrety(S));
  vyvod('D10 секреты: логин робота = ax572417_claude (робот первого сайта)', 'отказ', sekrety({ ...S, SERPENT_FTP_USER: 'ax572417_claude' }));
  const bezPervaya = { ...process.env };
  delete bezPervaya.SERPENT_PERVAYA;
  const r = spawnSync(process.execPath, [STOROZH, 'domen'], { encoding: 'utf8', env: bezPervaya });
  console.log(`D11 domen вне GitHub без SERPENT_PERVAYA | ждём: код 2, ясная строка, без сети | код ${r.status}: ${(r.stdout + r.stderr).trim()}`);
  const outF = join(TMP, 'out.txt');
  writeFileSync(outF, '');
  const idx = join(TMP, 'index-nash.html');
  const fnd = join(TMP, 'find.txt');
  writeFileSync(fnd, findReal);
  const env2 = { ...process.env, SERPENT_FIRST: 'off', GITHUB_ACTIONS: 'true', GITHUB_OUTPUT: outF };
  const r2 = spawnSync(process.execPath, [STOROZH, 'pervaya', idx, fnd], { encoding: 'utf8', env: env2 });
  console.log(`D12 pervaya на GitHub, вторая выкладка | ждём: код 0, pervaya=off | код ${r2.status}: ${(r2.stdout + r2.stderr).trim()}; GITHUB_OUTPUT=${JSON.stringify(readFileSync(outF, 'utf8'))}`);
  const env3 = { ...process.env, SERPENT_FIRST: 'off' };
  delete env3.GITHUB_ACTIONS;
  delete env3.GITHUB_OUTPUT;
  const r3 = spawnSync(process.execPath, [STOROZH, 'pervaya', idx, fnd], { encoding: 'utf8', env: env3 });
  console.log(`D13 pervaya вне GitHub | ждём: код 0 | код ${r3.status}: ${(r3.stdout + r3.stderr).trim()}`);
}

rmSync(TMP, { recursive: true, force: true });
console.log('временные папки удалены:', !readdirSync(ZDES).includes('tmp'));
