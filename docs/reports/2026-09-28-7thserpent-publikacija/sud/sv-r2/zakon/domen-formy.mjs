// SV2-Z: «домен уже привязан?» на законных формах — без сети (подменный poluchit; команда — с подменой fetch).
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const STOROZH = SAYT + '/tools/storozha-vykladki.mjs';
const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/2a2fa1b5-b706-4952-b80c-ce6acb0f1174/scratchpad/sud/sv-r2/zakon';
const S = await import(pathToFileURL(STOROZH).href);

const W = 'https://www.7thserpent.com/';
const G = 'https://7thserpent.com/';
const iz = (karta) => async (url) => {
  if (!(url in karta)) throw new Error(`запрос вне образца: ${url}`);
  return karta[url];
};
const otv = (status, telo = '', location = '') => ({ status, telo, location });
const cherezHttp = (h, telo) => ({ [`https://${h}/`]: otv(302, '', `http://${h}/`), [`http://${h}/`]: otv(404, telo) });
const NC = (h) => `Website ${h} not configured`;

// 1. Заглушка «not configured» — формы текста, которые измерение 2026-09-15 (curl, первый сайт, один хост) не видело.
const FORMY = [
  ['измеренная форма (контроль)', (h) => `<h1>${NC(h)}</h1><p>Domain address record points to our server, but this site is not served</p>`],
  ['другой регистр', (h) => `<h1>${NC(h).toUpperCase()}</h1>`],
  ['тег вокруг имени хоста', (h) => `<h1>Website <b>${h}</b> not configured</h1>`],
  ['&nbsp; между словами', (h) => `<h1>Website&nbsp;${h}&nbsp;not configured</h1>`],
  ['на www — имя без www (хостер печатает имя сайта, а не Host)', (h) => `<h1>${NC(h.replace(/^www\./, ''))}</h1>`],
];
for (const [imya, telo] of FORMY) {
  const r = await S.domen({ poluchit: iz({ ...cherezHttp('www.7thserpent.com', telo('www.7thserpent.com')), ...cherezHttp('7thserpent.com', telo('7thserpent.com')) }), pervyi: true });
  console.log(`[not configured: ${imya}] ${r.ok ? 'ПРОХОД' : 'ОТКАЗ'} — ${r.stroki.at(-1)} || ${r.stroki[0]}`);
}

// 2. Не первая выкладка, узнать не удалось — строка итога.
for (const [imya, karta] of [
  ['оба хоста — таймаут', { [W]: { oshibka: 'TimeoutError' }, [G]: { oshibka: 'TimeoutError' } }],
  ['www не разрешается, голый — EAI_AGAIN', { [W]: { oshibka: 'ENOTFOUND' }, [G]: { oshibka: 'EAI_AGAIN' } }],
]) {
  const r = await S.domen({ poluchit: iz(karta), pervyi: false });
  console.log(`[не первая, ${imya}] ${r.ok ? 'проход' : 'отказ'} — ${r.stroki.join(' | ')}`);
}

// 3. Команда `domen` вне workflow (нет SERPENT_PERVAYA) — домен привязан, на нём наша сборка (после запуска сайта).
const env = { ...process.env, MOCK_OTVETY: JSON.stringify({ [W]: otv(200, '<link rel="canonical" href="https://www.7thserpent.com/">'), [G]: otv(301, '', W) }) };
delete env.SERPENT_PERVAYA;
const k = spawnSync(process.execPath, ['--import', pathToFileURL(ZDES + '/mock-fetch.mjs').href, STOROZH, 'domen'], { encoding: 'utf8', env });
console.log(`[команда domen без SERPENT_PERVAYA, живой сайт] код ${k.status}: ${(k.stdout + k.stderr).trim().split('\n').join(' | ')}`);
const k2 = spawnSync(process.execPath, ['--import', pathToFileURL(ZDES + '/mock-fetch.mjs').href, STOROZH, 'domen'], { encoding: 'utf8', env: { ...env, SERPENT_PERVAYA: '' } });
console.log(`[команда domen, SERPENT_PERVAYA пустой (выход шага не записан)] код ${k2.status}: ${(k2.stdout + k2.stderr).trim().split('\n').at(-1)}`);
