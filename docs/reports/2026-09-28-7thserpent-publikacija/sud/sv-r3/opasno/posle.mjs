// Раунд 3, после правки: образцы скептиков SV3-O (opasno/*.mjs) — на правленом стороже и workflow, как их зовёт
// workflow. Исключения mirror — из самого workflow (не строкой), глубина — команда glubina, окно первой выкладки —
// с главной последней (mirror без index.html, затем put). Модель mirror — mirrorUdalit скептика (lftp здесь нет).
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SV, VERKH, NASH, KOREN_NASH, FIND_NASH, PRIN, STOROZH_PUT, SAYT, REPO, ZDES, mirrorUdalit, vyvod } from './obshchee.mjs';

const { papka, pervayaVykladka, glubina } = SV;
const stroki = [];
const D = join(ZDES, 'tmp', 'posle');
mkdirSync(D, { recursive: true });
const komanda = (...argi) => {
  const r = spawnSync(process.execPath, [STOROZH_PUT, ...argi], { encoding: 'utf8' });
  return { kod: r.status, tekst: (r.stdout + r.stderr).trim() };
};

// SV3-O-1: исключения mirror — как в workflow.
const wf = readFileSync(join(REPO, '.github/workflows/deploy-7thserpent.yml'), 'utf8');
const mirror = /mirror --reverse[^;]*/.exec(wf)[0];
const X = [...mirror.matchAll(/-X (\S+)/g)].map((m) => m[1]);
stroki.push(`SV3-O-1 исключения mirror в workflow: ${X.map((x) => `-X ${x}`).join(' ')}`);
const distFajly = ['index.html', '.htaccess', 'robots.txt', '404/index.html', 'privacy/index.html', 'sitemap-index.xml', 'sitemap-0.xml', '_astro/a.css'];
for (const [id, chto, spisok] of [
  ['S1', 'ссылки .well-known@ cgi-bin@', ['.well-known@', 'cgi-bin@']],
  ['S2', 'прежняя выкладка и .well-known@', ['.well-known@']],
  ['S3', 'файлы .well-known и cgi-bin', ['.well-known', 'cgi-bin']],
  ['K1', 'папки .well-known/ cgi-bin/', ['.well-known/', 'cgi-bin/']],
]) {
  const m = mirrorUdalit(spisok, distFajly, X);
  stroki.push(`    ${id} ${chto}: mirror удалит ${m.udalit.join(', ') || '—'}; не тронет ${m.isklyucheno.join(', ')}`);
}

// SV3-O-3: глубина — команда, как в workflow (find после суда корня; dist — сборка сайта; карта прежней выкладки нет).
writeFileSync(join(D, 'index.html'), NASH);
writeFileSync(join(D, 'oshibki.txt'), '');
for (const [id, chto, dop] of [
  ['V1', 'в mods/ чужой поддомен', ['mods/.htaccess', 'mods/index.php', 'mods/uploads/', 'mods/uploads/mp2-widescreen.zip', 'mods/uploads/mp1-hd.zip']],
  ['V2', 'в media/ wp-content', ['media/wp-content/', 'media/wp-content/uploads/', 'media/wp-content/uploads/2026/', 'media/wp-content/uploads/2026/poster.jpg']],
  ['V3', 'в privacy/ .htpasswd и admin/, _astro/cache/', ['privacy/.htpasswd', 'privacy/admin/', 'privacy/admin/index.php', '_astro/cache/', '_astro/cache/x.bin']],
  ['K1', 'старые ассеты в _astro/', ['_astro/index.OLDhash1.css', '_astro/hero.OLD_abc.webp']],
]) {
  writeFileSync(join(D, 'find.txt'), FIND_NASH() + dop.map((p) => `./${p}`).join('\n') + '\n');
  const g = komanda('glubina', join(D, 'find.txt'), join(D, 'index.html'), join(SAYT, 'dist'), join(D, 'net-karty.xml'), join(D, 'oshibki.txt'));
  stroki.push(`SV3-O-3 ${id} ${chto}: glubina код ${g.kod} | ${g.tekst.slice(0, 160)}`);
}
writeFileSync(join(D, 'find.txt'), FIND_NASH());
writeFileSync(join(D, 'oshibki.txt'), 'find: Access failed: 550 Permission denied (./privacy)\n');
const go = komanda('glubina', join(D, 'find.txt'), join(D, 'index.html'), join(SAYT, 'dist'), join(D, 'net-karty.xml'), join(D, 'oshibki.txt'));
stroki.push(`SV3-O-4 ошибки find в файле: glubina код ${go.kod} | ${go.tekst.slice(0, 120)}`);

// SV3-O-4: порядок в workflow.
const shag = wf.slice(wf.indexOf('Сторож папки робота'), wf.indexOf('Первая выкладка?'));
const poz = ['cls -1 -a -F', 'papka remote-root', 'indeks remote-top', 'find .; bye', 'glubina remote-before'].map((k) => shag.indexOf(k));
stroki.push(`SV3-O-4 порядок cls → papka → indeks → find → glubina: ${poz.every((p, i) => p >= 0 && (i === 0 || p > poz[i - 1])) ? 'да' : 'НЕТ'} (${poz.join(', ')})`);

// SV3-O-5: окно первой выкладки при главной последней. Порядок mirror — любой: главной нет до конца mirror.
const vse = Object.keys(PRIN.fajly).filter((f) => f !== 'index.html').sort();
let okno = 0;
for (let n = 0; n <= vse.length; n += 1) {
  const find = ['./', ...vse.slice(0, n).map((f) => `./${f}`)].join('\n');
  if (!pervayaVykladka('off', null, find).pervaya) okno += 1;
}
const posleMirror = pervayaVykladka('off', null, ['./', ...vse.map((f) => `./${f}`)].join('\n'));
stroki.push(`SV3-O-5 главная последней: точек обрыва mirror (0…${vse.length} файлов без главной), где повтор — «не первая»: ${okno}; mirror закончен, put не прошёл: первая — ${posleMirror.pervaya ? 'да' : 'нет'} (${posleMirror.pochemu})`);
const mput = /mirror --reverse[^"]*/.exec(wf)[0];
stroki.push(`    workflow: … ${mput.slice(mput.indexOf(' -x '))}`);

// SV3-Z-1: своя старая страница — команда papka с картой прежней выкладки.
writeFileSync(join(D, 'root.txt'), KOREN_NASH() + 'max-payne-4/\n');
writeFileSync(join(D, 'karta.xml'), '<urlset><url><loc>https://www.7thserpent.com/</loc></url><url><loc>https://www.7thserpent.com/max-payne-4/</loc></url></urlset>');
const s1 = komanda('papka', join(D, 'root.txt'), join(D, 'index.html'), join(SAYT, 'dist'), join(D, 'karta.xml'));
const s0 = komanda('papka', join(D, 'root.txt'), join(D, 'index.html'), join(SAYT, 'dist'), join(D, 'net-karty.xml'));
stroki.push(`SV3-Z-1 max-payne-4/ в карте прежней выкладки: papka код ${s1.kod}; без карты: код ${s0.kod} | ${s0.tekst.slice(0, 120)}`);
writeFileSync(join(D, 'find.txt'), FIND_NASH() + './max-payne-4/\n./max-payne-4/index.html\n');
writeFileSync(join(D, 'oshibki.txt'), '');
const g1 = komanda('glubina', join(D, 'find.txt'), join(D, 'index.html'), join(SAYT, 'dist'), join(D, 'karta.xml'), join(D, 'oshibki.txt'));
stroki.push(`    глубина той же старой страницы с картой: код ${g1.kod}`);
vyvod('posle', stroki);
