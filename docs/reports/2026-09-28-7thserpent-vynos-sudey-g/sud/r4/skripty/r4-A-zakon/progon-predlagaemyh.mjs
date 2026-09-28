// Предлагаемые тесты — на копии текущего кода (M0) и на мутациях (папки mut/ от mutacii.mjs).
import { copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-A-zakon';
const SCR = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const DIST = join(SCR, 'ref/dist-7th-3b78f28');
const PAPKI = ['M0_kontrol', 'M1_meta_vetka_snyata', 'M5_pustyh_diapazon_snyat', 'M7_nomer_dokumenta_snyat', 'M8_poryadok_snyat', 'M9_dliny_snyaty', 'M13_uborka_tmp_snyata', 'M14_vozrast_tmp_snyat', 'M15_proverka_versii_snyata', 'M16_klyuch_po_diskovoy_versii'];
for (const p of PAPKI) {
  const text = join(ZDES, 'mut', p, 'text');
  copyFileSync(join(ZDES, 'predlagaemye.test.mjs'), join(text, 'predlagaemye.test.mjs'));
  const r = spawnSync(process.execPath, [join(SCR, 'testy.mjs'), DIST, join(text, 'predlagaemye.test.mjs')], { encoding: 'utf8' });
  const out = r.stdout + r.stderr;
  writeFileSync(join(ZDES, 'mut', p, 'vyvod-predlagaemyh.txt'), out);
  const krasnye = [...out.matchAll(/^✖ (.+?) \(\d/gm)].map((x) => x[1]);
  console.log(`${p}: pass ${/ℹ pass (\d+)/.exec(out)?.[1]} fail ${/ℹ fail (\d+)/.exec(out)?.[1]}${krasnye.length ? ' — ' + [...new Set(krasnye)].map((s) => s.slice(0, 40)).join(' | ') : ''}`);
}
