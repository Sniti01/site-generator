// SV3-O-1: служебные записи хостера не папкой (ссылка `.well-known@`, `cgi-bin@`; файл `.well-known`).
// Сторож папки их пропускает (SV2-Z-8: «ссылки на них — как папки»), пересчёт их не считает, а `-X .well-known/`
// в mirror по документации lftp сверяется только с папкой (к имени папки дописана косая) — ссылку и файл mirror
// --delete удалит. Половина lftp — модель (lftp на машине нет), половина сторожа — настоящая функция f534de5.
import { SV, VERKH, NASH, mirrorUdalit, vyvod, sborka, ubrat, obhod } from './obshchee.mjs';

const { papka, pereschet, SLUZHEBNYE } = SV;
const OBRAZCY = [
  ['S1', 'свежий каталог хостера: .well-known и cgi-bin — ссылками', './\n../\n.well-known@\ncgi-bin@\n', null],
  ['S2', 'прежняя наша выкладка и .well-known@ хостера (проба SV2-Z-8)', './\n../\n.htaccess\n.well-known@\n404/\n_astro/\nindex.html\nprivacy/\nrobots.txt\nsitemap-0.xml\nsitemap-index.xml\n', NASH],
  ['S3', 'свежий каталог: .well-known и cgi-bin — простыми файлами (без отметки типа)', './\n../\n.well-known\ncgi-bin\n', null],
  ['K1', 'контроль: .well-known/ и cgi-bin/ — папками', './\n../\n.well-known/\ncgi-bin/\n', null],
];

const d = sborka('sluzh', {
  'index.html': NASH, '.htaccess': 'x', 'robots.txt': 'x', '404/index.html': 'x', 'privacy/index.html': 'x', 'sitemap-index.xml': 'x', 'sitemap-0.xml': 'x', '_astro/a.css': 'x',
});
const distFajly = obhod(d);
const stroki = [`служебные сторожа: ${SLUZHEBNYE.join(', ')}; исключения mirror в workflow: -X .well-known/ -X cgi-bin/`];
let opasnyh = 0;
for (const [id, chto, spisok, index] of OBRAZCY) {
  const p = papka(spisok, index, VERKH);
  const zapisi = spisok.split('\n').map((s) => s.trim()).filter((s) => s && s !== './' && s !== '../');
  const m = mirrorUdalit(zapisi, distFajly);
  const sluzhUdaleny = m.udalit.filter((z) => SLUZHEBNYE.includes(z.replace(/[/@]$/, '')));
  // Пересчёт после выкладки: на сервере — ровно dist (служебная запись стёрта) — сторож молчит.
  const posle = ['./', ...distFajly.map((f) => `./${f}`), ...zapisi.filter((z) => !m.udalit.includes(z)).map((z) => `./${z.replace(/@$/, '')}`)].join('\n');
  const r = pereschet(posle, d);
  const opasno = p.ok && sluzhUdaleny.length > 0;
  if (opasno) opasnyh += 1;
  stroki.push(`${id} ${opasno ? 'ОПАСНЫЙ ПРОХОД' : p.ok ? 'проход' : 'отказ'} — ${chto}`);
  stroki.push(`    papka: ${p.ok ? 'проход' : 'отказ'} | ${p.stroki[0]}`);
  stroki.push(`    модель mirror: удалит ${m.udalit.join(', ') || '—'}; не тронет ${m.isklyucheno.join(', ') || '—'}; пересчёт после: ${r.ok ? 'проход' : 'отказ'} (${r.stroki[0].slice(0, 70)})`);
}
ubrat(d);
stroki.push(`ИТОГ: образцов ${OBRAZCY.length}, опасных проходов ${opasnyh} (служебная запись, которую сторож пропустил как защищённую, удаляется mirror --delete; пересчёт молчит)`);
vyvod('sluzhebnye-ssylki', stroki);
