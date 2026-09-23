#!/usr/bin/env node
// Сверка «фронтматтер DESIGN.md = src/styles/global.css» — под раскладку и прозу DESIGN.md второго
// сайта (7thserpent.com); на первом сайте даёт ложные тревоги формы записи (см. ПРЕДЕЛЫ).
//   node sverka-design.mjs <папка сайта>          — сверка, exit 1 при расхождении
//   node sverka-design.mjs <папка сайта> --selftest — пробы подменой на живых файлах
// Сессия 8 второго сайта (П75): замена скрипта сессии 7, не сохранённого в репозитории.
// Что сверяется (обе стороны — «цвет, роль или ступень, отсутствующие во фронтматтере,
// в CSS не появляются», шапка фронтматтера DESIGN.md):
//   colors      — каждый ключ = --<ключ> в :root; hex — ещё и = --color-<ключ> в @theme;
//                 каждый цветовой токен :root (hex или rgb()) и каждый --color-* @theme — во фронтматтере;
//   typography  — каждая роль = правило .t-<роль>: font-family (var(--font-*) раскрыт по @theme),
//                 font-size, font-weight, line-height, letter-spacing (нет в CSS = "normal");
//                 каждая роль .t-* в CSS — во фронтматтере;
//   rounded     — = --radius-<ключ>; spacing — = --space-<ключ>, и каждая ступень --space-* — во фронтматтере;
//   капслок     — роли с text-transform: uppercase в CSS = роли, помеченные «капслок» в разделе
//                 «### Hierarchy» прозы DESIGN.md (во фронтматтере регистра нет — схема его не несёт).
// Громко, не молча (раунд 1 «судью судят», сессия 8): роль .t-* упомянута в CSS больше одного раза
// (список селекторов, потомок, @media, @layer — переопределение вне своего правила); второй блок
// :root или @theme; токен палитры, шрифта, шкалы или радиуса объявлен повторно вне своего блока.
// ПРЕДЕЛЫ (названы, не чинятся): значения сравниваются как строки после приведения регистра,
// пробелов и кавычек — равные по смыслу записи разной формы (#abc и #aabbcc, rgb с запятыми
// и с косой чертой, 1.0 и 1) дают ЛОЖНОЕ расхождение, а не ложное совпадение; цвета не в hex/rgb
// (oklch, hsl, именованные, color-mix) в :root обратной стороной не ловятся; шорткат `font:` в роли
// не разбирается. Бегущие --era*, --shadow-lift, геометрия и движение — токены без схемы
// фронтматтера, не сверяются. Сверка читает только src/styles/global.css — не @import'ы и не
// <style> компонентов (там на живом сайте есть, например, .t-lead в index.astro — цвет и отступ,
// не типографика роли). Счёт упоминаний роли текстовый: .t-x в строке или url() даст ложную
// тревогу (громко, не молча). Капслок — только text-transform: uppercase в CSS и слово «капслок»
// внутри скобки роли в разделе «### Hierarchy» (без «не»/«без» перед ним); font-variant-caps,
// capitalize и «Правило капслока» из Named Rules не сверяются. Вложенное правило в теле роли
// (@media, &:hover) — расхождение «вложенное правило» (раунд 2 «судью судят»).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../../../../node_modules/yaml/dist/index.js';

const norm = (v) => String(v).trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').replace(/"/g, "'");

function bezKomentarzy(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function blok(css, re) {
  const m = re.exec(css);
  if (!m) return null;
  let d = 0;
  const start = m.index + m[0].length - 1;
  for (let k = start; k < css.length; k++) {
    if (css[k] === '{') d++;
    if (css[k] === '}') { d--; if (d === 0) return css.slice(start + 1, k); }
  }
  return null;
}

function deklaracje(body) {
  const out = new Map();
  for (const part of body.split(';')) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (!k) continue;
    if (out.has(k)) out.set(k, out.get(k) + ' ‖ ' + v); // повтор — видно в сверке
    else out.set(k, v);
  }
  return out;
}

export function sverka(designText, cssText) {
  const fm = designText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) throw new Error('нет фронтматтера в DESIGN.md');
  const d = parse(fm[1]);
  const css = bezKomentarzy(cssText);
  const themeBody = blok(css, /^[ \t]*@theme(?:\s+\w+)*\s*\{/m);
  const rootBody = blok(css, /^[ \t]*:root\s*\{/m);
  if (themeBody === null || rootBody === null) throw new Error('нет блока @theme или :root');
  const theme = deklaracje(themeBody);
  const root = deklaracje(rootBody);
  const zle = [];
  let sprawdzono = 0;
  // Второй блок :root или @theme переопределил бы значения мимо сверки.
  // Любой блок, в селекторе которого есть :root (`:root {`, `:root, :host {`, `html:root {`,
  // `:root` внутри @media), — раунд 2: прежний счёт видел только строку «:root {».
  const ileRoot = (css.match(/:root\b[^{};]*\{/g) ?? []).length;
  const ileTheme = (css.match(/^[ \t]*@theme(?:\s+\w+)*\s*\{/gm) ?? []).length;
  if (ileRoot > 1) zle.push(`:root: блоков ${ileRoot} — сверка читает первый, остальные её обходят`);
  if (ileTheme > 1) zle.push(`@theme: блоков ${ileTheme} — сверка читает первый, остальные её обходят`);
  // Повторное объявление сверяемого токена где угодно (html { --bg: … }, @media, второй блок).
  const ileRaz = (name) => (css.match(new RegExp('--' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:', 'g')) ?? []).length;
  const eq = (co, a, b) => { sprawdzono++; if (norm(a) !== norm(b)) zle.push(`${co}: DESIGN.md «${a}» ≠ CSS «${b}»`); };

  // colors
  const colors = d.colors ?? {};
  for (const [k, v] of Object.entries(colors)) {
    if (ileRaz(k) > 1) zle.push(`--${k}: объявлен в CSS ${ileRaz(k)} раза — переопределение вне :root сверка не судит`);
    if (/^#/.test(String(v)) && ileRaz('color-' + k) > 1) zle.push(`--color-${k}: объявлен в CSS ${ileRaz('color-' + k)} раза`);
    if (!root.has('--' + k)) { zle.push(`colors.${k}: нет --${k} в :root`); continue; }
    eq(`colors.${k} (:root)`, v, root.get('--' + k));
    if (/^#/.test(String(v))) {
      if (!theme.has('--color-' + k)) zle.push(`colors.${k}: нет --color-${k} в @theme`);
      else eq(`colors.${k} (@theme)`, v, theme.get('--color-' + k));
    }
  }
  for (const [k, v] of root) {
    if (!/^(#|rgb)/i.test(v)) continue;
    const name = k.replace(/^--/, '');
    if (/^era/.test(name)) continue;
    if (!(name in colors)) zle.push(`:root ${k}: цвет в CSS, которого нет во фронтматтере`);
  }
  for (const f of ['font-display', 'font-text']) if (ileRaz(f) > 1) zle.push(`--${f}: объявлен в CSS ${ileRaz(f)} раза — переопределение вне @theme сверка не судит`);
  for (const k of theme.keys()) {
    if (!k.startsWith('--color-')) continue;
    const name = k.slice('--color-'.length);
    if (!(name in colors)) zle.push(`@theme ${k}: цвет в CSS, которого нет во фронтматтере`);
  }

  // typography
  const fonts = { 'var(--font-display)': theme.get('--font-display'), 'var(--font-text)': theme.get('--font-text') };
  const typo = d.typography ?? {};
  // Правило роли начинается с начала строки или сразу после `}` прежнего правила;
  // `}` берётся просмотром назад, не захватом — иначе глобальный поиск съедает
  // закрывающую скобку и пропускает каждую вторую роль (найдено первой пробой).
  const roleRe = /(?<=^|\})\s*\.t-([a-z0-9-]+)\s*\{([^}]*)\}/gm;
  const cssRoles = new Map();
  let m;
  while ((m = roleRe.exec(css)) !== null) {
    if (cssRoles.has(m[1])) zle.push(`.t-${m[1]}: роль объявлена в CSS дважды`);
    // Тело роли обрывается на первой «}»: «{» внутри — вложенное правило (@media, &:hover),
    // которое переопределяет роль мимо сверки (раунд 2).
    if (m[2].includes('{')) zle.push(`.t-${m[1]}: вложенное правило в теле роли — сверка его не судит`);
    cssRoles.set(m[1], deklaracje(m[2]));
  }
  // Упоминание роли в любом другом селекторе (список, @media, @layer, потомок, псевдокласс) —
  // видно громко, а не молча мимо сверки: роль обязана встречаться в CSS ровно один раз.
  const wzmianki = new Map();
  for (const x of css.matchAll(/\.t-([a-z0-9-]+)(?![a-z0-9-])/g)) wzmianki.set(x[1], (wzmianki.get(x[1]) ?? 0) + 1);
  for (const [r, n] of wzmianki) {
    if (!cssRoles.has(r)) zle.push(`.t-${r}: упомянута в CSS, но не отдельным правилом роли — сверка её не видит`);
    else if (n > 1) zle.push(`.t-${r}: упомянута в CSS ${n} раза — переопределение вне своего правила сверка не судит`);
  }
  // Капслок: во фронтматтере регистра нет, судья — раздел «### Hierarchy» прозы DESIGN.md.
  const hier = designText.split(/^### Hierarchy\s*$/m)[1]?.split(/^#{2,3} /m)[0] ?? '';
  if (!hier) zle.push('DESIGN.md: нет раздела «### Hierarchy» — капслок не сверить');
  // Только внутри скобки роли «(`{typography.X}` … )», слово «капслок» любым регистром и без
  // «не»/«без» перед ним (раунд 2: голая подстрока засчитывала «не капслок»).
  const kapsProza = new Set();
  for (const x of hier.matchAll(/\(`\{typography\.([a-z0-9-]+)\}`([^)]*)\)/g)) {
    if (/(^|[^а-яё])капслок/i.test(x[2]) && !/(не|без)\s+капслок/i.test(x[2])) kapsProza.add(x[1]);
  }
  // Повтор text-transform в роли — склейка «a ‖ b»: тогда не капслок, а расхождение (раунд 2).
  const kapsCss = new Set();
  for (const [r, dd] of cssRoles) {
    const tt = dd.get('text-transform');
    if (tt === undefined) continue;
    if (tt.includes('‖')) { zle.push(`.t-${r}: text-transform объявлен в роли дважды («${tt}»)`); continue; }
    if (norm(tt) === 'uppercase') kapsCss.add(r);
  }
  for (const r of new Set([...kapsProza, ...kapsCss])) {
    sprawdzono++;
    if (kapsProza.has(r) !== kapsCss.has(r)) zle.push(`капслок .t-${r}: DESIGN.md «${kapsProza.has(r) ? 'капслок' : 'обычный регистр'}» ≠ CSS «${kapsCss.has(r) ? 'uppercase' : 'без text-transform'}»`);
  }
  const pola = [['fontFamily', 'font-family'], ['fontSize', 'font-size'], ['fontWeight', 'font-weight'], ['lineHeight', 'line-height'], ['letterSpacing', 'letter-spacing']];
  for (const [role, spec] of Object.entries(typo)) {
    const r = cssRoles.get(role);
    if (!r) { zle.push(`typography.${role}: нет правила .t-${role}`); continue; }
    for (const [fk, ck] of pola) {
      let cv = r.get(ck);
      if (ck === 'letter-spacing' && cv === undefined) cv = 'normal';
      if (ck === 'font-family' && cv in fonts) cv = fonts[cv];
      if (cv === undefined) { zle.push(`typography.${role}.${fk}: нет ${ck} в .t-${role}`); continue; }
      eq(`typography.${role}.${fk}`, spec[fk], cv);
    }
  }
  for (const role of cssRoles.keys()) if (!(role in typo)) zle.push(`.t-${role}: роль в CSS, которой нет во фронтматтере`);

  // rounded, spacing
  for (const [k, v] of Object.entries(d.rounded ?? {})) {
    if (ileRaz('radius-' + k) > 1) zle.push(`--radius-${k}: объявлен в CSS ${ileRaz('radius-' + k)} раза`);
    if (!root.has('--radius-' + k)) { zle.push(`rounded.${k}: нет --radius-${k}`); continue; }
    eq(`rounded.${k}`, v, root.get('--radius-' + k));
  }
  const spacing = d.spacing ?? {};
  for (const [k, v] of Object.entries(spacing)) {
    if (ileRaz('space-' + k) > 1) zle.push(`--space-${k}: объявлен в CSS ${ileRaz('space-' + k)} раза`);
    if (!root.has('--space-' + k)) { zle.push(`spacing.${k}: нет --space-${k}`); continue; }
    eq(`spacing.${k}`, v, root.get('--space-' + k));
  }
  for (const k of root.keys()) if (k.startsWith('--space-') && !(k.slice(8) in spacing)) zle.push(`${k}: ступень в CSS, которой нет во фронтматтере`);

  return { sprawdzono, zle };
}

const [, , site, flag] = process.argv;
if (site) {
  const designText = readFileSync(join(site, 'DESIGN.md'), 'utf8');
  const cssText = readFileSync(join(site, 'src/styles/global.css'), 'utf8');
  if (flag === '--selftest') {
    const proby = [];
    // Проба засчитывается, только если подмена действительно что-то поменяла
    // и сверка назвала ИМЕННО её (подстрока ожидаемого расхождения), а живые
    // файлы дают ноль: «хотя бы одно расхождение» проходило бы на любом фоне.
    const proba = (nazwa, dT, cT, ozhidaem) => {
      let r;
      const zmienione = dT !== designText || cT !== cssText;
      try { r = sverka(dT, cT); } catch (e) { r = { zle: ['исключение: ' + e.message] }; }
      const ok = ozhidaem === null
        ? r.zle.length === 0
        : zmienione && r.zle.some((z) => z.includes(ozhidaem));
      proby.push(ok);
      const pometka = ozhidaem === null
        ? (zmienione ? ' (подмена, которая расхождений давать не должна)' : ' (без подмены)')
        : zmienione ? '' : ' (подмена не сработала)';
      console.log(`${ok ? 'ok  ' : 'ŹLE '} ${nazwa} — расхождений ${r.zle.length}${pometka}${r.zle.length ? ': ' + r.zle.join(' | ') : ''}`);
    };
    proba('живые файлы', designText, cssText, null);
    proba('hex в :root подменён', designText, cssText.replace(/(:root\s*\{[\s\S]*?--bg:\s*)#[0-9a-f]{6}/i, '$1#000001'), 'colors.bg (:root)');
    proba('hex в @theme подменён', designText, cssText.replace(/--color-accent:\s*#[0-9a-f]{6}/i, '--color-accent: #000001'), 'colors.accent (@theme)');
    proba('разрядка headline в DESIGN.md', designText.replace(/(headline:[\s\S]*?letterSpacing:\s*)"[^"]*"/, '$1"0.02em"'), cssText, 'typography.headline.letterSpacing');
    proba('разрядка headline в CSS', designText, cssText.replace(/(\.t-headline\s*\{[\s\S]*?letter-spacing:\s*)0\.05em/, '$10.02em'), 'typography.headline.letterSpacing');
    proba('разрядка последней роли', designText, cssText.replace(/(\.t-button\s*\{[\s\S]*?letter-spacing:\s*)0\.06em/, '$10.07em'), 'typography.button.letterSpacing');
    proba('кегль второй роли подряд', designText, cssText.replace(/(\.t-title\s*\{[\s\S]*?font-size:\s*)1\.3125rem/, '$11.3rem'), 'typography.title.fontSize');
    proba('гарнитура заголовка в @theme', designText, cssText.replace(/--font-display:\s*'Bodoni Moda'/, "--font-display: 'Cinzel'"), 'typography.headline.fontFamily');
    proba('цвет в CSS без фронтматтера', designText, cssText.replace(/(:root\s*\{)/, '$1\n  --lishnij: #123456;'), ':root --lishnij');
    proba('роль в CSS без фронтматтера', designText, cssText + '\n.t-lishnyaya {\n  font-size: 1rem;\n}\n', '.t-lishnyaya');
    proba('роль только в списке селекторов', designText, cssText + '\n.x, .t-spisok {\n  font-size: 1rem;\n}\n', '.t-spisok');
    proba('ступень шкалы подменена', designText, cssText.replace(/--space-md:\s*24px/, '--space-md: 20px'), 'spacing.md');
    proba('rgb волоса подменён', designText, cssText.replace(/--hairline:\s*rgb\([^)]*\)/, '--hairline: rgb(1 2 3 / 0.12)'), 'colors.hairline');
    proba('цвет убран из фронтматтера', designText.replace(/^\s*danger:.*$/m, ''), cssText, ':root --danger');
    // раунд 1 «судью судят», сессия 8: переопределения мимо своего правила
    proba('роль переопределена в @media', designText, cssText + '\n@media (min-width: 900px) {\n  .t-headline {\n    letter-spacing: 0.1em;\n  }\n}\n', '.t-headline: упомянута в CSS 2 раза');
    proba('роль переопределена потомком', designText, cssText + '\n.hero .t-lead {\n  font-size: 2rem;\n}\n', '.t-lead: упомянута в CSS 2 раза');
    proba('второй блок :root', designText, cssText + '\n:root {\n  --bg: #ffffff;\n}\n', ':root: блоков 2');
    proba('токен переопределён в html {}', designText, cssText + '\nhtml {\n  --bg: #ffffff;\n}\n', '--bg: объявлен в CSS 2 раза');
    proba('гарнитура переопределена в :root', designText, cssText.replace(/(:root\s*\{)/, "$1\n  --font-display: 'Cinzel', serif;"), '--font-display: объявлен в CSS 2 раза');
    proba('капслок снят с роли в CSS', designText, cssText.replace(/(\.t-label\s*\{[\s\S]*?)text-transform:\s*uppercase;/, '$1'), 'капслок .t-label');
    proba('капслок снят с роли в прозе', designText.replace(/(\{typography\.headline\}`, Бодони, )капслок/, '$1обычный регистр'), cssText, 'капслок .t-headline');
    // раунд 2 «судью судят», сессия 8
    proba('повтор text-transform: none в роли', designText, cssText.replace(/(\.t-label\s*\{[\s\S]*?text-transform:\s*uppercase;)/, '$1\n  text-transform: none;'), 'text-transform объявлен в роли дважды');
    proba('«не капслок» в прозе при uppercase в CSS', designText.replace(/(\{typography\.label\}`, )капслок/, '$1не капслок'), cssText, 'капслок .t-label');
    proba('«Капслок» с прописной в прозе', designText.replace(/(\{typography\.micro\}`, )капслок/, '$1Капслок'), cssText, null);
    proba('вложенный @media в теле роли', designText, cssText.replace(/(\.t-headline\s*\{)/, '$1\n  @media (min-width: 900px) { letter-spacing: 0.3em; }'), 'вложенное правило в теле роли');
    proba('блок «:root, :host» с новым цветом', designText, cssText + '\n:root,\n:host {\n  --glow: #ff0000;\n}\n', ':root: блоков 2');
    const bad = proby.filter((x) => !x).length;
    console.log(`\n${proby.length - bad}/${proby.length} проб`);
    process.exit(bad ? 1 : 0);
  }
  const { sprawdzono, zle } = sverka(designText, cssText);
  for (const z of zle) console.log('РАСХОЖДЕНИЕ ' + z);
  console.log(`DESIGN.md = global.css: сверено значений ${sprawdzono}, расхождений ${zle.length}`);
  process.exit(zle.length ? 1 : 0);
}
