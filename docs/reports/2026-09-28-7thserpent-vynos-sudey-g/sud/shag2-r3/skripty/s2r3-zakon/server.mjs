// Местный сервер только на 127.0.0.1: /_astro/* — из сборки (только чтение), /stranica/<имя>.html — страница из своей папки.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';

const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r3/s2r3-zakon';
const TIPY = { css: 'text/css', webp: 'image/webp', woff2: 'font/woff2', woff: 'font/woff', html: 'text/html; charset=utf-8', svg: 'image/svg+xml' };
createServer((req, res) => {
  const put = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = put.startsWith('/stranica/') ? `${PAPKA}/${put.slice('/stranica/'.length)}` : `${REF}${put}`;
  if (!existsSync(f) || put.includes('..')) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TIPY[f.split('.').pop()] ?? 'application/octet-stream' }).end(readFileSync(f));
}).listen(47813, '127.0.0.1', () => console.log('сервер 127.0.0.1:47813'));
