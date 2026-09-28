// CL2-P-4: «HTML без вставок Cloudflare и чужих ресурсов» — по одному образцу на страницу /privacy/ (она обещает:
// «Opening a page sends no requests to anyone else»; «The site’s pages set no cookies and save nothing in your
// browser’s storage»). Каждый образец браузер грузит с чужого хоста (или ставит cookie), инструмент — ok.
// Проверка ищет только `src` у script/link/img/iframe/source/video/audio и `href` у link с rel из списка,
// регуляркой без токенизатора, без раскрытия сущностей и без правил разбора адреса браузером.
//   node p4-vstavki.mjs
import { progon, zamenit, B, stroka, vyvesti } from './obshchee.mjs';

const vyvod = [];
const log = (...a) => vyvod.push(a.join(' '));
const IMYA = 'HTML без вставок Cloudflare и чужих ресурсов';
const KUKI = 'ответы без Set-Cookie';
const OBRAZCY = [
  ['srcset у img', '<img src="/_astro/a.webp" srcset="https://img.tracker.example/a.webp 2x" alt="">'],
  ['srcset у source в picture', '<picture><source srcset="https://img.tracker.example/a.avif" type="image/avif"><img src="/_astro/a.webp" alt=""></picture>'],
  ['style= с url()', '<div style="background-image:url(https://img.tracker.example/bg.png)"></div>'],
  ['<style> с @import (чужой шрифт)', '<style>@import url("https://fonts.googleapis.com/css2?family=Inter");</style>'],
  ['<object data>', '<object data="https://img.tracker.example/pixel.svg" type="image/svg+xml"></object>'],
  ['<embed src>', '<embed src="https://img.tracker.example/pixel.svg" type="image/svg+xml">'],
  ['<video poster>', '<video poster="https://img.tracker.example/p.jpg" controls></video>'],
  ['<input type=image src>', '<input type="image" src="https://img.tracker.example/b.png" alt="go">'],
  ['<svg><image href>', '<svg width="1" height="1"><image href="https://img.tracker.example/x.png"/></svg>'],
  ['<link rel=preconnect>', '<link rel="preconnect" href="https://fonts.gstatic.com">'],
  ['<base href> — все /_astro/… страницы идут на чужой хост', '<base href="https://cdn.tracker.example/">'],
  ['схема сущностью: &#x68;ttps://', '<script src="&#x68;ttps://t.tracker.example/t.js"></script>'],
  ['пробел перед адресом (браузер его срезает)', '<script src=" https://t.tracker.example/t.js"></script>'],
  ['обратные косые: https:\\\\host (браузер читает как //)', '<script src="https:\\\\t.tracker.example/t.js"></script>'],
  ['«>» в значении атрибута до src', '<img alt="2001 > 2003" src="https://img.tracker.example/x.png">'],
  ['встроенный скрипт: sendBeacon, import(), document.cookie, localStorage', "<script>navigator.sendBeacon('https://stats.tracker.example/c',location.href);import('https://stats.tracker.example/m.js');document.cookie='v=1; max-age=31536000; path=/';localStorage.setItem('v','1')</script>"],
];
for (const [imya, vstavka] of OBRAZCY) {
  const r = await progon((k) => zamenit(k, `${B}/privacy/`, (o) => ({ ...o, telo: o.telo.replace('</main>', `${vstavka}</main>`) })));
  log(`${imya}: ${r.itog}; ${stroka(r.najti(IMYA))}${imya.startsWith('встроенный') ? `; ${stroka(r.najti(KUKI))}` : ''}`);
  log(`    вставка: ${vstavka}`);
}
// контроль: образец, который инструмент ловит (src у script на чужой хост)
const kontrol = await progon((k) => zamenit(k, `${B}/privacy/`, (o) => ({ ...o, telo: o.telo.replace('</main>', '<script src="https://t.tracker.example/t.js"></script></main>') })));
log(`контроль (src="https://…" у script): ${kontrol.itog}; ${stroka(kontrol.najti(IMYA))}`);
vyvesti('p4-vstavki', vyvod);
