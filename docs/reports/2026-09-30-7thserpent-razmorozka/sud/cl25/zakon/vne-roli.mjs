// Вне роли (для скептика «ложный ok»), наблюдение: блок хостера с «Allow: /» для бота, которого закрыл файл владельца,
// по правилам Google открывает его (группы одного бота складываются, при равной длине — Allow). Что скажет check-live.
import { progon, zapisat, nashRobots } from './obshchee.mjs';

const BLOK = '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nAllow: /\n# END adm.tools Managed content\n\n';
const r = await progon({ mimo: BLOK + nashRobots });
zapisat('vne-roli-vyvod.txt', [
  `блок: ${JSON.stringify(BLOK)}`,
  `итог ${r.okCount}/${r.vsego}; ПЛОХО: ${r.plokho.join(' | ') || '—'}`,
  ...r.spravki.filter((s) => s.startsWith('robots.txt')).map((s) => `  справка: ${s}`),
]);
