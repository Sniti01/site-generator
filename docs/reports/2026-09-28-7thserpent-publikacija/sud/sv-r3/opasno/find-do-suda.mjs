// SV3-O-4: `find .` (раунд 2, SV2-O-3) стоит в шаге сторожа папки ДО `papka` — полный рекурсивный обход того,
// что видит робот, идёт раньше суда «чей это корень». При роботе с корнем аккаунта (главный логин вместо робота —
// ровно случай, ради которого сторож папки есть) lftp обходит все сайты, почту и журналы аккаунта; ошибка доступа
// к любой подпапке идёт в stderr, то есть в публичный журнал, с путём (имя домена аккаунта), и при cmd:fail-exit
// роняет шаг раньше ясного отказа сторожа. Сторож папки имена доменов нарочно не печатает — только их число.
// Порядок — из файла workflow (разбор строк, без YAML-библиотеки); поведение lftp — не воспроизведено (lftp нет).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO, SV, VERKH, vyvod } from './obshchee.mjs';

const wf = readFileSync(join(REPO, '.github/workflows/deploy-7thserpent.yml'), 'utf8').split('\n');
const nomer = (kusok) => wf.findIndex((s) => s.includes(kusok)) + 1;
const stroki = [];
const nFind = nomer('find .; bye" > remote-before.txt');
const nCls = nomer('cls -1 -a -F; bye" > remote-root.txt');
const nPapka = nomer('storozha-vykladki.mjs papka');
const nIndeks = nomer('storozha-vykladki.mjs indeks');
stroki.push(`workflow: cls — строка ${nCls}; find . > remote-before.txt — строка ${nFind}; papka — строка ${nPapka}; indeks — строка ${nIndeks}`);
stroki.push(`find . раньше papka: ${nFind < nPapka ? 'ДА' : 'нет'}; раньше indeks: ${nFind < nIndeks ? 'ДА' : 'нет'}`);
// Корень аккаунта — сторожу папки хватает cls: отказ по папкам доменов, без обхода и без имён.
const koren = './\n../\n.ssh/\n7dtd.com.pl/\n1weekinvr.com/\nac4bf-thewatch.com/\n7thserpent.com/\nmail/\nlogs/\ntmp/\n';
const p = SV.papka(koren, null, VERKH);
stroki.push(`корень аккаунта: papka по одному cls — ${p.ok ? 'проход' : 'отказ'} | ${p.stroki[0]}`);
stroki.push(`имена доменов в строке сторожа: ${['7dtd.com.pl', '1weekinvr.com', 'ac4bf-thewatch.com'].filter((d) => p.stroki.join(' ').includes(d)).join(', ') || 'нет'}`);
stroki.push('ИТОГ: до этого отказа workflow уже выполнил find . по всему аккаунту; его ошибки (если есть) — в журнале с путями; не воспроизведено: lftp и сервера нет');
vyvod('find-do-suda', stroki);
