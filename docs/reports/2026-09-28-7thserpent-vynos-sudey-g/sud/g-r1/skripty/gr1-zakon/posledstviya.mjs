// GR1-Z: у выживших мутаций — вход, на котором мутант и настоящий судья расходятся (вердикт sverka в памяти).
//   node posledstviya.mjs            — перечень: без мутации и с мутацией (дочерний процесс с крюком)
//   node posledstviya.mjs --rebenok  — один прогон (мутацию ставит крюк из ZNAK_MUTACIYA)
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PLAGIN = pathToFileURL(join(import.meta.dirname, 'plagin.mjs')).href.replace('file:///', '');
const SPISOK = (v) => (css) => css.replace(/--font-display:[^;]*;/, `--font-display: ${v};`);
const VHODY = [
  ['M1', "своя @font-face 'Bodoni Mo\\<перевод строки>da'", (css) => `${css}\n@font-face { font-family: 'Bodoni Mo\\\nda'; src: url(x.woff2); }`],
  ['M3', '@plugin (compile() судьи бросает)', (css) => css.replace("@source not '../content';", `@source not '../content';\n@plugin '${PLAGIN}';`)],
  ['M4', "--font-display: 'Bodoni Moda', inherit", SPISOK("'Bodoni Moda', inherit")],
  ['M4', "--font-display: 'Bodoni Moda', default", SPISOK("'Bodoni Moda', default")],
  ['M6', "--font-display: 'Bodoni Moda', Noto\\ Serif, serif", SPISOK("'Bodoni Moda', Noto\\ Serif, serif")],
  ['M7', "--font-display: 'Bodoni Moda', 'Times\\' New', serif", SPISOK("'Bodoni Moda', 'Times\\' New', serif")],
];
const MUT = {
  M1: { imya: 'M1', iz: "return nl ? '' : c ?? '';", na: "return nl ? ' ' : c ?? '';" },
  M3: { imya: 'M3', iz: 'bledy.push(`гарнитура: Tailwind сайта не собрал', na: 'void (`гарнитура: Tailwind сайта не собрал' },
  M4: { imya: 'M4', iz: "new Set(['initial', 'inherit', 'unset', 'revert', 'revert-layer', 'default'])", na: "new Set(['initial'])" },
  M6: { imya: 'M6', iz: 'const IDENT = ', na: 'const IDENT = /^-?[a-zA-Z_][-\\w]*/; const IDENT_X = ' },
  M7: { imya: 'M7', iz: "j += s[j] === '\\\\' ? 2 : 1;", na: 'j += 1;' },
};

if (process.argv.includes('--rebenok')) {
  const { sverka, wejscie } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
  const baza = wejscie();
  const { pliki } = await sverka({ ...baza, publiczne: null });
  const res = [];
  for (const [m, opis, mut] of VHODY) {
    if (process.env.ZNAK_MUTACIYA && JSON.parse(process.env.ZNAK_MUTACIYA).imya !== m) continue;
    const css = mut(baza.css);
    const { bledy } = await sverka({ ...baza, css, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
    res.push(`${m} ${opis}${css === baza.css ? ' [НЕ ПРИМЕНИЛАСЬ]' : ''}: ${bledy.length ? `ОТКАЗ — ${bledy.join(' || ')}` : 'сверено'}`);
  }
  console.log(res.join('\n'));
} else {
  const KRYUK = pathToFileURL(join(import.meta.dirname, 'kryuk-znak.mjs')).href;
  const { NODE_TEST_CONTEXT, ...ENV } = process.env;
  const out = [];
  const zapusk = (env, argi) => spawnSync(process.execPath, [...argi, import.meta.filename, '--rebenok'], { encoding: 'utf8', env: { ...ENV, ...env } });
  const r0 = zapusk({}, []);
  out.push('== настоящий судья', r0.stdout.trim(), r0.stderr.trim());
  for (const m of Object.values(MUT)) {
    const r = zapusk({ ZNAK_MUTACIYA: JSON.stringify(m) }, ['--import', KRYUK]);
    out.push(`== мутант ${m.imya}`, r.stdout.trim(), r.stderr.trim());
  }
  writeFileSync(join(import.meta.dirname, 'posledstviya.txt'), out.filter(Boolean).join('\n') + '\n');
  console.log(out.filter(Boolean).join('\n'));
}
