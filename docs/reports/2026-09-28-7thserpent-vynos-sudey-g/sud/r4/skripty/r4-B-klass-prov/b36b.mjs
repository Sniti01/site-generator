// B3-6: переход внутри папки сайта копии (как input/corpus) — хвостовая точка или пробел в имени сегмента.
import { mkdirSync, rmSync, symlinkSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { zapisat } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/kopiya.mjs';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-B-klass-prov/b36b';
rmSync(PAPKA, { recursive: true, force: true });
const sayt = join(PAPKA, 'kopiya', 'sites', 's');
mkdirSync(join(sayt, 'input'), { recursive: true });
mkdirSync(join(PAPKA, 'cel'), { recursive: true });
symlinkSync(join(PAPKA, 'cel'), join(sayt, 'input', 'corpus'), 'junction');
const k = { koren: join(PAPKA, 'kopiya'), sayt, ssylki: [], sYadrom: false };
for (const put of ['input/corpus/x.txt', 'input/corpus./x.txt', 'input/corpus /x.txt', 'input/corpus. /x.txt', 'input/CORPUS/x.txt', 'input/corpus::$INDEX_ALLOCATION/x.txt', 'input/corpus']) {
  let itog;
  try {
    zapisat(k, put, 'x');
    itog = 'записано';
  } catch (e) {
    itog = 'отказ: ' + e.message.slice(0, 80);
  }
  console.log(`«${put}»: ${itog}; в цели перехода: ${JSON.stringify(readdirSync(join(PAPKA, 'cel')))}; в input: ${JSON.stringify(readdirSync(join(sayt, 'input')))}`);
}
