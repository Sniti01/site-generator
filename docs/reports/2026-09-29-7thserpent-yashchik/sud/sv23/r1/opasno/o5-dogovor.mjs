// SV23-O-5: проба «SV23 workflow: … доходит только до сторожа домена» (storozha-vykladki.test.mjs, строки 634–643)
// ищет имя входа только в шагах (jobs.deploy.steps); env задания (jobs.deploy.env), env всего workflow (env), условие
// задания (jobs.deploy.if) — вне пробы. Сначала — где вход стоит в нынешнем workflow (всё дерево YAML); затем порчи
// копии разобранного YAML в памяти (файл workflow не меняется): вход в env задания, в env workflow, в if задания —
// условие пробы выполнено, хотя вход виден всем шагам (или решает, идёт ли задание вообще).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { REPO, WF_PUT, vyvod } from './obshchee-o.mjs';

const { parse } = createRequire(`${REPO}/package.json`)('yaml');
const WF_TEKST = readFileSync(WF_PUT, 'utf8');
const IMYA = 'SERPENT_DOMAIN_BOUND';

/** Условие пробы дословно: вход choice off/on, по умолчанию off; шаг домена — ровно это выражение; прочие ШАГИ — без имени. */
function uslovieProby(WF) {
  const oshibki = [];
  const v = WF.on.workflow_dispatch.inputs[IMYA];
  if (!v) return ['нет входа'];
  if (v.type !== 'choice') oshibki.push('не choice');
  if (JSON.stringify(v.options) !== JSON.stringify(['off', 'on'])) oshibki.push('варианты не off/on');
  if (v.default !== 'off') oshibki.push('по умолчанию не off');
  const shagi = WF.jobs.deploy.steps;
  const d = shagi.find((s) => (s.name ?? s.uses ?? '').includes('Домен уже привязан'));
  if (d.env[IMYA] !== "${{ inputs.SERPENT_DOMAIN_BOUND || 'off' }}") oshibki.push('выражение шага домена иное');
  for (const s of shagi.filter((x) => x !== d)) if (JSON.stringify(s).includes(IMYA)) oshibki.push(`имя входа в шаге «${s.name ?? s.uses}»`);
  return oshibki;
}

/** Все места дерева YAML, где встречается имя входа (ключом или в значении). */
function gdeVkhod(uzel, put = '') {
  if (uzel === null || typeof uzel !== 'object') return typeof uzel === 'string' && uzel.includes(IMYA) ? [`${put} = ${JSON.stringify(uzel)}`] : [];
  return Object.entries(uzel).flatMap(([k, v]) => [...(k === IMYA ? [`${put}.${k} (ключ)`] : []), ...gdeVkhod(v, `${put}.${k}`)]);
}

const stroki = [];
const WF = parse(WF_TEKST);
stroki.push('Нынешний workflow — где стоит имя входа:', ...gdeVkhod(WF).map((s) => `  ${s}`));
stroki.push(`  условие пробы: ${uslovieProby(WF).length ? `НЕ выполнено: ${uslovieProby(WF).join('; ')}` : 'выполнено'}`);
stroki.push(`  env задания: ${JSON.stringify(Object.keys(WF.jobs.deploy.env ?? {}))}; env workflow: ${JSON.stringify(WF.env ?? null)}; if задания: ${JSON.stringify(WF.jobs.deploy.if)}`);
stroki.push('');

const VYRAZHENIE = "${{ inputs.SERPENT_DOMAIN_BOUND || 'off' }}";
const PORCHI = [
  ['вход в env задания — его видят все шаги, и выкладка, и пересчёт', (w) => { w.jobs.deploy.env[IMYA] = VYRAZHENIE; }],
  ['вход в env всего workflow', (w) => { w.env = { [IMYA]: VYRAZHENIE }; }],
  ['вход в if задания — решает, идёт ли задание вообще', (w) => { w.jobs.deploy.if = `${w.jobs.deploy.if} || inputs.${IMYA} == 'on'`; }],
];
for (const [imya, isportit] of PORCHI) {
  const kopiya = parse(WF_TEKST);
  isportit(kopiya);
  const u = uslovieProby(kopiya);
  stroki.push(`порча: ${imya}`);
  stroki.push(`  где имя входа: ${gdeVkhod(kopiya).filter((s) => !s.startsWith('.on.')).join(' | ')}`);
  stroki.push(`  условие пробы: ${u.length ? `не выполнено (${u.join('; ')}) — проба ловит` : 'ВЫПОЛНЕНО — проба не ловит'}`);
}
vyvod('o5-vyvod.txt', stroki);
