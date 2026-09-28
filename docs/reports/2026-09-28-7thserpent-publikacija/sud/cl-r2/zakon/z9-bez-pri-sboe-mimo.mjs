// CL2-Z-9: запрос «мимо кэша» получил вызов Cloudflare (или 522), а robots.txt без параметра пришёл здоровым с сервера
// (MISS/EXPIRED/DYNAMIC — это наш файл с блоком хостера). Строка «robots.txt без параметра» сверяет его с неудачным
// ответом мимо кэша и называет причиной «отдаёт не наш сервер»; сам ответ без параметра здоров.
import { progon, pechat, B, METKA, sZag } from './stend.mjs';

const MIMO = `${B}/robots.txt?live-check=${METKA}`;
const BEZ = `${B}/robots.txt`;
const VYZOV = { status: 403, headers: [['server', 'cloudflare'], ['cf-mitigated', 'challenge'], ['content-type', 'text/html']], body: '<html><head><title>Just a moment...</title></head><body></body></html>' };
const itog = [];
for (const [imya, sboy, st] of [
  ['a) мимо кэша — вызов Cloudflare; без параметра — MISS (с сервера)', VYZOV, 'MISS'],
  ['b) мимо кэша — 522; без параметра — EXPIRED (с сервера)', { status: 522, headers: [['server', 'cloudflare']], body: 'error code: 522' }, 'EXPIRED'],
]) {
  const r = await progon({ pravka: (url, o) => (url === MIMO ? sboy : url === BEZ ? sZag(o, [['cf-cache-status', st], ['age', '0']]) : undefined) });
  pechat(imya, r);
  const c = r.proverki.find((x) => x.imya.startsWith('robots.txt без параметра'));
  itog.push(`${imya.slice(0, 2)} «${c.otkuda}»`);
}
console.log(`\nИТОГ Z9: ${itog.join('; ')}`);
