// Сторож 8 слов и судья исключений ядра на синтетике (П102 блок Б): node --test core/gates/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sudStranicy, sudSborki, slovaSMetkoy } from './phrases.mjs';
import { sudIsklyucheniy, normN, paryKavychek } from './exceptions.mjs';
import { ukazatelIzTekstov } from '../text/corpus.mjs';
import { imenaSlovami } from '../text/words.mjs';
import { OshibkaIzvlecheniya } from '../text/extract.mjs';

const KORPUS = [
  { url: 'doc-a', vplotnuyu: ['the quick brown fox jumps over the lazy dog again and again'], cherezProbel: ['the quick brown fox jumps over the lazy dog again and again'] },
  { url: 'doc-b', vplotnuyu: ['My cover had been blown and the door slammed shut behind me at last'], cherezProbel: ['My cover had been blown and the door slammed shut behind me at last'] },
];
const uk = ukazatelIzTekstov(KORPUS, { imena: ['Max Payne 3'] });
const NAPOLNITEL = Array.from({ length: 120 }, (_, i) => `slovo${i}`).join(' ');
const stranica = (main, { head = '' } = {}) =>
  `<!doctype html><html><head><title>Title</title><meta name="description" content="Desc"><meta property="og:title" content="OG"><meta property="og:description" content="OGD">${head}</head>` +
  `<body><main><p>${NAPOLNITEL}</p>${main}</main></body></html>`;
const REPLIKA = {
  klass: 'реплика',
  stranica: '/q/',
  tekst: 'My cover had been blown and the door slammed shut',
  ryad: { metka: /^Game · 2001/ },
  posle: /^\s*[—–]\s*Chapter \d+\b/,
};
const dannye = { imena: ['Max Payne 3'], isklyucheniya: [REPLIKA], minSlov: 100 };
const ryad = (telo, metka = 'Game · 2001') => `<section class="layer" id="r1"><p class="t-label">${metka}</p><div class="layer__body"><p>${telo}</p></div></section>`;

test('чистая страница — отказов нет', () => {
  assert.deepEqual(sudStranicy('/x/', stranica('<p>своими словами и ничего чужого</p>'), uk, dannye).otkazy, []);
});

test('фраза корпуса вне кавычек — отказ (точно)', () => {
  const r = sudStranicy('/x/', stranica('<p>and the quick brown fox jumps over the lazy dog</p>'), uk, dannye);
  assert.ok(r.otkazy.some((o) => o.startsWith('вне кавычек (точно)') && o.includes('doc-a')));
});

test('фраза корпуса с другим окончанием — отказ (срез окончаний)', () => {
  const r = sudStranicy('/x/', stranica('<p>the quick brown fox jumps over the lazy dogs</p>'), uk, dannye);
  assert.ok(r.otkazy.some((o) => o.includes('срез окончаний')));
});

test('реплика из данных в кавычках, в своём ряду, с главой — разрешена', () => {
  const r = sudStranicy('/q/', stranica(ryad('He said: “My cover had been blown and the door slammed shut” — Chapter 8, at the bar.')), uk, dannye);
  assert.deepEqual(r.otkazy, []);
  assert.equal(r.razresheno.get(REPLIKA.tekst).length > 0, true);
});

test('реплика: без главы за кавычкой, в чужом ряду, дважды, без кавычек — отказы своего вида', () => {
  assert.ok(sudStranicy('/q/', stranica(ryad('“My cover had been blown and the door slammed shut” said he.')), uk, dannye).otkazy.some((o) => o.includes('сосед после кавычки')));
  assert.ok(sudStranicy('/q/', stranica(ryad('“My cover had been blown and the door slammed shut” — Chapter 8.', 'Other · 2012')), uk, dannye).otkazy.some((o) => o.includes('не в своём ряду')));
  assert.ok(
    sudStranicy('/q/', stranica(ryad('“My cover had been blown and the door slammed shut” — Chapter 8. “My cover had been blown and the door slammed shut” — Chapter 8.')), uk, dannye).otkazy.some((o) => o.includes('в кавычках 2 раз'))
  );
  const bez = sudStranicy('/q/', stranica(ryad('My cover had been blown and the door slammed shut behind me — Chapter 8.')), uk, dannye).otkazy;
  assert.ok(bez.some((o) => o.startsWith('вне кавычек')) && bez.some((o) => o.includes('в кавычках 0 раз')));
});

test('текст корпуса в кавычках, но не исключение, и через границу кавычек — отказы', () => {
  assert.ok(sudStranicy('/x/', stranica('<p>“the quick brown fox jumps over the lazy dog”</p>'), uk, dannye).otkazy.some((o) => o.startsWith('в кавычках, но не исключение сайта')));
  assert.ok(sudStranicy('/x/', stranica('<p>“the quick brown fox” jumps over the lazy dog</p>'), uk, dannye).otkazy.some((o) => o.startsWith('через границу кавычек')));
});

test('голова и атрибуты — строго, без исключений', () => {
  assert.ok(sudStranicy('/x/', stranica('<p>x</p>', { head: '<meta name="twitter:description" content="the quick brown fox jumps over the lazy dog">' }), uk, dannye).otkazy.some((o) => o.includes('twitter:description')));
  assert.ok(sudStranicy('/x/', stranica('<img alt="the quick brown fox jumps over the lazy dog">'), uk, dannye).otkazy.some((o) => o.includes('атрибут alt')));
});

test('страница не читается: main не один, голова не по одному, мало слов', () => {
  assert.throws(() => sudStranicy('/x/', '<html><body><main>a</main><main>b</main></body></html>', uk, dannye), OshibkaIzvlecheniya);
  assert.throws(() => sudStranicy('/x/', stranica('<p>x</p>').replace('<title>Title</title>', ''), uk, dannye), /title — 0/);
  assert.throws(() => sudStranicy('/x/', stranica('<p>x</p>').replace(NAPOLNITEL, 'мало слов'), uk, dannye), /меньше 100/);
});

test('сборка: пусто — отказ; исключение для страницы вне сборки — отказ', () => {
  assert.equal(sudSborki([], uk, dannye).otkazy.length, 2);
  assert.ok(sudSborki([{ url: '/x/', html: stranica('<p>x</p>') }], uk, dannye).otkazy.some((o) => o.url === '/q/' && o.chto.includes('данные отстали')));
});

test('слова с меткой кавычек: имя через границу кавычек — mix; имя внутри — метка пары', () => {
  const im = imenaSlovami(['Max Payne 3']);
  assert.deepEqual(slovaSMetkoy('in “Max Payne 3 now” x', im).map((x) => `${x.w}:${x.seg}`), ['in:-1', '§imya§:0', 'now:0', 'x:-1']);
  assert.deepEqual(slovaSMetkoy('in Max “Payne 3 now” x', im).map((x) => `${x.w}:${x.seg}`), ['in:-1', '§imya§:mix', 'now:0', 'x:-1']);
});

test('кавычки и нормализация: пары «“ ”», пробел перед знаком — след тега', () => {
  assert.deepEqual(paryKavychek('a “b” c “d'), [[2, 4]]);
  assert.equal(normN('Here I Was Again , Halfway Down the World .'), 'Here I Was Again, Halfway Down the World.');
});

test('A2 (следствие A1-UK-8): апострофы исключения — те же, что у модели слов', () => {
  for (const a of ['’', '‘', '`', 'ʼ', '´', '′', '‛', '＇']) assert.equal(normN(`Max${a}s gun`), "Max's gun", `U+${a.codePointAt(0).toString(16)}`);
});

test('судья исключений без совпадений и без исключений — пусто', () => {
  const izvl = { vplotnuyu: [], cherezProbel: [] };
  assert.deepEqual(sudIsklyucheniy(izvl, [], []).otkazy, []);
});
