// B3-6: zapisatVYadro на поддельной копии здесь — новые члены класса (абсолютный путь, обратные косые, ссылка внутри ядра).
import { mkdirSync, mkdtempSync, existsSync, symlinkSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const { zapisatVYadro } = await import(pathToFileURL(join(TUT, 'kopiya-nyne.mjs')).href);
const koren = mkdtempSync(join(TUT, 'k-'));
mkdirSync(join(koren, 'core', 'structure'), { recursive: true });
mkdirSync(join(koren, 'sites', 's'), { recursive: true });
const cel = mkdtempSync(join(TUT, 'cel-'));
symlinkSync(cel, join(koren, 'core', 'perehod'), 'junction');
const k = { koren, sayt: join(koren, 'sites', 's'), sYadrom: true, ssylki: [] };
const sluchai = {
  'законно: structure/blocks.json': 'structure/blocks.json',
  'законно: новая папка blocks/Gallery.astro': 'blocks/Gallery.astro',
  'законно: обратные косые structure\\\\x.json': 'structure\\x.json',
  'абсолютный путь в папку сайта копии': resolve(koren, 'sites', 's', 'abs.txt'),
  'обратные косые с выходом ..\\\\sites\\\\s\\\\b.txt': '..\\sites\\s\\b.txt',
  'выход через середину structure/../../sites/s/c.txt': 'structure/../../sites/s/c.txt',
  'сквозь ссылку внутри ядра perehod/x.txt': 'perehod/x.txt',
  'сама ссылка perehod': 'perehod',
  'пустой путь': '',
  'сам корень ядра «.»': '.',
  'регистр: ../CORE/structure/r.json (та же папка на Windows)': '../CORE/structure/r.json',
};
for (const [ime, put] of Object.entries(sluchai)) {
  let v;
  try {
    zapisatVYadro(k, put, 'x');
    v = 'записано';
  } catch (e) {
    v = `отказ: ${e.message.slice(0, 70)}`;
  }
  console.log(`${ime}: ${v}`);
}
console.log(`в папке сайта копии: ${JSON.stringify(readdirSync(k.sayt))}; в цели ссылки: ${JSON.stringify(readdirSync(cel))}; в ядре: ${JSON.stringify(readdirSync(join(koren, 'core')))}`);
