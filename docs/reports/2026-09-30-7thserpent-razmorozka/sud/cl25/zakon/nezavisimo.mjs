// Держит: ожидания «поисковики не закрыты» у порч robots.txt (копия проб cbe35eb) — против независимого разбора по
// robots.cc (конечный автомат RobotsMatcher: seen_global/specific/separator, приоритет = длина образца, Allow при
// равенстве, группы одного бота складываются; опечатки ключей и «*» с пробелом — как в robots.cc). Цепочки ботов —
// как в документации: Googlebot-Image → Googlebot, Bingbot → msnbot; затем «*».
import { progon, zapisat, nashRobots, PUTI_SBORKI, BLOK_ZHIVOY, CL } from './obshchee.mjs';

const OPECH = ['disallow', 'dissallow', 'dissalow', 'disalow', 'diasllow', 'disallaw'];
function strokiRobots(telo) {
  let t = telo.startsWith('﻿') ? telo.slice(1) : telo;
  return t.split(/\r\n|\r|\n/).map((s0) => {
    const s = s0.replace(/#.*$/, '').trim();
    if (!s) return null;
    let d = s.indexOf(':');
    let k;
    let v;
    if (d >= 0) [k, v] = [s.slice(0, d).trim(), s.slice(d + 1).trim()];
    else {
      const m = /^(\S+)\s+(\S+)$/.exec(s);
      if (!m) return null;
      [k, v] = [m[1], m[2]];
    }
    const x = k.toLowerCase();
    const vid = x.startsWith('user-agent') || x.startsWith('useragent') || x.startsWith('user agent') ? 'ua' : OPECH.some((p) => x.startsWith(p)) ? 'dis' : x.startsWith('allow') ? 'al' : 'drugoe';
    return { vid, v };
  }).filter(Boolean);
}
function sovp(put, obr) {
  // robots.cc Matches: «*» — любая последовательность, «$» в конце — конец пути.
  const konec = obr.endsWith('$');
  const chasti = (konec ? obr.slice(0, -1) : obr).split('*').map((c) => c.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${chasti.join('.*')}${konec ? '$' : ''}`).test(put);
}
/** robots.cc для одного агента: { zapret, videlSvoy }. */
function robotsCc(telo, agent, put) {
  let g = false; let sp = false; let sep = false; let ever = false;
  const pr = { as: -1, ds: -1, ag: -1, dg: -1 };
  for (const { vid, v } of strokiRobots(telo)) {
    if (vid === 'ua') {
      if (sep) { sp = g = sep = false; }
      if (v[0] === '*' && (v.length === 1 || /\s/.test(v[1]))) g = true;
      else if ((/^[A-Za-z_-]+/.exec(v)?.[0] ?? '').toLowerCase() === agent) { ever = sp = true; }
    } else if (vid === 'al' || vid === 'dis') {
      if (!(g || sp)) continue;
      sep = true;
      const p = sovp(put, v) ? v.length : -1;
      if (p < 0) continue;
      const kl = `${vid === 'al' ? 'a' : 'd'}${sp ? 's' : 'g'}`;
      if (pr[kl] < p) pr[kl] = p;
    }
  }
  let zapret;
  if (pr.as > 0 || pr.ds > 0) zapret = pr.ds > pr.as;
  else if (ever) zapret = false;
  else zapret = pr.dg > 0 || pr.ag > 0 ? pr.dg > pr.ag : false;
  return { zapret, ever };
}
const TSEP = { googlebot: ['googlebot'], 'googlebot-image': ['googlebot-image', 'googlebot'], bingbot: ['bingbot', 'msnbot'] };
function zakrytoNezav(telo, puti) {
  const out = [];
  for (const [bot, tsep] of Object.entries(TSEP)) {
    for (const put of puti) {
      // Первый агент цепочки, у которого есть своя группа; нет ни у кого — общая группа (последний в цепочке без своей).
      let r = null;
      for (const a of tsep) {
        r = robotsCc(telo, a, put);
        if (r.ever) break;
      }
      if (r.zapret) out.push(`${bot} ${put}`);
    }
  }
  return out;
}

const HOSTER = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n# END adm.tools Managed content\n\n';
const vBlok = (iz, na) => HOSTER.replace(iz, na) + nashRobots;
const B = 'https://www.7thserpent.com';
const PORCHI = [
  ['чужая группа вне блоков', 'User-agent: GPTBot\nDisallow: /\n\n' + HOSTER + nashRobots, false],
  ['наш файл изменён (Allow → Disallow)', HOSTER + nashRobots.replace('Allow: /', 'Disallow: /'), true],
  ['блок хостера закрывает Googlebot', vBlok('User-agent: MJ12bot', 'User-agent: Googlebot'), false],
  ['блок хостера без END', HOSTER.replace('# END adm.tools Managed content', '') + nashRobots, false],
  ['CL1-P-9a Googlebot, «Disallow /»', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDisallow /'), false],
  ['CL1-P-9b Googlebot, «Dissallow: /»', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDissallow: /'), false],
  ['CL1-P-9c «User agent: Googlebot»', vBlok('User-agent: MJ12bot', 'User agent: Googlebot'), false],
  ['П113 Googlebot, «Disallow: /movie/»', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDisallow: /movie/'), true],
  ['П113 Googlebot, «Disallow /movie/»', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDisallow /movie/'), true],
  ['CL1-P-10 правило блока после файла', nashRobots + '\n# BEGIN adm.tools Managed content\nDisallow: /*\n# END adm.tools Managed content\n', true],
  ['CL3-P-5 /movie/ после файла', nashRobots + '\n# BEGIN adm.tools Managed content\nDisallow: /movie/\n# END adm.tools Managed content\n', true],
  ['CL3-P-5, CL3-Z-3 /*?, /wp-admin/', nashRobots + '\n# BEGIN adm.tools Managed content\nDisallow: /*?\nDisallow: /wp-admin/\n# END adm.tools Managed content\n', false],
  ['CL3-Z-3 * /cgi-bin/, /.well-known/', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: /cgi-bin/\nDisallow: /.well-known/'), false],
  ['CL3-Z-4 * /.', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: /.'), false],
  ['CL1-Z-2 «Disallow: # …»', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: # nothing is blocked for other robots'), false],
  ['CL2-P-1a * /movie/, /cheats/', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: /movie/\nDisallow: /cheats/'), true],
  ['CL2-P-1b * CSS', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: *\nDisallow: /*.css$'), true],
  ['CL2-P-1c Googlebot-Image', vBlok('User-agent: MJ12bot', 'User-agent: Googlebot-Image'), true],
  ['CL2-P-1 msnbot', vBlok('User-agent: MJ12bot', 'User-agent: msnbot'), true],
  ['CL2-P-5a «User-agents: Googlebot»', vBlok('User-agent: MJ12bot', 'User-agents: Googlebot'), false],
  ['CL2-P-5b «Disallowed: /»', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: Googlebot\nDisallowed: /'), false],
  ['П113 «User-agents» + «Disallowed: /cheats/»', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agents: Googlebot\nDisallowed: /cheats/'), true],
  ['CL2-P-5c «User-agent: * (all robots)»', vBlok('User-agent: MJ12bot\nDisallow: /', 'User-agent: * (all robots)\nDisallow: /*'), true],
  ['П113 на сервере: Googlebot — Disallow: /movie/', HOSTER + nashRobots.replace('User-agent: Googlebot\nAllow: /', 'User-agent: Googlebot\nDisallow: /movie/'), true],
  ['файл владельца', nashRobots, false],
  ['живой блок хостера + файл владельца', BLOK_ZHIVOY + nashRobots, false],
];
const out = [];
let rashozhdeniy = 0;
for (const [imya, telo, zhdemPoisk] of PORCHI) {
  const nez = zakrytoNezav(telo, PUTI_SBORKI);
  const cl = CL.zakrytoPoiskovikam(telo, PUTI_SBORKI);
  const r = await progon({ mimo: telo });
  const poisk = r.plokho.includes('robots.txt: поисковики не закрыты');
  const sovpalo = (nez.length > 0) === zhdemPoisk && poisk === zhdemPoisk && JSON.stringify(nez) === JSON.stringify(cl);
  if (!sovpalo) rashozhdeniy += 1;
  out.push(`${sovpalo ? 'СОВПАЛО' : 'РАСХОЖДЕНИЕ'} ${imya}: ожидание пробы POISK=${zhdemPoisk}; check-live POISK=${poisk}; независимо закрыто ${nez.length} (${nez.slice(0, 3).join(', ') || '—'}); check-live закрыто ${cl.length}`);
}
out.push('', `расхождений: ${rashozhdeniy} из ${PORCHI.length}`);
zapisat('nezavisimo-vyvod.txt', out);
