// Сторож 8 слов и судья исключений ядра на синтетике (П102 блок Б): node --test core/gates/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import phrases, { sudStranicy, sudSborki, slovaSMetkoy } from './phrases.mjs';
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

/* — «судью судят», блок Б, раунд 1 (B1-F-*) — */

const REP = '“My cover had been blown and the door slammed shut” — Chapter 8.';

test('B1-F-1: метка ряда — своя .t-label секции: не скрипт, не стиль, не метка вложенной секции; SVG-секция — не ряд', () => {
  const chuzhoy = (vperedi, telo = `<p>${REP}</p>`) =>
    `<section class="layer" id="r3">${vperedi}<p class="t-label">Other · 2012</p><div class="layer__body">${telo}</div></section>`;
  const sluchai = [
    ['script', chuzhoy('<script type="text/plain" class="t-label">Game · 2001</script>')],
    ['style', chuzhoy('<style class="t-label">Game · 2001</style>')],
    ['вложенная секция', chuzhoy('<section class="layer"><p class="t-label">Game · 2001</p></section>')],
    ['svg section', chuzhoy('', `<p><svg><section class="layer"><text class="t-label">Game · 2001</text></section></svg>${REP}</p>`)],
  ];
  const propushcheno = sluchai.filter(([, m]) => !sudStranicy('/q/', stranica(m), uk, dannye).otkazy.some((o) => o.includes('не в своём ряду'))).map(([i]) => i);
  assert.deepEqual(propushcheno, []);
});

test.todo('B1-F-1, B1-F-2 (предел): скрытое атрибутом hidden — метка, кавычки, сосед — засчитывается как видимое (мягче; путь только через шаблон; прежний разбор глав — izv-N3)');

test('B2-11: метка «своего» ряда только в <noscript> чужого ряда — «не в своём ряду»', () => {
  const html = stranica(`<section class="layer" id="r3"><noscript><p class="t-label">Game · 2001</p></noscript><p class="t-label">Other · 2012</p><p>${REP}</p></section>`);
  assert.ok(sudStranicy('/q/', html, uk, dannye).otkazy.some((o) => o.includes('не в своём ряду')));
});

test('B1-F-4: метка ряда с <br> — <br> пробел, как в строках', () => {
  const html = stranica(`<section class="layer" id="r1"><p class="t-label">Game<br>· 2001</p><div class="layer__body"><p>${REP}</p></div></section>`);
  assert.deepEqual(sudStranicy('/q/', html, uk, dannye).otkazy, []);
});

const GLAVA = { klass: 'название главы', stranica: '/g/', tekst: 'My cover had been blown and the door slammed shut', ryad: { id: 'chapters', metka: /^chapters$/i } };

test('B1-F-5: исключение во второй section#chapters (дубль id) — не свой ряд', () => {
  const html = stranica(
    '<section class="layer" id="chapters"><p class="t-label">Chapters</p><p>I. A place (1 / 1): “Something.”</p></section>' +
      '<section class="layer" id="length"><p class="t-label">Length</p><section class="layer" id="chapters"><p class="t-label">Chapters</p><p>“My cover had been blown and the door slammed shut”</p></section></section>'
  );
  assert.ok(sudStranicy('/g/', html, uk, { imena: [], isklyucheniya: [GLAVA], minSlov: 100 }).otkazy.some((o) => o.includes('не в своём ряду')));
});

test('B1-F-6: интеграция — круг, журнал разрешённого; нет файла страницы — отказ «файла нет»', () => {
  const koren = mkdtempSync(join(tmpdir(), 'sayt-'));
  mkdirSync(join(koren, 'input/corpus/raw'), { recursive: true });
  writeFileSync(join(koren, 'input/corpus/raw/d0.html.gz'), gzipSync('<p>the quick brown fox jumps over the lazy dog again and again</p>'));
  writeFileSync(join(koren, 'input/corpus/manifest.jsonl'), JSON.stringify({ url: 'doc-a', outcome: 'ok', file: 'raw/d0.html.gz' }) + '\n');
  const dist = join(koren, 'dist');
  mkdirSync(join(dist, 'x'), { recursive: true });
  writeFileSync(join(dist, 'index.html'), '<html><body>без main</body></html>');
  writeFileSync(join(dist, 'x/index.html'), stranica('<p>своими словами</p>'));
  const zh = [];
  const logger = { info: (s) => zh.push(s), warn: (s) => zh.push(s), error: (s) => zh.push(s) };
  const integ = phrases({ dannye: { imena: [], isklyucheniya: [], stranica: (u) => u !== '/', minSlov: 100 }, kesh: null });
  integ.hooks['astro:config:done']({ config: { root: pathToFileURL(koren + '/') } });
  const dir = pathToFileURL(dist + '/');
  integ.hooks['astro:build:done']({ dir, pages: [{ pathname: '' }, { pathname: 'x/' }], logger });
  assert.ok(zh.some((s) => s.startsWith('8 слов: страниц 1,')), zh.join(' | '));
  assert.throws(() => integ.hooks['astro:build:done']({ dir, pages: [{ pathname: 'x/' }, { pathname: 'y/' }], logger }), /\/y\/: файла страницы нет/);
});

test('B1-F-6: журнал — по каждому исключению число совпадений', () => {
  const r = sudSborki([{ url: '/q/', html: stranica(ryad(`He said: ${REP}`)) }], uk, dannye);
  assert.deepEqual(r.otkazy, []);
  assert.ok(r.itogi[0].razresheno.get(REPLIKA.tekst).length > 0);
});

test('B1-F-8а: исключение вне section.layer — «не в ряду story-row»', () => {
  const r = sudStranicy('/q/', stranica(`<div><p>${REP}</p></div>`), uk, dannye);
  assert.ok(r.otkazy.some((o) => o.includes('не в ряду story-row')));
});

test('B1-F-8б: имя через границу кавычек — «через границу кавычек»', () => {
  const t = 'we played max payne 3 on the old office computer all night';
  const uk2 = ukazatelIzTekstov([{ url: 'doc-m', vplotnuyu: [t], cherezProbel: [t] }, ...KORPUS], { imena: ['Max Payne 3'] });
  const r = sudStranicy('/x/', stranica('<p>we played Max “Payne 3 on the old office computer all night”</p>'), uk2, dannye);
  assert.ok(r.otkazy.some((o) => o.startsWith('через границу кавычек')));
});

test('B1-F-8в: сосед перед — в начале строки и после номера', () => {
  const GL = { ...GLAVA, pered: /^\s*IX\.\s[A-Za-z ]*\(\d+\s*\/\s*\d+\):\s*$/ };
  const d = { imena: [], isklyucheniya: [GL], minSlov: 100 };
  const sek = (p) => stranica(`<section class="layer" id="chapters"><p class="t-label">Chapters</p><p>${p}</p></section>`);
  assert.deepEqual(sudStranicy('/g/', sek('IX. A place (6 / 3): “My cover had been blown and the door slammed shut”'), uk, d).otkazy, []);
  assert.ok(sudStranicy('/g/', sek('“My cover had been blown and the door slammed shut”'), uk, d).otkazy.some((o) => o.includes('сосед перед кавычкой')));
});

test('B1-F-8г: страница, которая не читается, среди прочих — отказ этой страницы, прочие судятся', () => {
  const r = sudSborki([{ url: '/a/', html: '<html><body>без main</body></html>' }, { url: '/x/', html: stranica('<p>and the quick brown fox jumps over the lazy dog</p>') }], uk, { ...dannye, isklyucheniya: [] });
  assert.ok(r.otkazy.some((o) => o.url === '/a/' && o.chto.startsWith('страница не читается')));
  assert.ok(r.otkazy.some((o) => o.url === '/x/' && o.chto.startsWith('вне кавычек')));
});
