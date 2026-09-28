// Общее для проб скептика SV3-O («опасный проход», раунд 3). Сторож — редакция f534de5 из рабочего дерева
// (git diff f534de5 по сторожу, workflow, пробам и списку принятой сборки — пусто).
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ZDES = dirname(fileURLToPath(import.meta.url));
export const REPO = 'D:/SEO/cloud/site-generator';
export const SAYT = join(REPO, 'sites/7thserpent.com');
export const STOROZH_PUT = join(SAYT, 'tools/storozha-vykladki.mjs');
export const SV = await import(pathToFileURL(STOROZH_PUT).href);

export const PRIN = JSON.parse(readFileSync(join(SAYT, 'gates/sborka-prinyataya.json'), 'utf8'));
/** Верх сборки так, как его собирает команда papka: первый уровень принятого списка (dist CI — то же). */
export const VERKH = [...new Set(Object.keys(PRIN.fajly).map((f) => f.split('/')[0]))];
export const NASH = '<!doctype html><html><head><title>7th Serpent</title><link rel="canonical" href="https://www.7thserpent.com/"></head><body></body></html>';

/** Корень нашей чистой прежней выкладки — так его покажет `cls -1 -a -F`. */
export const KOREN_NASH = () => {
  const dirs = new Set(Object.keys(PRIN.fajly).filter((f) => f.includes('/')).map((f) => f.split('/')[0]));
  return ['./', '../', ...VERKH.map((n) => (dirs.has(n) ? `${n}/` : n))].join('\n') + '\n';
};
/** `find .` чистой прежней выкладки (файлы принятого списка и их папки). */
export const FIND_NASH = () => {
  const papki = new Set();
  for (const f of Object.keys(PRIN.fajly)) {
    const ch = f.split('/');
    for (let i = 1; i < ch.length; i += 1) papki.add(ch.slice(0, i).join('/') + '/');
  }
  return ['./', ...[...papki].map((p) => `./${p}`), ...Object.keys(PRIN.fajly).map((f) => `./${f}`)].join('\n') + '\n';
};

/**
 * Модель `lftp mirror --reverse --delete -X GP …` (lftp(1), mirror: «Directories are matched with a slash appended»;
 * исключённое не удаляется без --delete-excluded). Вход — пути сервера (`find .` без «./»; папки — с «/», ссылки —
 * с «@»), набор файлов dist. Выход — что mirror удалит. Модель, не lftp: lftp на этой машине нет.
 */
export function mirrorUdalit(serverPuti, distFajly, isklyuchit = ['.well-known/', 'cgi-bin/']) {
  const dist = new Set(distFajly);
  const distPapki = new Set();
  for (const f of distFajly) {
    const ch = f.split('/');
    for (let i = 1; i < ch.length; i += 1) distPapki.add(ch.slice(0, i).join('/'));
  }
  const glob = (gp, s) => new RegExp('^' + gp.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]') + '$').test(s);
  const udalit = [];
  const isklyucheno = [];
  for (const p of serverPuti) {
    const papka = p.endsWith('/');
    const ssylka = p.endsWith('@');
    const imya = p.replace(/[/@]$/, '');
    // Имя для сверки с -X: папке дописана косая, ссылке и файлу — нет.
    const dlyaX = papka ? `${imya}/` : imya;
    // Путь внутри исключённой папки lftp не обходит.
    if (isklyuchit.some((gp) => glob(gp, dlyaX) || isklyuchit.some((g2) => g2.endsWith('/') && imya.startsWith(g2)))) {
      isklyucheno.push(p);
      continue;
    }
    if (papka ? !distPapki.has(imya) : !dist.has(imya) || ssylka) udalit.push(p);
  }
  return { udalit, isklyucheno };
}

export function vyvod(imya, stroki) {
  const t = stroki.join('\n') + '\n';
  writeFileSync(join(ZDES, `${imya}.txt`), t);
  process.stdout.write(t);
}

/** Маленькая сборка во временной папке скептика: { путь: текст }. */
export function sborka(imya, fajly) {
  const d = join(ZDES, 'tmp', imya);
  rmSync(d, { recursive: true, force: true });
  for (const [f, t] of Object.entries(fajly)) {
    mkdirSync(dirname(join(d, f)), { recursive: true });
    writeFileSync(join(d, f), t);
  }
  return d;
}
export const ubrat = (d) => rmSync(d, { recursive: true, force: true });
export const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)).map((x) => `${n}/${x}`) : [n]));
