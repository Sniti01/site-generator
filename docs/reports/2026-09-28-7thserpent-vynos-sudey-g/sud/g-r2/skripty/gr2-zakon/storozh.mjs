// Сторож sayt:znak-dist на эталонной сборке 3b78f28 (иконки dist/ верны) при листе с переопределённой краской знака
// (лист подменён в памяти крюком; на диске ничего не меняется): роняет ли сторож сборку не по иконке сборки.
//   node storozh.mjs > storozh.txt
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const TUT = import.meta.dirname;
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const skript = join(TUT, 'storozh-vnutri.mjs');
writeFileSync(skript, `import { pathToFileURL } from 'node:url';
import znakDist from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';
const integ = znakDist();
try {
  await integ.hooks['astro:build:done']({ dir: pathToFileURL(${JSON.stringify(DIST + '/')}), logger: { error: (s) => console.log('сторож: ' + s), info: (s) => console.log('сторож: ' + s) } });
} catch (e) { console.log('сторож: ОТКАЗ — ' + e.message); }
`);
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const m = { imya: 'лист с переопределённой краской', zameny: [{ iz: 'const w = wejscie({ dist: fileURLToPath(dir) });', na: "const w = wejscie({ dist: fileURLToPath(dir) }); w.css += '\\n.ft { --accent: #ff0000; }';" }] };
const r = spawnSync(process.execPath, ['--no-deprecation', '--import', pathToFileURL(join(TUT, 'kryuk.mjs')).href, skript], { cwd: TUT, encoding: 'utf8', env: { ...ENV, GR2_MUT: JSON.stringify(m) } });
console.log(`код ${r.status}\n${r.stdout}${r.stderr}`);
