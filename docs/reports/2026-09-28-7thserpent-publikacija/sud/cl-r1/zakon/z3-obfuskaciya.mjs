// CL1-Z-3: «без обфускации почты» — ok с пояснением «Email Address Obfuscation выключена», когда
// на /privacy/ нет ни одного адреса (сегодняшняя сборка: адреса нет до «ящик заведён», П43 п. 4).
// Cloudflare страницу без адреса не трогает: ответ при включённой и выключенной настройке один и тот же.
import { progon, pechat } from './stend.mjs';

const vzyat = (r) => r.proverki.find((c) => c.imya.startsWith('/privacy/: без обфускации'));

// a) страница как в dist, настройка ВКЛЮЧЕНА — Cloudflare менять нечего
const a = await progon({});
// b) адрес на странице, настройка ВЫКЛЮЧЕНА
const sAdresom = (b) => Buffer.from(b.toString('utf8').replace('</main>', '<p>Write to <a href="mailto:hello@7thserpent.com">hello@7thserpent.com</a>.</p></main>'));
const b = await progon({ privacyTelo: sAdresom });
// c) адрес на странице, настройка ВКЛЮЧЕНА — Cloudflare переписывает
const c = await progon({
  privacyTelo: (x) =>
    Buffer.from(
      sAdresom(x)
        .toString('utf8')
        .replace('<a href="mailto:hello@7thserpent.com">hello@7thserpent.com</a>', '<a href="/cdn-cgi/l/email-protection#a1c9c4cdcdcee1" ><span class="__cf_email__" data-cfemail="a1c9c4cdcdce">[email&#160;protected]</span></a>')
        .replace('</body>', '<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script></body>'),
    ),
});
for (const [imya, r] of [['a) без адреса, настройка ВКЛ', a], ['b) с адресом, настройка ВЫКЛ', b], ['c) с адресом, настройка ВКЛ', c]]) {
  const x = vzyat(r);
  console.log(`${imya}: ${x.ok ? 'ok' : 'ПЛОХО'} — ${x.otkuda}`);
}
console.log(`\nИТОГ Z3: a=${vzyat(a).ok ? 'ok' : 'ПЛОХО'} «${vzyat(a).otkuda}»; b=${vzyat(b).ok ? 'ok' : 'ПЛОХО'}; c=${vzyat(c).ok ? 'ok' : 'ПЛОХО'}`);
