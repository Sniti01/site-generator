// Статический сервер копии dist/ для кадров и сверок сессии 14 — node server.mjs <папка> <порт>.
// Только чтение, только 127.0.0.1. Адрес со слэшем на конце — index.html папки; нет файла —
// код 404 и тело /404/index.html (как у хостинга с ErrorDocument).
// «Судью судят», раунд 1: граница папки — по разделителю пути, а не по префиксу имени
// (R1-INSTR-10: `/..%2fdist-sosed/…` отдавал соседнюю папку с тем же началом имени); битое
// %-кодирование — код 400, а не падение процесса (R1-INSTR-11).
// ПРЕДЕЛЫ (названы, R1-INSTR-12): `/pc` без слэша отдаётся как `/pc/` без перенаправления;
// регистр пути на Windows не различается; типы — только перечисленные ниже, прочее —
// application/octet-stream (в сборке сайта `.mjs`, `.avif`, `.gif` нет).
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';

const [, , papka, port] = process.argv;
const koren = resolve(papka);
const TIP = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml', '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
createServer((req, res) => {
  let put;
  try {
    put = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  let f = resolve(join(koren, put));
  if (f !== koren && !f.startsWith(koren + sep)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }).end(readFileSync(join(koren, '404/index.html')));
    return;
  }
  res.writeHead(200, { 'content-type': TIP[extname(f)] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(readFileSync(f));
}).listen(Number(port), '127.0.0.1', () => console.log(`сервер ${koren} на ${port}`));
