// Раунд 4, блок Б: мутанты судьи головы (правки B3-1, B3-3 откатываются по одной) и судьи исключений (B3-2).
// Каждый мутант — папка с копией модуля (импорты — на ядро репозитория по file:///) и копией его теста.
// node sdelat-mutanty.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const CORE = 'D:/SEO/cloud/site-generator/core';
const TEXT = 'file:///D:/SEO/cloud/site-generator/core/text/';
const head = readFileSync(join(CORE, 'gates/head.mjs'), 'utf8').replaceAll("'../text/", `'${TEXT}`);
const headTest = readFileSync(join(CORE, 'gates/head.test.mjs'), 'utf8');
const isk = readFileSync(join(CORE, 'gates/exceptions.mjs'), 'utf8').replaceAll("'../text/", `'${TEXT}`);
const frTest = readFileSync(join(CORE, 'gates/phrases.test.mjs'), 'utf8');

function zamena(s, iz, na) {
  if (!s.includes(iz)) throw new Error(`нет куска: ${iz}`);
  return s.replace(iz, na);
}

const golova = {
  'kontrol-bez-mutacii': head,
  // B3-1 целиком: прочтение со скриптами берёт текст как без скриптов.
  'MH-B3-1-celikom': zamena(head, 'const tekst = skripty ? tekstSoSkriptami : tekstVsego;', 'const tekst = tekstVsego;'),
  // B3-1, только цель имени (aria-labelledby): её текст — с содержимым <noscript>.
  'MH-B3-1-cel-imeni': zamena(head, '.map((u) => yarlyk(tekst(u)))', '.map((u) => yarlyk(tekstVsego(u)))'),
  // B3-1, только текущее звено.
  'MH-B3-1-tekushchee': zamena(head, 'label: yarlyk(tekst(s)),', 'label: yarlyk(tekstVsego(s)),'),
  // B3-3: положение — индекс среди элементов nav (как до правки).
  'MH-B3-3': zamena(head, 'return { ...n, ssylki: n.ssylki.map(rang), tekushchie: n.tekushchie.map(rang) };', 'return n;'),
};
for (const [imya, kod] of Object.entries(golova)) {
  const d = join(ZDES, imya);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'head.mjs'), kod);
  writeFileSync(join(d, 'head.test.mjs'), headTest);
}

// phrases.test импортирует ./phrases.mjs, а тот — ./exceptions.mjs: копия phrases.mjs с импортами на репозиторий,
// кроме exceptions — на мутанта.
const fr = readFileSync(join(CORE, 'gates/phrases.mjs'), 'utf8')
  .replaceAll("'../text/", `'${TEXT}`)
  .replace("'./after-build.mjs'", "'file:///D:/SEO/cloud/site-generator/core/gates/after-build.mjs'");
const isklyucheniya = {
  'kontrol-isk-bez-mutacii': isk,
  // B3-2: текст метки — со всем текстом <noscript> внутри .t-label (как до правки).
  'MI-B3-2': zamena(isk, "stroki(potok(metka).filter((t) => t.tip !== 'tekst' || !predki(t.uzel).some((p) => imya(p) === 'noscript')), '')", "stroki(potok(metka), '')"),
};
for (const [imya, kod] of Object.entries(isklyucheniya)) {
  const d = join(ZDES, imya);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'exceptions.mjs'), kod);
  writeFileSync(join(d, 'phrases.mjs'), fr);
  let t = frTest;
  // Прочие относительные импорты теста (помимо ./phrases.mjs и ./exceptions.mjs) — на репозиторий.
  t = t.replace(/from '\.\.\/text\//g, `from '${TEXT}`);
  writeFileSync(join(d, 'phrases.test.mjs'), t);
}
console.log('мутанты готовы');
