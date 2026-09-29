// Статический сервер копии сборки для кадров (сессия 22): папка → index.html, нет файла → 404/index.html со статусом 404.
//   node server.mjs <папка> <порт>
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const [, , koren, port] = process.argv;
const TIPY = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml', '.txt': 'text/plain' };
createServer((req, res) => {
  const put = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = normalize(join(koren, put));
  if (!f.startsWith(normalize(koren))) { res.writeHead(403); return res.end(); }
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) {
    res.writeHead(404, { 'content-type': TIPY['.html'] });
    return res.end(readFileSync(join(koren, '404/index.html')));
  }
  res.writeHead(200, { 'content-type': TIPY[extname(f)] ?? 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(Number(port), '127.0.0.1', () => console.log(`сервер ${koren} на http://127.0.0.1:${port}`));
