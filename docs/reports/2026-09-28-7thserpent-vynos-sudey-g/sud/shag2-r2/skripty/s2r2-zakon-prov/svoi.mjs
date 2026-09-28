// Свои члены класса «скрытие предком»: предок ВЫШЕ <main> (между <body> и <main>) — фильтр судьи берёт только <main> и его потомков.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sverkaStranicy, vhody, SAYT } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
import { OBYAZATELNAYA_PODPIS } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/sverka.mjs';

const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const V = vhody(SAYT);
const OB = new Set(OBYAZATELNAYA_PODPIS);
const sud = (url, fh) => {
  const page = V.struktura.pages.find((p) => p.url === url);
  const dane = V.soderzhanie.find((s) => s.dane?.url === url)?.dane;
  const h0 = readFileSync(join(DIST, url.replace(/^\//, ''), 'index.html'), 'utf8');
  const h = fh(h0);
  if (h === h0) return ['ПОРЧА НЕ ПРИМЕНИЛАСЬ'];
  return sverkaStranicy({ page, dane, html: h, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB });
};
const vokrugMain = (otkr, zakr) => (h) => h.replace(/<main id="content">[\s\S]*?<\/main>/, (x) => otkr + x + zakr);
const SLUCHAI = [
  ['<div hidden> вокруг <main>', vokrugMain('<div hidden>', '</div>')],
  ['<div aria-hidden="true"> вокруг <main>', vokrugMain('<div aria-hidden="true">', '</div>')],
  ['<div class="sr-only"> вокруг <main>', vokrugMain('<div class="sr-only">', '</div>')],
  ['<details> вокруг <main>', vokrugMain('<details>', '</details>')],
  ['<dialog> вокруг <main>', vokrugMain('<dialog>', '</dialog>')],
  ['<noscript> вокруг <main>', vokrugMain('<noscript>', '</noscript>')],
];
for (const url of OBYAZATELNAYA_PODPIS) for (const [n, f] of SLUCHAI) {
  const z = sud(url, f);
  console.log(`${url} ${n}: ${z.length ? z.map((y) => y.slice(0, 160)).join(' | ') : '[] МОЛЧИТ'}`);
}
