// SV2-Z: ключи `norm` при совпадении нормализованных имён CSS (`_astro/index.#.css` дважды — обычная форма Astro:
// у каждой страницы-индекса свой чанк `index.<хеш>.css`). Второй ключ — `норм#сырой путь`, в нём ХЕШ ИМЕНИ, который
// на раннере другой; порядок пары в нормализации — по сырому пути, т. е. по тому же хешу. Модель — как проба SV1-Z-1
// сторожа (kakNaRannere): сборка «на раннере» отличается только значениями cid ядра и хешами имён CSS.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/2a2fa1b5-b706-4952-b80c-ce6acb0f1174/scratchpad/sud/sv-r2/zakon';
const S = await import(pathToFileURL('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs').href);

const YADRO_A = 'm3tnyskv'; // cid компонента ядра в первом CSS
const YADRO_B = 'd6goylod'; // cid другого компонента ядра во втором CSS
const RANNER = { m3tnyskv: '545q7pxz', d6goylod: 'ohwvoupt' }; // те же компоненты на раннере (sud/sv-r1/zakon/cid2.mjs)

function sborka(imyaA, imyaB) {
  const d = mkdtempSync(join(ZDES, 'dist-'));
  const html = (css) => `<!doctype html><html><head><link rel="canonical" href="https://www.7thserpent.com/"><link rel="stylesheet" href="/_astro/${css}"></head><body><p data-astro-cid-${YADRO_A}>a</p><p data-astro-cid-${YADRO_B}>b</p></body></html>`;
  const f = {
    'index.html': html(imyaA),
    'privacy/index.html': html(imyaB),
    [`_astro/${imyaA}`]: `.a[data-astro-cid-${YADRO_A}]{color:red}`,
    [`_astro/${imyaB}`]: `.b[data-astro-cid-${YADRO_B}]{color:blue}`,
  };
  for (const [p, t] of Object.entries(f)) {
    mkdirSync(join(d, p, '..'), { recursive: true });
    writeFileSync(join(d, p), t);
  }
  return d;
}
function naRannere(d, iz, na) {
  for (const p of ['index.html', 'privacy/index.html', `_astro/${iz[0]}`, `_astro/${iz[1]}`]) {
    let t = readFileSync(join(d, p), 'utf8');
    for (const [a, b] of Object.entries(RANNER)) t = t.split(a).join(b);
    for (let i = 0; i < 2; i += 1) t = t.split(iz[i]).join(na[i]);
    writeFileSync(join(d, p), t);
  }
  for (let i = 0; i < 2; i += 1) renameSync(join(d, '_astro', iz[i]), join(d, '_astro', na[i]));
}

for (const [imya, iz, na] of [
  ['порядок пары тот же (A < B и на раннере)', ['index.AAAAAAAA.css', 'index.BBBBBBBB.css'], ['index.CCCCCCCC.css', 'index.DDDDDDDD.css']],
  ['порядок пары перевернулся (хеш на раннере)', ['index.AAAAAAAA.css', 'index.BBBBBBBB.css'], ['index.ZZZZZZZZ.css', 'index.CCCCCCCC.css']],
  ['контроль: имена CSS разные (CtaBand и index)', ['CtaBand.AAAAAAAA.css', 'index.BBBBBBBB.css'], ['CtaBand.CCCCCCCC.css', 'index.DDDDDDDD.css']],
]) {
  const d = sborka(...iz);
  try {
    const prin = { sborka: 'win', ...S.spisokSborki(d) };
    naRannere(d, iz, na);
    const r = S.sverkaDist(d, prin);
    console.log(`[${imya}] ключи norm принятой: ${Object.keys(prin.norm).filter((k) => k.startsWith('_astro/')).join(', ')} → сверка ${r.ok ? 'ПРОХОД' : 'ОТКАЗ'}: ${r.stroki[0]}`);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
}
