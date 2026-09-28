// Раунд 4, блок Б: B3-7 (pid в метке копии) — сторожат ли тесты kopiya.test.mjs правку в обе стороны.
// Сценарии тестов уборки (B1-G-10, B2-4, B3-7) повторены без sdelatKopiyu: папки и метки — руками, в СВОЕЙ папке
// (ubratStaryeKopii — только с явной papka; системная временная папка не трогается). Плюс новый сценарий:
// копия прерванного прогона НОВОГО вида — метка JSON с pid умершего процесса.
// node b3-7.mjs
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, readdirSync, utimesSync, symlinkSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const ISH = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/kopiya.mjs', 'utf8').replace(
  "export const SAYT = resolve(zdes, '..');",
  "export const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';"
);
function zamena(s, iz, na) {
  if (!s.includes(iz)) throw new Error(`нет куска: ${iz}`);
  return s.replace(iz, na);
}
const varianty = {
  nyne: ISH,
  // Любой pid в метке — «жив»: копии прерванных прогонов нового вида больше никогда не убираются.
  'M-lyuboy-pid-zhiv': zamena(ISH, "return e.code === 'EPERM';", 'return true;'),
  // Проверка живости снята (как до B3-7).
  'M-bez-proverki': zamena(ISH, 'if (processZhiv(p)) continue;', ''),
};
const mod = {};
for (const [k, v] of Object.entries(varianty)) {
  const f = join(ZDES, `kopiya-${k}.mjs`);
  writeFileSync(f, v);
  mod[k] = await import(pathToFileURL(f).href);
}

const davno = new Date(Date.now() - 48 * 3600 * 1000);
const STARSHE = 12 * 3600 * 1000;
const umershiyPid = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' }).stdout.trim();

const scenarii = {
  // kopiya.test.mjs:31 — метка пустая (прежний вид), старая — убирается; чужая и свежая — нет.
  'B1-G-10 уборка (тест, стр. 31)': ({ ubratStaryeKopii, METKA }) => {
    const tmp = mkdtempSync(join(ZDES, 'kopii-'));
    const cel = mkdtempSync(join(ZDES, 'cel-'));
    writeFileSync(join(cel, 'nuzhnyi.txt'), 'цел');
    const staraya = join(tmp, 'proba-staraya');
    mkdirSync(join(staraya, 'node_modules'), { recursive: true });
    writeFileSync(join(staraya, METKA), '');
    symlinkSync(cel, join(staraya, 'node_modules', 'paket'), 'junction');
    const chuzhaya = join(tmp, 'proba-chuzhaya');
    mkdirSync(chuzhaya);
    const svezhaya = join(tmp, 'proba-svezhaya');
    mkdirSync(svezhaya);
    writeFileSync(join(svezhaya, METKA), '');
    for (const p of [staraya, chuzhaya]) utimesSync(p, davno, davno);
    const ubrano = ubratStaryeKopii({ papka: tmp, starshe: STARSHE }).map((p) => relative(tmp, p));
    return JSON.stringify(ubrano) === '["proba-staraya"]' && JSON.stringify(readdirSync(tmp).sort()) === '["proba-chuzhaya","proba-svezhaya"]' && existsSync(join(cel, 'nuzhnyi.txt'));
  },
  // kopiya.test.mjs:77
  'B2-4 оставленная (тест, стр. 77)': ({ ubratStaryeKopii, METKA, OSTAVLENA }) => {
    const tmp = mkdtempSync(join(ZDES, 'kopii-'));
    const o = join(tmp, 'proverki-ostavlena');
    mkdirSync(o);
    writeFileSync(join(o, METKA), '');
    writeFileSync(join(o, OSTAVLENA), '');
    utimesSync(o, davno, davno);
    return ubratStaryeKopii({ papka: tmp, starshe: STARSHE }).length === 0 && existsSync(o);
  },
  // kopiya.test.mjs:113 — метка, как её пишет sdelatKopiyu: pid живого (этого) процесса.
  'B3-7 живой процесс (тест, стр. 113)': ({ ubratStaryeKopii, METKA, SAYT }) => {
    const tmp = mkdtempSync(join(ZDES, 'kopii-'));
    const k = join(tmp, 'proverki-zhivaya');
    mkdirSync(k);
    writeFileSync(join(k, METKA), `${JSON.stringify({ pid: process.pid, sayt: SAYT })}\n`);
    utimesSync(k, davno, davno);
    return ubratStaryeKopii({ papka: tmp, starshe: STARSHE }).length === 0 && existsSync(join(k, METKA));
  },
  // НОВЫЙ: копия прерванного прогона нынешнего вида — pid умершего процесса; её уборка и есть назначение ubratStaryeKopii.
  'НОВЫЙ: метка нового вида, процесс умер': ({ ubratStaryeKopii, METKA, SAYT }) => {
    const tmp = mkdtempSync(join(ZDES, 'kopii-'));
    const k = join(tmp, 'proverki-prervannaya');
    mkdirSync(k);
    writeFileSync(join(k, METKA), `${JSON.stringify({ pid: Number(umershiyPid), sayt: SAYT })}\n`);
    utimesSync(k, davno, davno);
    return ubratStaryeKopii({ papka: tmp, starshe: STARSHE }).length === 1 && !existsSync(k);
  },
};
console.log(`pid умершего процесса: ${umershiyPid}`);
for (const [v, m] of Object.entries(mod)) {
  const itog = Object.entries(scenarii).map(([imya, f]) => `${f(m) ? 'зелёный' : 'КРАСНЫЙ'} — ${imya}`);
  console.log(`${v}:\n  ${itog.join('\n  ')}`);
}
