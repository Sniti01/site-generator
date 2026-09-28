// Сторож брифов на фундаменте ядра (П102 блок Б; прежний `tools/brief-strony.mjs --selftest`, 22 пробы):
// пробы сторожа и сверки корпуса — тестами. Указатель корпуса — ядра (кеш вне git); без корпуса — отказ.
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { chuzhie, ukazatelSayta, vkhody, brief, VETVI, korpusStranicy, sverkaSAnatomiej, imyaFajla } from './brief-strony.mjs';
import { ukazatelIzTekstov, dokumentyKorpusa, tekstDokumentaKorpusa } from '@factory/core/text/corpus.mjs';
import { izvlechDokument } from '@factory/core/text/extract.mjs';
import { slova } from '@factory/core/text/words.mjs';
import { IMENA } from '../gates/phrases.mjs';
import { SAYT } from './testy/obshchee.mjs';

const v = vkhody();
const p0 = (u) => v.struktura.pages.find((x) => x.url === u);
const uk = ukazatelSayta();
// Второй документ-наполнитель: указатель без 8-грамм — громкий отказ ядра (A1-UK-2), а проба с именем игры
// даёт документ короче восьми слов.
const NAPOLNITEL = { url: 'napolnitel', vplotnuyu: 'zulu yankee xray whiskey victor uniform tango sierra', cherezProbel: 'zulu yankee xray whiskey victor uniform tango sierra' };
const uk1 = (tekst) => ukazatelIzTekstov([{ url: 'x', vplotnuyu: tekst, cherezProbel: tekst }, NAPOLNITEL], { imena: IMENA });

test('сторож брифов: чужие формулировки', async (t) => {
  // Живой документ корпуса (текст извлечения ядра) и его десять слов подряд — «чужая формулировка» пробы.
  const obrazec = (() => {
    for (const d of dokumentyKorpusa(join(SAYT, 'input/corpus'))) {
      const tekst = izvlechDokument(tekstDokumentaKorpusa(d)).vplotnuyu.join(' ');
      if (slova(tekst).length > 200) return { url: d.url, tekst };
    }
    throw new Error('в корпусе нет документа длиннее 200 слов');
  })();
  const ws = slova(obrazec.tekst);
  const kusok = ws.slice(100, 110).join(' ');
  const chistyi = brief(p0('/404/'), v, null);
  await t.test('чистый бриф /404/ — совпадений нет', () => assert.equal(chuzhie(chistyi, uk).length, 0));
  await t.test('бриф + 10 слов документа корпуса — пойман, назван документ, а не слова', () => {
    const r = chuzhie(`${chistyi}\n${kusok}\n`, uk);
    assert.equal(r.length, 1);
    assert.equal(r[0].dokument, obrazec.url);
  });
  await t.test('те же слова другим регистром и пунктуацией — пойман', () => assert.equal(chuzhie(`${chistyi}\n${kusok.toUpperCase().replace(/ /g, ', ')}\n`, uk).length, 1));
  await t.test('семь слов подряд — не 8-грамма, не пойман', () => assert.equal(chuzhie(`${chistyi}\n${ws.slice(100, 107).join(' ')}\n`, uk).length, 0));
  await t.test('адрес документа в строке — не формулировка', () => assert.equal(chuzhie(`${chistyi}\n- ${obrazec.url}\n`, uk).length, 0));
  await t.test('официальное название игры — имя, не формулировка', () => assert.equal(chuzhie('Max Payne 2: The Fall of Max Payne\n', uk1('the story of Max Payne 2: The Fall of Max Payne here')).length, 0));
  await t.test('слова вокруг названия: имя — одно слово 8-граммы', () => assert.equal(chuzhie('in Max Payne 3 the hero moves to a new city\n', uk1('so in Max Payne 3 the hero moves to a new city now')).length, 1));
  await t.test('сущность &rsquo; в документе — та же фраза с апострофом поймана', () => {
    const d = izvlechDokument('<p>alpha bravo charlie delta Max&rsquo;s echo foxtrot golf hotel india</p>');
    const u = ukazatelIzTekstov([{ url: 'x', ...d }], { imena: IMENA });
    assert.equal(chuzhie('alpha bravo charlie delta Max’s echo foxtrot golf hotel\n', u).length, 1);
  });
  await t.test('срез окончаний: та же фраза с другим числом — поймана (режим srez)', () => {
    const r = chuzhie('alpha bravo charlie deltas echo foxtrot golf hotel\n', uk1('alpha bravo charlie delta echo foxtrot golf hotel india'));
    assert.deepEqual(r.map((x) => x.rezhim), ['srez']);
  });
  const uk8 = uk1('one two three four five six seven eight nine');
  await t.test('ключи через «·» — стык двух запросов не фраза', () => assert.equal(chuzhie('one two three four · five six seven eight\n', uk8).length, 0));
  await t.test('ячейки таблицы через «|» — стык не фраза', () => assert.equal(chuzhie('| one two three four | five six seven eight |\n', uk8).length, 0));
  await t.test('восемь слов внутри одного отрезка — поймано', () => assert.equal(chuzhie('· one two three four five six seven eight ·\n', uk8).length, 1));
});

test('бриф: ветви, арт, открытое', () => {
  assert.equal([...VETVI].join(','), 'hero-key-art,byline,story-row,gallery,link-list,cta-band');
  assert.match(brief(p0('/max-payne-3/'), v, null), /`mp3-art`[^|]*1920 master is small/);
  assert.ok(brief(p0('/remake/'), v, null).includes('no key yet'));
  assert.ok(brief(p0('/quotes/'), v, null).includes('**Open for this page:** The contract corridor 5093–6891'));
  assert.ok(brief(p0('/gameplay/'), v, null).includes('`video` — manual, high. not in the core'));
  assert.equal(imyaFajla('/max-payne-3/guide/'), 'max-payne-3-guide.md');
});

test('отбор корпуса страницы = анатомии (все страницы с фразами); подменённая запись — расхождение названо', () => {
  for (const p of v.struktura.pages.filter((x) => x.keywords?.length)) {
    assert.deepEqual(sverkaSAnatomiej(p, v.anatomia.страницы.find((a) => a.url === p.url), korpusStranicy(p, v)), [], p.url);
  }
  const p = p0('/max-payne-3/');
  const an = v.anatomia.страницы.find((a) => a.url === p.url);
  const k = korpusStranicy(p, v);
  assert.ok(sverkaSAnatomiej(p, { ...an, документов: an.документов + 1 }, k).some((s) => s.startsWith('документов')));
  assert.ok(sverkaSAnatomiej(p, { ...an, пропущено: { ...an.пропущено, дублей: an.пропущено.дублей + 1 } }, k).some((s) => s.startsWith('пропущено.дублей')));
  assert.ok(sverkaSAnatomiej({ ...p, keywords: [...p.keywords, 'x'] }, an, k).some((s) => s.includes('фразы_sha256')));
});
