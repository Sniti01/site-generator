// SV3-O-6: имя CSS после нормализации — sha содержимого, где ВСЕ cid заменены одной звёздочкой. Два CSS одного
// имени, чьё содержимое различается только значениями cid (стили разных компонентов с одинаковым текстом), получают
// одно нормализованное имя — связь «страница → её CSS» стирается. Сборка, где страницы ссылаются на CSS друг друга
// (стили не применяются: cid элементов страницы и cid в её CSS разные), сверку проходит. Сейчас в принятом списке
// такой пары нет (2 CSS с разными именами) — находка латентная: всплывёт, когда такая пара попадёт в принятую сборку.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SV, PRIN, vyvod, sborka, ubrat, obhod } from './obshchee.mjs';

const { spisokSborki, sverkaDist } = SV;
const stranica = (url, css, cid, tekst) => `<!doctype html><html><head><link rel="canonical" href="https://www.7thserpent.com${url}"><link rel="stylesheet" href="/_astro/${css}"></head><body><h2 class="t" data-astro-cid-${cid}>${tekst}</h2></body></html>`;
const PRIN_FAJLY = {
  'index.html': stranica('/', 'Card.AAAAAAAA.css', 'aaaa1111', 'x'),
  'pc/index.html': stranica('/pc/', 'Card.BBBBBBBB.css', 'bbbb2222', 'y'),
  '_astro/Card.AAAAAAAA.css': '.t[data-astro-cid-aaaa1111]{color:#b00;font-weight:700}',
  '_astro/Card.BBBBBBBB.css': '.t[data-astro-cid-bbbb2222]{color:#b00;font-weight:700}',
};
const CI_FAJLY = {
  ...PRIN_FAJLY,
  // Ссылки переставлены: главная берёт CSS страницы pc, pc — CSS главной; сами CSS и элементы — те же.
  'index.html': stranica('/', 'Card.BBBBBBBB.css', 'aaaa1111', 'x'),
  'pc/index.html': stranica('/pc/', 'Card.AAAAAAAA.css', 'bbbb2222', 'y'),
};

// Применяются ли стили: cid элемента страницы есть в селекторах её CSS.
const primenyayutsya = (d, html) => {
  const t = readFileSync(join(d, html), 'utf8');
  const css = /href="\/(_astro\/[^"]+\.css)"/.exec(t)[1];
  const cid = /data-astro-cid-([a-z0-9]+)/.exec(t)[1];
  return readFileSync(join(d, css), 'utf8').includes(`data-astro-cid-${cid}`);
};

const stroki = [];
const a = sborka('css-prin', PRIN_FAJLY);
const b = sborka('css-ci', CI_FAJLY);
const prin = { sborka: 'obrazec', ...spisokSborki(a) };
const r = sverkaDist(b, prin);
const syrye = Object.keys(prin.fajly).filter((f) => spisokSborki(b).fajly[f] !== prin.fajly[f]);
stroki.push(`принятая: стили главной ${primenyayutsya(a, 'index.html') ? 'применяются' : 'НЕ применяются'}, pc — ${primenyayutsya(a, 'pc/index.html') ? 'применяются' : 'НЕ применяются'}; нормализованные имена CSS: ${Object.keys(prin.norm).filter((k) => k.endsWith('.css') || k.includes('.css~')).join(', ')}`);
stroki.push(`сборка CI: стили главной ${primenyayutsya(b, 'index.html') ? 'применяются' : 'НЕ применяются'}, pc — ${primenyayutsya(b, 'pc/index.html') ? 'применяются' : 'НЕ применяются'}; побайтно иные: ${syrye.join(', ')}`);
stroki.push(`sverkaDist: ${r.ok ? 'ПРОХОД — ОПАСНЫЙ' : 'отказ'} | ${r.stroki[0]}`);

// Правка-кандидат: имя CSS — sha содержимого с cid, заменёнными МЕТКАМИ (метки — по HTML, как сейчас); cid,
// которых в HTML нет, — звёздочкой. Тогда два CSS с разными cid получают разные имена, перестановка видна в HTML.
const sha = (x) => createHash('sha256').update(x).digest('hex');
function normPravka(d) {
  const puti = obhod(d).sort();
  const cid = new Map();
  for (const p of puti.filter((x) => x.endsWith('.html'))) for (const m of readFileSync(join(d, p), 'utf8').matchAll(/data-astro-cid-([a-z0-9]+)/g)) if (!cid.has(m[1])) cid.set(m[1], cid.size + 1);
  const metki = (t) => t.replace(/data-astro-cid-([a-z0-9]+)/g, (_, v) => `data-astro-cid-#${cid.get(v) ?? '*'}`);
  const imya = new Map(puti.filter((p) => /^(_astro\/.+)\.[A-Za-z0-9_-]{8}\.css$/.test(p)).map((p) => [p, p.replace(/\.[A-Za-z0-9_-]{8}\.css$/, `.#${sha(metki(readFileSync(join(d, p), 'utf8'))).slice(0, 12)}.css`)]));
  const norm = {};
  for (const p of puti) {
    const t = [...imya].reduce((s, [x, y]) => s.split(x).join(y), readFileSync(join(d, p), 'utf8'));
    norm[imya.get(p) ?? p] = sha(metki(t));
  }
  return norm;
}
const na = normPravka(a);
const nb = normPravka(b);
const ravny = JSON.stringify(Object.entries(na).sort()) === JSON.stringify(Object.entries(nb).sort());
stroki.push(`правка-кандидат (имя CSS по меткам cid): перестановка ссылок — ${ravny ? 'проход (правка не держит)' : 'отказ'}`);
// Законная форма раннера для правки: другие значения cid везде и другие хеши имён CSS — должна пройти.
const runner = Object.fromEntries(Object.entries(PRIN_FAJLY).map(([k, v]) => [k.replace('AAAAAAAA', 'QQQQQQQQ').replace('BBBBBBBB', 'ZZZZZZZZ'), v.split('aaaa1111').join('r7r7r7r7').split('bbbb2222').join('s8s8s8s8').split('AAAAAAAA').join('QQQQQQQQ').split('BBBBBBBB').join('ZZZZZZZZ')]));
const c = sborka('css-runner', runner);
const nc = normPravka(c);
stroki.push(`правка-кандидат: законная сборка раннера (cid и хеши имён другие) — ${JSON.stringify(Object.entries(na).sort()) === JSON.stringify(Object.entries(nc).sort()) ? 'проход' : 'ОТКАЗ (правка ломает законную форму)'}; нынешний сторож на ней — ${sverkaDist(c, prin).ok ? 'проход' : 'отказ'}`);
const paryVPrinyatom = Object.keys(PRIN.norm).filter((k) => k.includes('.css~'));
stroki.push(`в принятом списке (${PRIN.sborka}) пар CSS с одним нормализованным именем: ${paryVPrinyatom.length} — сейчас не срабатывает`);
[a, b, c].forEach(ubrat);
vyvod('css-svyaz', stroki);
