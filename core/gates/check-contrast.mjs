#!/usr/bin/env node
// Gate: kontrast każdej pary, która naprawdę występuje na stronie.
// DESIGN.md wymaga liczby, nie oka: tekst ≥ 4,5:1, elementy UI ≥ 3:1.
//
// Rachunek jest wspólny dla wszystkich witryn i mieszka tutaj; pary są danymi
// witryny i mieszkają w `<witryna>/gates/contrast.mjs`. Progi bez par nic nie
// znaczą, więc brak pliku danych to błąd bramki, nie jej pominięcie.

import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';

/**
 * CSS bez komentarzy `/* … *\/`. Bramka czyta plik po zdjęciu komentarzy:
 * słowo `:root` w nagłówku-komentarzu witryny 7thserpent.com (2026-09-18)
 * uprowadziło szukanie bloku do bloku motywu — «11 par bez pary» przy
 * pełnej zgodności wartości. Token zapisany w komentarzu też nie jest
 * tokenem: na ekranie go nie ma. Punkt 2 backlogu 52.
 *
 * Skaner zna łańcuchy: `/*` wewnątrz `'…'` albo `"…"` komentarza nie
 * otwiera. Bez tego `@source '../src/*.astro'` połykałby wszystko do
 * najbliższego `*\/` — razem z blokiem `@theme` — i bramka przechodziłaby
 * z zerem par (znalezione w przeglądzie sędziego 2026-09-18). Znacznik BOM
 * z początku pliku też schodzi: kotwica `^[ \t]*` go nie zna.
 */
function bezKomentarzy(css) {
  let out = '';
  let i = 0;
  const s = css.charCodeAt(0) === 0xfeff ? css.slice(1) : css;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < s.length && s[j] !== ch) j += s[j] === '\\' ? 2 : 1;
      out += s.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === '/' && s[i + 1] === '*') {
      const end = s.indexOf('*/', i + 2);
      i = end < 0 ? s.length : end + 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

/**
 * Zbiera `--nazwa: #hex;` z całego pliku.
 *
 * POWTÓRZONA NAZWA JEST BŁĘDEM, nie cichym nadpisaniem. Wcześniej `out.set`
 * zostawiał ostatnie wystąpienie, a wcześniejsze znikało bez śladu: bramka
 * liczyła kontrast wartości, której na ekranie mogło nie być. Zmierzone
 * 2026-09-09 przy rozbiorze §7.4.
 */
function collectTokens(source) {
  const out = new Map();
  const powtorzone = [];
  const re = /--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    if (out.has(m[1]) && out.get(m[1]) !== m[2]) powtorzone.push({ nazwa: m[1], a: out.get(m[1]), b: m[2] });
    else if (out.has(m[1])) powtorzone.push({ nazwa: m[1], a: out.get(m[1]), b: m[2] });
    out.set(m[1], m[2]);
  }
  return { tokens: out, powtorzone };
}

/**
 * Ciało bloku `nagłówek { … }` z dopasowaniem klamer. Nagłówek jest szukany
 * NA POCZĄTKU WIERSZA i musi otwierać klamrę — nie pierwszym wystąpieniem
 * słowa gdziekolwiek w pliku (tamto łapało słowo w komentarzu i selektory
 * pochodne). Bloki: `@theme {`, także `@theme inline {`; `:root {` — goły,
 * bez atrybutów i bez listy selektorów: `:root[data-era] {` to blok epoki,
 * a `:root, html {` czy `html:root {` bramka odrzuca GŁOŚNO (brak bloku),
 * nie po cichu — paleta fabryki zapisana jest gołym `:root {` na obu
 * witrynach i tak ma zostać.
 */
const NAGLOWEK = {
  theme: /^[ \t]*@theme(?:\s+\w+)*\s*\{/m,
  root: /^[ \t]*:root\s*\{/m,
};

function blok(source, naglowek) {
  const m = naglowek.exec(source);
  if (!m) return '';
  const j = m.index + m[0].length - 1;
  let d = 0;
  for (let k = j; k < source.length; k += 1) {
    if (source[k] === '{') d += 1;
    if (source[k] === '}') { d -= 1; if (d === 0) return source.slice(j, k); }
  }
  return '';
}

/**
 * Paleta jest zapisana DWA RAZY: `@theme { --color-X }` dla Tailwinda
 * i `:root { --X }` dla komponentów. Wartości są przepisywane ręcznie, więc
 * muszą się zgadzać — inaczej kontrast liczony jest dla jednej z dwóch prawd.
 * Zmierzone 2026-09-09: par jest 14 i wszystkie się zgadzają; bramka tego
 * nie sprawdzała wcale. Jedno źródło zamiast dwóch — punkt backlogu.
 */
function paryTematu(css) {
  const wyjmij = (tekst) => {
    const m = new Map();
    const re = /--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g;
    let x;
    while ((x = re.exec(tekst)) !== null) m.set(x[1], x[2]);
    return m;
  };
  const blokTematu = blok(css, NAGLOWEK.theme);
  // Pierwszy goły `:root {` w pliku to blok główny; bloki epok idą dalej
  // i mają swoje nazwy, więc nie wchodzą w pary.
  const blokGlowny = blok(css, NAGLOWEK.root);
  // Brak któregoś bloku to błąd, nie «zero par»: zero par przechodziło
  // po cichu, a do zera par prowadzi każde potknięcie szukania.
  const brakBloku = [];
  if (!blokTematu) brakBloku.push('@theme');
  if (!blokGlowny) brakBloku.push(':root');
  const theme = wyjmij(blokTematu);
  const root = wyjmij(blokGlowny);
  const pary = [];
  for (const [nazwa, wartosc] of theme) {
    const bez = nazwa.replace(/^color-/, '');
    if (!root.has(bez)) { pary.push({ nazwa, bez, wartosc, druga: null, zgodne: false }); continue; }
    const druga = root.get(bez);
    pary.push({ nazwa, bez, wartosc, druga, zgodne: druga.toLowerCase() === wartosc.toLowerCase() });
  }
  return { pary, brakBloku };
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export default async function checkContrast(siteRoot) {
  const cssPath = join(siteRoot, 'src/styles/global.css');
  const pairsPath = join(siteRoot, 'gates/contrast.mjs');

  if (!existsSync(pairsPath)) {
    console.error(`BRAK DANYCH: ${pairsPath} nie istnieje — bramka kontrastu nie ma czego liczyć.`);
    return false;
  }

  const css = bezKomentarzy(readFileSync(cssPath, 'utf8'));
  const { tokens, powtorzone } = collectTokens(css);
  const pairs = (await import(pathToFileURL(pairsPath).href)).default;

  let zapis = 0;
  for (const p of powtorzone) {
    console.error(`POWTÓRZONA NAZWA: --${p.nazwa} zapisana dwa razy (${p.a} i ${p.b}) — bramka liczyłaby ostatnią.`);
    zapis += 1;
  }
  const { pary, brakBloku } = paryTematu(css);
  for (const b of brakBloku) {
    console.error(`BRAK BLOKU: w src/styles/global.css nie ma bloku \`${b} {\` na początku wiersza — paleta nie ma czego sprawdzić.`);
    zapis += 1;
  }
  for (const p of pary) {
    if (p.zgodne) continue;
    if (p.druga === null) console.error(`BRAK PARY: --${p.nazwa} w @theme nie ma odpowiednika --${p.bez} w :root.`);
    else console.error(`ROZJECHANA PARA: --${p.nazwa} = ${p.wartosc}, a --${p.bez} = ${p.druga}.`);
    zapis += 1;
  }
  console.log(`Zapis palety: ${pary.length} par @theme/:root, zgodnych ${pary.filter((p) => p.zgodne).length}.`);

  let missing = 0;
  function tok(name) {
    const value = tokens.get(name);
    if (!value) {
      console.error(`BRAK TOKENU: --${name} nie istnieje w src/styles/global.css`);
      missing += 1;
      return '#000000';
    }
    return value;
  }

  let failed = 0;
  const rows = [];

  for (const [fg, bg, min, label] of pairs) {
    const value = ratio(tok(fg), tok(bg));
    const ok = value >= min;
    if (!ok) failed += 1;
    rows.push({ ok, value, min, label, fg, bg });
  }

  const width = Math.max(...rows.map((r) => r.label.length));
  for (const r of rows) {
    const mark = r.ok ? 'ok  ' : 'BŁĄD';
    console.log(
      `${mark} ${r.label.padEnd(width)}  ${r.value.toFixed(2)}:1  (min ${r.min}:1)  --${r.fg} / --${r.bg}`,
    );
  }

  console.log(`\n${rows.length - failed}/${rows.length} par przechodzi.`);
  if (failed > 0) console.error(`Kontrast: ${failed} par poniżej progu.`);
  return failed === 0 && missing === 0 && zapis === 0;
}

/* ---------------------------------------------------------------- *
 * Samosprawdzenie: `node core/gates/check-contrast.mjs --selftest`.
 * Próby na łańcuchach CSS — szukanie bloków i zbieranie tokenów, czyli
 * to, co bramka robi przed rachunkiem. Sam rachunek (luminancja, iloraz)
 * to wzór WCAG bez rozgałęzień; sprawdza go każda para na żywej witrynie.
 * ---------------------------------------------------------------- */

function selftest() {
  const cases = [];
  const check = (nazwa, oczekiwane, jest, skad) =>
    cases.push({ nazwa, oczekiwane: JSON.stringify(oczekiwane), jest: JSON.stringify(jest), skad });
  const pary = (css) => paryTematu(bezKomentarzy(css)).pary.map((p) => `${p.nazwa}${p.zgodne ? '=' : p.druga === null ? '∅' : '≠'}`);
  const brak = (css) => paryTematu(bezKomentarzy(css)).brakBloku;
  const tokeny = (css) => [...collectTokens(bezKomentarzy(css)).tokens.keys()];

  const czysty = '@theme {\n  --color-bg: #000;\n  --color-ink: #fff;\n}\n:root {\n  --bg: #000;\n  --ink: #fff;\n}\n';
  check('pary: blok motywu i główny', ['color-bg=', 'color-ink='], pary(czysty), 'punkt zerowy');

  const pulapka = '/* Nagłówek: paleta stoi w @theme i w :root, bramka sprawdza pary. */\n' + czysty;
  check('pary: słowo w komentarzu przed blokami', ['color-bg=', 'color-ink='], pary(pulapka), 'pułapka 2026-09-18 — «11 par bez pary»');

  const inline = czysty.replace('@theme {', '@theme inline {');
  check('pary: `@theme inline {`', ['color-bg=', 'color-ink='], pary(inline), 'wariant Tailwinda v4');

  const epoka = ':root[data-era="x"] {\n  --bg: #111;\n}\n' + czysty;
  check('pary: `:root[…] {` przed głównym — pomijany', ['color-bg=', 'color-ink='], pary(epoka), 'blok epoki nie jest głównym');

  const klamra = czysty.replace('--bg: #000;', '/* { */ --bg: #000;');
  check('pary: klamra w komentarzu wewnątrz bloku', ['color-bg=', 'color-ink='], pary(klamra), 'komentarze zdjęte przed liczeniem klamer');

  const rozjazd = czysty.replace('--ink: #fff;', '--ink: #eee;');
  check('pary: rozjechana para widoczna', ['color-bg=', 'color-ink≠'], pary(rozjazd), 'próba ujemna');

  const bezRoot = '@theme {\n  --color-bg: #000;\n}\n';
  check('pary: bez `:root` — wszystkie bez pary i brak bloku', [['color-bg∅'], [':root']], [pary(bezRoot), brak(bezRoot)], 'próba ujemna — głośno, nie zero par');

  const wSrodkuWiersza = 'html:root {\n  --bg: #000;\n}\n' + '@theme {\n  --color-bg: #000;\n}\n';
  check('pary: `html:root {` to nie `:root {`', [['color-bg∅'], [':root']], [pary(wSrodkuWiersza), brak(wSrodkuWiersza)], 'nagłówek na początku wiersza, goły');

  const zrodloZGwiazdka = "@source '../src/*.astro';\n" + czysty.replace(':root {', '/* lustro motywu */\n:root {');
  check('pary: `/*` w łańcuchu nie otwiera komentarza', ['color-bg=', 'color-ink='], pary(zrodloZGwiazdka), 'przegląd sędziego 2026-09-18: `@source` połykał blok motywu');

  check('pary: BOM na początku pliku', ['color-bg=', 'color-ink='], pary('﻿' + czysty), 'kotwica wiersza nie zna U+FEFF');

  check('pary: oba bloki są — brak pusty', [], brak(czysty), 'punkt zerowy');

  check('tokeny: z komentarza nie liczą się', ['bg'], tokeny(':root {\n  --bg: #000;\n  /* --stary: #123; */\n}\n'), 'na ekranie go nie ma');
  check('tokeny: powtórka w komentarzu to nie powtórka', 0, collectTokens(bezKomentarzy(':root {\n  --bg: #000;\n}\n/* --bg: #111; */\n')).powtorzone.length, 'próba ujemna');
  check('tokeny: prawdziwa powtórka nadal łapana', 1, collectTokens(bezKomentarzy(':root {\n  --bg: #000;\n  --bg: #111;\n}\n')).powtorzone.length, 'zachowanie z 2026-09-09');

  let failed = 0;
  for (const c of cases) {
    const ok = c.oczekiwane === c.jest;
    if (!ok) failed += 1;
    console.log(`${ok ? 'ok  ' : 'ŹLE '} ${c.nazwa.padEnd(46)} ${ok ? '' : `oczekiwane ${c.oczekiwane} jest ${c.jest}  `}— ${c.skad}`);
  }
  console.log(`\n${cases.length - failed}/${cases.length} prób bramki kontrastu zachowuje się jak umówiono.`);
  return failed === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ok = process.argv.includes('--selftest')
    ? selftest()
    : await checkContrast(process.argv[2] ? resolve(process.argv[2]) : process.cwd());
  if (!ok) process.exit(1);
}
