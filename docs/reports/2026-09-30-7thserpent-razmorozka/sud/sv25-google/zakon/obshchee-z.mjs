// Общее для скриптов суда SV25-Z («законные формы»): сторож — из копии (f57bbb9), живой корень — по принятому списку
// сборки (на сервере сейчас выкладка add241a = принятая сборка, П110/П111), запуск команды сторожа как в workflow.
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

export const TUT = dirname(fileURLToPath(import.meta.url));
export const SAYT = join(TUT, 'kopiya', 'sites', '7thserpent.com');
export const STOROZH = join(SAYT, 'tools', 'storozha-vykladki.mjs');
export const SV = await import(pathToFileURL(STOROZH).href);

export const PRINYATYI = JSON.parse(readFileSync(join(SAYT, 'gates', 'sborka-prinyataya.json'), 'utf8'));
export const FAJLY = Object.keys(PRINYATYI.fajly).sort();
export const VERKH = [...new Set(FAJLY.map((f) => f.split('/')[0]))].sort();
export const PAPKI = new Set(FAJLY.filter((f) => f.includes('/')).map((f) => f.split('/')[0]));

/** Вывод `cls -1 -a -F` живого корня: наша выкладка (принятая сборка), папки — с «/», плюс `dop`. */
export const cls = (dop = [], { crlf = false, bezNashey = false } = {}) => {
  const zapisi = bezNashey ? [] : VERKH.map((n) => (PAPKI.has(n) ? `${n}/` : n));
  const s = ['./', '../', ...zapisi, ...dop].join('\n') + '\n';
  return crlf ? s.replace(/\n/g, '\r\n') : s;
};
/** Вывод `find .` живого сервера: папки с «/», файлы с «./», плюс `dop` (пути без «./»). */
export const find = (dop = [], { bezNashey = false } = {}) => {
  const papki = bezNashey ? [] : [...PAPKI].map((p) => `./${p}/`);
  const fajly = bezNashey ? [] : FAJLY.map((f) => `./${f}`);
  return ['./', ...papki, ...fajly, ...dop.map((f) => `./${f}`)].join('\n') + '\n';
};
export const nash = (url = '/') => `<!doctype html><html><head><title>x</title><link rel="canonical" href="https://www.7thserpent.com${url}"></head><body></body></html>`;
export const zaglushkaHostera = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Поздравляем, сайт создан!</title></head><body><h1>Поздравляем, сайт создан!</h1></body></html>';
export const karta = () => `<?xml version="1.0" encoding="UTF-8"?><urlset>${['/', ...[...PAPKI].filter((p) => !p.startsWith('_')).map((p) => `/${p}/`)].map((p) => `<url><loc>https://www.7thserpent.com${p}</loc></url>`).join('')}</urlset>`;

/** Имя файла подтверждения — форма Search Console (google + 16 шестнадцатеричных); имени владельца мы не знаем. */
export const G = 'google5f3a9c1e7b2d4a60.html';
export const STROKA = (imya = G) => `google-site-verification: ${imya}`;

/** Рабочая папка прогона: dist с верхом принятой сборки, remote-top, списки. Удаляется только папка «rab-…». */
export function rabochaya() {
  const d = mkdtempSync(join(TUT, 'rab-'));
  mkdirSync(join(d, 'dist'), { recursive: true });
  for (const n of VERKH) {
    if (PAPKI.has(n)) {
      mkdirSync(join(d, 'dist', n), { recursive: true });
      writeFileSync(join(d, 'dist', n, 'index.html'), nash(`/${n}/`));
    } else writeFileSync(join(d, 'dist', n), n === 'index.html' ? nash('/') : 'x');
  }
  return d;
}
export function ubrat(d) {
  if (!basename(d).startsWith('rab-') || dirname(d) !== TUT) throw new Error(`не своя папка: ${d}`);
  rmSync(d, { recursive: true, force: true });
}
/** Команда сторожа, как в workflow: `node <сторож> <команда> …` — код и строки. */
export function komanda(argi) {
  const r = spawnSync(process.execPath, [STOROZH, ...argi], { encoding: 'utf8' });
  return { kod: r.status, vyvod: (r.stdout + r.stderr).trim() };
}
/** Шаг «Сторож папки робота»: papka с пятью аргументами, как в workflow f57bbb9. */
export function shagPapki(d, spisok, { index = nash('/'), sitemap = karta(), skachano = {}, bezRemoteTop = false } = {}) {
  writeFileSync(join(d, 'remote-root.txt'), spisok);
  if (!bezRemoteTop) {
    mkdirSync(join(d, 'remote-top'), { recursive: true });
    if (index !== null) writeFileSync(join(d, 'remote-top', 'index.html'), index);
    if (sitemap !== null) writeFileSync(join(d, 'remote-top', 'sitemap-0.xml'), sitemap);
    for (const [imya, baity] of Object.entries(skachano)) writeFileSync(join(d, 'remote-top', imya), baity);
  }
  return komanda(['papka', join(d, 'remote-root.txt'), join(d, 'remote-top', 'index.html'), join(d, 'dist'), join(d, 'remote-top', 'sitemap-0.xml'), join(d, 'remote-top')]);
}
export const pokazat = (b) => JSON.stringify(Buffer.isBuffer(b) ? b.toString('latin1') : b);
export function zapis(imya, stroki) {
  writeFileSync(join(TUT, imya), stroki.join('\n') + '\n');
  console.log(stroki.join('\n'));
}
