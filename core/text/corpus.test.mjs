// Тесты указателя корпуса (П102 блок А): node --test core/text/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, appendFileSync, readFileSync, readdirSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
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

/* — «судью судят», блок А, раунд 1 (линза указателя и кеша, A1-UK-*) — */

test('A1-UK-1: тот же манифест, другое сырьё — указатель не старый', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p1 = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  const p2 = korpus([{ url: 'u', html: '<p>alpha bravo charlie delta echo foxtrot golf hotel</p>' }]);
  assert.equal(ukazatelKorpusa(p1, { kesh }).izKesha, false);
  const u2 = ukazatelKorpusa(p2, { kesh });
  assert.equal(u2.izKesha, false);
  assert.equal(u2.nayti('alpha bravo charlie delta echo foxtrot golf hotel', 'tochno'), 'u');
});

test('A1-UK-2: документы есть, а 8-грамм нет — громкий отказ', () => {
  const p = korpus([{ url: 'u', html: '' }, { url: 'v', html: '<html><head><title>Only a title</title></head><body></body></html>' }]);
  assert.throws(() => ukazatelKorpusa(p, { kesh: null }), OshibkaKorpusa);
});

test('A1-UK-3: адрес — пробелом и в документе (одна модель слов)', () => {
  const uk = ukazatelIzTekstov([tekst('x', 'Grab it at https://x.io/y and play it again now')]);
  assert.equal(uk.nayti('grab it at and play it again now', 'tochno'), 'x');
});

test('A1-UK-4: имя не сворачивается через границу блоков документа', () => {
  const p = korpus([{ url: 'u', html: '<html><body><h2>Max Payne</h2><p>Mobile ports of the game arrived in 2012.</p></body></html>' }]);
  const uk = ukazatelKorpusa(p, { imena: ['Max Payne Mobile'], kesh: null });
  assert.equal(uk.nayti('mobile ports of the game arrived in 2012', 'tochno'), 'u');
});

test('A1-UK-5: притяжательное имени — то же имя (в обоих режимах)', () => {
  const uk = ukazatelIzTekstov([tekst('x', "Max Payne 3's story takes the hero to São Paulo")], { imena: ['Max Payne 3'] });
  assert.equal(uk.nayti('§imya§ story take the hero to são paulo', 'srez'), 'x');
  assert.equal(uk.nayti('§imya§ story takes the hero to são paulo', 'tochno'), 'x');
});

test.todo('A1-UK-6: столкновение 53-битных хешей внутри корпуса не даёт пропуска (подтверждается только первый документ хеша — предел)');

test('A1-UK-7: документ в windows-1252 по charset манифеста: 0x92 — апостроф, как у браузера', () => {
  const papka = mkdtempSync(join(tmpdir(), 'korpus-test-'));
  mkdirSync(join(papka, 'raw'));
  const html = Buffer.concat([Buffer.from('<html><body><p>Max'), Buffer.from([0x92]), Buffer.from('s gun jams when the hero needs it most</p></body></html>')]);
  writeFileSync(join(papka, 'raw', 'd0.html.gz'), gzipSync(html));
  writeFileSync(join(papka, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html.gz', content_type: 'text/html; charset=iso-8859-1' }) + '\n');
  assert.equal(ukazatelKorpusa(papka, { kesh: null }).nayti("max's gun jams when the hero needs it", 'tochno'), 'u');
});

test('A1-UK-10: испорченный файл кеша — пересчёт, а не вечный отказ', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const f = join(kesh, readdirSync(kesh).find((x) => x.endsWith('.json.gz')));
  const b = readFileSync(f);
  writeFileSync(f, b.subarray(0, b.length >> 1));
  const u = ukazatelKorpusa(p, { kesh });
  assert.equal(u.izKesha, false);
  assert.equal(u.nayti('one two three four five six seven eight', 'tochno'), 'u');
});

test('A1-UK-10: старые файлы кеша уходят, остаётся один на ключ', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  ukazatelKorpusa(p, { imena: [], kesh });
  ukazatelKorpusa(p, { imena: ['Max Payne 3'], kesh });
  assert.equal(readdirSync(kesh).filter((x) => x.endsWith('.json.gz')).length, 1);
});

test('A1-UK-15: подтверждение по сырью — хеш из кеша без слов в сырье не находка', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  const u0 = ukazatelKorpusa(p, { kesh });
  assert.equal(u0.nayti('one two three four five six seven eight', 'tochno'), 'u');
  // Сырьё подменено: ключ меняется (отпечаток сырья), пересчёт; прежней 8-граммы нет.
  writeFileSync(join(p, 'raw/d0.html.gz'), gzipSync('<p>nothing like it at all here now or then</p>'));
  assert.equal(ukazatelKorpusa(p, { kesh }).nayti('one two three four five six seven eight', 'tochno'), null);
});

test('A1-UK-15: файл пропал после кеша — отказ', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight nine</p>' }]);
  ukazatelKorpusa(p, { kesh });
  rmSync(join(p, 'raw/d0.html.gz'));
  assert.throws(() => ukazatelKorpusa(p, { kesh }), OshibkaKorpusa);
});

test('A1-UK-15: манифест — «отказ, потом ok» делает адрес документом; первый документ — по первому появлению адреса', () => {
  const papka = mkdtempSync(join(tmpdir(), 'korpus-test-'));
  mkdirSync(join(papka, 'raw'));
  writeFileSync(join(papka, 'raw', 'd0.html.gz'), gzipSync('<p>one two three four five six seven eight</p>'));
  writeFileSync(join(papka, 'raw', 'd1.html.gz'), gzipSync('<p>one two three four five six seven eight</p>'));
  writeFileSync(
    join(papka, 'manifest.jsonl'),
    [{ url: 'a', outcome: 'timeout' }, { url: 'b', outcome: 'ok', file: 'raw/d1.html.gz' }, { url: 'a', outcome: 'ok', file: 'raw/d0.html.gz' }, { url: 'c', outcome: 'ok' }]
      .map((r) => JSON.stringify(r))
      .join('\n') + '\n'
  );
  assert.deepEqual(dokumentyKorpusa(papka).map((d) => d.url), ['a', 'b']);
  assert.equal(ukazatelKorpusa(papka, { kesh: null }).nayti('one two three four five six seven eight', 'tochno'), 'a');
});

test('A1-UK-15: оборванная строка манифеста — ошибка корпуса с номером строки', () => {
  const p = korpus([{ url: 'u', html: '<p>x</p>' }]);
  appendFileSync(join(p, 'manifest.jsonl'), '{"url":"v","outc');
  assert.throws(() => dokumentyKorpusa(p), (e) => e instanceof OshibkaKorpusa && /строка 2/.test(e.message));
});

/* — «судью судят», блок А, раунд 2 (A2-*) — */

test('A2-4: BOM важнее charset манифеста, как у браузера', () => {
  const papka = mkdtempSync(join(tmpdir(), 'korpus-test-'));
  mkdirSync(join(papka, 'raw'));
  const html = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('<html><body><p>Max’s gun jams when the hero needs it most</p></body></html>', 'utf8')]);
  writeFileSync(join(papka, 'raw', 'd0.html.gz'), gzipSync(html));
  writeFileSync(join(papka, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html.gz', content_type: 'text/html; charset=iso-8859-1' }) + '\n');
  assert.equal(ukazatelKorpusa(papka, { kesh: null }).nayti("max's gun jams when the hero needs it", 'tochno'), 'u');
});

test('A2-5: кеш двух корпусов в общей папке не вытесняет друг друга', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p1 = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  const p2 = korpus([{ url: 'v', html: '<p>alpha bravo charlie delta echo foxtrot golf hotel</p>' }]);
  ukazatelKorpusa(p1, { kesh });
  ukazatelKorpusa(p2, { kesh });
  assert.equal(ukazatelKorpusa(p1, { kesh }).izKesha, true);
});

test('A2-6: пустой или несогласованный кеш — пересчёт', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const f = join(kesh, readdirSync(kesh).find((x) => x.endsWith('.json.gz')));
  const k = JSON.parse(gunzipSync(readFileSync(f)).toString('utf8'));
  writeFileSync(f, gzipSync(JSON.stringify({ tochno: { h: '', d: '' }, srez: { h: '', d: '' } })));
  assert.equal(ukazatelKorpusa(p, { kesh }).izKesha, false);
  const d7 = (b) => Buffer.from(new Uint32Array(Buffer.from(b, 'base64').length / 4).fill(7).buffer).toString('base64');
  writeFileSync(f, gzipSync(JSON.stringify({ tochno: { h: k.tochno.h, d: d7(k.tochno.d) }, srez: { h: k.srez.h, d: d7(k.srez.d) } })));
  const u2 = ukazatelKorpusa(p, { kesh });
  assert.equal(u2.izKesha, false);
  assert.equal(u2.nayti('one two three four five six seven eight', 'tochno'), 'u');
});

test('A2-7: неудачная запись кеша не оставляет .tmp; сбой уборки — не «кеш не записан»', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const f = readdirSync(kesh).find((x) => x.endsWith('.json.gz'));
  rmSync(join(kesh, f));
  mkdirSync(join(kesh, f));
  ukazatelKorpusa(p, { kesh });
  assert.deepEqual(readdirSync(kesh).filter((x) => x.endsWith('.tmp')), []);
  const kesh2 = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const u1 = ukazatelKorpusa(p, { kesh: kesh2 });
  const imyaChuzhogo = readdirSync(kesh2).find((x) => x.endsWith('.json.gz')).replace(/-[0-9a-f]{64}\.json\.gz$/, '-' + '0'.repeat(64) + '.json.gz');
  mkdirSync(join(kesh2, imyaChuzhogo));
  const u2 = ukazatelKorpusa(p, { imena: ['x y'], kesh: kesh2 });
  assert.equal(u1.oshibkaKesha, null);
  assert.doesNotMatch(u2.oshibkaKesha ?? '', /не записан/);
});

test('A2-10: сырьё сменилось между отпечатком и построением — кеш не пишется', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  const chteniy = new Map();
  const chitat = (f) => {
    chteniy.set(f, (chteniy.get(f) ?? 0) + 1);
    return chteniy.get(f) === 1 ? readFileSync(f) : gzipSync('<p>alpha bravo charlie delta echo foxtrot golf hotel</p>');
  };
  const u = ukazatelKorpusa(p, { kesh, chitat });
  assert.deepEqual(readdirSync(kesh).filter((x) => x.endsWith('.json.gz')), []);
  assert.match(u.oshibkaKesha ?? '', /менялось/);
});

test('A2-11: совпадение хеша без слов в документе — не находка (подтверждение словами)', () => {
  const k1 = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const k2 = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p1 = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  const p2 = korpus([{ url: 'u', html: '<p>alpha bravo charlie delta echo foxtrot golf hotel</p>' }]);
  ukazatelKorpusa(p1, { kesh: k1 });
  ukazatelKorpusa(p2, { kesh: k2 });
  const f1 = readdirSync(k1).find((x) => x.endsWith('.json.gz'));
  const f2 = readdirSync(k2).find((x) => x.endsWith('.json.gz'));
  writeFileSync(join(k1, f1), readFileSync(join(k2, f2)));
  const u = ukazatelKorpusa(p1, { kesh: k1 });
  assert.equal(u.izKesha, true);
  assert.equal(u.nayti('alpha bravo charlie delta echo foxtrot golf hotel', 'tochno'), null);
});

const korpusCs = (b, ct) => {
  const p = mkdtempSync(join(tmpdir(), 'korpus-test-'));
  mkdirSync(join(p, 'raw'));
  writeFileSync(join(p, 'raw', 'd0.html.gz'), gzipSync(b));
  writeFileSync(join(p, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html.gz', content_type: ct }) + '\n');
  return p;
};
test('A2-12: charset в кавычках читается, неизвестная метка — UTF-8', () => {
  const w = Buffer.concat([Buffer.from('<p>Max'), Buffer.from([0x92]), Buffer.from('s gun jams when the hero needs it most</p>')]);
  assert.equal(ukazatelKorpusa(korpusCs(w, 'text/html; charset="windows-1252"'), { kesh: null }).nayti("max's gun jams when the hero needs it", 'tochno'), 'u');
  const u8 = Buffer.from('<p>Max’s gun jams when the hero needs it most</p>', 'utf8');
  assert.equal(ukazatelKorpusa(korpusCs(u8, 'text/html; charset=x-no-such'), { kesh: null }).nayti("max's gun jams when the hero needs it", 'tochno'), 'u');
});

test('A2-14: число документов без 8-грамм — в указателе', () => {
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }, { url: 'v', html: '<p>short</p>' }]);
  assert.equal(ukazatelKorpusa(p, { kesh: null }).pustyh, 1);
});

test('A1-UK-15: kesh: null — файлы кеша не пишутся; сырой файл без .gz читается', () => {
  const papka = mkdtempSync(join(tmpdir(), 'korpus-test-'));
  mkdirSync(join(papka, 'raw'));
  writeFileSync(join(papka, 'raw', 'd0.html'), '<p>one two three four five six seven eight</p>');
  writeFileSync(join(papka, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html' }) + '\n');
  assert.equal(ukazatelKorpusa(papka, { kesh: null }).nayti('one two three four five six seven eight', 'tochno'), 'u');
});
