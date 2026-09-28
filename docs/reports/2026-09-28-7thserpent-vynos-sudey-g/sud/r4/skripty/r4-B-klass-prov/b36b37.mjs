// B3-6, B3-7: свои члены классов на настоящем модуле kopiya.mjs; всё — в своей папке (копия не снимается, k собрана вручную).
import { mkdirSync, rmSync, writeFileSync, existsSync, symlinkSync, readdirSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { zapisatVYadro, zapisat, ubratStaryeKopii, METKA } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/kopiya.mjs';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-B-klass-prov/b36';
rmSync(PAPKA, { recursive: true, force: true });
const koren = join(PAPKA, 'kopiya');
mkdirSync(join(koren, 'core', 'sub'), { recursive: true });
mkdirSync(join(koren, 'sites', 's'), { recursive: true });
mkdirSync(join(PAPKA, 'cel'), { recursive: true });
mkdirSync(join(koren, 'node_modules'), { recursive: true });
symlinkSync(join(PAPKA, 'cel'), join(koren, 'node_modules', 'pkg'), 'junction');
symlinkSync(join(PAPKA, 'cel'), join(koren, 'core', 'sub', 'per'), 'junction'); // переход внутри ядра копии — чтобы проверить охрану сегментов
const k = { koren, sayt: join(koren, 'sites', 's'), ssylki: [], sYadrom: true };

const gde = () => {
  const out = [];
  const obhod = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) obhod(join(d, e.name));
      else out.push(join(d, e.name).slice(PAPKA.length + 1).replace(/\\/g, '/'));
    }
  };
  obhod(PAPKA);
  return out;
};
const probovat = (imya, fn) => {
  const do_ = new Set(gde());
  let itog;
  try {
    fn();
    itog = 'записано';
  } catch (e) {
    itog = 'отказ: ' + e.message.slice(0, 90);
  }
  const novye = gde().filter((f) => !do_.has(f));
  console.log(`${imya}: ${itog}; новые файлы: ${JSON.stringify(novye)}; в цели перехода: ${JSON.stringify(readdirSync(join(PAPKA, 'cel')))}`);
};
// B3-6: свои члены — сегмент с пробелом или точками в конце (Win32 срезает хвост последнего сегмента), 8.3-имя, поток NTFS.
probovat('ядро: «.. /node_modules/pkg/x.txt»', () => zapisatVYadro(k, '.. /node_modules/pkg/x.txt', 'x'));
probovat('ядро: «../node_modules/pkg/x.txt» (контроль)', () => zapisatVYadro(k, '../node_modules/pkg/x.txt', 'x'));
probovat('ядро: «... /x.txt»', () => zapisatVYadro(k, '... /x.txt', 'x'));
probovat('ядро: «sub/per./x.txt» (точка в конце сегмента-перехода)', () => zapisatVYadro(k, 'sub/per./x.txt', 'x'));
probovat('ядро: «sub/per /x.txt» (пробел в конце сегмента-перехода)', () => zapisatVYadro(k, 'sub/per /x.txt', 'x'));
probovat('ядро: «sub/per» (контроль)', () => zapisatVYadro(k, 'sub/per/x.txt', 'x'));
probovat('ядро: «sub/per::$DATA» (поток по имени перехода)', () => zapisatVYadro(k, 'sub/per::$DATA', 'x'));
probovat('сайт: «../../node_modules/pkg./x.txt»', () => zapisat(k, '../../node_modules/pkg./x.txt', 'x'));
probovat('сайт: «../../node_modules/pkg/x.txt» (контроль)', () => zapisat(k, '../../node_modules/pkg/x.txt', 'x'));

// B3-7: свои члены — старая копия живого процесса-соседа (не того, кто убирает); pid строкой; метка битая; pid мёртвого.
const P7 = join(PAPKA, 'b37');
mkdirSync(P7, { recursive: true });
const sosed = spawnSync(process.execPath, ['-e', 'console.log(process.pid)'], { encoding: 'utf8' });
const mertvyPid = Number(sosed.stdout.trim());
const kopiya7 = (imya, metka) => {
  const d = join(P7, imya);
  mkdirSync(join(d, 'x'), { recursive: true });
  writeFileSync(join(d, METKA), metka);
  const staroe = new Date(Date.now() - 13 * 3600 * 1000);
  utimesSync(d, staroe, staroe);
  return d;
};
kopiya7('zhivoy-roditel', JSON.stringify({ pid: process.ppid }));
kopiya7('zhivoy-sam', JSON.stringify({ pid: process.pid }));
kopiya7('mertvyy', JSON.stringify({ pid: mertvyPid }));
kopiya7('pid-strokoy', JSON.stringify({ pid: String(process.pid) }));
kopiya7('bitaya', '{"pid":');
kopiya7('pid-4-sistemnyy', JSON.stringify({ pid: 4 }));
const ubrano = ubratStaryeKopii({ papka: P7 }).map((p) => p.slice(P7.length + 1));
console.log(`B3-7: убрано ${JSON.stringify(ubrano)}; осталось ${JSON.stringify(readdirSync(P7))}`);
