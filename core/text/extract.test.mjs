// Тесты одного извлечения текста (П102 блок А): node --test core/text/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { izvlechStranicu, izvlechDokument, chistit, OshibkaIzvlecheniya, BLOCHNYE } from './extract.mjs';
import { razobrat, pervyi, imya, tekstVsego, predki } from './html.mjs';

const stranica = (main, { head = '', body = '' } = {}) =>
  `<!doctype html><html><head><title>T</title><meta name="description" content="D">${head}</head><body>${body}<main>${main}</main></body></html>`;
const stroki = (main, prochtenie = 'vplotnuyu', dop) => izvlechStranicu(stranica(main, dop))[prochtenie].map((s) => s.tekst);

test('строки — по блочным элементам', () => {
  assert.deepEqual(stroki('<h2>Заголовок</h2><p>Абзац один.</p><ul><li>Пункт</li></ul>'), ['Заголовок', 'Абзац один.', 'Пункт']);
});

test('строчные теги — два прочтения: вплотную и через пробел', () => {
  assert.deepEqual(stroki('<p>Wo<em>r</em>ld</p>'), ['World']);
  assert.deepEqual(stroki('<p>Wo<em>r</em>ld</p>', 'cherezProbel'), ['Wo r ld']);
  assert.deepEqual(stroki('<p><span>Remix</span><span>Guide</span></p>', 'cherezProbel'), ['Remix Guide']);
  assert.deepEqual(stroki('<p><span>Remix</span><span>Guide</span></p>'), ['RemixGuide']);
});

test('перевод строки br — пробел в обоих прочтениях, строку не режет', () => {
  assert.deepEqual(stroki('<p>one<br>two</p>'), ['one two']);
  assert.deepEqual(stroki('<p>one<br>two</p>', 'cherezProbel'), ['one two']);
});

test('комментарий, скрипт и стиль — не текст, граница строчная', () => {
  assert.deepEqual(stroki('<p>ab<!-- x -->cd<script>var s="zz";</script>ef<style>p{}</style>gh</p>'), ['abcdefgh']);
  assert.deepEqual(stroki('<p>ab<!-- x -->cd</p>', 'cherezProbel'), ['ab cd']);
});

test('template — инертен, его текста нет', () => {
  assert.deepEqual(stroki('<p>видно</p><template><p>не видно</p></template>'), ['видно']);
});

test('noscript — разметкой, как без скриптов: текст виден', () => {
  assert.deepEqual(stroki('<p>a</p><noscript><p>без скриптов</p></noscript>'), ['a', 'без скриптов']);
});

test('скрытое считается видимым (строже)', () => {
  assert.deepEqual(stroki('<p hidden>скрыто</p><p aria-hidden="true">тоже</p>'), ['скрыто', 'тоже']);
});

test('знаки: таб, перевод строки, возврат каретки — пробел; прочие управляющие и невидимые — сняты', () => {
  assert.equal(chistit('a\tb\nc\rd'), 'a b c d');
  assert.equal(chistit('wo\u0002rd wo­rd wo​rd wo͏rd wo\u007Frd wo\u0085rd'), 'word word word word word word');
});

test('знаки: заполнители хангыля — пробел, NFC, пробелы сведены', () => {
  assert.equal(chistit('aㅤbﾠc\u{1BCA0}d'), 'a b c d');
  assert.equal(chistit('São'), 'São');
  assert.equal(chistit('  a   b  '), 'a b');
});

test('сущности — как браузер: числовая 146 — правая кавычка, raquo без точки с запятой — угловая', () => {
  assert.deepEqual(stroki('<p>Fox&#146;s &raquo x &amp;raquo; &#10;y</p>'), ['Fox’s » x &raquo; y']);
});

test('main: ровно один, иначе ошибка извлечения; main-menu — не main', () => {
  assert.throws(() => izvlechStranicu('<html><body><p>x</p></body></html>'), OshibkaIzvlecheniya);
  assert.throws(() => izvlechStranicu('<html><body><main>a</main><main>b</main></body></html>'), OshibkaIzvlecheniya);
  assert.equal(izvlechStranicu('<html><body><main-menu>m</main-menu><main><p>x</p></main></body></html>').vplotnuyu[0].tekst, 'x');
});

test('границу main не сдвигают закрывающие теги в атрибуте, комментарии и скрипте', () => {
  const s = stroki('<p><span title="</main>">a</span> b<!-- </main> --> c<script>"</main>"</script> d</p><p>e</p>');
  assert.deepEqual(s, ['a b c d', 'e']);
});

test('голова: title, description, og из head; meta между концом head и body — тоже в голове', () => {
  const h =
    '<!doctype html><html><head><title>Заголовок &amp; ко</title><meta property="og:title" content="OG"><meta name="description" content="Описание"></head>' +
    '<meta property="og:description" content="OGD"><body><svg><title>Logo</title></svg><main><p>x</p></main></body></html>';
  const g = izvlechStranicu(h).golova;
  assert.deepEqual(g, {
    title: ['Заголовок & ко'],
    description: ['Описание'],
    'og:title': ['OG'],
    'og:description': ['OGD'],
    'twitter:title': [],
    'twitter:description': [],
    'og:image:alt': [],
  });
});

test('голова: title внутри значения атрибута — не заголовок', () => {
  const h = '<html><head><title>T</title><link rel="icon" href="data:image/svg+xml,<svg><title>x</title></svg>"></head><body><main>m</main></body></html>';
  assert.deepEqual(izvlechStranicu(h).golova.title, ['T']);
});

test('атрибуты main: alt, title, aria-label, value, placeholder, label; повтор имени — первое', () => {
  const a = izvlechStranicu(
    stranica('<img alt="Кадр"><span title="Раз" title="Два">x</span><a aria-label="Ярлык">y</a><input value="Знач" placeholder="Подск"><option label="Метка">o</option><img alt="">')
  ).atributy.map((x) => `${x.atr}=${x.tekst}`);
  assert.deepEqual(a, ['alt=Кадр', 'title=Раз', 'aria-label=Ярлык', 'value=Знач', 'placeholder=Подск', 'label=Метка']);
});

test('строка знает свой узел — по нему судья находит ряд', () => {
  const s = izvlechStranicu(stranica('<section class="layer" id="r1"><p class="t-label">M</p><p>Текст ряда</p></section>')).vplotnuyu;
  assert.equal(s[1].tekst, 'Текст ряда');
  assert.equal(s[1].uzel.parentNode.tagName, 'p');
});

test('документ корпуса: title и строки body списком строк на прочтение', () => {
  const d = izvlechDokument('<html><head><title>Док</title><meta name="description" content="мета"></head><body><h1>Раз</h1><p>два <b>т</b>ри</p><img alt="альт"></body></html>');
  assert.deepEqual(d.vplotnuyu, ['Док', 'Раз', 'два три']);
  assert.deepEqual(d.cherezProbel, ['Док', 'Раз', 'два т ри']);
});

test('документ корпуса без body (frameset) — только заголовок', () => {
  assert.deepEqual(izvlechDokument('<html><head><title>F</title></head><frameset><frame src="a"></frameset></html>').vplotnuyu, ['F']);
});

/* — «судью судят», блок А, раунд 1 (линза «извлечение против браузера», A1-IZ-*) — */

test('A1-IZ-1: атрибуты самого main судятся', () => {
  const h = '<html><head><title>T</title></head><body><main aria-label="Раз два" title="Три"><p>x</p></main></body></html>';
  assert.deepEqual(izvlechStranicu(h).atributy.map((x) => `${x.atr}=${x.tekst}`).sort(), ['aria-label=Раз два', 'title=Три']);
});

test('A1-IZ-2: декларативный теневой DOM виден, как в браузере', () => {
  assert.deepEqual(stroki('<div><template shadowrootmode="open"><p>alpha beta</p></template></div>'), ['alpha beta']);
  assert.deepEqual(izvlechDokument('<body><div><template shadowrootmode="open"><p>a b</p></template></div></body>').vplotnuyu, ['a b']);
});

test('A1-IZ-4: элемент SVG с именем блока строку не режет и за main не считается', () => {
  assert.deepEqual(stroki('<p>alpha beta <svg width="0" height="0"><nav/></svg> gamma delta</p>', 'cherezProbel'), ['alpha beta gamma delta']);
  assert.equal(izvlechStranicu(stranica('<p>x</p><svg><main/></svg>')).vplotnuyu[0].tekst, 'x');
});

test('A1-IZ-5: noscript с img в голове не уносит следующие meta из-под суда головы', () => {
  const h = '<html><head><title>T</title><meta name="description" content="A"><noscript><img src="p.gif"></noscript><meta name="description" content="B"></head><body><main><p>x</p></main></body></html>';
  assert.deepEqual(izvlechStranicu(h).golova.description, ['A', 'B']);
});

test.todo('A1-IZ-3: скрытое внутри фразы (hidden, sr-only, svg title, rp/rt, noscript для читателя с JS) рвёт 8-грамму в обоих прочтениях — предел');

test('A1-IZ-6: ячейки таблицы и блоки браузера по умолчанию — границы строк', () => {
  const s = izvlechStranicu(stranica('<table><tr><td>Year</td><td>alpha beta gamma delta epsilon zeta eta th<em>e</em>ta</td></tr></table>'));
  assert.ok([...s.vplotnuyu, ...s.cherezProbel].some((x) => ` ${x.tekst} `.includes(' alpha beta gamma delta epsilon zeta eta theta ')));
  for (const b of ['center', 'menu', 'hgroup', 'search', 'dialog']) assert.deepEqual(stroki(`<div>aa<${b}>bb</${b}>cc</div>`, 'cherezProbel'), ['aa', 'bb', 'cc'], b);
});

test.todo('A1-IZ-7: parse5 8.0.1 разбирает <select> по прежней спецификации — <style> внутри <option> становится текстом (Chrome 135+ — нет) — предел');
test.todo('A1-IZ-8: порядок слов логический — <bdo dir="rtl"> и U+202E на экране разворачивают текст — предел');

test('A1-IZ-10: слышимые атрибуты судятся', () => {
  const a = izvlechStranicu(stranica('<p aria-description="Раз" aria-roledescription="Два" aria-valuetext="Три">x</p><math alttext="Четыре"><mi>x</mi></math><table summary="Пять"><tr><th abbr="Шесть">h</th></tr></table>')).atributy.map((x) => x.atr);
  assert.deepEqual(a.sort(), ['abbr', 'alttext', 'aria-description', 'aria-roledescription', 'aria-valuetext', 'summary']);
});

test('A1-IZ-11: текст узла для ярлыка — без скриптов и стилей', () => {
  const p = pervyi(razobrat('<p>Chap<script>x</script>ters<style>i{}</style></p>'), (u) => imya(u) === 'p');
  assert.equal(tekstVsego(p), 'Chapters');
});

test('A1-IZ-13: глубокая вложенность не роняет извлечение', () => {
  assert.deepEqual(izvlechDokument('<body>' + '<span>'.repeat(20000) + 'alpha').vplotnuyu, ['alpha']);
});

test('A1-IZ-14: twitter:title, twitter:description, og:image:alt — в голове, если есть', () => {
  const h = '<html><head><title>T</title><meta name="twitter:description" content="TW"><meta property="og:image:alt" content="ALT"></head><body><main><p>x</p></main></body></html>';
  const g = izvlechStranicu(h).golova;
  assert.deepEqual(g['twitter:description'], ['TW']);
  assert.deepEqual(g['og:image:alt'], ['ALT']);
  assert.deepEqual(g['twitter:title'], []);
});

test('A1-IZ-15: каждый блочный режет строку; ячейки ряда таблицы — пробел (A2-3)', () => {
  for (const b of BLOCHNYE) {
    if (['html', 'body', 'main', 'table', 'tr', 'thead', 'tbody', 'tfoot', 'caption', 'option', 'optgroup', 'plaintext'].includes(b)) continue;
    const h = b === 'hr' ? '<div>aa<hr>cc</div>' : `<div>aa<${b}>bb</${b}>cc</div>`;
    assert.deepEqual(stroki(h, 'cherezProbel'), b === 'hr' ? ['aa', 'cc'] : ['aa', 'bb', 'cc'], b);
  }
  assert.deepEqual(stroki('<table><tr><td>aa</td><td>bb</td></tr><tr><th>cc</th><td>dd</td></tr></table>'), ['aa bb', 'cc dd']);
});

/* — «судью судят», блок А, раунд 2 (A2-*) — */

test('A2-1: meta полей головы внутри main судится', () => {
  const r = izvlechStranicu(stranica('<p>x</p><meta name="description" content="Чужое описание">'));
  assert.deepEqual(r.golova.description, ['D', 'Чужое описание']);
});

test('A2-2: предки узла теневого корня доходят до хозяина; title теневого корня в main — не голова', () => {
  const h = '<html><head><title>T</title></head><body><main><section class="layer"><template shadowrootmode="open"><title>S</title><p>x</p></template></section></main></body></html>';
  const r = izvlechStranicu(h);
  assert.deepEqual(r.golova.title, ['T']);
  const p = r.vplotnuyu.find((s) => s.tekst === 'x');
  assert.ok(predki(p.uzel).includes(r.main));
});

test('A2-3: ряд таблицы — 8-грамма через ячейки ловится', () => {
  const s = izvlechStranicu(stranica('<table><tr><td>alpha beta gamma delta</td><td>epsilon zeta eta theta</td></tr></table>'));
  assert.ok([...s.vplotnuyu, ...s.cherezProbel].some((x) => ` ${x.tekst} `.includes(' alpha beta gamma delta epsilon zeta eta theta ')));
});

test('A2-8: текст ярлыка — без SVG-стиля и SVG-скрипта, как у строк', () => {
  const p = pervyi(razobrat('<p>Chap<svg><style>.a{}</style><script>x()</script></svg>ters</p>'), (u) => imya(u) === 'p');
  assert.equal(tekstVsego(p), 'Chapters');
});

test.todo('A2-9: теневой корень со <slot> браузер рисует в порядке слотов, обход — в порядке документа (предел)');

test('A2-12: th, option, plaintext — границы; три aria-атрибута судятся', () => {
  assert.deepEqual(stroki('<select><option>aa<option>bb</select>'), ['aa', 'bb']);
  assert.deepEqual(izvlechDokument('<body><div>aa<plaintext>bb').vplotnuyu, ['aa', 'bb']);
  const a = izvlechStranicu(stranica('<div aria-placeholder="Раз" aria-braillelabel="Два" aria-brailleroledescription="Три">x</div>')).atributy.map((x) => x.atr);
  assert.deepEqual(a.sort(), ['aria-braillelabel', 'aria-brailleroledescription', 'aria-placeholder']);
});

test('A2-13: HTML-title в foreignObject вне main — голова (как document.title)', () => {
  const h = '<html><head><title>T</title></head><body><svg><foreignObject><title>F</title></foreignObject></svg><main><p>x</p></main></body></html>';
  assert.deepEqual(izvlechStranicu(h).golova.title, ['T', 'F']);
});

test('A2-15: aria-rowindextext и aria-colindextext судятся', () => {
  const a = izvlechStranicu(stranica('<div role="row" aria-rowindextext="Раз"><div role="cell" aria-colindextext="Два">x</div></div>')).atributy.map((x) => x.atr);
  assert.deepEqual(a.sort(), ['aria-colindextext', 'aria-rowindextext']);
});

test('A1-IZ-16: template — строчная граница; main и атрибуты в нём не считаются', () => {
  assert.deepEqual(stroki('<p>ab<template>x</template>cd</p>'), ['abcd']);
  assert.deepEqual(stroki('<p>ab<template>x</template>cd</p>', 'cherezProbel'), ['ab cd']);
  assert.equal(izvlechStranicu('<html><body><template><main>t</main></template><main><p>x</p></main></body></html>').vplotnuyu[0].tekst, 'x');
  assert.deepEqual(izvlechStranicu(stranica('<template><img alt="A"></template><p>x</p>')).atributy, []);
});

test('A1-IZ-17: края разбора — пустой комментарий, --!>, textarea, «<3», title в теле, noscript в голове', () => {
  assert.deepEqual(stroki('<p>a<!-->b</p>'), ['ab']);
  assert.deepEqual(stroki('<p>a<!--x--!>b</p>'), ['ab']);
  assert.deepEqual(stroki('<p><textarea><b>t</b></textarea></p>'), ['<b>t</b>']);
  assert.deepEqual(stroki('<p>1 <3 2</p>'), ['1 <3 2']);
  assert.deepEqual(stroki('<p>a<title>t<b>x</b></title>b</p>'), ['at<b>x</b>b']);
  const h = '<html><head><title>T</title><noscript><meta name="description" content="N"></noscript></head><body><main><p>x</p></main></body></html>';
  assert.deepEqual(izvlechStranicu(h).golova.description, ['N']);
});

test('A1-IZ-18: знаки — остальные члены правила', () => {
  assert.equal(chistit('aᅟbᅠc\u{1BCA3}d'), 'a b c d');
  assert.equal(chistit('w⁠o️r‎d‮⁦﻿s\u000Bt\u000Cu'), 'wordstu');
  assert.deepEqual(stroki('<p>a&#11;b&#12;c&#13;d&#x9;e</p>'), ['abc d e']);
});

test('A1-IZ-19: голова — пустые сохраняются, повторы списком, регистр, name и property разом', () => {
  const h = '<html><head><title></title><title>B</title><meta NAME="Description"><meta name="description" property="og:description" content="X"></head><body><main><p>x</p></main></body></html>';
  const g = izvlechStranicu(h).golova;
  assert.deepEqual(g.title, ['', 'B']);
  assert.deepEqual(g.description, ['', 'X']);
  assert.deepEqual(g['og:description'], ['X']);
});

test('A1-IZ-20: атрибуты — пустые для читателя пропускаются, значения чистятся', () => {
  assert.deepEqual(izvlechStranicu(stranica('<img alt="  "><img alt="&ZeroWidthSpace;"><img alt="a&#10;b&shy;c">')).atributy.map((x) => x.tekst), ['a bc']);
});

test('A1-IZ-21: документ корпуса — код и шаблон не текст, br — пробел, пустой title снят', () => {
  const d = izvlechDokument('<html><head><title> </title><title>T</title></head><body><p>a<script>s</script>b<style>x</style>c<template>t</template>d<!--k-->e<br>f</p></body></html>');
  assert.deepEqual(d.vplotnuyu, ['T', 'abcde f']);
  assert.deepEqual(d.cherezProbel, ['T', 'a b c d e f']);
});

test('A1-IZ-22: узел строки — первый непустой текст; вложенный main — ошибка', () => {
  assert.equal(izvlechStranicu(stranica('<p> <em>x</em> y</p>')).vplotnuyu[0].uzel.parentNode.tagName, 'em');
  assert.throws(() => izvlechStranicu('<html><body><main><main>x</main></main></body></html>'), OshibkaIzvlecheniya);
});
