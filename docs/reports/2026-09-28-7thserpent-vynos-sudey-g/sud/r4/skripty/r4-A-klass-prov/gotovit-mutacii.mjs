// Копии core/text с мутациями (R4-A-K-5, R4-A-K-6) и с пробными тестами, которых сейчас нет.
// node_modules копий — ссылка (junction) на node_modules репозитория; снимается отдельной командой unlink.
import { mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, symlinkSync, rmSync, lstatSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const REPO = 'D:/SEO/cloud/site-generator/core/text';
const m = join(ZDES, 'm');
mkdirSync(m, { recursive: true });
if (!existsSync(join(m, 'node_modules'))) symlinkSync('D:/SEO/cloud/site-generator/node_modules', join(m, 'node_modules'), 'junction');
if (!lstatSync(join(m, 'node_modules')).isSymbolicLink()) throw new Error('node_modules копий — не ссылка');

const STROKA_TMP = 'else if (svoy && /\\.tmp$/.test(f) && Date.now() - statSync(p).mtimeMs > 3600 * 1000) unlinkSync(p);';
const STROKA_PUSTYH = 'if (!Number.isInteger(k.pustyh) || k.pustyh < 0 || k.pustyh > n) return null;';

// Пробные тесты: сторожат ли уборку .tmp и диапазон pustyh (на исходном коде должны быть зелёными).
const PROBY = `
import { utimesSync as __utimes, existsSync as __exists } from 'node:fs';
test('ПРОБА K-5: брошенный .tmp своего корпуса старше часа убирается, свежий — нет', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const pref = readdirSync(kesh).find((x) => x.endsWith('.json.gz')).slice(0, 16);
  const star = join(kesh, pref + '-x.json.gz.1.tmp');
  const svezh = join(kesh, pref + '-y.json.gz.2.tmp');
  writeFileSync(star, 'x');
  writeFileSync(svezh, 'y');
  const dva = new Date(Date.now() - 2 * 3600 * 1000);
  __utimes(star, dva, dva);
  ukazatelKorpusa(p, { imena: ['zzz'], kesh });
  assert.equal(__exists(star), false, 'старый .tmp остался');
  assert.equal(__exists(svezh), true, 'свежий .tmp убран');
});
test('ПРОБА K-6: pustyh вне 0…n при своём ключе — пересчёт', () => {
  const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
  const p = korpus([{ url: 'u', html: '<p>one two three four five six seven eight</p>' }]);
  ukazatelKorpusa(p, { kesh });
  const f = join(kesh, readdirSync(kesh).find((x) => x.endsWith('.json.gz')));
  const k = JSON.parse(gunzipSync(readFileSync(f)).toString('utf8'));
  for (const pustyh of [5, -1]) {
    writeFileSync(f, gzipSync(JSON.stringify({ ...k, pustyh })));
    const u = ukazatelKorpusa(p, { kesh });
    assert.equal(u.izKesha, false, 'pustyh ' + pustyh + ' принят');
    assert.equal(u.pustyh, 0);
  }
});
`;

const varianty = {
  kontrol: (s) => s,
  tmp: (s) => s.replace(STROKA_TMP, '// снято мутацией K-5'),
  pustyh: (s) => s.replace(STROKA_PUSTYH, 'if (!Number.isInteger(k.pustyh)) return null;'),
  pustyh0: (s) => s.replace(STROKA_PUSTYH, '// снято мутацией K-6 целиком'),
};
for (const [imya, mut] of Object.entries(varianty)) {
  const papka = join(m, imya, 'text');
  rmSync(papka, { recursive: true, force: true });
  mkdirSync(papka, { recursive: true });
  for (const f of readdirSync(REPO).filter((x) => x.endsWith('.mjs'))) copyFileSync(join(REPO, f), join(papka, f));
  const c = readFileSync(join(papka, 'corpus.mjs'), 'utf8');
  const c2 = mut(c);
  if (imya !== 'kontrol' && c2 === c) throw new Error(`мутация ${imya} не легла`);
  writeFileSync(join(papka, 'corpus.mjs'), c2);
  // Пробные тесты — отдельным файлом-копией теста (исходный тест копии не трогается).
  writeFileSync(join(papka, 'proba.test.mjs'), readFileSync(join(papka, 'corpus.test.mjs'), 'utf8') + PROBY);
  console.log(imya, 'готово');
}
