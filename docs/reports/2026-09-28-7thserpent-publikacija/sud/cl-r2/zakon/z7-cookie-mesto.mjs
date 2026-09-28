// CL2-Z-7: в строке «ответы без Set-Cookie» место cookie — адрес без схемы и без канонического хоста: ответ 301
// с http://www… и сама страница по https печатаются одинаково («/max-payne-1/»), 301 с http://www…/ — как «/».
// Владелец ищет cookie не там: страница Apache против правила Cloudflare на редиректе.
import { progon, B, HOST, sZag, struktura } from './stend.mjs';

const igra = struktura.pages.find((p) => p.type === 'game').url;

const kuka = (u0) => (url, o) => (url === u0 ? sZag(o, [['set-cookie', '__cf_bm=abc; path=/; HttpOnly']]) : undefined);
const itog = [];
for (const [imya, u] of [
  ['a) cookie на 301 http://www…/max-payne-1/', `http://${HOST}${igra}`],
  ['b) cookie на самой странице https://www…/max-payne-1/', `${B}${igra}`],
  ['c) cookie на 301 http://www…/', `http://${HOST}/`],
  ['d) cookie на главной https://www…/', `${B}/`],
]) {
  const r = await progon({ pravka: kuka(u) });
  const c = r.proverki.find((x) => x.imya === 'ответы без Set-Cookie');
  console.log(`${imya}: ${c.ok ? 'ok' : 'ПЛОХО'} — ${c.otkuda}`);
  itog.push(`${imya.slice(0, 2)} «${/ставят: ([^—]*)/.exec(c.otkuda)?.[1].trim()}»`);
}
console.log(`\nИТОГ Z7: ${itog.join('; ')}`);
