// CL2-Z-8: главная ответила не 200 (503 хостера на время работ; заголовки HTML при этом верные). Строки
// «Cache-Control у HTML» и новая «HTML не из кэша Cloudflare» — ПЛОХО с пояснением, которое говорит обратное:
// «пришло: «public, max-age=0, must-revalidate»» и «Cf-Cache-Status DYNAMIC» (не из кэша). Причины — ответа 503 —
// в этих строках нет (правило раунда 1: «причина ответа — в строке»).
import { progon, B } from './stend.mjs';

const r = await progon({ pravka: (url, o) => (url === `${B}/` ? { ...o, status: 503, body: '<html><head><title>503 Service Unavailable</title></head><body>Service Unavailable</body></html>' } : undefined) });
const vzyat = (s) => r.proverki.find((c) => c.imya.startsWith(s));
for (const s of ['главная: статус', 'главная: Cache-Control', 'главная: HTML не из кэша']) {
  const c = vzyat(s);
  console.log(`${c.ok ? 'ok   ' : 'ПЛОХО'} ${c.imya}  факт ${c.fakt} — ${c.otkuda}`);
}
console.log(`\nИТОГ Z8: ${r.schet}; «HTML не из кэша»: «${vzyat('главная: HTML не из кэша').otkuda}»; «Cache-Control»: «${vzyat('главная: Cache-Control').otkuda}»`);
