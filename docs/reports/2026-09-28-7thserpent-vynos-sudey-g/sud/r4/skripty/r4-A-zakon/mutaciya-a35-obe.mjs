// A3-5 откатить целиком (обе половины: проверка версии при записи и ключ по версии загрузки) —
// краснеет ли тест A3-5 репозитория. Копия — из папки мутации M15 (там уже снята проверка).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-A-zakon';
const SCR = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const text = join(ZDES, 'mut', 'M15_proverka_versii_snyata', 'text');
const f = join(text, 'corpus.mjs');
const src = readFileSync(f, 'utf8');
if (src.includes("'\\0' + VERSIYA)")) writeFileSync(f, src.replace("'\\0' + VERSIYA)", "'\\0' + versiya())"));
const r = spawnSync(process.execPath, [join(SCR, 'testy.mjs'), join(SCR, 'ref/dist-7th-3b78f28'), join(text, 'corpus.test.mjs'), '--test-name-pattern=A3-5'], { encoding: 'utf8' });
const out = r.stdout + r.stderr;
writeFileSync(join(ZDES, 'mut', 'vyvod-a35-obe.txt'), out);
console.log(`обе половины A3-5 сняты: pass ${/ℹ pass (\d+)/.exec(out)?.[1]} fail ${/ℹ fail (\d+)/.exec(out)?.[1]}`);
// вернуть копию M15 к одной мутации
writeFileSync(f, src);
