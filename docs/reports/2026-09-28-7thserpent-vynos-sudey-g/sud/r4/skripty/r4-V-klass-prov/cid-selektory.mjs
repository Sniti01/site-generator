// Селекторы CSS сборки, где метка области стоит у составного без класса (элемент[метка] или [метка] один) —
// такие правила достают корень svg иконки, если на него добавить метку (исключение kornevyeAtributy, V3-1).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const tablicy = readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(DIST, '_astro', f), 'utf8'));
const stranicy = [];
const obhod = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory() && e.name !== '_astro') obhod(join(d, e.name));
    else if (e.name.endsWith('.html')) stranicy.push(readFileSync(join(d, e.name), 'utf8'));
  }
};
obhod(DIST);
const golovy = stranicy.flatMap((h) => [...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]));
const css = [...tablicy, ...golovy].join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const najdeno = new Map();
for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  for (const sel of m[1].split(',')) {
    // составные селектора — части между комбинаторами
    for (const sost of sel.trim().split(/\s*[\s>+~]\s*/)) {
      if (/\[data-astro-cid-[a-z0-9]+\]/.test(sost) && !/\.[A-Za-z_-]/.test(sost.replace(/\[[^\]]*\]/g, ''))) {
        const k = sost + '   ⇐   ' + sel.trim().slice(0, 120) + ' {' + m[2].slice(0, 80) + '}';
        najdeno.set(k, (najdeno.get(k) ?? 0) + 1);
      }
    }
  }
}
console.log('правил с меткой без класса в составном:', najdeno.size);
for (const k of najdeno.keys()) console.log(k);
