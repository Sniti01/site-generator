// Судья головы и крошек ядра (`core/gates/head.mjs`, прежний `tools/glowa.mjs --selftest`) на страницах
// сайта (П102 блок Б): мутации прежней самопроверки — тестами нового судьи. Множество видов отказа —
// ровно ожидаемое (раунд 1 пачки 0, R1-GLOWA-2). Где новый судья говорит иначе, чем прежний, — у мутации
// пометка «РАСХОЖДЕНИЕ» с причиной (доклад сессии 20).
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { suditNabor, stranicyDist } from '@factory/core/gates/head.mjs';
import { ozhidanie } from '../../gates/head.mjs';
import { stranica, dist, SAYT } from './obshchee.mjs';

const struktura = JSON.parse(readFileSync(join(SAYT, 'structure/structure.json'), 'utf8'));
const domen = struktura.site.domain.replace(/\/+$/, '');

/** Литеральная страница третьего уровня (`/max-payne-3/guide/`), написанная руками, а не судьёй. */
function stranicaGuide() {
  const h3 = struktura.pages.find((p) => p.url === '/max-payne-3/').h1;
  const hg = struktura.pages.find((p) => p.url === '/max-payne-3/guide/').h1;
  const list = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${domen}/` },
      { '@type': 'ListItem', position: 2, name: h3, item: `${domen}/max-payne-3/` },
      { '@type': 'ListItem', position: 3, name: hg, item: `${domen}/max-payne-3/guide/` },
    ],
  };
  return {
    h3,
    hg,
    html:
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>x</title>' +
      `<link rel="canonical" href="${domen}/max-payne-3/guide/">` +
      '<meta property="og:type" content="website"><meta property="og:site_name" content="7th Serpent">' +
      `<script type="application/ld+json">${JSON.stringify(list)}</script></head><body>` +
      '<nav class="crumbs" aria-label="Breadcrumbs"><ol class="crumbs__list container t-caption">' +
      '<li class="crumbs__item"><a class="crumbs__link" href="/">Home</a><span class="crumbs__sep" aria-hidden="true">/</span></li>' +
      `<li class="crumbs__item"><a class="crumbs__link" href="/max-payne-3/">${h3}</a><span class="crumbs__sep" aria-hidden="true">/</span></li>` +
      `<li class="crumbs__item"><span class="crumbs__current" aria-current="page">${hg}</span></li>` +
      '</ol></nav><main id="content"><h1>x</h1></main></body></html>',
  };
}

test('голова и крошки: мутации прежней самопроверки', async (t) => {
  const glav = stranica('/');
  const s404 = stranica('/404/');
  const { html: guide, h3, hg } = stranicaGuide();
  const zamena = (s, iz, na) => {
    if (!s.includes(iz)) throw new Error(`мутация не применилась бы: нет «${iz.slice(0, 60)}»`);
    return s.replace(iz, () => na);
  };
  const siteNameTeg = (s) => s.match(/<meta property="og:site_name"[^>]*>/)[0];
  const ldBlok = (s, tip) => s.match(new RegExp(`<script type="application/ld\\+json">[^<]*"@type":"${tip}"[^<]*</script>`))[0];
  const webSite = ldBlok(glav, 'WebSite');
  const guideList = ldBlok(guide, 'BreadcrumbList');
  const kroshki404 = s404.match(/<nav\b[^>]*class="crumbs[^>]*>[\s\S]*?<\/nav>/)[0];
  const perestavit = (html, blok) => {
    const obj = JSON.parse(blok.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
    const z = obj.itemListElement;
    obj.itemListElement = [z[0], z[2], z[1]];
    return zamena(html, blok, `<script type="application/ld+json">${JSON.stringify(obj)}</script>`);
  };
  const G = '/max-payne-3/guide/';
  const proby = [
    ['чистые: главная, /404/, литеральная /max-payne-3/guide/', { '/': glav, '/404/': s404, [G]: guide }, null],
    ['og:site_name: атрибуты в обратном порядке и в одинарных кавычках — законно', { '/': zamena(glav, siteNameTeg(glav), "<meta content='7th Serpent' property='og:site_name'>") }, null],
    ['og:site_name: значение сущностями — законно', { '/': zamena(glav, siteNameTeg(glav), '<meta property="og:site_name" content="7th&#32;Serpent">') }, null],
    ['og:site_name снят', { '/': zamena(glav, siteNameTeg(glav), '') }, ['og:site_name']],
    ['og:site_name — домен вместо имени', { '/': zamena(glav, siteNameTeg(glav), '<meta property="og:site_name" content="7thserpent.com">') }, ['og:site_name']],
    ['og:site_name дважды', { '/404/': zamena(s404, siteNameTeg(s404), siteNameTeg(s404) + siteNameTeg(s404)) }, ['og:site_name']],
    ['og:site_name перенесён в <body>', { '/404/': zamena(zamena(s404, siteNameTeg(s404), ''), '<main', siteNameTeg(s404) + '<main') }, ['og:site_name']],
    ['og:site_name только в комментарии', { '/': zamena(glav, siteNameTeg(glav), `<!-- ${siteNameTeg(glav)} -->`) }, ['og:site_name']],
    ['WebSite снят с главной', { '/': zamena(glav, webSite, '') }, ['WebSite']],
    ['WebSite только в комментарии', { '/': zamena(glav, webSite, `<!-- ${webSite} -->`) }, ['WebSite']],
    ['WebSite: name — домен', { '/': zamena(glav, '"name":"7th Serpent"', '"name":"7thserpent.com"') }, ['WebSite']],
    ['WebSite: alternateName — другой', { '/': zamena(glav, '"alternateName":"7thserpent.com"', '"alternateName":"7th Serpent"') }, ['WebSite']],
    ['WebSite: url без www', { '/': zamena(glav, '"url":"https://www.7thserpent.com/"', '"url":"https://7thserpent.com/"') }, ['WebSite']],
    ['WebSite: url без слэша', { '/': zamena(glav, '"url":"https://www.7thserpent.com/"', '"url":"https://www.7thserpent.com"') }, ['WebSite']],
    ['WebSite: url по http', { '/': zamena(glav, '"url":"https://www.7thserpent.com/"', '"url":"http://www.7thserpent.com/"') }, ['WebSite']],
    ['WebSite: лишний ключ', { '/': zamena(glav, '"url":"https://www.7thserpent.com/"', '"url":"https://www.7thserpent.com/","potentialAction":{}') }, ['WebSite']],
    ['WebSite: @context по http', { '/': zamena(glav, '"@context":"https://schema.org","@type":"WebSite"', '"@context":"http://schema.org","@type":"WebSite"') }, ['WebSite']],
    ['WebSite дважды, второй — тип скрипта заглавными', { '/': zamena(glav, webSite, webSite + webSite.replace('application/ld+json', 'Application/LD+JSON')) }, ['WebSite']],
    ['WebSite на /404/', { '/404/': zamena(s404, '</head>', webSite + '</head>') }, ['WebSite']],
    ['WebSite в @graph', { '/': zamena(glav, webSite, webSite.replace(/>(\{[^<]*\})</, (...g) => `>{"@context":"https://schema.org","@graph":[${g[1]}]}<`)) }, ['JSON-LD', 'WebSite']],
    ['JSON-LD не разбирается', { '/': zamena(glav, '"url":"https://www.7thserpent.com/"}', '"url":"https://www.7thserpent.com/",}') }, ['JSON-LD', 'WebSite']],
    ['JSON-LD чужого типа', { '/404/': zamena(s404, '</head>', '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"x"}</script></head>') }, ['JSON-LD']],
    ['canonical главной — без www', { '/': zamena(glav, 'rel="canonical" href="https://www.7thserpent.com/"', 'rel="canonical" href="https://7thserpent.com/"') }, ['canonical', 'WebSite']],
    ['canonical дважды', { '/404/': zamena(s404, '</head>', '<link rel="canonical" href="https://www.7thserpent.com/404/"></head>') }, ['canonical']],
    ['BreadcrumbList на главной', { '/': zamena(glav, '</head>', guideList + '</head>') }, ['BreadcrumbList']],
    ['BreadcrumbList на /404/', { '/404/': zamena(s404, '</head>', guideList + '</head>') }, ['BreadcrumbList']],
    ['guide: BreadcrumbList снят', { [G]: zamena(guide, guideList, '') }, ['BreadcrumbList']],
    ['guide: position звена 2 — 9', { [G]: zamena(guide, '"position":2', '"position":9') }, ['BreadcrumbList']],
    ['guide: звенья 2 и 3 местами (с их position)', { [G]: perestavit(guide, guideList) }, ['BreadcrumbList']],
    ['guide: name звена ≠ h1', { [G]: zamena(guide, `"name":"${hg}"`, '"name":"Max Payne 3 guide"') }, ['BreadcrumbList']],
    ['guide: item относительный', { [G]: zamena(guide, `"item":"${domen}/max-payne-3/"`, '"item":"/max-payne-3/"') }, ['BreadcrumbList']],
    ['guide: лишнее звено', { [G]: zamena(guide, ']}</script>', ',{"@type":"ListItem","position":4,"name":"x","item":"https://www.7thserpent.com/x/"}]}</script>') }, ['BreadcrumbList']],
    ['guide: position строкой', { [G]: zamena(guide, '"position":1', '"position":"1"') }, ['BreadcrumbList']],
    ['guide: видимые крошки сняты', { [G]: guide.replace(/<nav[\s\S]*<\/nav>/, '') }, ['крошки']],
    ['guide: видимый ярлык ≠ h1', { [G]: zamena(guide, `>${h3}<`, '>Max Payne 3: São Paulo<') }, ['крошки']],
    ['guide: ссылка звена на чужой адрес', { [G]: zamena(guide, 'href="/max-payne-3/"', 'href="/max-payne-2/"') }, ['крошки']],
    ['guide: последнее звено без aria-current', { [G]: zamena(guide, '<span class="crumbs__current" aria-current="page">', '<span class="crumbs__current">') }, ['крошки']],
    ['guide: последнее звено — ссылка crumbs__link', { [G]: zamena(guide, `<span class="crumbs__current" aria-current="page">${hg}</span>`, `<a class="crumbs__link" href="/max-payne-3/guide/">${hg}</a>`) }, ['крошки']],
    ['главная: видимые крошки', { '/': zamena(glav, '<main', kroshki404 + '<main') }, ['крошки']],
    ['/404/: видимые крошки сняты', { '/404/': zamena(s404, kroshki404, '') }, ['крошки']],
    ['страница вне структуры', { '/nie-ma/': s404 }, ['вне структуры']],
    ['сборка без главной', { '/404/': s404 }, ['главной нет']],
    ['пустая сборка', {}, ['пусто']],
    ['/404/: canonical перенесён в <body>', { '/404/': zamena(zamena(s404, '<link rel="canonical" href="https://www.7thserpent.com/404/">', ''), '<main', '<link rel="canonical" href="https://www.7thserpent.com/404/"><main') }, ['canonical']],
    ['/404/: canonical на другой адрес', { '/404/': zamena(s404, 'href="https://www.7thserpent.com/404/"', 'href="https://www.7thserpent.com/"') }, ['canonical']],
    // РАСХОЖДЕНИЕ: прежний судья резал голову по первому </head> и без него не судил ничего («головы нет»,
    // canonical, og:site_name); разборщик браузера строит <head> и без закрывающего тега — голова та же,
    // страница по договору.
    ['/404/: </head> снят — голову строит разборщик', { '/': glav, '/404/': zamena(s404, '</head>', '') }, null],
    ['/404/: JSON-LD не разбирается', { '/404/': zamena(s404, '</head>', '<script type="application/ld+json">{"@type":"WebSite",}</script></head>') }, ['JSON-LD']],
    ['/404/: JSON-LD — массив', { '/404/': zamena(s404, '</head>', '<script type="application/ld+json">[]</script></head>') }, ['JSON-LD']],
    ['/404/: JSON-LD — null', { '/404/': zamena(s404, '</head>', '<script type="application/ld+json">null</script></head>') }, ['JSON-LD']],
    ['guide: BreadcrumbList перенесён в <body>', { [G]: zamena(zamena(guide, guideList, ''), '<main', guideList + '<main') }, ['JSON-LD']],
    ['guide: лишний ключ списка', { [G]: zamena(guide, '"@type":"BreadcrumbList"', '"@type":"BreadcrumbList","name":"x"') }, ['BreadcrumbList']],
    ['guide: @context списка по http', { [G]: zamena(guide, '"@context":"https://schema.org","@type":"BreadcrumbList"', '"@context":"http://schema.org","@type":"BreadcrumbList"') }, ['BreadcrumbList']],
    ['guide: лишний ключ звена', { [G]: zamena(guide, '"position":1,', '"position":1,"url":"x",') }, ['BreadcrumbList']],
    ['guide: @type звена не ListItem', { [G]: zamena(guide, '{"@type":"ListItem","position":2', '{"@type":"Thing","position":2') }, ['BreadcrumbList']],
    ['guide: звено 2 — null', { [G]: guide.replace(/\{"@type":"ListItem","position":2,[^}]*\}/, 'null') }, ['BreadcrumbList']],
    ['guide: звено 2 — строка', { [G]: guide.replace(/\{"@type":"ListItem","position":2,[^}]*\}/, '"x"') }, ['BreadcrumbList']],
    ['guide: </script> в имени звена без экранирования', { [G]: zamena(guide, `"name":"${hg}`, `"name":"</script>${hg}`) }, ['JSON-LD', 'BreadcrumbList']],
    ['guide: среднее видимое звено снято', { [G]: guide.replace(/<li class="crumbs__item"><a class="crumbs__link" href="\/max-payne-3\/">[^<]*<\/a><span[^>]*>\/<\/span><\/li>/, '') }, ['крошки']],
    ['guide: среднее звено текущим, не ссылкой', { [G]: guide.replace(/<a class="crumbs__link" href="\/max-payne-3\/">([^<]*)<\/a>/, '<span class="crumbs__current" aria-current="page">$1</span>') }, ['крошки']],
    ['guide: две nav.crumbs', { [G]: guide.replace(/(<nav[\s\S]*<\/nav>)/, '$1$1') }, ['крошки']],
    ['guide: лишняя ссылка без класса в крошках', { [G]: zamena(guide, '</ol></nav>', '<li><a href="/x/">x</a></li></ol></nav>') }, ['крошки']],
    ['guide: nav.crumbs без aria-label', { [G]: zamena(guide, ' aria-label="Breadcrumbs"', '') }, ['крошки']],
    ['og:site_name только внутри <script>', { '/': zamena(glav, siteNameTeg(glav), `<script>var s='${siteNameTeg(glav)}';</script>`) }, ['og:site_name']],
    ['og:site_name только внутри <template>', { '/': zamena(glav, siteNameTeg(glav), `<template>${siteNameTeg(glav)}</template>`) }, ['og:site_name']],
    ['og:site_name только внутри <noscript>', { '/': zamena(glav, siteNameTeg(glav), `<noscript>${siteNameTeg(glav)}</noscript>`) }, ['noscript']],
    ['og:site_name только внутри <title>', { '/': zamena(zamena(glav, siteNameTeg(glav), ''), '</title>', siteNameTeg(glav) + '</title>') }, ['og:site_name']],
    ['второй og:site_name через name= с другим значением', { '/404/': zamena(s404, '</head>', '<meta name="og:site_name" content="Max Payne Wiki"></head>') }, ['og:site_name']],
    ['WebSite только внутри <template>', { '/': zamena(glav, webSite, `<template>${webSite}</template>`) }, ['WebSite']],
    ['WebSite тегом script-x', { '/': zamena(glav, webSite, webSite.replace('<script ', '<script-x ').replace('</script>', '</script-x>')) }, ['WebSite']],
    ['guide: родитель вне структуры', { [G]: guide }, ['структура'], { [G]: { parent: '/nie-ma/' } }],
    ['/404/: второй og:site_name с чужим значением в <noscript>', { '/404/': zamena(s404, '</head>', '<noscript><meta property="og:site_name" content="Max Payne Wiki"></noscript></head>') }, ['og:site_name', 'noscript']],
    ['/404/: второй canonical в <noscript>', { '/404/': zamena(s404, '</head>', '<noscript><link rel="canonical" href="https://www.7thserpent.com/"></noscript></head>') }, ['canonical', 'noscript']],
    // <script> внутри <noscript> головы разборщик без скриптов выносит из <noscript> — вид «noscript» даёт
    // второе прочтение, со скриптами: разметка головы двух прочтений разная (раунд 1 блока Б, B1-G-1; было
    // РАСХОЖДЕНИЕ «только WebSite» — снято, итог как у прежнего судьи).
    ['главная: второй WebSite в <noscript>', { '/': zamena(glav, webSite, webSite + `<noscript>${webSite}</noscript>`) }, ['WebSite', 'noscript']],
    ['главная: единственный WebSite в <noscript> головы (B1-G-1)', { '/': zamena(glav, webSite, `<noscript>${webSite}</noscript>`) }, ['noscript']],
    ['/404/: второй og между строками «<noscript>» и «</noscript>» двух скриптов', { '/404/': zamena(s404, '</head>', '<script>var a="<noscript>";</script><meta property="og:site_name" content="Max Payne Wiki"><script>var b="</noscript>";</script></head>') }, ['og:site_name']],
    ['/404/: законный og между строками «<template>» и «</template>» скриптов — сверено', { '/': glav, '/404/': zamena(zamena(s404, siteNameTeg(s404), ''), '</head>', `<script>var a="<template>";</script>${siteNameTeg(s404)}<script>var b="</template>";</script></head>`) }, null],
    ['главная: WebSite только внутри <title>', { '/': zamena(zamena(glav, webSite, ''), '</title>', webSite + '</title>') }, ['WebSite']],
    ['главная: WebSite только внутри <style>', { '/': zamena(glav, webSite, `<style>${webSite}</style>`) }, ['WebSite']],
    ['главная: WebSite только внутри <TEMPLATE>', { '/': zamena(glav, webSite, `<TEMPLATE>${webSite}</TEMPLATE>`) }, ['WebSite']],
    ['главная: og:site_name только внутри <style>', { '/': zamena(glav, siteNameTeg(glav), `<style>${siteNameTeg(glav)}</style>`) }, ['og:site_name']],
    ['/404/: второй og:site_name с property заглавными', { '/404/': zamena(s404, '</head>', '<meta property="OG:site_name" content="Max Payne Wiki"></head>') }, ['og:site_name']],
    ['/404/: второй canonical с rel из двух слов', { '/404/': zamena(s404, '</head>', '<link rel="canonical alternate" href="https://www.7thserpent.com/"></head>') }, ['canonical']],
    ['главная: второй WebSite с типом скрипта в пробелах', { '/': zamena(glav, webSite, webSite + webSite.replace('type="application/ld+json"', 'type=" application/ld+json "')) }, ['WebSite']],
    ['/404/: canonical снят', { '/404/': zamena(s404, '<link rel="canonical" href="https://www.7thserpent.com/404/">', '') }, ['canonical']],
    ['/404/: JSON-LD — строка', { '/404/': zamena(s404, '</head>', '<script type="application/ld+json">"x"</script></head>') }, ['JSON-LD']],
    ['guide: BreadcrumbList дважды', { [G]: zamena(guide, guideList, guideList + guideList) }, ['BreadcrumbList']],
    ['guide: цикл в parent', { [G]: guide }, ['структура'], { '/max-payne-3/': { parent: '/max-payne-3/guide/' } }],
    ['guide: ссылка внутри текущего звена', { [G]: zamena(guide, 'aria-current="page">', 'aria-current="page"><a class="crumbs__link" href="/evil/">x</a>') }, ['крошки']],
    ['guide: ссылка внутри разделителя', { [G]: zamena(guide, '<span class="crumbs__sep" aria-hidden="true">/</span></li><li class="crumbs__item"><span', '<span class="crumbs__sep" aria-hidden="true"><a href="/evil/">/</a></span></li><li class="crumbs__item"><span') }, ['крошки']],
    ['guide: незакрытая лишняя <a> в конце крошек', { [G]: zamena(guide, '</ol></nav>', '<a href="/evil/">x</ol></nav>') }, ['крошки']],
    ['guide: среднее звено — <a> без класса на верный адрес', { [G]: zamena(guide, '<a class="crumbs__link" href="/max-payne-3/">', '<a href="/max-payne-3/">') }, ['крошки']],
    ['guide: aria-label из пробела', { [G]: zamena(guide, 'aria-label="Breadcrumbs"', 'aria-label=" "') }, ['крошки']],
    // РАСХОЖДЕНИЕ (правка дефекта прежнего судьи, бэклог 61 п. 3: висячий aria-labelledby): имя навигации через
    // aria-labelledby законно, только если ссылка ведёт на элемент страницы с текстом.
    ['guide: имя навигации через aria-labelledby на элемент с текстом — законно', { '/': glav, [G]: zamena(zamena(guide, 'aria-label="Breadcrumbs"', 'aria-labelledby="kroshki-imya"'), '<body>', '<body><span id="kroshki-imya" hidden>Breadcrumbs</span>') }, null],
    ['guide: висячий aria-labelledby (элемента нет)', { [G]: zamena(guide, 'aria-label="Breadcrumbs"', 'aria-labelledby="x"') }, ['крошки']],
    ['guide: aria-labelledby на пустой элемент', { [G]: zamena(zamena(guide, 'aria-label="Breadcrumbs"', 'aria-labelledby="pusto"'), '<body>', '<body><span id="pusto"></span>') }, ['крошки']],
    ['guide: вложенная nav в крошках (бэклог 61 п. 3)', { [G]: zamena(guide, '</ol></nav>', '</ol><nav>x</nav></nav>') }, ['крошки']],
  ];
  for (const [imya, stranicy, zhdem, pravkaStruktury] of proby) {
    await t.test(imya, () => {
      const nabor = Object.entries(stranicy).map(([url, html]) => ({ url, html }));
      const polnyi = [...nabor];
      if (zhdem && !['главной нет', 'пусто'].some((v) => zhdem.includes(v)) && !stranicy['/']) polnyi.push({ url: '/', html: glav });
      const s = pravkaStruktury ? { ...struktura, pages: struktura.pages.map((p) => (pravkaStruktury[p.url] ? { ...p, ...pravkaStruktury[p.url] } : p)) } : struktura;
      const otkazy = suditNabor(polnyi, s, ozhidanie);
      const vidy = new Set(otkazy.map((o) => o.vid));
      if (zhdem === null) assert.deepEqual(otkazy, []);
      else assert.deepEqual([...vidy].sort(), [...new Set(zhdem)].sort(), otkazy.map((o) => `${o.url}: [${o.vid}] ${o.chto}`).join(' | '));
    });
  }
});

test('сборка: все страницы по договору (контроль по dist копии)', () => {
  // Страницы — из сборки, как у интеграции (в структуре есть и несобранная /privacy/; B1-G-17).
  const stranicy = stranicyDist(dist()).map((s) => ({ url: s.url, html: readFileSync(s.file, 'utf8') }));
  assert.equal(stranicy.length, 17);
  assert.deepEqual(suditNabor(stranicy, struktura, ozhidanie), []);
});
