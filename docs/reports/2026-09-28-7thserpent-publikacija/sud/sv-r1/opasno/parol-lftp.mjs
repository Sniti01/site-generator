// SV1 «опасный проход» — значение пароля в строке `lftp -e "…"` (коммит e6cd82f). lftp здесь нет: это МОДЕЛЬ.
// 1) Как bash раскрывает строку шага (значение переменной в двойных кавычках подставляется как есть, без повторного разбора).
// 2) Упрощённый разбор команд lftp: «;» вне кавычек делит команды, "…" — кавычки, слова склеиваются.
//    Настоящий разбор lftp (CmdExec) — по памяти документации; вывод помечен «модель».
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ZDES = fileURLToPath(new URL('.', import.meta.url));
const { parse } = await import(pathToFileURL('D:/SEO/cloud/site-generator/node_modules/yaml/dist/index.js').href);
const wf = parse(readFileSync(join(ZDES, 'deploy-7thserpent.yml'), 'utf8'));
const LFTP_SET = wf.jobs.deploy.env.LFTP_SET;
const shag = wf.jobs.deploy.steps.find((s) => (s.name ?? '').startsWith('Сторож папки'));
const stroka1 = shag.run.split('\n')[0];

const ENV = { LFTP_SET, SERPENT_FTP_USER: 'ax572417_serpent', SERPENT_FTP_PASSWORD: 'Kq7"mZ;v9Tr2', SERPENT_FTP_PORT: '21', SERPENT_FTP_HOST: 'ax572417.ftp.tools' };
// Аргумент -e: содержимое внешних двойных кавычек bash; \" → ", $X → значение.
const argE = stroka1.slice(stroka1.indexOf('-e "') + 4, stroka1.lastIndexOf('"'));
const raskryto = argE.replace(/\\"/g, '"').replace(/\$([A-Z_]+)/g, (_, v) => ENV[v]);

function razbor(s) {
  const komandy = [];
  let slova = [], slovo = '', vKav = false, estSlovo = false;
  const konecSlova = () => { if (estSlovo) slova.push(slovo); slovo = ''; estSlovo = false; };
  for (const c of s) {
    if (c === '"') { vKav = !vKav; estSlovo = true; continue; }
    if (!vKav && c === ';') { konecSlova(); if (slova.length) komandy.push(slova); slova = []; continue; }
    if (!vKav && /\s/.test(c)) { konecSlova(); continue; }
    slovo += c; estSlovo = true;
  }
  konecSlova();
  if (slova.length) komandy.push(slova);
  return { komandy, nezakryta: vKav };
}
const { komandy, nezakryta } = razbor(raskryto);
const IZVESTNYE = new Set(['set', 'open', 'cls', 'bye', 'mirror', 'find']);
const stroki = [];
stroki.push(`пароль образца: ${ENV.SERPENT_FTP_PASSWORD} (в нём «"» и «;»)`);
stroki.push(`строка lftp после bash: ${raskryto.replace(LFTP_SET, '$LFTP_SET')}`);
const open = komandy.find((k) => k[0] === 'open');
stroki.push(`модель: open получает -u «${open[open.indexOf('-u') + 1]}» — пароль обрезан`);
for (const k of komandy.filter((k) => !IZVESTNYE.has(k[0]))) stroki.push(`модель: неизвестная команда «${k[0]}» → lftp печатает её имя в журнал (Unknown command) — это кусок пароля «${k[0].split(' ')[0]}», маскировка GitHub ловит только значение секрета целиком`);
stroki.push(`модель: кавычка в конце ${nezakryta ? 'НЕ закрыта' : 'закрыта'}`);
const vyvod = stroki.join('\n') + '\n';
writeFileSync(join(ZDES, 'parol-lftp.txt'), vyvod);
process.stdout.write(vyvod);
