// Прогон тестов сверки по номерам находок через testy.mjs; вывод каждого — в <папка>/<номер>.txt.
// node progon.mjs <папка> <номер> [<номер> ...]
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const S = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const TEST = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/testy/sverka.test.mjs';
const [papka, ...nomera] = process.argv.slice(2);
mkdirSync(papka, { recursive: true });
for (const n of nomera) {
  const r = spawnSync(process.execPath, [`${S}/testy.mjs`, `${S}/ref/dist-7th-3b78f28`, TEST, `--test-name-pattern=^${n} `], { encoding: 'utf8' });
  const vyvod = (r.stdout ?? '') + (r.stderr ?? '');
  writeFileSync(join(papka, `${n}.txt`), vyvod);
  const itog = (k) => (vyvod.match(new RegExp(`ℹ ${k} (\\d+)`)) || [])[1];
  console.log(`${n}: код ${r.status}, tests ${itog('tests')}, pass ${itog('pass')}, fail ${itog('fail')}, todo ${itog('todo')}`);
}
