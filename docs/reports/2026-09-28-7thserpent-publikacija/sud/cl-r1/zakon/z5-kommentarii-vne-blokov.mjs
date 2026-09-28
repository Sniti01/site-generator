// CL1-Z-5: строка-комментарий вне управляемых блоков (RFC 9309 §2.2.4 — комментарии правил не несут)
// — отказ «чужой текст», который владелец убрать не может, если его пишет хостер: красный на каждой
// выкладке с SERPENT_LIVE=on. Форма не измерена на первом сайте — проверяется реакция инструмента.
import { progon, pechat, HOSTER, nashRobots } from './stend.mjs';

const a = await progon({ robotsTelo: () => '# robots.txt served by adm.tools hosting\n' + HOSTER + nashRobots });
pechat('Z5a комментарий хостера над его блоком', a);
const b = await progon({ robotsTelo: () => HOSTER.replace(/\n\n$/, '\n#\n') + nashRobots });
pechat('Z5b пустой комментарий «#» между блоком хостера и нашим файлом', b);
console.log(`\nИТОГ Z5: a=${a.schet} [${a.plokho.map((c) => c.otkuda).join(' | ')}]; b=${b.schet} [${b.plokho.map((c) => c.otkuda).join(' | ')}]`);
