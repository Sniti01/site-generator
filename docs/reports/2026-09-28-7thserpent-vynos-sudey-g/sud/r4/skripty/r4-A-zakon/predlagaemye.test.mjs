// Предлагаемые тесты раунда 4 (линза «законные формы и защита правки», блок А).
// Кладутся рядом с копией core/text (импорт './corpus.mjs'); зелёные на текущем коде, красные на мутации.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, symlinkSync, copyFileSync, unlinkSync, utimesSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { ukazatelKorpusa } from './corpus.mjs';

const ZDES = dirname(fileURLToPath(import.meta.url));

function korpus(docs) {
  const papka = mkdtempSync(join(tmpdir(), 'korpus-test-'));
  mkdirSync(join(papka, 'raw'));
  const zapisi = docs.map((d, i) => {
    const file = `raw/d${i}.html.gz`;
    writeFileSync(join(papka, file), gzipSync(d.html));
    return JSON.stringify({ url: d.url, outcome: 'ok', file, ...(d.ct ? { content_type: d.ct } : {}) });
  });
  writeFileSync(join(papka, 'manifest.jsonl'), zapisi.join('\n') + '\n');
  return papka;
}
const fajlKesha = (kesh) => join(kesh, readdirSync(kesh).find((x) => x.endsWith('.json.gz')));
const chitatKesh = (f) => JSON.parse(gunzipSync(readFileSync(f)).toString('utf8'));
const pisatKesh = (f, k) => writeFileSync(f, gzipSync(JSON.stringify(k)));

test('R4-A-Z-1 (A3-1): <meta charset> головы решает, когда он не windows-1252 (iso-8859-2, как miastogier.pl корпуса ac4bf)', () => {
  // «Rycerz szedł przez las i widział tam dużo drzew» в iso-8859-2: ł = 0xB3, ż = 0xBF; байт 0xB3 — не UTF-8.
  const html = Buffer.concat([
    Buffer.from('<html><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-2"></head><body><p>Rycerz szed'),
    Buffer.from([0xb3]),
    Buffer.from(' przez las i widzia'),
    Buffer.from([0xb3]),
    Buffer.from(' tam du'),
    Buffer.from([0xbf]),
    Buffer.from('o drzew i krzewow</p></body></html>'),
  ]);
  const uk = ukazatelKorpusa(korpus([{ url: 'u', html }]), { kesh: null });
  assert.equal(uk.nayti('rycerz szedł przez las i widział tam dużo', 'tochno'), 'u');
});

test('R4-A-Z-2 (A3-2): pustyh вне 0…n в кеше со своим ключом — пересчёт', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }, { url: 'v', html: '<p>short</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const f = fajlKesha(kesh);
  const k = chitatKesh(f);
  for (const pustyh of [-1, 3]) {
    pisatKesh(f, { ...k, pustyh });
    const u = ukazatelKorpusa(p, { kesh });
    assert.equal(u.izKesha, false, `pustyh ${pustyh}`);
    assert.equal(u.pustyh, 1);
  }
});

test('R4-A-Z-3 (A2-6 под ключом A3-2): номер документа, порядок и длины — пересчёт и у кеша со своим ключом', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight nine ten</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const f = fajlKesha(kesh);
  const k = chitatKesh(f);
  const u32 = (b) => new Uint32Array(new Uint8Array(Buffer.from(b, 'base64')).buffer);
  const f64 = (b) => new Float64Array(new Uint8Array(Buffer.from(b, 'base64')).buffer);
  const b64 = (a) => Buffer.from(a.buffer).toString('base64');
  const porchi = {
    'номер документа': { ...k, tochno: { h: k.tochno.h, d: b64(u32(k.tochno.d).fill(7)) } },
    'порядок хешей': { ...k, tochno: { h: b64(f64(k.tochno.h).reverse()), d: k.tochno.d } },
    'длины h и d': { ...k, tochno: { h: k.tochno.h, d: b64(u32(k.tochno.d).subarray(0, 1).slice()) } },
  };
  for (const [chto, porcha] of Object.entries(porchi)) {
    pisatKesh(f, porcha);
    const u = ukazatelKorpusa(p, { kesh });
    assert.equal(u.izKesha, false, chto);
    assert.equal(u.nayti('three four five six seven eight nine ten', 'tochno'), 'u', chto);
  }
});

test('R4-A-Z-4 (A3-4): брошенный .tmp своего корпуса старше часа убирается, свежий (идёт запись другим процессом) — нет', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const prefiks = /^([0-9a-f]{16})-/.exec(readdirSync(kesh).find((x) => x.endsWith('.json.gz')))[1];
  const staryi = join(kesh, `${prefiks}-${'1'.repeat(64)}.json.gz.111.tmp`);
  const svezhiy = join(kesh, `${prefiks}-${'2'.repeat(64)}.json.gz.222.tmp`);
  writeFileSync(staryi, 'x');
  writeFileSync(svezhiy, 'x');
  const dvaChasa = (Date.now() - 2 * 3600 * 1000) / 1000;
  utimesSync(staryi, dvaChasa, dvaChasa);
  ukazatelKorpusa(p, { imena: ['x y'], kesh }); // другой ключ — запись и уборка
  assert.equal(existsSync(staryi), false, 'брошенный .tmp');
  assert.equal(existsSync(svezhiy), true, 'свежий .tmp');
});

/** Копия core/text (из папки этого теста) со ссылкой на node_modules; `izmenit` — правка исходника на диске. */
async function staryiKod() {
  const kopiya = mkdtempSync(join(tmpdir(), 'core-text-'));
  const p5 = createRequire(join(ZDES, 'corpus.mjs')).resolve('parse5');
  symlinkSync(p5.slice(0, p5.lastIndexOf('node_modules') + 'node_modules'.length), join(kopiya, 'node_modules'), 'junction');
  mkdirSync(join(kopiya, 'text'));
  for (const f of readdirSync(ZDES).filter((x) => x.endsWith('.mjs') && !x.endsWith('.test.mjs'))) copyFileSync(join(ZDES, f), join(kopiya, 'text', f));
  const url = pathToFileURL(join(kopiya, 'text', 'corpus.mjs')).href;
  const { ukazatelKorpusa: staryi } = await import(url);
  const ex = join(kopiya, 'text', 'extract.mjs');
  const src = readFileSync(ex, 'utf8');
  assert.ok(src.includes("new Set(['script', 'style', 'template'])"));
  writeFileSync(ex, src.replace("new Set(['script', 'style', 'template'])", "new Set(['script', 'template'])"));
  const novyi = (p, kesh) =>
    JSON.parse(
      execFileSync(process.execPath, ['--input-type=module', '-e', `const { ukazatelKorpusa } = await import(${JSON.stringify(url)}); const u = ukazatelKorpusa(${JSON.stringify(p)}, { kesh: ${JSON.stringify(kesh)} }); console.log(JSON.stringify({ izKesha: u.izKesha }));`], { encoding: 'utf8' })
    );
  return { staryi, novyi, snyat: () => unlinkSync(join(kopiya, 'node_modules')) };
}
const KORPUS_A35 = '<p>one two three four five six seven eight</p><style>alpha bravo charlie delta echo foxtrot golf hotel</style>';

test('R4-A-Z-5 (A3-5, запись): исходники сменились после загрузки — старый код кеш не пишет и говорит об этом', async () => {
  const { staryi, snyat } = await staryiKod();
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const u = staryi(korpus([{ url: 'u', html: KORPUS_A35 }]), { kesh });
  snyat();
  assert.deepEqual(readdirSync(kesh).filter((x) => x.endsWith('.json.gz')), []);
  assert.match(u.oshibkaKesha ?? '', /после загрузки/);
});

test('R4-A-Z-5 (A3-5, чтение): кеш нового кода старый загруженный код не берёт', async () => {
  const { staryi, novyi, snyat } = await staryiKod();
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: KORPUS_A35 }]);
  novyi(p, kesh); // новый код пишет кеш под своим ключом
  const u = staryi(p, { kesh });
  snyat();
  assert.equal(u.izKesha, false);
});

test('R4-A-Z-6 (A3-1): <meta charset="utf-16"> в байтах не UTF-16 — это UTF-8, как у браузера (WHATWG prescan)', () => {
  // Документ UTF-8 с одним битым байтом в комментарии и ошибочной меткой utf-16.
  const html = Buffer.concat([
    Buffer.from('<html><head><meta charset="utf-16"><!-- '),
    Buffer.from([0xff]),
    Buffer.from(' --></head><body><p>Detail is never washed out, as faces, building façades, clothing, and all sorts of objects appear realistic.</p></body></html>', 'utf8'),
  ]);
  const uk = ukazatelKorpusa(korpus([{ url: 'u', html }]), { kesh: null });
  assert.equal(uk.nayti('as faces building façades clothing and all sorts', 'tochno'), 'u');
});
