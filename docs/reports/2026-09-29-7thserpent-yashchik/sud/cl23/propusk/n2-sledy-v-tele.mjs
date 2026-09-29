// CL23-P: следы Cloudflare, которые П108 п. 5 называет следом («вставки, обфускация, cookies … такой след и значит,
// что Cloudflare включили»), но проверка 11 не считает: на ответах без cf-ray/server/cf-cache-status/cf-mitigated.
// Образцы — ровно порчи из пробы «подсказки причин» (kuki, kuki301, obf, wa), которые остались на здоровом образце
// без Cloudflare, и ручной сниппет Web Analytics (без проксирования Cloudflare сниппет ставится руками).
import { progon, otchet, zapisat, zamenit, sZag, vTelo, B, HOST, igra, YASHCHIK, STRANICY } from './obshchee.mjs';

const vyvod = [];
const STROKI = ['запросы не идут через Cloudflare', 'ответы без Set-Cookie', '/privacy/: без обфускации почты Cloudflare', '/privacy/: адрес ящика открытым текстом', 'HTML страниц = сборка (dist)'];

// а) kuki — Set-Cookie с __cf_bm на главной (сервер nginx, следа в заголовках нет).
const kuki = await progon((k) => zamenit(k, `${B}/`, (o) => sZag(o, { 'set-cookie': 'a=1; path=/, __cf_bm=2; path=/; HttpOnly' })));
vyvod.push(otchet('а) cookie __cf_bm на главной без cf-ray (проба «подсказки причин», kuki)', kuki, { stroki: STROKI }));

// б) kuki301 — __cf_bm у редиректа страницы игры.
const kuki301 = await progon((k) => zamenit(k, `http://${HOST}${igra}`, (o) => sZag(o, { 'set-cookie': '__cf_bm=2; path=/' })));
vyvod.push(otchet('б) cookie __cf_bm у 301 без cf-ray (проба «подсказки причин», kuki301)', kuki301, { stroki: STROKI }));

// в) obf — обфускация почты Cloudflare на /privacy/ без cf-ray.
const obf = await progon((k) => zamenit(k, `${B}/privacy/`, vTelo(YASHCHIK, '<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="1a2b">[email&#160;protected]</a>')));
vyvod.push(otchet('в) обфускация почты на /privacy/ без cf-ray (проба «подсказки причин», obf)', obf, { stroki: STROKI }));

// г) wa — маяк Web Analytics на главной без cf-ray.
const wa = await progon((k) => zamenit(k, `${B}/`, vTelo('</main>', '</main><script defer src="https://static.cloudflareinsights.com/beacon.min.js"></script>')));
vyvod.push(otchet('г) маяк Web Analytics на главной без cf-ray (проба «подсказки причин», wa)', wa, { stroki: STROKI }));

// д) сниппет Web Analytics руками на всех страницах (сайт без проксирования Cloudflare): страница шлёт запросы Cloudflare.
const vse = await progon((k) => {
  for (const u of [...STRANICY.map((p) => `${B}${p.url}`), `${B}/404/`, `${B}/net-takoy-stranicy-m1/`]) zamenit(k, u, vTelo('</main>', `</main><script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"x"}'></script>`));
});
vyvod.push(otchet('д) сниппет Web Analytics на всех страницах без cf-ray: запросы к Cloudflare шлёт страница', vse, { stroki: STROKI }));

zapisat('n2-vyvod.txt', vyvod.join('\n\n'));
