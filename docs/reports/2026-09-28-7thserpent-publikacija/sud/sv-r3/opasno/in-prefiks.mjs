// SV3-O-2: «.in.*» в ветке «прежняя наша выкладка» — любое имя с приставкой, в том числе ПАПКА и чужой файл.
// lftp пишет временный файл по шаблону xfer:temp-file-name (по умолчанию «.in.*.»: `.in.<имя>.`) рядом с файлом,
// то есть в корне — только `.in.<файл верха сборки>.` и только файлом. Сторож пропускает всё с приставкой `.in.`.
import { SV, VERKH, NASH, KOREN_NASH, FIND_NASH, PRIN, mirrorUdalit, vyvod } from './obshchee.mjs';

const { papka } = SV;
const OBRAZCY = [
  ['I1', 'наша выкладка + папка .in.backup/ (чужая резервная копия)', `${KOREN_NASH()}.in.backup/\n`, ['.in.backup/', '.in.backup/db.sql', '.in.backup/site.tar.gz']],
  ['I2', 'наша выкладка + чужой файл .in.wp-config.php. (имя не из верха сборки)', `${KOREN_NASH()}.in.wp-config.php.\n`, ['.in.wp-config.php.']],
  ['I3', 'наша выкладка + папка .in.7dtd.com.pl/ (имя домена за приставкой — не «папка домена»)', `${KOREN_NASH()}.in.7dtd.com.pl/\n`, ['.in.7dtd.com.pl/', '.in.7dtd.com.pl/index.html']],
  ['K1', 'контроль: временный файл lftp .in.robots.txt.', `${KOREN_NASH()}.in.robots.txt.\n`, ['.in.robots.txt.']],
];
// Правка-кандидат: в корне — только файл `.in.<имя>.`, где <имя> — файл верха сборки.
const faylyVerkha = new Set(Object.keys(PRIN.fajly).filter((f) => !f.includes('/')));
const pravka = (z) => /^\.in\.(.+)\.$/.test(z) && faylyVerkha.has(z.slice(4, -1));

const stroki = [];
let opasnyh = 0;
for (const [id, chto, spisok, dop] of OBRAZCY) {
  const p = papka(spisok, NASH, VERKH);
  const server = [...FIND_NASH().split('\n').filter((s) => s && s !== './').map((s) => s.replace(/^\.\//, '')), ...dop];
  const m = mirrorUdalit(server, Object.keys(PRIN.fajly));
  const in_ = spisok.split('\n').map((s) => s.trim()).filter((s) => s.startsWith('.in.'));
  const opasno = p.ok && id !== 'K1';
  if (opasno) opasnyh += 1;
  stroki.push(`${id} ${opasno ? 'ОПАСНЫЙ ПРОХОД' : p.ok ? 'проход' : 'отказ'} — ${chto}`);
  stroki.push(`    papka: ${p.ok ? 'проход' : 'отказ'} | ${p.stroki[0]}`);
  stroki.push(`    модель mirror --delete удалит: ${m.udalit.join(', ') || '—'}; правка-кандидат (только файл .in.<файл верха>.): ${in_.map((z) => `${z} — ${pravka(z) ? 'пропуск' : 'отказ'}`).join('; ')}`);
}
stroki.push(`ИТОГ: образцов ${OBRAZCY.length}, опасных проходов ${opasnyh}`);
vyvod('in-prefiks', stroki);
