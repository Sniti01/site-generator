// Опыт: главный ли модуль znak.mjs при разном написании пути (регистр буквы диска, папка запуска) — только --check.
import { spawnSync } from 'node:child_process';

const PUTI = [
  ['D: заглавная, абсолютный путь', 'D:\\SEO\\cloud\\site-generator\\sites\\7thserpent.com', 'D:\\SEO\\cloud\\site-generator\\sites\\7thserpent.com\\tools\\znak.mjs'],
  ['d: строчная, абсолютный путь', 'D:\\SEO\\cloud\\site-generator\\sites\\7thserpent.com', 'd:\\SEO\\cloud\\site-generator\\sites\\7thserpent.com\\tools\\znak.mjs'],
  ['папка запуска d: строчная, путь относительный', 'd:\\SEO\\cloud\\site-generator\\sites\\7thserpent.com', 'tools/znak.mjs'],
  ['регистр папки другой (sites → SITES)', 'D:\\SEO\\cloud\\site-generator\\sites\\7thserpent.com', 'D:\\SEO\\cloud\\site-generator\\SITES\\7thserpent.com\\tools\\znak.mjs'],
];
for (const [imya, cwd, put] of PUTI) {
  const r = spawnSync(process.execPath, [put, '--check'], { cwd, encoding: 'utf8' });
  const vyvod = `${r.stdout}${r.stderr}`.trim();
  console.log(`=== ${imya}\nкод ${r.status}; вывод: ${vyvod ? vyvod.slice(0, 160) : '(пусто)'}\n`);
}
