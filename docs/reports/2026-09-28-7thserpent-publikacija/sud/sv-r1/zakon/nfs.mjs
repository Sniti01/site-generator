// Пересчёт после правильной повторной выкладки, когда на сервере остался служебный файл, который lftp mirror
// по умолчанию исключает (mirror:exclude-regex `(^|/)(\.in\.|\.nfs)`) и потому не удаляет при --delete:
// «тихо переименованный» NFS-файл удалённого старого ассета, ещё открытого веб-сервером, или .in.* ProFTPD HiddenStores.
import { pathToFileURL } from 'node:url';
const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const S = await import(pathToFileURL(SAYT + '/tools/storozha-vykladki.mjs').href);
const DIST = SAYT + '/dist';
const fajly = Object.keys(S.spisokSborki(DIST).fajly);
const baza = ['./', ...fajly.map((f) => './' + f)].join('\n') + '\n';
for (const lishniy of ['./_astro/.nfs000000000284a1c200000017', './.in.index.html.']) {
  const r = S.pereschet(baza + lishniy + '\n', DIST);
  console.log(`[${lishniy}] ok=${r.ok}: ${r.stroki.join(' | ')}`);
}
