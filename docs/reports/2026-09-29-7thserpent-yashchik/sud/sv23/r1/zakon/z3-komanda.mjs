// SV23-Z, образец 3: команда `domen` целиком (как её зовёт workflow) — вход SERPENT_DOMAIN_BOUND и ответы домена.
// Сеть подменена до запуска сторожа (`--import` с data: URL, как в пробе исполнителя): globalThis.fetch отдаёт
// образец из памяти или бросает — ни одного запроса наружу. Переменные окружения — только в env дочернего процесса.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const STOROZH = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs';
const VYVOD = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-sv23-z/z3-vyvod.txt';

const PODMENA = `
const vid = process.env.SV23Z_OBRAZEC;
globalThis.fetch = async () => {
  if (vid === '403') return new Response('<html><head><title>403 Forbidden</title></head></html>', { status: 403, headers: { 'content-type': 'text/html' } });
  if (vid === 'tls') { const c = new Error('certificate'); c.code = 'ERR_TLS_CERT_ALTNAME_INVALID'; throw Object.assign(new TypeError('fetch failed'), { cause: c }); }
  if (vid.startsWith('loc:')) return new Response(null, { status: 301, headers: { location: vid.slice(4) } });
  throw new Error('образец не задан');
};`;
const IMPORT = `data:text/javascript;base64,${Buffer.from(PODMENA).toString('base64')}`;

const chistoe = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(SERPENT_|GITHUB_|SV23Z_)/.test(k)));
const SLUCHAI = [
  // [имя, SERPENT_PERVAYA, SERPENT_DOMAIN_BOUND (undefined — нет переменной), образец ответа, ждём код по листу владельца]
  ['403 после удаления заглушки, первая, вход on', 'on', 'on', '403', 0],
  ['403, первая, вход off', 'on', 'off', '403', 1],
  ['403, первая, входа нет (push)', 'on', undefined, '403', 1],
  ['ошибка сертификата, первая, вход on', 'on', 'on', 'tls', 0],
  ['ошибка сертификата, первая, вход off', 'on', 'off', 'tls', 1],
  ['301 с Location «http://» (редирект панели с пустой целью), первая, вход on', 'on', 'on', 'loc:http://', 0],
  ['301 с Location «https://www.7thserpent.com:99999/», первая, вход on', 'on', 'on', 'loc:https://www.7thserpent.com:99999/', 0],
  ['301 с Location «https://exa mple.com/», первая, вход on', 'on', 'on', 'loc:https://exa mple.com/', 0],
  ['301 с Location «http://», не первая, вход off', 'off', 'off', 'loc:http://', 0],
];

const out = [];
for (const [imya, pervaya, vkhod, obrazec, zhdem] of SLUCHAI) {
  const env = { ...chistoe, SERPENT_PERVAYA: pervaya, SV23Z_OBRAZEC: obrazec, ...(vkhod === undefined ? {} : { SERPENT_DOMAIN_BOUND: vkhod }) };
  const r = spawnSync(process.execPath, ['--import', IMPORT, STOROZH, 'domen'], { encoding: 'utf8', env });
  out.push(`== ${imya}`);
  out.push(`  код: ${r.status} (ждём ${zhdem})${r.status === zhdem ? '' : '  ← РАСХОЖДЕНИЕ'}`);
  for (const s of r.stdout.split('\n').filter(Boolean)) out.push(`  stdout | ${s}`);
  for (const s of r.stderr.split('\n').filter(Boolean)) out.push(`  stderr | ${s}`);
}
writeFileSync(VYVOD, out.join('\n') + '\n', 'utf8');
console.log(`записано: ${VYVOD} (${out.length} строк)`);
