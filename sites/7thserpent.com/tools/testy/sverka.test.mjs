// Одна сверка dist/ (`tools/sverka.mjs`, П102 блок В) — порчи прежних сверок пачек 1, 2 и 4 (`proba-sverki-dist.mjs`
// пачки 1 — 9, `proby-p2.mjs --proba` — 77, `proby-p4.mjs --proba` — 59) тестами новой. Порчи правят HTML собранной
// страницы (и копию содержания или структуры) в памяти; каждая обязана дать замечание своей причиной, контроль —
// ни одного. Стенд «страница без героя» — `/404/` (прежде `/pc/`, до героев П96): четыре порчи сверки пачки 2,
// одна пачки 4 и одна пачки 1 («нота на странице без кадров») со стендом `/pc/` давали ожидаемое ПЛОХО (П97 п. 3) —
// здесь они на `/404/`. Где причина нового судьи сказана иначе, чем прежнего, у порчи — «новая причина».
// Раунд 1 «судью судят» блока В — порчи V1-*: проверки прежних сверок, которые новая потеряла, и их пределы.
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { sverkaStranicy, vhody, sverkaSborki } from '../sverka.mjs';
import { stranica, SAYT, dist } from './obshchee.mjs';
import { OBYAZATELNAYA_PODPIS } from '../../gates/sverka.mjs';

const V = vhody(SAYT);
// Страницы, где подпись кадра героя обязательна, — данные сверки сайта, те же, что у сторожа сборки (П103 п. 4).
const OBYAZATELNA = new Set(OBYAZATELNAYA_PODPIS);
const klon = (o) => JSON.parse(JSON.stringify(o));
/** Страница: структура, содержание, HTML собранной копии. */
const po = (url) => {
  const page = V.struktura.pages.find((p) => p.url === url);
  const dane = V.soderzhanie.find((s) => s.dane?.url === url)?.dane;
  return { page, dane, html: stranica(url) };
};
const sverit = (_s, html, dane, page) => sverkaStranicy({ page, dane, html, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: OBYAZATELNA });

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

// Подпись кадра героя обязательна на всех страницах, где стоит сейчас (П103 п. 4, П96; сессия 21, шаг 2):
// снятая подпись — отказ на каждой из шести страниц, названных владельцем; список данных сверки равен
// страницам с `artCaption` в содержании (новая подпись без строки в данных — тоже отказ теста).
const S_PODPISYU = ['/remake/', '/movie/', '/media/', '/mods/', '/quotes/', '/voice-and-face/'];
test('П103 п. 4: подпись кадра героя снята на странице, где стоит сейчас, — замечание (шесть страниц)', async (t) => {
  const PODPIS = /<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/;
  for (const url of S_PODPISYU) {
    await t.test(url, () => {
      const x = po(url);
      assert.ok(x.dane.artCaption, `у ${url} в содержании нет artCaption — стенд разошёлся со словами владельца`);
      assert.match(x.html, PODPIS, `у ${url} в сборке нет подписи кадра`);
      const dane = klon(x.dane);
      delete dane.artCaption;
      const z = sverit(x, x.html.replace(PODPIS, ''), dane, x.page);
      assert.ok(z.some((y) => y.includes(`подпись кадра обязательна у героя ${url}`)), `ждали «подпись кадра обязательна у героя ${url}», получено: ${z.join(' | ').slice(0, 400) || 'замечаний нет'}`);
    });
  }
});

test('П103 п. 4: обязательные подписи в данных сверки = страницы с подписью кадра в содержании', () => {
  const vSoderzhanii = V.soderzhanie.filter((s) => s.dane?.artCaption).map((s) => s.dane.url).sort();
  assert.deepEqual([...OBYAZATELNA].sort(), vSoderzhanii);
  assert.deepEqual(vSoderzhanii, [...S_PODPISYU].sort(), 'подпись кадра стоит не там, где назвал владелец (П103 п. 4)');
});

// «Судью судят», раунд 1 по правке шага 2 (S2R1-*): на шести страницах подпись не может исчезнуть или перестать
// говорить о кадре молча — скрытие атрибутом у подписи и у предков героя, метка области, имя элемента, элементы
// внутри, невидимые и управляющие знаки, страница из списка без героя; сверка слушает свой список, а сторож сборки
// (`astro.config.mjs`) несёт тот же список, что данные сверки.
test('S2R1: подпись кадра на шести страницах — скрыта, подменена или пуста — замечание', async (t) => {
  const PODPIS_TEG = /<p class="podpis-geroya t-caption"( data-astro-cid-[a-z0-9]+)>/;
  const PODPIS = /<p class="podpis-geroya t-caption"[^>]*>([\s\S]*?)<\/p>/;
  const zamenaPodpisi = (h, f) => h.replace(PODPIS, (x, tekst) => f(x, tekst));
  const PORCHI = [
    ['S2R1-K-1 hidden у подписи', (h) => h.replace(PODPIS_TEG, '<p class="podpis-geroya t-caption"$1 hidden>'), null, 'атрибуты подписи кадра вне печати маршрута'],
    ['S2R1-K-1 hidden="until-found" у подписи', (h) => h.replace(PODPIS_TEG, '<p class="podpis-geroya t-caption"$1 hidden="until-found">'), null, 'атрибуты подписи кадра вне печати маршрута'],
    ['S2R1-K-1 aria-hidden у подписи', (h) => h.replace(PODPIS_TEG, '<p class="podpis-geroya t-caption"$1 aria-hidden="true">'), null, 'атрибуты подписи кадра вне печати маршрута'],
    ['S2R1-K-1 inert у подписи', (h) => h.replace(PODPIS_TEG, '<p class="podpis-geroya t-caption"$1 inert>'), null, 'атрибуты подписи кадра вне печати маршрута'],
    ['S2R1-K-1 popover у подписи', (h) => h.replace(PODPIS_TEG, '<p class="podpis-geroya t-caption"$1 popover>'), null, 'атрибуты подписи кадра вне печати маршрута'],
    ['S2R1-K-1 класс visually-hidden у подписи', (h) => h.replace(PODPIS_TEG, '<p class="podpis-geroya t-caption visually-hidden"$1>'), null, 'атрибуты подписи кадра вне печати маршрута'],
    ['S2R1-P-2 класс skip-link у подписи', (h) => h.replace(PODPIS_TEG, '<p class="podpis-geroya t-caption skip-link"$1>'), null, 'атрибуты подписи кадра вне печати маршрута'],
    ['S2R1-K-1 hidden у героя', (h) => h.replace('<section class="hero', '<section hidden class="hero'), null, 'подпись кадра скрыта предком'],
    ['S2R1-K-1 aria-hidden у героя', (h) => h.replace('<section class="hero', '<section aria-hidden="true" class="hero'), null, 'подпись кадра скрыта предком'],
    ['S2R1-K-1 inert у обёртки героя', (h) => h.replace('<div class="geroy', '<div inert class="geroy'), null, 'подпись кадра скрыта предком'],
    ['S2R1-P-2 hidden у <main>', (h) => h.replace('<main id="content"', '<main hidden id="content"'), null, 'подпись кадра скрыта предком'],
    ['S2R1-K-2 подпись без метки области', (h) => h.replace(PODPIS_TEG, '<p class="podpis-geroya t-caption">'), null, 'метки области подписи кадра'],
    ['S2R1-K-3 подпись — <dialog>', (h) => zamenaPodpisi(h, (x) => x.replace(/^<p\b/, '<dialog').replace(/<\/p>$/, '</dialog>')), null, 'подпись кадра — <dialog>'],
    ['S2R1-K-3 подпись — <details>', (h) => zamenaPodpisi(h, (x) => x.replace(/^<p\b/, '<details').replace(/<\/p>$/, '</details>')), null, 'подпись кадра — <details>'],
    ['S2R1-K-3 подпись — <noscript>', (h) => zamenaPodpisi(h, (x) => x.replace(/^<p\b/, '<noscript').replace(/<\/p>$/, '</noscript>')), null, 'подпись кадра — <noscript>'],
    ['S2R1-K-4 текст подписи в <span hidden>', (h) => zamenaPodpisi(h, (x, tekst) => x.replace(tekst, `<span hidden>${tekst}</span>`)), null, 'элементы в подписи кадра'],
    ['S2R1-K-4 текст подписи после теневого корня без slot', (h) => zamenaPodpisi(h, (x, tekst) => x.replace(tekst, `<template shadowrootmode="open"></template>${tekst}`)), null, 'элементы в подписи кадра'],
    ['S2R1-K-4 текст подписи в <ruby><rp>', (h) => zamenaPodpisi(h, (x, tekst) => x.replace(tekst, `<ruby><rp>${tekst}</rp></ruby>`)), null, 'элементы в подписи кадра'],
    ['S2R1-K-5 подпись из одного U+200B', (h) => zamenaPodpisi(h, (x, tekst) => x.replace(tekst, '​')), (d) => { d.artCaption = '​'; return d; }, 'подпись кадра обязательна у героя'],
    ['S2R1-K-5 подпись из одного U+00AD', (h) => zamenaPodpisi(h, (x, tekst) => x.replace(tekst, '­')), (d) => { d.artCaption = '­'; return d; }, 'подпись кадра обязательна у героя'],
    ['S2R1-P-3 подпись задом наперёд (U+202E)', (h) => zamenaPodpisi(h, (x, tekst) => x.replace(tekst, '‮' + tekst)), (d) => { d.artCaption = '‮' + d.artCaption; return d; }, 'невидимые знаки в подписи кадра'],
  ];
  for (const url of S_PODPISYU) {
    for (const [imya, html, dane, prichina] of PORCHI) {
      await t.test(`${url}: ${imya}`, () => {
        const x = po(url);
        const h = html(x.html);
        assert.notEqual(h, x.html, 'порча не применилась');
        const z = sverit(x, h, dane ? dane(klon(x.dane)) : x.dane, x.page);
        assert.ok(z.some((y) => y.includes(prichina)), `ждали «${prichina}», получено: ${z.join(' | ').slice(0, 400) || 'замечаний нет'}`);
      });
    }
  }
});

test('S2R1-P-1: страница из списка обязательных подписей без героя — замечание (снять героя — громко)', () => {
  const s404 = po('/404/');
  for (const url of S_PODPISYU) {
    const page = { ...klon(po(url).page), blocks: klon(s404.page.blocks) };
    const dane = { ...klon(s404.dane), url };
    const z = sverit(s404, s404.html, dane, page);
    assert.ok(z.some((y) => y.includes(`подпись кадра обязательна у героя ${url}`)), `${url}: ${z.join(' | ').slice(0, 300) || 'замечаний нет'}`);
  }
});

test('S2R1-Z-2: сверка слушает переданный список обязательных подписей', () => {
  const media = po('/media/');
  const bez = klon(media.dane);
  delete bez.artCaption;
  const html = media.html.replace(/<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/, '');
  const vne = sverkaStranicy({ page: media.page, dane: bez, html, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: new Set(['/remake/']) });
  assert.ok(!vne.some((y) => y.includes('подпись кадра обязательна')), `/media/ вне списка: ${vne.join(' | ')}`);
  const story = po('/story/');
  assert.ok(!story.dane.artCaption, 'стенд: у /story/ подписи кадра нет');
  const v = sverkaStranicy({ page: story.page, dane: story.dane, html: story.html, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: new Set(['/story/']) });
  assert.ok(v.some((y) => y.includes('подпись кадра обязательна у героя /story/')), `/story/ в списке: ${v.join(' | ') || 'замечаний нет'}`);
});

test('S2R1-P-1: адрес списка, которого нет среди страниц содержания с героем, — замечание сверки сборки', () => {
  for (const url of ['/media', '/net-takoy/', '/404/']) {
    const z = sverkaSborki(dist(), SAYT, { obyazatelnaPodpis: new Set([...OBYAZATELNA, url]) }).zamechaniya;
    assert.ok(z.some((y) => y.url === url && y.chto.includes('из списка обязательных подписей')), `${url}: ${JSON.stringify(z).slice(0, 300)}`);
  }
});

test('S2R1-Z-1, S2R1-K-7: сторож сборки из astro.config.mjs несёт тот же список, что данные сверки', async () => {
  const { default: konfig } = await import('../../astro.config.mjs');
  const integ = konfig.integrations.find((i) => i?.name === 'sayt:sverka-dist');
  assert.ok(integ, 'в astro.config.mjs нет сторожа sayt:sverka-dist');
  assert.deepEqual(integ.obyazatelnaPodpis, OBYAZATELNAYA_PODPIS);
});

// «Судью судят», раунд 2 по правке шага 2 (S2R2-*): предков подписи судили закрытыми списками и только внутри <main>.
// Цепочка «подпись ← section.hero ← div.geroy ← main ← body» и атрибуты каждого звена — ровно печать маршрута и макета:
// нерисуемый элемент между <main> и героем или вокруг <main>, классы сайта и Tailwind, role с детьми-представлением,
// чужая метка у подписи; невидимые знаки не только Cf (Default_Ignorable); хук сторожа сборки судит своим списком.
test('S2R2: подпись кадра на шести страницах — скрыта цепочкой предков или невидимым текстом — замечание', async (t) => {
  const PODPIS_TEG = /<p class="podpis-geroya t-caption"( data-astro-cid-[a-z0-9]+)>/;
  const PODPIS = /<p class="podpis-geroya t-caption"[^>]*>([\s\S]*?)<\/p>/;
  const OBERTKA_S = /<div class="geroy[\s\S]*?<\/section><\/div>/;
  const MAIN = /<main id="content">[\s\S]*<\/main>/;
  const vObertku = (h, teg) => h.replace(OBERTKA_S, (x) => `<${teg}>${x}</${teg.split(' ')[0]}>`);
  const vokrugMain = (h, teg) => h.replace(MAIN, (x) => `<${teg}>${x}</${teg.split(' ')[0]}>`);
  const tekstPodpisi = (znaki) => [(h) => h.replace(PODPIS, (x, tekst) => x.replace(tekst, znaki)), (d) => { d.artCaption = znaki; return d; }];
  const SKRYTA = 'подпись кадра скрыта предком';
  const PORCHI = [
    ...['details', 'dialog', 'noscript', 'datalist', 'canvas', 'video', 'audio', 'rp'].map((teg) => [`S2R2-K-1 <${teg}> между <main> и обёрткой героя`, (h) => vObertku(h, teg), null, SKRYTA]),
    ...['div hidden', 'div aria-hidden="true"', 'div inert', 'div class="visually-hidden"', 'details', 'noscript'].map((teg) => [`S2R2-K-2 <${teg}> вокруг <main>`, (h) => vokrugMain(h, teg), null, SKRYTA]),
    ['S2R2-K-3 класс шапки hdr__drawer с её меткой у героя', (h) => h.replace('<section class="hero"', '<section class="hero hdr__drawer" data-astro-cid-qu2zoq4f'), null, SKRYTA],
    ['S2R2-K-3 класс шапки hdr__burger-close с её меткой у <main>', (h) => h.replace('<main id="content"', '<main class="hdr__burger-close" data-astro-cid-qu2zoq4f id="content"'), null, SKRYTA],
    ['S2R2-Z-5 класс md:hidden у обёртки героя', (h) => h.replace('<div class="geroy', '<div class="md:hidden geroy'), null, SKRYTA],
    ['S2R2-Z-5 класс opacity-0 у героя', (h) => h.replace('<section class="hero"', '<section class="hero opacity-0"'), null, SKRYTA],
    ['S2R2-Z-3 класс visually-hidden у обёртки героя', (h) => h.replace('<div class="geroy', '<div class="visually-hidden geroy'), null, SKRYTA],
    ['S2R2-Z-3 класс sr-only у героя', (h) => h.replace('<section class="hero"', '<section class="hero sr-only"'), null, SKRYTA],
    ['S2R2-Z-3 класс hidden у <main>', (h) => h.replace('<main id="content"', '<main class="hidden" id="content"'), null, SKRYTA],
    ['S2R2-Z-3 popover у героя', (h) => h.replace('<section class="hero"', '<section popover class="hero"'), null, SKRYTA],
    ['S2R2-K-4 role="img" у героя', (h) => h.replace('<section class="hero"', '<section role="img" aria-label="Max Payne" class="hero"'), null, SKRYTA],
    ['S2R2-K-4 role="img" у обёртки героя', (h) => h.replace('<div class="geroy', '<div role="img" aria-label="Max Payne" class="geroy'), null, SKRYTA],
    ['S2R2-K-4 role="img" у <main>', (h) => h.replace('<main id="content"', '<main role="img" aria-label="Max Payne" id="content"'), null, SKRYTA],
    ['S2R2-Z-2 чужая метка области у подписи (метка героя)', (h) => h.replace(PODPIS_TEG, '<p class="podpis-geroya t-caption" data-astro-cid-m3tnyskv>'), null, 'метки области подписи кадра'],
    ...['️', '︀︁︎️', '឴', '឵', '᠋', '᠏', '\u{E0100}', '\u{E01EF}'].map((znaki) => [`S2R2-K-5 подпись из ${[...znaki].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase()).join(' ')}`, ...tekstPodpisi(znaki), 'подпись кадра обязательна у героя']),
  ];
  for (const url of S_PODPISYU) {
    for (const [imya, html, dane, prichina] of PORCHI) {
      await t.test(`${url}: ${imya}`, () => {
        const x = po(url);
        const h = html(x.html);
        assert.notEqual(h, x.html, 'порча не применилась');
        const z = sverit(x, h, dane ? dane(klon(x.dane)) : x.dane, x.page);
        assert.ok(z.some((y) => y.includes(prichina)), `ждали «${prichina}», получено: ${z.join(' | ').slice(0, 400) || 'замечаний нет'}`);
      });
    }
  }
});

// «Судью судят», раунд 3 (последний) по правке шага 2 (S2R3-*): белый список держит цепочку предков, мимо неё —
// теневой корень у звена, сосед в герое и поддерево рамки арта и скрима (перекрытие по CSS сайта), носители скрипта
// без <script>, meta refresh в <body>, невидимые знаки только в печати. Перекрытие элементом вне героя (шапка, подвал,
// ряды — любое правило сайта с position и z-index) по разметке не судится — предел, test.todo ниже.
test('S2R3: подпись кадра на шести страницах — теневой корень, сосед, скрипт без <script>, refresh, печать — замечание', async (t) => {
  const PODPIS = /<p class="podpis-geroya t-caption"[^>]*>([\s\S]*?)<\/p>/;
  const pered = (h, chto, vstavka) => {
    const i = h.indexOf(chto);
    assert.ok(i >= 0, `стенд: нет «${chto}»`);
    return h.slice(0, i) + vstavka + h.slice(i);
  };
  const TEN ='<template shadowrootmode="open"></template>';
  const IFRAME = `<iframe hidden srcdoc="&lt;script&gt;parent.document.querySelector('.podpis-geroya').textContent='PODMENA'&lt;/script&gt;"></iframe>`;
  const PORCHI = [
    ['S2R3-K-1 теневой корень у героя', (h) => h.replace(/(<section class="hero"[^>]*>)/, `$1${TEN}`), 'теневой корень'],
    ['S2R3-K-1 теневой корень у <main>', (h) => h.replace('<main id="content">', `<main id="content">${TEN}`), 'теневой корень'],
    ['S2R3-K-1 теневой корень у <body>', (h) => h.replace(/(<body[^>]*>)/, `$1${TEN}`), 'теневой корень'],
    ['S2R3-K-1 теневой корень с именованным слотом у героя', (h) => h.replace(/(<section class="hero"[^>]*>)/, '$1<template shadowrootmode="open"><slot name="x"></slot></template>'), 'теневой корень'],
    ['S2R3-P-1 закрытый теневой корень в <main>', (h) => h.replace('<main id="content">', '<main id="content"><template shadowrootmode="closed"><p>x</p></template>'), 'теневой корень'],
    ['S2R3-K-2 .foto__credit — ребёнок героя перед подписью', (h) => pered(h, '<p class="podpis-geroya', '<div class="foto__credit t-caption">Pictured: Max Payne 3 (2012), a scene from the game</div>'), 'в герое вне печати'],
    ['S2R3-Z-1 p.foto__credit — ребёнок героя перед подписью', (h) => pered(h, '<p class="podpis-geroya', '<p class="foto__credit t-caption">Pictured: official Max Payne cover art</p>'), 'в герое вне печати'],
    ['S2R3-P-2 .foto__credit в скриме героя', (h) => h.replace(/(<div class="hero__scrim"[^>]*>)/, '$1<div class="foto__credit t-caption">Pictured: X</div>'), 'в герое вне печати'],
    ['S2R3-P-2 вторая рамка арта с кредитом перед подписью', (h) => pered(h, '<p class="podpis-geroya', '<div class="hero__art"><div class="foto__credit">Pictured: X</div></div>'), 'в герое вне печати'],
    ['S2R3-P-3 класс шапки hdr в рамке арта', (h) => h.replace(/(<div class="hero__art"[^>]*>)/, '$1<div class="hdr" data-astro-cid-qu2zoq4f>Pictured: official Max Payne cover art</div>'), 'в герое вне печати'],
    ['S2R3-K-3 iframe srcdoc в <main> после героя', (h) => h.replace('</section></div>', `</section></div>${IFRAME}`), 'носитель скрипта'],
    ['S2R3-K-3 iframe srcdoc в герое перед подписью', (h) => pered(h, '<p class="podpis-geroya', IFRAME), 'носитель скрипта'],
    ['S2R3-K-3 iframe src=javascript: в <main>', (h) => h.replace('</section></div>', `</section></div><iframe hidden src="javascript:parent.document.querySelector('.podpis-geroya').textContent='PODMENA'"></iframe>`), 'носитель скрипта'],
    ['S2R3-K-3 iframe srcdoc перед подвалом', (h) => h.replace('</main>', `</main>${IFRAME}`), 'носитель скрипта'],
    ['S2R3-K-4 meta refresh в <main> после героя', (h) => h.replace('</section></div>', '</section></div><meta http-equiv="refresh" content="0; url=/max-payne-3/">'), 'meta в <body>'],
    ['S2R3-K-4 meta refresh перед подвалом', (h) => h.replace('</main>', '</main><meta http-equiv="refresh" content="0; url=/max-payne-3/">'), 'meta в <body>'],
    ['S2R3-Z-2 метка героя — метка маршрута', (h) => h.replace(/(<section class="hero" aria-labelledby="page-title") data-astro-cid-[a-z0-9]+>/, '$1 data-astro-cid-n67f4zmd>'), 'подпись кадра скрыта предком'],
    ['S2R3-Z-3 U+FEFF вместо пробелов в печатной подписи', (h) => h.replace(PODPIS, (x, tekst) => x.replace(tekst, tekst.replace(/ /g, '﻿'))), 'невидимые знаки в подписи кадра'],
  ];
  for (const url of S_PODPISYU) {
    for (const [imya, html, prichina] of PORCHI) {
      await t.test(`${url}: ${imya}`, () => {
        const x = po(url);
        const h = html(x.html);
        assert.notEqual(h, x.html, 'порча не применилась');
        const z = sverit(x, h, x.dane, x.page);
        assert.ok(z.some((y) => y.includes(prichina)), `ждали «${prichina}», получено: ${z.join(' | ').slice(0, 400) || 'замечаний нет'}`);
      });
    }
  }
});

test.todo('S2R3 (предел): подпись кадра перекрыта элементом вне героя — шапка, подвал, ряд, <body> после <main> с классом сайта, у которого position и z-index больше, чем у подписи (.foto__credit — 3, .hdr — 50, .skip-link — 100, .grain — 60); по разметке наложение не судится — его видит только браузер (elementFromPoint), судьи в браузере ручные (П84 п. 6)');

test('S2R2-K-6, S2R2-Z-1: хук сторожа сборки из astro.config.mjs судит своим списком (мини-сайт: у /media/ снята подпись)', async () => {
  const { default: konfig } = await import('../../astro.config.mjs');
  const integ = konfig.integrations.find((i) => i?.name === 'sayt:sverka-dist');
  const mini = mkdtempSync(join(tmpdir(), 's2r2-mini-'));
  const distK = mkdtempSync(join(tmpdir(), 's2r2-dist-'));
  try {
    for (const put of ['structure/structure.json', 'src/data/game-art.json', 'src/data/icons.ts']) {
      mkdirSync(dirname(join(mini, put)), { recursive: true });
      cpSync(join(SAYT, put), join(mini, put));
    }
    cpSync(join(SAYT, 'src/content/tresc'), join(mini, 'src/content/tresc'), { recursive: true });
    const media = join(mini, 'src/content/tresc/media.md');
    const md = readFileSync(media, 'utf8');
    assert.match(md, /^artCaption:.*\n/m, 'стенд: у media.md нет строки artCaption');
    writeFileSync(media, md.replace(/^artCaption:.*\n/m, ''));
    for (const s of V.soderzhanie) {
      const u = s.dane.url;
      const f = join(distK, u.slice(1), 'index.html');
      mkdirSync(dirname(f), { recursive: true });
      const h = stranica(u);
      writeFileSync(f, u === '/media/' ? h.replace(/<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/, '') : h);
    }
    integ.hooks['astro:config:done']({ config: { root: pathToFileURL(mini + '/') } });
    const logger = { error: () => {}, info: () => {} };
    assert.throws(() => integ.hooks['astro:build:done']({ dir: pathToFileURL(distK + '/'), logger }), /подпись кадра обязательна у героя \/media\//);
  } finally {
    rmSync(mini, { recursive: true, force: true });
    rmSync(distK, { recursive: true, force: true });
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
    { imya: 'кадровка другая', s: rm, html: (h) => h.replace('--fokus: 55% 60%', '--fokus: 10% 50%'), prichina: 'кадровка: style обёртки «--fokus: 10% 50%' },
    { imya: 'кадровка в data-style перед style', s: rm, html: (h) => h.replace('style="--fokus: 55% 60%"', 'data-style="--fokus: 55% 60%" style="--fokus: 10% 50%"'), prichina: 'кадровка: style обёртки «--fokus: 10% 50%' },
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
    { imya: 'кадр ряда без art', s: rm, html: (h) => h.replace(/(<section class="layer[^"]*" id="progress"[\s\S]*?)<\/section>/, (_x, a) => a + '<div class="foto kadr-ryadu"><img src="/_astro/mp1-k13.x.webp" alt=""></div></section>'), prichina: 'ряд progress: кадр ряда напечатан, а art нет' },
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

/* — «судью судят», блок В, раунд 1 (V1-*): проверки прежних сверок, которые новая потеряла, и пропуски — */

test('раунд 1 блока В: порчи', async (t) => {
  const media = po('/media/');
  const rm = po('/remake/');
  const m2 = po('/max-payne-2/');
  const pc = po('/pc/');
  const kadrMedia = (h, i) => [...h.matchAll(/<div class="foto kadr-ryadu"[\s\S]*?<\/div>/g)][i][0];
  const DOWN = '<path d="m6 9 6 6 6-6"/>';
  const vtorayaKartinka = (h, iz, v) => h.replace(new RegExp(`(<img\\b[^>]*?\\ssrc="/_astro/${iz}[^>]*>)`), (i) => i + i.replaceAll(iz, v));
  await progon(t, [
    // V1-1 (пачка 1: все .kadr-ryadu в <main> против рядов с art).
    { imya: 'V1-1 кадр ряда вне ряда — в <main> между рядами', s: media, html: (h) => h.replace(/(<section class="layer)/, kadrMedia(h, 0) + '$1'), prichina: 'kadr-ryadu в <main> 4 раз, кадров рядов к печати 3' },
    { imya: 'V1-1 кадр ряда чужой игры в рамке героя', s: rm, html: (h) => h.replace('<div class="hero__scrim"', kadrMedia(media.html, 2) + '<div class="hero__scrim"'), prichina: 'kadr-ryadu в <main> 1 раз, кадров рядов к печати 0' },
    // V1-2 (пачка 2: обёртка героя «вплотную», подпись кадра — последний узел героя).
    { imya: 'V1-2 текст в обёртке героя перед героем', s: rm, html: (h) => h.replace(/(<div class="geroy[^"]*"[^>]*>)(?=<section class="hero")/, '$1Proba'), prichina: 'нет обёртки' },
    { imya: 'V1-2 текст в обёртке героя после героя', s: rm, html: (h) => h.replace('</section></div>', '</section>Proba</div>'), prichina: 'нет обёртки' },
    { imya: 'V1-2 текст в герое после подписи кадра', s: rm, html: (h) => h.replace(/(<p class="podpis-geroya[^>]*>[^<]*<\/p>)(<\/section>)/, '$1Proba$2'), prichina: 'последним элементом героя (место dopisek) — нет' },
    // V1-3 (пачка 2: svg иконки главной кнопки целиком).
    { imya: 'V1-3 лишний элемент в svg иконки главной кнопки', s: rm, html: (h) => h.replace(DOWN, DOWN + '<line x1="12" y1="3" x2="12" y2="15"/>'), prichina: 'иконка главной кнопки' },
    // Раунд 2 (V2-10): путь вне svg при целом svg — прежняя порча удаляла svg и ловилась чужой причиной «svg: 0».
    { imya: 'V1-3 путь иконки вне svg при целом svg', s: rm, html: (h) => h.replace(/(href="#release-date"[^>]*>When it comes out<svg\b[^>]*>[\s\S]*?<\/svg>)/, (x) => x + '<i>' + DOWN + '</i>'), prichina: 'иконка главной кнопки' },
    // V1-4 (пачка 1: кнопка призыва — btn-primary).
    { imya: 'V1-4 кнопка призыва не главная (btn-secondary)', s: pc, html: (h) => h.replace('class="btn btn-primary t-button cta__btn"', 'class="btn btn-secondary t-button cta__btn"'), prichina: 'кнопка призыва без btn-primary' },
    // V1-5 (пачки 1 и 2: кадр ряда — div.foto).
    { imya: 'V1-5 кадр ряда без оболочки .foto', s: media, html: (h) => h.replace('<div class="foto kadr-ryadu"', '<div class="kadr-ryadu"'), prichina: 'кадр ряда без .foto' },
    // V1-6 (пределы прежней пачки 2 — теперь проверка: картинки <main> = кадры по файлу содержания).
    { imya: 'V1-6 вторая картинка другой игры в рамке героя', s: rm, html: (h) => vtorayaKartinka(h, 'mp1-k13', 'mp3-k15'), prichina: 'картинок в <main> 2, кадров по файлу содержания 1' },
    { imya: 'V1-6 вторая картинка в кадре ряда', s: media, html: (h) => vtorayaKartinka(h, 'mp2-k01', 'mp3-k01'), prichina: 'ключами вне кадров содержания: mp3-k01' },
    { imya: 'V1-6 картинка кадра в тексте ряда', s: m2, html: (h) => h.replace(/(<div class="layer__body[^>]*>)/, '$1<img src="/_astro/mp3-k15.x.webp" alt="">'), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'V1-6 <picture><source> другого кадра вокруг картинки героя', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*><div class="foto">)(<img\b[^>]*>)/, (_x, a, i) => a + '<picture><source srcset="/_astro/mp3-k15.x.webp 1200w">' + i + '</picture>'), prichina: 'ключами вне кадров содержания: mp3-k15' },
    // V1-7 (предел прежней пачки 4 — теперь проверка: «Games:» и «License class:» — по одному).
    { imya: 'V1-7 вторая нота «Games:» с чужой игрой', s: rm, html: (h) => h.replace(/(<p class="ft__art-note[^"]*"[^>]*>License class)/, '<p class="ft__art-note t-caption">Games: Max Payne 3.</p>$1'), prichina: '«Games:» 2 раз' },
    { imya: 'V1-7 вторая фраза «Games:» в ноте', s: rm, html: (h) => h.replace('Games: Max Payne.', 'Games: Max Payne. Games: Max Payne 3.'), prichina: '«Games:» 2 раз' },
  ]);
});

/* — «судью судят», блок В, раунд 2 (V2-*) — */

test('раунд 2 блока В: порчи', async (t) => {
  const media = po('/media/');
  const rm = po('/remake/');
  const q = po('/quotes/');
  const DOWN = '<path d="m6 9 6 6 6-6"/>';
  const adres = (h, k) => h.match(new RegExp(`/_astro/${k}\\.[^" ,]+`))[0];
  const NOTA_LIC = /(<p class="ft__art-note[^"]*"[^>]*>License class[^<]*<\/p>)/;
  await progon(t, [
    { imya: 'V2-1 стрелка вниз повёрнута в стрелку вправо (transform у path)', s: rm, html: (h) => h.replace(DOWN, '<path d="m6 9 6 6 6-6" transform="rotate(-90 12 12)"/>'), prichina: 'иконка главной кнопки' },
    { imya: 'V2-1 путь стрелки невидим (stroke="none")', s: rm, html: (h) => h.replace(DOWN, '<path d="m6 9 6 6 6-6" stroke="none"/>'), prichina: 'иконка главной кнопки' },
    { imya: 'V2-1 svg иконки повёрнут стилем', s: rm, html: (h) => h.replace(/(When it comes out<svg\b)/, '$1 style="transform:rotate(-90deg)"'), prichina: 'иконка главной кнопки' },
    { imya: 'V2-3 /media/: <picture><source> кадра ряда вокруг картинки героя', s: media, html: (h) => h.replace(/(<div class="hero__art"[^>]*><div class="foto">)(<img\b[^>]*>)/, (_x, a, i) => a + `<picture><source srcset="${adres(h, 'mp2-k01')} 1200w">` + i + '</picture>'), prichina: 'кадр героя: в src или srcset ключи mp2-k01' },
    { imya: 'V2-3 /quotes/: <source> кадра 2 вокруг кадра 1 галереи', s: q, html: (h) => h.replace(/(<div class="foto kadr-galerei"[^>]*>)(<img\b[^>]*>)/, (_x, a, i) => a + `<picture><source srcset="${adres(h, 'mp2-k03')} 480w">` + i + '</picture>'), prichina: 'кадр галереи 1 (mp1-k11): в src или srcset ключи mp2-k03' },
    { imya: 'V2-4 «License class:» внутри ноты «Games:»', s: rm, html: (h) => h.replace('Games: Max Payne.', 'Games: Max Payne. License class: CC BY-SA 4.0.'), prichina: '«License class:» 2 раз' },
    { imya: 'V2-4 вторая нота с «License class:» не в начале', s: rm, html: (h) => h.replace(NOTA_LIC, '<p class="ft__art-note t-caption">Also: License class: CC BY-SA 4.0.</p>$1'), prichina: '«License class:» 2 раз' },
    { imya: 'V2-5 svg <image> другой игры в рамке героя', s: rm, html: (h) => h.replace('<div class="hero__scrim"', '<svg width="100%" height="100%"><image href="/_astro/mp3-k15.x.webp" width="100%" height="100%"/></svg><div class="hero__scrim"'), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'V2-5 фон другой игры в style обёртки героя', s: rm, html: (h) => h.replace('style="--fokus: 55% 60%"', 'style="--fokus: 55% 60%; background-image: url(/_astro/mp3-k15.x.webp)"'), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'V2-7 второе --fokus в style обёртки', s: rm, html: (h) => h.replace('style="--fokus: 55% 60%"', 'style="--fokus: 55% 60%; --fokus: 10% 50%"'), prichina: 'кадровка: style обёртки «--fokus: 55% 60%; --fokus: 10% 50%»' },
    { imya: 'V2-7 --fokus внутри имени другого свойства первым', s: rm, html: (h) => h.replace('style="--fokus: 55% 60%"', 'style="--old--fokus: 55% 60%; --fokus: 10% 50%"'), prichina: 'кадровка: style обёртки «--old--fokus: 55% 60%; --fokus: 10% 50%»' },
    { imya: 'V2-7 --fokus у потомка героя (.foto рамки) перекрывает обёртку', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*>)<div class="foto">/, '$1<div class="foto" style="--fokus: 10% 50%">'), prichina: 'кадровка внутри героя' },
    { imya: 'V2-8 заголовок «связанных» не из содержания', s: rm, html: (h) => h.replace('>More from the series<', '>Proba<'), prichina: 'заголовок «связанных»' },
    { imya: 'V2-8 «связанные» сняты', s: rm, html: (h) => h.replace(/<section class="link-list[\s\S]*?<\/section>/, () => ''), prichina: '«связанных» 0' },
    { imya: 'V2-8 адрес «связанных» — другая страница структуры', s: rm, html: (h) => h.replace('<a class="layer__guide-link" href="/max-payne-2/"', '<a class="layer__guide-link" href="/cheats/"'), prichina: 'адреса «связанных»' },
    { imya: 'V2-8 последний ряд ниже «связанных»', s: rm, html: (h) => { const r = [...h.matchAll(/<section class="layer\b[\s\S]*?<\/section>/g)].at(-1)[0]; return h.replace(r, () => '').replace(/<section class="link-list[\s\S]*?<\/section>/, (l) => l + r); }, prichina: '«связанные» не после рядов' },
    { imya: 'V2-9 &nbsp; в обёртке героя перед героем', s: rm, html: (h) => h.replace(/(<div class="geroy[^"]*"[^>]*>)(?=<section class="hero")/, '$1&nbsp;'), prichina: 'нет обёртки' },
    { imya: 'V2-9 &nbsp; в герое после подписи кадра', s: rm, html: (h) => h.replace(/(<p class="podpis-geroya[^>]*>[^<]*<\/p>)(<\/section>)/, '$1&nbsp;$2'), prichina: 'последним элементом героя (место dopisek) — нет' },
    { imya: 'V2-10 вторая нота «License class:» отдельным абзацем', s: rm, html: (h) => h.replace(NOTA_LIC, '$1<p class="ft__art-note t-caption">License class: CC BY-SA 4.0.</p>'), prichina: '«License class:» 2 раз' },
  ]);
});

/* — «судью судят», блок В, раунд 3 (V3-*) — */

test('раунд 3 блока В: порчи', async (t) => {
  const rm = po('/remake/');
  const adres = (h, k) => h.match(new RegExp(`/_astro/${k}\\.[^" ,]+`))[0];
  const K15 = adres(po('/max-payne-3/').html, 'mp3-k15');
  const OBERTKA = 'style="--fokus: 55% 60%"';
  const SVG_GL = /(When it comes out<svg\b)/;
  const LINKLIST = /<section class="link-list[\s\S]*?<\/section>/;
  const vHeroj = (h, x) => h.replace('<div class="hero__scrim"', () => x + '<div class="hero__scrim"');
  await progon(t, [
    { imya: 'V3-1 stroke="none" у корня svg иконки', s: rm, html: (h) => h.replace(SVG_GL, '$1 stroke="none"').replace(/(When it comes out<svg\b[^>]*?) stroke="currentColor"/, '$1'), prichina: 'иконка главной кнопки' },
    { imya: 'V3-1 visibility="hidden" у корня svg', s: rm, html: (h) => h.replace(SVG_GL, '$1 visibility="hidden"'), prichina: 'иконка главной кнопки' },
    { imya: 'V3-1 hidden у корня svg', s: rm, html: (h) => h.replace(SVG_GL, '$1 hidden'), prichina: 'иконка главной кнопки' },
    { imya: 'V3-1 width/height 0 у корня svg', s: rm, html: (h) => h.replace('When it comes out<svg width="18" height="18"', 'When it comes out<svg width="0" height="0"'), prichina: 'иконка главной кнопки' },
    { imya: 'V3-2 комментарий CSS перед вторым --fokus обёртки', s: rm, html: (h) => h.replace(OBERTKA, 'style="--fokus: 55% 60%; /**/--fokus: 10% 50%"'), prichina: 'кадровка' },
    { imya: 'V3-2 экранирование в имени (--fok\\75s)', s: rm, html: (h) => h.replace(OBERTKA, 'style="--fokus: 55% 60%; --fok\\75s: 10% 50%"'), prichina: 'кадровка' },
    { imya: 'V3-2 !important у раннего --fokus', s: rm, html: (h) => h.replace(OBERTKA, 'style="--fokus: 10% 50% !important; --fokus: 55% 60%"'), prichina: 'кадровка' },
    { imya: 'V3-3 OBJECT-POSITION прописными у картинки героя', s: rm, html: (h) => h.replace(/(<div class="hero__art"[^>]*><div class="foto"><img\b)/, '$1 style="OBJECT-POSITION: 10% 50%"'), prichina: 'кадровка внутри героя' },
    { imya: 'V3-3 <style> в герое: object-position !important', s: rm, html: (h) => vHeroj(h, '<style>.hero__art .foto img{object-position:10% 50% !important}</style>'), prichina: '<style> в <main>' },
    { imya: 'V3-3 --fokus на <main> у героя без artFocus', s: rm, html: (h) => h.replace(' ' + OBERTKA, '').replace('<main id="content">', '<main id="content" style="--fokus: 10% 50%">'), dane: (d) => { delete d.artFocus; return d; }, prichina: 'кадровка' },
    { imya: 'V3-3к контроль: герой без artFocus и без style обёртки', s: rm, html: (h) => h.replace(' ' + OBERTKA, ''), dane: (d) => { delete d.artFocus; return d; }, prichina: null },
    { imya: 'V3-4 фон другой игры в style самого <main>', s: rm, html: (h) => h.replace('<main id="content">', `<main id="content" style="background-image: url(${K15})">`), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'V3-4 svg <image> с /_astro/./ (браузер сводит точку)', s: rm, html: (h) => vHeroj(h, `<svg width="100%" height="100%"><image href="${K15.replace('/_astro/', '/_astro/./')}" width="100%" height="100%"/></svg>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'V3-4 video poster с /_astro//', s: rm, html: (h) => vHeroj(h, `<video poster="${K15.replace('/_astro/', '/_astro//')}"></video>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'V3-4 video poster с /%5Fastro/ (сервер раскроет)', s: rm, html: (h) => vHeroj(h, `<video poster="${K15.replace('/_astro/', '/%5Fastro/')}"></video>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'V3-4 style обёртки: CSS-экранирование mp3\\2d k15 (закроет V3-2)', s: rm, html: (h) => h.replace(OBERTKA, `style="--fokus: 55% 60%; background-image: url(${K15.replace('mp3-k15', 'mp3\\2d k15')})"`), prichina: 'кадровка' },
    { imya: 'V3-5 «связанные» внутри призыва', s: rm, html: (h) => { const l = h.match(LINKLIST)[0]; return h.replace(l, () => '').replace(/(<div class="cta__inner container"[^>]*>)/, (x) => x + l); }, prichina: '«связанные» внутри другой секции' },
    { imya: 'V3-6 заголовок «связанных» — не h2', s: rm, html: (h) => h.replace(/<h2 class="link-list__title t-headline" id="related-title"([^>]*)>([^<]*)<\/h2>/, '<p id="related-title"$1>$2</p>'), prichina: 'заголовок «связанных»' },
    { imya: 'V3-9 вторая «Games:» без пробела', s: rm, html: (h) => h.replace('Games: Max Payne.', 'Games: Max Payne. Games:Max Payne 3.'), prichina: '«Games:» 2 раз' },
    { imya: 'V3-9 вторая «License class:» без пробела', s: rm, html: (h) => h.replace('Games: Max Payne.', 'Games: Max Payne. License class:CC BY-SA 4.0.'), prichina: '«License class:» 2 раз' },
  ]);
});

test('V3-8 законная иконка с <title> или <desc> (svg aria-hidden, текст не рисуется) — замечаний нет', () => {
  const k = zerkalo();
  try {
    const DOWN = '<path d="m6 9 6 6 6-6"/>';
    const RIGHT = '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>';
    const f = join(k, 'src/data/icons.ts');
    const byl = readFileSync(f, 'utf8');
    for (const [kl, iz, na] of [
      ['arrow-down', DOWN, '<title>Down</title>' + DOWN],
      ['arrow-down', DOWN, '<desc>Arrow pointing down</desc>' + DOWN],
      ['arrow-right', RIGHT, '<title>Next</title>' + RIGHT],
    ]) {
      writeFileSync(f, byl.replace(`'${kl}': '${iz}'`, `'${kl}': '${na}'`));
      assert.notEqual(readFileSync(f, 'utf8'), byl, 'правка icons.ts не применилась');
      const Vk = vhody(k);
      const x = po('/remake/');
      const h = x.html.replaceAll(iz, na);
      assert.notEqual(h, x.html, 'порча не применилась');
      assert.deepEqual(sverkaStranicy({ page: x.page, dane: x.dane, html: h, kredity: Vk.kredity, ikony: Vk.ikony, obyazatelnaPodpis: OBYAZATELNA }), [], `${kl}: ${na}`);
    }
  } finally {
    rmSync(k, { recursive: true, force: true });
  }
});

test('V3-7 встречная проверка: страница сборки не index.html (404.html — STATUS_CODE_PAGES Astro) — замечание', () => {
  const d = mkdtempSync(join(tmpdir(), 'sverka-dist-'));
  try {
    cpSync(dist(), d, { recursive: true, filter: (p) => !/[\\/]_astro([\\/]|$)/.test(p.slice(dist().length)) });
    writeFileSync(join(d, '404.html'), stranica('/remake/'));
    const z = sverkaSborki(d, SAYT, { obyazatelnaPodpis: OBYAZATELNA }).zamechaniya;
    assert.ok(z.some((x) => x.url.includes('404.html') && x.chto.includes('без файла содержания')), JSON.stringify(z));
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});

test('V3-10 битая ссылка-переход в папке содержания — сверка не падает исключением (загрузчик её пропускает)', () => {
  const k = zerkalo();
  const vne = mkdtempSync(join(tmpdir(), 'sverka-vne-'));
  const svyaz = join(k, 'src/content/tresc/bitaya');
  try {
    symlinkSync(vne, svyaz, 'junction');
    rmSync(vne, { recursive: true, force: true });
    assert.doesNotThrow(() => sverkaSborki(dist(), k, { obyazatelnaPodpis: OBYAZATELNA }));
  } finally {
    try {
      unlinkSync(svyaz);
    } catch {
      // ссылки уже нет
    }
    rmSync(k, { recursive: true, force: true });
  }
});

test('V3-10 ссылка-переход на свою же папку (петля) — обход конечен, как у загрузчика', () => {
  const k = zerkalo();
  const svyaz = join(k, 'src/content/tresc/petlya');
  try {
    symlinkSync(join(k, 'src/content/tresc'), svyaz, 'junction');
    assert.deepEqual(sverkaSborki(dist(), k, { obyazatelnaPodpis: OBYAZATELNA }).zamechaniya, []);
  } finally {
    unlinkSync(svyaz);
    rmSync(k, { recursive: true, force: true });
  }
});

test.todo('P2-4 (предел, раунд 2 правки маршрута): записи кадров только главной (mp1-k10) сверка не судит — главная вне сверки');

test('V2-2 законная иконка из line/polyline в icons.ts и в печати — замечаний нет', () => {
  const k = zerkalo();
  try {
    const DOWN = '<path d="m6 9 6 6 6-6"/>';
    const NOVAYA = '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>';
    const f = join(k, 'src/data/icons.ts');
    const byl = readFileSync(f, 'utf8');
    writeFileSync(f, byl.replace(`'arrow-down': '${DOWN}'`, `'arrow-down': '${NOVAYA}'`));
    assert.notEqual(readFileSync(f, 'utf8'), byl, 'правка icons.ts не применилась');
    const Vk = vhody(k);
    const x = po('/remake/');
    assert.deepEqual(sverkaStranicy({ page: x.page, dane: x.dane, html: x.html.replace(DOWN, NOVAYA), kredity: Vk.kredity, ikony: Vk.ikony, obyazatelnaPodpis: OBYAZATELNA }), []);
  } finally {
    rmSync(k, { recursive: true, force: true });
  }
});

test.todo('V2-6 предел: фронтматтер TOML (+++) — громкий отказ (сайт пишет YAML; загрузчик Astro читает и TOML)');

test('V2-12 папка содержания — ссылка-переход: сверка идёт по ней, как загрузчик', () => {
  const k = zerkalo();
  const vne = mkdtempSync(join(tmpdir(), 'sverka-vne-'));
  try {
    writeFileSync(join(vne, 'proba.md'), '---\nurl: /proba-v2-12/\n---\n');
    symlinkSync(vne, join(k, 'src/content/tresc/svyaz'), 'junction');
    const z = sverkaSborki(dist(), k, { obyazatelnaPodpis: OBYAZATELNA }).zamechaniya;
    assert.ok(z.some((x) => x.chto.includes('/proba-v2-12/')), JSON.stringify(z));
  } finally {
    unlinkSync(join(k, 'src/content/tresc/svyaz'));
    rmSync(k, { recursive: true, force: true });
    rmSync(vne, { recursive: true, force: true });
  }
});

test('V2-12 встречная проверка: страница сборки без файла содержания — замечание', () => {
  const k = zerkalo();
  try {
    rmSync(join(k, 'src/content/tresc/404.md'));
    const z = sverkaSborki(dist(), k, { obyazatelnaPodpis: OBYAZATELNA }).zamechaniya;
    assert.ok(z.some((x) => x.url === '/404/' && x.chto.includes('без файла содержания')), JSON.stringify(z));
  } finally {
    rmSync(k, { recursive: true, force: true });
  }
});

test.todo('V1-8 предел: третья кнопка в герое (a.btn без primary/secondary) — не судится');
test.todo('V1-8 предел: абзац в колонке героя или в ряду вне year/title/meta/body — не судится');
test.todo('V1-8 предел: абзац в призыве вне заголовка, лида и кнопки — не судится');
test.todo('V1-8 предел: section без класса блока между рядами — не судится');

/** Зеркало входов сверки во временной папке: структура, записи кадров, иконки, файлы содержания. */
function zerkalo() {
  const k = mkdtempSync(join(tmpdir(), 'sverka-vhody-'));
  for (const p of ['structure/structure.json', 'src/data/game-art.json', 'src/data/icons.ts', 'src/content/tresc']) {
    mkdirSync(dirname(join(k, p)), { recursive: true });
    cpSync(join(SAYT, p), join(k, p), { recursive: true });
  }
  return k;
}

test('V1-9 фронтматтер с пустой строкой до «---» и пробелом после — законная страница, замечаний нет', () => {
  const k = zerkalo();
  try {
    const f = join(k, 'src/content/tresc/404.md');
    writeFileSync(f, '\n' + readFileSync(f, 'utf8').replace(/^---\n/, '--- \n'));
    assert.deepEqual(sverkaSborki(dist(), k, { obyazatelnaPodpis: OBYAZATELNA }).zamechaniya, []);
  } finally {
    rmSync(k, { recursive: true, force: true });
  }
});

test('V1-10 ._404.md и .chernovik/x.md в src/content/tresc — сверка их не читает (загрузчик их не видит)', () => {
  const k = zerkalo();
  try {
    writeFileSync(join(k, 'src/content/tresc/._404.md'), '\u0000\u0005\u0016\u0007Mac OS X');
    mkdirSync(join(k, 'src/content/tresc/.chernovik'));
    writeFileSync(join(k, 'src/content/tresc/.chernovik/privacy.md'), '---\nurl: /privacy/\n---\n');
    assert.deepEqual(sverkaSborki(dist(), k, { obyazatelnaPodpis: OBYAZATELNA }).zamechaniya, []);
  } finally {
    rmSync(k, { recursive: true, force: true });
  }
});

/* — «судью судят», блок В, раунд 4 (R4-V-*): находки скептиков (K — класс, Z — закон) и проверяющих к формам
   раунда 3 (P). Каждая находка — свой тест верхнего уровня: имя начинается с номера (прогон по шаблону имени). — */

let R4 = null;
/** Стенды раунда 4: страницы, адрес кадра другой игры и места порч (сборка читается при первом тесте). */
const r4 = () => {
  if (R4) return R4;
  const m3 = po('/max-payne-3/');
  const m2 = po('/max-payne-2/');
  R4 = {
    rm: po('/remake/'), m2, m3, mv: po('/movie/'), q: po('/quotes/'),
    K15: m3.html.match(/\/_astro\/mp3-k15\.[^" ,]+/)[0],
    NOTA2: m2.html.match(/Games: [^<.]+\./)[0],
  };
  return R4;
};
const vHeroj4 = (h, x) => h.replace('<div class="hero__scrim"', () => x + '<div class="hero__scrim"');
const posle4 = (h, metka, x) => h.replace(metka, () => metka + x);
const obertka4 = (s) => s.html.match(/<div class="geroy[^>]*>/)[0];
const HDR4 = '<header class="hdr" data-astro-cid-qu2zoq4f>';
const FT4 = '<div class="ft__inner container" data-astro-cid-eghvtlpg>';
const SEC4 = 'The 2001 original</a>';
const CTA_SVG4 = /(See Max Payne \(2001\)<svg\b[^>]*>)/;
const NOTA4 = 'Games: Max Payne.';
const ART4 = /(<div class="hero__art"[^>]*>)<div class="foto">/;
const IMG_GEROYA4 = /(<div class="hero__art"[^>]*><div class="foto"><img\b)/;

test('R4-V-K-1 обёртка героя без метки области маршрута — правила .geroy[data-astro-cid-…] её не достают', async (t) => {
  const { rm, m2 } = r4();
  await progon(t, [
    { imya: 'R4-V-K-1 /remake/: обёртка без data-astro-cid-n67f4zmd', s: rm, html: (h) => h.replace(obertka4(rm), obertka4(rm).replace(' data-astro-cid-n67f4zmd', '')), prichina: 'обёртку не достают' },
    { imya: 'R4-V-K-1 /max-payne-2/: обёртка без метки', s: m2, html: (h) => h.replace(obertka4(m2), obertka4(m2).replace(' data-astro-cid-n67f4zmd', '')), prichina: 'обёртку не достают' },
  ]);
});

test('R4-V-K-2 рамка арта героя без .foto — кадровка и тон маршрута кадр не достают', async (t) => {
  const { rm } = r4();
  await progon(t, [{ imya: 'R4-V-K-2 /remake/: рамка .foto → .kadr', s: rm, html: (h) => h.replace(ART4, '$1<div class="kadr">'), prichina: 'кадр героя без .foto' }]);
});

test('R4-V-P-1 формы V3-2 проверяющего: чужая метка обёртки, .Foto, картинка без рамки', async (t) => {
  const { mv, m2 } = r4();
  await progon(t, [
    { imya: 'R4-V-P-1 /movie/: метка обёртки чужая (data-astro-cid-m3tnyskv)', s: mv, html: (h) => h.replace(obertka4(mv), obertka4(mv).replace('data-astro-cid-n67f4zmd', 'data-astro-cid-m3tnyskv')), prichina: 'обёртку не достают' },
    { imya: 'R4-V-P-1 /movie/: .foto → .Foto (класс чувствителен к регистру)', s: mv, html: (h) => h.replace(ART4, '$1<div class="Foto">'), prichina: 'кадр героя без .foto' },
    { imya: 'R4-V-P-1 /max-payne-2/: рамки нет, img прямо в .hero__art', s: m2, html: (h) => h.replace(/(<div class="hero__art"[^>]*>)<div class="foto">(<img[^>]*>)<\/div>/, '$1$2'), prichina: 'кадр героя без .foto' },
  ]);
});

test('R4-V-K-3 <style> и <link rel=stylesheet> в <body> вне <main> — оформление всей страницы', async (t) => {
  const { rm } = r4();
  await progon(t, [
    { imya: 'R4-V-K-3 <style> после </main>', s: rm, html: (h) => h.replace('</main>', '</main><style>.geroy .hero__art .foto img{object-position:10% 50% !important}</style>'), prichina: '<style> в <body> вне <main>' },
    {
      imya: 'R4-V-K-3 svg <style> в знаке подвала', s: rm,
      html: (h) => h.replace('<svg class="znak" width="138" height="38" viewBox="0 0 138 38" focusable="false" role="img"', '<svg class="znak" width="138" height="38" viewBox="0 0 138 38" focusable="false" role="img"><style>.geroy .hero__art .foto img{object-position:10% 50% !important}</style></svg><svg'),
      prichina: '<style> в <body> вне <main>',
    },
    { imya: 'R4-V-K-3 <link rel=stylesheet> в подвале', s: rm, html: (h) => h.replace('<footer class="ft"', '<link rel="stylesheet" href="/_astro/proba.css"><footer class="ft"'), prichina: '<style> в <body> вне <main>' },
  ]);
});

test('R4-V-P-2 формы V3-3 проверяющего: оформление и скрипт мимо обёртки в других местах', async (t) => {
  const { rm, mv, m2, K15 } = r4();
  await progon(t, [
    { imya: 'R4-V-P-2 /movie/: <style> внутри .ft__inner подвала', s: mv, html: (h) => posle4(h, FT4, '<style>.geroy .hero__art .foto img{object-position:0 0!important}</style>'), prichina: '<style> в <body> вне <main>' },
    { imya: 'R4-V-P-2 /max-payne-2/: <link rel="Stylesheet"> в шапке', s: m2, html: (h) => posle4(h, HDR4, '<link rel="Stylesheet" href="/_astro/x.css">'), prichina: '<style> в <body> вне <main>' },
    { imya: 'R4-V-P-2 /remake/: <style> сразу после <body>', s: rm, html: (h) => posle4(h, '<body>', '<style>.btn-primary svg{transform:rotate(180deg)}</style>'), prichina: '<style> в <body> вне <main>' },
    { imya: 'R4-V-P-2 /movie/: onerror у картинки героя', s: mv, html: (h) => h.replace(IMG_GEROYA4, `$1 onerror="this.closest('.geroy').style.cssText='--fokus: 0% 0%'"`), prichina: 'скрипт в <main>' },
    { imya: 'R4-V-P-2 /remake/: svg <script> в иконке кнопки призыва', s: rm, html: (h) => h.replace('<path d="M4 12h15"/>', '<script>1</script><path d="M4 12h15"/>'), prichina: 'скрипт в <main>' },
    { imya: 'R4-V-P-2 /movie/: <body background> с кадром mp3-k15', s: mv, html: (h) => h.replace('<body>', `<body background="${K15}">`), prichina: 'атрибуты <html>/<body>' },
    { imya: 'R4-V-P-2 /remake/: style у <header> (вне <main>)', s: rm, html: (h) => h.replace(HDR4, `<header class="hdr" style="position:fixed;inset:0;background:url(${K15}) center/cover" data-astro-cid-qu2zoq4f>`), prichina: 'style вне <main>' },
    { imya: 'R4-V-P-2 /remake/: style у фигуры знака не --farba', s: rm, html: (h) => h.replace('style="--farba: var(--ink)"', 'style="--farba: var(--ink); display: none"'), prichina: 'style вне <main>' },
  ]);
});

test('R4-V-K-4 скрипт в <main> (и обработчик on* где угодно) — кадровку и оформление задают мимо атрибута style', async (t) => {
  const { rm } = r4();
  await progon(t, [
    { imya: 'R4-V-K-4 <script> в <main>: style.setProperty(--fokus)', s: rm, html: (h) => h.replace('<section class="layer section layer--bez-kadru" id="what-it-is"', (x) => `<script>document.querySelector('.geroy').style.setProperty('--fokus','10% 50%')</script>` + x), prichina: 'скрипт в <main>' },
    { imya: 'R4-V-K-4 onload у картинки героя', s: rm, html: (h) => h.replace(IMG_GEROYA4, `$1 onload="this.style.objectPosition='10% 50%'"`), prichina: 'скрипт в <main>' },
    { imya: 'R4-V-K-4 onload у <body> (класс: обработчик вне <main>)', s: rm, html: (h) => h.replace('<body>', `<body onload="document.querySelector('.geroy').style.cssText='--fokus: 0% 0%'">`), prichina: 'обработчик on* вне <main>' },
    { imya: 'R4-V-K-4 onclick у ссылки шапки (класс: обработчик вне <main>)', s: rm, html: (h) => h.replace('<a class="hdr__brand" href="/"', '<a class="hdr__brand" href="/" onclick="1"'), prichina: 'обработчик on* вне <main>' },
  ]);
});
test.todo('R4-V-K-4 (предел): <script> вне <main> не судится — модуль шапки печатает сайт, содержание скрипта сверка не читает');

test('R4-V-K-5 таб и перевод строки внутри «_astro» — URL-разборщик браузера их выбрасывает', async (t) => {
  const { rm, K15 } = r4();
  await progon(t, [
    { imya: 'R4-V-K-5 poster с табом внутри _astro', s: rm, html: (h) => vHeroj4(h, `<video poster="${K15.replace('/_astro/', '/_ast&#9;ro/')}"></video>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'R4-V-K-5 svg image href с переводом строки внутри _astro', s: rm, html: (h) => vHeroj4(h, `<svg width="100%" height="100%"><image href="${K15.replace('/_astro/', '/_as&#10;tro/')}" width="100%" height="100%"/></svg>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
  ]);
});

test('R4-V-K-6 неполная процентная запись в запросе или фрагменте не мешает раскрыть /%5Fastro/', async (t) => {
  const { rm, K15 } = r4();
  await progon(t, [
    { imya: 'R4-V-K-6 /%5Fastro/ с ?% в запросе', s: rm, html: (h) => vHeroj4(h, `<video poster="${K15.replace('/_astro/', '/%5Fastro/')}?%"></video>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'R4-V-K-6 /%5Fastro/ с #%zz во фрагменте', s: rm, html: (h) => vHeroj4(h, `<video poster="${K15.replace('/_astro/', '/%5Fastro/')}#%zz"></video>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
  ]);
});

test('R4-V-P-3 формы V3-4 проверяющего: &#13; внутри _astro, хвост ?q=100% и #%', async (t) => {
  const { mv, m2, K15 } = r4();
  await progon(t, [
    { imya: 'R4-V-P-3 /movie/: <object data> с &#13; внутри _astro', s: mv, html: (h) => vHeroj4(h, `<object data="${K15.replace('/_astro/', '/_a&#13;stro/')}"></object>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'R4-V-P-3 /movie/: /%5fastro/ строчными и хвост ?q=100%', s: mv, html: (h) => vHeroj4(h, `<video poster="${K15.replace('/_astro/', '/%5fastro/')}?q=100%"></video>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'R4-V-P-3 /max-payne-2/: /%5Fastro/ и хвост #%', s: m2, html: (h) => vHeroj4(h, `<video poster="${K15.replace('/_astro/', '/%5Fastro/')}#%"></video>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
  ]);
});

test('R4-V-K-7 атрибуты <body> и <html> вне печати сайта — фон под всей страницей', async (t) => {
  const { rm, m2, K15 } = r4();
  await progon(t, [
    { imya: 'R4-V-K-7 <body background> с кадром mp3-k15', s: rm, html: (h) => h.replace('<body>', `<body background="${K15}">`), prichina: 'атрибуты <html>/<body>' },
    { imya: 'R4-V-K-7 <body bgcolor> (класс: презентационный атрибут)', s: m2, html: (h) => h.replace('<body>', '<body bgcolor="#ff0000">'), prichina: 'атрибуты <html>/<body>' },
    { imya: 'R4-V-K-7 <html hidden> (класс: атрибут корня)', s: rm, html: (h) => h.replace('<html lang="en">', '<html lang="en" hidden>'), prichina: 'атрибуты <html>/<body>' },
  ]);
});

test('R4-V-K-8 первый элемент документа с id заголовка — не заголовок блока (браузер разрешает IDREF по первому)', async (t) => {
  const { rm, q } = r4();
  await progon(t, [
    { imya: "R4-V-K-8 id='related-title' раньше раздела (в шапке)", s: rm, html: (h) => posle4(h, HDR4, "<span id='related-title' hidden>Sponsored links</span>"), prichina: 'id related-title' },
    { imya: 'R4-V-K-8 id page-title раньше героя (класс: заголовок героя)', s: rm, html: (h) => posle4(h, HDR4, '<span id="page-title" hidden>Sponsored</span>'), prichina: 'id page-title' },
    { imya: 'R4-V-K-8 id gallery-title раньше галереи (класс: заголовок галереи)', s: q, html: (h) => posle4(h, HDR4, '<span id="gallery-title" hidden>Sponsored</span>'), prichina: 'id gallery-title' },
  ]);
});

test('R4-V-P-4 формы V3-5, V3-6 проверяющего: span id=related-title в колонке героя, ID= в шапке', async (t) => {
  const { rm, mv } = r4();
  await progon(t, [
    { imya: 'R4-V-P-4 /movie/: скрытый span id="related-title" в колонке героя', s: mv, html: (h) => h.replace(/(<div class="hero__text"[^>]*>)/, '$1<span id="related-title" hidden>Sponsored links</span>'), prichina: 'id related-title' },
    { imya: 'R4-V-P-4 /remake/: span ID=related-title без кавычек в шапке', s: rm, html: (h) => posle4(h, HDR4, '<span ID=related-title hidden>Sponsored links</span>'), prichina: 'id related-title' },
  ]);
});

/** Копия сборки без `_astro` во временной папке с добавленными файлами; замечания сверки сборки. */
function vstrechno4(dobavit) {
  const d = mkdtempSync(join(tmpdir(), 'sverka-dist-'));
  try {
    cpSync(dist(), d, { recursive: true, filter: (p) => !/[\\/]_astro([\\/]|$)/.test(p.slice(dist().length)) });
    for (const [put, html] of dobavit) {
      mkdirSync(dirname(join(d, put)), { recursive: true });
      writeFileSync(join(d, put), html);
    }
    return sverkaSborki(d, SAYT, { obyazatelnaPodpis: OBYAZATELNA }).zamechaniya;
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
}

test('R4-V-K-9 встречная проверка: страница .htm в сборке — замечание', () => {
  const z = vstrechno4([['remake-old.htm', stranica('/remake/')]]);
  assert.ok(z.some((x) => x.url.includes('remake-old.htm') && x.chto.includes('без файла содержания')), JSON.stringify(z));
});

test('R4-V-P-5 формы V3-7 проверяющего: index.htm в папке, .xhtml, REMAKE.HTM — замечания', () => {
  const z = vstrechno4([['proba-b/index.htm', stranica('/remake/')], ['proba.xhtml', stranica('/remake/')], ['REMAKE.HTM', stranica('/remake/')]]);
  for (const f of ['proba-b/index.htm', 'proba.xhtml', 'REMAKE.HTM']) assert.ok(z.some((x) => x.url.includes(f) && x.chto.includes('без файла содержания')), `${f}: ${JSON.stringify(z)}`);
});

test('R4-V-K-9к контроль: копия сборки без добавленных файлов — встречная проверка молчит', () => {
  assert.deepEqual(vstrechno4([]), []);
});

test('R4-V-K-10 svg-текст во второй кнопке и в кнопке призыва — рисуется, в надпись идёт', async (t) => {
  const { rm } = r4();
  await progon(t, [
    { imya: 'R4-V-K-10 вторая кнопка: svg <text> после надписи', s: rm, html: (h) => h.replace(SEC4, 'The 2001 original<svg width="120" height="18"><text x="0" y="14">and the remake</text></svg></a>'), prichina: 'secondary: надпись' },
    { imya: 'R4-V-K-10 вторая кнопка: svg foreignObject с текстом', s: rm, html: (h) => h.replace(SEC4, 'The 2001 original<svg width="120" height="18"><foreignObject width="120" height="18"><span>and the remake</span></foreignObject></svg></a>'), prichina: 'secondary: надпись' },
    { imya: 'R4-V-K-10 кнопка призыва: svg <text> вместо пути иконки', s: rm, html: (h) => h.replace(/(See Max Payne \(2001\)<svg\b[^>]*>)[\s\S]*?(<\/svg>)/, '$1<text x="0" y="14" font-size="6">remake</text>$2'), prichina: 'кнопки призыва' },
    { imya: 'R4-V-K-10 кнопка призыва: вторая svg с <text>', s: rm, html: (h) => h.replace(CTA_SVG4, (x) => x.replace('See Max Payne (2001)', 'See Max Payne (2001)<svg width="120" height="18"><text x="0" y="14">and the remake</text></svg>')), prichina: 'кнопки призыва' },
  ]);
});

test('R4-V-Z-1 регресс V3-8: видимый <text> в svg кнопки призыва и контурной кнопки — замечание, как до раунда 3', async (t) => {
  const { rm } = r4();
  await progon(t, [
    { imya: 'R4-V-Z-1 видимый <text> в svg кнопки призыва', s: rm, html: (h) => h.replace(/(See Max Payne \(2001\)<svg\b[^>]*>[\s\S]*?)(<\/svg>)/, '$1<text x="0" y="16">FREE DOWNLOAD</text>$2'), prichina: 'надпись кнопки призыва' },
    { imya: 'R4-V-Z-1 svg с <text> в контурной кнопке', s: rm, html: (h) => h.replace(SEC4, 'The 2001 original<svg width="120" height="18"><text y="14">— FREE DOWNLOAD</text></svg></a>'), prichina: 'secondary: надпись' },
  ]);
});

test('R4-V-K-11 надпись в теневом корне кнопки — рисуется, в надпись идёт', async (t) => {
  const { rm } = r4();
  await progon(t, [
    { imya: 'R4-V-K-11 вторая кнопка: надпись в теневом корне span', s: rm, html: (h) => h.replace(SEC4, '<span><template shadowrootmode="open">Play the remake</template>The 2001 original</span></a>'), prichina: 'secondary: надпись' },
  ]);
});

test('R4-V-K-12 элемент формы во второй кнопке — рисует своё значение', async (t) => {
  const { rm } = r4();
  await progon(t, [{ imya: 'R4-V-K-12 вторая кнопка: input value', s: rm, html: (h) => h.replace(SEC4, 'The 2001 original<input type="button" value="and the remake"></a>'), prichina: 'secondary: элементы в кнопке' }]);
});

test('R4-V-P-6 формы V3-8 проверяющего: tspan, textPath, теневой корень closed и open, input submit', async (t) => {
  const { mv, m2 } = r4();
  const CTA = /(<a class="btn btn-primary t-button cta__btn"[^>]*>[^<]*)/;
  await progon(t, [
    { imya: 'R4-V-P-6 /movie/: вторая кнопка, svg <text><tspan>', s: mv, html: (h) => h.replace('>The cast</a>', '>The cast<svg width="90" height="18"><text y="14"><tspan>and crew</tspan></text></svg></a>'), prichina: 'secondary: надпись' },
    { imya: 'R4-V-P-6 /max-payne-2/: призыв, <textPath> во второй svg', s: m2, html: (h) => h.replace(CTA, '$1<svg width="90" height="18"><path id="d" d="M0 14h90"/><text><textPath href="#d">free now</textPath></text></svg>'), prichina: 'кнопки призыва' },
    { imya: 'R4-V-P-6 /max-payne-2/: вторая кнопка, теневой корень closed', s: m2, html: (h) => h.replace('>The first game</a>', '><span><template shadowrootmode="closed">Buy Max Payne 3</template>The first game</span></a>'), prichina: 'secondary: надпись' },
    { imya: 'R4-V-P-6 /movie/: кнопка призыва, надпись в теневом корне span', s: mv, html: (h) => h.replace(/(<a class="btn btn-primary t-button cta__btn"[^>]*>)([^<]*)/, '$1<span><template shadowrootmode="open">Buy now</template>$2</span>'), prichina: 'кнопки призыва' },
    { imya: 'R4-V-P-6 /max-payne-2/: кнопка призыва, <input type=submit value>', s: m2, html: (h) => h.replace(CTA, '$1<input type="submit" value="free now">'), prichina: 'кнопки призыва' },
  ]);
});

test('R4-V-K-13 вторая «Games:» или «License class:» другой записью — читатель видит ту же строку', async (t) => {
  const { rm } = r4();
  await progon(t, [
    { imya: 'R4-V-K-13 вторая Ga&shy;mes:', s: rm, html: (h) => h.replace(NOTA4, 'Games: Max Payne. Ga&shy;mes: Max Payne 3.'), prichina: '«Games:» 2 раз' },
    { imya: 'R4-V-K-13 вторая Games&#8203;: (U+200B)', s: rm, html: (h) => h.replace(NOTA4, 'Games: Max Payne. Games&#8203;: Max Payne 3.'), prichina: '«Games:» 2 раз' },
    { imya: 'R4-V-K-13 вторая GAMES: прописными', s: rm, html: (h) => h.replace(NOTA4, 'Games: Max Payne. GAMES: Max Payne 3.'), prichina: '«Games:» 2 раз' },
    { imya: 'R4-V-K-13 вторая Games : с пробелом до двоеточия', s: rm, html: (h) => h.replace(NOTA4, 'Games: Max Payne. Games : Max Payne 3.'), prichina: '«Games:» 2 раз' },
    { imya: 'R4-V-K-13 вторая Li&shy;cense class:', s: rm, html: (h) => h.replace(NOTA4, 'Games: Max Payne. Li&shy;cense class: CC BY-SA 4.0.'), prichina: '«License class:» 2 раз' },
  ]);
});
test.todo('R4-V-K-13 (предел): буквы-двойники других алфавитов в «Games:» и «License class:» (кириллическая «а») не судятся');

test('R4-V-P-7 формы V3-9 проверяющего (класс): WORD JOINER, полноширинное двоеточие, строчные, License&shy; class:, div подвала', async (t) => {
  const { m2, NOTA2 } = r4();
  await progon(t, [
    { imya: 'R4-V-P-7 Games&#8288;: (WORD JOINER)', s: m2, html: (h) => h.replace(NOTA2, NOTA2 + ' Games&#8288;: Max Payne 3.'), prichina: '«Games:» 2 раз' },
    { imya: 'R4-V-P-7 Games&#xFF1A; (полноширинное двоеточие)', s: m2, html: (h) => h.replace(NOTA2, NOTA2 + ' Games&#xFF1A; Max Payne 3.'), prichina: '«Games:» 2 раз' },
    { imya: 'R4-V-P-7 games: строчными', s: m2, html: (h) => h.replace(NOTA2, NOTA2 + ' games: Max Payne 3.'), prichina: '«Games:» 2 раз' },
    { imya: 'R4-V-P-7 License&shy; class:', s: m2, html: (h) => h.replace(NOTA2, NOTA2 + ' License&shy; class: CC BY 4.0.'), prichina: '«License class:» 2 раз' },
    { imya: 'R4-V-P-7 div подвала с «Games: Max Payne 3.»', s: m2, html: (h) => h.replace('<p class="t-caption ft__copy tabular"', '<div class="t-caption">Games: Max Payne 3.</div><p class="t-caption ft__copy tabular"'), prichina: '«Games:» 2 раз' },
  ]);
});

test('R4-V-P-9 формы V3-9 проверяющего (закон): «Games :», «GAMES:», «License class :»', async (t) => {
  const { rm } = r4();
  const NOTA_LIC = /(<p class="ft__art-note[^"]*"[^>]*>License class[^<]*<\/p>)/;
  await progon(t, [
    { imya: 'R4-V-P-9 вторая нота «Games : Max Payne 3.»', s: rm, html: (h) => h.replace(NOTA_LIC, '<p class="ft__art-note t-caption">Games : Max Payne 3.</p>$1'), prichina: '«Games:» 2 раз' },
    { imya: 'R4-V-P-9 вторая нота «GAMES: Max Payne 3.»', s: rm, html: (h) => h.replace(NOTA_LIC, '<p class="ft__art-note t-caption">GAMES: Max Payne 3.</p>$1'), prichina: '«Games:» 2 раз' },
    { imya: 'R4-V-P-9 вторая нота «License class :CC BY-SA 4.0.»', s: rm, html: (h) => h.replace(NOTA_LIC, '$1<p class="ft__art-note t-caption">License class :CC BY-SA 4.0.</p>'), prichina: '«License class:» 2 раз' },
  ]);
});

test('R4-V-K-14 «Games:» в абзаце подвала вне p.ft__art-note — читается как вторая нота', async (t) => {
  const { rm } = r4();
  await progon(t, [{ imya: 'R4-V-K-14 «Games:» в абзаце ft__legal', s: rm, html: (h) => h.replace('<p class="t-caption ft__copy tabular"', '<p class="t-caption">Games: Max Payne 3.</p><p class="t-caption ft__copy tabular"'), prichina: '«Games:» 2 раз' }]);
});

test('R4-V-Z-2 части V3-3 без сторожа: style у <html>, у <body>, у ряда вне героя, <link rel=stylesheet> в <main>', async (t) => {
  const { rm } = r4();
  await progon(t, [
    { imya: 'R4-V-Z-2 style у <html>', s: rm, html: (h) => h.replace('<html lang="en">', '<html lang="en" style="filter: invert(1)">'), prichina: 'style у html' },
    { imya: 'R4-V-Z-2 style у <body>', s: rm, html: (h) => h.replace('<body>', '<body style="display: none">'), prichina: 'style у body' },
    { imya: 'R4-V-Z-2 style у ряда вне героя', s: rm, html: (h) => h.replace('id="what-it-is"', 'id="what-it-is" style="display: none"'), prichina: 'style у section.layer' },
    { imya: 'R4-V-Z-2 <link rel=stylesheet> в <main>', s: rm, html: (h) => h.replace('<main id="content">', '<main id="content"><link rel="stylesheet" href="/_astro/proba.css">'), prichina: '<style> в <main>: 1 (link)' },
  ]);
});

test('R4-V-Z-3 части V3-4 без сторожа: /_ASTRO/ прописными и обратная косая после _astro', async (t) => {
  const { rm, K15 } = r4();
  await progon(t, [
    { imya: 'R4-V-Z-3 video poster с /_ASTRO/ прописными', s: rm, html: (h) => vHeroj4(h, `<video poster="${K15.replace('/_astro/', '/_ASTRO/')}"></video>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
    { imya: 'R4-V-Z-3 video poster с /_astro\\ (обратная косая)', s: rm, html: (h) => vHeroj4(h, `<video poster="${K15.replace('/_astro/', '/_astro\\')}"></video>`), prichina: 'ключами вне кадров содержания: mp3-k15' },
  ]);
});

test('R4-V-Z-4 части V3-6 без сторожа: aria-labelledby «связанных», имя h2 и каждый класс заголовка', async (t) => {
  const { rm } = r4();
  const ZAG = 'class="link-list__title t-headline" id="related-title"';
  await progon(t, [
    { imya: 'R4-V-Z-4 aria-labelledby «связанных» на чужой id', s: rm, html: (h) => h.replace(/(<section class="link-list[^>]*?)aria-labelledby="related-title"/, '$1aria-labelledby="release-date-title"'), prichina: 'aria-labelledby «связанных»' },
    { imya: 'R4-V-Z-4 заголовок «связанных» — h3 с классами', s: rm, html: (h) => h.replace(/<h2 class="link-list__title t-headline" id="related-title"([^>]*)>([^<]*)<\/h2>/, '<h3 class="link-list__title t-headline" id="related-title"$1>$2</h3>'), prichina: '(«h3.link-list__title.t-headline»)' },
    { imya: 'R4-V-Z-4 без link-list__title', s: rm, html: (h) => h.replace(ZAG, 'class="t-headline" id="related-title"'), prichina: '(«h2.t-headline»)' },
    { imya: 'R4-V-Z-4 без t-headline', s: rm, html: (h) => h.replace(ZAG, 'class="link-list__title" id="related-title"'), prichina: '(«h2.link-list__title»)' },
  ]);
});

/** Сверка /remake/ с иконками зеркала, где разметка arrow-down в icons.ts заменена на `na` (порча HTML — `html`). */
function sIkonoyVniz4(na, html) {
  const k = zerkalo();
  try {
    const DOWN = '<path d="m6 9 6 6 6-6"/>';
    const f = join(k, 'src/data/icons.ts');
    const byl = readFileSync(f, 'utf8');
    writeFileSync(f, byl.replace(`'arrow-down': '${DOWN}'`, `'arrow-down': '${na}'`));
    assert.notEqual(readFileSync(f, 'utf8'), byl, 'правка icons.ts не применилась');
    const Vk = vhody(k);
    const x = po('/remake/');
    const h = html(x.html, DOWN);
    assert.notEqual(h, x.html, 'порча не применилась');
    return sverkaStranicy({ page: x.page, dane: x.dane, html: h, kredity: Vk.kredity, ikony: Vk.ikony, obyazatelnaPodpis: OBYAZATELNA });
  } finally {
    rmSync(k, { recursive: true, force: true });
  }
}

test('R4-V-Z-5 законная иконка с вложенным svg в icons.ts и в печати — замечаний нет (вложенные svg не в счёт)', () => {
  const VLOZH = '<svg x="0" y="0"><path d="m6 9 6 6 6-6"/></svg>';
  assert.deepEqual(sIkonoyVniz4(VLOZH, (h, DOWN) => h.replace(DOWN, VLOZH)), []);
});

test('R4-V-Z-6 текст <title> иконки не как в icons.ts — замечание (подпись иконки — с текстом элементов)', () => {
  const z = sIkonoyVniz4('<title>Down</title><path d="m6 9 6 6 6-6"/>', (h, DOWN) => h.replace(DOWN, '<title>Download the full game</title>' + DOWN));
  assert.ok(z.some((x) => x.includes('иконка главной кнопки')), z.join(' | ') || 'замечаний нет');
});

test('R4-V-Z-7 петля ссылок: файлы содержания читаются по разу — страниц столько же, сколько без петли', () => {
  const k = zerkalo();
  const svyaz = join(k, 'src/content/tresc/petlya');
  try {
    symlinkSync(join(k, 'src/content/tresc'), svyaz, 'junction');
    const r = sverkaSborki(dist(), k, { obyazatelnaPodpis: OBYAZATELNA });
    assert.deepEqual(r.zamechaniya, []);
    assert.equal(r.stranic, sverkaSborki(dist(), SAYT, { obyazatelnaPodpis: OBYAZATELNA }).stranic);
  } finally {
    unlinkSync(svyaz);
    rmSync(k, { recursive: true, force: true });
  }
});

test.todo('R4-V-P-8 (предел): <style> и <link rel=stylesheet> в <head> (печать сайта) не судятся — правило для .geroy или иконки там сверка не читает');
