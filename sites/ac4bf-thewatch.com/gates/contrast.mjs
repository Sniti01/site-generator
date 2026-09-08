// Dane witryny dla bramki kontrastu z `@factory/core/gates`.
// Para to krotka [fg, bg, min, label]: dwa tokeny z src/styles/global.css,
// próg (4.5 dla tekstu, 3 dla elementów UI) i opis do wiersza raportu.
//
// Lista jest własnością witryny, nie rdzenia: progi są wspólne dla wszystkich
// witryn, ale zestawienia — nie. Tu jest ich pięć epok, u następnej witryny
// nie będzie żadnej.
//
// Para musi pokrywać każde zestawienie, które naprawdę występuje na stronie.
// Brakującej pary bramka nie wykryje: nie ma jej, więc nie liczy.

// Epoki: akcent wędruje po zejściu, więc każda para liczy się osobno.
//
// Para `era-*` / `bg` ma próg 3 i to nie jest pomyłka. Token wypełnia
// duotonę kadru (`core/styles/foto.css`) — element UI — oraz maluje rok
// warstwy `.layer__year`, a ten ma 88px, czyli jest tekstem dużym.
// Dla obu zastosowań właściwy próg to 3.
const eras = ['jerozolima', 'wlochy', 'karaiby', 'londyn', 'japonia'];

const pairs = [
  // tekst na tłach szasi
  ['ink', 'bg', 4.5, 'tekst główny na tle strony'],
  ['ink', 'bg-band', 4.5, 'tekst główny na paśmie'],
  ['ink', 'surface', 4.5, 'tekst główny na karcie'],
  ['ink', 'surface-2', 4.5, 'tekst główny na karcie podniesionej'],
  ['ink-muted', 'bg', 4.5, 'tekst drugorzędny na tle strony'],
  ['ink-muted', 'bg-band', 4.5, 'tekst drugorzędny na paśmie'],
  ['ink-muted', 'surface', 4.5, 'tekst drugorzędny na karcie'],
  ['ink-muted', 'surface-2', 4.5, 'tekst drugorzędny na karcie podniesionej'],
  // marka
  ['accent-text', 'bg', 4.5, 'link/akcent tekstowy na tle strony'],
  ['accent-text', 'bg-band', 4.5, 'link/akcent tekstowy na paśmie'],
  ['accent-text', 'surface', 4.5, 'link/akcent tekstowy na karcie'],
  ['accent-text', 'surface-2', 4.5, 'link/akcent tekstowy na karcie podniesionej'],
  ['ink-on-accent', 'accent', 4.5, 'napis w wypełnionym przycisku'],
  ['accent', 'bg', 3, 'wypełnienie akcentu jako element UI'],
  // Mosiądz maluje licznik grupy `.stack__count` — 21px/600, tekst duży,
  // więc próg 3 jest dla niego właściwy; opis mówi teraz o obu rolach.
  ['accent-2', 'bg', 3, 'mosiądz: element UI i licznik grupy 21px/600'],
  ['accent-2', 'surface', 3, 'mosiądz na karcie'],
  // pergamin (karta epoki)
  ['ink-parchment', 'parchment', 4.5, 'tekst na pergaminie'],
  ['ink-parchment-muted', 'parchment', 4.5, 'tekst drugorzędny na pergaminie'],
  // ostrzeżenie
  ['danger', 'bg', 4.5, 'komunikat o zagrożeniu'],
];

for (const era of eras) {
  pairs.push([`era-${era}-text`, 'bg', 4.5, `akcent tekstowy epoki ${era} na tle strony`]);
  // Dopisane 2026-09-08 (decyzja П20): akcent tekstowy epoki występuje na
  // paśmie sześć razy — `.layer__hero` i `.btn-link` — a pary na to
  // zestawienie nie było wcale. Przechodzi z zapasem (6,60…11,78 przy 4,5),
  // ale brak pary znaczył, że bramka tego zestawienia po prostu nie liczy.
  pairs.push([`era-${era}-text`, 'bg-band', 4.5, `akcent tekstowy epoki ${era} na paśmie`]);
  pairs.push([`era-${era}-text`, 'surface', 4.5, `akcent tekstowy epoki ${era} na karcie`]);
  pairs.push([`era-${era}`, 'bg', 3, `wypełnienie epoki ${era} i rok warstwy na tle strony`]);
  pairs.push([`era-${era}-ink`, `era-${era}`, 4.5, `napis na wypełnieniu epoki ${era}`]);
}

export default pairs;
