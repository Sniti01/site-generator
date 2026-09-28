// Ещё по одному члену классов форм A3-2, A3-3, A3-6, которые скептик назвал закрытыми.
import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ukazatelKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';
import { izvlechStranicu } from 'file:///D:/SEO/cloud/site-generator/core/text/extract.mjs';

const ZDES = dirname(fileURLToPath(import.meta.url));
const koren = join(ZDES, 'chleny-da');
rmSync(koren, { recursive: true, force: true });
const korpus = (imya, docs) => {
  const p = join(koren, imya);
  mkdirSync(join(p, 'raw'), { recursive: true });
  writeFileSync(join(p, 'manifest.jsonl'), docs.map((h, i) => (writeFileSync(join(p, 'raw', `d${i}.html.gz`), gzipSync(h)), JSON.stringify({ url: `u${i}`, outcome: 'ok', file: `raw/d${i}.html.gz` }))).join('\n') + '\n');
  return p;
};
const G0 = 'one two three four five six seven eight';
const G1 = 'alpha bravo charlie delta echo foxtrot golf hotel';

// A3-2: несогласованность, которой проверки не видят, — только подделкой при своём ключе?
// (а) единственный хеш режима — NaN; (б) номера документов в пределах n, но не те (все — 0).
{
  const kesh = join(koren, 'kesh-a');
  const p = korpus('a', [`<p>${G0}</p>`, `<p>${G1}</p>`]);
  ukazatelKorpusa(p, { kesh });
  const f = join(kesh, readdirSync(kesh).find((x) => x.endsWith('.json.gz')));
  const k = JSON.parse(gunzipSync(readFileSync(f)).toString('utf8'));
  const b64 = (T, a) => Buffer.from(T.from(a).buffer).toString('base64');
  writeFileSync(f, gzipSync(JSON.stringify({ ...k, tochno: { h: b64(Float64Array, [NaN]), d: b64(Uint32Array, [0]) } })));
  const ua = ukazatelKorpusa(p, { kesh });
  console.log('A3-2 (а) NaN единственным хешем при своём ключе:', JSON.stringify({ izKesha: ua.izKesha, G0: ua.nayti(G0, 'tochno') }));
  const d = new Uint32Array(Buffer.from(k.tochno.d, 'base64').length / 4); // все нули
  writeFileSync(f, gzipSync(JSON.stringify({ ...k, tochno: { h: k.tochno.h, d: Buffer.from(d.buffer).toString('base64') } })));
  const ub = ukazatelKorpusa(p, { kesh });
  console.log('A3-2 (б) номера документов в пределах, но не те:', JSON.stringify({ izKesha: ub.izKesha, G1: ub.nayti(G1, 'tochno') }));
}

// A3-3: разреженный массив имён и массив с null — один JSON ("[\"x\",null,\"y\"]"); что делает указатель.
{
  const kesh = join(koren, 'kesh-b');
  const p = korpus('b', [`<p>p q x y r s t u v w</p>`]);
  const razr = ['x', , 'y']; // eslint-disable-line no-sparse-arrays
  console.log('A3-3 JSON равны:', JSON.stringify(razr) === JSON.stringify(['x', null, 'y']));
  const u1 = ukazatelKorpusa(p, { imena: razr, kesh });
  console.log('A3-3 разреженный:', JSON.stringify({ izKesha: u1.izKesha, g: u1.nayti('p q §imya§ §imya§ r s t u', 'tochno') }));
  try {
    const u2 = ukazatelKorpusa(p, { imena: ['x', null, 'y'], kesh });
    console.log('A3-3 с null:', JSON.stringify({ izKesha: u2.izKesha, g: u2.nayti('p q §imya§ §imya§ r s t u', 'tochno') }));
  } catch (e) {
    console.log('A3-3 с null: бросает до ключа —', e.constructor.name, e.message.slice(0, 60));
  }
  // Второй член: имя с NFD и NFC — разные JSON, одна свёртка (разные ключи — не вред, проверяю только, что не общий).
  ukazatelKorpusa(p, { imena: ['cafe\u0301'], kesh });
  console.log('A3-3 NFD после NFC — из кеша?', ukazatelKorpusa(p, { imena: ['caf\u00e9'], kesh }).izKesha);
}

// A3-6: поля головы в иных формах: пробел в имени, itemprop, name и property с разными значениями.
{
  const html = `<!doctype html><html><head><title>T</title>
<meta name="description " content="trailing space name one two three four five six seven">
<meta itemprop="description" content="microdata description one two three four five six seven">
<meta name="og:description" content="og in name attribute one two three four five six seven">
<meta name="DC.description" content="dublin core description one two three four five six">
</head><body><main><p>x</p></main></body></html>`;
  const g = izvlechStranicu(html).golova;
  console.log('A3-6 голова:', JSON.stringify(g));
}
