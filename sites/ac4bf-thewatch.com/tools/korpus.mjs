#!/usr/bin/env node
/**
 * Czytnik korpusu klastra — TYLKO CZYTANIE, do sprawdzania faktów przy pisaniu
 * i przy soczewkach (backlog 43, P47; do repozytorium 2026-09-16, backlog 50
 * p. 10 — czwarta jednorazowa kopia w scratchpadzie była ostatnią).
 *
 *   node tools/korpus.mjs list <fragment url|grupy>      — dokumenty: n, wynik pobrania, url, plik
 *   node tools/korpus.mjs text <fragment url>            — tekst bez tagów pierwszego trafionego dokumentu
 *   node tools/korpus.mjs grep <regex> [<fragment url>]  — wiersze z trafieniem, po dokumentach
 *   node tools/korpus.mjs --selftest                     — próba na jednym dokumencie manifestu
 *   npm run korpus -- text rodowod
 *
 * Skąd czyta: `input/corpus/manifest.jsonl` (w git — lista adresów, grup
 * i wyników pobrania) i `input/corpus/raw/*.gz` (poza git; odbudowuje
 * `tools/fetch-corpus.mjs`). Fragment dopasowuje się bez uwzględnienia
 * wielkości liter i po zdekodowaniu procentów w adresie — `rodow` trafia
 * w `Rodow%C3%B3d` (to były dwie prośby backlogu 43). Tekst: skrypty i style
 * odpadają, tagi blokowe stają się końcem wiersza, reszta tagów — spacją,
 * encje nazwane i liczbowe — znakiem; puste wiersze znikają. `grep` obcina
 * wiersz do 300 znaków i liczy dokumenty pominięte z braku pliku raw.
 *
 * CZEGO TU NIE MA I NIE BĘDZIE: wyciągania fraz, streszczania ani żadnej
 * ścieżki, którą tekst konkurenta trafiłby do planu, promptu czy treści.
 * Reguła korpusu (backlog, punkt 1): «чужой текст не извлекается — ни в план,
 * ни в промпт, ни как пример формулировки. Никогда.» Czytnik pokazuje, GDZIE
 * fakt stoi; co z nim zrobić — reguła П42. Sprawdzanie kanwy z backlogu 43
 * (zestaw elementów akapitu, próg 70 %) to inne narzędzie — nie ten czytnik.
 */
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'input/corpus/manifest.jsonl');
const rawDir = join(root, 'input/corpus');

const [cmd, a, b] = process.argv.slice(2);

/** Małe litery po zdekodowaniu procentów; zepsute `%` zostaje jak jest. */
function lc(s) {
  const text = String(s ?? '');
  try {
    return decodeURIComponent(text).toLowerCase();
  } catch {
    return text.toLowerCase();
  }
}

/** Dokumenty z plikiem, których adres albo grupa zawiera fragment. */
function pick(man, q) {
  const needle = lc(q);
  return man.filter((m) => m.file && (lc(m.url).includes(needle) || (m.groups ?? []).some((g) => lc(g).includes(needle))));
}

const ENTITIES = { nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };

/** HTML dokumentu do tekstu wierszami — bez skryptów, stylów i tagów. */
function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|p|div|li|h\d|tr|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(nbsp|amp|quot|apos|lt|gt);/g, (_, name) => ENTITIES[name])
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function readManifest() {
  if (!existsSync(manifestPath)) throw new Error(`brak ${manifestPath} — najpierw npm run corpus`);
  return readFileSync(manifestPath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
}

function rawOf(m) {
  const path = join(rawDir, m.file);
  if (!existsSync(path)) return null;
  return gunzipSync(readFileSync(path)).toString('utf8');
}

// PRÓBA: jeden dokument manifestu z plikiem raw na dysku — filtr trafia po
// małych literach i po dekodowaniu, tekst wychodzi bez tagów i niepusty,
// `grep` słowa z tekstu znajduje ten dokument. Bez raw — `exit=1` z nazwą.
if (cmd === '--selftest') {
  const man = readManifest();
  const doc = man.find((m) => m.file && existsSync(join(rawDir, m.file)));
  if (!doc) {
    console.error(`ZLE  zaden dokument manifestu (${man.length}) nie ma pliku raw — npm run corpus`);
    process.exit(1);
  }
  const proby = [];
  const fragment = lc(doc.url).slice(8, 20).toUpperCase();
  proby.push(['filtr po adresie bez wielkosci liter', pick(man, fragment).some((m) => m.n === doc.n)]);
  proby.push(['dekodowanie procentow w adresie', lc('Rodow%C3%B3d') === 'rodowód' && lc('%E0%A4%') === '%e0%a4%']);
  const text = textOf(rawOf(doc));
  proby.push(['tekst niepusty i bez tagow', text.length > 0 && !/<[a-z!/]/i.test(text)]);
  proby.push(['encje: nazwana, liczbowa, szesnastkowa', textOf('a&nbsp;b &amp; &#160;c &#xA0;d') === 'a b & c d']);
  const word = text.split(/\s+/).find((w) => /^[a-ząćęłńóśźż]{5,}$/i.test(w));
  proby.push([`grep slowa «${word}» trafia w dokument`, Boolean(word) && new RegExp(word, 'i').test(text)]);
  let zle = 0;
  for (const [nazwa, ok] of proby) {
    if (!ok) zle += 1;
    console.log(`${ok ? 'ok  ' : 'ZLE '} ${nazwa}`);
  }
  console.log(`\nSelftest: ${proby.length - zle}/${proby.length} (dokument n=${doc.n}, ${doc.url}).`);
  process.exit(zle ? 1 : 0);
}

const man = readManifest();

if (cmd === 'list') {
  for (const m of pick(man, a)) console.log(m.n, m.outcome, m.url, m.file);
} else if (cmd === 'text') {
  const m = pick(man, a)[0];
  if (!m) throw new Error(`brak dokumentu dla «${a}»`);
  const html = rawOf(m);
  if (!html) throw new Error(`brak pliku raw ${m.file} — npm run corpus`);
  console.log(`# ${m.url}\n${textOf(html)}`);
} else if (cmd === 'grep') {
  const re = new RegExp(a, 'i');
  let pominiete = 0;
  for (const m of b ? pick(man, b) : man.filter((m) => m.file)) {
    const html = rawOf(m);
    if (!html) {
      pominiete += 1;
      continue;
    }
    for (const line of textOf(html).split('\n')) {
      if (re.test(line)) console.log(`${m.n} ${m.url} :: ${line.slice(0, 300)}`);
    }
  }
  if (pominiete) console.error(`pominieto ${pominiete} (brak pliku raw)`);
} else {
  console.log('list <fragment> | text <fragment> | grep <regex> [<fragment>] | --selftest');
}
