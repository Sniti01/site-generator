// CL3-P-7: разбор Cache-Control несимметричен. max-age судится по всем вхождениям, и форма, которую регулярка не
// узнала, — отказ («max-age: —»); s-maxage — только первое вхождение и только цифрами без кавычек, неузнанное — проход.
// RFC 7234 §5.2 / RFC 9111 §5.2: аргумент директивы получатель принимает и в форме quoted-string; s-maxage для общего
// кэша (Cloudflare) сильнее max-age.
import { progon, vyvesti, stroka, zamenit, sZag, B } from './obshchee.mjs';

const CC = 'HTML: Cache-Control (max-age=0, must-revalidate)';
const out = [];
for (const cc of [
  'public, max-age=0, must-revalidate, s-maxage="86400"',
  'public, max-age=0, must-revalidate, s-maxage=0, s-maxage=86400',
  'контроль: public, max-age="86400", must-revalidate',
  'контроль: public, max-age=0, must-revalidate, s-maxage=86400',
]) {
  const znach = cc.replace(/^контроль: /, '');
  const r = await progon((k) => {
    for (const u of [`${B}/`, `${B}/movie/`]) zamenit(k, u, (o) => sZag(o, { 'cache-control': znach }));
  });
  out.push(`— Cache-Control: ${cc} —`);
  out.push(`итог инструмента: ${r.itog}; ${stroka(r.najti(CC))}`);
}
vyvesti('p7-s-maxage', out);
