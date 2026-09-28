// Мутации блока Б раунда 4 («тест не сторожит»): копия модуля и теста в mutacii/<находка>/, импорты — на абсолютные
// file:/// адреса репозитория (кроме самого мутируемого модуля: он — копия рядом), в копии модуля откатывается
// сторожимая строка, копия теста прогоняется запускателем testy.mjs с шаблоном находки. Вывод — krasnye/<находка>.txt,
// первой строкой — какая мутация.   node mutacii-B.mjs [имя мутации ...]
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const S = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const R = 'D:/SEO/cloud/site-generator';
const M = join(S, 'r4/mutacii');
const K = join(S, 'r4/krasnye');
const url = (p) => `file:///${R}/${p}`;

// Замены импортов: [было, стало] — в копиях модуля и теста.
const IMPORTY = {
  head: [["from '../text/html.mjs'", `from '${url('core/text/html.mjs')}'`], ["from '../text/extract.mjs'", `from '${url('core/text/extract.mjs')}'`]],
  schet: [["'../schet-testov.mjs'", "'./schet-testov.mjs'"]],
  kopiya: [["from '../kopiya.mjs'", "from './kopiya.mjs'"]],
  sravnenie: [["from './obshchee.mjs'", `from '${url('sites/7thserpent.com/tools/testy/obshchee.mjs')}'`]],
};

// { imya, nahodki: [шаблоны], chto, modul: [откуда, имя копии, набор импортов], test: [откуда, имя копии, набор], bylo, stalo, dop? }
const MUTACII = [
  {
    imya: 'R4-B-Z-1',
    nahodki: ['R4-B-Z-1', 'R4-B-P-5'],
    chto: 'текст цели aria-labelledby — через tekstVsego, а не tekst прочтения (head.mjs, imyaPoSsylke)',
    modul: ['core/gates/head.mjs', 'head.mjs', 'head'],
    test: ['core/gates/head.test.mjs', 'head.test.mjs', 'head'],
    bylo: '        .map((u) => yarlyk(tekst(u)))\n',
    stalo: '        .map((u) => yarlyk(tekstVsego(u)))\n',
  },
  {
    imya: 'R4-B-Z-4',
    nahodki: ['R4-B-Z-4'],
    chto: 'строка пропуска упавшего набора (subtestsFailed) снята: любой упавший набор — упал (schet-testov.mjs)',
    modul: ['sites/7thserpent.com/tools/schet-testov.mjs', 'schet-testov.mjs', 'schet'],
    test: ['sites/7thserpent.com/tools/testy/schet.test.mjs', 'schet.test.mjs', 'schet'],
    bylo: "      if (nabor && d.details?.error?.failureType === 'subtestsFailed') continue;\n",
    stalo: '',
  },
  {
    imya: 'R4-B-Z-2',
    nahodki: ['R4-B-Z-2'],
    chto: "processZhiv: любой pid жив — return true вместо return e.code === 'EPERM' (kopiya.mjs)",
    modul: ['sites/7thserpent.com/tools/kopiya.mjs', 'kopiya.mjs', 'kopiya'],
    test: ['sites/7thserpent.com/tools/testy/uborka.test.mjs', 'uborka.test.mjs', 'kopiya'],
    bylo: "    return e.code === 'EPERM';\n",
    stalo: '    return true;\n',
  },
  {
    imya: 'R4-B-K-3',
    nahodki: ['R4-B-K-3'],
    chto: 'содержимое группы CSS — только первый файл (fajly.slice(0, 1)) (sravnenie.mjs, sravnitSborki)',
    modul: ['sites/7thserpent.com/tools/testy/sravnenie.mjs', 'sravnenie.mjs', 'sravnenie'],
    test: ['sites/7thserpent.com/tools/testy/sravnenie.test.mjs', 'sravnenie.test.mjs', 'sravnenie'],
    bylo: '  const soderzhimoe = (koren, fajly) => fajly.map(',
    stalo: '  const soderzhimoe = (koren, fajly) => fajly.slice(0, 1).map(',
  },
  {
    imya: 'R4-B-Z-5',
    nahodki: ['R4-B-Z-5'],
    chto: 'прежний Map по имени без хеша: последний файл группы затирает первый (fajly.slice(-1)) (sravnenie.mjs, sravnitSborki)',
    modul: ['sites/7thserpent.com/tools/testy/sravnenie.mjs', 'sravnenie.mjs', 'sravnenie'],
    test: ['sites/7thserpent.com/tools/testy/sravnenie.test.mjs', 'sravnenie.test.mjs', 'sravnenie'],
    bylo: '  const soderzhimoe = (koren, fajly) => fajly.map(',
    stalo: '  const soderzhimoe = (koren, fajly) => fajly.slice(-1).map(',
  },
];

const vybor = process.argv.slice(2);
for (const m of MUTACII.filter((x) => !vybor.length || vybor.includes(x.imya))) {
  const papka = join(M, m.imya);
  rmSync(papka, { recursive: true, force: true });
  mkdirSync(papka, { recursive: true });
  const kopiya = ([otkuda, imya, nabor], mutirovat) => {
    let t = readFileSync(join(R, otkuda), 'utf8');
    for (const [a, b] of IMPORTY[nabor] ?? []) t = t.split(a).join(b);
    if (mutirovat) {
      if (!t.includes(m.bylo)) throw new Error(`мутация ${m.imya} не легла: нет строки`);
      t = t.replace(m.bylo, () => m.stalo);
    }
    writeFileSync(join(papka, imya), t);
  };
  kopiya(m.modul, true);
  kopiya(m.test, false);
  for (const d of m.dop ?? []) kopiya(d, false);
  const kuski = [];
  for (const n of m.nahodki) {
    const r = spawnSync(process.execPath, [join(S, 'testy.mjs'), join(S, 'ref/dist-7th-3b78f28'), join(papka, m.test[1]), `--test-name-pattern=${n}`], { encoding: 'utf8' });
    kuski.push([n, `мутация ${m.imya}: ${m.chto} (копия ${join(papka, m.modul[1])})\n${r.stdout}${r.stderr}\nкод возврата: ${r.status}\n`]);
    console.log(m.imya, n, 'код', r.status);
  }
  for (const [n, t] of kuski) writeFileSync(join(K, `${n}.txt`), t);
}
