// Снятость руководств Steam корпуса пачки 5 — по сырому HTML (П94 п. 2): где стоит строка
// «This item has been removed…», скрыт ли её контейнер, есть ли тело руководства и заголовок.
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';

const root = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const manifest = readFileSync(join(root, 'input/corpus/manifest.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const last = new Map();
for (const r of manifest) last.set(r.url, r);
const ids = ['2076733393', '2183808363', '2446297196', '3157068251', '3222877448', '257634803'];
for (const id of ids) {
  const url = 'https://steamcommunity.com/sharedfiles/filedetails/?id=' + id;
  const r = last.get(url);
  if (!r || !r.file) { console.log(id, 'нет в манифесте'); continue; }
  const h = gunzipSync(readFileSync(join(root, 'input/corpus', r.file))).toString('utf8');
  const i = h.indexOf('has been removed');
  const okno = i >= 0 ? h.slice(Math.max(0, i - 900), i + 60).replace(/\s+/g, ' ') : '';
  const skryt = /display:\s*none/.test(okno);
  const titul = (h.match(/<div class="workshopItemTitle">([^<]*)</) || [])[1] ?? '—';
  const telo = (h.match(/class="guideTopDescription"|class="subSectionDesc"/g) || []).length;
  const dataRazm = (h.match(/<div class="detailsStatRight">([^<]*)</g) || []).slice(0, 3).map((m) => m.replace(/<[^>]+>/g, '')).join(' | ');
  console.log(`${id}: заголовок «${titul}»; строка снятия ${i >= 0 ? 'есть' : 'нет'}; display:none рядом ${skryt ? 'да' : 'нет'}; разделов тела ${telo}; ${dataRazm}`);
  if (i >= 0) {
    const m = okno.match(/<div[^>]*(?:id|class)="[^"]*"[^>]*>/g) || [];
    console.log('   контейнеры перед строкой: ' + m.slice(-3).join(' '));
  }
}
