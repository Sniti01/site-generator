// Держат ли пробы образцов: (d1) public/robots.txt правлен без пересъёмки образца владельца (перевод строки в конце);
// (d2) public/robots.txt без группы serpstatbot; (d3) хвост образца сессии 24 подменён согласованно (тела и sha256 в JSON,
// длина та же); (d4) голова образца сессии 24 (блок хостера) подменена согласованно, длина та же; (d5) образец владельца
// подменён согласованно с public/robots.txt (файл без группы serpstatbot, тела и sha256 в JSON).
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { PAPKA, KOPIYA, vyvod } from './stend.mjs';

const out = [];
const p = (...a) => out.push(a.join(' '));
const sha = (t) => createHash('sha256').update(Buffer.from(t, 'utf8')).digest('hex');
const FAJLY = ['tools/check-live.mjs', 'tools/testy/check-live.test.mjs', 'tools/testy/obrazec-khostera.json', 'tools/testy/obrazec-vladelca.json', 'public/robots.txt', 'structure/structure.json'];

function mutant(imya, pravka) {
  const M = `${PAPKA}/${imya}/sites/7thserpent.com`;
  for (const d of ['tools/testy', 'public', 'structure']) mkdirSync(`${M}/${d}`, { recursive: true });
  for (const f of FAJLY) copyFileSync(`${KOPIYA}/${f}`, `${M}/${f}`);
  pravka(M);
  const r = spawnSync(process.execPath, ['--test', `${M}/tools/testy/check-live.test.mjs`], { encoding: 'utf8' });
  const schet = (k) => (new RegExp(`ℹ ${k} (\\d+)`).exec(r.stdout) ?? [])[1];
  const upali = [...new Set(r.stdout.split('\n').filter((s) => /^✖ /.test(s.trim())).map((s) => s.trim().replace(/ \([\d.]+ms\)$/, '')))];
  return { itog: `tests ${schet('tests')}, pass ${schet('pass')}, fail ${schet('fail')}, todo ${schet('todo')}`, upali };
}
const zamenitVse = (t, iz, na) => {
  if (!t.includes(iz)) throw new Error(`нет «${iz}»`);
  return t.split(iz).join(na);
};
const bezSerp = (t) => zamenitVse(t, 'User-agent: serpstatbot\nDisallow: /\n\n', '');

const sluchai = [
  ['d1: public/robots.txt с переводом строки в конце, образец владельца не тронут', 'mutant-d1', (M) => writeFileSync(`${M}/public/robots.txt`, `${readFileSync(`${M}/public/robots.txt`, 'utf8')}\n`)],
  ['d2: public/robots.txt без группы serpstatbot, образец владельца не тронут', 'mutant-d2', (M) => writeFileSync(`${M}/public/robots.txt`, bezSerp(readFileSync(`${M}/public/robots.txt`, 'utf8')))],
  ['d3: хвост образца сессии 24 подменён согласованно (все тела и sha256; длина та же)', 'mutant-d3', (M) => {
    const O = JSON.parse(readFileSync(`${M}/tools/testy/obrazec-khostera.json`, 'utf8'));
    const tela = [...Object.values(O.otvety).filter((o) => typeof o.telo === 'string' && o.telo.includes('Managed content')), ...O.robotsPary.flatMap((x) => [x.s, x.bez])];
    for (const o of tela) {
      o.telo = zamenitVse(o.telo, 'Every page is open', 'Every page is OPEN');
      o.sha256 = sha(o.telo);
    }
    writeFileSync(`${M}/tools/testy/obrazec-khostera.json`, JSON.stringify(O, null, 2));
  }],
  ['d4: голова образца сессии 24 (блок хостера) подменена согласованно: GPTBot → CCBot1 (длина та же)', 'mutant-d4', (M) => {
    const O = JSON.parse(readFileSync(`${M}/tools/testy/obrazec-khostera.json`, 'utf8'));
    const tela = [...Object.values(O.otvety).filter((o) => typeof o.telo === 'string' && o.telo.includes('Managed content')), ...O.robotsPary.flatMap((x) => [x.s, x.bez])];
    for (const o of tela) {
      o.telo = zamenitVse(o.telo, 'User-Agent: GPTBot\n', 'User-Agent: CCBot1\n');
      o.sha256 = sha(o.telo);
    }
    writeFileSync(`${M}/tools/testy/obrazec-khostera.json`, JSON.stringify(O, null, 2));
  }],
  ['d5: образец владельца и public/robots.txt подменены согласованно (без группы serpstatbot)', 'mutant-d5', (M) => {
    writeFileSync(`${M}/public/robots.txt`, bezSerp(readFileSync(`${M}/public/robots.txt`, 'utf8')));
    const V = JSON.parse(readFileSync(`${M}/tools/testy/obrazec-vladelca.json`, 'utf8'));
    for (const x of V.robotsPary) for (const o of [x.s, x.bez]) {
      o.telo = bezSerp(o.telo);
      o.sha256 = sha(o.telo);
    }
    writeFileSync(`${M}/tools/testy/obrazec-vladelca.json`, JSON.stringify(V, null, 2));
  }],
  ['d6: образец владельца и public/robots.txt подменены согласованно (без группы Baiduspider — её пробы не трогают)', 'mutant-d6', (M) => {
    const bezBaidu = (t) => zamenitVse(t, 'User-Agent: Baiduspider\nDisallow: /\n\n', '');
    writeFileSync(`${M}/public/robots.txt`, bezBaidu(readFileSync(`${M}/public/robots.txt`, 'utf8')));
    const V = JSON.parse(readFileSync(`${M}/tools/testy/obrazec-vladelca.json`, 'utf8'));
    for (const x of V.robotsPary) for (const o of [x.s, x.bez]) {
      o.telo = bezBaidu(o.telo);
      o.sha256 = sha(o.telo);
    }
    writeFileSync(`${M}/tools/testy/obrazec-vladelca.json`, JSON.stringify(V, null, 2));
  }],
];
for (const [imya, papka, pravka] of sluchai) {
  const r = mutant(papka, pravka);
  p(`== ${imya} ==`);
  p(`   ${r.itog}`);
  for (const s of r.upali) p(`   ${s}`);
  p('');
}
vyvod('derzhit-obrazcy-vyvod.txt', out);
