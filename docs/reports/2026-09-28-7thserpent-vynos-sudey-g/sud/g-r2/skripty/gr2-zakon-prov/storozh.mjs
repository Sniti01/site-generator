// GR2-Z-7: что роняет сторож sayt:znak-dist на эталонной сборке (под крюком — лист в памяти с порчей краски).
//   node [--import ./kryuk.mjs] storozh.mjs
import { pathToFileURL } from 'node:url';
import znakDist from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';

const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28/';
const logger = { info: (s) => console.log(`[info] ${s}`), error: (s) => console.log(`[error] ${s}`) };
try {
  await znakDist().hooks['astro:build:done']({ dir: pathToFileURL(DIST), logger });
  console.log('сторож: прошёл');
} catch (e) {
  console.log(`сторож: бросил — ${e.message.slice(0, 1200)}`);
}
