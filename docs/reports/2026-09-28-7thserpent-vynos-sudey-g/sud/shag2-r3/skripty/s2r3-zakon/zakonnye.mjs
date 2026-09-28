// Законное завтра на странице списка: кадр героя — ключевой арт (обёртка «geroy» без geroy--stal) и без artFocus (без style).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const S = await import(pathToFileURL(join(REPO, 'tools/sverka.mjs')).href);
const { OBYAZATELNAYA_PODPIS } = await import(pathToFileURL(join(REPO, 'gates/sverka.mjs')).href);
const V = S.vhody(REPO);
const klon = (o) => JSON.parse(JSON.stringify(o));
const kratko = (z) => (z.length ? z.join(' | ').slice(0, 300) : '[] без замечаний');
for (const url of OBYAZATELNAYA_PODPIS) {
  const page = V.struktura.pages.find((p) => p.url === url);
  const dane = klon(V.soderzhanie.find((s) => s.dane?.url === url).dane);
  const html = readFileSync(join(REF, url.slice(1), 'index.html'), 'utf8');
  const kredity = klon(V.kredity);
  kredity[dane.art].kind = 'key art';
  delete dane.artFocus;
  const h = html.replace(/<div class="geroy geroy--stal" style="[^"]*"/, '<div class="geroy"');
  if (h === html) throw new Error(`${url}: порча не применилась`);
  console.log(`${url} ключевой арт, без artFocus: ${kratko(S.sverkaStranicy({ page, dane, html: h, kredity, ikony: V.ikony, obyazatelnaPodpis: new Set(OBYAZATELNAYA_PODPIS) }))}`);
}
