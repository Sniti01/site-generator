// CL2-P-2: разбор robots.txt «как у открытого разборщика Google» — не как у него в двух местах:
//   • ключи: Google — StartsWithIgnoreCase (robots.cc, ParsedRobotsKey::KeyIsUserAgent/KeyIsAllow/KeyIsDisallow),
//     инструмент — точное слово из словаря KLYUCHI: «User-agents:», «Disallowed:» для Google — ключи, для инструмента — нет;
//   • «User-agent: * что-то» — у Google общая группа (HandleUserAgent: '*' и пробел), у инструмента — агент ''.
// Образцы — внутри блока хостера (его текст инструмент терпит), пути — из PUTI инструмента, чтобы CL2-P-1 не мешал.
//   node p2-klyuchi.mjs
import { progon, zamenit, MIMO, BEZ, HOSTER, nashRobots, igra, googleVerdikt, stroka, CL, vyvesti } from './obshchee.mjs';

const vyvod = [];
const log = (...a) => vyvod.push(a.join(' '));
const PUTI = ['/', igra, '/privacy/'];
const OBRAZCY = [
  ['a) «User-agents:» (ключ с лишней s) — у Google это User-agent', 'User-agents: Googlebot\nUser-agents: Bingbot\nDisallow: /\n'],
  ['b) «Disallowed:» — у Google это Disallow', 'User-agent: Googlebot\nUser-agent: Bingbot\nDisallowed: /\n'],
  ['c) «User-agent: * (all robots)» — у Google общая группа', 'User-agent: * (all robots)\nDisallow: /*\n'],
];
for (const [imya, gruppa] of OBRAZCY) {
  const telo = HOSTER.replace('# END adm.tools', gruppa + '# END adm.tools') + nashRobots;
  const r = await progon((k) => {
    zamenit(k, MIMO, (o) => ({ ...o, telo }));
    zamenit(k, BEZ, (o) => ({ ...o, telo }));
  });
  log(`\n${imya}\n  блок хостера + наш файл; группа: ${JSON.stringify(gruppa)}`);
  log(`  инструмент 816ba46: ${r.itog}; ${stroka(r.najti('robots.txt: поисковики не закрыты'))}`);
  log(`  ${stroka(r.najti('robots.txt без параметра (его берут роботы)'))}`);
  log(`  zakrytoPoiskovikam: ${JSON.stringify(CL.zakrytoPoiskovikam(telo, PUTI))}`);
  log(`  модель Google: ${googleVerdikt(telo, 'googlebot', PUTI)}; ${googleVerdikt(telo, 'bingbot', PUTI)}`);
}
vyvesti('p2-klyuchi', vyvod);
