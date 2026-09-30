// CL25-P-7: пробы «замер цел» закрепляют константой только хвост образца сессии 24 (SHA_PREZHNEGO). Голова образца
// сессии 24 (блок хостера, 349 байт) и замер владельца (500 байт, sha256 d1a2779c…8bb3) держатся лишь sha256 внутри
// того же JSON: согласованная подмена (тела и sha256; для владельца — вместе с public/robots.txt) проходит весь набор.
// Контроль: согласованная подмена хвоста сессии 24 — красная (константа держит).
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { PAPKA, KOPIYA, BLOK24, nashRobots, vyvod } from './stend.mjs';

const out = [];
const p = (...a) => out.push(a.join(' '));
const sha = (t) => createHash('sha256').update(Buffer.from(t, 'utf8')).digest('hex');
const FAJLY = ['tools/check-live.mjs', 'tools/testy/check-live.test.mjs', 'tools/testy/obrazec-khostera.json', 'tools/testy/obrazec-vladelca.json', 'public/robots.txt', 'structure/structure.json'];
const zamenitVse = (t, iz, na) => {
  if (!t.includes(iz)) throw new Error(`нет «${iz}»`);
  return t.split(iz).join(na);
};
function mutant(imya, pravka) {
  const M = `${PAPKA}/${imya}/sites/7thserpent.com`;
  for (const d of ['tools/testy', 'public', 'structure']) mkdirSync(`${M}/${d}`, { recursive: true });
  for (const f of FAJLY) copyFileSync(`${KOPIYA}/${f}`, `${M}/${f}`);
  pravka(M);
  const r = spawnSync(process.execPath, ['--test', `${M}/tools/testy/check-live.test.mjs`], { encoding: 'utf8' });
  const schet = (k) => (new RegExp(`ℹ ${k} (\\d+)`).exec(r.stdout) ?? [])[1];
  const upali = [...new Set(r.stdout.split('\n').filter((s) => /^✖ /.test(s.trim()) && !s.includes('failing tests')).map((s) => s.trim().replace(/ \([\d.]+ms\)$/, '')))];
  return `tests ${schet('tests')}, pass ${schet('pass')}, fail ${schet('fail')}, todo ${schet('todo')}${upali.length ? `; упали: ${upali.join(' | ')}` : ''}`;
}
const tela24 = (O) => [...Object.values(O.otvety).filter((o) => typeof o.telo === 'string' && o.telo.includes('Managed content')), ...O.robotsPary.flatMap((x) => [x.s, x.bez])];
const podmena24 = (iz, na) => (M) => {
  const O = JSON.parse(readFileSync(`${M}/tools/testy/obrazec-khostera.json`, 'utf8'));
  for (const o of tela24(O)) {
    o.telo = zamenitVse(o.telo, iz, na);
    o.sha256 = sha(o.telo);
  }
  writeFileSync(`${M}/tools/testy/obrazec-khostera.json`, JSON.stringify(O, null, 2));
};

p(`Голова образца сессии 24 (блок хостера): ${Buffer.byteLength(BLOK24, 'utf8')} байт, sha256 ${sha(BLOK24)} — в пробах константы нет.`);
p(`Файл владельца (public/robots.txt копии): ${Buffer.byteLength(nashRobots, 'utf8')} байт, sha256 ${sha(nashRobots)} — в пробах константы нет.`);
p('');
p(`A. голова сессии 24: «User-Agent: GPTBot» → «User-Agent: CCBot1» (длина и 13 строк те же): ${mutant('mutant-p7a', podmena24('User-Agent: GPTBot\n', 'User-Agent: CCBot1\n'))}`);
p(`B. владелец: без группы Baiduspider — в public/robots.txt и в обеих парах образца: ${mutant('mutant-p7b', (M) => {
  const bez = (t) => zamenitVse(t, 'User-Agent: Baiduspider\nDisallow: /\n\n', '');
  writeFileSync(`${M}/public/robots.txt`, bez(readFileSync(`${M}/public/robots.txt`, 'utf8')));
  const V = JSON.parse(readFileSync(`${M}/tools/testy/obrazec-vladelca.json`, 'utf8'));
  for (const x of V.robotsPary) for (const o of [x.s, x.bez]) {
    o.telo = bez(o.telo);
    o.sha256 = sha(o.telo);
  }
  writeFileSync(`${M}/tools/testy/obrazec-vladelca.json`, JSON.stringify(V, null, 2));
})}`);
p(`контроль C. хвост сессии 24: «Every page is open» → «Every page is OPEN»: ${mutant('mutant-p7c', podmena24('Every page is open', 'Every page is OPEN'))}`);
vyvod('CL25-P-7-vyvod.txt', out);
