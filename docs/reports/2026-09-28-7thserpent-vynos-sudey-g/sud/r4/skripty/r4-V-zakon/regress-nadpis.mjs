// Регресс V3-8: надпись кнопки — «текст без svg». Видимый текст в svg (<text>) у кнопки призыва и у контурной кнопки
// героя до коммита ловился (txt всей кнопки), после — нет: иконку призыва и svg контурной кнопки не судит никто.
import { readFileSync } from 'node:fs';
import * as posle from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
import * as do_ from './sverka-do.mjs';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const V = posle.vhody(SAYT);
const OB = new Set(['/remake/', '/movie/']);
const url = '/remake/';
const page = V.struktura.pages.find((p) => p.url === url);
const dane = V.soderzhanie.find((s) => s.dane?.url === url).dane;
const html = readFileSync(`${DIST}/remake/index.html`, 'utf8');
const zam = (s, iz, na) => {
  if (!s.includes(iz)) throw new Error('порча не применилась: ' + iz);
  return s.replace(iz, na);
};
const CTA_SVG_KONEC = '<path d="m13 6 6 6-6 6"/></svg></a></div></section></main>';
const SLUCHAI = [
  ['контроль', html],
  ['призыв: видимый <text> в svg кнопки', zam(html, CTA_SVG_KONEC, '<path d="m13 6 6 6-6 6"/><text x="0" y="16">FREE DOWNLOAD</text></svg></a></div></section></main>')],
  ['контурная: svg с видимым <text> в кнопке', zam(html, '>The 2001 original</a>', '>The 2001 original<svg width="120" height="18"><text y="14">— FREE DOWNLOAD</text></svg></a>')],
];
for (const [imya, h] of SLUCHAI) {
  const s = { page, dane, html: h, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB };
  const a = do_.sverkaStranicy({ ...s, ikony: do_.vhody(SAYT).ikony });
  const b = posle.sverkaStranicy(s);
  console.log(`${imya}\n  до 3b78f28: ${a.length ? a.join(' | ') : 'замечаний нет'}\n  после:      ${b.length ? b.join(' | ') : 'замечаний нет'}`);
}
