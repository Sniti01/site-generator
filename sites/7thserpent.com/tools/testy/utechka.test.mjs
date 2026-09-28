// Сторож утечки мастеров ядра (`core/gates/masters.mjs`, П102 п. 1 и блок Б) на копиях сайта: мутации,
// которые кладут мастер-JPEG в сборку, роняют её сторожем; то, что оригинал не помечает, — нет
// (раунд 1 «судью судят» п. 1, R1-P1-4). Каждая проба — своя копия сайта вне репозитория и её сборка.
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sdelatKopiyu, udalitKopiyu, sobrat, prochest, zapisat, zapisatVYadro } from '../kopiya.mjs';
import { utechki } from '@factory/core/gates/masters.mjs';

/** Сборка копии с мутацией: `{ kod, vyvod }`. `sYadrom` — ядро копией (мутация ядра). */
function sborkaS(mut, { sYadrom = false } = {}) {
  const k = sdelatKopiyu(mkdtempSync(join(tmpdir(), 'utechka-')), { sYadrom });
  try {
    mut(k);
    return sobrat(k);
  } finally {
    udalitKopiyu(k);
  }
}
const pravka = (k, put, iz, na) => {
  const t = prochest(k, put);
  if (!t.includes(iz)) throw new Error(`мутация не применилась: в ${put} нет «${iz}»`);
  zapisat(k, put, t.replace(iz, () => na));
};
const UPALA = /В сборке \d+ файлов, побайтно равных исходным картинкам/;

test('контроль: копия без мутаций собирается, утечек нет', () => {
  const r = sborkaS(() => {});
  assert.equal(r.kod, 0, r.vyvod.slice(-2000));
  assert.match(r.vyvod, /утечка мастеров: исходных картинок 21 \(src\), в сборке ни одной/);
});

test('мутация «вернуть src.width»: sizesGeroya получает импорт — сборка падает сторожем утечки', () => {
  const r = sborkaS((k) => pravka(k, 'src/pages/[...slug].astro', 'sizesGeroya(credits[geroyPechati.klyuch], geroyPechati.klyuch)', 'sizesGeroya(geroyPechati.kadr.src, geroyPechati.klyuch)'));
  assert.notEqual(r.kod, 0);
  assert.match(r.vyvod, UPALA);
  assert.match(r.vyvod, /_astro\/mp3-art\.[^.]+\.jpg = assets\/gry\/mp3-art\.jpg/);
});

test('кадр, скачанный до своей страницы (непечатаемый файл в src/assets/gry), — сборка падает', () => {
  // Байты — свои (кадр mp1-k10 с лишним нулём в хвосте): побайтную копию напечатанного кадра сборщик сводит
  // с ним в один ресурс, и в сборку она не выходит (замер сессии 20).
  const r = sborkaS((k) => writeFileSync(join(k.sayt, 'src/assets/gry/mp3-k99.jpg'), Buffer.concat([readFileSync(join(k.sayt, 'src/assets/gry/mp1-k10.jpg')), Buffer.from([0])])));
  assert.notEqual(r.kod, 0);
  assert.match(r.vyvod, /= assets\/gry\/mp3-k99\.jpg/);
});

test('разворот импорта на главной ({ ...art.src }) — сборка падает', () => {
  const r = sborkaS((k) => pravka(k, 'src/components/HomeHero.astro', "const art = kadr('hero');", "const art = kadr('hero');\nconst razvorot = { ...art.src };\nvoid razvorot;"));
  assert.notEqual(r.kod, 0);
  assert.match(r.vyvod, /= assets\/gry\/hero\.jpg/);
});

test('чтение свойства импорта в блоке ядра (Gallery: src.height) — сборка падает', () => {
  const r = sborkaS(
    (k) => {
      const put = join(k.koren, 'core/blocks/Gallery.astro');
      const t = prochest({ sayt: k.koren }, 'core/blocks/Gallery.astro');
      const iz = 'const { items, title, titleId, lead } = Astro.props;';
      if (!t.includes(iz)) throw new Error(`мутация не применилась: в ${put} нет «${iz}»`);
      zapisatVYadro(k, 'blocks/Gallery.astro', t.replace(iz, () => `${iz}\nconst vysoty = items.map((x) => x.src?.height);\nvoid vysoty;`));
    },
    { sYadrom: true }
  );
  assert.notEqual(r.kod, 0);
  assert.match(r.vyvod, UPALA);
});

test('отрицательный контроль: «width» in импорт и чтение fsPath оригинал не помечают — сборка зелёная', () => {
  const r = sborkaS((k) => pravka(k, 'src/components/HomeHero.astro', "const art = kadr('hero');", "const art = kadr('hero');\nconst estShirina = 'width' in art.src;\nconst put = art.src.fsPath;\nvoid estShirina;\nvoid put;"));
  assert.equal(r.kod, 0, r.vyvod.slice(-2000));
  assert.match(r.vyvod, /утечка мастеров: исходных картинок 21 \(src\), в сборке ни одной/);
});

test('сторож громко: нет папки исходников или в ней ноль картинок', () => {
  const pusto = mkdtempSync(join(tmpdir(), 'utechka-pusto-'));
  assert.throws(() => utechki(pusto, join(pusto, 'net')), /нет папки/);
  assert.throws(() => utechki(pusto, pusto), /ноль картинок/);
});
