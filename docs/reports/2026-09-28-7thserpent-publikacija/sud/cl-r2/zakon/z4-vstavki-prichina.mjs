// CL2-Z-4: «HTML без вставок Cloudflare и чужих ресурсов» читает тело любого ответа прогона, кроме 301, — и страницы
// Cloudflare вместо нашей (вызов 403 с cf-mitigated, ошибка 522) называет «вставками» с обещанием /privacy/ о сторонних
// запросах. Главная — 200, поэтому охрана `osnova` не срабатывает. Причину (вызов, 522) строка карты называет верно.
// Тела — по виду страниц Cloudflare (вызов «Just a moment...», 5xx с cf.errors.css).
import { progon, pechat, B } from './stend.mjs';

const VYZOV =
  '<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title><meta name="robots" content="noindex,nofollow"></head><body><div class="main-wrapper" role="main"><h1>www.7thserpent.com</h1><p>Verifying you are human.</p></div><script>(function(){window._cf_chl_opt={cRay:"8c1f00000000abcd"};var a=document.createElement("script");a.src="/cdn-cgi/challenge-platform/h/g/orchestrate/chl_page/v1?ray=8c1f00000000abcd";document.getElementsByTagName("head")[0].appendChild(a);}());</script></body></html>';
const E522 =
  '<!DOCTYPE html><html lang="en-US"><head><title>www.7thserpent.com | 522: Connection timed out</title><link rel="stylesheet" id="cf_styles-css" href="/cdn-cgi/styles/cf.errors.css"></head><body><div id="cf-wrapper"><h1>Connection timed out <span>Error code 522</span></h1><a href="https://www.cloudflare.com/5xx-error-landing?utm_source=errorcode_522" target="_blank" rel="noopener noreferrer">cloudflare.com</a></div></body></html>';
const CF = [['server', 'cloudflare'], ['content-type', 'text/html; charset=UTF-8']];
const na = (puti, o2) => (url, o) => (puti.some((p) => url === `${B}${p}`) ? o2 : undefined);

const itog = [];
for (const [imya, v] of [
  ['a) вызов Cloudflare на двух адресах карты (очередь запросов с одного адреса)', { pravka: na(['/pc/', '/quotes/'], { status: 403, headers: [...CF, ['cf-mitigated', 'challenge'], ['cache-control', 'private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0']], body: VYZOV }) }],
  ['b) 522 на одном адресе карты', { pravka: na(['/mods/'], { status: 522, headers: CF, body: E522 }) }],
  // c) настоящие вставки (Web Analytics и JavaScript detections, образец проб CL1-P-6): строка не называет переключатель
  //    Cloudflare, а /cdn-cgi/ — свой домен, не «сторонний запрос».
  ['c) вставки Web Analytics и JS detections на главной (ПЛОХО верно; смотрим подсказку)', {
    pravka: (url, o) => (url === `${B}/` ? { ...o, body: o.body.replace('</body>', "<script defer src=\"https://static.cloudflareinsights.com/beacon.min.js/v8b\" data-cf-beacon='{\"token\":\"x\"}'></script><script>(function(){var a=document.createElement('script');a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.head.appendChild(a)})();</script></body>") } : undefined),
  }],
]) {
  const r = await progon(v);
  pechat(imya, r);
  const c = r.proverki.find((x) => x.imya.startsWith('HTML без вставок'));
  itog.push(`${imya.slice(0, 2)} ${c.ok ? 'ok' : 'ПЛОХО'} «${c.otkuda}»`);
}
console.log(`\nИТОГ Z4: ${itog.join('; ')}`);
