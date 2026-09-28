// CL3-Z-4: `sborkaIzDist().puti` — все файлы dist/, и `/.htaccess` среди «путей сборки» для роботов. Файл сервер не
// отдаёт (у соседа и первого сайта — 403, доклад 2026-09-15 «Факты» п. 5); закрыть его роботам — не закрыть сайт.
// Законная форма: блок хостера прячет от роботов служебные файлы с точкой (`Disallow: /.` или `/.*`: .git, .env,
// .htaccess). Инструмент: «поисковики не закрыты» — ПЛОХО «закрыто: googlebot /.htaccess …» (и строгость блока).
// Ясность: при любом закрытии «всего» строка начинает список с /.htaccess — первым идёт не адрес сайта.
import { server, vProcesse, progon, pechat, sborkaInstrumenta, nashRobots } from './stend.mjs';
import { sPravkami } from './pravka.mjs';

const blok = (gruppy) => `# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\n${gruppy}# END adm.tools Managed content\n\n`;
const itog = [];
const P3 = await sPravkami(['z3']);
const P34 = await sPravkami(['z3', 'z4']);
for (const [imya, gruppy] of [
  ['* — /. (служебные файлы с точкой)', 'User-agent: *\nDisallow: /.\n'],
  ['* — /.* ', 'User-agent: *\nDisallow: /.*\n'],
]) {
  const robots = blok(gruppy) + nashRobots;
  const prog = async (mod, sb) => {
    const zakr = vProcesse(server({ robots }));
    const r = await progon({ sborka: sb, mod });
    await zakr();
    return r;
  };
  const r = await prog(undefined, sborkaInstrumenta());
  pechat(`Z4 ${imya} — как есть`, r);
  const r3 = await prog(P3, sborkaInstrumenta(undefined, undefined, P3));
  pechat(`Z4 ${imya} — с правкой z3 (строгость по делу)`, r3);
  const r34 = await prog(P34, sborkaInstrumenta(undefined, undefined, P34));
  pechat(`Z4 ${imya} — с правками z3 + z4 (без служебных файлов в путях)`, r34);
  itog.push(`${imya.trim()}: ${r.schet} → z3 ${r3.schet} → z3+z4 ${r34.schet}`);
}
// Контроль z4: закрытие всего по-прежнему краснеет; список начинается с адреса сайта.
const zakr = vProcesse(server({ robots: blok('User-agent: Googlebot\nDisallow: /\n') + nashRobots }));
const P4 = await sPravkami(['z4']);
const rk = await progon({ sborka: sborkaInstrumenta(undefined, undefined, P4), mod: P4 });
await zakr();
pechat('Z4 контроль: Googlebot — / — с правкой z4', rk);
itog.push(`[контроль] Googlebot закрыт целиком с z4: ${rk.schet}`);
console.log(`ИТОГ: ${itog.join('; ')}`);
