// Ясность строк отказа на законных (или безвредных) формах входа: что прочтёт владелец в журнале.
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs').href);

const iz = (karta) => async (url) => karta[url];
// 1. Временная ошибка DNS раннера (EAI_AGAIN) или таймаут при несуществующих записях — строка «домен уже отвечает».
for (const kod of ['EAI_AGAIN', 'TimeoutError']) {
  const r = await S.domen({ poluchit: iz({ 'https://www.7thserpent.com/': { oshibka: kod }, 'https://7thserpent.com/': { oshibka: 'ENOTFOUND' } }), pervyi: true });
  console.log(`[домен, ${kod}] ok=${r.ok}: ${r.stroki.join(' | ')}`);
}
// 2. Файл-ссылка в корне (cls -F печатает «@» и у ссылки на ФАЙЛ) — строка «папки с именами доменов».
for (const spisok of ['./\n../\nindex.html@\n', './\n../\nrobots.txt@\nindex.html\n']) {
  const r = S.papka(spisok, '<link rel="canonical" href="https://www.7thserpent.com/">');
  console.log(`[папка, ${JSON.stringify(spisok)}] ok=${r.ok}: ${r.stroki.join(' | ')}`);
}
// 3. Пустой (оборванный прошлой выкладкой) index.html — строка советует удалить «заглушку хостера».
const r3 = S.indeks('');
console.log(`[indeks, пустой файл] ok=${r3.ok}: ${r3.stroki.join(' | ')}`);
