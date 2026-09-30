// SV25-Z-5 (вне роли «законные формы» — о потере файла владельца): сторож папки сверил файл Google до выкладки и
// напечатал «mirror его не трогает»; если mirror --delete всё же сотрёт его (поведение -x lftp на этом сервере
// не измерено; правка образца или кавычек в workflow), пересчёт после выкладки зелёный — отсутствия файла он не видит,
// потому что файлы образца не считает ни в каком виде. live:check файл подтверждения не проверяет. Потеря тихая.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SV, SAYT, G, STROKA, cls, rabochaya, ubrat, shagPapki, komanda, zapis } from './obshchee-z.mjs';

const S = STROKA();
const out = [];
const d = rabochaya();
try {
  const doVykladki = shagPapki(d, cls([G]), { skachano: { [G]: S } });
  out.push(`до выкладки — сторож папки: код ${doVykladki.kod}`);
  out.push(`    ${doVykladki.vyvod}`);
  const fajlyDist = Object.keys(SV.spisokSborki(join(d, 'dist')).fajly);
  const papkiDist = [...new Set(fajlyDist.filter((f) => f.includes('/')).map((f) => f.split('/')[0]))];
  const findDist = (dop) => ['./', ...papkiDist.map((p) => `./${p}/`), ...fajlyDist.map((f) => `./${f}`), ...dop.map((f) => `./${f}`)].join('\n') + '\n';
  writeFileSync(join(d, 'remote-files-s-google.txt'), findDist([G]));
  writeFileSync(join(d, 'remote-files-bez-google.txt'), findDist([]));
  const est = komanda(['pereschet', join(d, 'remote-files-s-google.txt'), join(d, 'dist')]);
  const net = komanda(['pereschet', join(d, 'remote-files-bez-google.txt'), join(d, 'dist')]);
  out.push(`после выкладки файл Google на месте — пересчёт: код ${est.kod}`);
  out.push(`    ${est.vyvod}`);
  out.push(`после выкладки файла Google НЕТ (mirror стёр) — пересчёт: код ${net.kod}`);
  out.push(`    ${net.vyvod}`);
  out.push(`потеря видна пересчёту: ${net.kod !== 0 ? 'да' : 'нет — код 0, в строке о файле ничего'}`);
} finally {
  ubrat(d);
}
const cl = readFileSync(join(SAYT, 'tools', 'check-live.mjs'), 'utf8');
out.push(`check-live.mjs проверяет файл подтверждения (ищем «google-site-verification» и образец имени): ${/google-site-verification|google\[0-9/.test(cl) ? 'да' : 'нет'}`);
zapis('SV25-Z-5-vyvod.txt', out);
