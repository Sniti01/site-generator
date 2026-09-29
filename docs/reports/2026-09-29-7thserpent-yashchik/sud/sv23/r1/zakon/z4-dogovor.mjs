// SV23-Z, образец 4: договор workflow в пробах — держит ли он то, что утверждает («без входа — стоп», «с входом —
// сторож печатает, что отвечает домен», «вход доходит только до сторожа домена»). Утверждения проб, касающиеся шага
// домена, повторены здесь один в один и прогнаны на порчах workflow (в памяти; файл репозитория не меняется).
// Плюс: что форма Run workflow покажет владельцу подписями входов (description) — есть ли в них имена входов.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const { parse, stringify } = createRequire('D:/SEO/cloud/site-generator/package.json')('yaml');
const TEKST = readFileSync('D:/SEO/cloud/site-generator/.github/workflows/deploy-7thserpent.yml', 'utf8');
const VYVOD = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-sv23-z/z4-vyvod.txt';

/** Утверждения проб storozha-vykladki.test.mjs, где участвует шаг домена или вход (строки 627–722 на a836697). */
function proby(WF, tekst) {
  const job = WF.jobs.deploy;
  const shagi = job.steps;
  const shag = (k) => shagi.find((s) => (s.name ?? s.uses ?? '').includes(k));
  const i = (k) => shagi.indexOf(shag(k));
  const itogi = [];
  const t = (imya, f) => {
    try { f(); itogi.push([imya, true]); } catch (e) { itogi.push([imya, false, e.message.split('\n')[0]]); }
  };
  t('SV23 вход: choice off/on, default off; env шага домена; в других шагах имени нет', () => {
    const v = WF.on.workflow_dispatch.inputs.SERPENT_DOMAIN_BOUND;
    assert.ok(v);
    assert.equal(v.type, 'choice');
    assert.deepEqual(v.options, ['off', 'on']);
    assert.equal(v.default, 'off');
    const d = shag('Домен уже привязан');
    assert.equal(d.env.SERPENT_DOMAIN_BOUND, "${{ inputs.SERPENT_DOMAIN_BOUND || 'off' }}");
    for (const s of shagi.filter((x) => x !== d)) assert.ok(!JSON.stringify(s).includes('SERPENT_DOMAIN_BOUND'), s.name ?? s.uses);
  });
  t('SV23 без Cloudflare', () => assert.doesNotMatch(tekst, /cloudflare/i));
  t('push — только при SERPENT_DEPLOY', () => assert.equal(job.if, "github.event_name == 'workflow_dispatch' || vars.SERPENT_DEPLOY == 'on'"));
  t('SV1-O-2… признак первой в шаге домена; порядок', () => {
    assert.equal(shag('Домен уже привязан').env.SERPENT_PERVAYA, '${{ steps.pervaya.outputs.pervaya }}');
    const vykladka = i('Выкладка по FTPS');
    assert.ok(i('Сторож папки робота') < i('Первая выкладка?') && i('Первая выкладка?') < i('Домен уже привязан') && i('Домен уже привязан') < vykladka);
  });
  t('порядок: домен — до выкладки', () => {
    const vykladka = i('Выкладка по FTPS');
    for (const k of ['Секреты на месте', 'Сборка с гейтами', 'Сторож папки робота', 'Домен уже привязан']) assert.ok(i(k) >= 0 && i(k) < vykladka, k);
  });
  t('команды сторожей; циклов нет', () => {
    const run = shagi.map((s) => s.run ?? '').join('\n');
    const komandy = [...run.matchAll(/storozha-vykladki\.mjs (\S+)/g)].map((m) => m[1]);
    assert.deepEqual(komandy.sort(), ['domen', 'glubina', 'indeks', 'papka', 'pereschet', 'pervaya', 'sekrety', 'sverka-dist'].sort());
    assert.doesNotMatch(run, /(^|[\s;])(for|while|until)\s/m);
  });
  return itogi;
}

const PORCHI = [
  ['0. как есть (a836697)', () => {}],
  ['1. run шага домена с «|| true» — стоп без входа не останавливает прогон', (WF) => { WF.jobs.deploy.steps.find((s) => s.name === 'Домен уже привязан?').run += ' || true'; }],
  ['2. continue-on-error: true у шага домена — то же', (WF) => { WF.jobs.deploy.steps.find((s) => s.name === 'Домен уже привязан?')['continue-on-error'] = true; }],
  ['3. if: inputs.SERPENT_DOMAIN_BOUND != \'on\' у шага домена — с входом сторож не запускается и не печатает, что отвечает', (WF) => { WF.jobs.deploy.steps.find((s) => s.name === 'Домен уже привязан?').if = "inputs.SERPENT_DOMAIN_BOUND != 'on'"; }],
  ['4. вход в env всей работы (jobs.deploy.env) — доходит до каждого шага', (WF) => { WF.jobs.deploy.env.SERPENT_DOMAIN_BOUND = "${{ inputs.SERPENT_DOMAIN_BOUND || 'off' }}"; }],
  ['5. вход в env всего workflow (env верхнего уровня)', (WF) => { WF.env = { SERPENT_DOMAIN_BOUND: "${{ inputs.SERPENT_DOMAIN_BOUND || 'off' }}" }; }],
  ['6. проверка ловли: env шага домена — \'on\' всегда', (WF) => { WF.jobs.deploy.steps.find((s) => s.name === 'Домен уже привязан?').env.SERPENT_DOMAIN_BOUND = 'on'; }],
  ['7. проверка ловли: шаг домена без признака первой', (WF) => { delete WF.jobs.deploy.steps.find((s) => s.name === 'Домен уже привязан?').env.SERPENT_PERVAYA; }],
];

const out = [];
for (const [imya, porcha] of PORCHI) {
  const WF = parse(TEKST);
  porcha(WF);
  const tekst = imya.startsWith('0.') ? TEKST : stringify(WF);
  const itogi = proby(WF, tekst);
  const upalo = itogi.filter((x) => !x[1]);
  out.push(`== ${imya}`);
  out.push(`  утверждений ${itogi.length}, упало ${upalo.length}${upalo.length ? '' : imya.startsWith('0.') ? ' — эталон проходит' : ' — ПОРЧА ПРОХОДИТ ПРОБЫ'}`);
  for (const [n, , prichina] of upalo) out.push(`    упало: ${n} — ${prichina}`);
}

// Подписи входов в форме Run workflow: GitHub показывает полем description входа (если есть), имя входа — нет
// (по документации GitHub; здесь не измерено). Где стоит имя входа, которое называет подсказка стопа сторожа домена.
const WF = parse(TEKST);
const vkhody = WF.on.workflow_dispatch.inputs;
out.push('== подписи входов (description) и имена входов в них');
for (const [klyuch, v] of Object.entries(vkhody)) {
  const imenaVPodpisi = Object.keys(vkhody).filter((k) => v.description.includes(k));
  out.push(`  ${klyuch}: «${v.description}»`);
  out.push(`    имён входов в подписи: ${imenaVPodpisi.length ? imenaVPodpisi.join(', ') : 'нет'}; своё имя — ${imenaVPodpisi.includes(klyuch) ? 'есть' : 'НЕТ'}`);
}
writeFileSync(VYVOD, out.join('\n') + '\n', 'utf8');
console.log(`записано: ${VYVOD} (${out.length} строк)`);
