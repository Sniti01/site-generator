// Копии сайта для скептиков сторожей (сессия 25): node kopii-skeptikov.mjs sdelat <коммит> <папка>… | udalit <папка>…
// sdelat — в каждой папке вне репозитория: копия сайта `tools/kopiya.mjs` (sdelatKopiyu: src, public, structure, gates, tools,
// конфигурация; ядро, пакеты и корпус — ссылками-переходами) в <папка>/kopiya и workflow `.github/workflows/deploy-7thserpent.yml`
// коммита в <папка>/kopiya/.github/workflows/ (пробы договора читают его от корня копии); описание копии (корень и ссылки) —
// в <папка>/kopiya.json. Коммит должен быть HEAD чистого дерева: копия снимается с рабочего дерева.
// udalit — удаление копии только udalitKopiyu по kopiya.json (ссылки первыми, их цели не трогаются; Remove-Item — нельзя).
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const { sdelatKopiyu, udalitKopiyu } = await import(pathToFileURL(join(REPO, 'sites/7thserpent.com/tools/kopiya.mjs')).href);
const [komanda, ...ost] = process.argv.slice(2);
const git = (...a) => spawnSync('git', a, { cwd: REPO, maxBuffer: 64 * 1024 * 1024 });
if (komanda === 'sdelat' && ost.length >= 2) {
  const [kommit, ...papki] = ost;
  const head = String(git('rev-parse', 'HEAD').stdout).trim();
  const kmt = String(git('rev-parse', kommit).stdout).trim();
  const gryaz = String(git('status', '--short', '--untracked-files=no').stdout).trim();
  if (!kmt || kmt !== head || gryaz) {
    console.error(`копия снимается с рабочего дерева: нужен HEAD = ${kommit} и чистые отслеживаемые файлы (HEAD ${head.slice(0, 7)}, ${gryaz ? 'дерево грязное' : 'чисто'})`);
    process.exit(1);
  }
  for (const p of papki) {
    if (!isAbsolute(p)) throw new Error(`папка — абсолютным путём: ${p}`);
    const k = sdelatKopiyu(join(p, 'kopiya'));
    const wf = git('show', `${kommit}:.github/workflows/deploy-7thserpent.yml`);
    if (wf.status !== 0) throw new Error('git show workflow — ошибка');
    mkdirSync(join(k.koren, '.github/workflows'), { recursive: true });
    writeFileSync(join(k.koren, '.github/workflows/deploy-7thserpent.yml'), wf.stdout);
    writeFileSync(join(p, 'kopiya.json'), `${JSON.stringify({ kommit: kmt, ...k }, null, 1)}\n`);
    console.log(`${p}: копия ${k.koren}, сайт ${k.sayt}, ссылок ${k.ssylki.length}, workflow коммита ${kmt.slice(0, 7)}`);
  }
} else if (komanda === 'udalit' && ost.length >= 1) {
  for (const p of ost) {
    const f = join(p, 'kopiya.json');
    if (!existsSync(f)) {
      console.log(`${p}: kopiya.json нет — нечего удалять`);
      continue;
    }
    const k = JSON.parse(readFileSync(f, 'utf8'));
    udalitKopiyu(k);
    rmSync(f);
    console.log(`${p}: копия удалена (${k.ssylki.length} ссылок сняты первыми)`);
  }
} else {
  console.error('node kopii-skeptikov.mjs sdelat <коммит> <папка>… | udalit <папка>…');
  process.exit(2);
}
