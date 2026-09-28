// Одна сверка dist/ (`tools/sverka.mjs`, П102 блок В) — порчи прежних сверок пачек 1, 2 и 4 (`proba-sverki-dist.mjs`
// пачки 1 — 9, `proby-p2.mjs --proba` — 77, `proby-p4.mjs --proba` — 59) тестами новой. Порчи правят HTML собранной
// страницы (и копию содержания или структуры) в памяти; каждая обязана дать замечание своей причиной, контроль —
// ни одного. Стенд «страница без героя» — `/404/` (прежде `/pc/`, до героев П96): четыре порчи сверки пачки 2 и одна
// пачки 4 со стендом `/pc/` давали ожидаемое ПЛОХО (П97 п. 3) — здесь они на `/404/`. Где причина нового судьи
// сказана иначе, чем прежнего, у порчи — «новая причина».
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sverkaStranicy, vhody } from '../sverka.mjs';
import { stranica, SAYT } from './obshchee.mjs';

const V = vhody(SAYT);
const OBYAZATELNA = new Set(['/remake/', '/movie/']);
const klon = (o) => JSON.parse(JSON.stringify(o));
/** Страница: структура, содержание, HTML собранной копии. */
const po = (url) => {
  const page = V.struktura.pages.find((p) => p.url === url);
  const dane = V.soderzhanie.find((s) => s.dane?.url === url)?.dane;
  return { page, dane, html: stranica(url) };
};
const sverit = (s, html, dane, page) => sverkaStranicy({ page, dane, html, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OBYAZATELNA });

async function progon(t, PORCHI) {
  for (const x of PORCHI) {
    await t.test(x.imya, () => {
      const h = x.html ? x.html(x.s.html) : x.s.html;
      if (x.html) assert.notEqual(h, x.s.html, 'порча не применилась');
      const dane = x.dane ? x.dane(klon(x.s.dane)) : x.s.dane;
      const page = x.page ? x.page(klon(x.s.page)) : x.s.page;
      const z = sverit(x.s, h, dane, page);
      if (x.prichina === null) assert.deepEqual(z, []);
      else assert.ok(z.some((y) => y.includes(x.prichina)), `ждали «${x.prichina}», получено: ${z.join(' | ').slice(0, 400) || 'замечаний нет'}`);
    });
  }
}

test('контроль: все страницы маршрута сборки — без замечаний', () => {
  for (const s of V.soderzhanie) {
    const x = po(s.dane.url);
    assert.deepEqual(sverit(x, x.html, x.dane, x.page), [], s.dane.url);
  }
});

test('сверка пачки 1 (призыв, кадры рядов, нота): порчи', async (t) => {
  const media = po('/media/');
  const pc = po('/pc/');
  const gl = po('/games-like-max-payne/');
  const s404 = po('/404/');
  const kadrMedia = (h, i) => [...h.matchAll(/<div class="foto kadr-ryadu"[\s\S]*?<\/div>/g)][i][0];
  await progon(t, [
    { imya: 'нота снята', s: media, html: (h) => h.replace(/<p class="ft__art-note[^"]*"[^>]*>[\s\S]*?<\/p>/, ''), prichina: 'кадры есть, а ноты об арте нет' },
    // Стенд: /404/ вместо /pc/ (у /pc/ с П96 герой с кадром).
    { imya: 'нота на странице без кадров', s: s404, html: (h) => h.replace('<div class="ft__legal', '<p class="ft__art-note">Games: Max Payne.</p><div class="ft__legal'), prichina: 'кадров нет, а нота об арте есть' },
    { imya: 'призыв снят', s: pc, html: (h) => h.replace(/<section class="cta"[\s\S]*?<\/section>/, ''), prichina: 'призывов 0, ждали 1' },
    { imya: 'адрес кнопки призыва', s: gl, html: (h) => h.replace(/(<section class="cta"[\s\S]*?href=")\/max-payne-1\/(")/, '$1/remake/$2'), prichina: 'кнопка призыва ведёт на /remake/' },
    { imya: 'призыв не последний', s: media, html: (h) => { const c = h.match(/<section class="cta"[\s\S]*?<\/section>/)[0]; return h.replace(c, '').replace(/(<section class="layer)/, c + '$1'); }, prichina: 'призыв не последний блок <main>' },
    // Новая причина: сверка судит кадр по ряду (прежде — список «кадры страницы […]»).
    { imya: 'кадр ряда снят', s: media, html: (h) => h.replace(kadrMedia(h, 0), ''), prichina: 'кадров ряда 0, ждали 1' },
    { imya: 'кадр ряда подменён', s: media, html: (h) => h.replace(kadrMedia(h, 2), kadrMedia(h, 0)), prichina: 'кадр ряда: в src или srcset ключи' },
    { imya: 'нота перенесена в <main>', s: media, html: (h) => { const n = h.match(/<p class="ft__art-note[^"]*"[^>]*>[\s\S]*?<\/p>/)[0]; return h.replace(n, '').replace('</main>', `<p>${n.replace(/<[^>]+>/g, '')}</p></main>`); }, prichina: 'кадры есть, а ноты об арте нет' },
    // Новая причина: свежесть — по полю ряда, а не «в HTML нет заголовка».
    { imya: 'старый текст (заголовок ряда)', s: pc, html: (h) => h.replace('Controller support on PC', 'Controller support'), prichina: 'заголовок разошёлся с файлом содержания' },
    // Новое: призыв — заголовок, лид, надпись.
    { imya: 'заголовок призыва другой', s: pc, html: (h) => h.replace(/(<h2 class="t-headline cta__title"[^>]*>)[^<]*/, '$1Proba'), prichina: 'заголовок призыва разошёлся' },
    { imya: 'надпись кнопки призыва другая', s: pc, html: (h) => h.replace(/(<a class="btn btn-primary t-button cta__btn"[^>]*>)\s*[^<]*/, '$1Proba'), prichina: 'надпись кнопки призыва' },
  ]);
});

test('сверка пачки 2 (герой, подпись, ряды, нота): порчи', async (t) => {
  const rm = po('/remake/');
  const m2 = po('/max-payne-2/');
  const m3 = po('/max-payne-3/');
  const s404 = po('/404/');
  const IKONY_SYROE = { 'arrow-down': '<path d="m6 9 6 6 6-6"/>', 'arrow-right': '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>' };
  const OBERTKA = /<div class="geroy[^"]*"[^>]*>(?=<section class="hero")/;
  const PODPIS = /<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/;
  const BYLINE = /<div class="byline\b[\s\S]*?<\/div>/;
  const RYAD = (id) => new RegExp(`<section class="layer\\b[^"]*" id="${id}"[\\s\\S]*?</section>`);
  const vzyat = (h, re) => (h.match(re) || [''])[0];
  const zhdemAlt = (k) => `${V.kredity[k].game} — ${V.kredity[k].opis ?? 'publisher material'}`;
  await progon(t, [
    { imya: 'контроль /remake/', s: rm, prichina: null },
    { imya: 'контроль /max-payne-2/', s: m2, prichina: null },
    { imya: 'контроль /max-payne-3/', s: m3, prichina: null },
    { imya: 'контроль /404/', s: s404, prichina: null },
    {
      imya: 'контроль: неразрывные пробелы и края', s: rm, prichina: null,
      html: (h) => h.replace(/(<p class="podpis-geroya[^"]*"[^>]*>Pictured:) /, '$1&nbsp;').replace(/(<h1\b[^>]*>Max) /, '$1&nbsp;'),
      dane: (d) => { d.artCaption = d.artCaption.replace('Pictured: ', 'Pictured: ') + ' \n'; d.primary.label = ' ' + d.primary.label.replace(' ', ' '); d.rows[0].title = d.rows[0].title.replace(' ', ' ') + ' '; return d; },
      page: (p) => { p.h1 = p.h1.replace(' ', ' ') + ' '; return p; },
    },
    { imya: 'контроль: двойной пробел автора byline', s: m2, prichina: null, dane: (d) => { d.byline.author = d.byline.author.replace(' ', '  '); return d; } },
    // Новая причина: h1 считается по всей <main> — ровно один.
    { imya: 'h1 снят', s: rm, html: (h) => h.replace(/<h1\b[\s\S]*?<\/h1>/, ''), prichina: 'h1 в <main>: 0' },
    { imya: 'h1 вынесен из героя', s: rm, html: (h) => { const x = vzyat(h, /<h1\b[\s\S]*?<\/h1>/); return h.replace(x, '').replace('</section></div>', '</section></div>' + x); }, prichina: 'h1 не внутри героя' },
    { imya: 'h1 без hero__title', s: rm, html: (h) => h.replace('class="hero__title t-headline"', 'class="t-headline"'), prichina: 'классы h1 героя' },
    { imya: 'h1 в рамке арта', s: rm, html: (h) => { const x = vzyat(h, /<h1\b[\s\S]*?<\/h1>/); return h.replace(x, '').replace(/(<div class="hero__art"[^>]*>)/, '$1' + x); }, prichina: 'не в колонке текста' },
    { imya: 'id h1 другой', s: rm, html: (h) => h.replace(/(<h1\b[^>]*)id="page-title"/, '$1id="proba"'), prichina: 'у h1 героя нет id="page-title"' },
    { imya: 'aria-labelledby на чужой id', s: rm, html: (h) => h.replace('aria-labelledby="page-title"', 'aria-labelledby="release-date-title"'), prichina: 'aria-labelledby героя «release-date-title»' },
    { imya: 'кадр героя другой (src)', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?<img\b[^>]*?\ssrc="\/_astro\/)mp1-k13/, '$1mp1-k14'), prichina: 'кадр героя: в src или srcset ключи mp1-k14' },
    { imya: 'кадр героя другой (srcset)', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?<img\b[^>]*?\ssrcset="[^"]*?\/_astro\/)mp1-k13/, '$1mp3-k15'), prichina: 'кадр героя: в src или srcset ключи mp3-k15' },
    { imya: 'кадр героя с чужого хоста', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?<img\b[^>]*?\ssrc=")\/_astro\//, '$1https://evil.example/_astro/'), prichina: 'кадр героя: в src или srcset ключи ?' },
    { imya: 'картинка героя снята', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?)<img\b[^>]*>/, '$1'), prichina: 'кадр героя: нет картинки' },
    { imya: 'srcset героя снят', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?<img\b[^>]*?)\ssrcset="[^"]*"/, '$1'), prichina: 'кадр героя: у картинки нет srcset' },
    { imya: 'alt от другого кадра той же игры', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?<img\b[^>]*?\salt=")[^"]*/, '$1' + zhdemAlt('mp1-k14')), prichina: 'кадр героя: alt' },
    // Новое (П102 п. 1, R1-P1-2): размеры картинки — размеры мастера в записи кадра.
    { imya: 'размеры картинки героя не мастера', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>[\s\S]*?<img\b[^>]*?\swidth=")1280"/, '$11300"'), prichina: 'кадр героя: размеры картинки 1300×960' },
    { imya: 'обёртка снята', s: rm, html: (h) => h.replace(OBERTKA, ''), prichina: 'нет обёртки' },
    { imya: 'обёртка закрыта до героя', s: rm, html: (h) => h.replace(OBERTKA, (x) => x + '</div><div>'), prichina: 'нет обёртки' },
    // Новая причина: у обёртки не один ребёнок-элемент.
    { imya: 'byline внутри обёртки после героя', s: m2, html: (h) => { const b = vzyat(h, BYLINE); return h.replace(b, '').replace('</section></div>', '</section>' + b + '</div>'); }, prichina: 'нет обёртки' },
    { imya: 'тон: сталь снята', s: rm, html: (h) => h.replace('class="geroy geroy--stal"', 'class="geroy"'), prichina: 'тон кадра: geroy--stal нет' },
    { imya: 'тон: сталь на ключевом арте', s: m3, html: (h) => h.replace('class="geroy"', 'class="geroy geroy--stal"'), prichina: 'тон кадра: geroy--stal есть' },
    { imya: 'кадровка другая', s: rm, html: (h) => h.replace('--fokus: 55% 60%', '--fokus: 10% 50%'), prichina: 'кадровка 10% 50%' },
    { imya: 'кадровка в data-style перед style', s: rm, html: (h) => h.replace('style="--fokus: 55% 60%"', 'data-style="--fokus: 55% 60%" style="--fokus: 10% 50%"'), prichina: 'кадровка 10% 50%' },
    { imya: 'подпись кадра убрана', s: rm, html: (h) => h.replace(PODPIS, ''), prichina: 'подпись кадра: в <main> 0 шт.' },
    { imya: 'подпись кадра в рамке арта', s: rm, html: (h) => { const x = vzyat(h, PODPIS); return h.replace(x, '').replace('<div class="foto">', '<div class="foto">' + x.replace('podpis-geroya', 'foto__credit')); }, prichina: '(.foto__credit)' },
    { imya: 'копия подписи в рамке арта', s: rm, html: (h) => { const x = vzyat(h, PODPIS); return h.replace('<div class="foto">', '<div class="foto">' + x.replace('podpis-geroya t-caption', 'foto__credit t-micro')); }, prichina: '(.foto__credit)' },
    { imya: 'подпись кадра в колонке текста', s: rm, html: (h) => { const x = vzyat(h, PODPIS); return h.replace(x, '').replace(/(<div class="hero__text"[^>]*>)/, '$1' + x); }, prichina: 'последним элементом героя (место dopisek) — нет' },
    { imya: 'вторая подпись кадра вне героя', s: rm, html: (h) => h.replace('</main>', vzyat(h, PODPIS) + '</main>'), prichina: 'подпись кадра: в <main> 2 шт.' },
    { imya: 'подпись кадра без роли t-caption', s: rm, html: (h) => h.replace('class="podpis-geroya t-caption"', 'class="podpis-geroya t-micro"'), prichina: 'без роли t-caption' },
    { imya: 'текст подписи кадра другой', s: rm, html: (h) => h.replace(/(<p class="podpis-geroya[^"]*"[^>]*>[^<]*)not the remake/, '$1the remake'), prichina: 'текст подписи кадра' },
    { imya: 'подпись кадра разбита на два абзаца', s: rm, html: (h) => h.replace(/(<p class="podpis-geroya[^"]*"[^>]*>[^<]*?), not the remake<\/p>/, '$1</p><p>, not the remake</p>'), prichina: 'последним элементом героя (место dopisek) — нет' },
    { imya: 'подпись кадра без artCaption', s: m2, html: (h) => h.replace('</section></div>', '<p class="podpis-geroya t-caption">Proba</p></section></div>'), prichina: 'подпись кадра напечатана, а в содержании её нет' },
    // Новая причина; обязательна и у /movie/ (П97 п. 5).
    { imya: 'подпись «оригинал» снята с /remake/', s: rm, html: (h) => h.replace(PODPIS, ''), dane: (d) => { delete d.artCaption; return d; }, prichina: 'подпись кадра обязательна у героя /remake/' },
    { imya: 'подпись «not the movie» снята с /movie/', s: po('/movie/'), html: (h) => h.replace(PODPIS, ''), dane: (d) => { delete d.artCaption; return d; }, prichina: 'подпись кадра обязательна у героя /movie/' },
    // Стенд: /404/ вместо /pc/.
    { imya: 'подпись героя без героя', s: s404, html: (h) => h.replace('<main id="content">', '<main id="content"><p class="podpis-geroya t-caption">Proba</p>'), prichina: 'напечатана без героя' },
    { imya: 'адрес главной кнопки другой', s: rm, html: (h) => h.replace('href="#release-date"', 'href="#progress"'), prichina: 'primary: адрес #progress' },
    { imya: 'надпись контурной кнопки другая', s: rm, html: (h) => h.replace('>The 2001 original<', '>Proba<'), prichina: 'secondary: надпись' },
    // Новая причина: кнопок каждого вида — ровно по одной.
    { imya: 'контурной кнопки нет', s: rm, html: (h) => h.replace(/<a class="btn btn-secondary[\s\S]*?<\/a>/, ''), prichina: 'кнопок btn-secondary в герое 0' },
    { imya: 'кнопки перепутаны', s: rm, html: (h) => h.replace('class="btn btn-primary', 'class="btn btn-PROBA').replace('class="btn btn-secondary', 'class="btn btn-primary').replace('class="btn btn-PROBA', 'class="btn btn-secondary'), prichina: 'primary: адрес /max-payne-1/' },
    { imya: 'иконка вправо при якоре', s: rm, html: (h) => h.replace(IKONY_SYROE['arrow-down'], IKONY_SYROE['arrow-right']), prichina: 'иконка главной кнопки' },
    { imya: 'лид другой', s: rm, html: (h) => h.replace('Remedy is rebuilding', 'Remedy is building'), prichina: 'лид героя разошёлся' },
    { imya: '.page-head рядом с героем', s: rm, html: (h) => h.replace('<main id="content">', '<main id="content"><header class="page-head container section"></header>'), prichina: 'при герое напечатана .page-head' },
    { imya: 'секция перед героем', s: rm, html: (h) => h.replace('<main id="content">', '<main id="content"><section class="proba section"></section>'), prichina: 'герой не первый' },
    { imya: 'два героя', s: rm, html: (h) => { const i = h.search(/<section class="hero"/); const j = h.indexOf('</section>', i) + '</section>'.length; return h.slice(0, j) + h.slice(i, j) + h.slice(j); }, prichina: 'героев 2' },
    // Стенд: /404/ вместо /pc/.
    { imya: 'герой без блока', s: s404, html: (h) => h.replace('<main id="content">', '<main id="content"><section class="hero"></section>'), prichina: 'герой напечатан (1), а блока нет' },
    { imya: 'без героя h1 не в .page-head', s: s404, html: (h) => h.replace('<header class="page-head', '<div class="page-head'), prichina: 'без героя h1 не в header.page-head' },
    { imya: 'h1 структуры другой (старая сборка)', s: rm, page: (p) => { p.h1 += ' proba'; return p; }, prichina: 'h1 структуры' },
    { imya: 'ряд удалён', s: rm, html: (h) => h.replace(RYAD('max-payne-4'), ''), prichina: 'рядов в <main> 5' },
    { imya: 'ряды переставлены', s: rm, html: (h) => { const a = vzyat(h, RYAD('voice')); const b = vzyat(h, RYAD('originals')); return h.replace(a, '\u0000').replace(b, a).replace('\u0000', b); }, prichina: 'порядок рядов' },
    { imya: 'id ряда другой', s: rm, html: (h) => h.replace('id="originals"', 'id="originals-proba"'), prichina: 'ряда originals нет в <main>' },
    { imya: 'надзаголовок ряда другой', s: rm, html: (h) => h.replace(/(<section class="layer[^"]*" id="progress"[\s\S]*?<p class="t-label"[^>]*>)[^<]*/, '$1Proba'), prichina: 'ряд progress: year' },
    { imya: 'заголовок ряда другой', s: rm, html: (h) => h.replace('>No date yet<', '>Proba<'), prichina: 'ряд release-date: заголовок' },
    { imya: 'meta ряда другая', s: rm, html: (h) => h.replace(/(<section class="layer[^"]*" id="voice"[\s\S]*?<p class="layer__meta[^"]*"[^>]*>)[^<]*/, '$1Proba'), prichina: 'ряд voice: meta' },
    { imya: 'абзац ряда сокращён', s: rm, html: (h) => h.replace(/(Remedy’s in-house engine|its in-house engine)\./, 'it.'), prichina: 'ряд what-it-is: абзацы' },
    { imya: 'абзац ряда удалён', s: rm, html: (h) => h.replace(/(<section class="layer[^"]*" id="release-date"[\s\S]*?<div class="layer__body[^"]*"[^>]*>[\s\S]*?)<p\b[^>]*>So, as of[\s\S]*?<\/p>/, '$1'), prichina: 'ряд release-date: абзацы' },
    { imya: 'ряд без band', s: rm, html: (h) => h.replace(/(<section class="layer section) band( layer--bez-kadru" id="voice")/, '$1$2'), prichina: 'ряд voice: класс band' },
    { imya: 'ряд с layer--flip', s: m2, html: (h) => h.replace('class="layer section" id="story"', 'class="layer section layer--flip" id="story"'), prichina: 'ряд story: класс layer--flip' },
    { imya: 'ряд без кадра с кадром', s: rm, html: (h) => h.replace('class="layer section layer--bez-kadru" id="progress"', 'class="layer section" id="progress"'), prichina: 'ряд progress: класс layer--bez-kadru' },
    { imya: 'кадр ряда другой', s: m2, html: (h) => h.replace(/(<section class="layer[^"]*" id="story"[\s\S]*?<img\b[^>]*?\ssrc="\/_astro\/)mp2-k01/, '$1mp2-k02'), prichina: 'ряд story: кадр ряда: в src или srcset ключи mp2-k02' },
    { imya: 'кадр ряда без art', s: rm, html: (h) => h.replace(/(<section class="layer[^"]*" id="progress"[\s\S]*?)<\/section>/, (x, a) => a + '<div class="foto kadr-ryadu"><img src="/_astro/mp1-k13.x.webp" alt=""></div></section>'), prichina: 'ряд progress: кадр ряда напечатан, а art нет' },
    { imya: 'поле ряда пусто у сверки', s: rm, html: (h) => h.replace(/(<section class="layer[^"]*" id="voice"[\s\S]*?<p class="t-label"[^>]*>)[^<]*/, '$1'), dane: (d) => { d.rows.find((r) => r.id === 'voice').year = '  '; return d; }, prichina: 'ряд voice: поле ряда пусто' },
    { imya: 'кадр ряда снят', s: m2, html: (h) => h.replace(/(<section class="layer[^"]*" id="story"[\s\S]*?)<div class="foto kadr-ryadu"[^>]*>\s*<img\b[^>]*>/, '$1<div class="foto">'), prichina: 'ряд story: кадров ряда 0' },
    { imya: 'игра ноты другая', s: rm, html: (h) => h.replace(/Games: Max Payne\./, 'Games: Max Payne 3.'), prichina: 'игры ноты' },
    { imya: 'нота об арте снята', s: rm, html: (h) => h.replace(/<p class="ft__art-note[^"]*"[^>]*>[\s\S]*?<\/p>/g, ''), prichina: 'ноты об арте нет' },
    { imya: 'строка класса лицензии снята', s: rm, html: (h) => h.replace(/<p class="ft__art-note[^"]*"[^>]*>\s*License class:[\s\S]*?<\/p>/, ''), prichina: 'нет строки класса' },
    { imya: 'класс лицензии подменён', s: rm, html: (h) => h.replace(/(License class: )[^<]*/, '$1CC BY-SA 4.0.'), prichina: 'класс лицензии ноты' },
    // Стенд: /404/ вместо /pc/.
    { imya: 'нота без кадров', s: s404, html: (h) => h.replace('</body>', '<p class="ft__art-note t-caption">Games: Max Payne.</p></body>'), prichina: 'кадров нет, а нота' },
    { imya: 'datetime подписи другой', s: m2, html: (h) => h.replace(/datetime="(\d{4}-\d{2}-\d{2})"/, 'datetime="2000-01-01"'), prichina: 'datetime 2000-01-01' },
    { imya: 'дата словами другая', s: m2, html: (h) => h.replace(/(<time\b[^>]*>)[^<]*/, '$1January 1, 2000'), prichina: 'подпись даты разошлась' },
    { imya: 'подпись byline убрана', s: m2, html: (h) => h.replace(BYLINE, ''), prichina: 'подписей 0' },
    { imya: 'подпись после первого ряда', s: m2, html: (h) => { const b = vzyat(h, BYLINE); return h.replace(b, '').replace('</main>', b + '</main>'); }, prichina: 'подпись после первого ряда' },
    { imya: 'подпись перед героем', s: m2, html: (h) => { const b = vzyat(h, BYLINE); return h.replace(b, '').replace('<main id="content">', '<main id="content">' + b); }, prichina: 'подпись не после героя' },
    { imya: 'автор подписи другой', s: m2, html: (h) => h.replace(/(<span class="byline__author[^"]*"[^>]*>)[^<]*/, '$1Proba'), prichina: 'автор подписи' },
    { imya: 'приписка другая', s: m2, html: (h) => h.replace(/(<span class="byline__role[^"]*"[^>]*>)[^<]*/, '$1By'), prichina: 'приписка подписи' },
    { imya: 'приписка снята', s: m2, html: (h) => h.replace(/<span class="byline__role[^"]*"[^>]*>[^<]*<\/span>/, ''), prichina: 'приписка подписи' },
    { imya: 'byline без блока', s: m3, html: (h) => h.replace('</section></div>', '</section></div><div class="byline section--light"><p><span class="byline__author">Proba</span></p></div>'), prichina: 'подпись напечатана (1), а блока нет' },
  ]);
});

test('сверка пачки 4 (галерея, нота): порчи', async (t) => {
  const q = po('/quotes/');
  const m2 = po('/max-payne-2/');
  const pc = po('/pc/');
  const s404 = po('/404/');
  const GALEREYA = /<section class="gallery\b[\s\S]*?<\/section>/;
  const PUNKT = (n) => new RegExp(`(?:<li class="gallery__item\\b[\\s\\S]*?<\\/li>){${n - 1}}(<li class="gallery__item\\b[\\s\\S]*?<\\/li>)`);
  const vzyat = (h, re) => (h.match(re) || [''])[0];
  const punkt = (h, n) => (h.match(PUNKT(n)) || [])[1] ?? '';
  const [k1, k2, k3] = q.dane.gallery.items.map((it) => it.art);
  const zhdemAlt = (k) => `${V.kredity[k].game} — ${V.kredity[k].opis ?? 'publisher material'}`;
  await progon(t, [
    { imya: 'контроль /quotes/', s: q, prichina: null },
    { imya: 'контроль /max-payne-2/', s: m2, prichina: null },
    { imya: 'контроль /pc/', s: pc, prichina: null },
    {
      imya: 'контроль: неразрывные пробелы и края', s: q, prichina: null,
      html: (h) => h.replace(/(<figcaption\b[^>]*>Max) /, '$1 '),
      dane: (d) => { d.gallery.items[0].caption = '  ' + d.gallery.items[0].caption + '  \n'; d.gallery.title = d.gallery.title.replace(' ', ' ') + ' '; return d; },
    },
    { imya: 'галерея снята', s: q, html: (h) => h.replace(GALEREYA, ''), prichina: 'галерей 0' },
    { imya: 'вторая галерея', s: q, html: (h) => h.replace('</main>', vzyat(h, GALEREYA) + '</main>'), prichina: 'галерей 2' },
    { imya: 'галерея перед рядами', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, '').replace(/<section class="layer\b/, g + '<section class="layer'); }, prichina: 'галерея не после рядов' },
    { imya: 'галерея перед подписью byline', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, '').replace(/<div class="byline\b/, g + '<div class="byline'); }, prichina: 'галерея раньше подписи byline' },
    { imya: 'галерея после «связанных»', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, '').replace(/(<section class="link-list\b[\s\S]*?<\/section>)/, '$1' + g); }, prichina: 'галерея не перед «связанными»' },
    { imya: 'галерея после призыва', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, '').replace('</main>', g + '</main>'); }, prichina: 'галерея не перед призывом' },
    { imya: 'aria-labelledby на чужой id', s: q, html: (h) => h.replace('aria-labelledby="gallery-title"', 'aria-labelledby="related-title"'), prichina: 'aria-labelledby галереи «related-title»' },
    { imya: 'id заголовка другой', s: q, html: (h) => h.replace('id="gallery-title"', 'id="proba-title"'), prichina: 'нет id="gallery-title"' },
    { imya: 'заголовок без роли t-headline', s: q, html: (h) => h.replace('class="gallery__title t-headline"', 'class="gallery__title"'), prichina: 'классы заголовка галереи' },
    { imya: 'текст заголовка другой', s: q, html: (h) => h.replace(/(<h2 class="gallery__title[^>]*>)[^<]*/, '$1Proba'), prichina: 'заголовок галереи «Proba»' },
    { imya: 'строка под заголовком снята', s: q, html: (h) => h.replace(/<p class="gallery__lead\b[\s\S]*?<\/p>/, ''), prichina: 'строки под заголовком галереи (lead) нет' },
    { imya: 'строка под заголовком другая', s: q, html: (h) => h.replace(/(<p class="gallery__lead\b[^>]*>)[^<]*/, '$1Proba lead'), prichina: 'строка под заголовком галереи «Proba lead»' },
    { imya: 'строка под заголовком без lead', s: q, dane: (d) => { delete d.gallery.lead; return d; }, prichina: 'напечатана, а lead нет' },
    { imya: 'кадр снят', s: q, html: (h) => h.replace(punkt(h, 2), ''), prichina: 'кадров галереи 2, в файле содержания 3' },
    { imya: 'кадры переставлены', s: q, html: (h) => { const a = punkt(h, 1); const b = punkt(h, 2); return h.replace(a, '\u0000').replace(b, a).replace('\u0000', b); }, prichina: `кадр галереи 1 (${k1}): в src или srcset ключи ${k2}` },
    { imya: 'src кадра другой', s: q, html: (h) => h.replace(new RegExp(`(<div class="foto kadr-galerei"[^>]*>\\s*<img\\b[^>]*?\\ssrc="/_astro/)${k2}`), '$1mp2-k00'), prichina: `кадр галереи 2 (${k2}): в src или srcset ключи mp2-k00` },
    { imya: 'srcset кадра другой', s: q, html: (h) => h.replace(new RegExp(`(<img\\b[^>]*?\\ssrcset="[^"]*?/_astro/)${k3}`), '$1mp3-k13'), prichina: `кадр галереи 3 (${k3}): в src или srcset ключи mp3-k13` },
    { imya: 'кадр с чужого хоста', s: q, html: (h) => h.replace(new RegExp(`(<div class="foto kadr-galerei"[^>]*>\\s*<img\\b[^>]*?\\ssrc=")/_astro/(${k1})`), '$1https://evil.example/_astro/$2'), prichina: `кадр галереи 1 (${k1}): в src или srcset ключи ?` },
    { imya: 'alt от другого кадра', s: q, html: (h) => h.replace(new RegExp(`(<img\\b[^>]*?\\ssrc="/_astro/${k1}[^"]*"[^>]*?\\salt=")[^"]*`), '$1' + zhdemAlt('mp1-k12')), prichina: `кадр галереи 1 (${k1}): alt` },
    // Новая причина: картинок в пункте 0.
    { imya: 'картинка кадра снята', s: q, html: (h) => h.replace(/(<div class="foto kadr-galerei"[^>]*>)\s*<img\b[^>]*>/, '$1'), prichina: 'картинок 0, ждали 1' },
    { imya: 'класс тона снят', s: q, html: (h) => h.replace('<div class="foto kadr-galerei">', '<div class="foto">'), prichina: 'без класса тона kadr-galerei' },
    { imya: 'класс тона на чужом элементе', s: q, html: (h) => h.replace('</main>', '<div class="foto kadr-galerei"></div></main>'), prichina: 'kadr-galerei в <main> 4 раз' },
    { imya: 'подпись кадра другая', s: q, html: (h) => { const li = punkt(h, 2); return h.replace(li, li.replace(/(<figcaption\b[^>]*>)[^<]*/, '$1Proba')); }, prichina: `кадр галереи 2 (${k2}): подпись «Proba»` },
    { imya: 'подпись кадра снята', s: q, html: (h) => { const li = punkt(h, 3); return h.replace(li, li.replace(/<figcaption\b[\s\S]*?<\/figcaption>/, '')); }, prichina: `кадр галереи 3 (${k3}): подписей figcaption 0` },
    { imya: 'подпись без роли t-caption', s: q, html: (h) => h.replace('class="gallery__caption t-caption"', 'class="gallery__caption t-micro"'), prichina: 'подпись без роли t-caption' },
    { imya: 'галерея без блока', s: pc, html: (h) => h.replace('</main>', vzyat(q.html, GALEREYA) + '</main>'), prichina: 'галерея напечатана (1), а блока нет' },
    { imya: 'класс тона без галереи', s: m2, html: (h) => h.replace('</main>', '<div class="foto kadr-galerei"></div></main>'), prichina: 'kadr-galerei в <main> без галереи' },
    { imya: 'игра ноты снята', s: q, html: (h) => h.replace(/(Games: [^<]*?), Max Payne 3/, '$1'), prichina: 'игры ноты' },
    { imya: 'нота об арте снята', s: q, html: (h) => h.replace(/<p class="ft__art-note[^"]*"[^>]*>[\s\S]*?<\/p>/g, ''), prichina: 'ноты об арте нет' },
    { imya: 'класс лицензии подменён', s: q, html: (h) => h.replace(/(License class: )[^<]*/, '$1CC BY-SA 4.0.'), prichina: 'класс лицензии ноты' },
    { imya: 'кадр галереи вне ноты (копия содержания)', s: q, dane: (d) => { d.gallery.items[2].art = 'mp2-k00'; return d; }, prichina: 'игры ноты' },
    { imya: 'h1 структуры другой (старая сборка)', s: q, page: (p) => { p.h1 += ' proba'; return p; }, prichina: 'h1 структуры' },
    { imya: 'галерея снята из blocks[] копии структуры', s: q, page: (p) => { p.blocks = p.blocks.filter((b) => b.block !== 'gallery'); return p; }, prichina: 'галерея напечатана (1), а блока нет' },
    { imya: 'поля gallery нет (копия содержания)', s: q, dane: (d) => { delete d.gallery; return d; }, prichina: 'поля gallery в содержании нет' },
    // Новая причина: заголовков h2 в секции — ровно один.
    { imya: 'заголовок h2 галереи снят', s: q, html: (h) => h.replace(/<h2 class="gallery__title[\s\S]*?<\/h2>/, ''), prichina: 'заголовков h2 в галерее 0' },
    { imya: 'srcset кадра снят', s: q, html: (h) => h.replace(/(<div class="foto kadr-galerei"[^>]*>\s*<img\b[^>]*?)\ssrcset="[^"]*"/, '$1'), prichina: 'у картинки нет srcset' },
    { imya: 'строка класса лицензии снята', s: q, html: (h) => h.replace(/<p class="ft__art-note[^"]*"[^>]*>\s*License class:[\s\S]*?<\/p>/, ''), prichina: 'нет строки класса' },
    // Стенд: /404/ вместо /pc/.
    { imya: 'нота без кадров', s: s404, html: (h) => h.replace('</body>', '<p class="ft__art-note t-caption">Games: Max Payne.</p></body>'), prichina: 'кадров нет, а нота' },
    // Новая причина: h1 считается по всей <main> — ровно один.
    { imya: 'h1 снят', s: q, html: (h) => h.replace(/<h1\b[\s\S]*?<\/h1>/, ''), prichina: 'h1 в <main>: 0' },
    { imya: 'галерея внутри последнего ряда', s: q, html: (h) => { const g = vzyat(h, GALEREYA); const bez = h.replace(g, ''); const i = bez.lastIndexOf('<section class="layer'); const j = bez.indexOf('</section>', i); return bez.slice(0, j) + g + bez.slice(j); }, prichina: 'галерея внутри ряда' },
    {
      imya: 'галерея выше героя (копия с галереей)', s: m2,
      html: (h) => h.replace(/(<main\b[^>]*>)/, '$1' + vzyat(q.html, GALEREYA)),
      dane: (d) => { d.gallery = klon(q.dane.gallery); return d; },
      page: (p) => { p.blocks = [...p.blocks, { block: 'gallery' }]; return p; },
      prichina: 'галерея не после героя',
    },
    { imya: 'вторая картинка в кадре', s: q, html: (h) => h.replace(/(<div class="foto kadr-galerei"[^>]*>\s*<img\b[^>]*>)/, '$1<img src="/_astro/mp1-k12.x.webp" alt="">'), prichina: 'картинок 2' },
    { imya: 'лишняя figure в сетке вне li', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, g.replace('</ul>', '<figure><img src="/_astro/mp1-k12.x.webp" alt=""></figure></ul>')); }, prichina: 'в галерее figure 4, img 4' },
    { imya: 'лишний li с двумя классами', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, g.replace('</ul>', '<li class="proba gallery__item"><figure><div class="foto"><img src="/_astro/mp1-k12.x.webp" alt=""></div></figure></li></ul>')); }, prichina: 'кадров галереи 4' },
    { imya: 'текст сцены в кадре вне подписи', s: q, html: (h) => h.replace(/(<figure class="gallery__figure"[^>]*>)/, '$1<p>From Chapter 3</p>'), prichina: 'текст в кадре вне подписи «From Chapter 3»' },
    { imya: 'строка под заголовком после сетки', s: q, html: (h) => { const l = vzyat(h, /<p class="gallery__lead\b[\s\S]*?<\/p>/); const g = vzyat(h, GALEREYA); return h.replace(g, g.replace(l, '').replace('</ul>', '</ul>' + l)); }, prichina: 'стоит после сетки' },
    { imya: 'класс тона вторым словом на чужом элементе', s: q, html: (h) => h.replace('</main>', '<span class="x kadr-galerei"></span></main>'), prichina: 'kadr-galerei в <main> 4 раз' },
    {
      imya: 'галерея внутри героя (копия с галереей)', s: m2,
      html: (h) => { const i = h.search(/<section class="hero"/); const j = h.indexOf('</section>', i); return h.slice(0, j) + vzyat(q.html, GALEREYA) + h.slice(j); },
      dane: (d) => { d.gallery = klon(q.dane.gallery); return d; },
      page: (p) => { p.blocks = [...p.blocks, { block: 'gallery' }]; return p; },
      prichina: 'галерея не после героя',
    },
    { imya: 'лишняя figure без картинки вне li', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, g.replace('</ul>', '</ul><figure></figure>')); }, prichina: 'в галерее figure 4, img 3' },
    { imya: 'лишняя img вне figure', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, g.replace('</ul>', '</ul><img src="/_astro/mp1-k12.x.webp" alt="">')); }, prichina: 'в галерее figure 3, img 4' },
    // Новая причина: <main> — ровно один.
    { imya: '<main> снят', s: q, html: (h) => h.replace(/<main\b[^>]*>/, '<div>').replace('</main>', '</div>'), prichina: '<main> — 0' },
    { imya: 'вторая пустая оболочка .foto в кадре', s: q, html: (h) => h.replace(/(<div class="gallery__frame"[^>]*>)/, '$1<div class="foto"></div>'), prichina: 'оболочек .foto 2' },
    { imya: 'текст сцены после сетки', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, g.replace('</ul>', '</ul><p>From Chapter 3 — the scene</p>')); }, prichina: 'текст в галерее вне кадров и заголовка «From Chapter 3' },
    { imya: 'вторая h2 в галерее', s: q, html: (h) => { const g = vzyat(h, GALEREYA); return h.replace(g, g.replace('</ul>', '</ul><h2>Proba</h2>')); }, prichina: 'заголовков h2 в галерее 2' },
    { imya: 'вторая строка под заголовком', s: q, html: (h) => { const g = vzyat(h, GALEREYA); const l = vzyat(h, /<p class="gallery__lead\b[\s\S]*?<\/p>/); return h.replace(g, g.replace(l, l + l)); }, prichina: 'строк под заголовком галереи 2' },
  ]);
});
