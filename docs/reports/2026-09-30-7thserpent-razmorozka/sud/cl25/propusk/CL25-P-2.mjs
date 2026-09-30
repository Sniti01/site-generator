// CL25-P-2: закрытых владельцем ботов check-live судит только «наш файл целиком» и чужим текстом вне блоков.
// Блок хостера с «Allow: /» для AhrefsBot и SemrushBot открывает их (группы одного бота складываются, при равной длине
// побеждает Allow — RFC 9309, robots.cc) — check-live 44 из 44. Строка Sitemap на чужой хост в блоке — тоже 44 из 44.
// Контроль: те же строки вне блока (чужой текст) — «вне нашего файла» краснеет.
import { robotsCc } from './robots-cc.mjs';
import { progon, nashRobots, vyvod } from './stend.mjs';

const out = [];
const p = (...a) => out.push(a.join(' '));
const OTKR = 'User-agent: AhrefsBot\nAllow: /\n\nUser-agent: SemrushBot\nAllow: /';
const SM = 'Sitemap: https://evil.example/sitemap.xml';
const blok = (s) => `# BEGIN adm.tools Managed content\n${s}\n# END adm.tools Managed content\n\n`;
const sluchai = [
  ['A. блок хостера: Allow: / для AhrefsBot и SemrushBot — перед файлом владельца', blok(OTKR) + nashRobots],
  ['B. блок хостера: те же Allow — после файла владельца', `${nashRobots}\n${blok(OTKR)}`],
  ['C. блок хостера: строка Sitemap на чужой хост', blok(SM) + nashRobots],
  ['контроль D. те же Allow вне блока (чужой текст)', `${OTKR}\n\n${nashRobots}`],
  ['контроль E. блок хостера: пустой Disallow для AhrefsBot (не открывает)', blok('User-agent: AhrefsBot\nDisallow:') + nashRobots],
];
for (const [imya, telo] of sluchai) {
  const r = await progon(telo);
  p(`== ${imya} ==`);
  p(`check-live: ${r.itog}; ПЛОХО: ${r.plokho.join(', ') || '—'}`);
  if (r.otkuda) p(`   ${r.otkuda}`);
  for (const s of r.spravki.filter((x) => x.startsWith('robots.txt'))) p(`   справка: ${s}`);
  for (const b of ['AhrefsBot', 'SemrushBot']) {
    const bylo = robotsCc(nashRobots, [b], '/', { shirokiy: true }).zakryto;
    const stalo = robotsCc(telo, [b], '/', { shirokiy: true }).zakryto;
    p(`   robots.cc ${b} /: файл владельца — ${bylo ? 'закрыт' : 'открыт'}; этот ответ — ${stalo ? 'закрыт' : 'открыт'}`);
  }
  p(`   строки Sitemap в ответе: ${telo.split('\n').filter((s) => /^sitemap\s*:/i.test(s.trim())).join(' | ')}`);
  p('');
}
p('Вывод: обещание файла владельца «закрыты AhrefsBot … serpstatbot» check-live держит, пока всё вне нашего файла — чужой текст');
p('(краснеет «вне нашего файла»); правила блока хостера для этих ботов и прочие его строки (Sitemap) не судятся — 44 из 44.');
vyvod('CL25-P-2-vyvod.txt', out);
