// Тесты одного извлечения текста (П102 блок А): node --test core/text/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { izvlechStranicu, izvlechDokument, chistit, OshibkaIzvlecheniya } from './extract.mjs';

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
  assert.deepEqual(g, { title: ['Заголовок & ко'], description: ['Описание'], 'og:title': ['OG'], 'og:description': ['OGD'] });
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

test('документ корпуса: title и строки body одним потоком на прочтение', () => {
  const d = izvlechDokument('<html><head><title>Док</title><meta name="description" content="мета"></head><body><h1>Раз</h1><p>два <b>т</b>ри</p><img alt="альт"></body></html>');
  assert.equal(d.vplotnuyu, 'Док Раз два три');
  assert.equal(d.cherezProbel, 'Док Раз два т ри');
});

test('документ корпуса без body (frameset) — только заголовок', () => {
  assert.equal(izvlechDokument('<html><head><title>F</title></head><frameset><frame src="a"></frameset></html>').vplotnuyu, 'F');
});
