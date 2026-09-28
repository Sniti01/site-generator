// Порчи настоящих страниц сборки 3b78f28 и вызов sverkaStranicy — класс «подпись кадра героя не исчезает молча».
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sverkaStranicy, vhody, SAYT } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs';
import { OBYAZATELNAYA_PODPIS } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/gates/sverka.mjs';

const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const V = vhody(SAYT);
const OB = new Set(OBYAZATELNAYA_PODPIS);
const klon = (o) => JSON.parse(JSON.stringify(o));
const po = (url) => ({
  page: V.struktura.pages.find((p) => p.url === url),
  dane: V.soderzhanie.find((s) => s.dane?.url === url)?.dane,
  html: readFileSync(join(DIST, url.slice(1), 'index.html'), 'utf8'),
});
const zamenit = (s, iz, na) => {
  if (!s.includes(iz)) throw new Error('порча не применилась: ' + iz.slice(0, 60));
  return s.replace(iz, na);
};
const P = (x) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${x.dane.artCaption}</p>`;
const pP = (x, na) => zamenit(x.html, P(x), typeof na === 'function' ? na(x.dane.artCaption) : na);

const SLUCHAI = [
  ['контроль', (x) => x.html],
  // скрытие самой подписи
  ['hidden у подписи', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd hidden>${t}</p>`)],
  ['hidden="until-found" у подписи', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd hidden="until-found">${t}</p>`)],
  ['aria-hidden у подписи', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd aria-hidden="true">${t}</p>`)],
  ['inert у подписи', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd inert>${t}</p>`)],
  ['popover у подписи', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd popover>${t}</p>`)],
  ['класс ядра visually-hidden у подписи', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption visually-hidden" data-astro-cid-n67f4zmd>${t}</p>`)],
  ['style у подписи', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd style="display:none">${t}</p>`)],
  ['без метки области (правило .podpis-geroya[cid] не достаёт — под скримом)', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption">${t}</p>`)],
  // текст подписи скрыт внутри
  ['текст во вложенном span hidden', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd><span hidden>${t}</span></p>`)],
  ['текст во вложенном span aria-hidden', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd><span aria-hidden="true">${t}</span></p>`)],
  ['теневой корень без slot — светлый текст не рисуется', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd><template shadowrootmode="open"></template>${t}</p>`)],
  ['текст в <rp>', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd><ruby><rp>${t}</rp></ruby></p>`)],
  // другой элемент с классом подписи
  ['<dialog> вместо <p> (закрытый — display:none)', (x) => pP(x, (t) => `<dialog class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</dialog>`)],
  ['<datalist> вместо <p>', (x) => pP(x, (t) => `<datalist class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</datalist>`)],
  ['<noscript> вместо <p> (читатель со скриптами не видит)', (x) => pP(x, (t) => `<noscript class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</noscript>`)],
  ['<details> вместо <p> (закрыт, текст вне summary)', (x) => pP(x, (t) => `<details class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</details>`)],
  ['<iframe> вместо <p> (текст — сырой, не рисуется)', (x) => pP(x, (t) => `<iframe class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</iframe>`)],
  ['<textarea> вместо <p> (поле формы)', (x) => pP(x, (t) => `<textarea class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</textarea>`)],
  // обёртки — ждём замечание
  ['обёртка <details>', (x) => pP(x, (t) => `<details><p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</p></details>`)],
  ['обёртка <template>', (x) => pP(x, (t) => `<template><p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</p></template>`)],
  ['обёртка <noscript>', (x) => pP(x, (t) => `<noscript><p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</p></noscript>`)],
  // скрытие предков в герое
  ['hidden у section.hero', (x) => zamenit(x.html, '<section class="hero', '<section hidden class="hero')],
  ['inert у div.geroy', (x) => zamenit(x.html, '<div class="geroy', '<div inert class="geroy')],
  ['aria-hidden у section.hero', (x) => zamenit(x.html, '<section class="hero', '<section aria-hidden="true" class="hero')],
  // место
  ['подпись внутри рамки арта', (x) => zamenit(pP(x, ''), '<div class="hero__art"', `${P(x)}<div class="hero__art"`)],
  ['подпись после героя', (x) => zamenit(pP(x, ''), '</section></div>', `</section></div>${P(x)}`)],
  ['без t-caption', (x) => pP(x, (t) => `<p class="podpis-geroya" data-astro-cid-n67f4zmd>${t}</p>`)],
  ['вторая копия', (x) => pP(x, (t) => P(x) + P(x))],
  ['подпись другой страницы (/movie/) в печати', (x) => pP(x, (t) => `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>Pictured: Max Payne (2001), the game — not the movie</p>`)],
  ['подпись перенесена в alt', (x) => zamenit(pP(x, ''), /alt="[^"]*"/.exec(x.html)[0], `alt="${x.dane.artCaption}"`)],
];

// Порчи содержания вместе с печатью (как напечатает маршрут: `{geroyPechati.podpis && <p …>{podpis}</p>}`).
const SODERZH = [
  ['невидимая подпись: artCaption «\\u200B» (схема tekst() пропускает: trim не режет ZWSP)', '\u200B'],
  ['невидимая подпись: artCaption «\\u2060»', '\u2060'],
  ['невидимая подпись: artCaption «\\u00AD» (мягкий перенос)', '\u00AD'],
  ['подпись не о кадре: «Max Payne»', 'Max Payne'],
  ['подпись другой страницы в содержании и печати', 'Pictured: Max Payne (2001), the game — not the movie'],
  ['подпись — точка', '.'],
];

const out = [];
for (const url of process.argv[2] === 'vse' ? [...OB] : ['/mods/']) {
  const x = po(url);
  for (const [imya, f] of SLUCHAI) {
    let h;
    try {
      h = f(x);
    } catch (e) {
      out.push(`${url} ${imya}: ${e.message}`);
      continue;
    }
    const z = sverkaStranicy({ page: x.page, dane: x.dane, html: h, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB });
    out.push(`${url} ${imya}: ${z.length ? 'ЗАМЕЧАНИЕ — ' + z.join(' | ').slice(0, 200) : 'МОЛЧИТ'}`);
  }
  for (const [imya, t] of SODERZH) {
    const dane = klon(x.dane);
    dane.artCaption = t;
    const h = pP(x, `<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>${t}</p>`);
    const z = sverkaStranicy({ page: x.page, dane, html: h, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OB });
    out.push(`${url} ${imya}: ${z.length ? 'ЗАМЕЧАНИЕ — ' + z.join(' | ').slice(0, 200) : 'МОЛЧИТ'}`);
  }
}
if (process.argv[2] !== 'vse') console.log(out.join('\n'));
else {
  // Сводка по шести страницам: сколько страниц молчит на каждой порче.
  const svod = new Map();
  for (const s of out) {
    const imya = s.replace(/^\/[^ ]*\/ /, '').replace(/: (МОЛЧИТ|ЗАМЕЧАНИЕ[\s\S]*|порча не применилась[\s\S]*)$/, '');
    const r = svod.get(imya) ?? { molchit: 0, zam: 0, ne: 0 };
    if (/: МОЛЧИТ$/.test(s)) r.molchit++;
    else if (/: ЗАМЕЧАНИЕ/.test(s)) r.zam++;
    else r.ne++;
    svod.set(imya, r);
  }
  for (const [k, v] of svod) console.log(`${k}: молчит ${v.molchit}/6, замечание ${v.zam}, не применилась ${v.ne}`);
}
