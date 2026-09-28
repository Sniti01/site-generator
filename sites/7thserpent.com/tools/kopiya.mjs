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
 * УДАЛЕНИЕ: сначала снимаются ссылки (их цели не трогаются), затем папка копии.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, symlinkSync, unlinkSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const zdes = dirname(fileURLToPath(import.meta.url));
/** Корень сайта и репозитория, от которых снимается копия. */
export const SAYT = resolve(zdes, '..');
export const REPO = resolve(SAYT, '../..');
const IMYA_SAYTA = relative(join(REPO, 'sites'), SAYT);

const KOPIRUETSYA = ['src', 'public', 'structure', 'gates', 'tools', 'astro.config.mjs', 'package.json', 'tsconfig.json'];

/** Путь внутри репозитория? (копия там — отказ: копия не должна жить в дереве, которое судят). */
const vRepo = (p) => {
  const r = relative(REPO, resolve(p));
  return !r.startsWith('..') && !isAbsolute(r);
};

const ssylka = (cel, put, spisok) => {
  symlinkSync(cel, put, 'junction');
  spisok.push(put);
};

/**
 * Снять копию в папку `kuda` (её не должно быть или она пуста). `sYadrom` — ядро копией, а не ссылкой.
 * Возвращает `{ koren, sayt, ssylki }`: корень копии, папку сайта в копии, список созданных ссылок.
 */
export function sdelatKopiyu(kuda, { sYadrom = false } = {}) {
  const koren = resolve(kuda);
  if (vRepo(koren)) throw new Error(`копия внутри репозитория — ${koren}: только вне ${REPO}`);
  if (existsSync(koren) && readdirSync(koren).length) throw new Error(`папка копии не пуста: ${koren}`);
  const ssylki = [];
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
    if (x === '@factory') {
      mkdirSync(join(nm, '@factory'));
      ssylka(join(koren, 'core'), join(nm, '@factory', 'core'), ssylki);
    } else if (x === '.bin' || x === '.package-lock.json' || x === '.cache') continue;
    else ssylka(join(REPO, 'node_modules', x), join(nm, x), ssylki);
  }
  return { koren, sayt, ssylki, sYadrom };
}

/** Удалить копию: сначала ссылки (их цели целы), затем папку. */
export function udalitKopiyu(k) {
  if (vRepo(k.koren)) throw new Error(`отказ удалять папку внутри репозитория: ${k.koren}`);
  for (const s of [...k.ssylki].reverse()) if (existsSync(s)) unlinkSync(s);
  rmSync(k.koren, { recursive: true, force: true });
}

/** Файл копии: прочитать, записать (путь — от папки сайта в копии). */
export const prochest = (k, put) => readFileSync(join(k.sayt, put), 'utf8');
export const zapisat = (k, put, tekst) => {
  mkdirSync(dirname(join(k.sayt, put)), { recursive: true });
  writeFileSync(join(k.sayt, put), tekst);
};
/** Файл ядра копии (только при `sYadrom`: иначе это ядро репозитория). */
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
