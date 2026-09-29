// SV23-Z2, образец 4: договор workflow в пробах (SV23 workflow: вход SERPENT_DOMAIN_BOUND …) — что он закрепил сверх
// свойства «согласие — только в первой попытке, push — off, шаг домена без обхода, имя входа не течёт в другие шаги».
// Проверки договора перенесены из tools/testy/storozha-vykladki.test.mjs (строки 682–723) дословно по смыслу и
// применены к законным правкам YAML в памяти; репозиторий не меняется.
import assert from 'node:assert/strict';
import { writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const YAML = createRequire('D:/SEO/cloud/site-generator/package.json')('yaml');
const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-sv23-z2';
const VYVOD = `${PAPKA}/z2-4-dogovor-vyvod.txt`;
const ISKHODNIK = readFileSync('D:/SEO/cloud/site-generator/.github/workflows/deploy-7thserpent.yml', 'utf8');

function dogovor(WF) {
  const job = WF.jobs.deploy;
  const shagi = job.steps;
  const shag = (kusok) => shagi.find((s) => (s.name ?? s.uses ?? '').includes(kusok));
  const v = WF.on.workflow_dispatch.inputs.SERPENT_DOMAIN_BOUND;
  assert.ok(v, 'нет входа SERPENT_DOMAIN_BOUND');
  assert.equal(v.type, 'choice');
  assert.deepEqual(v.options, ['off', 'on']);
  assert.equal(v.default, 'off');
  const d = shag('Домен уже привязан');
  assert.equal(d.env.SERPENT_DOMAIN_BOUND, "${{ github.run_attempt == 1 && inputs.SERPENT_DOMAIN_BOUND || 'off' }}");
  assert.equal(d.run, 'node $SITE/tools/storozha-vykladki.mjs domen');
  assert.equal(d.if, undefined);
  assert.equal(d['continue-on-error'], undefined);
  assert.deepEqual(Object.keys(d.env).sort(), ['SERPENT_DOMAIN_BOUND', 'SERPENT_PERVAYA']);
  assert.equal(job['continue-on-error'], undefined);
  const gde = [];
  const obhod = (o, put) => {
    if (typeof o === 'string') {
      if (o.includes('SERPENT_DOMAIN_BOUND')) gde.push(put);
      return;
    }
    if (o && typeof o === 'object') {
      for (const [k, x] of Object.entries(o)) {
        if (k.includes('SERPENT_DOMAIN_BOUND')) gde.push(`${put}.${k}#ключ`);
        obhod(x, `${put}.${k}`);
      }
    }
  };
  obhod(WF, '');
  const iD = shagi.indexOf(d);
  assert.deepEqual(gde.sort(), [
    '.on.workflow_dispatch.inputs.SERPENT_DOMAIN_BOUND#ключ',
    '.on.workflow_dispatch.inputs.SERPENT_DOMAIN_BOUND.description',
    '.on.workflow_dispatch.inputs.SERPENT_FIRST.description',
    `.jobs.deploy.steps.${iD}.env.SERPENT_DOMAIN_BOUND#ключ`,
    `.jobs.deploy.steps.${iD}.env.SERPENT_DOMAIN_BOUND`,
  ].sort());
  assert.match(v.description, /^SERPENT_DOMAIN_BOUND — /);
  assert.match(WF.on.workflow_dispatch.inputs.SERPENT_FIRST.description, /^SERPENT_FIRST — /);
}

const shagDomena = (WF) => WF.jobs.deploy.steps.find((s) => (s.name ?? '').includes('Домен уже привязан'));
const PRAVKI = [
  ['как есть (9ca1aa2)', () => {}],
  ['то же выражение со скобками: (run_attempt == 1 && вход) || off', (WF) => {
    shagDomena(WF).env.SERPENT_DOMAIN_BOUND = "${{ (github.run_attempt == 1 && inputs.SERPENT_DOMAIN_BOUND) || 'off' }}";
  }],
  ['то же выражение: run_attempt == \'1\'', (WF) => {
    shagDomena(WF).env.SERPENT_DOMAIN_BOUND = "${{ github.run_attempt == '1' && inputs.SERPENT_DOMAIN_BOUND || 'off' }}";
  }],
  ['третий ключ env шага домена — номер попытки (сторож печатает «Re-run: согласие снято»)', (WF) => {
    shagDomena(WF).env.SERPENT_POPYTKA = '${{ github.run_attempt }}';
  }],
  ['сторожу домена — файлы сервера (согласие в повторе — только без нашей завершённой выкладки)', (WF) => {
    shagDomena(WF).run = 'node $SITE/tools/storozha-vykladki.mjs domen remote-top/index.html remote-before.txt';
  }],
  ['имя входа в имени шага домена', (WF) => {
    shagDomena(WF).name = 'Домен уже привязан? (вход SERPENT_DOMAIN_BOUND)';
  }],
  ['шаг-подсказка при красном прогоне: «новый Run workflow с теми же входами, не Re-run»', (WF) => {
    WF.jobs.deploy.steps.push({ name: 'Подсказка при красном прогоне', if: 'failure()', run: 'echo "Красный прогон: новый запуск кнопкой Run workflow с теми же входами SERPENT_FIRST и SERPENT_DOMAIN_BOUND (не Re-run: повтор согласия не несёт)"' });
  }],
];

const out = [];
for (const [imya, pravka] of PRAVKI) {
  const WF = YAML.parse(ISKHODNIK);
  pravka(WF);
  try {
    dogovor(WF);
    out.push(`${imya}: договор ДЕРЖИТ`);
  } catch (e) {
    out.push(`${imya}: договор ПАДАЕТ — ${String(e.message).split('\n')[0]}`);
  }
}
writeFileSync(VYVOD, out.join('\n') + '\n', 'utf8');
console.log(`записано: ${VYVOD}`);
