// Те же проверки согласованности кеша — на состоянии до коммита 0e1add1 (0e1add1^):
// сторожил ли их тест A2-6 до раунда 3. Файлы — git show (только чтение).
import { writeFileSync, mkdirSync, existsSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';

const REPO = 'D:/SEO/cloud/site-generator';
const NM = join(REPO, 'node_modules');
const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-A-zakon';
const SCR = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const DIST = join(SCR, 'ref/dist-7th-3b78f28');
const FAJLY = ['html.mjs', 'extract.mjs', 'words.mjs', 'corpus.mjs', 'corpus.test.mjs', 'extract.test.mjs'];

const MUTACII = {
  P0_kontrol: null,
  P7_nomer_dokumenta_snyat: ['for (let i = 0; i < h.length; i++) if (d[i] >= n || (i && !(h[i] > h[i - 1]))) return null;', 'for (let i = 0; i < h.length; i++) if (i && !(h[i] > h[i - 1])) return null;'],
  P8_poryadok_snyat: ['for (let i = 0; i < h.length; i++) if (d[i] >= n || (i && !(h[i] > h[i - 1]))) return null;', 'for (let i = 0; i < h.length; i++) if (d[i] >= n) return null;'],
  P9_dliny_snyaty: ['if (h.length !== d.length) return null;', ''],
};
for (const [imya, m] of Object.entries(MUTACII)) {
  const text = join(ZDES, 'mut-predok', imya, 'text');
  mkdirSync(text, { recursive: true });
  if (!existsSync(join(ZDES, 'mut-predok', imya, 'node_modules'))) symlinkSync(NM, join(ZDES, 'mut-predok', imya, 'node_modules'), 'junction');
  for (const f of FAJLY) writeFileSync(join(text, f), execFileSync('git', ['-C', REPO, 'show', `0e1add1^:core/text/${f}`]));
  if (m) {
    const p = join(text, 'corpus.mjs');
    const src = execFileSync('git', ['-C', REPO, 'show', '0e1add1^:core/text/corpus.mjs'], { encoding: 'utf8' });
    const n = src.split(m[0]).length - 1;
    if (n !== 1) {
      console.log(`${imya}: подстрока найдена ${n} раз`);
      continue;
    }
    writeFileSync(p, src.replace(m[0], m[1]));
  }
  const r = spawnSync(process.execPath, [join(SCR, 'testy.mjs'), DIST, join(text, 'corpus.test.mjs')], { encoding: 'utf8' });
  const out = r.stdout + r.stderr;
  writeFileSync(join(ZDES, 'mut-predok', imya, 'vyvod.txt'), out);
  const krasnye = [...out.matchAll(/^✖ (.+?) \(\d/gm)].map((x) => x[1]);
  console.log(`${imya}: pass ${/ℹ pass (\d+)/.exec(out)?.[1]} fail ${/ℹ fail (\d+)/.exec(out)?.[1]}${krasnye.length ? ' — ' + [...new Set(krasnye)].join(' | ') : ''}`);
}
