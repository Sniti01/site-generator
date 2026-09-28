// Подставной стек Cloudflare → nginx → Apache по public/.htaccess, public/robots.txt и dist/ сайта.
// Сети нет: globalThis.fetch подменяется, а инструмент идёт своим poluchitSetyu (настоящие Response,
// Headers и text() — регистр имён, склейка повторов, снятие BOM — как у undici).
import { readFileSync, existsSync } from 'node:fs';

export const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const INSTR = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/check-live.mjs';
export const { proverit, poluchitSetyu, razobratRobots, canonicalOf } = await import(INSTR);
export const struktura = JSON.parse(readFileSync(`${SAYT}/structure/structure.json`, 'utf8'));
export const nashRobots = readFileSync(`${SAYT}/public/robots.txt`, 'utf8');
export const HOST = 'www.7thserpent.com';
export const B = `https://${HOST}`;
export const METKA = 'm1';
const iz = (p) => readFileSync(`${SAYT}/dist/${p}`);

// Блок хостера — по докладу 2026-09-15 §5 (AhrefsBot, MJ12bot, GPTBot, Bytespider), перед нашим файлом.
export const HOSTER =
  '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: Bytespider\nDisallow: /\n# END adm.tools Managed content\n\n';

const CF = [['server', 'cloudflare'], ['cf-ray', '8c1f00000000abcd-WAW']];
const APACHE_301 = (loc) =>
  `<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">\n<html><head>\n<title>301 Moved Permanently</title>\n</head><body>\n<h1>Moved Permanently</h1>\n<p>The document has moved <a href="${loc}">here</a>.</p>\n</body></html>\n`;
const STATIKA = /\.(txt|xml|ico|svg|png|css|js|woff2?)$/i;

/**
 * Сервер: url → { status, headers: [[имя, значение]…], body }.
 * v — отклонения от здорового образца (все необязательны):
 *   robotsTelo(url)   — тело robots.txt по адресу (по умолчанию HOSTER + файл public/)
 *   robotsZag(url)    — заголовки robots.txt
 *   htmlZag           — дополнительные заголовки HTML
 *   privacyTelo(buf)  — правка тела /privacy/
 *   kartaTelo(buf)    — правка тела sitemap-0.xml; kartaZag — её заголовки
 *   vsem(url)         — ответ на всё (вызов Cloudflare и т. п.), если вернул не undefined
 */
export function server(v = {}) {
  return (urlStr) => {
    const u = new URL(urlStr);
    if (v.vsem) {
      const o = v.vsem(urlStr);
      if (o) return o;
    }
    const p = u.pathname;
    if (STATIKA.test(p)) {
      // nginx отдаёт статику сам, .htaccess сюда не доходит
      if (p === '/robots.txt') {
        const telo = v.robotsTelo ? v.robotsTelo(urlStr) : HOSTER + nashRobots;
        const zag = v.robotsZag ? v.robotsZag(urlStr) : [['cf-cache-status', u.search ? 'MISS' : 'HIT'], ['age', u.search ? '0' : '812']];
        return { status: 200, headers: [...CF, ['content-type', 'text/plain'], ...zag], body: telo };
      }
      if (existsSync(`${SAYT}/dist${p}`)) {
        let body = iz(p.slice(1));
        if (p === '/sitemap-0.xml' && v.kartaTelo) body = v.kartaTelo(body);
        const zag = p === '/sitemap-0.xml' && v.kartaZag ? v.kartaZag : [['cf-cache-status', 'DYNAMIC']];
        return { status: 200, headers: [...CF, ['content-type', 'application/xml'], ...zag], body };
      }
      return { status: 404, headers: [...CF, ['content-type', 'text/html']], body: '<html><head><title>404 Not Found</title></head><body><center><h1>404 Not Found</h1></center><hr><center>nginx</center></body></html>' };
    }
    // Apache: .htaccess — один 301 на https://www
    if (u.protocol === 'http:' || u.host.toLowerCase() !== HOST) {
      const loc = `https://www.7thserpent.com${p}${u.search}`;
      return { status: 301, headers: [...CF, ['location', loc], ['cf-cache-status', 'DYNAMIC'], ['content-type', 'text/html; charset=iso-8859-1']], body: APACHE_301(loc) };
    }
    const HTML = [...CF, ['content-type', 'text/html'], ['cache-control', 'public, max-age=0, must-revalidate'], ['x-ray', 'p542:wal'], ['cf-cache-status', 'DYNAMIC'], ...(v.htmlZag ?? [])];
    const fayl = p.endsWith('/') ? `${p.slice(1)}index.html` : null;
    if (fayl !== null && existsSync(`${SAYT}/dist/${fayl}`)) {
      let body = iz(fayl);
      if (p === '/privacy/' && v.privacyTelo) body = v.privacyTelo(body);
      if (v.htmlTelo) body = v.htmlTelo(p, body);
      return { status: 200, headers: HTML, body };
    }
    // ErrorDocument 404 /404/index.html — внутренний подзапрос, статус 404
    return { status: 404, headers: HTML, body: v.telo404 ? v.telo404(iz('404/index.html')) : iz('404/index.html') };
  };
}

/** Подменяет fetch: инструмент идёт своим poluchitSetyu через настоящие Response/Headers. */
export function podmenit(s) {
  globalThis.fetch = async (url) => {
    const o = s(String(url));
    return new Response(o.body ?? null, { status: o.status, headers: o.headers });
  };
}

export async function progon(v = {}) {
  podmenit(server(v));
  const r = await proverit({ poluchit: poluchitSetyu, host: HOST, struktura, nashRobots, metka: METKA });
  const plokho = r.proverki.filter((c) => !c.ok);
  return { ...r, plokho, schet: `${r.proverki.length - plokho.length}/${r.proverki.length}` };
}

export const stroka = (c) => `${c.ok ? 'ok   ' : 'ПЛОХО'} ${c.imya.padEnd(52)} ждём ${c.zhdem}  факт ${c.fakt}${c.otkuda ? `  — ${c.otkuda}` : ''}`;

export function pechat(zagolovok, r, { vse = false } = {}) {
  console.log(`\n=== ${zagolovok}: ${r.schet}`);
  for (const c of vse ? r.proverki : r.plokho) console.log(stroka(c));
  for (const s of r.spravki) console.log(`  справка: ${s}`);
}
