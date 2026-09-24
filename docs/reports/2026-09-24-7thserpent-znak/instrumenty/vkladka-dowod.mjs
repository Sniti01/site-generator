// Какой файл рисует вкладка Chromium (сессия 11; «судью судят», раунд 1, R1-POLNOTA-2:
// журнал запросов не доказывает, что запрошенный файл и нарисован). Доказательство цветом
// на копиях dist/ (сама dist/ только читается):
//   (а) favicon.svg перекрашен в чистый зелёный (#00ff00), PNG и ICO прежние;
//   (б) PNG и ICO перекрашены в чистый красный (#ff0000), SVG прежний;
//   (в) как (а), и порядок ссылок иконок в <head> обратный.
// Chromium с окном открывает копию, окно снимается PrintWindow вместе с полосой вкладок
// (okno.ps1), цвет иконки вкладки меряется в её рамке. Масштаб интерфейса 1 и 2.
// Пишет в папку вывода снимки dowod-<вариант>-<масштаб>x.png и dowod.json (версия
// браузера, запросы иконок, цвет в рамке иконки, вывод).
//   node vkladka-dowod.mjs <папка вывода> <папка для копий>
import { createRequire } from 'node:module';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { cpSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire('C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json')('playwright-core');
const sharp = createRequire('D:/SEO/cloud/site-generator/package.json')('sharp');
const DIST = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/dist';
const OKNO = join(dirname(fileURLToPath(import.meta.url)), 'okno.ps1');
const [, , out, kopie] = process.argv;
mkdirSync(out, { recursive: true });

async function przemaluj(buf, rgb) {
  // Все непрозрачные пиксели, кроме фона-ночи, — в контрольный цвет; фон — тоже контрольный,
  // чтобы иконка вкладки целиком стала этого цвета.
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
const warianty = {
  a: async (d) => {
    const svg = readFileSync(join(d, 'favicon.svg'), 'utf8').replace(/fill="#[0-9a-f]{6}"/gi, 'fill="#00ff00"');
    writeFileSync(join(d, 'favicon.svg'), svg);
  },
  b: async (d) => {
    const red = [255, 0, 0];
    for (const f of ['favicon-16x16.png', 'favicon-32x32.png', 'icon-192.png', 'apple-touch-icon.png']) writeFileSync(join(d, f), await przemaluj(readFileSync(join(d, f)), red));
    writeFileSync(join(d, 'favicon.ico'), ico([[16, await przemaluj(readFileSync(join(d, 'favicon-16x16.png')), red)], [32, await przemaluj(readFileSync(join(d, 'favicon-32x32.png')), red)]]));
  },
  c: async (d) => {
    await warianty.a(d);
    const html = readFileSync(join(d, 'index.html'), 'utf8');
    const linki = html.match(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g);
    let h = html;
    for (const l of linki) h = h.replace(l, '');
    h = h.replace('</head>', linki.reverse().join('') + '</head>');
    writeFileSync(join(d, 'index.html'), h);
  },
};

const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml' };
const dziennik = { warianty: {} };
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

for (const [w, przygotuj] of Object.entries(warianty)) {
  root = join(kopie, `dowod-${w}`);
  rmSync(root, { recursive: true, force: true });
  cpSync(DIST, root, { recursive: true });
  await przygotuj(root);
  for (const skala of [1, 2]) {
    const browser = await chromium.launch({ headless: false, executablePath: 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe', args: ['--window-position=40,40', '--window-size=900,420', `--force-device-scale-factor=${skala}`] });
    dziennik.browser = browser.version();
    const ctx = await browser.newContext({ viewport: null });
    const page = await ctx.newPage();
    zapros.length = 0;
    await page.goto('http://localhost:4943/');
    await page.waitForTimeout(2500);
    const surowy = join(out, `_okno-${w}-${skala}.png`);
    execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', OKNO, '-Title', 'Max Payne', '-Out', surowy], { encoding: 'utf8' });
    const meta = await sharp(surowy).metadata();
    const kadr = join(out, `dowod-${w}-${skala}x.png`);
    await sharp(surowy).extract({ left: 0, top: 0, width: Math.min(meta.width, 500 * skala), height: Math.round(40 * skala) }).toFile(kadr);
    rmSync(surowy);
    // Иконка вкладки: при масштабе 1 — квадрат 16 от (56, 12), при 2 — 32 от (112, 24).
    const { data } = await sharp(kadr).extract({ left: 56 * skala, top: 12 * skala, width: 16 * skala, height: 16 * skala }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let g = 0, r = 0, n = 0;
    for (let i = 0; i < data.length; i += 3) { n++; if (data[i + 1] > 200 && data[i] < 60 && data[i + 2] < 60) g++; if (data[i] > 200 && data[i + 1] < 60 && data[i + 2] < 60) r++; }
    const wynik = { zapros_ikon: zapros.filter((p) => /icon|favicon/.test(p)), zielonych: +(g / n).toFixed(3), czerwonych: +(r / n).toFixed(3) };
    wynik.rysuje = wynik.zielonych > 0.5 ? 'favicon.svg' : wynik.czerwonych > 0.5 ? 'растровые иконки' : 'не контрольный цвет — прежний рисунок';
    dziennik.warianty[`${w}-${skala}x`] = wynik;
    console.log(w, `${skala}x`, JSON.stringify(wynik));
    await browser.close();
  }
}
server.close();
writeFileSync(join(out, 'dowod.json'), JSON.stringify(dziennik, null, 2) + '\n');
