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

/** Ciało bloku `nazwa { … }` z dopasowaniem klamer. */
function blok(source, naglowek) {
  const i = source.indexOf(naglowek);
  if (i < 0) return '';
  const j = source.indexOf('{', i);
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
  const theme = wyjmij(blok(css, '@theme'));
  // Pierwsze `:root` w pliku to blok główny; bloki epok idą dalej i mają swoje
  // nazwy, więc nie wchodzą w pary.
  const root = wyjmij(blok(css, ':root'));
  const pary = [];
  for (const [nazwa, wartosc] of theme) {
    const bez = nazwa.replace(/^color-/, '');
    if (!root.has(bez)) { pary.push({ nazwa, bez, wartosc, druga: null, zgodne: false }); continue; }
    const druga = root.get(bez);
    pary.push({ nazwa, bez, wartosc, druga, zgodne: druga.toLowerCase() === wartosc.toLowerCase() });
  }
  return pary;
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

  const css = readFileSync(cssPath, 'utf8');
  const { tokens, powtorzone } = collectTokens(css);
  const pairs = (await import(pathToFileURL(pairsPath).href)).default;

  let zapis = 0;
  for (const p of powtorzone) {
    console.error(`POWTÓRZONA NAZWA: --${p.nazwa} zapisana dwa razy (${p.a} i ${p.b}) — bramka liczyłaby ostatnią.`);
    zapis += 1;
  }
  const pary = paryTematu(css);
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ok = await checkContrast(process.argv[2] ? resolve(process.argv[2]) : process.cwd());
  if (!ok) process.exit(1);
}
