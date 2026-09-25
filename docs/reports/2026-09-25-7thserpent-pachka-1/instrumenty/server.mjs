// Статический сервер копии dist/ — node server.mjs <папка> <порт>. Только чтение, только localhost.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const [, , koren, port] = process.argv;
const TIP = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml', '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
createServer((req, res) => {
  const put = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = normalize(join(koren, put));
  if (!f.startsWith(normalize(koren))) { res.writeHead(403).end(); return; }
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }).end(readFileSync(join(koren, '404/index.html'))); return; }
  res.writeHead(200, { 'content-type': TIP[extname(f)] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(readFileSync(f));
}).listen(Number(port), '127.0.0.1', () => console.log(`сервер ${koren} на ${port}`));
