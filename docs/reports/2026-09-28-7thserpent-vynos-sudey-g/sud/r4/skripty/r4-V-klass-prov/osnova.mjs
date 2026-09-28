// Основа проб r4-V-klass-prov: входы сверки из репозитория (только чтение), HTML — из копии сборки 3b78f28.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sverkaStranicy, vhody, SAYT } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';

export const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
export const V = vhody(SAYT);
export const OBYAZ = new Set(['/remake/', '/movie/']);
export const stranica = (url) => ({
  page: V.struktura.pages.find((p) => p.url === url),
  dane: V.soderzhanie.find((s) => s.dane?.url === url)?.dane,
  html: readFileSync(join(DIST, url.slice(1), 'index.html'), 'utf8'),
});
export const sud = (s, html, dane = s.dane) => sverkaStranicy({ page: s.page, dane, html, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OBYAZ });

/** Перечень случаев: { imya, s, porcha(html) → html, zhdem: 'ОТКАЗ' | 'МОЛЧИТ' (что ждём по находке) }. */
export function prognat(zagolovok, sluchai) {
  console.log(`\n### ${zagolovok}`);
  for (const c of sluchai) {
    const h = c.porcha(c.s.html);
    if (h === c.s.html) {
      console.log(`!! порча не применилась: ${c.imya}`);
      continue;
    }
    const z = sud(c.s, h);
    console.log(`${z.length ? 'ОТКАЗ ' : 'МОЛЧИТ'} | ${c.imya}${z.length ? ' | ' + z.join(' || ').slice(0, 220) : ''}`);
  }
}
