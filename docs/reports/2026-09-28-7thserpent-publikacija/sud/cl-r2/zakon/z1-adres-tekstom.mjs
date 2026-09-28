// CL2-Z-1: строка адреса ящика на /privacy/ в форме первого сайта — открытым текстом в абзаце, без ссылки mailto.
// Маршрут сайта печатает абзац ряда как `<p>{abzac}</p>` ([...slug].astro:581–583): выражение Astro экранирует,
// ссылку из содержания он не делает. Первый сайт (тот же маршрут, та же форма страницы приватности, П106):
// «Contact on personal data matters: Jakub, jakub@ac4bf-thewatch.com.» — открытый текст (dist/privacy/index.html).
import { readFileSync } from 'node:fs';
import { progon, pechat, B, YASHCHIK, PRIV_YAKOR } from './stend.mjs';

const vzyat = (r, s) => r.proverki.find((c) => c.imya.startsWith(s));
const pervyy = readFileSync('D:/SEO/cloud/site-generator/sites/ac4bf-thewatch.com/dist/privacy/index.html', 'utf8');
console.log(`первый сайт, /privacy/: mailto ${/mailto:/i.test(pervyy) ? 'есть' : 'нет'}; строка — «${/Contact on personal data matters:[^<]*/.exec(pervyy)?.[0]}»`);

const vstavit = (html) => (url, o) => (url === `${B}/privacy/` ? { ...o, body: o.body.replace(/<p>Requests about the logs go to[\s\S]*?<\/p>/, html) } : undefined);
const varianty = [
  ['a) форма первого сайта: адрес открытым текстом в абзаце', { privacyForma: 'tekst' }],
  ['b) разметка ссылки в YAML ряда — Astro экранирует её в текст', { pravka: vstavit(`<p>Requests about the logs go to &lt;a href=&quot;mailto:${YASHCHIK}&quot;&gt;${YASHCHIK}&lt;/a&gt;.</p>`) }],
  ['c) ссылка «email us» и адрес открытым текстом рядом в скобках', { pravka: vstavit(`<p>Requests about the logs: <a href="mailto:${YASHCHIK}">email us</a> (${YASHCHIK}).</p>`) }],
  ['d) адрес сущностью &#64; в ссылке и в тексте (браузер показывает box@7thserpent.com)', { pravka: vstavit(`<p>Requests about the logs go to <a href="mailto:box&#64;7thserpent.com">box&#64;7thserpent.com</a>.</p>`) }],
  ['e) контроль: ссылка mailto с адресом в тексте ссылки', {}],
];
const itog = [];
for (const [imya, v] of varianty) {
  const r = await progon(v);
  pechat(imya, r);
  const c = vzyat(r, '/privacy/: адрес ящика');
  itog.push(`${imya.slice(0, 2)} ${c.ok ? 'ok' : 'ПЛОХО'}`);
}
// Адрес на странице есть во всех вариантах — видимый текст:
const S = await import('./stend.mjs');
const tekst = S.privacy('tekst').replace(/<[^>]+>/g, ' ');
console.log(`\nв видимом тексте варианта a) адрес ${tekst.includes(YASHCHIK) ? 'ЕСТЬ' : 'нет'}; якорь «${PRIV_YAKOR}»`);
console.log(`ИТОГ Z1: ${itog.join('; ')}`);
