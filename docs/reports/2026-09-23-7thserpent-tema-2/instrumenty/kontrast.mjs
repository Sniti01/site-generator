// node kontrast.mjs <site-dir> fg/bg ... — iloraz WCAG po formule bramki (core/gates/check-contrast.mjs)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); return 0.2126 * lin(parseInt(h.slice(0, 2), 16)) + 0.7152 * lin(parseInt(h.slice(2, 4), 16)) + 0.0722 * lin(parseInt(h.slice(4, 6), 16)); };
export const R = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const [, , site, ...pary] = process.argv;
if (site) {
  const css = readFileSync(join(site, 'src/styles/global.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const i = css.search(/^[ \t]*:root\s*\{/m);
  const root = css.slice(i);
  const t = (n) => { if (n.startsWith('#')) return n; const m = root.match(new RegExp('--' + n + ':\\s*(#[0-9a-fA-F]{3,8})\\s*;')); if (!m) throw new Error('нет --' + n); return m[1]; };
  for (const p of pary) {
    const [fg, bg] = p.split('/');
    console.log(`${site.split(/[\\/]/).pop()}  ${fg} ${t(fg)} / ${bg} ${t(bg)}  ${R(t(fg), t(bg)).toFixed(2)}:1`);
  }
}
