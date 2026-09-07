#!/usr/bin/env node
// Gate: zasoby, których witryna naprawdę od siebie wymaga, leżą na dysku.
//
// Po co, skoro budowanie i tak jest zielone. Bo właśnie dlatego. Glob po
// nieistniejącym katalogu zwraca `{}` bez błędu i bez ostrzeżenia, więc
// „ścieżka jest zła” i „zasobów jeszcze nie pobrano” wyglądają identycznie —
// to ten sam rodzaj milczącej awarii co zły `@source`. Rozdzielić je może
// tylko sama witryna: to ona wie, co obiecała mieć.
//
// Podział jest ten sam co przy kontraście: rachunek jest wspólny i mieszka
// tutaj, oczekiwania są danymi witryny i mieszkają w
// `<witryna>/gates/assets.mjs`. Ścieżki liczą się od `<witryna>/src/assets/`.
//
// PUSTA LISTA JEST POPRAWNA i oznacza świeży klon szablonu — nie „brak
// danych”. Bramka wtedy przechodzi. Nie „naprawiać”: świeży klon ma się
// składać, zanim ktokolwiek uruchomi skrypty pobierania, i to jest cały sens
// rozgałęzienia źródeł w SmartImage.
//
// Czego ta bramka NIE sprawdza: czy wzorzec globa w rdzeniu wskazuje tam,
// gdzie te pliki leżą. Tego bramka przed `astro build` zobaczyć nie może.
// Żywotność wzorca potwierdza się jednorazową próbą przy wynoszeniu
// komponentu — tak jak żywotność `@source` (DECISIONS.md, wpis o markerze).

import { existsSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';

export default async function checkAssets(siteRoot) {
  const listPath = join(siteRoot, 'gates/assets.mjs');
  const assetsDir = join(siteRoot, 'src/assets');

  if (!existsSync(listPath)) {
    console.error(
      `BRAK DANYCH: ${listPath} nie istnieje — bramka zasobów nie wie, czego witryna od siebie wymaga.`,
    );
    console.error('Pusta lista jest poprawna; brak pliku nie jest — nie da się go odróżnić od zapomnianego.');
    return false;
  }

  const expected = (await import(pathToFileURL(listPath).href)).default;

  if (!Array.isArray(expected)) {
    console.error(`ZŁE DANE: ${listPath} nie eksportuje tablicy.`);
    return false;
  }

  if (expected.length === 0) {
    console.log('Zasoby: 0 zadeklarowanych — świeży klon. Bramka przechodzi.');
    return true;
  }

  const rows = [];
  let failed = 0;

  for (const [relPath, label] of expected) {
    const full = join(assetsDir, relPath);
    const ok = existsSync(full) && statSync(full).isFile();
    if (!ok) failed += 1;
    rows.push({ ok, relPath, label });
  }

  const width = Math.max(...rows.map((r) => r.relPath.length));
  for (const r of rows) {
    const mark = r.ok ? 'ok  ' : 'BRAK';
    console.log(`${mark} ${r.relPath.padEnd(width)}  ${r.label}`);
  }

  console.log(`\n${rows.length - failed}/${rows.length} zadeklarowanych zasobów na miejscu.`);
  if (failed > 0) {
    console.error(`Zasoby: ${failed} obiecanych plików nie ma pod src/assets/.`);
  }
  return failed === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ok = await checkAssets(process.argv[2] ? resolve(process.argv[2]) : process.cwd());
  if (!ok) process.exit(1);
}
