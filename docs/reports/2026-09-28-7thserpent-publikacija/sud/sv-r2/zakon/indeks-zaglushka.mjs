// SV2-Z: причина отказа `indeks` для заглушки хостера без `</html>` (HTML допускает опускать закрывающий тег; форма
// заглушки «Хостінг Україна» НЕ ИЗМЕРЕНА) и для пустого index.html хостера — на ПЕРВОЙ выкладке «прошлой» нет,
// а с `xfer:use-temp-file yes` наша выкладка обрубка под настоящим именем не оставляет.
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs').href);
for (const [imya, t] of [
  ['заглушка хостера без </html> (HTML допускает)', '<html><head><meta charset=utf-8><title>Сайт створено</title></head><body><h1>Сайт успішно створено</h1></body>'],
  ['заглушка с </html> (контроль)', '<html><head><title>Сайт створено</title></head><body><h1>Сайт успішно створено</h1></body></html>'],
  ['пустой index.html хостера', ''],
]) {
  const r = S.indeks(t);
  console.log(`[${imya}] ${r.ok ? 'проход' : 'отказ'} — ${r.stroki[0]}`);
}
