#!/usr/bin/env node
/**
 * Bryf strony do napisania tekstu — składany MASZYNĄ, nie ręką (P4, pachka 0).
 *
 *   node tools/brief-strony.mjs /assassins-creed-3/          — pisze input/briefs/assassins-creed-3.md
 *   node tools/brief-strony.mjs /assassins-creed-3/ --stdout — tylko drukuje
 *   node tools/brief-strony.mjs --all                        — wszystkie strony bez pliku treści
 *
 * Skąd co idzie, i czego tu NIE MA:
 *
 *   1. `structure/structure.json` — adres, typ, h1, title, description, klucze,
 *      rodzic, `related` (z tytułami), `blocks[]` ze źródłem i pewnością. To umowa:
 *      tekst nie ma prawa jej zmieniać, tylko wypełniać.
 *   2. `structure/s3-anatomy.json` — plan treści z anatomii korpusu: mediana
 *      i korytarz znaków, mediany h2/h3, tematy z werdyktem («норма», «редкая»,
 *      «гэп»). Nazwy tematów są NASZYM słownikiem, nie nagłówkami konkurentów.
 *   3. `input/corpus/manifest.jsonl` + `queries.json` — LISTA ADRESÓW dokumentów
 *      klastra (host, adres, wynik pobrania). To lista do sprawdzania faktów,
 *      nie materiał do pisania.
 *   4. Art: czy slot strony ma materiał (gry/ lub foto/) — inaczej hero drukuje
 *      zapas, którego właściciel nie przyjmował.
 *
 * CZEGO TU NIE MA I NIE BĘDZIE: ani jednego zdania, nagłówka ani liczby z tekstu
 * konkurenta. Reguła korpusu (backlog, punkt 1): «чужой текст не извлекается —
 * ни в план, ни в промпт, ни как пример формулировки. Никогда.» Bryf wskazuje,
 * GDZIE sprawdzić fakt; fakt niepotwierdzony korpusem ani materiałem wydawcy
 * nie idzie do druku (П42).
 *
 * Korpus i struktura — tylko czytanie.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const stdout = args.includes('--stdout');
const all = args.includes('--all');
const urls = args.filter((a) => a.startsWith('/'));

const structure = JSON.parse(readFileSync(join(root, 'structure/structure.json'), 'utf8'));
const anatomy = JSON.parse(readFileSync(join(root, 'structure/s3-anatomy.json'), 'utf8'));
const manifest = readFileSync(join(root, 'input/corpus/manifest.jsonl'), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));
const queries = JSON.parse(readFileSync(join(root, 'input/corpus/queries.json'), 'utf8'));
const byUrl = new Map(structure.pages.map((p) => [p.url, p]));

/** Slot artu strony — ostatni segment adresu (tak nazywa go `art` w treści i kredyty). */
const slotOf = (url) => url.replace(/\/$/, '').split('/').pop() || 'hero';
/**
 * Pięć gier epok głównej mają art pod kluczem EPOKI, nie strony — tak drukuje
 * je `/assassins-creed-4-black-flag/` (`art: karaiby`). Mapa ta sama, co
 * `stronaEpoki` w `src/data/site.ts`; tu powtórzona, bo narzędzie nie czyta TS.
 */
const SLOT_EPOKI = {
  '/assassins-creed-1/': 'jerozolima',
  '/assassins-creed-2/': 'wlochy',
  '/assassins-creed-shadows/': 'japonia',
  '/assassins-creed-4-black-flag/': 'karaiby',
  '/assassins-creed-syndicate/': 'londyn',
};
const slotArtu = (url) => SLOT_EPOKI[url] ?? slotOf(url);
const artFor = (slot) => {
  const gra = existsSync(join(root, 'src/assets/gry', `${slot}.jpg`));
  const foto = existsSync(join(root, 'src/assets/foto', `${slot}.jpg`));
  return gra ? 'materiał wydawcy (src/assets/gry)' : foto ? 'zdjęcie Commons (src/assets/foto)' : 'BRAK — hero wydrukuje zapas';
};

function brief(page) {
  const an = (anatomy.страницы ?? []).find((a) => a.url === page.url);
  const slot = slotArtu(page.url);
  const related = (page.related ?? []).map((u) => `- \`${u}\` — ${byUrl.get(u)?.h1 ?? '(brak w strukturze)'}`);
  const blocks = page.blocks.map((b) => `- \`${b.block}${b.role ? '#' + b.role : ''}\` — ${b.source}, ${b.confidence}${b.evidence ? `, evidence ${b.evidence}` : ''}`);

  // Dokumenty klastra: frazy strony → adresy z queries.json → wpisy manifestu (tylko pobrane).
  const adresy = new Set();
  for (const kw of page.keywords ?? []) for (const u of queries.phrases?.[kw]?.urls ?? []) adresy.add(u);
  const dokumenty = manifest
    .filter((m) => adresy.has(m.url) && m.outcome === 'ok')
    .map((m) => ({ host: m.host, url: m.url, file: m.file }));
  const hosty = [...new Set(dokumenty.map((d) => d.host))];
  const tematy = (an?.темы ?? []).map((t) => `| ${t.тема} | ${t.документов}/${t.из} | ${Math.round(t.доля * 100)} % | ${t.вердикт} |`);
  const elementy = Object.entries(an?.элементы ?? {}).map(([k, v]) => `| ${k} | ${v.документов}/${v.из} | ${Math.round(v.доля * 100)} % | ${v.вердикт} |`);

  return `# Bryf: \`${page.url}\`

*Złożony maszyną \`tools/brief-strony.mjs\` ze struktury, anatomii S3 i manifestu
korpusu. Bez jednej frazy konkurenta — reguła korpusu (backlog, punkt 1).*

## Umowa (structure.json — nie zmieniać, wypełniać)

| Pole | Wartość |
|---|---|
| typ | \`${page.type}\` |
| h1 | ${page.h1} |
| title | ${page.title} |
| description | ${page.description} |
| rodzic | \`${page.parent}\` |
| klaster | ${page.cluster ?? '—'} · zapytań ${page.keywords?.length ?? 0} · popyt ${page.volume ?? 0} |
| art (slot \`${slot}\`) | ${page.blocks.some((b) => b.block === 'hero-key-art') ? artFor(slot) : 'nie dotyczy — strona bez hero-key-art'} |

**Klucze** (${page.keywords?.length ?? 0}): ${(page.keywords ?? []).join(' · ') || '—'}

**Related** (\`link-list\` drukuje je ze struktury):
${related.join('\n') || '- —'}

**blocks[]** — kolejność i zestaw sekcji; każdy blok wymaga pola w pliku treści:
${blocks.join('\n')}

## Plan treści (anatomia S3, korpus klastra)

${an ? `- dokumentów ${an.документов} z ${an.хостов} hostów, koszyk **${an.корзина}**
- **korytarz znaków bez spacji: ${an.план.коридор[0]}–${an.план.коридор[1]}** (mediana ${an.план.медиана_знаков}${an.план.ориентир ? ', orientacyjny — własnych dokumentów mniej niż cztery' : ''})
- nagłówków: h2 mediana ${an.план.h2_медиана}, h3 mediana ${an.план.h3_медиана}

| Temat (nasz słownik) | dokumentów | udział | werdykt |
|---|---:|---:|---|
${tematy.join('\n')}

| Element strony | dokumentów | udział | werdykt |
|---|---:|---:|---|
${elementy.join('\n')}` : '- anatomii dla tej strony nie ma (strona spoza korpusu S3 — np. służbowa)'}

## Dokumenty klastra do sprawdzania faktów (${dokumenty.length}, hostów ${hosty.length})

*Lista adresów, nie treści. Fakt do druku musi być potwierdzony w jednym z nich
albo w materiale wydawcy; niepotwierdzony — przeformułować do potwierdzalnego
albo usunąć (П42). Pliki: \`input/corpus/<file>\` (gzip).*

${dokumenty.map((d) => `- ${d.host} — ${d.url}`).join('\n') || '- —'}

## Zasady pisania (П42, bez wyczytki właściciela)

1. Głos przyjętych stron: główna i \`/assassins-creed-4-black-flag/\` — fakty
   o grach prawdziwe, bez tabloidu, werdykt słowami bez punktacji (П28).
2. Fakt niepotwierdzony korpusem lub materiałem wydawcy — nie drukuje się.
   Lista pominiętych i przeformułowanych idzie do raportu paczki.
3. Samo-oznaczenie «możliwie błędne» w opublikowanym tekście — niedopuszczalne.
4. Adresy w treści — tylko od korzenia i tylko ze struktury; bramka \`links\`
   przerywa budowanie na innych.
5. Długość — w korytarzu wyżej; dziś to wiersz raportu, nie bramka (decyzja
   właściciela w toku).
6. Podpis: «Redakcja · Bractwo», data — dzień budowania strony.
`;
}

const cele = all
  ? structure.pages.filter((p) => p.url !== '/' && !existsSync(join(root, 'src/content/tresc', `${slotOf(p.url)}.md`)))
  : urls.map((u) => {
      const p = byUrl.get(u);
      if (!p) {
        console.error(`Adres ${u} nie istnieje w structure.json`);
        process.exit(1);
      }
      return p;
    });

if (!cele.length) {
  console.error('node tools/brief-strony.mjs </adres/> [--stdout] | --all');
  process.exit(2);
}

const outDir = join(root, 'input/briefs');
if (!stdout) mkdirSync(outDir, { recursive: true });
for (const page of cele) {
  const text = brief(page);
  if (stdout) console.log(text);
  else {
    const file = join(outDir, `${slotOf(page.url)}.md`);
    writeFileSync(file, text.replace(/\r?\n/g, '\r\n'), 'utf8');
    console.log(`bryf: ${page.url} → input/briefs/${slotOf(page.url)}.md`);
  }
}
