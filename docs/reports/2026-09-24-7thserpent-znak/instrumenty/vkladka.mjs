// Настоящая вкладка браузера с фавиконом (сессия 11, П83 п. 4: приёмка фавикона
// «вкладка браузера»). Chromium 151 с окном открывает собранную главную со своего
// сервера над dist/, PowerShell снимает окно целиком вместе с полосой вкладок
// (okno.ps1, PrintWindow), sharp вырезает верх окна. Четыре снимка: масштаб
// интерфейса 1 и 2 (--force-device-scale-factor), светлый и тёмный интерфейс
// браузера (--force-dark-mode). Окно открывается на экране на пару секунд.
//
//   node vkladka.mjs <папка вывода>
import { createRequire } from 'node:module';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire('C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/package.json')('playwright-core');
const sharp = createRequire('D:/SEO/cloud/site-generator/package.json')('sharp');
const DIST = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/dist';
const OKNO = join(dirname(fileURLToPath(import.meta.url)), 'okno.ps1');
const out = process.argv[2];
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml' };
const zapros = [];
const server = http.createServer(async (rq, rs) => {
  const p = decodeURIComponent(new URL(rq.url, 'http://x').pathname);
  zapros.push(p);
  try {
    let f = join(DIST, p);
    const s = await stat(f).catch(() => null);
    if (s && s.isDirectory()) f = join(f, 'index.html');
    const b = await readFile(f);
    rs.writeHead(200, { 'content-type': mime[extname(f)] ?? 'application/octet-stream' });
    rs.end(b);
  } catch { rs.writeHead(404); rs.end(); }
});
await new Promise((r) => server.listen(4941, r));

for (const [skala, temnaya] of [[1, false], [2, false], [1, true], [2, true]]) {
  const args = ['--window-position=40,40', '--window-size=900,420', `--force-device-scale-factor=${skala}`];
  if (temnaya) args.push('--force-dark-mode');
  const browser = await chromium.launch({ headless: false, executablePath: 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe', args });
  const ctx = await browser.newContext({ viewport: null });
  const page = await ctx.newPage();
  zapros.length = 0;
  await page.goto('http://localhost:4941/');
  await page.waitForTimeout(2500);
  const imie = `vkladka-${skala}x-${temnaya ? 'temnaya' : 'svetlaya'}.png`;
  const syroj = join(out, `_okno-${imie}`);
  const msg = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', OKNO, '-Title', 'Max Payne', '-Out', syroj], { encoding: 'utf8' }).trim();
  const meta = await sharp(syroj).metadata();
  await sharp(syroj).extract({ left: 0, top: 0, width: meta.width, height: Math.min(meta.height, Math.round(150 * skala)) }).toFile(join(out, imie));
  console.log(imie, msg, `Chromium ${browser.version()}`, 'иконки:', zapros.filter((p) => /icon|favicon/.test(p)).join(', '));
  await browser.close();
}
server.close();
