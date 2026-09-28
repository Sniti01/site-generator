// SV1 «опасный проход» — пересчёт на сервере после выкладки (коммит e6cd82f).
// lftp `find .` печатает только имена; сторож сверяет имена набором. Образец: на сервере те же имена,
// но index.html усечён до 0 байт, а .htaccess — прежний (другие байты): вывод `find .` от этого не меняется.
import { pereschet } from './storozh.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ZDES = fileURLToPath(new URL('.', import.meta.url));
const d = mkdtempSync(join(tmpdir(), 'sv1-pereschet-'));
const stroki = [];
try {
  const FAJLY = [['index.html', '<link rel="canonical" href="https://www.7thserpent.com/">' + 'x'.repeat(5000)], ['.htaccess', 'ErrorDocument 404 /404/index.html\n'], ['robots.txt', 'User-agent: *\n'], ['404/index.html', 'a'], ['privacy/index.html', 'b'], ['sitemap-index.xml', '<x/>'], ['sitemap-0.xml', '<y/>'], ['_astro/a.css', 'a{}']];
  for (const [f, t] of FAJLY) {
    mkdirSync(join(d, f, '..'), { recursive: true });
    writeFileSync(join(d, f), t);
  }
  // Сервер: те же имена. Размеры/байты сторожу не видны — `find .` их не печатает.
  const server = { 'index.html': 0, '.htaccess': 999, 'robots.txt': 14, '404/index.html': 1, 'privacy/index.html': 1, 'sitemap-index.xml': 4, 'sitemap-0.xml': 4, '_astro/a.css': 3 };
  const find = ['./', './_astro/', './404/', './privacy/', ...Object.keys(server).map((f) => './' + f)].join('\n') + '\n';
  const r = pereschet(find, d);
  stroki.push(`P1 ${r.ok ? 'ОПАСНЫЙ ПРОХОД' : 'как надо'} — на сервере index.html 0 байт (локально ${FAJLY[0][1].length}), .htaccess чужих байт; имена те же: ${r.ok ? 'проход' : 'отказ'} | ${r.stroki[0]}`);
} finally {
  rmSync(d, { recursive: true, force: true });
}
const vyvod = stroki.join('\n') + '\n';
writeFileSync(join(ZDES, 'pereschet-klass.txt'), vyvod);
process.stdout.write(vyvod);
