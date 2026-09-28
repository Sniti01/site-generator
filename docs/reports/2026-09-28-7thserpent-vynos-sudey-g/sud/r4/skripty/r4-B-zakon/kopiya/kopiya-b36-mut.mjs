/**
 * Копия сайта вне репозитория — для проб схемы и маршрута и для мутаций судей (П102 блок В:
 * «пробы схемы и маршрута — на копии сайта, без правки файлов на месте»).
 *
 * До выноса пробы (`tools/proby-tresci.mjs` пачки 0, разовые пробы пачек 1, 2, 4) ПИСАЛИ файлы
 * сайта на месте и возвращали байты в `finally`: прерванный прогон оставлял подмену, Ctrl+C под
 * `npm run` не доходил до проб, пока шли пробы, репозиторий нельзя было читать (П86 п. 1), а стенды
 * проб (`/404/`, `/pc/`, `/max-payne-3/guide/`) ломались, когда пачка делала их страницей. Копия
 * снимает всё это: проба правит свою копию, прерванный прогон оставляет мусор во временной папке,
 * а не в репозитории.
 *
 * РАСКЛАДКА КОПИИ (во временной папке, вне репозитория — иначе отказ):
 *   <копия>/sites/<сайт>/   — копия `src/`, `public/`, `structure/`, `gates/`, `tools/`, конфигурации
 *                             (`astro.config.mjs`, `package.json`, `tsconfig.json`); `input/corpus` —
 *                             ссылкой-переходом (корпус только читается сторожем 8 слов);
 *                             своя пустая `node_modules` (кеши Vite и Astro копии — свои);
 *   <копия>/core/           — ссылкой на ядро репозитория или копией (`sYadrom`: мутации ядра);
 *   <копия>/node_modules/   — папка ссылок на каждый пакет корневой `node_modules`, кроме
 *                             `@factory/core` — он ведёт на `<копия>/core`.
 * Относительные пути сайта к ядру (`@source` зоны Tailwind, `../../core/gates/run.mjs`) в копии
 * те же, что в репозитории.
 *
 * Ссылок рабочих пространств (`node_modules/<сайт>` → `sites/<сайт>`) в копии нет: сборке они
 * не нужны, а первый сайт — «ни байта» (раунд 1 «судью судят» блока Б, B1-G-10).
 *
 * УДАЛЕНИЕ — ТОЛЬКО `udalitKopiyu` или `ubratStaryeKopii`: обход по `lstat`, ссылка снимается
 * и внутрь неё обход не идёт — цели (ядро, пакеты, корпус) не трогаются. ОПАСНО: Windows
 * PowerShell 5.1 `Remove-Item -Recurse -Force` заходит внутрь перехода и удалит цели — ядро,
 * `node_modules` репозитория и сырой корпус. Прерванный прогон оставляет копию во временной папке;
 * в корне копии — метка `METKA`, по ней `proverki` на старте убирает копии старше 12 часов.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, symlinkSync, unlinkSync, readFileSync, writeFileSync, lstatSync, rmdirSync, realpathSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname, relative, isAbsolute, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const zdes = dirname(fileURLToPath(import.meta.url));
/** Корень сайта и репозитория, от которых снимается копия. */
export const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
export const REPO = resolve(SAYT, '../..');
const IMYA_SAYTA = relative(join(REPO, 'sites'), SAYT);

const KOPIRUETSYA = ['src', 'public', 'structure', 'gates', 'tools', 'astro.config.mjs', 'package.json', 'tsconfig.json'];

/**
 * Путь внутри репозитория? (копия там — отказ: копия не должна жить в дереве, которое судят).
 * `REPO/..x` — внутри: выход наверх — только сегмент «..» целиком (B1-G-9).
 */
const vRepo = (p) => {
  const r = relative(REPO, resolve(p));
  return !(r === '..' || r.startsWith('..' + sep) || r.startsWith('../') || isAbsolute(r));
};

/** Метка корня копии: по ней уборка отличает копию от чужой папки. */
export const METKA = '.kopiya-sayta';
/** Отметка копии, оставленной по `--ostavit`: уборка старых копий её не трогает (B2-4). */
export const OSTAVLENA = '.ostavlena';

const ssylka = (cel, put, spisok) => {
  symlinkSync(cel, put, 'junction');
  spisok.push(put);
};

const lstatIliNull = (p) => {
  try {
    return lstatSync(p);
  } catch {
    return null;
  }
};

/** Снять все ссылки дерева, не заходя в них (их цели не трогаются). */
function snyatSsylki(put) {
  const st = lstatIliNull(put);
  if (!st) return;
  if (st.isSymbolicLink()) unlinkSync(put);
  else if (st.isDirectory()) for (const x of readdirSync(put)) snyatSsylki(join(put, x));
}

/** Удалить дерево без ссылок (снятых первым проходом); `posledniy` — имя в корне, удаляемое последним. */
function udalitDerevo(put, posledniy = null) {
  const st = lstatIliNull(put);
  if (!st) return;
  if (st.isSymbolicLink() || !st.isDirectory()) {
    unlinkSync(put);
    return;
  }
  for (const x of readdirSync(put)) if (x !== posledniy) udalitDerevo(join(put, x));
  if (posledniy) udalitDerevo(join(put, posledniy));
  rmdirSync(put);
}

/**
 * Удалить копию, не заходя в ссылки, в два прохода (раунд 2 блока Б, B2-3): сначала снять ВСЕ ссылки
 * дерева, затем удалить остальное; метка копии — последней, перед корнем. Удаление, сорванное посреди
 * (занятая папка), оставляет остаток без ссылок и с меткой — следующая уборка его видит.
 */
function bezopasnoUdalit(put) {
  snyatSsylki(put);
  udalitDerevo(put, METKA);
}

/**
 * Снять копию в папку `kuda` (её не должно быть или она пуста). `sYadrom` — ядро копией, а не ссылкой.
 * Возвращает `{ koren, sayt, ssylki }`: корень копии, папку сайта в копии, список созданных ссылок.
 * Сбой посреди снятия — частичная копия убирается (сначала ссылки), ошибка идёт дальше.
 */
export function sdelatKopiyu(kuda, { sYadrom = false } = {}) {
  const koren = resolve(kuda);
  if (vRepo(koren)) throw new Error(`копия внутри репозитория — ${koren}: только вне ${REPO}`);
  if (existsSync(koren) && readdirSync(koren).length) throw new Error(`папка копии не пуста: ${koren}`);
  const ssylki = [];
  try {
    mkdirSync(koren, { recursive: true });
    // В метке — процесс, снявший копию: пока он жив, уборка копию не трогает (B3-7).
    writeFileSync(join(koren, METKA), `${JSON.stringify({ pid: process.pid, sayt: SAYT })}\n`);
    const sayt = join(koren, 'sites', IMYA_SAYTA);
    mkdirSync(sayt, { recursive: true });
    for (const x of KOPIRUETSYA) {
      if (existsSync(join(SAYT, x))) cpSync(join(SAYT, x), join(sayt, x), { recursive: true });
    }
    mkdirSync(join(sayt, 'input'), { recursive: true });
    if (existsSync(join(SAYT, 'input/corpus'))) ssylka(join(SAYT, 'input/corpus'), join(sayt, 'input/corpus'), ssylki);
    mkdirSync(join(sayt, 'node_modules'));
    if (sYadrom) cpSync(join(REPO, 'core'), join(koren, 'core'), { recursive: true });
    else ssylka(join(REPO, 'core'), join(koren, 'core'), ssylki);
    const nm = join(koren, 'node_modules');
    mkdirSync(nm);
    for (const x of readdirSync(join(REPO, 'node_modules'))) {
      const iz = join(REPO, 'node_modules', x);
      if (x === '@factory') {
        mkdirSync(join(nm, '@factory'));
        ssylka(join(koren, 'core'), join(nm, '@factory', 'core'), ssylki);
      } else if (x === '.bin' || x === '.package-lock.json' || x === '.cache') continue;
      // Ссылка рабочего пространства (сайт репозитория) — сборке копии не нужна (B1-G-10).
      else if (lstatSync(iz).isSymbolicLink() && vRepo(realpathSync(iz))) continue;
      else ssylka(iz, join(nm, x), ssylki);
    }
    return { koren, sayt, ssylki, sYadrom };
  } catch (e) {
    udalitKopiyu({ koren, ssylki });
    throw e;
  }
}

/** Удалить копию: сначала известные ссылки, затем дерево обходом по `lstat` (в ссылки не заходит). */
export function udalitKopiyu(k) {
  if (vRepo(k.koren)) throw new Error(`отказ удалять папку внутри репозитория: ${k.koren}`);
  for (const s of [...k.ssylki].reverse()) {
    try {
      if (lstatSync(s).isSymbolicLink()) unlinkSync(s);
    } catch {
      // ссылки уже нет
    }
  }
  bezopasnoUdalit(k.koren);
}

/**
 * Убрать копии прерванных прогонов: папки в `papka` (временная папка системы) с меткой `METKA`
 * в корне, изменённые раньше `starshe` мс назад; копии, оставленные по `--ostavit` (отметка
 * `OSTAVLENA`), не трогаются — их удаляет тот, кто оставил (`udalitKopiyu`); копия, чей процесс
 * (pid в метке) жив, — тоже (B3-7; повтор pid чужим процессом оставит мусор, но не удалит живое).
 * Возвращает убранные пути.
 */
export function ubratStaryeKopii({ papka = tmpdir(), starshe = 12 * 3600 * 1000 } = {}) {
  const ubrano = [];
  for (const x of readdirSync(papka)) {
    const p = join(papka, x);
    try {
      if (!lstatSync(p).isDirectory() || !existsSync(join(p, METKA)) || existsSync(join(p, OSTAVLENA)) || vRepo(p)) continue;
      if (Date.now() - statSync(p).mtimeMs < starshe) continue;
      if (processZhiv(p)) continue;
      bezopasnoUdalit(p);
      ubrano.push(p);
    } catch {
      // чужая или занятая папка — пропустить
    }
  }
  return ubrano;
}

/** Жив ли процесс, снявший копию (pid из метки); метки без pid — прежние, процесс считается мёртвым. */
function processZhiv(koren) {
  let pid;
  try {
    pid = JSON.parse(readFileSync(join(koren, METKA), 'utf8')).pid;
  } catch {
    return false;
  }
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

/**
 * Путь записи в копию: внутри `koren` (папка сайта копии или ядро копии) и не сквозь ссылку-переход
 * (ядро, корпус, пакеты — живое дерево репозитория; раунды 2–3 блока Б, B2-7, B3-6). Иначе — отказ.
 */
function putZapisi(koren, put, gde) {
  const p = resolve(koren, put);
  const r = relative(koren, p);
  if (!r || r === '..' || r.startsWith('..' + sep) || r.startsWith('../') || isAbsolute(r)) throw new Error(`запись вне ${gde}: ${put}`);
  let tek = koren;
  for (const chast of r.split(sep)) {
    tek = join(tek, chast);
    if (lstatIliNull(tek)?.isSymbolicLink()) throw new Error(`запись сквозь ссылку-переход копии (${relative(koren, tek)}): ${put} — это живое дерево репозитория`);
  }
  return p;
}

/** Файл копии: прочитать, записать (путь — от папки сайта в копии; запись — только в саму копию). */
export const prochest = (k, put) => readFileSync(join(k.sayt, put), 'utf8');
export const zapisat = (k, put, tekst) => {
  const p = putZapisi(k.sayt, put, 'папки сайта копии');
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, tekst);
};
/** Файл ядра копии (только при `sYadrom`: иначе это ядро репозитория; запись — только внутри ядра копии). */
export const zapisatVYadro = (k, put, tekst) => {
  if (!k.sYadrom) throw new Error('ядро копии — ссылка на ядро репозитория: правка ядра — только в копии с sYadrom');
  writeFileSync(join(k.koren, 'core', put), tekst);
};

/** Бинарник Astro из зависимостей сайта (без npm и без оболочки). */
function astroBin() {
  const req = createRequire(join(SAYT, 'package.json'));
  const pkg = req.resolve('astro/package.json');
  return join(dirname(pkg), JSON.parse(readFileSync(pkg, 'utf8')).bin.astro);
}

/**
 * Сборка копии: `astro build` (только сборка — без гейтов источников; `sGeityami` — сначала
 * гейты ядра, как `npm run build`). Возвращает `{ kod, vyvod }`; код 0 — собралось.
 */
export function sobrat(k, { sGeityami = false } = {}) {
  const env = { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' };
  let vyvod = '';
  if (sGeityami) {
    const g = spawnSync(process.execPath, [join(k.koren, 'core/gates/run.mjs')], { cwd: k.sayt, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
    vyvod += `${g.stdout ?? ''}${g.stderr ?? ''}`;
    if (g.status !== 0) return { kod: g.status, vyvod };
  }
  const r = spawnSync(process.execPath, [astroBin(), 'build'], { cwd: k.sayt, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
  return { kod: r.status, vyvod: vyvod + `${r.stdout ?? ''}\n${r.stderr ?? ''}` };
}
