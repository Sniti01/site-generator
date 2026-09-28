// CL3-Z-3: блок хостера с группой `*` (или Googlebot/Bingbot), запрещающей служебные пути, которых на сайте нет
// (/cgi-bin/ — его кладёт сам хостер в свежий каталог, SV1-O-1; /.well-known/, /wp-admin/, /*?). Ни один путь
// сборки не закрыт (Google и Bing сливают группы `*` — наш Allow: / и их Disallow: /cgi-bin/ живут вместе).
// Инструмент (строгость CL2-P-1): «вне нашего файла — только блок хостера» — ПЛОХО, «запрещать нечего».
import { server, vProcesse, progon, pechat, sborkaInstrumenta, nashRobots } from './stend.mjs';
import { sPravkami } from './pravka.mjs';

const blok = (gruppy) => `# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n\n${gruppy}# END adm.tools Managed content\n\n`;
const OBRAZCY = [
  ['* — /cgi-bin/', 'User-agent: *\nDisallow: /cgi-bin/\n'],
  ['* — /.well-known/ и /wp-admin/', 'User-agent: *\nDisallow: /.well-known/\nDisallow: /wp-admin/\n'],
  ['* — адреса с параметром /*?', 'User-agent: *\nDisallow: /*?\n'],
  ['Googlebot — /cgi-bin/ (Crawl-delay не рвёт)', 'User-agent: Googlebot\nCrawl-delay: 2\nDisallow: /cgi-bin/\n'],
];
// Контроль правки: то, что должно краснеть и дальше.
const KONTROL = [
  ['* — /movie/ (путь сборки) — должно краснеть', 'User-agent: *\nDisallow: /movie/\n'],
  ['* — /*.css$ — должно краснеть', 'User-agent: *\nDisallow: /*.css$\n'],
  ['msnbot — / — должно краснеть', 'User-agent: msnbot\nDisallow: /\n'],
  ['Googlebot-Image — / — должно краснеть', 'User-agent: Googlebot-Image\nDisallow: /\n'],
];

const sborka = sborkaInstrumenta();
const P = await sPravkami(['z3']);
const itog = [];
for (const [imya, gruppy, kontrol] of [...OBRAZCY, ...KONTROL.map((k) => [...k, true])]) {
  const robots = blok(gruppy) + nashRobots;
  let zakr = vProcesse(server({ robots }));
  const r = await progon({ sborka });
  await zakr();
  pechat(`Z3 ${imya} — как есть`, r);
  zakr = vProcesse(server({ robots }));
  const rp = await progon({ sborka, mod: P });
  await zakr();
  pechat(`Z3 ${imya} — с правкой z3`, rp);
  const spr = rp.spravki.find((s) => s.includes('вне сборки'));
  if (spr) console.log(`  справка: ${spr}`);
  itog.push(`${kontrol ? '[контроль] ' : ''}${imya}: ${r.schet} → ${rp.schet}`);
}
console.log(`ИТОГ: ${itog.join('; ')}`);
