// CL25-P-1: блок хостера живого образца сессии 24 (349 байт байт в байт) снова включён в панели — поверх файла
// владельца. check-live: 44 из 44, след — только справка «блок хостера». По правилам robots.txt (robots.cc,
// RFC 9309) блок меняет правила владельца: закрывает GPTBot, которого владелец из списка хостера убрал.
// Вариант: блок из одной строки «User-agent: GPTBot» перед нашим файлом — строка входит в первую группу владельца
// (AhrefsBot, Disallow: /), GPTBot закрыт чужим блоком нашим же правилом; check-live — 44 из 44.
import { robotsCc, zakrytDlya } from './robots-cc.mjs';
import { progon, nashRobots, BLOK24, OBRAZEC24, B, vyvod } from './stend.mjs';

const out = [];
const p = (...a) => out.push(a.join(' '));
const BOTY = ['AhrefsBot', 'MJ12bot', 'DataForSeoBot', 'barkrowler', 'Bytespider', 'meta-externalagent', 'Baiduspider', 'meta-webindexer', 'AhrefsSiteAudit', 'SemrushBot', 'serpstatbot', 'GPTBot', 'ClaudeBot', 'CCBot', 'PerplexityBot', 'Applebot', 'YandexBot'];
const reshenie = (telo) => Object.fromEntries([
  ...BOTY.map((b) => [b, robotsCc(telo, [b], '/', { shirokiy: true }).zakryto]),
  ...['googlebot', 'googlebot-image', 'bingbot'].map((b) => [b, zakrytDlya(telo, b, '/')]),
]);
const raznica = (a, b) => Object.keys(a).filter((k) => a[k] !== b[k]).map((k) => `${k}: ${a[k] ? 'закрыт' : 'открыт'} → ${b[k] ? 'закрыт' : 'открыт'}`);

const svoy = reshenie(nashRobots);
p('Файл владельца (public/robots.txt копии, 500 байт): закрыты по robots.cc —', Object.keys(svoy).filter((k) => svoy[k]).join(', '));
p('Открыты —', Object.keys(svoy).filter((k) => !svoy[k]).join(', '));

const sluchai = [
  ['A. блок хостера сессии 24 (байт в байт из obrazec-khostera.json) перед файлом владельца', BLOK24 + nashRobots],
  ['B. блок хостера из одной строки «User-agent: GPTBot» перед файлом владельца', '# BEGIN adm.tools Managed content\nUser-agent: GPTBot\n# END adm.tools Managed content\n\n' + nashRobots],
];
for (const [imya, telo] of sluchai) {
  const r = await progon(telo);
  p(`\n== ${imya} ==`);
  p(`check-live: ${r.itog}; ПЛОХО: ${r.plokho.join(', ') || '—'}`);
  for (const s of r.robotsStroki) p(`   ${s}`);
  for (const s of r.spravki.filter((x) => x.startsWith('robots.txt'))) p(`   справка: ${s}`);
  const ih = reshenie(telo);
  p(`robots.cc — чем правила отличаются от файла владельца: ${raznica(svoy, ih).join('; ') || 'ничем'}`);
}
// Сравнение для политики: образец сессии 24 на своих байтах — блок хостера + прежний файл (add241a).
const PREZHNIY = (() => {
  const t = OBRAZEC24.otvety[`${B}/robots.txt?live-check=${OBRAZEC24.metka}`].telo;
  const k = '# END adm.tools Managed content\n\n';
  return t.slice(t.indexOf(k) + k.length);
})();
const r24 = await progon(BLOK24 + PREZHNIY, { nash: PREZHNIY });
p(`\n== для сравнения: образец сессии 24 на своих байтах (блок хостера + прежний файл add241a) ==`);
p(`check-live: ${r24.itog}; robots.cc — чем правила отличаются от прежнего файла: ${raznica(reshenie(PREZHNIY), reshenie(BLOK24 + PREZHNIY)).join('; ') || 'ничем'}`);
p('То есть отказ «блок меняет правила нашего файла» покраснил бы и образец сессии 24 — законную форму по слову владельца (П113).');
p('\nВывод: check-live зелёный (44 из 44), а действующие правила — не правила владельца: GPTBot закрыт блоком хостера.');
p('Проверка «вне нашего файла» судит в блоке хостера только Disallow для *, Googlebot*, Bingbot*, msnbot на путях сборки;');
p('прочие правила блока (и строки User-agent, которые входят в группы нашего файла) не судятся — справка в зелёном прогоне.');
vyvod('CL25-P-1-vyvod.txt', out);
