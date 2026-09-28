// Раунд 4, блок Б: B3-6 (zapisatVYadro — только внутри ядра копии) — законные записи проб проходят, «..» — отказ;
// мутант (прежняя запись join(koren, 'core', put)) пропускает «..». Копия — поддельная, в своей папке, без sdelatKopiyu.
// node b3-6.mjs
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const ISH = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/kopiya.mjs', 'utf8').replace(
  "export const SAYT = resolve(zdes, '..');",
  "export const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';"
);
const MUT = ISH.replace("writeFileSync(putZapisi(join(k.koren, 'core'), put, 'ядра копии'), tekst);", "writeFileSync(join(k.koren, 'core', put), tekst);");
if (MUT === ISH) throw new Error('мутация не легла');
writeFileSync(join(ZDES, 'kopiya-b36-nyne.mjs'), ISH);
writeFileSync(join(ZDES, 'kopiya-b36-mut.mjs'), MUT);
for (const [imya, f] of [['нынешний', 'kopiya-b36-nyne.mjs'], ['мутант', 'kopiya-b36-mut.mjs']]) {
  const { zapisatVYadro } = await import(pathToFileURL(join(ZDES, f)).href);
  const koren = mkdtempSync(join(ZDES, 'poddelka-'));
  const sayt = join(koren, 'sites', '7thserpent.com');
  mkdirSync(join(koren, 'core', 'structure'), { recursive: true });
  mkdirSync(join(koren, 'core', 'blocks'), { recursive: true });
  mkdirSync(sayt, { recursive: true });
  const k = { koren, sayt, ssylki: [], sYadrom: true };
  const out = [];
  for (const put of ['structure/blocks.json', 'blocks/Gallery.astro', join('..', relative(koren, sayt), 'proba-b3-6.txt')]) {
    try {
      zapisatVYadro(k, put, 'x');
      out.push(`${put}: записано`);
    } catch (e) {
      out.push(`${put}: отказ — ${e.message}`);
    }
  }
  out.push(`файл вне ядра появился: ${existsSync(join(sayt, 'proba-b3-6.txt'))}`);
  console.log(`${imya}:\n  ${out.join('\n  ')}`);
}
