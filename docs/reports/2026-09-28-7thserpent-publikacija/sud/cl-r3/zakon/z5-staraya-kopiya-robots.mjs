// CL3-Z-5: выкладка правит строку-директиву public/robots.txt (прецедент первого сайта — строка Sitemap с голого
// хоста на www, П62 п. 4 / доклад 2026-09-15 §6). Cloudflare держит robots.txt в кэше 4 ч (max-age=14400, там же
// «Факты» п. 7) — ответ без параметра (HIT) — прежняя редакция НАШЕГО файла. Вреда нет: ничего не закрыто,
// чужих групп нет; прежний Sitemap ведёт через 301 на тот же индекс. Workflow с SERPENT_LIVE=on зовёт live:check
// сразу после выкладки — раунд 2 судит копию «тем же содержанием», строка прежней редакции — «чужой текст».
import { server, vProcesse, progon, pechat, sborkaInstrumenta, nashRobots, HOSTER } from './stend.mjs';
import { sPravkami } from './pravka.mjs';

const CLOUDFLARE = '# BEGIN Cloudflare Managed content\nUser-agent: *\nContent-Signal: search=yes,ai-train=no\nAllow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n# END Cloudflare Managed Content\n\n';
const OBRAZCY = [
  ['прежний Sitemap (голый хост)', HOSTER + nashRobots.replace('Sitemap: https://www.7thserpent.com/sitemap-index.xml', 'Sitemap: https://7thserpent.com/sitemap-index.xml')],
  ['прежняя редакция с «Allow: /_astro/», убранной правкой', HOSTER + nashRobots.replace('Allow: /\n', 'Allow: /\nAllow: /_astro/\n')],
  ['прежняя редакция с пустым «Disallow:»', HOSTER + nashRobots.replace('Allow: /\n', 'Disallow:\n')],
  // Контроль: то, что у раунда 2 справка, — копия без Sitemap; и то, что должно краснеть и с правкой.
  ['[контроль] прежняя редакция без Sitemap (у раунда 2 — справка)', HOSTER + nashRobots.replace(/\nSitemap: .*\n/, '\n')],
  ['[контроль-вред] копия с блоком Cloudflare (CL2-P-4a)', CLOUDFLARE + HOSTER + nashRobots],
  ['[контроль-вред] копия с группой GPTBot вне блоков (CL2-P-4b)', 'User-agent: GPTBot\nDisallow: /\n\n' + HOSTER + nashRobots],
  ['[контроль-вред] копия с Disallow: /movie/', HOSTER + nashRobots.replace('Allow: /\n', 'Allow: /\nDisallow: /movie/\n')],
  ['[контроль-вред] копия с Sitemap чужого хоста', HOSTER + nashRobots.replace('https://www.7thserpent.com/sitemap-index.xml', 'https://spam.example/sitemap.xml')],
];
const P = await sPravkami(['z5']);
const itog = [];
for (const [imya, robotsBez] of OBRAZCY) {
  const s = server({ robotsBez, pravka: (u, o) => (u.endsWith('/robots.txt') ? { ...o, headers: [...o.headers.filter(([k]) => k !== 'age'), ['age', '9120']] } : null) });
  let zakr = vProcesse(s);
  const r = await progon({ sborka: sborkaInstrumenta() });
  await zakr();
  pechat(`Z5 без параметра (HIT, Age 9120) — ${imya}`, r);
  zakr = vProcesse(s);
  const rp = await progon({ sborka: sborkaInstrumenta(), mod: P });
  await zakr();
  pechat(`Z5 — ${imya} — с правкой z5`, rp);
  const spr = rp.spravki.find((x) => x.includes('это кэш Cloudflare'));
  if (spr) console.log(`  справка: ${spr}`);
  itog.push(`${imya}: ${r.schet} → ${rp.schet}`);
}
console.log(`ИТОГ: ${itog.join('; ')}`);
