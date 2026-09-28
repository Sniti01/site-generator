// B3-7: уборка копий (копия модуля kopiya.mjs с SAYT на репозиторий) — нынешняя и мутанты; папки — только здесь.
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, utimesSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const TUT = dirname(fileURLToPath(import.meta.url));
const ish = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/kopiya.mjs', 'utf8');
const zam = (s, a, b) => {
  if (!s.includes(a)) throw new Error(`нет куска: ${a}`);
  return s.replace(a, b);
};
const baza = zam(ish, "export const SAYT = resolve(zdes, '..');", "export const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';");
const varianty = {
  nyne: baza,
  'lyuboy-pid-zhiv': zam(baza, "return e.code === 'EPERM';", 'return true;'),
  'bez-proverki': zam(baza, 'if (processZhiv(p)) continue;', ''),
};
const mod = {};
for (const [k, kod] of Object.entries(varianty)) {
  writeFileSync(join(TUT, `kopiya-${k}.mjs`), kod);
  mod[k] = await import(pathToFileURL(join(TUT, `kopiya-${k}.mjs`)).href);
}
const umershiy = spawnSync(process.execPath, ['-e', '0']).pid;
const METKA = mod.nyne.METKA;
const S = mod.nyne.SAYT;
const sluchai = {
  'метка прежнего вида (пустая) — как в тестах B1-G-10, B2-3': '',
  'метка нового вида, процесс умер (прерванный прогон)': JSON.stringify({ pid: umershiy, sayt: S }),
  'метка нового вида, процесс жив (этот)': JSON.stringify({ pid: process.pid, sayt: S }),
  'метка нового вида, pid строкой': JSON.stringify({ pid: String(umershiy), sayt: S }),
  'метка нового вида, pid 0': JSON.stringify({ pid: 0, sayt: S }),
  'метка нового вида, pid системного процесса 4 (жив, чужой)': JSON.stringify({ pid: 4, sayt: S }),
};
const davno = new Date(Date.now() - 48 * 3600 * 1000);
console.log(`умерший pid ${umershiy}`);
for (const [ime, metka] of Object.entries(sluchai)) {
  const itog = [];
  for (const k of Object.keys(varianty)) {
    const tmp = mkdtempSync(join(TUT, 'u-'));
    const p = join(tmp, 'proverki-x');
    mkdirSync(p);
    writeFileSync(join(p, METKA), `${metka}\n`);
    utimesSync(p, davno, davno);
    const ubrano = mod[k].ubratStaryeKopii({ papka: tmp, starshe: 12 * 3600 * 1000 });
    itog.push(`${k}: ${ubrano.length && !existsSync(p) ? 'убрана' : 'оставлена'}`);
  }
  console.log(`— ${ime}: ${itog.join(' | ')}`);
}
