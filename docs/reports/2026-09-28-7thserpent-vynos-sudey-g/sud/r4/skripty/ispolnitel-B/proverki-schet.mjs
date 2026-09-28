// Утверждения proverki.test.mjs о счёте (schet, kodProverki) — копией без теста, который запускает proverki (сборку копии):
// импорты на абсолютные адреса репозитория. Копия — ispolnitel-B/proverki-schet-kopiya.test.mjs, прогон — запускателем.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const S = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const T = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/tools';
let t = readFileSync(`${T}/testy/proverki.test.mjs`, 'utf8');
const nachalo = t.indexOf("test('B2-1: шаблон имён ни с чем не совпал — proverki даёт код 2'");
const konec = t.indexOf('test.todo(', nachalo);
if (nachalo < 0 || konec < 0) throw new Error('тест запуска proverki не найден');
t = t.slice(0, nachalo) + t.slice(konec);
t = t.split("from '../kopiya.mjs'").join(`from 'file:///${T}/kopiya.mjs'`).split("import('../schet-testov.mjs')").join(`import('file:///${T}/schet-testov.mjs')`);
const kopiya = `${S}/r4/ispolnitel-B/proverki-schet-kopiya.test.mjs`;
writeFileSync(kopiya, t);
const r = spawnSync(process.execPath, [`${S}/testy.mjs`, `${S}/ref/dist-7th-3b78f28`, kopiya], { encoding: 'utf8' });
console.log(r.stdout + r.stderr, '\nкод', r.status);
