// Настоящая вкладка Chromium с фавиконом и доказательство, какой файл она рисует
// (сессия 11, П83 п. 4: приёмка фавикона «вкладка браузера»; «судью судят»: раунд 1 —
// R1-POLNOTA-2, -3; раунд 2 — R2-RISOVKA-8, -9, R2-MATERIALY-2, -5, -7). Заменяет
// прежние vkladka.mjs (материалы) и vkladka-dowod.mjs (доказательство) одним прогоном.
//
// Копии dist/ (сама dist/ только читается), свой сервер над копией, Chromium с окном
// (свой профиль на каждый запуск), окно снимает okno.ps1 — по процессу со своим
// профилем, не по заголовку. Варианты копии:
//   0 — без правки: материалы приёмки и контроль;
//   а — favicon.svg перекрашен в чистый зелёный (#00ff00), PNG и ICO прежние;
//   б — PNG и ICO перекрашены в чистый красный (#ff0000), SVG прежний;
//   в — как (а), и порядок ссылок иконок в <head> обратный.
// Рамка иконки во вкладке не зашита числами: это рамка зелёных пикселей варианта (а)
// при том же масштабе и теме (квадрат 16 × масштаб; иначе отказ). В рамке:
//   (а), (в) — зелёного не меньше 0,9: вкладку рисует favicon.svg;
//   (б) — красного нет, и рамка по пикселям та же, что у (0) (доля пикселей
//         с расхождением больше 8 — не больше 0,02): положительный контроль —
//         правка растровых иконок до вкладки не дошла.
// Пара «эскиз / вкладка»: рамка (0) против favicon.svg, нарисованного Chromium без окна
// в <img> 16 × 16 при той же плотности (так иконку показывал лист эскиза) — число
// расхождений и лист vkladka-para.png (увеличение 8).
// Масштаб интерфейса 1 и 2 (--force-device-scale-factor), светлая и тёмная тема
// браузера (--force-dark-mode). Окно открывается на экране на несколько секунд.
//
// Пишет в <папка доклада>: vkladka-<масштаб>x-<тема>.png (верх окна, вариант 0),
// vkladka-para.png, vkladka.json; в <папка доклада>/dowod/: dowod-<вариант>-<масштаб>x.png
// (полоса вкладок) и dowod.json. Отказ (exit 1) — любой вывод не тот.
//
// ПРЕДЕЛЫ: один движок (Chromium из кеша Playwright, версия — в выгрузке); окно
// Windows 11, тема браузера — флаг, а не системная; что другие движки берут
// из ссылок — не проверено (бэклог 60 п. 4).
//
//   node vkladka-dowod.mjs <папка доклада> <папка для копий>
import { createRequire } from 'node:module';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { cpSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PW, CHROME, REPO, SITE, sha } from './sborka.mjs';

const { chromium } = createRequire(PW)('playwright-core');
const sharp = createRequire(join(REPO, 'package.json'))('sharp');
const DIST = join(SITE, 'dist');
const OKNO = join(dirname(fileURLToPath(import.meta.url)), 'okno.ps1');
const [, , DOKLAD, KOPIE] = process.argv;
if (!DOKLAD || !KOPIE) { console.error('node vkladka-dowod.mjs <папка доклада> <папка для копий>'); process.exit(2); }
const DOWOD = join(DOKLAD, 'dowod');
mkdirSync(DOWOD, { recursive: true });
mkdirSync(KOPIE, { recursive: true });
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim();

async function przemaluj(buf, rgb) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) { data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2]; }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
}
function ico(obrazy) {
  const head = Buffer.alloc(6 + 16 * obrazy.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(obrazy.length, 4);
  let offset = head.length;
  obrazy.forEach(([size, b], i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(size, e); head.writeUInt8(size, e + 1); head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(b.length, e + 8); head.writeUInt32LE(offset, e + 12); offset += b.length;
  });
  return Buffer.concat([head, ...obrazy.map(([, b]) => b)]);
}
const zielony = (d) => { const svg = readFileSync(join(d, 'favicon.svg'), 'utf8').replace(/fill="#[0-9a-f]{6}"/gi, 'fill="#00ff00"'); writeFileSync(join(d, 'favicon.svg'), svg); };
const WARIANTY = {
  0: () => {},
  a: zielony,
  b: async (d) => {
    const red = [255, 0, 0];
    for (const f of ['favicon-16x16.png', 'favicon-32x32.png', 'icon-192.png', 'apple-touch-icon.png']) writeFileSync(join(d, f), await przemaluj(readFileSync(join(d, f)), red));
    writeFileSync(join(d, 'favicon.ico'), ico([[16, await przemaluj(readFileSync(join(d, 'favicon-16x16.png')), red)], [32, await przemaluj(readFileSync(join(d, 'favicon-32x32.png')), red)]]));
  },
  c: (d) => {
    zielony(d);
    const html = readFileSync(join(d, 'index.html'), 'utf8');
    const linki = html.match(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g);
    if (!linki || linki.length !== 6) throw new Error(`вариант в: ссылок иконок в index.html ${linki?.length ?? 0}, ждали 6`);
    let h = html;
    for (const l of linki) h = h.replace(l, '');
    writeFileSync(join(d, 'index.html'), h.replace('</head>', linki.reverse().join('') + '</head>'));
  },
};
// Порядок: а раньше всех — от него рамка иконки.
const ZAPUSKI = [['a', 1, 'svetlaya'], ['a', 2, 'svetlaya'], ['a', 1, 'temnaya'], ['a', 2, 'temnaya'], ['0', 1, 'svetlaya'], ['0', 2, 'svetlaya'], ['0', 1, 'temnaya'], ['0', 2, 'temnaya'], ['b', 1, 'svetlaya'], ['b', 2, 'svetlaya'], ['c', 1, 'svetlaya'], ['c', 2, 'svetlaya']];

const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml' };
let root = null;
const zapros = [];
const server = http.createServer(async (rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, 'http://x').pathname);
  zapros.push(p);
  try {
    let f = join(root, p);
    const s = await stat(f).catch(() => null);
    if (s && s.isDirectory()) f = join(f, 'index.html');
    const b = await readFile(f);
    rs.writeHead(200, { 'content-type': mime[extname(f)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    rs.end(b);
  } catch { rs.writeHead(404); rs.end(); }
});
await new Promise((r) => server.listen(4943, r));

const bledy = [];
const ramki = {};
const przebiegi = {};
const piksele = {};
let wersja = null;
const przygotowane = new Set();
try {
  for (const [w, skala, tema] of ZAPUSKI) {
    const kopia = join(KOPIE, `dowod-${w}`);
    if (!przygotowane.has(w)) {
      rmSync(kopia, { recursive: true, force: true });
      cpSync(DIST, kopia, { recursive: true });
      await WARIANTY[w](kopia);
      przygotowane.add(w);
    }
    root = kopia;
    const znacznik = `udd-7ths-vkladka-${w}-${skala}-${tema}`;
    const udd = join(KOPIE, znacznik);
    rmSync(udd, { recursive: true, force: true });
    const args = ['--window-position=40,40', '--window-size=900,420', `--force-device-scale-factor=${skala}`];
    if (tema === 'temnaya') args.push('--force-dark-mode');
    const ctx = await chromium.launchPersistentContext(udd, { headless: false, executablePath: CHROME, args, viewport: null });
    wersja = ctx.browser()?.version() ?? wersja;
    const page = ctx.pages()[0] ?? (await ctx.newPage());
    zapros.length = 0;
    await page.goto('http://localhost:4943/', { waitUntil: 'load' });
    for (let k = 0; k < 50 && !zapros.some((p) => /favicon|icon-|apple-touch/.test(p)); k++) await page.waitForTimeout(100);
    await page.waitForTimeout(1500);
    const syroj = join(DOWOD, `_okno-${w}-${skala}-${tema}.png`);
    const msg = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', OKNO, '-Marker', znacznik, '-Title', 'Max Payne', '-Out', syroj], { encoding: 'utf8' }).trim();
    const zaprosIkon = zapros.filter((p) => /favicon|icon-|apple-touch/.test(p));
    await ctx.close();
    const meta = await sharp(syroj).metadata();
    const obraz = await sharp(syroj).removeAlpha().raw().toBuffer();
    const W = meta.width;
    const klucz = `${skala}-${tema}`;
    if (w === 'a') {
      let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
      for (let y = 0; y < Math.min(meta.height, 60 * skala); y++) for (let x = 0; x < Math.min(W, 500 * skala); x++) {
        const i = (y * W + x) * 3;
        if (obraz[i + 1] > 200 && obraz[i] < 90 && obraz[i + 2] < 90) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      }
      const r = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
      if (x1 < 0 || Math.abs(r.w - 16 * skala) > 1 || Math.abs(r.h - 16 * skala) > 1) bledy.push(`рамка иконки (${klucz}): зелёный квадрат не найден или не ${16 * skala} — ${JSON.stringify(r)}`);
      ramki[klucz] = r;
    }
    const r = ramki[klucz];
    const wycinek = Buffer.alloc(r.w * r.h * 3);
    for (let y = 0; y < r.h; y++) obraz.copy(wycinek, y * r.w * 3, ((r.y + y) * W + r.x) * 3, ((r.y + y) * W + r.x + r.w) * 3);
    let g = 0, c = 0;
    for (let i = 0; i < wycinek.length; i += 3) {
      if (wycinek[i + 1] > 200 && wycinek[i] < 60 && wycinek[i + 2] < 60) g++;
      if (wycinek[i] > 200 && wycinek[i + 1] < 60 && wycinek[i + 2] < 60) c++;
    }
    const n = r.w * r.h;
    piksele[`${w}-${klucz}`] = wycinek;
    const wynik = { okno: msg, zapros_ikon: zaprosIkon, ramka: r, zielonych: +(g / n).toFixed(3), czerwonych: +(c / n).toFixed(3) };
    if (w === '0') {
      await sharp(syroj).extract({ left: 0, top: 0, width: W, height: Math.min(meta.height, Math.round(150 * skala)) }).toFile(join(DOKLAD, `vkladka-${skala}x-${tema}.png`));
    } else if (tema === 'svetlaya') {
      await sharp(syroj).extract({ left: 0, top: 0, width: Math.min(W, 500 * skala), height: Math.round(40 * skala) }).toFile(join(DOWOD, `dowod-${w}-${skala}x.png`));
    }
    rmSync(syroj);
    rmSync(udd, { recursive: true, force: true });
    przebiegi[`${w}-${klucz}`] = wynik;
    console.log(`${w} ${skala}x ${tema}: ${msg}; иконки ${zaprosIkon.join(', ') || 'не запрошены'}; зелёных ${wynik.zielonych}, красных ${wynik.czerwonych}`);
  }

  // Выводы.
  const doli = (a, b) => { let n = 0, max = 0; for (let i = 0; i < a.length; i += 3) { const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); if (d > 8) n++; if (d > max) max = d; } return { dolya: +(n / (a.length / 3)).toFixed(3), max }; };
  const wniosek = {};
  for (const k of ['a-1-svetlaya', 'a-2-svetlaya', 'a-1-temnaya', 'a-2-temnaya', 'c-1-svetlaya', 'c-2-svetlaya']) {
    const ok = przebiegi[k].zielonych >= 0.9;
    wniosek[k] = ok ? 'рисует favicon.svg' : 'НЕ зелёный — вывод не подтверждён';
    if (!ok) bledy.push(`${k}: зелёного в рамке ${przebiegi[k].zielonych}, ждали не меньше 0,9`);
  }
  for (const s of [1, 2]) {
    const k = `b-${s}-svetlaya`;
    const kontrol = doli(piksele[k], piksele[`0-${s}-svetlaya`]);
    przebiegi[k].protiv_0 = kontrol;
    const ok = przebiegi[k].czerwonych < 0.01 && kontrol.dolya <= 0.02;
    wniosek[k] = ok ? 'правка PNG и ICO до вкладки не дошла: рамка та же, что без правки' : 'НЕ как без правки — вывод не подтверждён';
    if (!ok) bledy.push(`${k}: красных ${przebiegi[k].czerwonych}, против варианта 0 — доля ${kontrol.dolya}, макс ${kontrol.max}`);
  }
  for (const k of ['0-1-svetlaya', '0-2-svetlaya', '0-1-temnaya', '0-2-temnaya']) if (przebiegi[k].zielonych > 0.01 || przebiegi[k].czerwonych > 0.01) bledy.push(`${k}: в контроле контрольный цвет`);

  // Пара «эскиз / вкладка».
  root = join(KOPIE, 'dowod-0');
  const bez = await chromium.launch({ executablePath: CHROME });
  const para = {};
  const obrazki = {};
  for (const s of [1, 2]) {
    const ctx = await bez.newContext({ viewport: { width: 64, height: 64 }, deviceScaleFactor: s });
    const p = await ctx.newPage();
    await p.setContent('<html><body style="margin:0"><img src="http://localhost:4943/favicon.svg" width="16" height="16" style="display:block"></body></html>');
    await p.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth > 0);
    const png = await p.screenshot({ clip: { x: 0, y: 0, width: 16, height: 16 } });
    await ctx.close();
    const imit = await sharp(png).removeAlpha().raw().toBuffer();
    obrazki[`eskiz-${s}`] = { buf: imit, w: 16 * s };
    for (const tema of ['svetlaya', 'temnaya']) {
      const k = `0-${s}-${tema}`;
      const r = ramki[`${s}-${tema}`];
      para[k] = r.w === 16 * s && r.h === 16 * s ? doli(piksele[k], imit) : { blad: 'рамка не того размера' };
      obrazki[k] = { buf: piksele[k], w: r.w };
    }
  }
  await bez.close();
  // Лист пары: увеличение 8, подписи.
  const dataUrl = async ({ buf, w }) => `data:image/png;base64,${(await sharp(buf, { raw: { width: w, height: w, channels: 3 } }).png().toBuffer()).toString('base64')}`;
  const komorka = async (k, podpis) => `<figure><img src="${await dataUrl(obrazki[k])}" style="width:${16 * 8}px;height:${16 * 8}px"><figcaption>${podpis}</figcaption></figure>`;
  let html = '<html><head><meta charset="utf-8"><style>body{margin:24px;font:14px/1.4 system-ui,sans-serif;background:#f4f4f4;color:#111} .r{display:flex;gap:24px;margin-bottom:24px} figure{margin:0;width:180px} img{image-rendering:pixelated;display:block;border:1px solid #999} figcaption{margin-top:6px}</style></head><body>';
  html += '<p>Фавикон: вкладка Chromium ' + wersja + ' против favicon.svg, нарисованного Chromium без окна в &lt;img&gt; 16 × 16 (так иконку показывал лист эскиза). Увеличение 8, пиксель в пиксель. Доля — пикселей с расхождением больше 8 из 255.</p>';
  for (const s of [1, 2]) {
    html += '<div class="r">';
    html += await komorka(`eskiz-${s}`, `эскиз: favicon.svg в &lt;img&gt;, плотность ${s}`);
    html += await komorka(`0-${s}-svetlaya`, `вкладка, светлая тема, масштаб ${s}: доля ${para[`0-${s}-svetlaya`].dolya}, макс ${para[`0-${s}-svetlaya`].max}`);
    html += await komorka(`0-${s}-temnaya`, `вкладка, тёмная тема, масштаб ${s}: доля ${para[`0-${s}-temnaya`].dolya}, макс ${para[`0-${s}-temnaya`].max}`);
    html += '</div>';
  }
  html += '</body></html>';
  const bl = await chromium.launch({ executablePath: CHROME });
  const lp = await bl.newPage({ viewport: { width: 700, height: 200 }, deviceScaleFactor: 1 });
  await lp.setContent(html);
  await lp.screenshot({ path: join(DOKLAD, 'vkladka-para.png'), fullPage: true });
  await bl.close();

  const kopia0 = readFileSync(join(KOPIE, 'dowod-0', 'index.html'));
  const zapis = {
    instrument: 'vkladka-dowod.mjs',
    brauzer: `Chromium ${wersja}`,
    chrome: CHROME,
    kommit: git('rev-parse', 'HEAD'),
    gryaz_sajta: git('status', '--porcelain', '--', 'sites/7thserpent.com').split('\n').filter(Boolean),
    dist_index_sha256: sha(readFileSync(join(DIST, 'index.html'))),
    kopia_0_ravna_dist: kopia0.equals(readFileSync(join(DIST, 'index.html'))),
    ramki,
    przebiegi,
    wniosek,
    para,
    bledy,
  };
  writeFileSync(join(DOWOD, 'dowod.json'), JSON.stringify({ ...zapis, para: undefined }, null, 2) + '\n');
  writeFileSync(join(DOKLAD, 'vkladka.json'), JSON.stringify({ instrument: zapis.instrument, brauzer: zapis.brauzer, kommit: zapis.kommit, gryaz_sajta: zapis.gryaz_sajta, dist_index_sha256: zapis.dist_index_sha256, snimki: Object.fromEntries(Object.entries(przebiegi).filter(([k]) => k.startsWith('0-'))), para, dowod: 'dowod/dowod.json' }, null, 2) + '\n');
  console.log(JSON.stringify({ wniosek, para, bledy }, null, 2));
} finally {
  server.close();
}
if (bledy.length) process.exitCode = 1;
