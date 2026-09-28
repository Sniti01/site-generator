// Тесты модели слов (П102 блок А): node --test core/text/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slova, imenaSlovami, bezImen, srez, vRezhime, hesh, bezAdresov, N_GRAM } from './words.mjs';

test('слова: строчные, буквы и цифры Юникода, апострофы сведены', () => {
  assert.deepEqual(slova('Max’s «Bullet-Time» 2012, don`t ’quote’'), ["max's", 'bullet', 'time', '2012', "don't", 'quote']);
  assert.equal(N_GRAM, 8);
});

test('имена сворачиваются в одно слово, длинные первыми', () => {
  const im = imenaSlovami(['Max Payne 3', 'Max Payne 2: The Fall of Max Payne']);
  assert.deepEqual(bezImen(slova('in Max Payne 2: The Fall of Max Payne and Max Payne 3 now'), im), ['in', '§imya§', 'and', '§imya§', 'now']);
  assert.deepEqual(bezImen(slova('Max Payne alone'), im), ['max', 'payne', 'alone']);
});

test('свёртка объектов слов: поля первого слова и индекс последнего', () => {
  const im = imenaSlovami(['Max Payne 3']);
  const ws = ['a', 'max', 'payne', '3', 'b'].map((w, i) => ({ w, i }));
  assert.deepEqual(bezImen(ws, im), [{ w: 'a', i: 0 }, { w: '§imya§', i: 1, ot: 1, do: 3 }, { w: 'b', i: 4 }]);
});

test('срез окончаний — правило среза сессии 15 как есть (жадное: boxes — boxe)', () => {
  assert.deepEqual(['max\'s', 'stories', 'sales', 'boxes', 'this', 'is', 'as', 'bullets'].map(srez), ['max', 'story', 'sale', 'boxe', 'thi', 'is', 'as', 'bullet']);
  assert.deepEqual(vRezhime(['sales', 'of'], 'srez'), ['sale', 'of']);
  assert.deepEqual(vRezhime(['sales', 'of'], 'tochno'), ['sales', 'of']);
});

test('хеш: целое до 2^53, одинаковый на одном тексте, разный на разных', () => {
  const a = hesh('one two three four five six seven eight');
  assert.ok(Number.isSafeInteger(a) && a >= 0);
  assert.equal(a, hesh('one two three four five six seven eight'));
  assert.notEqual(a, hesh('one two three four five six seven nine'));
});

/* — «судью судят», блок А, раунд 1 (A1-UK-*) — */

test('A1-UK-8: прочие апострофы — как ’', () => {
  for (const a of ['ʼ', '´', '′', '‛', '＇']) assert.deepEqual(slova(`Max${a}s gun don${a}t`), ["max's", 'gun', "don't"], `U+${a.codePointAt(0).toString(16)}`);
});

test('A1-UK-13: адрес со схемой в верхнем регистре — тоже пробел', () => {
  assert.deepEqual(slova(bezAdresov('see HTTPS://Example.com/the-hero-moves now')), ['see', 'now']);
});

test('A1-UK-14: имена сайта — в NFC и без невидимых знаков', () => {
  assert.deepEqual(imenaSlovami(['São Paulo Mo­bile']), [['são', 'paulo', 'mobile']]);
});

test('A1-UK-15: хеш — больше 32 бит', () => {
  assert.ok(Array.from({ length: 32 }, (_, i) => hesh(`w${i} a b c d e f g`)).some((x) => x >= 2 ** 32));
});

test('A1-UK-15: срез как есть — lies, series, не-латиница, числа, имя', () => {
  assert.deepEqual(['lies', 'series', 'cafés', 'naïves', '1990s', '§imya§', 'xes'].map(srez), ['ly', 'sery', 'cafés', 'naïves', '1990s', '§imya§', 'xes']);
});

test('A1-UK-15: имена — пустые отброшены, имя в конце, оборванное имя не сворачивается', () => {
  assert.deepEqual(imenaSlovami(['', '—', '(2008)']), [['2008']]);
  assert.deepEqual(bezImen(slova('now play Max Payne 3'), imenaSlovami(['Max Payne 3'])), ['now', 'play', '§imya§']);
  assert.deepEqual(bezImen(slova('now play Max Payne'), imenaSlovami(['Max Payne 3'])), ['now', 'play', 'max', 'payne']);
});

test('A1-UK-5: притяжательное на последнем слове имени — имя', () => {
  assert.deepEqual(bezImen(slova("in Max Payne 3's story"), imenaSlovami(['Max Payne 3'])), ['in', '§imya§', 'story']);
});

test('адреса — пробелом, слова рядом остаются', () => {
  assert.equal(bezAdresov('see https://example.com/a?b=1#c now'), 'see   now');
  assert.deepEqual(slova(bezAdresov('x https://example.com/x⠀word')), ['x', 'word']);
});
