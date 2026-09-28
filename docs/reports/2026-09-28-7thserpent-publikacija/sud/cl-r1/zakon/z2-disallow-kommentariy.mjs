// CL1-Z-2: «Disallow:» с пустым значением и комментарием в строке (RFC 9309 §2.2.2, §2.2.4 —
// всё после # — комментарий; пустой Disallow ничего не запрещает) считается закрытием поисковика.
import { progon, pechat, nashRobots, razobratRobots } from './stend.mjs';

const HOSTER_PUSTOY =
  '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: *\nDisallow: # nothing is blocked for other robots\n# END adm.tools Managed content\n\n';

const r = await progon({ robotsTelo: () => HOSTER_PUSTOY + nashRobots });
pechat('Z2 блок хостера: User-agent: * / Disallow: # комментарий', r);

// Контроль: тот же блок, пустой Disallow без комментария — ok.
const r0 = await progon({ robotsTelo: () => HOSTER_PUSTOY.replace('Disallow: # nothing is blocked for other robots', 'Disallow:') + nashRobots });
pechat('Z2 контроль: User-agent: * / Disallow: (пусто)', r0);

console.log(`\nИТОГ Z2: с комментарием ${r.schet}, zakryvayut=${JSON.stringify(razobratRobots(HOSTER_PUSTOY + nashRobots, nashRobots).zakryvayut)}; без комментария ${r0.schet}`);
