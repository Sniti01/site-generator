// SV23-Z2, образец 2: повторы после красного прогона первой выкладки — что владелец получит на Re-run и на новом
// Run workflow (раунд 2 «судью судят», предмет — 9ca1aa2). Цепочка сторожей — как в workflow: papka, indeks, glubina,
// pervaya, domen; значение SERPENT_DOMAIN_BOUND — по выражению шага домена из YAML (github.run_attempt, inputs).
// Сеть не трогается: ответы домена — подставная функция. Сервер — образцы вывода cls и index.html.
import { writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const SV = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs');
const { domen, papka, indeks, glubina, pervayaVykladka, spisokSborki } = SV;
const YAML = createRequire('D:/SEO/cloud/site-generator/package.json')('yaml');
const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-sv23-z2';
const VYVOD = `${PAPKA}/z2-2-povtory-vyvod.txt`;
const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = `${SAYT}/dist`;

// Выражение шага домена — из YAML; семантика выражений GitHub: == приводит к числу, && и || возвращают операнд.
const WF = YAML.parse(readFileSync('D:/SEO/cloud/site-generator/.github/workflows/deploy-7thserpent.yml', 'utf8'));
const shagDomena = WF.jobs.deploy.steps.find((x) => (x.name ?? '').includes('Домен уже привязан'));
const VYRAZH = shagDomena.env.SERPENT_DOMAIN_BOUND;
if (VYRAZH !== "${{ github.run_attempt == 1 && inputs.SERPENT_DOMAIN_BOUND || 'off' }}") throw new Error(`выражение не то: ${VYRAZH}`);
const lozh = (v) => v === false || v === null || v === undefined || v === '' || v === 0;
const vkhodDomena = (popytka, vkhod) => {
  const a = Number(String(popytka)) === 1;
  const i = a ? vkhod ?? null : false;
  return lozh(i) ? 'off' : i;
};

const W = 'https://www.7thserpent.com/';
const G = 'https://7thserpent.com/';
const otv = (status, telo = '', location = '') => ({ status, telo, location });
const osh = (kod) => ({ oshibka: kod });
const iz = (karta) => async (url) => {
  if (!(url in karta)) throw new Error(`запрос вне образца: ${url}`);
  return karta[url];
};
const A403 = '<html><head><title>403 Forbidden</title></head><body><h1>Forbidden</h1></body></html>';
const ZAGL = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Поздравляем, сайт создан!</title></head><body><h1>Поздравляем, сайт создан!</h1></body></html>';
const NASH_INDEX = readFileSync(`${DIST}/index.html`, 'utf8');
const DOMEN_403 = { [W]: otv(403, A403), [G]: otv(403, A403) };
const DOMEN_ZAGL = { [W]: otv(200, ZAGL), [G]: otv(200, ZAGL) };
const DOMEN_TAIM = { [W]: osh('TimeoutError'), [G]: osh('TimeoutError') };
const DOMEN_SERT = { [W]: osh('ERR_TLS_CERT_ALTNAME_INVALID'), [G]: osh('ERR_TLS_CERT_ALTNAME_INVALID') };
const DOMEN_NASH = { [W]: otv(200, NASH_INDEX), [G]: otv(301, '', W) };

// Верх сборки — как у команды papka: первый уровень dist и принятого списка.
const verkh = new Set(readdirSync(DIST));
for (const f of Object.keys(JSON.parse(readFileSync(`${SAYT}/gates/sborka-prinyataya.json`, 'utf8')).fajly ?? {})) verkh.add(f.split('/')[0]);
const fajly = Object.keys(spisokSborki(DIST).fajly);
const clsIz = (imena) => ['./', '../', ...imena].join('\n') + '\n';
const bezGlavnoy = readdirSync(DIST).filter((n) => n !== 'index.html').map((n) => (statSync(join(DIST, n)).isDirectory() ? `${n}/` : n));
const findIz = (spisok) => ['./', ...spisok.map((f) => `./${f}`)].join('\n') + '\n';

const SERVER_PUST = { cls: clsIz([]), index: null, find: findIz([]) };
const SERVER_ZAGL = { cls: clsIz(['index.html']), index: ZAGL, find: findIz(['index.html']) };
const SERVER_OBORV = { cls: clsIz(bezGlavnoy), index: null, find: findIz(fajly.filter((f) => f !== 'index.html')) };
const SERVER_POLNYI = { cls: clsIz([...bezGlavnoy, 'index.html']), index: NASH_INDEX, find: findIz(fajly) };

const podskazka = (s) => {
  if (/Run workflow/.test(s)) return 'указан новый запуск Run workflow';
  if (/повтори|запусти|снова/i.test(s)) return 'велено повторить, кнопка не названа (под рукой — Re-run)';
  return 'как запускать снова — не сказано';
};

/** Прогон цепочки сторожей одной попытки; возвращает строки и то, где остановился. */
async function popytka({ server, domenKarta, popytkaN, vkhody }) {
  const out = [];
  const bound = vkhodDomena(popytkaN, vkhody.SERPENT_DOMAIN_BOUND);
  out.push(`  попытка ${popytkaN}; входы: SERPENT_FIRST=${vkhody.SERPENT_FIRST}, SERPENT_DOMAIN_BOUND=${vkhody.SERPENT_DOMAIN_BOUND} → шагу домена SERPENT_DOMAIN_BOUND=${bound}`);
  const shagi = [
    ['papka', () => papka(server.cls, server.index, [...verkh], null)],
    ['indeks', () => indeks(server.index)],
    ['glubina', () => glubina(server.find, server.index, fajly, null, '')],
  ];
  for (const [imya, f] of shagi) {
    const r = f();
    if (!r.ok) {
      out.push(`  ${imya}: СТОП | ${r.stroki.at(-1)}`);
      out.push(`    → ${podskazka(r.stroki.at(-1))}`);
      return { out, itog: `стоп ${imya}` };
    }
    out.push(`  ${imya}: проход`);
  }
  const p = pervayaVykladka(vkhody.SERPENT_FIRST, server.index, server.find);
  out.push(`  pervaya: ${p.pervaya ? 'on' : 'off'} — ${p.pochemu}`);
  const r = await domen({ poluchit: iz(domenKarta), pervyi: p.pervaya, soglasen: bound === 'on' });
  if (!r.ok) {
    out.push(`  domen: СТОП | ${r.stroki.at(-1)}`);
    out.push(`    → ${podskazka(r.stroki.at(-1))}`);
    return { out, itog: 'стоп domen' };
  }
  out.push(`  domen: проход | ${r.stroki.at(-1)}`);
  return { out, itog: 'проход сторожей до выкладки' };
}

const OBA = { SERPENT_FIRST: 'on', SERPENT_DOMAIN_BOUND: 'on' };
const TOLKO_FIRST = { SERPENT_FIRST: 'on', SERPENT_DOMAIN_BOUND: 'off' };
const STSENARII = [
  ['S1 лист соблюдён: заглушка удалена, Run workflow с обоими входами on', [
    ['Run workflow', { server: SERVER_PUST, domenKarta: DOMEN_403, popytkaN: 1, vkhody: OBA }],
  ]],
  ['S2 заглушка ещё на месте: стоп сторожа index.html; владелец удаляет заглушку', [
    ['Run workflow', { server: SERVER_ZAGL, domenKarta: DOMEN_ZAGL, popytkaN: 1, vkhody: OBA }],
    ['Re-run (кнопка на странице красного прогона)', { server: SERVER_PUST, domenKarta: DOMEN_403, popytkaN: 2, vkhody: OBA }],
    ['новый Run workflow с обоими входами', { server: SERVER_PUST, domenKarta: DOMEN_403, popytkaN: 1, vkhody: OBA }],
  ]],
  ['S3 таймаут домена при первой выкладке со входом on; сеть вернулась', [
    ['Run workflow', { server: SERVER_PUST, domenKarta: DOMEN_TAIM, popytkaN: 1, vkhody: OBA }],
    ['Re-run («повтори запуск»)', { server: SERVER_PUST, domenKarta: DOMEN_403, popytkaN: 2, vkhody: OBA }],
  ]],
  ['S4 ошибка сертификата при первой выкладке со входом on; сертификат выпущен', [
    ['Run workflow', { server: SERVER_PUST, domenKarta: DOMEN_SERT, popytkaN: 1, vkhody: OBA }],
    ['Re-run («затем запусти снова»)', { server: SERVER_PUST, domenKarta: DOMEN_403, popytkaN: 2, vkhody: OBA }],
  ]],
  ['S5 выкладка по FTPS оборвалась до главной (домен прошёл в попытке 1)', [
    ['Re-run', { server: SERVER_OBORV, domenKarta: DOMEN_403, popytkaN: 2, vkhody: OBA }],
    ['владелец очистил www; новый Run workflow по строке papka «(вход SERPENT_FIRST=on)»', { server: SERVER_PUST, domenKarta: DOMEN_403, popytkaN: 1, vkhody: TOLKO_FIRST }],
    ['Re-run того же', { server: SERVER_PUST, domenKarta: DOMEN_403, popytkaN: 2, vkhody: TOLKO_FIRST }],
    ['новый Run workflow с обоими входами', { server: SERVER_PUST, domenKarta: DOMEN_403, popytkaN: 1, vkhody: OBA }],
  ]],
  ['S6 выкладка легла целиком, упал «Пересчёт на сервере» (.nfs: «повтори пересчёт или выкладку через минуту»)', [
    ['Re-run', { server: SERVER_POLNYI, domenKarta: DOMEN_NASH, popytkaN: 2, vkhody: OBA }],
    ['новый Run workflow, SERPENT_FIRST=off', { server: SERVER_POLNYI, domenKarta: DOMEN_NASH, popytkaN: 1, vkhody: { SERPENT_FIRST: 'off', SERPENT_DOMAIN_BOUND: 'off' } }],
  ]],
];

const out = [`выражение шага домена (YAML): ${VYRAZH}`, `описание поля SERPENT_DOMAIN_BOUND в форме Run workflow: ${WF.on.workflow_dispatch.inputs.SERPENT_DOMAIN_BOUND.description}`, `о повторе в описании поля: ${/Re-run|повтор|попытк/i.test(WF.on.workflow_dispatch.inputs.SERPENT_DOMAIN_BOUND.description) ? 'есть' : 'НЕТ'}`, ''];
for (const [imya, shagi] of STSENARII) {
  out.push(`== ${imya}`);
  for (const [deystvie, arg] of shagi) {
    const r = await popytka(arg);
    out.push(` - ${deystvie}: ${r.itog}`);
    out.push(...r.out);
  }
}
writeFileSync(VYVOD, out.join('\n') + '\n', 'utf8');
console.log(`записано: ${VYVOD}`);
