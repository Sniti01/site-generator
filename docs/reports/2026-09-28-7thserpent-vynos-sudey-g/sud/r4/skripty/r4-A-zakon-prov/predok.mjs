// R4-A-Z-3 до раунда 3: core/text на 0e1add1^ (git show), те же мои мутации K7, K8, K9, тесты того коммита.
import { writeFileSync, mkdirSync, existsSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const REPO = 'D:/SEO/cloud/site-generator';
const NM = join(REPO, 'node_modules');
const SCR = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const ZDES = join(SCR, 'r4/r4-A-zakon-prov');
const DIST = join(SCR, 'ref/dist-7th-3b78f28');
const faily = execFileSync('git', ['-C', REPO, 'ls-tree', '--name-only', '0e1add1^', 'core/text/'], { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.mjs'));
const P = {
  P0: null,
  P7: ['if (d[i] >= n ||', 'if (d[i] > 1e9 ||'],
  P8: ['(i && !(h[i] > h[i - 1]))', 'false'],
  P9: ['if (h.length !== d.length) return null;', ''],
};
for (const [imya, z] of Object.entries(P)) {
  const koren = join(ZDES, 'predok', imya);
  const text = join(koren, 'text');
  mkdirSync(text, { recursive: true });
  if (!existsSync(join(koren, 'node_modules'))) symlinkSync(NM, join(koren, 'node_modules'), 'junction');
  for (const f of faily) {
    let s = execFileSync('git', ['-C', REPO, 'show', `0e1add1^:${f}`], { encoding: 'utf8' });
    if (z && f.endsWith('/corpus.mjs')) {
      const n = s.split(z[0]).length - 1;
      if (n !== 1) throw new Error(`${imya}: найдено ${n}`);
      s = s.replace(z[0], z[1]);
    }
    writeFileSync(join(text, f.split('/').at(-1)), s);
  }
  const r = spawnSync(process.execPath, [join(SCR, 'testy.mjs'), DIST, join(text, 'corpus.test.mjs')], { encoding: 'utf8' });
  const out = r.stdout + r.stderr;
  console.log(`${imya}: pass ${/ℹ pass (\d+)/.exec(out)?.[1]} fail ${/ℹ fail (\d+)/.exec(out)?.[1]}`);
}
