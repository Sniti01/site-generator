// Чек-лист QA стадии 6 (docs/02_CLAUDE_CODE_TASK.md:127-150) по сборке второго сайта — то, что меряется по dist/
// (сессия 22, П106: «прогнать по сборке и доложить таблицей»). Только чтение; разбор HTML — parse5 ядра.
//   node qa-6.mjs <dist второго сайта>
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'parse5';

const dist = process.argv[2];
if (!dist) { console.error('node qa-6.mjs <dist>'); process.exit(2); }
const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));
const stranicy = obhod(dist).filter((f) => f.endsWith('index.html')).map((f) => ({ url: '/' + relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, ''), html: readFileSync(f, 'utf8') })).sort((a, b) => a.url.localeCompare(b.url));

const uzly = (n, f, out = []) => { if (f(n)) out.push(n); for (const c of n.childNodes ?? []) uzly(c, f, out); if (n.content) uzly(n.content, f, out); return out; };
const atr = (n, i) => n.attrs?.find((a) => a.name === i)?.value;
const tekst = (n) => (n.nodeName === '#text' ? n.value : (n.childNodes ?? []).map(tekst).join(''));
const est = (n, imya) => n.nodeName === imya;

const itogi = [];
const vneshnie = new Map();
const vkhodyashchie = new Map(stranicy.map((s) => [s.url, new Set()]));
for (const s of stranicy) {
  const doc = parse(s.html);
  const main = uzly(doc, (n) => est(n, 'main'))[0];
  const h1 = uzly(doc, (n) => est(n, 'h1')).length;
  const zagolovki = uzly(main, (n) => /^h[1-6]$/.test(n.nodeName)).map((n) => Number(n.nodeName[1]));
  const propuski = zagolovki.filter((l, i) => i > 0 && l > zagolovki[i - 1] + 1).length;
  const title = tekst(uzly(doc, (n) => est(n, 'title'))[0] ?? { nodeName: 'x' }).trim();
  const meta = (k, v) => uzly(doc, (n) => est(n, 'meta') && atr(n, k) === v).map((n) => atr(n, 'content'));
  const description = meta('name', 'description')[0] ?? '';
  const og = ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:locale', 'og:url', 'og:image'].filter((p) => meta('property', p).length);
  const twitter = uzly(doc, (n) => est(n, 'meta') && /^twitter:/.test(atr(n, 'name') ?? '')).length;
  const ld = uzly(doc, (n) => est(n, 'script') && atr(n, 'type') === 'application/ld+json').map((n) => JSON.parse(tekst(n))['@type']);
  const img = uzly(doc, (n) => est(n, 'img'));
  const bezAlt = img.filter((n) => atr(n, 'alt') === undefined).length;
  const pustoyAlt = img.filter((n) => atr(n, 'alt') === '').length;
  const abzacy = uzly(main, (n) => est(n, 'p')).map((n) => tekst(n).replace(/\s+/g, ' ').trim().length);
  for (const a of uzly(doc, (n) => est(n, 'a') && atr(n, 'href'))) {
    const h = atr(a, 'href');
    if (/^https?:\/\//.test(h) && !h.startsWith('https://www.7thserpent.com')) vneshnie.set(h, s.url);
    const put = h.startsWith('/') ? h.split('#')[0] : null;
    if (put && put !== s.url && vkhodyashchie.has(put)) vkhodyashchie.get(put).add(s.url);
  }
  itogi.push({ url: s.url, h1, zagolovkov: zagolovki.length, propuski, title, tLen: title.length, description, dLen: description.length, og, twitter, ld, img: img.length, bezAlt, pustoyAlt, maxP: Math.max(0, ...abzacy) });
}
const povtor = (k) => itogi.filter((x, i) => itogi.findIndex((y) => y[k] === x[k]) !== i).map((x) => x.url);
console.log(`страниц ${itogi.length} (dist ${dist})`);
console.log('адрес | h1 | заголовков в <main> | пропусков уровня | title (знаков) | description (знаков) | og | twitter | JSON-LD | img (без alt / alt="") | самый длинный абзац <main> | входящих ссылок со страниц');
for (const x of itogi) {
  console.log(`${x.url} | ${x.h1} | ${x.zagolovkov} | ${x.propuski} | ${x.tLen} | ${x.dLen} | ${x.og.join(',')} | ${x.twitter} | ${x.ld.join(',') || '—'} | ${x.img} (${x.bezAlt} / ${x.pustoyAlt}) | ${x.maxP} | ${vkhodyashchie.get(x.url).size}`);
}
console.log(`\nh1 ровно один: ${itogi.every((x) => x.h1 === 1)}`);
console.log(`пропуски уровня заголовков в <main>: ${itogi.filter((x) => x.propuski).map((x) => `${x.url} ${x.propuski}`).join(', ') || 'нет'}`);
console.log(`title повторы: ${povtor('title').join(', ') || 'нет'}; длиннее 60: ${itogi.filter((x) => x.tLen > 60).map((x) => `${x.url} ${x.tLen}`).join(', ') || 'нет'}`);
console.log(`description повторы: ${povtor('description').join(', ') || 'нет'}; длиннее 160: ${itogi.filter((x) => x.dLen > 160).map((x) => `${x.url} ${x.dLen}`).join(', ') || 'нет'}; короче 70: ${itogi.filter((x) => x.dLen < 70).map((x) => `${x.url} ${x.dLen}`).join(', ') || 'нет'}`);
console.log(`og:url есть: ${itogi.filter((x) => x.og.includes('og:url')).length}; og:image есть: ${itogi.filter((x) => x.og.includes('og:image')).length}; twitter:* есть: ${itogi.filter((x) => x.twitter).length}`);
console.log(`картинок всего ${itogi.reduce((a, x) => a + x.img, 0)}, без alt ${itogi.reduce((a, x) => a + x.bezAlt, 0)}, alt="" ${itogi.reduce((a, x) => a + x.pustoyAlt, 0)}`);
console.log(`абзацы длиннее 900 знаков: ${itogi.filter((x) => x.maxP > 900).map((x) => `${x.url} ${x.maxP}`).join(', ') || 'нет'}`);
console.log(`страницы без входящих ссылок с других страниц (сироты): ${itogi.filter((x) => vkhodyashchie.get(x.url).size === 0).map((x) => x.url).join(', ') || 'нет'}`);
console.log(`внешние ссылки: ${[...vneshnie].map(([h, u]) => `${h} (${u})`).join('; ') || 'нет'}`);
