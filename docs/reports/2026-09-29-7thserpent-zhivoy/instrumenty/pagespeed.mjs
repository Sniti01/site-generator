// PageSpeed Insights по живому сайту (сессия 24, П111 «Как прочитано» п. 8): API v5 runPagespeed без ключа, три
// страницы × mobile и desktop = шесть запусков, по одному, без повторов. Каждый ответ — JSON без снимков экрана (каждая
// строка data:image/… заменена пометкой) в pagespeed/<страница>-<режим>.json рядом с этим файлом; итог — svodka.json:
// четыре оценки, LCP, CLS, TBT (и FCP, Speed Index — справкой), полевые данные (loadingExperience,
// originLoadingExperience), предупреждения прогона, аудиты с оценкой ниже 0,9. Ответ 429 (квота) — стоп: следующие
// запуски не делаются (П111: отказ квоты — стоп по пункту). Иная ошибка — строкой, запуск не повторяется.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PAPKA = join(dirname(fileURLToPath(import.meta.url)), 'pagespeed');
mkdirSync(PAPKA, { recursive: true });
const STRANICY = [
  ['glavnaya', 'https://www.7thserpent.com/'],
  ['max-payne-2', 'https://www.7thserpent.com/max-payne-2/'],
  ['max-payne-3-guide', 'https://www.7thserpent.com/max-payne-3/guide/'],
];
const REZHIMY = ['MOBILE', 'DESKTOP'];
const KATEGORII = ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'];

const bezSnimkov = (x) => {
  if (typeof x === 'string') return x.startsWith('data:image/') ? `[снимок экрана снят: ${x.length} знаков]` : x;
  if (Array.isArray(x)) return x.map(bezSnimkov);
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, bezSnimkov(v)]));
  return x;
};
const pole = (le) =>
  le?.metrics
    ? { overall_category: le.overall_category ?? null, origin_fallback: le.origin_fallback ?? false, metrics: Object.fromEntries(Object.entries(le.metrics).map(([k, v]) => [k, { percentile: v.percentile, category: v.category }])) }
    : null;

const svodka = [];
for (const [imya, url] of STRANICY) {
  for (const rezhim of REZHIMY) {
    const zapros = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${rezhim}&locale=en${KATEGORII.map((c) => `&category=${c}`).join('')}`;
    const nachalo = new Date().toISOString();
    let r;
    let telo;
    try {
      r = await fetch(zapros, { signal: AbortSignal.timeout(180000) });
      telo = await r.text();
    } catch (e) {
      svodka.push({ imya, url, rezhim, nachalo, oshibka: `сеть: ${e.cause?.code ?? e.name}` });
      console.log(`${imya} ${rezhim}: сеть — ${e.cause?.code ?? e.name}`);
      continue;
    }
    if (!r.ok) {
      svodka.push({ imya, url, rezhim, nachalo, oshibka: `${r.status}: ${telo.slice(0, 400)}` });
      console.log(`${imya} ${rezhim}: ответ ${r.status} — ${telo.slice(0, 300).replace(/\s+/g, ' ')}`);
      if (r.status === 429) {
        console.log('отказ квоты — стоп по пункту (П111): следующие запуски не делаются');
        writeFileSync(join(PAPKA, 'svodka.json'), JSON.stringify(svodka, null, 2) + '\n');
        process.exit(3);
      }
      continue;
    }
    const j = JSON.parse(telo);
    const fajl = `${imya}-${rezhim.toLowerCase()}.json`;
    writeFileSync(join(PAPKA, fajl), JSON.stringify(bezSnimkov(j), null, 1) + '\n');
    const lh = j.lighthouseResult;
    const a = lh.audits;
    const ocenka = (k) => (lh.categories[k]?.score == null ? null : Math.round(lh.categories[k].score * 100));
    const nizkie = Object.values(a)
      .filter((x) => typeof x.score === 'number' && x.score < 0.9 && !['notApplicable', 'manual', 'informative'].includes(x.scoreDisplayMode))
      .map((x) => ({ id: x.id, score: x.score, title: x.title, displayValue: x.displayValue ?? '' }));
    const s = {
      imya,
      url,
      rezhim,
      nachalo,
      fajl: `pagespeed/${fajl}`,
      lighthouseVersion: lh.lighthouseVersion,
      fetchTime: lh.fetchTime,
      finalUrl: lh.finalDisplayedUrl ?? lh.finalUrl,
      runWarnings: lh.runWarnings,
      ocenki: { performance: ocenka('performance'), accessibility: ocenka('accessibility'), 'best-practices': ocenka('best-practices'), seo: ocenka('seo') },
      LCP: { ms: a['largest-contentful-paint']?.numericValue, vid: a['largest-contentful-paint']?.displayValue },
      CLS: { znachenie: a['cumulative-layout-shift']?.numericValue, vid: a['cumulative-layout-shift']?.displayValue },
      TBT: { ms: a['total-blocking-time']?.numericValue, vid: a['total-blocking-time']?.displayValue },
      FCP: a['first-contentful-paint']?.displayValue,
      SI: a['speed-index']?.displayValue,
      poleStranicy: pole(j.loadingExperience),
      poleSayta: pole(j.originLoadingExperience),
      nizkie,
    };
    svodka.push(s);
    console.log(`${imya} ${rezhim}: ${JSON.stringify(s.ocenki)} LCP ${s.LCP.vid} CLS ${s.CLS.vid} TBT ${s.TBT.vid}; поле страницы ${s.poleStranicy ? 'есть' : 'нет'}, сайта ${s.poleSayta ? 'есть' : 'нет'}; ниже 0,9 — ${nizkie.length}`);
  }
}
writeFileSync(join(PAPKA, 'svodka.json'), JSON.stringify(svodka, null, 2) + '\n');
