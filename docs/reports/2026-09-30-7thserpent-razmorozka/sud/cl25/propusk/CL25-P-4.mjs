// CL25-P-4: после П113 порчи CL1-P-9b («Dissallow») и CL1-P-9c («User agent») ждут только «вне нашего файла» —
// верно по правилам Google (Allow: / группы Googlebot владельца побеждает при равной длине), но «поисковики не закрыты»
// этими формами больше не пробуется ничем. Мутант: копия check-live, где zakrytoPoiskovikam разбирает строго (без
// опечаток Disallow и без «User agent»/«useragent»), а «вне нашего файла» — как было. Набор проб cbe35eb мутанта
// не ловит (все зелёные); предложенные пробы (те же формы с путём длиннее «/» или для Googlebot-Image) — ловят.
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { PAPKA, KOPIYA, nashRobots, PUTI_SBORKI, razobratRobots as rbOrig, zakrytoPoiskovikam as zpOrig, vyvod } from './stend.mjs';

const out = [];
const p = (...a) => out.push(a.join(' '));
const M = `${PAPKA}/mutant-p4/sites/7thserpent.com`;
for (const d of ['tools/testy', 'public', 'structure']) mkdirSync(`${M}/${d}`, { recursive: true });
for (const f of ['tools/testy/check-live.test.mjs', 'tools/testy/obrazec-khostera.json', 'tools/testy/obrazec-vladelca.json', 'public/robots.txt', 'structure/structure.json']) copyFileSync(`${KOPIYA}/${f}`, `${M}/${f}`);

let kod = readFileSync(`${KOPIYA}/tools/check-live.mjs`, 'utf8');
const zamenit = (iz, na) => {
  const n = kod.split(iz).length - 1;
  if (n !== 1) throw new Error(`образец мутации встречается ${n} раз: ${iz}`);
  kod = kod.replace(iz, na);
};
zamenit('function gruppy(telo, otkuda = () => null) {', 'function gruppy(telo, otkuda = () => null, strogo = false) {');
zamenit('    const vid = klyuch(k);\n', '    const vid = strogo ? klyuchStrogo(k) : klyuch(k);\n');
zamenit('/** Группы файла как у robots.cc', "function klyuchStrogo(k) {\n  const x = k.toLowerCase();\n  if (x.startsWith('user-agent')) return 'ua';\n  if (x.startsWith('disallow')) return 'disallow';\n  if (x.startsWith('allow')) return 'allow';\n  return 'drugoe';\n}\n/** Группы файла как у robots.cc");
zamenit('export function zakrytoPoiskovikam(telo, puti) {\n  const gr = gruppy(telo);', 'export function zakrytoPoiskovikam(telo, puti) {\n  const gr = gruppy(telo, () => null, true);');
writeFileSync(`${M}/tools/check-live.mjs`, kod);
p('Мутант: zakrytoPoiskovikam не узнаёт «Dissallow…» и прочие опечатки Disallow, «User agent», «useragent»; «вне нашего файла» — прежний разбор.');

const r = spawnSync(process.execPath, ['--test', `${M}/tools/testy/check-live.test.mjs`], { encoding: 'utf8' });
const schet = (k) => (new RegExp(`ℹ ${k} (\\d+)`).exec(r.stdout) ?? [])[1];
p(`\nНабор проб cbe35eb на мутанте: tests ${schet('tests')}, pass ${schet('pass')}, fail ${schet('fail')}, todo ${schet('todo')} — мутант жив.`);
for (const s of r.stdout.split('\n').filter((x) => /CL1-P-9b|CL1-P-9c/.test(x) && !x.includes('test at'))) p(`   ${s.trim()}`);

const MUT = await import(pathToFileURL(`${M}/tools/check-live.mjs`).href);
const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const vBlok = (iz, na) => HOSTER.replace(iz, na) + nashRobots;
const sudit = (zp, rb, telo) => {
  const x = rb(telo, nashRobots, PUTI_SBORKI);
  const vne = x.chuzhoyTekst.length + x.ogranicheniya.length ? 'ПЛОХО' : 'ok';
  return `поисковики ${zp(telo, PUTI_SBORKI).length ? 'ПЛОХО' : 'ok'}, вне ${vne}`;
};
const formy = [
  ['CL1-P-9b (как в cbe35eb): Googlebot, «Dissallow: /»', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDissallow: /')],
  ['CL1-P-9c (как в cbe35eb): «User agent: Googlebot», Disallow: /', vBlok('User-agent: MJ12bot', 'User agent: Googlebot')],
  ['предложено: Googlebot, «Dissallow: /movie/»', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDissallow: /movie/')],
  ['предложено: «User agent: Googlebot», Disallow: /movie/', vBlok('User-agent: MJ12bot\nDisallow: /', 'User agent: Googlebot\nDisallow: /movie/')],
  ['предложено: «User agent: Googlebot-Image», Disallow: /', vBlok('User-agent: MJ12bot', 'User agent: Googlebot-Image')],
  ['предложено: Googlebot-Image, «Dissallow: /»', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot-Image\nDissallow: /')],
];
p('\nФормы: check-live cbe35eb против мутанта');
for (const [imya, telo] of formy) p(`${imya}: cbe35eb — ${sudit(zpOrig, rbOrig, telo)}; мутант — ${sudit(MUT.zakrytoPoiskovikam, MUT.razobratRobots, telo)}`);

const test = readFileSync(`${KOPIYA}/tools/testy/check-live.test.mjs`, 'utf8').split('\n');
const sPoisk = test.filter((s) => /Dissallow|User agent|useragent/i.test(s) && /\bPOISK\b/.test(s)).length;
p(`\nСтрок проб с формами «Dissallow», «User agent», «useragent» и ожиданием POISK в cbe35eb: ${sPoisk}`);
vyvod('CL25-P-4-vyvod.txt', out);
