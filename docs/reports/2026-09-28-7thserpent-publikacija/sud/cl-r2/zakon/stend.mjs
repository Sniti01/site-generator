// Стенд раунда 2: Cloudflare → nginx → Apache по public/.htaccess, public/robots.txt и dist/ сайта (как у раунда 1),
// но каждый ответ можно поправить функцией v.pravka(url, otvet). Сети нет: globalThis.fetch подменяется,
// инструмент идёт своим poluchitSetyu (настоящие Response и Headers undici).
import { readFileSync, existsSync } from 'node:fs';

export const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const INSTR = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/check-live.mjs';
export const CL = await import(INSTR);
export const { proverit, poluchitSetyu } = CL;
export const struktura = JSON.parse(readFileSync(`${SAYT}/structure/structure.json`, 'utf8'));
export const nashRobots = readFileSync(`${SAYT}/public/robots.txt`, 'utf8');
export const HOST = 'www.7thserpent.com';
export const B = `https://${HOST}`;
export const METKA = 'm1';
export const YASHCHIK = 'box@7thserpent.com';
const iz = (p) => readFileSync(`${SAYT}/dist/${p}`, 'utf8');

// Блок хостера — как у раунда 1 (доклад 2026-09-15 §5), перед нашим файлом.
export const HOSTER =
  '# BEGIN adm.tools Managed content\nUser-agent: AhrefsBot\nDisallow: /\n\nUser-agent: MJ12bot\nDisallow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: Bytespider\nDisallow: /\n# END adm.tools Managed content\n\n';

// /privacy/ после «ящик заведён»: строка адреса в ряду журналов хостера. Две формы:
//   ssylka — адрес ссылкой mailto (форма, которой ждёт инструмент);
//   tekst  — адрес открытым текстом в абзаце (форма первого сайта: «Contact on personal data matters: Jakub, jakub@…»;
//            маршрут печатает абзац ряда как `<p>{abzac}</p>` — ссылку из содержания он не делает).
export const PRIV_YAKOR = 'are not used to profile anyone.</p>';
export const privacy = (forma) => {
  const t = iz('privacy/index.html');
  if (!t.includes(PRIV_YAKOR)) throw new Error('нет якоря в privacy/index.html');
  const vstavka =
    forma === 'tekst'
      ? `<p>Requests about the logs go to ${YASHCHIK}.</p>`
      : `<p>Requests about the logs go to <a href="mailto:${YASHCHIK}">${YASHCHIK}</a>.</p>`;
  return t.replace(PRIV_YAKOR, PRIV_YAKOR + vstavka);
};

const CF = [['server', 'cloudflare'], ['cf-ray', '8c1f00000000abcd-WAW']];
const STATIKA = /\.(txt|xml|ico|svg|png|css|js|woff2?|webp)$/i;

export function server(v = {}) {
  const osnova = (urlStr) => {
    const u = new URL(urlStr);
    const p = u.pathname;
    if (STATIKA.test(p)) {
      if (p === '/robots.txt') {
        return { status: 200, headers: [...CF, ['content-type', 'text/plain'], ['cf-cache-status', u.search ? 'MISS' : 'HIT'], ['age', u.search ? '0' : '812']], body: HOSTER + nashRobots };
      }
      if (existsSync(`${SAYT}/dist${p}`)) return { status: 200, headers: [...CF, ['content-type', 'application/xml'], ['cf-cache-status', 'DYNAMIC']], body: iz(p.slice(1)) };
      return { status: 404, headers: [...CF, ['content-type', 'text/html']], body: '<html><head><title>404 Not Found</title></head><body><center><h1>404 Not Found</h1></center><hr><center>nginx</center></body></html>' };
    }
    if (u.protocol === 'http:' || u.host.toLowerCase() !== HOST) {
      const loc = `https://www.7thserpent.com${p}${u.search}`;
      return { status: 301, headers: [...CF, ['location', loc], ['cf-cache-status', 'DYNAMIC'], ['content-type', 'text/html; charset=iso-8859-1']], body: `<html><body><p>The document has moved <a href="${loc}">here</a>.</p></body></html>\n` };
    }
    const HTML = [...CF, ['content-type', 'text/html'], ['cache-control', 'public, max-age=0, must-revalidate'], ['x-ray', 'p542:wal'], ['cf-cache-status', 'DYNAMIC']];
    const fayl = p.endsWith('/') ? `${p.slice(1)}index.html` : null;
    if (fayl !== null && existsSync(`${SAYT}/dist/${fayl}`)) {
      const body = p === '/privacy/' ? privacy(v.privacyForma ?? 'ssylka') : iz(fayl);
      return { status: 200, headers: HTML, body };
    }
    return { status: 404, headers: HTML, body: iz('404/index.html') };
  };
  return (urlStr) => {
    const o = osnova(urlStr);
    return v.pravka ? (v.pravka(urlStr, o) ?? o) : o;
  };
}

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

export const stroka = (c) => `${c.ok ? 'ok   ' : 'ПЛОХО'} ${c.imya}  ждём ${c.zhdem}  факт ${c.fakt}${c.otkuda ? `  — ${c.otkuda}` : ''}`;

export function pechat(zagolovok, r, { vse = false } = {}) {
  console.log(`\n=== ${zagolovok}: ${r.schet}`);
  for (const c of vse ? r.proverki : r.plokho) console.log(stroka(c));
}

/** Заменить заголовок (или добавить) в ответе стенда. */
export const sZag = (o, para) => ({ ...o, headers: [...o.headers.filter(([k]) => !para.some(([n]) => n.toLowerCase() === k.toLowerCase())), ...para] });
