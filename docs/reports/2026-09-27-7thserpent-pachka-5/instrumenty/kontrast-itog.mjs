// Контраст текста трёх новых героев пачки 5 (сессия 18, П98: «контраст текста трёх новых героев — замером полосы из
// 31 окна, порог 4,5:1»): запускает вычислитель главной docs/reports/2026-09-23-7thserpent-glavnaya/instrumenty/
// kontrast-art.mjs КАК ЕСТЬ по кадрам копии kontrast-geroy-snyatie.js (.playwright-mcp/ka-p5/<слаг>/) и пишет вывод
// в zamery/kontrast-geroy/p5-<сборка>-<слаг>.txt с первой строкой о сборке — форма файлов замера доработки П96.
// Замена цикла оболочки (урок памяти исполнителя). Только чтение кадров, запись — в папку замеров.
//   node kontrast-itog.mjs <сборка>
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sborka = process.argv[2];
if (!/^[0-9a-f]{7,40}$/.test(sborka ?? '')) { console.error('node kontrast-itog.mjs <сборка>'); process.exit(2); }
const zdes = dirname(fileURLToPath(import.meta.url));
const koren = resolve(zdes, '../../../..');
const vychislitel = join(koren, 'docs/reports/2026-09-23-7thserpent-glavnaya/instrumenty/kontrast-art.mjs');
const vyvod = join(zdes, '../zamery/kontrast-geroy');
mkdirSync(vyvod, { recursive: true });
let kod = 0;
for (const slug of ['gameplay', 'max-payne-3-guide', 'movie']) {
  const papka = join(koren, '.playwright-mcp/ka-p5', slug);
  const r = spawnSync(process.execPath, [vychislitel, papka, join(papka, 'boxes.json')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const shapka = `сборка ${sborka} (копия dist-${sborka} = dist/ коммита ${sborka}, пачка 5; сервер 127.0.0.1:4434), кадры .playwright-mcp/ka-p5/${slug}, съёмка — копия kontrast-geroy-snyatie.js доработки (instrumenty/kontrast-geroy-snyatie.js), вычислитель главной без правки`;
  writeFileSync(join(vyvod, `p5-${sborka}-${slug}.txt`), `${shapka}\n${r.stdout}${r.stderr}\nкод выхода: ${r.status}\n`);
  console.log(`== ${slug}: код ${r.status}`);
  process.stdout.write((r.stdout ?? '').split('\n').filter((l) => /худший|ПЛОХО|итог|ниже/.test(l)).join('\n') + '\n');
  if (r.status !== 0) kod = 1;
}
process.exit(kod);
