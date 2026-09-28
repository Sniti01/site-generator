// Прогоны блока А раунда 4 по находкам: запускатель testy.mjs с шаблоном имени, вывод — <папка>/<номер>.txt.
// node krasnye-progon.mjs <папка вывода> <файл теста> <номер>...  (первая строка вывода — «шапка», если задана через --shapka=…)
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const S = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const arg = process.argv.slice(2);
const shapka = arg.find((a) => a.startsWith('--shapka='))?.slice('--shapka='.length);
const [vyvod, test, ...nomera] = arg.filter((a) => !a.startsWith('--shapka='));
for (const n of nomera) {
  const r = spawnSync(process.execPath, [join(S, 'testy.mjs'), join(S, 'ref/dist-7th-3b78f28'), test, `--test-name-pattern=${n}`], { encoding: 'utf8' });
  writeFileSync(join(vyvod, `${n}.txt`), `${shapka ? shapka + '\n' : ''}${r.stdout}${r.stderr}\nкод возврата: ${r.status}\n`);
  console.log(n, 'код', r.status);
}
