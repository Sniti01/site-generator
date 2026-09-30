// SV25-O-2: сторож не отличает файл подтверждения владельца от файла подтверждения ЧУЖОГО аккаунта Google: любой
// google<код>.html со строкой своего же имени проходит — рядом с файлом владельца, вместо него, сколько угодно штук.
// mirror такие имена не стирает (-x), пересчёт не считает: чужой файл остаётся на сервере навсегда, а его хозяин —
// подтверждённый владелец сайта в Search Console (данные поиска, удаление адресов из выдачи). До П113 такой файл
// рядом с нашей выкладкой был стопом «записи, которых нет ни в этой сборке…».
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { SV, VERKH, NASH, KOREN_NASH, FIND_NASH, GOOGLE, STROKA, distNash, rabochaya, komanda, vyvod, shag, isklyucheniyaMirror, mirrorKoren } from './obshchee-o.mjs';

const { papka, pereschet } = SV;
const CHUZHOY = 'googlefedcba9876543210.html';
const stroki = [];
const dist = distNash('o2-dist');

// Прежняя редакция сторожа (9a6a933 — до шага 3) — для сравнения «было/стало»; git show — только чтение.
const w = rabochaya('o2');
const staryi = spawnSync('git', ['-C', 'D:/SEO/cloud/site-generator', 'show', '9a6a933:sites/7thserpent.com/tools/storozha-vykladki.mjs'], { encoding: 'utf8' });
if (staryi.status !== 0) throw new Error(`git show: ${staryi.stderr}`);
mkdirSync(join(w, 'staryi/tools'), { recursive: true });
writeFileSync(join(w, 'staryi/tools/storozha-vykladki.mjs'), staryi.stdout);
const SV0 = await import(pathToFileURL(join(w, 'staryi/tools/storozha-vykladki.mjs')).href);

const SLUCHAI = [
  ['Ч1 рядом с файлом владельца — файл чужого аккаунта со своей строкой', [GOOGLE, CHUZHOY], { [GOOGLE]: STROKA(GOOGLE), [CHUZHOY]: STROKA(CHUZHOY) }],
  ['Ч2 файла владельца нет — только чужой (файл заменён)', [CHUZHOY], { [CHUZHOY]: STROKA(CHUZHOY) }],
  ['Ч3 пять файлов подтверждения разных аккаунтов', [GOOGLE, CHUZHOY, 'google1111111111111111.html', 'google2222222222222222.html', 'googleaaaaaaaaaaaaaaaa.html'], null],
];
let opasnyh = 0;
for (const [chto, imena, sk] of SLUCHAI) {
  const skachano = sk ?? Object.fromEntries(imena.map((n) => [n, STROKA(n)]));
  const koren = KOREN_NASH() + imena.map((n) => `${n}\n`).join('');
  const r = papka(koren, NASH, VERKH, null, skachano);
  const r0 = SV0.papka(koren, NASH, VERKH, null);
  const chuzhie = imena.filter((n) => n !== GOOGLE);
  const opasno = r.ok && chuzhie.length > 0;
  if (opasno) opasnyh += 1;
  stroki.push(`${chto}: ${r.ok ? 'ПРОХОД' : 'СТОП'}${opasno ? ' — ОПАСНЫЙ ПРОХОД (чужой файл подтверждения)' : ''}`);
  stroki.push(`    сторож (f57bbb9): ${r.stroki.join(' | ')}`);
  stroki.push(`    сторож до П113 (9a6a933): ${r0.ok ? 'ПРОХОД' : 'СТОП'} — ${r0.stroki.join(' | ').slice(0, 160)}…`);
  // mirror и пересчёт: чужие файлы остаются, пересчёт зелёный.
  const zapisi = koren.split('\n').filter((s) => s && s !== './' && s !== '../');
  const m = mirrorKoren(zapisi, VERKH, isklyucheniyaMirror(shag('Выкладка по FTPS').run), 'А');
  const pr = pereschet(FIND_NASH() + imena.map((n) => `./${n}\n`).join(''), dist);
  stroki.push(`    модель mirror (вариант А): не тронет ${m.ostavit.filter((z) => z.startsWith('google')).join(', ')}; пересчёт после: ${pr.ok ? 'ПРОХОД' : 'СТОП'} — ${pr.stroki[0]}`);
}

// Командой, как в workflow: корень, скачанные копии, dist.
const kd = join(w, 'komanda');
mkdirSync(join(kd, 'remote-top'), { recursive: true });
writeFileSync(join(kd, 'remote-root.txt'), KOREN_NASH() + `${GOOGLE}\n${CHUZHOY}\n`);
writeFileSync(join(kd, 'remote-top', 'index.html'), NASH);
writeFileSync(join(kd, 'remote-top', GOOGLE), STROKA(GOOGLE));
writeFileSync(join(kd, 'remote-top', CHUZHOY), STROKA(CHUZHOY));
const k = komanda('papka', join(kd, 'remote-root.txt'), join(kd, 'remote-top', 'index.html'), dist, join(kd, 'remote-top', 'sitemap-0.xml'), join(kd, 'remote-top'));
stroki.push(`команда papka (Ч1): код ${k.kod} — ${k.vyvod}`);
stroki.push(`ИТОГ: опасных проходов ${opasnyh} из ${SLUCHAI.length}; до П113 все ${SLUCHAI.length} — стоп. Отличить «свой» файл сторож не может: имя владельца нигде не записано, а число файлов не ограничено.`);
vyvod('SV25-O-2-vyvod.txt', stroki);
