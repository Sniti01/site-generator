// Сторож sayt:znak-dist на эталонной сборке: порча источника в памяти (краска переопределена вне :root — отказ
// не по иконкам) — настоящий сторож роняет сборку; под мутантом M23 (роняет только на строках public/ и dist/) — нет.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const KRYUK = pathToFileURL(join(import.meta.dirname, 'kryuk-mnogo.mjs')).href;
const PORCHA = { imya: 'порча: .ft { --accent: #ff0000; } в global.css', iz: "css: readFileSync(join(siteRoot, 'src/styles/global.css'), 'utf8'),", na: "css: readFileSync(join(siteRoot, 'src/styles/global.css'), 'utf8') + '\\n.ft { --accent: #ff0000; }'," };
const M23 = { imya: 'M23', iz: "        if (bledy.length) {\n          logger.error", na: "        if (bledy.some((b) => /^(public|dist)\\//.test(b))) {\n          logger.error" };
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
for (const [imya, zameny] of [['чистый источник', []], ['порча источника', [PORCHA]], ['порча источника + M23', [PORCHA, M23]]]) {
  const r = spawnSync(process.execPath, ['--import', KRYUK, join(import.meta.dirname, 'storozh.mjs')], { encoding: 'utf8', env: { ...ENV, ZNAK_ZAMENY: zameny.length ? JSON.stringify(zameny) : '' } });
  console.log(`== ${imya} (код ${r.status})\n${r.stdout.split('\n').slice(0, 4).join('\n')}`);
}
