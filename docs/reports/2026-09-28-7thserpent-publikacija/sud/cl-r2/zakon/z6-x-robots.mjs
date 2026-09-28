// CL2-Z-6: «страницы без X-Robots-Tag noindex» — поиск подстрокой /noindex|none/ по всем ответам-страницам прогона,
// включая ответ 404 на несуществующий адрес. Правила Google: `none` — директива целиком (= noindex, nofollow);
// `max-image-preview:none` — только превью картинок, страница индексируется. noindex на ответе 404 ничего не закрывает:
// ответ 404 не индексируется и без него.
import { progon, pechat, B, METKA, sZag } from './stend.mjs';

const struktura = (await import('./stend.mjs')).struktura;
const stranicy = new Set(struktura.pages.map((p) => `${B}${p.url}`));
const vezde = (znach) => (url, o) => (stranicy.has(url) ? sZag(o, [['x-robots-tag', znach]]) : undefined);
const itog = [];
for (const [imya, v] of [
  ['a) max-image-preview:none на страницах (превью картинок, не индекс)', { pravka: vezde('max-image-preview:none') }],
  ['b) noindex только на ответе 404 несуществующего адреса', { pravka: (url, o) => (url === `${B}/net-takoy-stranicy-${METKA}/` ? sZag(o, [['x-robots-tag', 'noindex']]) : undefined) }],
  ['c) контроль: noarchive на страницах', { pravka: vezde('noarchive') }],
  ['d) контроль: noindex на карте сайта', { pravka: (url, o) => (url.endsWith('.xml') ? sZag(o, [['x-robots-tag', 'noindex']]) : undefined) }],
  ['e) контроль: max-image-preview:large, max-snippet:-1 на страницах', { pravka: vezde('max-image-preview:large, max-snippet:-1') }],
]) {
  const r = await progon(v);
  pechat(imya, r);
  itog.push(`${imya.slice(0, 2)} ${r.schet}`);
}
console.log(`\nИТОГ Z6: ${itog.join('; ')}`);
