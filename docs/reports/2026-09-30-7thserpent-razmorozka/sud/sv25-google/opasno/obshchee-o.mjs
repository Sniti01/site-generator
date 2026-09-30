// Общее для скриптов скептика SV25-O («опасный проход», сессия 25, шаг 3 — файл подтверждения Google).
// Сторож, пробы и workflow — из копии (код f57bbb9); репозиторий не трогается. lftp на этой машине нет: всё, что
// касается lftp, — модель по документации lftp(1) и его исходнику, как я их знаю (пределы названы в выводах).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

export const ZDES = dirname(fileURLToPath(import.meta.url));
export const KOPIYA = join(ZDES, 'kopiya');
export const SAYT = join(KOPIYA, 'sites/7thserpent.com');
export const STOROZH_PUT = join(SAYT, 'tools/storozha-vykladki.mjs');
export const SV = await import(pathToFileURL(STOROZH_PUT).href);
export const WF_TEKST = readFileSync(join(KOPIYA, '.github/workflows/deploy-7thserpent.yml'), 'utf8');
export const WF = createRequire(join(SAYT, 'package.json'))('yaml').parse(WF_TEKST);
export const shag = (kusok) => WF.jobs.deploy.steps.find((s) => (s.name ?? s.uses ?? '').includes(kusok));

export const PRIN = JSON.parse(readFileSync(join(SAYT, 'gates/sborka-prinyataya.json'), 'utf8'));
/** Верх сборки так, как его собирает команда papka (первый уровень принятого списка; dist CI — то же). */
export const VERKH = [...new Set(Object.keys(PRIN.fajly).map((f) => f.split('/')[0]))];
export const NASH = '<!doctype html><html><head><title>7th Serpent</title><link rel="canonical" href="https://www.7thserpent.com/"></head><body></body></html>';

/** Корень нашей чистой прежней выкладки — как его покажет `cls -1 -a -F` (папки — с «/»). */
export const KOREN_NASH = () => {
  const papki = new Set(Object.keys(PRIN.fajly).filter((f) => f.includes('/')).map((f) => f.split('/')[0]));
  return ['./', '../', ...VERKH.map((n) => (papki.has(n) ? `${n}/` : n))].join('\n') + '\n';
};
/** `find .` чистой прежней выкладки (папки — с «/», файлы — без). */
export const FIND_NASH = () => {
  const papki = new Set();
  for (const f of Object.keys(PRIN.fajly)) {
    const ch = f.split('/');
    for (let i = 1; i < ch.length; i += 1) papki.add(ch.slice(0, i).join('/') + '/');
  }
  return ['./', ...[...papki].map((p) => `./${p}`), ...Object.keys(PRIN.fajly).map((f) => `./${f}`)].join('\n') + '\n';
};

/** Имя файла владельца нам неизвестно — подставляем имя той же формы (google + 16 шестнадцатеричных). */
export const GOOGLE = 'google0123456789abcdef.html';
export const STROKA = (imya) => `google-site-verification: ${imya}`;

/** Рабочая папка скрипта — только внутри opasno/rabochie (переходов-ссылок там нет); пересоздаётся на каждом прогоне. */
export function rabochaya(imya) {
  const koren = resolve(ZDES, 'rabochie');
  const d = resolve(koren, imya);
  if (!d.startsWith(koren + sep)) throw new Error(`рабочая папка вне rabochie: ${d}`);
  rmSync(d, { recursive: true, force: true });
  mkdirSync(d, { recursive: true });
  return d;
}
export function zapisat(d, fajly) {
  for (const [f, t] of Object.entries(fajly)) {
    mkdirSync(dirname(join(d, f)), { recursive: true });
    writeFileSync(join(d, f), t);
  }
  return d;
}
/** dist с путями принятого списка (содержимое — заглушки: пересчёту и папке нужны только имена). */
export function distNash(imya = 'dist-nash') {
  const d = rabochaya(imya);
  zapisat(d, Object.fromEntries(Object.keys(PRIN.fajly).map((f) => [f, f === 'index.html' ? NASH : 'x'])));
  return d;
}

/** Запуск команды сторожа копии: { kod, vyvod }. */
export function komanda(...argi) {
  const r = spawnSync(process.execPath, [STOROZH_PUT, ...argi], { encoding: 'utf8' });
  return { kod: r.status, vyvod: `${r.stdout}${r.stderr}`.trim() };
}

export function vyvod(imyaFajla, stroki) {
  const t = stroki.join('\n') + '\n';
  writeFileSync(join(ZDES, imyaFajla), t);
  process.stdout.write(t);
}

/* ---------- модель lftp ---------- */

/** Аргументы исключений из строки mirror workflow: [{ vid: 'x'|'X', tekst }] — как их видит bash (одинарные кавычки
 *  внутри двойных — буквальные знаки, `$'` в двойных кавычках — буквально). */
export function isklyucheniyaMirror(run) {
  const m = /mirror --reverse[^;]*/.exec(run);
  if (!m) throw new Error('нет mirror --reverse в шаге');
  return [...m[0].matchAll(/ -(x|X) ('([^']*)'|(\S+))/g)].map((a) => ({ vid: a[1], tekst: a[3] ?? a[4] }));
}

/** Разбор аргумента lftp: вариант «А» — кавычки сняты, знаки внутри буквально (как я знаю разборщик lftp);
 *  вариант «Б» — гипотеза: разборщик экранирует знаки glob внутри кавычек (\[ \] \* \?), mirror их не снимает. */
export const razborLftp = (tekst, variant = 'А') => (variant === 'А' ? tekst : variant === 'В' ? `'${tekst}'` : tekst.replace(/[[\]*?]/g, '\\$&'));

/** glob lftp как fnmatch(FNM_PATHNAME) для имени: «*» — любые знаки, кроме «/», «?» — один знак, [..] — набор,
 *  «\x» — буквально x. */
export function globV(gp) {
  let s = '^';
  for (let i = 0; i < gp.length; i += 1) {
    const c = gp[i];
    if (c === '\\' && i + 1 < gp.length) {
      i += 1;
      s += gp[i].replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    } else if (c === '*') s += '[^/]*';
    else if (c === '?') s += '[^/]';
    else if (c === '[') {
      const k = gp.indexOf(']', i + 2);
      if (k < 0) s += '\\[';
      else {
        s += `[${gp.slice(i + 1, k).replace(/^!/, '^')}]`;
        i = k;
      }
    } else s += c.replace(/[.+^${}()|\\/\]]/g, '\\$&');
  }
  return new RegExp(s + '$');
}

/**
 * Модель `mirror --reverse --delete` для записей КОРНЯ сервера (lftp(1): -x — ERE, -X — glob; сверка — с путём
 * относительно корня mirror, папке дописана «/»; исключённое на цели без --delete-excluded не удаляется; по умолчанию
 * mirror:exclude-regex = (^|/)(\.in\.|\.nfs)). Вход: записи корня (`imya`, `imya/` для папок), имена верха dist.
 * Выход: { udalit, ostavit, zamenit }.
 */
export function mirrorKoren(zapisi, verkhDist, isklyucheniya, variant = 'А') {
  const obrazcy = [{ vid: 'x', rx: /(^|\/)(\.in\.|\.nfs)/ }, ...isklyucheniya.map((i) => (i.vid === 'x' ? { vid: 'x', rx: new RegExp(razborLftp(i.tekst, variant)) } : { vid: 'X', rx: globV(razborLftp(i.tekst, variant)) }))];
  const dist = new Set(verkhDist);
  const res = { udalit: [], ostavit: [], zamenit: [] };
  for (const z of zapisi) {
    if (obrazcy.some((o) => o.rx.test(z))) res.ostavit.push(z);
    else if (dist.has(z.replace(/\/$/, ''))) res.zamenit.push(z);
    else res.udalit.push(z);
  }
  return res;
}
