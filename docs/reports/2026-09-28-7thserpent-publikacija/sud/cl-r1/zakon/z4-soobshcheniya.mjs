// CL1-Z-4: ответы Cloudflare, у которых причина видна в самом ответе, а строка ПЛОХО её не называет.
import { progon, pechat, B } from './stend.mjs';

const CF = [['server', 'cloudflare'], ['cf-ray', '8c1f00000000abcd-WAW']];

// a) Bot Fight Mode / WAF: управляемая проверка на всё — 403, cf-mitigated: challenge
const vyzov = () => ({
  status: 403,
  headers: [...CF, ['cf-mitigated', 'challenge'], ['content-type', 'text/html; charset=UTF-8'], ['cache-control', 'private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0']],
  body: '<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title></head><body><noscript>Enable JavaScript and cookies to continue</noscript></body></html>',
});
const a = await progon({ vsem: vyzov });
pechat('Z4a вызов Cloudflare (cf-mitigated: challenge) на каждый запрос', { ...a, plokho: a.plokho.slice(0, 5) });

// b) Full (strict), сертификат сервера не принят краем — 526 на всё
const b = await progon({ vsem: () => ({ status: 526, headers: [...CF, ['content-type', 'text/html']], body: '<!DOCTYPE html><html><head><title>7thserpent.com | 526: Invalid SSL certificate</title></head><body></body></html>' }) });
pechat('Z4b 526 Invalid SSL certificate на каждый запрос', { ...b, plokho: b.plokho.slice(0, 3) });

// c) Bot Fight Mode ставит __cf_bm на HTML
const c = await progon({ htmlZag: [['set-cookie', '__cf_bm=Xyz.abc-1727500000-1.0.1.1-Qq; path=/; expires=Sat, 28-Sep-26 12:30:00 GMT; domain=.7thserpent.com; HttpOnly; Secure; SameSite=None']] });
pechat('Z4c __cf_bm от Cloudflare на главной и /privacy/', c);

// d) Always Use HTTPS включён: http://голый → https://голый (второй скачок будет потом)
const d = await progon({ vsem: (u) => (u === 'http://7thserpent.com/' ? { status: 301, headers: [...CF, ['location', 'https://7thserpent.com/']], body: '' } : undefined) });
pechat('Z4d Always Use HTTPS: http://голый → https://голый', d);

// e) справка «перед нашим файлом», когда блок хостера после него
console.log(`\nИТОГ Z4: a=${a.schet} (первая строка: ${a.plokho[0].imya} ждём ${a.plokho[0].zhdem} факт ${a.plokho[0].fakt}); b=${b.schet}; c=${c.schet} [${c.plokho.map((x) => x.otkuda).join(' | ')}]; d=${d.schet} [${d.plokho.map((x) => `${x.imya}: факт ${x.fakt} — ${x.otkuda}`).join(' | ')}]`);
