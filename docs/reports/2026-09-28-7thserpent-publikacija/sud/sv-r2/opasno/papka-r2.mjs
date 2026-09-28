// SV2 «опасный проход» — белый список папки робота (правка раунда 1, коммит 6419c9b; storozh.mjs — git show).
// Модель шага workflow «Сторож папки робота и удалённого index.html» + «Первая выкладка?» + «Домен уже привязан?»:
//   cls -1 -a -F > remote-root.txt ; mirror --no-recursion --include-glob=index.html . remote-top
//   papka ; indeks ; pervaya (SERPENT_FIRST=off) ; domen (pervyi = pervaya) ; sverka-dist — только при pervaya=on
// «Что сотрёт mirror --delete» — модель: записи корня сервера, которых нет в корне dist принятой сборки
// (gates/sborka-prinyataya.json из git show 6419c9b). Каталоги из списка стираются целиком, с содержимым.
import { papka, indeks, pervayaVykladka, domen } from './storozh.mjs';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ZDES = fileURLToPath(new URL('.', import.meta.url));
const REPO = 'D:/SEO/cloud/site-generator';
const prin = JSON.parse(execFileSync('git', ['-C', REPO, 'show', '6419c9b:sites/7thserpent.com/gates/sborka-prinyataya.json']).toString());
const KOREN_DIST = new Set(Object.keys(prin.fajly).map((p) => (p.includes('/') ? p.split('/')[0] + '/' : p)));

const NASH = '<!doctype html><html><head><title>7th Serpent</title><link rel="canonical" href="https://www.7thserpent.com/"></head><body></body></html>';
const NASH_DIST_KOREN = [...KOREN_DIST].join('\n');

// Домен «отвечает» (привязан, показывает что-то) — для цепочки: pervyi берётся из pervaya.
const OTVECHAET = async (url) => (url.includes('www.') ? { status: 200, telo: '<html>Сайт успішно створено</html>', location: '' } : { status: 301, telo: '', location: 'https://www.7thserpent.com/' });
const NE_PRIVYAZAN = async () => ({ oshibka: 'ENOTFOUND' });

const OBRAZCY = [
  // [id, что это, вывод cls, index.html на сервере (null — нет), ждём]
  ['P1a', 'наш index.html + чужой сайт WordPress рядом (wp-admin/, wp-content/, wp-includes/, wp-config.php)', `./\n../\n.htaccess\nindex.html\nwp-admin/\nwp-content/\nwp-includes/\nwp-config.php\nwp-login.php\n`, NASH, 'отказ'],
  ['P1b', 'корень первого сайта ac4bf, где главная заменена копией нашей (guides/, _astro/, 404/, robots.txt первого сайта)', `./\n../\n.htaccess\n404/\n_astro/\nguides/\nindex.html\nrobots.txt\nsitemap-index.xml\nsitemap-0.xml\n`, NASH, 'отказ'],
  ['P1c', 'наш index.html + записи без отметки типа с именами доменов (cls не распознал тип)', `./\n../\nindex.html\n7dtd.com.pl\nac4bf-thewatch.com\n1weekinvr.com\n`, NASH, 'отказ'],
  ['P1d', 'наша прежняя выкладка + папка поддомена blog/ и файл подтверждения Search Console', `${'./\n../\n' + NASH_DIST_KOREN}\nblog/\ngoogle0123456789abcdef.html\nBingSiteAuth.xml\n`, NASH, 'отказ'],
  ['P1e', 'наш index.html + домашние папки аккаунта без доменов (mail/, tmp/, .ssh/, logs/)', `./\n../\n.ssh/\nindex.html\nlogs/\nmail/\ntmp/\n`, NASH, 'отказ'],
  ['W1', 'нет index.html; только .well-known/ и cgi-bin/ — их содержимое сторож не видит (чужие скрипты CGI, security.txt, pki-validation); домен не привязан', `./\n../\n.well-known/\ncgi-bin/\n`, null, 'отказ или исключение папок из mirror', NE_PRIVYAZAN],
  ['K1', 'контроль: чужой WordPress без нашего index.html', `./\n../\n.htaccess\nwp-admin/\nwp-content/\nwp-config.php\n`, null, 'отказ'],
  ['K2', 'контроль: прежняя наша выкладка ровно по корню dist', `./\n../\n${NASH_DIST_KOREN}\n`, NASH, 'проход'],
  ['K3', 'контроль: пустой корень', './\n../\n', null, 'проход'],
];

const stroki = [];
let opasnyh = 0;
for (const [id, chto, spisok, index, zhdem, poluchit = OTVECHAET] of OBRAZCY) {
  const p = papka(spisok, index);
  const i = p.ok ? indeks(index) : null;
  const pv = p.ok && i.ok ? pervayaVykladka('off', index) : null;
  const d = pv ? await domen({ poluchit, pervyi: pv.pervaya }) : null;
  const vse = p.ok && i?.ok && d?.ok;
  const zapisi = spisok.split('\n').map((s) => s.trim()).filter((s) => s && s !== './' && s !== '../');
  const sotret = zapisi.filter((s) => !KOREN_DIST.has(s));
  const opasno = vse && zhdem === 'отказ';
  if (opasno) opasnyh += 1;
  stroki.push(`${id} ${opasno ? 'ОПАСНЫЙ ПРОХОД' : vse ? 'проход' : 'отказ'} — ${chto}`);
  stroki.push(`    papka: ${p.ok ? 'проход' : 'отказ'} | ${p.stroki[0]}`);
  if (i) stroki.push(`    indeks: ${i.ok ? 'проход' : 'отказ'}; pervaya: ${pv ? (pv.pervaya ? 'on' : 'off') + ' (' + pv.pochemu + ')' : '—'}; сверка сборки: ${pv && pv.pervaya ? 'идёт' : 'пропущена'}; domen (${poluchit === NE_PRIVYAZAN ? 'домен не привязан' : 'домен отвечает страницей хостера'}): ${d ? (d.ok ? 'проход' : 'отказ') + ' | ' + d.stroki[d.stroki.length - 1] : '—'}`);
  if (vse) stroki.push(`    mirror --delete сотрёт (нет в корне dist): ${sotret.length ? sotret.join(', ') : '—'}  (надо: ${zhdem})`);
}

// Через команду, как зовёт workflow (bash -e: papka, затем indeks) — коды возврата для P1a, P1b, W1.
const D = join(ZDES, 'vkhod-papka');
rmSync(D, { recursive: true, force: true });
mkdirSync(join(D, 'remote-top'), { recursive: true });
const kod = (id) => {
  const [, , spisok, index] = OBRAZCY.find((o) => o[0] === id);
  writeFileSync(join(D, 'remote-root.txt'), spisok);
  rmSync(join(D, 'remote-top', 'index.html'), { force: true });
  if (index !== null) writeFileSync(join(D, 'remote-top', 'index.html'), index);
  const zov = (argi) => spawnSync(process.execPath, [join(ZDES, 'storozh.mjs'), ...argi], { encoding: 'utf8', env: { ...process.env, SERPENT_FIRST: 'off', GITHUB_OUTPUT: join(D, 'out.txt') } });
  writeFileSync(join(D, 'out.txt'), '');
  const a = zov(['papka', join(D, 'remote-root.txt'), join(D, 'remote-top', 'index.html')]);
  const b = zov(['indeks', join(D, 'remote-top', 'index.html')]);
  const c = zov(['pervaya', join(D, 'remote-top', 'index.html')]);
  const out = spawnSync(process.execPath, ['-e', `process.stdout.write(require('fs').readFileSync(${JSON.stringify(join(D, 'out.txt'))},'utf8').trim())`], { encoding: 'utf8' }).stdout;
  return `команда ${id}: papka код ${a.status}, indeks код ${b.status}, pervaya код ${c.status} → GITHUB_OUTPUT «${out}»`;
};
for (const id of ['P1a', 'P1b', 'W1']) stroki.push(kod(id));
rmSync(D, { recursive: true, force: true });

stroki.push(`ИТОГ: образцов ${OBRAZCY.length}, опасных проходов ${opasnyh}; корень dist принятой сборки — ${KOREN_DIST.size} записей`);
const vyvod = stroki.join('\n') + '\n';
writeFileSync(join(ZDES, 'papka-r2.txt'), vyvod);
process.stdout.write(vyvod);
