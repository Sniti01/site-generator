import { pathToFileURL } from 'node:url';
import znakDist from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';
const integ = znakDist();
try {
  await integ.hooks['astro:build:done']({ dir: pathToFileURL("C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28/"), logger: { error: (s) => console.log('сторож: ' + s), info: (s) => console.log('сторож: ' + s) } });
} catch (e) { console.log('сторож: ОТКАЗ — ' + e.message); }
