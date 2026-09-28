// Сверка до коммита раунда 3 (3b78f28^) — копия с абсолютными импортами, для сравнения «до/после».
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, unlinkSync } from 'node:fs';

const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-V-zakon';
const S = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const syroe = `${ZDES}/sverka-do-syroe.mjs`;
if (existsSync(syroe)) unlinkSync(syroe);
const t = execFileSync('git', ['-C', 'D:/SEO/cloud/site-generator', 'show', '3b78f28^:sites/7thserpent.com/tools/sverka.mjs'])
  .toString('utf8')
  .replace("import { parse as yamlParse } from 'yaml';", `import { createRequire } from 'node:module';\nconst yamlParse = createRequire('${S}/package.json')('yaml').parse;`)
  .replace("from '@factory/core/text/html.mjs'", "from 'file:///D:/SEO/cloud/site-generator/core/text/html.mjs'");
writeFileSync(`${ZDES}/sverka-do.mjs`, t);
console.log('записано', t.length, 'знаков; obyavleniya есть:', t.includes('obyavleniya'));
