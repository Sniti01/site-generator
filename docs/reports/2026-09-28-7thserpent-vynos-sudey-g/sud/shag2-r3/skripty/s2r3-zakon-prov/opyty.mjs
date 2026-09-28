// Проверка находок s2r3-zakon (раунд 3) и свой член класса. Репозиторий — только чтение; порчи — в памяти.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const MOYA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r3/s2r3-zakon-prov';
const PW = 'C:/Users/MSI/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const S = await import(pathToFileURL(join(REPO, 'tools/sverka.mjs')).href);
const { OBYAZATELNAYA_PODPIS } = await import(pathToFileURL(join(REPO, 'gates/sverka.mjs')).href);
const V = S.vhody(REPO);
const OB = new Set(OBYAZATELNAYA_PODPIS);
const po = (url) => ({
  page: V.struktura.pages.find((p) => p.url === url),
  dane: V.soderzhanie.find((s) => s.dane?.url === url)?.dane,
  html: readFileSync(join(REF, url.slice(1), 'index.html'), 'utf8'),
});
const sud = (x, h) => S.sverkaStranicy({ page: x.page, dane: x.dane, html: h, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB });
const PODPIS = /(<p class="podpis-geroya t-caption" data-astro-cid-[a-z0-9]+>)([\s\S]*?)(<\/p>)/;
const zap = (h, re, f) => {
  const n = h.replace(re, f);
  if (n === h) throw new Error('порча не применилась ' + re);
  return n;
};
const vyvod = [];
const log = (s) => {
  console.log(s);
  vyvod.push(s);
};

const PORCHI = {
  chistaya: (h) => h,
  // S2R3-Z-1: .foto__credit прямым ребёнком героя перед подписью.
  'z1-kredit-v-geroe': (h) => zap(h, PODPIS, (m) => '<p class="foto__credit t-caption">Pictured: official Max Payne cover art</p>' + m),
  // S2R3-Z-2: метка героя = метка маршрута.
  'z2-metka-marshruta': (h) => zap(h, /(<section class="hero" aria-labelledby="page-title") data-astro-cid-[a-z0-9]+>/, '$1 data-astro-cid-n67f4zmd>'),
  // S2R3-Z-3: U+FEFF вместо пробелов в печати подписи (содержание не тронуто).
  'z3-feff': (h) => zap(h, PODPIS, (m, a, t, b) => a + t.replace(/ /g, '\uFEFF') + b),
  // Свой: полоса шапки (класс .hdr с её меткой: sticky, z-index 50, фон 88 %, размытие) внутри рамки арта — не прямой
  // ребёнок героя, а внутри законного .hero__art: предложенная скептиком правка «дети героя — ровно печать» её не видит.
  'moy-hdr-v-arte': (h) => zap(h, /(<div class="hero__art" data-astro-cid-[a-z0-9]+>)/, '$1<div class="hdr" data-astro-cid-qu2zoq4f>Pictured: official Max Payne cover art<br>&#160;</div>'),
  // Свой: .foto__credit во второй рамке арта (судья смотрит только первую .hero__art).
  'moy-kredit-vo-vtoroy-rame': (h) => zap(h, PODPIS, (m) => '<div class="hero__art" data-astro-cid-m3tnyskv><p class="foto__credit t-caption">Pictured: official Max Payne cover art</p></div>' + m),
};

const stranicy = OBYAZATELNAYA_PODPIS;
const html = {};
for (const [imya, f] of Object.entries(PORCHI)) {
  let molchit = 0;
  const pervye = [];
  for (const url of stranicy) {
    const x = po(url);
    const h = f(x.html);
    if (url === '/remake/') html[imya] = h;
    const z = sud(x, h);
    if (!z.length) molchit++;
    else pervye.push(`${url}: ${z.join(' | ').slice(0, 220)}`);
  }
  log(`СУДЬЯ ${imya}: молчит на ${molchit} из ${stranicy.length}${pervye.length ? '; ' + pervye.slice(0, 2).join(' ;; ') : ''}`);
}

// Браузер: рамка подписи и верхний элемент в пяти её точках; положение героя; нарисованный текст подписи.
const { chromium } = await import(pathToFileURL(PW).href);
const br = await chromium.launch({ headless: true, executablePath: 'C:/Users/MSI/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
for (const [w, hh] of [[1440, 900], [390, 844]]) {
  const ctx = await br.newContext({ viewport: { width: w, height: hh } });
  const pg = await ctx.newPage();
  let tekushchiy = '';
  await pg.route('**/*', (r) => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'proba.local') return r.abort();
    if (u.pathname === '/remake/') return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: tekushchiy });
    try {
      const b = readFileSync(join(REF, decodeURIComponent(u.pathname)));
      const t = { css: 'text/css', webp: 'image/webp', woff2: 'font/woff2', js: 'text/javascript', svg: 'image/svg+xml' }[u.pathname.split('.').pop()] ?? 'application/octet-stream';
      return r.fulfill({ status: 200, contentType: t, body: b });
    } catch {
      return r.fulfill({ status: 404, body: '' });
    }
  });
  for (const imya of Object.keys(PORCHI)) {
    tekushchiy = html[imya];
    await pg.goto('http://proba.local/remake/', { waitUntil: 'load' });
    const r = await pg.evaluate(() => {
      const p = document.querySelector('.podpis-geroya');
      const b = p.getBoundingClientRect();
      const t = [[0.1, 0.5], [0.3, 0.5], [0.5, 0.5], [0.7, 0.5], [0.9, 0.5]].map(([a, c]) => {
        const e = document.elementFromPoint(b.left + a * b.width, b.top + c * b.height);
        return e ? e.tagName.toLowerCase() + '.' + [...e.classList].join('.') : '—';
      });
      const hero = getComputedStyle(document.querySelector('section.hero'));
      return { rama: [b.left, b.right, b.top, b.bottom].map(Math.round).join(','), verh: t.join(' '), hero: hero.position + '/' + hero.overflow, tekst: p.innerText, shirina: Math.round(b.width), vysota: Math.round(b.height) };
    });
    log(`БРАУЗЕР ${w}x${hh} ${imya}: рамка ${r.rama} (${r.shirina}x${r.vysota}); героя ${r.hero}; верх: ${r.verh}; текст «${JSON.stringify(r.tekst).slice(1, -1)}»`);
    if (w === 1440) await pg.screenshot({ path: join(MOYA, `kadr-${imya}.png`), clip: { x: 700, y: 0, width: 740, height: 260 } });
  }
  await ctx.close();
}
await br.close();
writeFileSync(join(MOYA, 'opyty.log'), vyvod.join('\n') + '\n');
