// Разбор: копия = коммит cbe35eb; константа SHA_PREZHNEGO = sha256 public/robots.txt сборки add241a;
// заголовки robots.txt образца сессии 24 (ETag, Content-Length, Last-Modified) и текст блока хостера.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const REPO = 'D:/SEO/cloud/site-generator';
const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-cl25/propusk';
const KOPIYA = `${PAPKA}/kopiya/sites/7thserpent.com`;
const out = [];
const p = (...a) => out.push(a.join(' '));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const git = (rev, put) => execFileSync('git', ['-C', REPO, 'show', `${rev}:sites/7thserpent.com/${put}`]);

p('== копия против cbe35eb ==');
for (const f of ['tools/check-live.mjs', 'tools/testy/check-live.test.mjs', 'tools/testy/obrazec-khostera.json', 'tools/testy/obrazec-vladelca.json', 'public/robots.txt', 'structure/structure.json']) {
  const k = readFileSync(`${KOPIYA}/${f}`);
  const g = git('cbe35eb', f);
  p(f, k.equals(g) ? 'равна' : `РАЗНАЯ (копия ${k.length} байт, коммит ${g.length} байт)`);
}

p('\n== public/robots.txt по коммитам ==');
for (const rev of ['add241a', 'b388547', 'cbe35eb']) {
  const b = git(rev, 'public/robots.txt');
  p(rev, `${b.length} байт`, sha(b), `CR: ${b.includes(13)}`, `конец \\n: ${b[b.length - 1] === 10}`);
}
p('SHA_PREZHNEGO в тесте: aeb7e60216d550b8012dfba91b53fb07e106ce7cc27b6e896cf22d11da3c9ac6');

p('\n== образец сессии 24: robots.txt ==');
const O = JSON.parse(readFileSync(`${KOPIYA}/tools/testy/obrazec-khostera.json`, 'utf8'));
p('ключи:', Object.keys(O).join(', '));
if (O._) p('шапка образца:', JSON.stringify(O._));
const robotsOtvety = Object.entries(O.otvety).filter(([u]) => u.includes('/robots.txt'));
const vse = [...robotsOtvety.map(([u, o]) => ({ para: 'прогона 1', u, o })), ...O.robotsPary.flatMap((x) => [{ para: x.para, u: x.s.url, o: x.s }, { para: x.para, u: x.bez.url, o: x.bez }])];
for (const { para, u, o } of vse) {
  const z = Object.fromEntries(o.zagolovki);
  const baity = Buffer.byteLength(o.telo, 'utf8');
  p(`пара ${para}: ${u}`);
  p(`   статус ${o.status}; тело ${baity} байт (0x${baity.toString(16)}); etag ${z.etag ?? '—'}; content-length ${z['content-length'] ?? '—'}; last-modified ${z['last-modified'] ?? '—'}; date ${z.date ?? '—'}; x-ray ${z['x-ray'] ?? '—'}; server ${z.server ?? '—'}`);
}
const telo = vse[0].o.telo;
const konec = '# END adm.tools Managed content\n\n';
const blok = telo.slice(0, telo.indexOf(konec) + konec.length);
p('\n== блок хостера (голова тела образца сессии 24) ==');
p(`длина ${Buffer.byteLength(blok, 'utf8')} байт`);
p(blok);
const hvost = telo.slice(telo.indexOf(konec) + konec.length);
p(`хвост ${Buffer.byteLength(hvost, 'utf8')} байт, sha256 ${sha(Buffer.from(hvost, 'utf8'))}`);
p(`хвост = add241a:public/robots.txt: ${Buffer.from(hvost, 'utf8').equals(git('add241a', 'public/robots.txt'))}`);

p('\n== образец владельца ==');
const V = JSON.parse(readFileSync(`${KOPIYA}/tools/testy/obrazec-vladelca.json`, 'utf8'));
for (const x of V.robotsPary) for (const o of [x.s, x.bez]) {
  const z = Object.fromEntries(o.zagolovki);
  const baity = Buffer.byteLength(o.telo, 'utf8');
  p(`пара ${x.para}: ${o.url}: статус ${o.status}; тело ${baity} байт (0x${baity.toString(16)}); etag ${z.etag}; last-modified ${z['last-modified']}; sha256 ${o.sha256}`);
}

writeFileSync(`${PAPKA}/razbor-obrazcov-vyvod.txt`, out.join('\n') + '\n');
