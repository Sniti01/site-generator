// Опыт раунда 3: копия proby-p2.mjs в scratch с порчами четырёх новых страниц (без героя, с byline).
// Отличия копии: yaml — абсолютным путём; файлы содержания — копии HEAD в tresc-head/ (рабочее дерево
// cheats.md сейчас правится ведущим); в массив PORCHI добавлены порчи новых страниц. Репозиторий не трогает.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const HERE = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/4cec3deb-6d32-416d-984b-6302dc5b4d6f/scratchpad/sud/opyt-r3-kopii';
const REPO = 'D:/SEO/cloud/site-generator';
const ORIG = join(REPO, 'docs/reports/2026-09-26-7thserpent-pachka-2/instrumenty/proby-p2.mjs');

// файлы содержания HEAD
mkdirSync(join(HERE, 'tresc-head'), { recursive: true });
const spisok = execFileSync('git', ['ls-tree', '--name-only', 'HEAD', 'sites/7thserpent.com/src/content/tresc/'], { cwd: REPO, encoding: 'utf8' }).trim().split('\n');
for (const p of spisok) {
  const t = execFileSync('git', ['show', 'HEAD:' + p], { cwd: REPO });
  writeFileSync(join(HERE, 'tresc-head', p.split('/').pop()), t);
}
console.log('tresc-head: ' + spisok.length + ' файлов HEAD');

let s = readFileSync(ORIG, 'utf8');
const zam = (iz, na) => {
  const n = s.split(iz).length - 1;
  if (n !== 1) throw new Error('не один раз: ' + iz.slice(0, 60) + ' — ' + n);
  s = s.replace(iz, () => na);
};
zam("await import('yaml')", "await import('file:///D:/SEO/cloud/site-generator/node_modules/yaml/dist/index.js')");
zam("const tresc = join(root, 'src/content/tresc');", `const tresc = '${HERE}/tresc-head';`);
const NOVYE = String.raw`
    { imya: 'контроль /story/', s: st, prichina: null },
    { imya: 'контроль /voice-and-face/', s: vf, prichina: null },
    { imya: 'контроль /cheats/', s: ch, prichina: null },
    { imya: 'контроль /mods/', s: md, prichina: null },
    { imya: 'ПРЕДЕЛ byline перед page-head', s: st, html: (h) => { const b = vzyat(h, BYLINE); return h.replace(b, '').replace('<main id="content">', '<main id="content">' + b); }, prichina: null },
    { imya: 'ПРЕДЕЛ byline в page-head после h1', s: st, html: (h) => { const b = vzyat(h, BYLINE); return h.replace(b, '').replace('</h1></header>', '</h1>' + b + '</header>'); }, prichina: null },
    { imya: 'ПРЕДЕЛ byline: автор перед припиской', s: ch, html: (h) => { const r = vzyat(h, /<span class="byline__role[^"]*"[^>]*>[^<]*<\/span>/); const a = vzyat(h, /<span class="byline__author[^"]*"[^>]*>[^<]*<\/span>/); return h.replace(r + a, a + r); }, prichina: null },
    { imya: 'ПРЕДЕЛ byline: дата перед автором', s: md, html: (h) => { const a = vzyat(h, /<span class="byline__author[^"]*"[^>]*>[^<]*<\/span>/); const t = vzyat(h, /<time\b[^>]*>[^<]*<\/time>/); return h.replace(a + t, t + a); }, prichina: null },
    { imya: 'ПРЕДЕЛ byline без классов вида', s: vf, html: (h) => h.replace('<div class="byline section--light"', '<div class="byline"').replace('class="byline__line t-caption container"', 'class="byline__line"'), prichina: null },
    { imya: 'ПРЕДЕЛ h1 без id и t-headline', s: st, html: (h) => h.replace(/(<header class="page-head[^"]*"[^>]*><h1) class="t-headline" id="page-title"/, '$1'), prichina: null },
    { imya: 'ПРЕДЕЛ page-head без класса container', s: ch, html: (h) => h.replace('<header class="page-head container section"', '<header class="page-head"'), prichina: null },
    { imya: 'byline в page-head перед h1', s: st, html: (h) => { const b = vzyat(h, BYLINE); return h.replace(b, '').replace(/(<header class="page-head[^"]*"[^>]*>)/, '$1' + b); }, prichina: 'без героя h1 не в header.page-head' },
    { imya: 'byline после первого ряда /story/', s: st, html: (h) => { const b = vzyat(h, BYLINE); const r = vzyat(h, RYAD('who-is-max')); return h.replace(b, '').replace(r, r + b); }, prichina: 'подпись после первого ряда' },
    { imya: 'byline в конце main /cheats/', s: ch, html: (h) => { const b = vzyat(h, BYLINE); return h.replace(b, '').replace('</main>', b + '</main>'); }, prichina: 'подпись после первого ряда' },
    { imya: 'byline убрана /voice-and-face/', s: vf, html: (h) => h.replace(BYLINE, ''), prichina: 'подписей 0' },
    { imya: 'byline в подвале /mods/', s: md, html: (h) => { const b = vzyat(h, BYLINE); return h.replace(b, '').replace('</body>', b + '</body>'); }, prichina: 'подписей 0' },
    { imya: 'вторая byline /mods/', s: md, html: (h) => h.replace('</main>', vzyat(h, BYLINE) + '</main>'), prichina: 'подписей 2' },
    { imya: 'datetime другой /story/', s: st, html: (h) => h.replace('datetime="2026-09-26"', 'datetime="2026-09-25"'), prichina: 'datetime 2026-09-25' },
    { imya: 'дата словами другая /cheats/', s: ch, html: (h) => h.replace(/(<time\b[^>]*>)September 26, 2026/, '$1September 25, 2026'), prichina: 'подпись даты' },
    { imya: 'автор другой /voice-and-face/', s: vf, html: (h) => h.replace(/(<span class="byline__author[^"]*"[^>]*>)[^<]*/, '$1Proba'), prichina: 'автор подписи' },
    { imya: 'приписка снята /mods/', s: md, html: (h) => h.replace(/<span class="byline__role[^"]*"[^>]*>[^<]*<\/span>/, ''), prichina: 'приписка подписи' },
    { imya: 'герой без блока /story/', s: st, html: (h) => h.replace('<main id="content">', '<main id="content"><section class="hero"></section>'), prichina: 'герой напечатан' },
    { imya: 'подпись кадра без героя /cheats/', s: ch, html: (h) => h.replace('</main>', '<p class="podpis-geroya t-caption">Proba</p></main>'), prichina: 'напечатана без героя' },
    { imya: 'h1 вынесен из page-head /voice-and-face/', s: vf, html: (h) => h.replace('<header class="page-head', '<div class="page-head'), prichina: 'без героя h1 не в header.page-head' },
    { imya: 'h1 структуры другой /mods/', s: md, page: (p) => { p.h1 += ' proba'; return p; }, prichina: 'h1 структуры' },
    { imya: 'ряд удалён /cheats/', s: ch, html: (h) => h.replace(RYAD('pc-console'), ''), prichina: 'рядов в <main>' },
    { imya: 'абзац ряда изменён /mods/', s: md, html: (h) => { const r = vzyat(h, RYAD('kung-fu-mod')); return h.replace(r, r.replace(/(<div class="layer__body[^"]*"[^>]*>\s*<p\b[^>]*>)/, '$1Proba ')); }, prichina: 'ряд kung-fu-mod: абзацы' },
    { imya: 'содержание новее сборки /cheats/', s: ch, dane: (d) => { d.rows[d.rows.length - 1].body[0] += ' Proba.'; return d; }, prichina: 'абзацы разошлись' },
    { imya: 'нота без кадров /cheats/', s: ch, html: (h) => h.replace('</body>', '<p class="ft__art-note t-caption">Games: Max Payne.</p></body>'), prichina: 'кадров нет, а нота' },
    { imya: 'игра ноты другая /voice-and-face/', s: vf, html: (h) => h.replace('Games: Max Payne 3.', 'Games: Max Payne.'), prichina: 'игры ноты' },
    { imya: 'кадр ряда другой /voice-and-face/', s: vf, html: (h) => h.replace(/(<div class="foto kadr-ryadu"><img\b[^>]*?\ssrc="\/_astro\/)mp3-k10/, '$1mp3-k15'), prichina: 'кадр ряда: в src или srcset ключи mp3-k15' },
    { imya: 'alt кадра ряда другой /story/', s: st, html: (h) => h.replace('alt="Max Payne 3 — Max, bald and bearded', 'alt="Max Payne 3 — Max, bald'), prichina: 'alt' },
    { imya: 'ряд без band /story/', s: st, html: (h) => h.replace(/(<section class="layer section) band\b/, '$1'), prichina: 'класс band' },
`;
zam('  const PORCHI = [\n', "  const st = po('/story/'), vf = po('/voice-and-face/'), ch = po('/cheats/'), md = po('/mods/');\n  const PORCHI = [\n" + NOVYE);
writeFileSync(join(HERE, 'proby-p2-r3kopiya.mjs'), s);
console.log('записана копия: proby-p2-r3kopiya.mjs');
