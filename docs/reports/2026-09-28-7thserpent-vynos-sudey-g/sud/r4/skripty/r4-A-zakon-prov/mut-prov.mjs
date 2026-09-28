// Проверяющий раунда 4 (r4-A-zakon-prov): свои мутации core/text на копии в своей папке.
// Для каждой: действующие тесты (corpus.test + extract.test) и мои тесты (moi.test.mjs) через testy.mjs.
// node mut-prov.mjs [имена ...]
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const REPO_TEXT = 'D:/SEO/cloud/site-generator/core/text';
const NM = 'D:/SEO/cloud/site-generator/node_modules';
const SCR = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad';
const ZDES = join(SCR, 'r4/r4-A-zakon-prov');
const DIST = join(SCR, 'ref/dist-7th-3b78f28');

// [файл, что, на что] — формулировки свои, не скептика.
const K = {
  K0: [],
  K1_meta_regeks_null: [['corpus.mjs', 'const m = /<meta\\b[^>]*?charset\\s*=\\s*["\']?\\s*([-\\w.:]+)/i.exec(golova);', 'const m = null;']],
  K1b_meta_vsegda_1252: [['corpus.mjs', 'const poMeta = m ? dekoder(m[1]) : null;', "const poMeta = m ? dekoder('windows-1252') : null;"]],
  K5a_pustyh_bolshe_n: [['corpus.mjs', ' || k.pustyh > n)', ')']],
  K5b_pustyh_menshe_0: [['corpus.mjs', ' || k.pustyh < 0', '']],
  K7_nomer_1e9: [['corpus.mjs', 'if (d[i] >= n ||', 'if (d[i] > 1e9 ||']],
  K8_poryadok_false: [['corpus.mjs', '(i && !(h[i] > h[i - 1]))', 'false']],
  K9_dliny_false: [['corpus.mjs', '!h.length || h.length !== d.length', '!h.length']],
  K13_tmp_regeks: [['corpus.mjs', "/\\.tmp$/.test(f)", "/\\.tmpX$/.test(f)"]],
  K14_porog_minus1: [['corpus.mjs', '> 3600 * 1000) unlinkSync(p);', '> -1) unlinkSync(p);']],
  K15_versiya_false: [['corpus.mjs', 'else if (fajlKesha && versiya() !== VERSIYA)', 'else if (false)']],
  K16_klyuch_po_disku: [['corpus.mjs', "'\\0' + VERSIYA)", "'\\0' + versiya())"]],
  K16b_VERSIYA_lenivo: [['corpus.mjs', "'\\0' + VERSIYA)", "'\\0' + versiya())"], ['corpus.mjs', 'else if (fajlKesha && versiya() !== VERSIYA)', 'else if (false)']],
  K10_imena_join: [['corpus.mjs', 'JSON.stringify(imena)', "imena.join('\\n')"]],
  K17_twitter_alt: [['extract.mjs', ", 'og:image:alt', 'twitter:image:alt'];", ", 'og:image:alt'];"]],
  K18_utf16_podmena: [['corpus.mjs', 'const poMeta = m ? dekoder(m[1]) : null;', "let poMeta = m ? dekoder(m[1]) : null; if (poMeta && /^utf-16/.test(poMeta.encoding)) poMeta = new TextDecoder('utf-8'); if (poMeta && poMeta.encoding === 'x-user-defined') poMeta = new TextDecoder('windows-1252');"]],
  K19_uborka_i_pri_keshe: [['corpus.mjs', "if (heshi) return { ...ukazatel(urls, heshi, slovaPoNomeru), izKesha: true, oshibkaKesha: null };", "if (heshi) { try { for (const f of readdirSync(kesh)) { const p = join(kesh, f); if (f.startsWith(`${prefiks}-`) && /\\.tmp$/.test(f) && Date.now() - statSync(p).mtimeMs > 3600 * 1000) unlinkSync(p); } } catch {} return { ...ukazatel(urls, heshi, slovaPoNomeru), izKesha: true, oshibkaKesha: null }; }"]],
};

const vybor = process.argv.slice(2);
for (const [imya, zameny] of Object.entries(K)) {
  if (vybor.length && !vybor.includes(imya)) continue;
  const koren = join(ZDES, 'mut', imya);
  const text = join(koren, 'text');
  mkdirSync(text, { recursive: true });
  if (!existsSync(join(koren, 'node_modules'))) symlinkSync(NM, join(koren, 'node_modules'), 'junction');
  for (const f of readdirSync(REPO_TEXT).filter((x) => x.endsWith('.mjs'))) copyFileSync(join(REPO_TEXT, f), join(text, f));
  copyFileSync(join(ZDES, 'moi.test.mjs'), join(text, 'moi.test.mjs'));
  let ok = true;
  for (const [fajl, iz, v] of zameny) {
    const src = readFileSync(join(text, fajl), 'utf8');
    const n = src.split(iz).length - 1;
    if (n !== 1) {
      console.log(`${imya}: «${iz.slice(0, 40)}» найдено ${n} раз — не применена`);
      ok = false;
      break;
    }
    writeFileSync(join(text, fajl), src.replace(iz, v));
  }
  if (!ok) continue;
  for (const [chto, faily] of [
    ['действующие', [join(text, 'corpus.test.mjs'), join(text, 'extract.test.mjs')]],
    ['мои', [join(text, 'moi.test.mjs')]],
  ]) {
    const r = spawnSync(process.execPath, [join(SCR, 'testy.mjs'), DIST, ...faily], { encoding: 'utf8' });
    const out = r.stdout + r.stderr;
    writeFileSync(join(koren, `vyvod-${chto === 'мои' ? 'moi' : 'deystv'}.txt`), out);
    const fail = /ℹ fail (\d+)/.exec(out)?.[1];
    const pass = /ℹ pass (\d+)/.exec(out)?.[1];
    const krasnye = [...new Set([...out.matchAll(/^✖ (.+?) \(\d/gm)].map((m) => m[1]))];
    console.log(`${imya} [${chto}]: pass ${pass} fail ${fail}${krasnye.length ? ' — ' + krasnye.join(' | ') : ''}`);
  }
}
