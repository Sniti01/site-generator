// CL2-Z-5: Cf-Cache-Status REVALIDATED — копия края подтверждена сервером в этом же запросе (If-None-Match /
// If-Modified-Since → 304), то есть отдано то, что сейчас на сервере. Так отвечает правило кэша для HTML, уважающее
// `max-age=0, must-revalidate` из .htaccess: каждый запрос сверяется с сервером. При той же настройке ответ сервера 200
// вместо 304 даёт EXPIRED. Инструмент: EXPIRED — ok, REVALIDATED — ПЛОХО «правка не дойдёт до читателя» / «обход не удался».
import { progon, pechat, B, METKA, sZag } from './stend.mjs';

const MIMO = `${B}/robots.txt?live-check=${METKA}`;
const s = (url0, status) => (url, o) => (url === url0 ? sZag(o, [['cf-cache-status', status], ['age', '0']]) : undefined);
const itog = [];
for (const [imya, v] of [
  ['a) главная: EXPIRED (сервер ответил 200)', { pravka: s(`${B}/`, 'EXPIRED') }],
  ['b) главная: REVALIDATED (сервер ответил 304 — не изменилась)', { pravka: s(`${B}/`, 'REVALIDATED') }],
  ['c) robots.txt мимо кэша: EXPIRED (ключ кэша без строки запроса, сервер ответил 200)', { pravka: s(MIMO, 'EXPIRED') }],
  ['d) robots.txt мимо кэша: REVALIDATED (то же, сервер ответил 304)', { pravka: s(MIMO, 'REVALIDATED') }],
]) {
  const r = await progon(v);
  pechat(imya, r);
  itog.push(`${imya.slice(0, 2)} ${r.schet}`);
}
console.log(`\nИТОГ Z5: ${itog.join('; ')}`);
