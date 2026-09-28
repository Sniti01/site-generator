// Мои тесты проверяющего (r4-A-zakon-prov); кладутся рядом с копией core/text (импорт './corpus.mjs').
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
import { izvlechStranicu } from './extract.mjs';

const ZDES = dirname(fileURLToPath(import.meta.url));

function korpus(docs) {
  const papka = mkdtempSync(join(tmpdir(), 'prov-korpus-'));
  mkdirSync(join(papka, 'raw'));
  const zapisi = docs.map((d, i) => {
    const file = `raw/d${i}.html.gz`;
    writeFileSync(join(papka, file), gzipSync(d.html));
    return JSON.stringify({ url: d.url, outcome: 'ok', file, ...(d.ct ? { content_type: d.ct } : {}) });
  });
  writeFileSync(join(papka, 'manifest.jsonl'), zapisi.join('\n') + '\n');
  return papka;
}
const jsonFajly = (kesh) => readdirSync(kesh).filter((x) => x.endsWith('.json.gz'));
const fajlKesha = (kesh) => join(kesh, jsonFajly(kesh)[0]);
const chitatKesh = (f) => JSON.parse(gunzipSync(readFileSync(f)).toString('utf8'));
const pisatKesh = (f, k) => writeFileSync(f, gzipSync(JSON.stringify(k)));

// Кодировщик по таблице TextDecoder (обратная таблица однобайтовой кодировки).
function kodirovat(s, enc) {
  const dec = new TextDecoder(enc);
  const obr = new Map();
  for (let b = 0; b < 256; b++) obr.set(dec.decode(Uint8Array.of(b)), b);
  return Buffer.from([...s].map((c) => {
    if (!obr.has(c)) throw new Error(`нет ${c} в ${enc}`);
    return obr.get(c);
  }));
}

test('Z1: <meta charset=ISO-8859-2> (не http-equiv) решает для польского документа', () => {
  const html = kodirovat('<html><head><meta charset=ISO-8859-2><title>x</title></head><body><p>W starym zamku żyła księżniczka, która śpiewała pieśni o gęsiach i łabędziach.</p></body></html>', 'iso-8859-2');
  const uk = ukazatelKorpusa(korpus([{ url: 'u', html }]), { kesh: null });
  assert.equal(uk.nayti('w starym zamku żyła księżniczka która śpiewała pieśni', 'tochno'), 'u');
});

test('Z2a: pustyh < 0 при своём ключе — пересчёт', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'prov-kesh-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }, { url: 'v', html: '<p>tiny</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const f = fajlKesha(kesh);
  pisatKesh(f, { ...chitatKesh(f), pustyh: -5 });
  const u = ukazatelKorpusa(p, { kesh });
  assert.equal(u.izKesha, false);
  assert.equal(u.pustyh, 1);
});

test('Z2b: pustyh > n при своём ключе — пересчёт', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'prov-kesh-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }, { url: 'v', html: '<p>tiny</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const f = fajlKesha(kesh);
  pisatKesh(f, { ...chitatKesh(f), pustyh: 99 });
  const u = ukazatelKorpusa(p, { kesh });
  assert.equal(u.izKesha, false);
  assert.equal(u.pustyh, 1);
});

const f64 = (b) => new Float64Array(new Uint8Array(Buffer.from(b, 'base64')).buffer);
const u32 = (b) => new Uint32Array(new Uint8Array(Buffer.from(b, 'base64')).buffer);
const b64 = (a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
function porcha(fn) {
  const kesh = mkdtempSync(join(tmpdir(), 'prov-kesh-'));
  const p = korpus([{ url: 'u', html: '<p>alpha bravo charlie delta echo foxtrot golf hotel india juliet</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const f = fajlKesha(kesh);
  const k = chitatKesh(f);
  pisatKesh(f, { ...k, srez: fn(k.srez) });
  let u;
  let oshibka = null;
  try {
    u = ukazatelKorpusa(p, { kesh });
    u.nayti('charlie delta echo foxtrot golf hotel india juliet', 'srez');
  } catch (e) {
    oshibka = e;
  }
  assert.equal(oshibka, null, `падение: ${oshibka?.message}`);
  assert.equal(u.izKesha, false);
  assert.equal(u.nayti('charlie delta echo foxtrot golf hotel india juliet', 'srez'), 'u');
}
test('Z3a: номер документа = n при своём ключе — пересчёт', () => porcha((r) => ({ h: r.h, d: b64(u32(r.d).fill(1)) })));
test('Z3b: два соседних хеша переставлены при своём ключе — пересчёт', () =>
  porcha((r) => {
    const h = f64(r.h);
    [h[0], h[1]] = [h[1], h[0]];
    return { h: b64(h), d: r.d };
  }));
test('Z3c: d короче h при своём ключе — пересчёт, не падение', () => porcha((r) => ({ h: r.h, d: b64(u32(r.d).slice(0, 1)) })));

test('Z4: запись под новым ключом убирает .tmp своего корпуса старше часа (90 мин), свежий (10 мин) оставляет', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'prov-kesh-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const pr = jsonFajly(kesh)[0].slice(0, 16);
  const star = join(kesh, `${pr}-${'c'.repeat(64)}.json.gz.9001.tmp`);
  const svez = join(kesh, `${pr}-${'d'.repeat(64)}.json.gz.9002.tmp`);
  writeFileSync(star, 'x');
  writeFileSync(svez, 'x');
  const t90 = (Date.now() - 90 * 60 * 1000) / 1000;
  const t10 = (Date.now() - 10 * 60 * 1000) / 1000;
  utimesSync(star, t90, t90);
  utimesSync(svez, t10, t10);
  ukazatelKorpusa(p, { imena: ['zz qq'], kesh });
  assert.equal(existsSync(star), false, '90 минут');
  assert.equal(existsSync(svez), true, '10 минут');
});

async function staryiKod(zamena) {
  const kopiya = mkdtempSync(join(tmpdir(), 'prov-core-'));
  const p5 = createRequire(join(ZDES, 'corpus.mjs')).resolve('parse5');
  symlinkSync(p5.slice(0, p5.lastIndexOf('node_modules') + 'node_modules'.length), join(kopiya, 'node_modules'), 'junction');
  mkdirSync(join(kopiya, 'text'));
  for (const f of readdirSync(ZDES).filter((x) => x.endsWith('.mjs') && !x.endsWith('.test.mjs'))) copyFileSync(join(ZDES, f), join(kopiya, 'text', f));
  const url = pathToFileURL(join(kopiya, 'text', 'corpus.mjs')).href;
  const { ukazatelKorpusa: staryi } = await import(url);
  const ex = join(kopiya, 'text', 'extract.mjs');
  const src = readFileSync(ex, 'utf8');
  assert.ok(src.includes(zamena[0]));
  writeFileSync(ex, src.replace(zamena[0], zamena[1]));
  const novyi = (p, kesh) =>
    JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `const { ukazatelKorpusa } = await import(${JSON.stringify(url)}); const u = ukazatelKorpusa(${JSON.stringify(p)}, { kesh: ${JSON.stringify(kesh)} }); console.log(JSON.stringify({ izKesha: u.izKesha, e: u.oshibkaKesha }));`], { encoding: 'utf8' }));
  return { staryi, novyi, snyat: () => unlinkSync(join(kopiya, 'node_modules')) };
}
const BEZ_P = ["new Set(['script', 'style', 'template'])", "new Set(['script', 'style', 'template', 'p'])"];
const DOK = '<div>kilo lima mike november oscar papa quebec romeo</div><p>one two three four five six seven eight</p>';

test('Z5a: старый загруженный код после смены исходников кеш не пишет', async () => {
  const { staryi, snyat } = await staryiKod(BEZ_P);
  const kesh = mkdtempSync(join(tmpdir(), 'prov-kesh-'));
  const u = staryi(korpus([{ url: 'u', html: DOK }]), { kesh });
  snyat();
  assert.deepEqual(jsonFajly(kesh), []);
});

test('Z5b: кеш нового кода (без <p>) старый загруженный код не берёт — фраза из <p> находится', async () => {
  const { staryi, novyi, snyat } = await staryiKod(BEZ_P);
  const kesh = mkdtempSync(join(tmpdir(), 'prov-kesh-'));
  const p = korpus([{ url: 'u', html: DOK }]);
  const n = novyi(p, kesh);
  assert.equal(n.izKesha, false);
  assert.equal(jsonFajly(kesh).length, 1);
  const u = staryi(p, { kesh });
  snyat();
  assert.equal(u.nayti('one two three four five six seven eight', 'tochno'), 'u', `izKesha ${u.izKesha}`);
});

const FRAZA = 'Detail is never washed out, as faces, building façades, clothing, and all sorts of objects appear realistic.';
test('Z6a: <meta charset=utf-16> у UTF-8 с битым байтом в тексте — UTF-8 (WHATWG prescan)', () => {
  const html = Buffer.concat([Buffer.from('<html><head><meta charset="utf-16"></head><body><p>Max'), Buffer.from([0x92]), Buffer.from(`s</p><p>${FRAZA}</p></body></html>`, 'utf8')]);
  assert.equal(ukazatelKorpusa(korpus([{ url: 'u', html }]), { kesh: null }).nayti('as faces building façades clothing and all sorts', 'tochno'), 'u');
});
test('Z6b: <meta charset=unicode> — то же', () => {
  const html = Buffer.concat([Buffer.from('<html><head><meta charset=unicode></head><body><p>Max'), Buffer.from([0x92]), Buffer.from(`s</p><p>${FRAZA}</p></body></html>`, 'utf8')]);
  assert.equal(ukazatelKorpusa(korpus([{ url: 'u', html }]), { kesh: null }).nayti('as faces building façades clothing and all sorts', 'tochno'), 'u');
});
test('Z6c: <meta charset=x-user-defined> у windows-1252 — windows-1252 (WHATWG prescan)', () => {
  const html = kodirovat(`<html><head><meta charset="x-user-defined"></head><body><p>${FRAZA}</p></body></html>`, 'windows-1252');
  assert.equal(ukazatelKorpusa(korpus([{ url: 'u', html }]), { kesh: null }).nayti('as faces building façades clothing and all sorts', 'tochno'), 'u');
});

test('Z7: кеш взят — брошенный .tmp старше часа всё равно убран (обещание шапки «уборкой через час»)', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'prov-kesh-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const tmp = `${fajlKesha(kesh)}.31337.tmp`;
  writeFileSync(tmp, 'x');
  const t = (Date.now() - 3 * 3600 * 1000) / 1000;
  utimesSync(tmp, t, t);
  const u = ukazatelKorpusa(p, { kesh });
  assert.equal(u.izKesha, true);
  assert.equal(existsSync(tmp), false);
});

test('F-A33: имена ["x y","r\\ns"] и ["x y\\nr","s"] (одна склейка join) — разные ключи', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'prov-kesh-'));
  const p = korpus([{ url: 'u', html: '<p>aa bb x y cc r s dd ee ff gg hh</p>' }]);
  ukazatelKorpusa(p, { imena: ['x y', 'r\ns'], kesh });
  const u = ukazatelKorpusa(p, { imena: ['x y\nr', 's'], kesh });
  assert.equal(u.izKesha, false);
  // законная форма: те же имена — тот же ключ
  assert.equal(ukazatelKorpusa(p, { imena: ['x y\nr', 's'], kesh }).izKesha, true);
});

test('F-A36: twitter:image:alt — property, прописные, и вынесенный в <body> (noscript закрыл голову)', () => {
  const h = '<html><head><title>T</title><meta property="TWITTER:Image:Alt" content="A1"><noscript><img src=x></noscript><meta name="twitter:image:alt" content="A2"></head><body><main><p>x</p></main></body></html>';
  assert.deepEqual(izvlechStranicu(h).golova['twitter:image:alt'], ['A1', 'A2']);
});
