// SV3-O-3: сторож папки судит только корень (`cls` первого уровня). Верх сборки — общие слова (media, mods, pc,
// movie, story, quotes, remake, cheats, gameplay, privacy, 404, _astro): чужое ВНУТРИ папки с таким именем корень
// не меняет — `cls` корня побайтно равен чистой прежней выкладке, — а `mirror --delete` сотрёт всё, чего нет в dist.
// `find .` сервера (remote-before.txt) workflow уже получил до сторожа папки, но сторож папки его не читает.
// Образцы — класс P1d раунда 2 («папка поддомена blog/ рядом с нашей выкладкой»), только имя папки — из верха сборки.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SV, VERKH, NASH, KOREN_NASH, FIND_NASH, PRIN, STOROZH_PUT, SAYT, ZDES, mirrorUdalit, vyvod } from './obshchee.mjs';

const { papka, indeks, pervayaVykladka, pereschet } = SV;
const OBRAZCY = [
  ['V1', 'в mods/ — поддомен mods.7thserpent.com (раздача модов): index.php, uploads/*.zip, .htaccess', ['mods/.htaccess', 'mods/index.php', 'mods/uploads/', 'mods/uploads/mp2-widescreen.zip', 'mods/uploads/mp1-hd.zip']],
  ['V2', 'в media/ — медиатека чужого движка: wp-content/uploads/…', ['media/wp-content/', 'media/wp-content/uploads/', 'media/wp-content/uploads/2026/', 'media/wp-content/uploads/2026/poster.jpg']],
  ['V3', 'в privacy/ — .htpasswd и admin/ владельца; в _astro/ — чужая подпапка cache/', ['privacy/.htpasswd', 'privacy/admin/', 'privacy/admin/index.php', '_astro/cache/', '_astro/cache/x.bin']],
  ['K1', 'контроль: чистая прежняя выкладка + старые ассеты прошлой сборки в _astro/', ['_astro/index.OLDhash1.css', '_astro/hero.OLD_abc.webp']],
];

// Правка-кандидат: глубина по `find .` — каждый путь сервера: файл или папка dist/принятого списка, старый ассет
// `_astro/<файл>` (без подпапок) или временный `.in.<имя>.`; служебные папки — не судятся; прочее — отказ.
const nashi = new Set(Object.keys(PRIN.fajly));
const nashiPapki = new Set([...nashi].flatMap((f) => f.split('/').slice(0, -1).map((_, i, a) => a.slice(0, i + 1).join('/'))));
const glubina = (find) => {
  const chuzhie = [];
  for (const s of find.split('\n').map((x) => x.trim().replace(/^\.\//, '')).filter((x) => x && x !== './')) {
    const f = s.replace(/\/$/, '');
    if (['.well-known', 'cgi-bin'].some((k) => f === k || f.startsWith(`${k}/`))) continue;
    if (s.endsWith('/') ? nashiPapki.has(f) : nashi.has(f) || /^_astro\/[^/]+$/.test(f) || /(^|\/)\.in\.[^/]+\.$/.test(f)) continue;
    chuzhie.push(s);
  }
  return chuzhie;
};

const koren = KOREN_NASH();
const stroki = [];
let opasnyh = 0;
for (const [id, chto, dop] of OBRAZCY) {
  const find = FIND_NASH() + dop.map((p) => `./${p}`).join('\n') + '\n';
  const p = papka(koren, NASH, VERKH);
  const i = indeks(NASH);
  const pv = pervayaVykladka('off', NASH, find);
  const server = find.split('\n').filter((s) => s && s !== './').map((s) => s.replace(/^\.\//, ''));
  const m = mirrorUdalit(server, Object.keys(PRIN.fajly));
  const posle = ['./', ...Object.keys(PRIN.fajly).map((f) => `./${f}`)].join('\n');
  const chuzhie = glubina(find);
  const opasno = p.ok && i.ok && m.udalit.some((u) => !u.startsWith('_astro/') || u.includes('cache')) && id !== 'K1';
  if (opasno) opasnyh += 1;
  stroki.push(`${id} ${opasno ? 'ОПАСНЫЙ ПРОХОД' : p.ok ? 'проход' : 'отказ'} — ${chto}`);
  stroki.push(`    papka: ${p.ok ? 'проход' : 'отказ'} | ${p.stroki[0]}; indeks: ${i.ok ? 'проход' : 'отказ'}; первая: ${pv.pervaya ? 'да' : 'нет'} (${pv.pochemu}) — сверка сборки пропущена, домен — мягко`);
  stroki.push(`    модель mirror --delete удалит: ${m.udalit.join(', ') || '—'}`);
  stroki.push(`    правка-кандидат (глубина по find .): ${chuzhie.length ? `отказ — чужие ${chuzhie.length}: ${chuzhie.join(', ')}` : 'проход'}`);
}

// Через команду, как зовёт workflow: cls корня — чистая выкладка; dist — локальная сборка сайта (только чтение).
const D = join(ZDES, 'tmp', 'vnutri');
mkdirSync(D, { recursive: true });
writeFileSync(join(D, 'remote-root.txt'), koren);
writeFileSync(join(D, 'index.html'), NASH);
const k = spawnSync(process.execPath, [STOROZH_PUT, 'papka', join(D, 'remote-root.txt'), join(D, 'index.html'), join(SAYT, 'dist')], { encoding: 'utf8' });
stroki.push(`команда papka (корень чистой выкладки; то, что внутри mods/, media/, privacy/, сторож не видит): код ${k.status} | ${k.stdout.trim()}`);
stroki.push(`ИТОГ: образцов ${OBRAZCY.length}, опасных проходов ${opasnyh}; cls корня во всех образцах один и тот же — отличить может только find .`);
vyvod('vnutri-nashikh-papok', stroki);
