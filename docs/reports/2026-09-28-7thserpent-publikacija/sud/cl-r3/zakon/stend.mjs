// Стенд раунда 3 («законные формы», CL3-Z): Cloudflare → nginx → Apache по public/.htaccess, public/robots.txt
// и выкладке (по умолчанию — dist/ сайта), сборка инструмента — sborkaIzDist(dist/) инструмента (или своя).
// Два транспорта: в процессе (настоящие Response undici) и настоящий HTTP на 127.0.0.1 (сжатие gzip/br/zstd,
// chunked, ETag, Vary, HTTP-заголовки nginx) — инструмент идёт своим poluchitSetyu, fetch перенаправлен на стенд.
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { gzipSync, brotliCompressSync, zstdCompressSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

export const REPO = 'D:/SEO/cloud/site-generator';
export const SAYT = `${REPO}/sites/7thserpent.com`;
export const DIST = `${SAYT}/dist`;
export const ZDES = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/2a2fa1b5-b706-4952-b80c-ce6acb0f1174/scratchpad/sud/cl-r3/zakon';
export const CL = await import(pathToFileURL(`${SAYT}/tools/check-live.mjs`).href);
export const struktura = JSON.parse(readFileSync(`${SAYT}/structure/structure.json`, 'utf8'));
export const nashRobots = readFileSync(`${SAYT}/public/robots.txt`, 'utf8');
export const HOST = 'www.7thserpent.com';
export const B = `https://${HOST}`;
export const METKA = 'm1';
export const YASHCHIK = 'box@7thserpent.com';
export const REAL_FETCH = globalThis.fetch;

// Блок хостера — как у раундов 1–2 (доклад 2026-09-15 §5), перед нашим файлом.
export const HOSTER =
  '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: Bytespider\nDisallow: /\n# END adm.tools Managed content\n\n';

// /privacy/ после «ящик заведён»: строка адреса открытым текстом в ряду журналов (форма раунда 2, стенд CL2-Z).
const PRIV_YAKOR = 'are not used to profile anyone.</p>';
export const sYashchikom = (t) => {
  if (!t.includes(PRIV_YAKOR)) throw new Error('нет якоря в privacy/index.html');
  return t.replace(PRIV_YAKOR, `${PRIV_YAKOR}<p>Requests about the logs go to ${YASHCHIK}.</p>`);
};

/** Выкладка: файлы по относительному пути (Buffer) — из dist/, /privacy/ со строкой ящика; `pravka(put, tekst)` — HTML. */
export function vykladIzDist({ dist = DIST, pravka } = {}) {
  return (rel) => {
    const f = `${dist}/${rel}`;
    if (!existsSync(f)) return null;
    if (!rel.endsWith('.html')) return readFileSync(f);
    let t = readFileSync(f, 'utf8');
    if (rel === 'privacy/index.html') t = sYashchikom(t);
    if (pravka) t = pravka(rel, t);
    return Buffer.from(t, 'utf8');
  };
}

/** Сборка инструмента: sborkaIzDist(dist) с той же строкой ящика на /privacy/. */
export function sborkaInstrumenta(dist = DIST, pravka, mod = CL) {
  const s = mod.sborkaIzDist(dist);
  return {
    puti: s.puti,
    stranica: (put) => {
      let t = s.stranica(put);
      if (t !== null && put === '/privacy/') t = sYashchikom(t);
      if (t !== null && pravka) t = pravka(put, t);
      return t;
    },
  };
}

const CF = [['server', 'cloudflare'], ['cf-ray', '8c1f00000000abcd-WAW']];
const STATIKA = /\.(txt|xml|ico|svg|png|css|js|woff2?|webp)$/i;
const TIP = { txt: 'text/plain', xml: 'application/xml', css: 'text/css', svg: 'image/svg+xml', webp: 'image/webp', png: 'image/png', ico: 'image/x-icon' };

/** Ответ стенда на адрес: `{ status, headers: [[имя, значение]], body: Buffer|string }`. */
export function server({ vyklad = vykladIzDist(), robots = HOSTER + nashRobots, robotsBez, pravka } = {}) {
  const osnova = (urlStr) => {
    const u = new URL(urlStr);
    const p = u.pathname;
    if (STATIKA.test(p)) {
      if (p === '/robots.txt') {
        const telo = u.search ? robots : (robotsBez ?? robots);
        return { status: 200, headers: [...CF, ['content-type', 'text/plain'], ['cache-control', 'max-age=14400'], ['cf-cache-status', u.search ? 'MISS' : 'HIT'], ['age', u.search ? '0' : '812']], body: telo };
      }
      const b = vyklad(p.slice(1));
      if (b) return { status: 200, headers: [...CF, ['content-type', TIP[p.split('.').pop()] ?? 'application/octet-stream'], ['cf-cache-status', 'DYNAMIC']], body: b };
      return { status: 404, headers: [...CF, ['content-type', 'text/html']], body: '<html><head><title>404 Not Found</title></head><body><center><h1>404 Not Found</h1></center><hr><center>nginx</center></body></html>' };
    }
    if (u.protocol === 'http:' || u.host.toLowerCase() !== HOST) {
      const loc = `https://www.7thserpent.com${p}${u.search}`;
      return { status: 301, headers: [...CF, ['location', loc], ['cf-cache-status', 'DYNAMIC'], ['content-type', 'text/html; charset=iso-8859-1']], body: `<html><body><p>The document has moved <a href="${loc}">here</a>.</p></body></html>\n` };
    }
    const HTML = [...CF, ['content-type', 'text/html'], ['cache-control', 'public, max-age=0, must-revalidate'], ['x-ray', 'p542:wal'], ['cf-cache-status', 'DYNAMIC']];
    const fayl = p.endsWith('/') ? `${p.slice(1)}index.html` : null;
    const b = fayl !== null ? vyklad(fayl) : null;
    if (b) return { status: 200, headers: HTML, body: b };
    return { status: 404, headers: HTML, body: vyklad('404/index.html') };
  };
  return (urlStr) => {
    const o = osnova(urlStr);
    return pravka ? (pravka(urlStr, o) ?? o) : o;
  };
}

/** Транспорт в процессе: globalThis.fetch → настоящий Response из ответа стенда. */
export function vProcesse(s) {
  globalThis.fetch = async (url) => {
    const o = s(String(url));
    return new Response(o.body ?? null, { status: o.status, headers: o.headers });
  };
  return async () => {
    globalThis.fetch = REAL_FETCH;
  };
}

/**
 * Настоящий HTTP на 127.0.0.1: fetch инструмента идёт на стенд с исходным адресом в заголовке; тело HTML сжимается
 * тем, что попросил клиент (как nginx/Cloudflare: br, zstd, gzip), отдаётся кусками без Content-Length, с ETag и Vary.
 * `zhurnal` — какие Accept-Encoding прислал клиент и чем сжато.
 */
export async function poHttp(s, { szhatie = 'kak-prosit' } = {}) {
  const zhurnal = [];
  const srv = createServer((req, res) => {
    const orig = req.headers['x-orig-url'];
    const o = s(orig);
    const ae = String(req.headers['accept-encoding'] ?? '');
    let body = Buffer.isBuffer(o.body) ? o.body : Buffer.from(o.body ?? '', 'utf8');
    const zag = new Map(o.headers.map(([k, v]) => [k.toLowerCase(), v]));
    let enc = '';
    if (szhatie === 'kak-prosit' && /text\/html|text\/plain|xml/.test(zag.get('content-type') ?? '')) {
      if (/\bzstd\b/.test(ae)) enc = 'zstd';
      else if (/\bbr\b/.test(ae)) enc = 'br';
      else if (/\bgzip\b/.test(ae)) enc = 'gzip';
    }
    if (enc === 'zstd') body = zstdCompressSync(body);
    if (enc === 'br') body = brotliCompressSync(body);
    if (enc === 'gzip') body = gzipSync(body);
    zhurnal.push({ url: orig, ae, enc });
    const h = Object.fromEntries(zag);
    if (enc) h['content-encoding'] = enc;
    h.vary = 'Accept-Encoding';
    h.etag = 'W/"65f0c1a2-1b3c"';
    h['alt-svc'] = 'h3=":443"; ma=86400';
    res.writeHead(o.status, h);
    // Куски по 1000 байт: Transfer-Encoding: chunked.
    for (let i = 0; i < body.length; i += 1000) res.write(body.subarray(i, i + 1000));
    res.end();
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  const port = srv.address().port;
  globalThis.fetch = (url, opts = {}) => REAL_FETCH(`http://127.0.0.1:${port}/`, { ...opts, headers: { ...(opts.headers ?? {}), 'x-orig-url': String(url) } });
  return {
    zhurnal,
    zakryt: async () => {
      globalThis.fetch = REAL_FETCH;
      await new Promise((ok) => srv.close(ok));
    },
  };
}

/** Прогон инструмента: `proverit` из модуля `mod` (по умолчанию — инструмент под судом). */
export async function progon({ sborka, mod = CL } = {}) {
  const r = await mod.proverit({ poluchit: mod.poluchitSetyu, host: HOST, struktura, nashRobots, metka: METKA, sborka });
  const plokho = r.proverki.filter((c) => !c.ok);
  return { ...r, plokho, schet: `${r.proverki.length - plokho.length}/${r.proverki.length}` };
}

export const stroka = (c) => `${c.ok ? 'ok   ' : 'ПЛОХО'} ${c.imya}  ждём ${c.zhdem}  факт ${c.fakt}${c.otkuda ? `  — ${c.otkuda}` : ''}`;

export function pechat(zagolovok, r, { vse = false } = {}) {
  console.log(`\n=== ${zagolovok}: ${r.schet}`);
  for (const c of vse ? r.proverki : r.plokho) console.log(stroka(c));
}
