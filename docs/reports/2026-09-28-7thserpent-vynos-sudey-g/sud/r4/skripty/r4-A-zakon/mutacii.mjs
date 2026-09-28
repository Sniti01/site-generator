// Мутации правок раунда 3 (блок А): копия core/text в своей папке, одна подмена на копию,
// тесты копии через запускатель testy.mjs. Модуль в репозитории не трогается.
// node mutacii.mjs [имя мутации ...]
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO_TEXT = 'D:/SEO/cloud/site-generator/core/text';
const NM = 'D:/SEO/cloud/site-generator/node_modules';
const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-A-zakon';
const SCR = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const DIST = join(SCR, 'ref/dist-7th-3b78f28');

const MUTACII = {
  M0_kontrol: ['corpus.mjs', '/** Ошибка корпуса: судить не по чему (итог судьи не выдаётся). */', '/** Ошибка корпуса: судить не по чему (итог судьи не выдаётся). */'],
  M1_meta_vetka_snyata: ['corpus.mjs', 'const poMeta = m ? dekoder(m[1]) : null;', 'const poMeta = null;'],
  M2_utf8_proverka_snyata: ['corpus.mjs', "return new TextDecoder('utf-8', { fatal: true }).decode(bajty);", 'throw 0;'],
  M3_granica_body_snyata: ['corpus.mjs', ".toString('latin1').split(/<body\\b/i)[0];", ".toString('latin1');"],
  M4_klyuch_v_fajle_snyat: ['corpus.mjs', 'if (k?.klyuch !== klyuch) return null;', ''],
  M5_pustyh_diapazon_snyat: ['corpus.mjs', ' || k.pustyh < 0 || k.pustyh > n', ''],
  M6_pustoy_rezhim_snyat: ['corpus.mjs', 'if (!h.length || h.length !== d.length) return null;', 'if (h.length !== d.length) return null;'],
  M7_nomer_dokumenta_snyat: ['corpus.mjs', 'if (d[i] >= n || (i && !(h[i] > h[i - 1]))) return null;', 'if (i && !(h[i] > h[i - 1])) return null;'],
  M8_poryadok_snyat: ['corpus.mjs', 'if (d[i] >= n || (i && !(h[i] > h[i - 1]))) return null;', 'if (d[i] >= n) return null;'],
  M9_dliny_snyaty: ['corpus.mjs', 'if (!h.length || h.length !== d.length) return null;', 'if (!h.length) return null;'],
  M10_imena_join: ['corpus.mjs', 'JSON.stringify(imena)', "imena.join('\\n')"],
  M11_realpath_snyat: ['corpus.mjs', 'const put = realpathSync(resolve(papka));', 'const put = resolve(papka);'],
  M12_uborka_prezhnego_formata_snyata: ['corpus.mjs', ' || /^[0-9a-f]{64}\\.json\\.gz$/.test(f)', ''],
  M13_uborka_tmp_snyata: ['corpus.mjs', 'else if (svoy && /\\.tmp$/.test(f) && Date.now() - statSync(p).mtimeMs > 3600 * 1000) unlinkSync(p);', ''],
  M14_vozrast_tmp_snyat: ['corpus.mjs', ' && Date.now() - statSync(p).mtimeMs > 3600 * 1000', ''],
  M15_proverka_versii_snyata: ['corpus.mjs', "else if (fajlKesha && versiya() !== VERSIYA) oshibki.push('исходники core/text менялись после загрузки судьи — кеш не записан');", ''],
  M16_klyuch_po_diskovoy_versii: ['corpus.mjs', "'\\0' + VERSIYA)", "'\\0' + versiya())"],
  M17_twitter_image_alt_snyat: ['extract.mjs', ", 'og:image:alt', 'twitter:image:alt'];", ", 'og:image:alt'];"],
  M18_podtverzhdenie_snyato: ['corpus.mjs', 'return normy(d)[rezhim].some((n) => n.includes(` ${g} `)) ? urls[d] : null;', 'return urls[d];'],
  M19_zapasnaya_utf8: ['corpus.mjs', "(poMeta ?? new TextDecoder('windows-1252'))", "(poMeta ?? new TextDecoder('utf-8'))"],
};

const vybor = process.argv.slice(2);
for (const [imya, [fajl, iz, v]] of Object.entries(MUTACII)) {
  if (vybor.length && !vybor.includes(imya)) continue;
  const koren = join(ZDES, 'mut', imya);
  const text = join(koren, 'text');
  mkdirSync(text, { recursive: true });
  if (!existsSync(join(koren, 'node_modules'))) symlinkSync(NM, join(koren, 'node_modules'), 'junction');
  for (const f of readdirSync(REPO_TEXT).filter((x) => x.endsWith('.mjs'))) copyFileSync(join(REPO_TEXT, f), join(text, f));
  const src = readFileSync(join(text, fajl), 'utf8');
  const n = src.split(iz).length - 1;
  if (n !== 1) {
    console.log(`${imya}: подстрока найдена ${n} раз — мутация не применена`);
    continue;
  }
  writeFileSync(join(text, fajl), src.replace(iz, v));
  const r = spawnSync(process.execPath, [join(SCR, 'testy.mjs'), DIST, join(text, 'corpus.test.mjs'), join(text, 'extract.test.mjs')], { encoding: 'utf8' });
  const out = r.stdout + r.stderr;
  writeFileSync(join(koren, 'vyvod.txt'), out);
  const fail = /ℹ fail (\d+)/.exec(out)?.[1];
  const pass = /ℹ pass (\d+)/.exec(out)?.[1];
  const krasnye = [...out.matchAll(/^✖ (.+?) \(\d/gm)].map((m) => m[1]);
  console.log(`${imya}: pass ${pass} fail ${fail}${krasnye.length ? ' — ' + [...new Set(krasnye)].join(' | ') : ''}`);
}
