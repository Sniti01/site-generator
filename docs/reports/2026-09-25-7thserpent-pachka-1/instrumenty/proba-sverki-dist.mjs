// Пробы сверки dist/ инструмента proby-p1.mjs: копия сборки портится одним местом — сверка обязана
// сказать ПЛОХО (код 1) ИМЕННО своей причиной. Сначала — контрольный прогон неиспорченной копии:
// он обязан дать код 0, иначе «поймана» любая порча («судью судят», раунд 2, R2-MARSHRUT-2).
// Копии — в скретчпаде сессии; репозиторий не трогается.
//   node proba-sverki-dist.mjs
import { cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const SRC = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/dist';
const TOOL = 'D:/SEO/cloud/site-generator/docs/reports/2026-09-25-7thserpent-pachka-1/instrumenty/proby-p1.mjs';
const BASE = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/c00f4415-8064-4efa-8550-0b1a8618a4c3/scratchpad/proba-dist';
const sverka = (d) => spawnSync('node', [TOOL, '--tolko-dist', '--dist', d], { encoding: 'utf8' });

const kontrolD = join(BASE, 'kontrol');
rmSync(kontrolD, { recursive: true, force: true });
cpSync(SRC, kontrolD, { recursive: true });
const k = sverka(kontrolD);
console.log(`${k.status === 0 ? 'ok   ' : 'ПЛОХО'} контроль: неиспорченная копия — код ${k.status}`);
if (k.status !== 0) { console.log(k.stdout); console.log('контроль не прошёл — пробы порчи не судятся'); process.exit(2); }

const kadrMedia = (h, i) => [...h.matchAll(/<div class="foto kadr-ryadu"[\s\S]*?<\/div>/g)][i][0];
const porcha = [
  ['nota-snyata', 'media', (h) => h.replace(/<p class="ft__art-note[^"]*"[^>]*>[\s\S]*?<\/p>/, ''), 'кадры есть, а ноты об арте нет'],
  ['nota-na-pc', 'pc', (h) => h.replace('<div class="ft__legal', '<p class="ft__art-note">Games: Max Payne.</p><div class="ft__legal'), 'кадров нет, а нота об арте есть'],
  ['cta-snyat', 'pc', (h) => h.replace(/<section class="cta"[\s\S]*?<\/section>/, ''), 'призывов 0, ждали 1'],
  ['cta-href', 'games-like-max-payne', (h) => h.replace(/(<section class="cta"[\s\S]*?href=")\/max-payne-1\/(")/, '$1/remake/$2'), 'кнопка призыва ведёт на /remake/'],
  ['cta-ne-posledniy', 'media', (h) => { const s = h.match(/<section class="cta"[\s\S]*?<\/section>/)[0]; return h.replace(s, '').replace(/(<section class="layer)/, s + '$1'); }, 'призыв не последний блок <main>'],
  ['kadr-snyat', 'media', (h) => h.replace(kadrMedia(h, 0), ''), 'кадры страницы ['],
  // раунд 2: третий кадр заменён первым (R2-MARSHRUT-3), нота перенесена в <main> (-4), старый текст (-8)
  ['kadr-podmenyon', 'media', (h) => h.replace(kadrMedia(h, 2), kadrMedia(h, 0)), 'кадры страницы ['],
  ['nota-v-main', 'media', (h) => { const n = h.match(/<p class="ft__art-note[^"]*"[^>]*>[\s\S]*?<\/p>/)[0]; return h.replace(n, '').replace('</main>', `<p>${n.replace(/<[^>]+>/g, '')}</p></main>`); }, 'кадры есть, а ноты об арте нет'],
  ['staryy-tekst', 'pc', (h) => h.replace('Controller support on PC', 'Controller support'), 'в HTML нет заголовка «Controller support on PC»'],
];
let vse = true;
for (const [imya, str, f, prichina] of porcha) {
  const d = join(BASE, imya);
  rmSync(d, { recursive: true, force: true });
  cpSync(SRC, d, { recursive: true });
  const p = join(d, str, 'index.html');
  const h = readFileSync(p, 'utf8');
  let h2;
  try { h2 = f(h); } catch (e) { h2 = h; }
  if (h2 === h) { console.log(`ПЛОХО ${imya}: порча не применилась — проба не судится`); vse = false; continue; }
  writeFileSync(p, h2);
  const r = sverka(d);
  const ok = r.status === 1 && r.stdout.includes(prichina);
  if (!ok) vse = false;
  const stroka = (r.stdout.split('\n').find((l) => /^\s{6}\S/.test(l)) || '').trim();
  console.log(`${ok ? 'ok   ' : 'ПЛОХО'} ${imya}: код ${r.status} — ${stroka}${ok ? '' : ` (ждали причину «${prichina}»)`}`);
}
console.log(vse ? 'сверка dist видит все порчи своей причиной' : 'ЕСТЬ НЕ ПОЙМАННЫЕ ИЛИ ПОЙМАННЫЕ НЕ ТОЙ ПРИЧИНОЙ');
process.exit(vse ? 0 : 1);
