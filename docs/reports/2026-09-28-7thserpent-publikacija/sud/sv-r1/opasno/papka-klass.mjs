// SV1 «опасный проход» — сторожа папки робота и удалённого index.html (коммит e6cd82f, копия storozh.mjs из git show).
// Модель шага workflow «Сторож папки робота и удалённого index.html»:
//   cls -1 -a -F > remote-root.txt
//   mirror --no-recursion --include-glob=index.html . remote-top   (glob lftp чувствителен к регистру;
//      ссылка index.html@ зеркалится ссылкой, её цель на раннере не существует → файла нет)
//   node … papka remote-root.txt remote-top/index.html ; node … indeks remote-top/index.html   (bash -e: первый отказ — стоп)
// Итог шага = papka && indeks. Выкладка идёт, если итог — проход.
import { papka, indeks } from './storozh.mjs';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ZDES = fileURLToPath(new URL('.', import.meta.url));
const AC4BF = '<!doctype html><html><head><title>AC4BF</title><link rel="canonical" href="https://www.ac4bf-thewatch.com/"></head><body></body></html>';
const SEMDTD = '<!doctype html><html><head><link rel="canonical" href="https://7dtd.com.pl/"></head><body></body></html>';
const NASH = '<!doctype html><html><head><link rel="canonical" href="https://www.7thserpent.com/"></head><body></body></html>';
const ZAGL = '<html><head><title>Сайт створено</title></head><body><h1>Сайт успішно створено</h1></body></html>';

// Что скачает mirror --include-glob=index.html: только обычный файл ровно «index.html» (без «@»).
const skachaet = (spisok, soderzhimoe) => (spisok.split('\n').map((s) => s.trim()).includes('index.html') ? soderzhimoe : null);

const OBRAZCY = [
  // [id, что это, вывод cls, содержимое index.html на сервере (что лежит там), ждём: 'отказ' | 'проход']
  ['K1', 'контроль: корень аккаунта с папками доменов', './\n../\n7dtd.com.pl/\nac4bf-thewatch.com/\n7thserpent.com/\n', null, 'отказ'],
  ['K2', 'контроль: папка домена с www/', './\n../\nwww/\n', null, 'отказ'],
  ['K3', 'контроль: корень первого сайта с index.html', './\n../\n.htaccess\n404/\n_astro/\nguides/\nindex.html\nrobots.txt\n', AC4BF, 'отказ'],
  ['K4', 'контроль: корень соседа 7dtd.com.pl с index.html (canonical 7dtd)', './\n../\n_astro/\nindex.html\nrobots.txt\n', SEMDTD, 'отказ'],
  ['K5', 'контроль: пустой корень', './\n../\n', null, 'проход'],
  ['K6', 'контроль: прежняя наша выкладка', './\n../\n.htaccess\n_astro/\nindex.html\nprivacy/\n', NASH, 'проход'],
  ['A1', 'корень первого сайта, где index.html нет, а остальные его файлы есть', './\n../\n.htaccess\n404/\n_astro/\nguides/\nrobots.txt\nsitemap-index.xml\nsitemap-0.xml\n', null, 'отказ'],
  ['A2', 'робот стоит в ac4bf-thewatch.com/www/_astro (ресурсы первого сайта)', './\n../\nBaseLayout.Ab12cd.css\nhero.Xy_1.webp\nbodoni-moda-latin-600-normal.Dg.woff2\n', null, 'отказ'],
  ['A3', 'корень чужого сайта на PHP (index.php, wp-content/)', './\n../\n.htaccess\nindex.php\nwp-admin/\nwp-content/\nwp-includes/\nwp-config.php\n', null, 'отказ'],
  ['A4', 'корень первого сайта, index.html заглавными (Index.html)', './\n../\n_astro/\nIndex.html\nrobots.txt\n', AC4BF, 'отказ'],
  ['A5', 'корень первого сайта, INDEX.HTML', './\n../\n_astro/\nINDEX.HTML\n', AC4BF, 'отказ'],
  ['A6', 'корень чужого сайта с index.htm', './\n../\nimages/\nindex.htm\n', AC4BF, 'отказ'],
  ['A7', 'корень первого сайта, index.html — символьная ссылка (cls -F: index.html@)', './\n../\n_astro/\nguides/\nindex.html@\nrobots.txt\n', AC4BF, 'отказ'],
  ['A8', 'корень аккаунта, тип записей не распознан (без «/»)', './\n../\n7dtd.com.pl\nac4bf-thewatch.com\n7thserpent.com\n', null, 'отказ'],
  ['A9', 'корень аккаунта, папки доменов в Unicode (IDN кириллицей)', './\n../\nзмій.укр/\nсерпент.укр/\n', null, 'отказ'],
  ['A10', 'папка домена, www без «/» (тип не распознан)', './\n../\nwww\n', null, 'отказ'],
];

let opasnyh = 0;
const stroki = [];
for (const [id, chto, spisok, naServere, zhdem] of OBRAZCY) {
  const skachano = skachaet(spisok, naServere);
  const p = papka(spisok, skachano);
  const i = p.ok ? indeks(skachano) : null;
  const itog = p.ok && i.ok ? 'проход' : 'отказ';
  const opasno = itog === 'проход' && zhdem === 'отказ';
  if (opasno) opasnyh += 1;
  stroki.push(`${id} ${opasno ? 'ОПАСНЫЙ ПРОХОД' : itog === zhdem ? 'как надо' : 'иначе'} — ${chto}: papka ${p.ok ? 'проход' : 'отказ'}${i ? `, indeks ${i.ok ? 'проход' : 'отказ'}` : ''} → ${itog} (надо: ${zhdem}) | ${p.stroki[0]}${i ? ' | ' + i.stroki[0] : ''}`);
}

// То же через команду (как зовёт workflow) — A1 и A7: коды возврата.
const d = mkdtempSync(join(tmpdir(), 'sv1-opasno-'));
try {
  const kod = (spisok, index) => {
    writeFileSync(join(d, 'remote-root.txt'), spisok);
    rmSync(join(d, 'remote-top'), { recursive: true, force: true });
    mkdirSync(join(d, 'remote-top'));
    if (index !== null) writeFileSync(join(d, 'remote-top', 'index.html'), index);
    const a = spawnSync(process.execPath, [join(ZDES, 'storozh.mjs'), 'papka', join(d, 'remote-root.txt'), join(d, 'remote-top', 'index.html')], { encoding: 'utf8' });
    const b = spawnSync(process.execPath, [join(ZDES, 'storozh.mjs'), 'indeks', join(d, 'remote-top', 'index.html')], { encoding: 'utf8' });
    return `papka код ${a.status}, indeks код ${b.status}`;
  };
  stroki.push(`команда A1: ${kod(OBRAZCY.find((o) => o[0] === 'A1')[2], null)}`);
  stroki.push(`команда A4: ${kod(OBRAZCY.find((o) => o[0] === 'A4')[2], null)}`);
  stroki.push(`команда A7: ${kod(OBRAZCY.find((o) => o[0] === 'A7')[2], null)}`);
} finally {
  rmSync(d, { recursive: true, force: true });
}

stroki.push(`ИТОГ: образцов ${OBRAZCY.length}, опасных проходов ${opasnyh} (контроли K1–K6 — ${OBRAZCY.filter((o) => o[0].startsWith('K')).length})`);
const vyvod = stroki.join('\n') + '\n';
writeFileSync(join(ZDES, 'papka-klass.txt'), vyvod);
process.stdout.write(vyvod);
