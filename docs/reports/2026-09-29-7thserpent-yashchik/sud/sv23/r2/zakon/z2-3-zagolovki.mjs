// SV23-Z2, образец 3: законные <title> хостера и нашей сборки и законные строки пути (адреса, время) — что печатает
// сторож домена (zagolovokOtveta в причине и bezopasno в строке журнала) против эталона: document.title по разбору
// parse5 (спецификация HTML: первый title пространства HTML, текст детей, сжатие пробелов ASCII) с обрезом 100 + «…».
// Сеть не трогается.
import { writeFileSync, readFileSync } from 'node:fs';

const SV = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/storozha-vykladki.mjs');
const P5 = await import('file:///D:/SEO/cloud/site-generator/node_modules/parse5/dist/index.js');
const { domen, sostoyanieHosta } = SV;
const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-sv23-z2';
const VYVOD = `${PAPKA}/z2-3-zagolovki-vyvod.txt`;
const HTML_NS = 'http://www.w3.org/1999/xhtml';

const W = 'https://www.7thserpent.com/';
const G = 'https://7thserpent.com/';
const otv = (status, telo = '', location = '') => ({ status, telo, location });
const iz = (karta) => async (url) => {
  if (!(url in karta)) throw new Error(`запрос вне образца: ${url}`);
  return karta[url];
};

/** Эталон: document.title по разбору parse5; NBSP — пробелом (сторож сжимает \s, вкладка браузера рисует пробел). */
function etalon(html) {
  const doc = P5.parse(html);
  let naiden = null;
  const obkhod = (n) => {
    if (naiden) return;
    if (n.nodeName === 'title' && n.namespaceURI === HTML_NS) {
      naiden = n;
      return;
    }
    for (const d of n.childNodes ?? []) obkhod(d);
  };
  obkhod(doc);
  if (!naiden) return '';
  const t = naiden.childNodes.filter((d) => d.nodeName === '#text').map((d) => d.value).join('');
  const s = t.replace(/[\t\n\f\r ]+/g, ' ').trim().replace(/\u00a0/g, ' ');
  const z = [...s];
  return z.length > 100 ? `${z.slice(0, 100).join('')}…` : s;
}

const NASH_INDEX = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/dist/index.html', 'utf8');
const NASH_404 = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/dist/404/index.html', 'utf8');
const t = (x) => `<!doctype html><html><head><meta charset="utf-8"><title>${x}</title></head><body></body></html>`;
const ZAGOLOVKI = [
  ['заглушка хостера', t('Поздравляем, сайт создан!')],
  ['&nbsp; и &#x2014;', t('7th&nbsp;Serpent &#x2014; главная')],
  ['&#8212; и &mdash;', t('7th Serpent &#8212; главная &mdash; раз')],
  ['ровно 100 знаков', t('я'.repeat(100))],
  ['101 знак', t('я'.repeat(101))],
  ['150 знаков', t('Ж'.repeat(150))],
  ['пустой', t('')],
  ['только пробелы и перевод строки', t('   \n  ')],
  ['нет title', '<html><head></head><body>x</body></html>'],
  ['наша главная (dist/index.html)', NASH_INDEX],
  ['наша 404 (dist/404/index.html)', NASH_404],
  ['403 Apache', '<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">\n<html><head>\n<title>403 Forbidden</title>\n</head></html>'],
  ['&rsquo; (имя вне короткого списка)', t('Max Payne&rsquo;s guide')],
  ['&copy; и &ldquo;&rdquo;', t('&ldquo;Сайт&rdquo; &copy; 2026')],
  ['двойное экранирование &#38;amp;', t('AT&amp;T &#38;amp; co')],
  ['разделитель :: в заголовке', t('Главная :: 7th Serpent')],
  ['время 12:30', t('Открыто с 12:30')],
  ['эмодзи с ZWJ', t('👩‍💻 Разработка')],
  ['мягкий перенос &#173;', t('Wort&#173;trennung')],
  ['теги внутри title (RCDATA)', t('a <b>b</b>')],
];

const out = [];
let rashozhdeniy = 0;
for (const [imya, telo] of ZAGOLOVKI) {
  const karta = { [W]: otv(200, telo), [G]: otv(301, '', W) };
  const s = await sostoyanieHosta(iz(karta), 'www.7thserpent.com');
  const m = /^ответ \d+(?: — «([\s\S]*)»)?(?:, |$)/.exec(s.pochemu);
  const storozh = m?.[1] ?? '';
  const r = await domen({ poluchit: iz(karta), pervyi: false });
  const stroka = r.stroki[0];
  const vZhurnale = /— «([\s\S]*)» \(/.exec(stroka)?.[1] ?? '';
  const e = etalon(telo);
  const ok1 = storozh === e;
  const ok2 = vZhurnale === e;
  if (!ok1 || !ok2) rashozhdeniy += 1;
  out.push(`== ${imya}`);
  out.push(`  эталон (parse5):      ${JSON.stringify(e)}`);
  out.push(`  причина сторожа:      ${JSON.stringify(storozh)}${ok1 ? '' : '  <-- иначе, чем эталон'}`);
  out.push(`  строка журнала:       ${JSON.stringify(vZhurnale)}${ok2 ? '' : '  <-- иначе, чем эталон'}`);
}

// Строки пути: законные адреса и время в строке журнала после bezopasno.
out.push('');
out.push('== пути запросов в строке журнала (bezopasno — ко всей строке хоста)');
const PUTI = [
  ['редирект на https://www… (схема «://»)', { [W]: otv(301, '', 'https://7thserpent.com/'), [G]: otv(403, '<title>403 Forbidden</title>') }],
  ['путь с «::» (/docs::api/)', { [W]: otv(302, '', '/docs::api/'), 'https://www.7thserpent.com/docs::api/': otv(403, '<title>403 Forbidden</title>'), [G]: otv(301, '', W) }],
  ['адрес IPv6 в Location', { [W]: otv(302, '', 'https://[2a00:7c80::1]/'), 'https://[2a00:7c80::1]/': otv(403, '<title>403 Forbidden</title>'), [G]: otv(301, '', W) }],
];
for (const [imya, karta] of PUTI) {
  const r = await domen({ poluchit: iz(karta), pervyi: false });
  out.push(`  ${imya}: ${r.stroki[0]}`);
}
out.push('');
out.push(`заголовков с расхождением: ${rashozhdeniy} из ${ZAGOLOVKI.length}`);
writeFileSync(VYVOD, out.join('\n') + '\n', 'utf8');
console.log(`записано: ${VYVOD}; расхождений ${rashozhdeniy}`);
