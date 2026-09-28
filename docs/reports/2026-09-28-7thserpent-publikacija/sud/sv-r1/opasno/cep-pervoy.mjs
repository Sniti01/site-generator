// SV1 «опасный проход» — вся цепочка сторожей первой выкладки при входе по умолчанию (коммит e6cd82f).
// Положение: сайт заведён в панели (каталог 7thserpent.com/www пуст), DNS Cloudflare уже ведёт на хостер
// (как у первого сайта, доклад 2026-09-15 §5), владелец жмёт Run workflow, вход SERPENT_FIRST не трогает (off).
import { sekrety, domen, papka, indeks } from './storozh.mjs';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ZDES = fileURLToPath(new URL('.', import.meta.url));
const SERPENT_FIRST = 'off'; // default входа в workflow
const pervyi = SERPENT_FIRST === 'on';
const shagi = [];
const s = sekrety({ SERPENT_FTP_HOST: 'h', SERPENT_FTP_PORT: '21', SERPENT_FTP_USER: 'ax572417_serpent', SERPENT_FTP_PASSWORD: 'p', AC4BF_FTP_USER: 'ax572417_claude' });
shagi.push(['sekrety', s]);
const d = await domen({ poluchit: async () => ({ status: 403, telo: 'Forbidden', location: '' }), pervyi });
shagi.push(['domen', d]);
shagi.push(['sverka-dist', pervyi ? null : { ok: true, stroki: ['шаг не идёт: if: inputs.SERPENT_FIRST == \'on\''] }]);
const p = papka('./\n../\n', null);
shagi.push(['papka', p]);
const i = indeks(null);
shagi.push(['indeks', i]);
const vse = shagi.every(([, r]) => r.ok);
const stroki = shagi.map(([n, r]) => `${n}: ${r.ok ? 'проход' : 'СТОП'} — ${r.stroki[r.stroki.length - 1]}`);
stroki.push(`ИТОГ: ${vse ? 'ОПАСНЫЙ ПРОХОД — mirror идёт, домен (уже отвечающий 403) после выкладки показывает сборку раньше ящика' : 'стоп'}`);
const vyvod = stroki.join('\n') + '\n';
writeFileSync(join(ZDES, 'cep-pervoy.txt'), vyvod);
process.stdout.write(vyvod);
