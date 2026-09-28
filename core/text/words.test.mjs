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
  assert.deepEqual(bezImen(ws, im), [{ w: 'a', i: 0 }, { w: '§imya§', i: 1, do: 3 }, { w: 'b', i: 4 }]);
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

test('адреса — пробелом, слова рядом остаются', () => {
  assert.equal(bezAdresov('see https://example.com/a?b=1#c now'), 'see   now');
  assert.deepEqual(slova(bezAdresov('x https://example.com/x⠀word')), ['x', 'word']);
});
