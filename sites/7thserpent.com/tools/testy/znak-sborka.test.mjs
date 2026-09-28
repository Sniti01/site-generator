// Знак сайта в сборке (П84 п. 2, П104 блок Г) — пробы на копиях сайта (`tools/kopiya.mjs`): гейт сайта
// (`tools/geity.mjs`, `znak.mjs --check`) роняет `npm run build` до `astro build`; сторож `sayt:znak-dist` роняет
// саму сборку, если иконки сборки не те; строка итога и запись файлов инструмента (R5-SVERKA-6) — на копии,
// где инструмент пишет в `public/` копии. Каждая проба — своя копия.
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { sdelatKopiyu, udalitKopiyu, sobrat, prochest, zapisat } from '../kopiya.mjs';
import { zamena } from './proba.mjs';

function naKopii(f) {
  const k = sdelatKopiyu(mkdtempSync(join(tmpdir(), 'znak-')));
  try {
    return f(k);
  } finally {
    udalitKopiyu(k);
  }
}
/** Запуск инструмента знака в копии. */
const znak = (k, ...argi) => spawnSync(process.execPath, [join(k.sayt, 'tools/znak.mjs'), ...argi], { cwd: k.sayt, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
const IKONOCHNY = /^(favicon|icon-|apple-touch-icon)|\.webmanifest$/;
const ikonki = (k) => Object.fromEntries(readdirSync(join(k.sayt, 'public')).filter((f) => IKONOCHNY.test(f)).map((f) => [f, readFileSync(join(k.sayt, 'public', f)).toString('base64')]));

test('гейт сайта: отказ знака (иконка public/ не та) роняет npm run build до astro build; гейты ядра идут до конца', () => {
  naKopii((k) => {
    zapisat(k, 'public/favicon.svg', prochest(k, 'public/favicon.svg').replace('#eca84a', '#eca84b'));
    const r = sobrat(k, { sGeityami: true });
    assert.notEqual(r.kod, 0);
    assert.match(r.vyvod, /Гейты сайта: не прошли — знак/);
    assert.match(r.vyvod, /public\/favicon\.svg: байты не равны/);
    assert.match(r.vyvod, /Bramki: 4\/4 przechodzi/, 'гейты ядра не дошли до конца');
    assert.equal(existsSync(join(k.sayt, 'dist', 'index.html')), false, 'astro build пошёл, хотя гейт отказал');
  });
});

test('GR1-Z-9: отказали и гейт ядра (контраст), и знак — оба идут до конца и оба названы', () => {
  naKopii((k) => {
    // Контраст: второстепенный текст темным на тёмном — отказ гейта ядра; знак этой краски не берёт.
    let css = prochest(k, 'src/styles/global.css');
    css = zamena(css, '  --color-ink-muted: #a1abb3;', '  --color-ink-muted: #2a3036;');
    css = zamena(css, '  --ink-muted: #a1abb3;', '  --ink-muted: #2a3036;');
    zapisat(k, 'src/styles/global.css', css);
    zapisat(k, 'public/favicon.svg', prochest(k, 'public/favicon.svg').replace('#eca84a', '#eca84b'));
    const r = sobrat(k, { sGeityami: true });
    assert.notEqual(r.kod, 0);
    assert.match(r.vyvod, /Гейты сайта: не прошли — гейты ядра \(код 1\), знак \(код 1\)/);
    assert.match(r.vyvod, /public\/favicon\.svg: байты не равны/, 'знак не запускался после отказа ядра');
  });
});

test('сторож сборки знака: иконка сборки не та (без гейтов) — astro build падает', () => {
  naKopii((k) => {
    zapisat(k, 'public/favicon.svg', prochest(k, 'public/favicon.svg').replace('#eca84a', '#eca84b'));
    const r = sobrat(k);
    assert.notEqual(r.kod, 0);
    assert.match(r.vyvod, /Знак сайта разошёлся с источником/);
    assert.match(r.vyvod, /dist\/favicon\.svg: байты не равны/);
  });
});

test('R5-SVERKA-6: запись иконок и строка итога — новая краска токена попадает в файлы и в итог; при отказе не пишется ничего', () => {
  naKopii((k) => {
    zapisat(k, 'src/styles/global.css', zamena(prochest(k, 'src/styles/global.css'), '\n  --accent: #eca84a;', '\n  --accent: #eca84b;'));
    const pered = ikonki(k);
    const proverka = znak(k, '--check');
    assert.equal(proverka.status, 1, 'сверка с устаревшими иконками обязана отказать');
    const zapis = znak(k);
    assert.equal(zapis.status, 0, zapis.stderr);
    assert.match(zapis.stdout, /znak: записано — 6 иконок public\//);
    assert.match(zapis.stdout, /accent #eca84b/, 'строка итога не называет краску, которую взяли рисунки');
    const posle = ikonki(k);
    assert.deepEqual(Object.keys(posle).sort(), Object.keys(pered).sort(), 'иконочные имена — те же шесть');
    assert.ok(readFileSync(join(k.sayt, 'public/favicon.svg'), 'utf8').includes('#eca84b'), 'favicon.svg не переписан новой краской');
    assert.notEqual(posle['favicon-32x32.png'], pered['favicon-32x32.png'], 'PNG не переписан');
    const snova = znak(k, '--check');
    assert.equal(snova.status, 0, snova.stderr);
    assert.match(snova.stdout, /znak: сверено .*accent #eca84b/);
    // Отказ входов: краска не #rrggbb — инструмент не пишет ни одного файла.
    zapisat(k, 'src/styles/global.css', zamena(prochest(k, 'src/styles/global.css'), '\n  --accent: #eca84b;', '\n  --accent: rgb(1 2 3);'));
    const doOtkaza = ikonki(k);
    const otkaz = znak(k);
    assert.equal(otkaz.status, 1);
    assert.match(otkaz.stderr, /не пишу: входы с отказом/);
    assert.deepEqual(ikonki(k), doOtkaza, 'при отказе иконки переписаны');
  });
});
