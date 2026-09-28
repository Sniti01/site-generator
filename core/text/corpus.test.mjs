// Тесты указателя корпуса (П102 блок А): node --test core/text/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, appendFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ukazatelIzTekstov, ukazatelKorpusa, dokumentyKorpusa, OshibkaKorpusa } from './corpus.mjs';

const tekst = (url, s) => ({ url, vplotnuyu: s, cherezProbel: s });

test('указатель по текстам: точная 8-грамма и срез окончаний, документ — первый по порядку', () => {
  const uk = ukazatelIzTekstov([
    tekst('a', 'zero one two three four five six seven eight nine'),
    tekst('b', 'one two three four five six seven eight'),
    tekst('c', 'the continued disappointing sales of the game here'),
  ]);
  assert.equal(uk.dokumentov, 3);
  assert.equal(uk.nayti('one two three four five six seven eight', 'tochno'), 'a');
  assert.equal(uk.nayti('two three four five six seven eight nine', 'tochno'), 'a');
  assert.equal(uk.nayti('one two three four five six seven nine', 'tochno'), null);
  assert.equal(uk.nayti('the continued disappointing sale of the game here', 'srez'), 'c');
  assert.equal(uk.nayti('the continued disappointing sale of the game here', 'tochno'), null);
});

test('указатель: имена сайта одним словом с обеих сторон', () => {
  const uk = ukazatelIzTekstov([tekst('x', 'so in Max Payne 3 the hero moves to a new city now')], { imena: ['Max Payne 3'] });
  assert.equal(uk.nayti('in §imya§ the hero moves to a new', 'tochno'), 'x');
  assert.equal(uk.nayti('in max payne 3 the hero moves to', 'tochno'), null);
});

test('указатель: оба прочтения документа', () => {
  const uk = ukazatelIzTekstov([{ url: 'd', vplotnuyu: 'a b c d e f gh i', cherezProbel: 'a b c d e f g h i' }]);
  assert.equal(uk.nayti('a b c d e f gh i', 'tochno'), 'd');
  assert.equal(uk.nayti('b c d e f g h i', 'tochno'), 'd');
});

/** Временный корпус: `docs` — `[{ url, html }]`; `ok: false` — запись без файла. */
function korpus(docs) {
  const papka = mkdtempSync(join(tmpdir(), 'korpus-test-'));
  mkdirSync(join(papka, 'raw'));
  const zapisi = docs.map((d, i) => {
    const file = `raw/d${i}.html.gz`;
    if (d.html !== undefined) writeFileSync(join(papka, file), gzipSync(d.html));
    return JSON.stringify({ url: d.url, outcome: d.outcome ?? 'ok', file });
  });
  writeFileSync(join(papka, 'manifest.jsonl'), zapisi.join('\n') + '\n');
  return papka;
}

test('корпус громко: нет манифеста, нет raw/, нет файла', () => {
  const pusto = mkdtempSync(join(tmpdir(), 'korpus-test-'));
  assert.throws(() => dokumentyKorpusa(pusto), OshibkaKorpusa);
  const bezRaw = korpus([{ url: 'u', html: '<p>x</p>' }]);
  rmSync(join(bezRaw, 'raw'), { recursive: true });
  assert.throws(() => dokumentyKorpusa(bezRaw), /нет папки/);
  const bezFajla = korpus([{ url: 'u', html: '<p>x</p>' }, { url: 'v' }]);
  assert.throws(() => dokumentyKorpusa(bezFajla), /нет 1 из 2 файлов/);
});

test('корпус: последняя запись адреса — действующая; не скачанный — не документ', () => {
  const p = korpus([{ url: 'u', html: '<p>x</p>' }, { url: 'w', outcome: 'http-error', html: '<p>y</p>' }]);
  appendFileSync(join(p, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'http-error' }) + '\n');
  assert.throws(() => dokumentyKorpusa(p), /нет ни одного скачанного/);
});

test('указатель корпуса: кеш по манифесту и именам; подтверждение по сырью', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([
    { url: 'https://a/', html: '<html><head><title>A</title></head><body><p>one two three four five six seven eight nine</p></body></html>' },
    { url: 'https://b/', html: '<html><body><h2>Max Payne 3 story</h2><p>the hero moves to a new city now and then</p></body></html>' },
  ]);
  const u1 = ukazatelKorpusa(p, { imena: ['Max Payne 3'], kesh });
  assert.equal(u1.izKesha, false);
  assert.equal(u1.nayti('one two three four five six seven eight', 'tochno'), 'https://a/');
  // 8-грамма через границу блоков документа — в указателе (поток документа).
  assert.equal(u1.nayti('§imya§ story the hero moves to a new', 'tochno'), 'https://b/');
  const u2 = ukazatelKorpusa(p, { imena: ['Max Payne 3'], kesh });
  assert.equal(u2.izKesha, true);
  assert.equal(u2.nayti('one two three four five six seven eight', 'tochno'), 'https://a/');
  assert.equal(ukazatelKorpusa(p, { imena: [], kesh }).izKesha, false, 'другие имена — другой ключ');
  appendFileSync(join(p, 'manifest.jsonl'), JSON.stringify({ url: 'https://c/', outcome: 'http-error' }) + '\n');
  assert.equal(ukazatelKorpusa(p, { imena: ['Max Payne 3'], kesh }).izKesha, false, 'другой манифест — другой ключ');
});
