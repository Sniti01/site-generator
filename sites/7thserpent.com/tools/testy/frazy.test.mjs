// Сторож 8 слов и судья исключений ядра на страницах сайта (П102 блок Б): порчи прежних проб —
// копии сторожа (`chuzhie-p5.mjs --proba`, 1), разбора реплик `/quotes/` (`chuzhie-repliki.mjs --proba`, 15)
// и разбора глав гайда (`chuzhie-glavy.mjs --proba`, 140) — тестами нового судьи. Ожидание каждой
// порчи — вид отказа нового судьи; где прежний судья говорил иначе, это названо у порчи
// («РАСХОЖДЕНИЕ: …») и разобрано в докладе сессии 20.
//   npm run proverki (сборка копии, корпус input/corpus/raw)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { sudStranicy } from '@factory/core/gates/phrases.mjs';
import { OshibkaIzvlecheniya, izvlechDokument } from '@factory/core/text/extract.mjs';
import { dokumentyKorpusa, tekstDokumentaKorpusa } from '@factory/core/text/corpus.mjs';
import { bezImen, slova, imenaSlovami } from '@factory/core/text/words.mjs';
import { dannye, IMENA } from '../../gates/phrases.mjs';
import { stranica, ukazatel, frazaKorpusa, SAYT } from './obshchee.mjs';

const uk = ukazatel();
/** Итог суда страницы: `{ otkazy }` или `{ isklyuchenie }` (страница не читается). */
function sud(url, html) {
  try {
    return { otkazy: sudStranicy(url, html, uk, dannye).otkazy };
  } catch (e) {
    if (!(e instanceof OshibkaIzvlecheniya)) throw e;
    return { isklyuchenie: e.message, otkazy: [] };
  }
}
/** Проверка порчи: 'чисто' — отказов нет; строка — есть отказ с этой подстрокой (и все подстроки массива —
 *  в одном отказе); `{ isklyuchenie }` — страница не читается с этой подстрокой. */
function zhdat(url, html, zhdem, iskhod) {
  assert.notEqual(html, iskhod ?? null, 'порча не применилась');
  const r = sud(url, html);
  if (zhdem === 'чисто') {
    assert.equal(r.isklyuchenie, undefined, r.isklyuchenie);
    assert.deepEqual(r.otkazy, []);
  } else if (typeof zhdem === 'object' && !Array.isArray(zhdem)) {
    assert.ok(r.isklyuchenie?.includes(zhdem.isklyuchenie), `ждали «${zhdem.isklyuchenie}», получено: ${r.isklyuchenie ?? r.otkazy.join(' | ')}`);
  } else {
    const chasti = [zhdem].flat();
    assert.equal(r.isklyuchenie, undefined, r.isklyuchenie);
    assert.ok(r.otkazy.some((o) => chasti.every((c) => o.includes(c))), `ждали отказ «${chasti.join(' + ')}», получено: ${r.otkazy.join(' | ').slice(0, 400) || 'отказов нет'}`);
  }
}

/** Фраза документа корпуса по правилу: первые 8 слов в модели сторожа — в указателе. */
function izKorpusa(re) {
  const imSl = imenaSlovami(IMENA);
  for (const d of dokumentyKorpusa(join(SAYT, 'input/corpus'))) {
    const t = izvlechDokument(tekstDokumentaKorpusa(d)).vplotnuyu.join(' ').replace(/\s+/g, ' ');
    const m = t.match(re);
    if (m && uk.nayti(bezImen(slova(m[1]), imSl).slice(0, 8).join(' '), 'tochno')) return m[1];
  }
  throw new Error(`в корпусе нет фразы по правилу ${re}`);
}

/* ------------------------------------------------------------------ *
 * Копия сторожа: /pc/, 12 слов документа, седьмое — в <a> (chuzhie-p5.mjs --proba)
 * ------------------------------------------------------------------ */

test('/pc/: 12 слов документа в первом абзаце, седьмое в <a> — отказ', () => {
  const html = stranica('/pc/');
  const { k } = frazaKorpusa(12, { znaki: true });
  const kus = [...k];
  kus[6] = `<a href="/x/">${kus[6]}</a>`;
  const m0 = html.search(/<main\b/i);
  const p = /<p\b[^>]*>/gi;
  p.lastIndex = m0;
  const mp = p.exec(html);
  const i = mp.index + mp[0].length;
  zhdat('/pc/', html.slice(0, i) + kus.join(' ') + ' ' + html.slice(i), 'вне кавычек', html);
});

test('исключения сайта — только решённые классы: реплики /quotes/ (П95), полные названия глав IX и XIII (П99 п. 2)', () => {
  const E = dannye.isklyucheniya;
  assert.equal(E.length, 10);
  assert.deepEqual([...new Set(E.map((e) => e.klass))].sort(), ['название главы', 'реплика']);
  assert.equal(E.filter((e) => e.klass === 'реплика' && e.stranica === '/quotes/' && e.posle && !e.pered && e.ryad.id === undefined).length, 8);
  assert.deepEqual(
    E.filter((e) => e.klass === 'название главы' && e.stranica === '/max-payne-3/guide/' && e.ryad.id === 'chapters' && e.pered && !e.posle).map((e) => e.tekst),
    ['Here I Was Again, Halfway Down the World.', 'A Fat Bald Dude with a Bad Temper.']
  );
});

test('все страницы круга сборки — чисто (контроль)', () => {
  for (const url of ['/404/', '/pc/', '/games-like-max-payne/', '/media/', '/max-payne-1/', '/max-payne-2/', '/max-payne-3/', '/remake/', '/story/', '/voice-and-face/', '/cheats/', '/mods/', '/quotes/', '/gameplay/', '/max-payne-3/guide/', '/movie/']) {
    const r = sud(url, stranica(url));
    assert.equal(r.isklyuchenie, undefined, `${url}: ${r.isklyuchenie}`);
    assert.deepEqual(r.otkazy, [], url);
  }
});

/* ------------------------------------------------------------------ *
 * Реплики /quotes/ (chuzhie-repliki.mjs --proba, 15 порч)
 * ------------------------------------------------------------------ */

test('реплики /quotes/: порчи разбора реплик', async (t) => {
  const html = stranica('/quotes/');
  const { k } = frazaKorpusa(14);
  const vPervyAbzac = (h, s) => {
    const m = /<div class="layer__body[^"]*"[^>]*>\s*<p\b[^>]*>/g.exec(h);
    if (!m) return h;
    const p = m.index + m[0].length;
    return h.slice(0, p) + s + ' ' + h.slice(p);
  };
  const PORCHI = [
    ['контроль', html, 'чисто'],
    ['12 слов документа вне кавычек', vPervyAbzac(html, k.slice(0, 12).join(' ')), 'вне кавычек'],
    ['12 слов документа в кавычках', vPervyAbzac(html, '“' + k.slice(0, 12).join(' ') + '”'), 'в кавычках, но не исключение сайта'],
    ['7 слов в кавычках + 7 вне', vPervyAbzac(html, '“' + k.slice(0, 7).join(' ') + '” ' + k.slice(7, 14).join(' ')), 'через границу кавычек'],
    ['12 слов, в середине 2 в кавычках', vPervyAbzac(html, k.slice(0, 5).join(' ') + ' “' + k.slice(5, 7).join(' ') + '” ' + k.slice(7, 12).join(' ')), 'через границу кавычек'],
    ['реплика без кавычек', html.replace('“My cover had been blown.', 'My cover had been blown.').replace('raindrops.”', 'raindrops.'), 'вне кавычек'],
    ['глава снята (Chapter 7)', html.replace('— Chapter 7, titled', '— titled'), ['I stood out', 'сосед после кавычки']],
    ['глава снята, дальше «also Chapter 2»', html.replace('let alone food” — Chapter 2,', 'let alone food” — in'), ['Her fashion sense', 'сосед после кавычки']],
    ['глава снята, дальше «Part I»', html.replace('“Thank you.” — Chapter 2,', '“Thank you.” In'), ['Thank you', 'сосед после кавычки']],
    ['ряд не той игры', html.replace(/(<p class="t-label[^"]*"[^>]*>)Max Payne · 2001/, '$1Max Payne 3 · 2012'), 'не в своём ряду'],
    [
      'реплика в чужом ряду, слова остались в своём',
      (() => {
        const bez = html.replace('“Thank you.” — Chapter 2, “Live from the Crime Scene.”', 'Thank you. Live from the Crime Scene.');
        const i = bez.indexOf('id="max-payne-3"');
        const m = /<div class="layer__body[^"]*"[^>]*>\s*<p\b[^>]*>/g;
        m.lastIndex = i;
        const x = m.exec(bez);
        return x ? bez.slice(0, x.index + x[0].length) + '“Thank you.” — Chapter 2, from the bank. ' + bez.slice(x.index + x[0].length) : bez;
      })(),
      ['Thank you', 'не в своём ряду'],
    ],
    [
      'реплика в чужом ряду, перед его меткой — скрипт с меткой своей игры (B1-F-1)',
      (() => {
        const bez = html.replace('“Thank you.” — Chapter 2, “Live from the Crime Scene.”', 'Thank you. Live from the Crime Scene.');
        const i = bez.indexOf('>', bez.indexOf('id="max-payne-3"')) + 1;
        const s = bez.slice(0, i) + '<script type="text/plain" class="t-label">Max Payne · 2001</script>' + bez.slice(i);
        const m = /<div class="layer__body[^"]*"[^>]*>\s*<p\b[^>]*>/g;
        m.lastIndex = i;
        const x = m.exec(s);
        return x ? s.slice(0, x.index + x[0].length) + '“Thank you.” — Chapter 2, from the bank. ' + s.slice(x.index + x[0].length) : s;
      })(),
      ['Thank you', 'не в своём ряду'],
    ],
    // Метка прописными в исходнике (на экране та же — CSS uppercase): сверка с регистром — ложный отказ,
    // громкий, не пропуск (раунд 1 блока Б, B1-F-4; прежний разбор реплик — так же).
    ['метка MAX PAYNE · 2001 прописными — отказ (строже)', html.replace(/(<p class="t-label[^"]*"[^>]*>)Max Payne · 2001/, '$1MAX PAYNE · 2001'), ['Karaoke', 'не в своём ряду']],
    ['глава — одно «Part I»', html.replace('“Thank you.” — Chapter 2,', '“Thank you.” — Part I,'), ['Thank you', 'сосед после кавычки']],
    ['глава без тире', html.replace('raindrops.” — Chapter 3,', 'raindrops.” Chapter 3,'), ['My cover', 'сосед после кавычки']],
    ['реплика дважды в кавычках', vPervyAbzac(html, '“Karaoke was never my strong point” — Chapter 8.'), 'в кавычках 2 раз'],
    ['фраза документа, склеенная только через пробел', vPervyAbzac(html, k.slice(0, 5).join(' ') + ' <span>' + k[5] + '</span><span>' + k[6] + '</span> ' + k.slice(7, 12).join(' ')), 'вне кавычек'],
  ];
  for (const [imya, h, zhdem] of PORCHI) await t.test(imya, () => zhdat('/quotes/', h, zhdem, imya === 'контроль' ? null : html));
});

/* ------------------------------------------------------------------ *
 * Названия глав гайда (chuzhie-glavy.mjs --proba, 140 порч)
 * ------------------------------------------------------------------ */

test('названия глав гайда: порчи разбора глав', async (t) => {
  const url = '/max-payne-3/guide/';
  const html = stranica(url);
  const { k } = frazaKorpusa(14);
  const k12 = k.slice(0, 12).join(' ');
  const pol = (vstavka) => k.slice(0, 6).join(' ') + ' ' + vstavka + ' ' + k.slice(6, 12).join(' ');
  const razrez = (vstavka) => k.slice(0, 5).join(' ') + ' ' + k[5].slice(0, 2) + vstavka + k[5].slice(2) + ' ' + k.slice(6, 12).join(' ');
  const sImenem = izKorpusa(/(?:^| )((?:[A-Za-z]{2,} ){4}Max Payne 3 (?:[A-Za-z]{2,} ){2}[A-Za-z]{2,})(?= |$)/);
  const sSao = izKorpusa(/(?:^| )((?:[A-Za-z]{2,} ){4}São Paulo(?: [A-Za-z]{2,}){3})(?= |$)/);
  // Фраза с «İ» (слова строчными — до разбиения): 12 слов вокруг первого такого слова документа,
  // как у прежнего судьи (буквы, допустимы «,» и «.» в конце слова).
  const sI = (() => {
    for (const d of dokumentyKorpusa(join(SAYT, 'input/corpus'))) {
      const w = izvlechDokument(tekstDokumentaKorpusa(d)).vplotnuyu.join(' ').replace(/\s+/g, ' ').trim().split(' ');
      const j = w.findIndex((x) => /^\p{L}*İ\p{L}+$/u.test(x));
      if (j < 6 || j + 6 > w.length) continue;
      const kus = w.slice(j - 5, j + 7);
      if (kus.every((x) => /^\p{L}+[,.]?$/u.test(x))) return kus.join(' ');
    }
    throw new Error('в корпусе нет фразы со словом на «İ»');
  })();
  const vAbzac = (h, s, posle = 0) => {
    const m = /<div class="layer__body[^"]*"[^>]*>\s*<p\b[^>]*>/g;
    m.lastIndex = posle;
    const x = m.exec(h);
    if (!x) return h;
    const p = x.index + x[0].length;
    return h.slice(0, p) + s + ' ' + h.slice(p);
  };
  const vDlinu = (h, s) => vAbzac(h, s, h.indexOf('id="length"'));
  const vAtr = (h, imya, s) => {
    const n = `${imya}="`;
    const j = h.indexOf(n);
    return j < 0 ? h : h.slice(0, j + n.length) + s + ' ' + h.slice(j + n.length);
  };
  const vAlt = (h, s) => {
    const i = h.search(/<main\b/i);
    const j = h.indexOf(' alt="', i);
    return j < 0 ? h : h.slice(0, j + 6) + s + ' ' + h.slice(j + 6);
  };
  const IX = '“Here I Was Again, Halfway Down the World.”';
  const XIII = '“A Fat Bald Dude with a Bad Temper.”';
  const X = '“It’s Drive or Shoot, Sister.”';
  const PERED_IX = ['Here I Was Again', 'сосед перед кавычкой'];
  const PERED_XIII = ['A Fat Bald Dude', 'сосед перед кавычкой'];
  const GOLOVA = 'в голове или атрибуте';
  const PORCHI = [
    ['контроль', html, 'чисто'],
    // Текст вне кавычек и кавычки.
    ['12 слов документа вне кавычек', vAbzac(html, k12), 'вне кавычек'],
    ['12 слов документа в кавычках', vAbzac(html, '“' + k12 + '”'), 'в кавычках, но не исключение сайта'],
    ['7 слов в кавычках + 7 вне', vAbzac(html, '“' + k.slice(0, 7).join(' ') + '” ' + k.slice(7, 14).join(' ')), 'через границу кавычек'],
    ['12 слов, в середине 2 в кавычках', vAbzac(html, k.slice(0, 5).join(' ') + ' “' + k.slice(5, 7).join(' ') + '” ' + k.slice(7, 12).join(' ')), 'через границу кавычек'],
    ['фраза документа после IX в той же строке', html.replace(IX, IX + ' ' + k12), 'вне кавычек'],
    // ПРЕДЕЛ (прежний sod5-4; раунд 1 блока Б, B1-F-3): чужой номер другой записью — не заголовок.
    ['ПРЕДЕЛ sod5-4: чужой номер «10.» в месте IX — не заголовок, чисто', html.replace('police raid (6 / 3): ' + IX, 'police raid, then 10. A bus station (6 / 3): ' + IX), 'чисто'],
    ['8-грамма IX ещё раз вне кавычек за ним', html.replace(IX, IX + ' here I was again, halfway down the world'), 'вне кавычек'],
    ['фраза документа в кавычках главы X (строка IX)', html.replace(X, '“' + k12 + '”'), 'в кавычках, но не исключение сайта'],
    ['число вплотную к названию VI', html.replace('VI. An office building that goes up in flames (3 / 5): “A Dame', 'VI. An office building that goes up in flames, chapter 6: “A Dame'), 'через границу кавычек'],
    // Два прочтения, теги, невидимые знаки.
    ['фраза, склеенная только через пробел', vAbzac(html, k.slice(0, 5).join(' ') + ' <span>' + k[5] + '</span><span>' + k[6] + '</span> ' + k.slice(7, 12).join(' ')), 'вне кавычек'],
    ['слово, разрезанное пустым тегом (вплотную)', vAbzac(html, razrez('<em></em>')), 'вне кавычек'],
    ['<u> внутри слова', vAbzac(html, razrez('<u>') + '</u>'), 'вне кавычек'],
    ['<wbr> внутри слова', vAbzac(html, razrez('<wbr>')), 'вне кавычек'],
    ['комментарий внутри слова', vAbzac(html, razrez('<!-- -->')), 'вне кавычек'],
    ['скрипт внутри слова', vAbzac(html, razrez('<script></script>')), 'вне кавычек'],
    ['тег, который маска TEG не узнаёт', vAbzac(html, razrez('<span title=it\'s>') + '</span>'), 'вне кавычек'],
    ['<td> посреди фразы', vAbzac(html, pol('<td>')), 'вне кавычек'],
    ['<br> посреди фразы', vAbzac(html, pol('<br>')), 'вне кавычек'],
    ['перенос строки посреди фразы', vAbzac(html, pol('\n')), 'вне кавычек'],
    ['&#10; посреди фразы', vAbzac(html, pol('&#10;')), 'вне кавычек'],
    ['&#1; посреди фразы', vAbzac(html, pol('&#1;')), 'вне кавычек'],
    ['U+0002 внутри слова', vAbzac(html, razrez(String.fromCharCode(2))), 'вне кавычек'],
    ['&#2; внутри слова', vAbzac(html, razrez('&#2;')), 'вне кавычек'],
    ['U+0001 посреди фразы', vAbzac(html, pol('\u0001')), 'вне кавычек'],
    ['&#173; внутри слова', vAbzac(html, razrez('&#173;')), 'вне кавычек'],
    ['U+00AD внутри слова', vAbzac(html, razrez('­')), 'вне кавычек'],
    ['U+034F внутри слова', vAbzac(html, razrez('͏')), 'вне кавычек'],
    ['адрес посреди фразы', vAbzac(html, pol(' https://example.com/x ')), 'вне кавычек'],
    ['название игры в каждом окне фразы', vAbzac(html, sImenem), 'вне кавычек'],
    ['фраза со словом на «İ»', vAbzac(html, sI), 'вне кавычек'],
    ['фраза с разложенной «ã» (NFD)', vAbzac(html, sSao.normalize('NFD')), 'вне кавычек'],
    // Границы <main>.
    ['«</main>» в комментарии перед фразой', vAbzac(html, '<!-- </main> --> ' + k12), 'вне кавычек'],
    ['«</main>» в скрипте перед фразой', vAbzac(html, '<script>/* </main> */</script> ' + k12), 'вне кавычек'],
    ['«</main>» в атрибуте перед фразой', vAbzac(html, '<span title="</main>">x</span> ' + k12), 'вне кавычек'],
    // Названия: счёт, допуск, ряд, номер.
    ['название IX без кавычек', html.replace(IX, 'Here I Was Again, Halfway Down the World.'), 'вне кавычек'],
    ['название XIII дважды', vAbzac(html, XIII), 'в кавычках 2 раз'],
    ['копия IX, видимая только через пробел', vDlinu(html, '“Here I Was Again, Halfway Down the<span></span>World.”'), 'в кавычках 2 раз'],
    ['копия IX, видимая только вплотную', vDlinu(html, '“Here I Was Again, Halfway Down the Wo<em></em>rld.”'), 'в кавычках 2 раз'],
    ['название IX сокращено (как до сессии 19)', html.replace(IX, '“Here I Was Again…”'), 'в кавычках 0 раз'],
    ['лишнее слово внутри кавычек IX', html.replace(IX, '“Here I Was Again, Halfway Down the World, Again.”'), 'в кавычках, но не исключение сайта'],
    ['хвост во второй паре, первая цела', vDlinu(html, '“Here I Was Again, Halfway Down the World. Again.”'), 'в кавычках, но не исключение сайта'],
    ['кавычка IX закрыта раньше', html.replace(IX, '“Here I Was Again, Halfway Down the” World.'), 'через границу кавычек'],
    ['номер чужой главы у IX', html.replace('IX. The favela again', 'X. The favela again'), PERED_IX],
    ['номер «XIX.» у IX', html.replace('IX. The favela again', 'XIX. The favela again'), PERED_IX],
    ['номер снят у XIII', html.replace('XIII. A prison', 'A prison'), PERED_XIII],
    ['заголовок главы X между IX и названием', html.replace('police raid (6 / 3): ' + IX, 'police raid (6 / 3): X. A bus station (6 / 2): ' + IX), PERED_IX],
    ['второй счёт между IX и названием', html.replace('police raid (6 / 3): ' + IX, 'police raid (6 / 3): a bus station (6 / 2): ' + IX), PERED_IX],
    [
      'IX под заголовком X со ссылкой «IX.»',
      html.replace('police raid (6 / 3): ' + IX + ' X. A bus station and a bus ride (6 / 2): ' + X, 'police raid (6 / 3): ' + X + ' X. A bus station, back from IX. to the city (6 / 2): ' + IX),
      PERED_IX,
    ],
    ['XIII под «—XIV.» вплотную', html.replace('XIII. A prison and a police station (9 / 7): ' + XIII, 'XIII. A prison and a police station —XIV. The airport (9 / 7): ' + XIII), PERED_XIII],
    ['текст между счётом и кавычкой IX', html.replace('(6 / 3): ' + IX, '(6 / 3): see ' + IX), PERED_IX],
    ['счёт частей и улик снят у IX', html.replace('police raid (6 / 3): ' + IX, 'police raid: ' + IX), PERED_IX],
    [
      'название XIII в чужом ряду',
      (() => {
        const bez = html.replace(' XIII. A prison and a police station (9 / 7): ' + XIII, '');
        return vDlinu(bez, 'XIII. A prison and a police station (9 / 7): ' + XIII);
      })(),
      ['A Fat Bald Dude', 'не в своём ряду'],
    ],
    ['ряда с id="chapters" нет', html.replace('id="chapters"', 'id="glavy"'), ['не в своём ряду', 'glavy']],
    ['видимая метка ряда не «Chapters»', html.replace(/(id="chapters"[\s\S]*?<p class="t-label[^"]*"[^>]*>)Chapters</, '$1Length<'), ['не в своём ряду', 'Length']],
    ['метка «Chapters» только в комментарии', html.replace(/(id="chapters"[\s\S]*?)(<p class="t-label[^"]*"[^>]*>)Chapters</, '$1<!-- $2Chapters</p> -->$2Length<'), ['не в своём ряду', 'Length']],
    // Законная разметка — чисто.
    ['<a> вокруг IX до точки — чисто', html.replace(IX, '“<a href="/x/">Here I Was Again, Halfway Down the World</a>.”'), 'чисто'],
    ['счёт IX в <span> — чисто', html.replace('police raid (6 / 3): ', 'police raid <span class="tabular">(6 / 3)</span>: '), 'чисто'],
    ['номер IX в <strong> — чисто', html.replace('IX. The favela again', '<strong>IX</strong>. The favela again'), 'чисто'],
    ['метка CHAPTERS заглавными — чисто', html.replace(/(id="chapters"[\s\S]*?<p class="t-label[^"]*"[^>]*>)Chapters</, '$1CHAPTERS<'), 'чисто'],
    ['фраза в alt картинки в комментарии — чисто', vAbzac(html, '<!-- <img src="x.png" alt="' + k12 + '"> -->'), 'чисто'],
    // <title>, описания, атрибуты.
    ['фраза документа в <title>', html.replace('<title>', '<title>' + k12 + ' '), GOLOVA],
    ['фраза документа в meta description', vAtr(html, 'name="description" content', k12), GOLOVA],
    ['«>» в description перед фразой', vAtr(html, 'name="description" content', 'Settings > Graphics: ' + k12), GOLOVA],
    ['название игры в description', vAtr(html, 'name="description" content', sImenem), GOLOVA],
    ['фраза документа в og:title', vAtr(html, 'property="og:title" content', k12), GOLOVA],
    ['фраза документа в og:description', vAtr(html, 'property="og:description" content', k12), GOLOVA],
    [
      'фраза документа в alt картинки <main>',
      (() => {
        const i = html.search(/<main\b/i);
        const j = html.indexOf(' alt="', i);
        return html.slice(0, j) + ' alt="' + k12 + ' ' + html.slice(j + 6);
      })(),
      GOLOVA,
    ],
    [
      '«<» в alt перед фразой',
      (() => {
        const i = html.search(/<main\b/i);
        const j = html.indexOf(' alt="', i);
        return html.slice(0, j) + ' alt="at < 30 fps: ' + k12 + ' ' + html.slice(j + 6);
      })(),
      GOLOVA,
    ],
    ['фраза документа в атрибуте title=', vAbzac(html, '<span title="' + k12 + '">x</span>'), GOLOVA],
    ['фраза документа в aria-label', vAbzac(html, '<span aria-label="' + k12 + '">x</span>'), GOLOVA],
    ['фраза документа в value кнопки', vAbzac(html, '<input type="button" value="' + k12 + '">'), GOLOVA],
    // Раунд 3 прежнего судьи: пробельные и невидимые знаки, теги и атрибуты, голова, ряд, номер.
    ['перенос строки вплотную между словами', vAbzac(html, k.slice(0, 6).join(' ') + '\n' + k.slice(6, 12).join(' ')), 'вне кавычек'],
    ['&#10; вплотную между словами', vAbzac(html, k.slice(0, 6).join(' ') + '&#10;' + k.slice(6, 12).join(' ')), 'вне кавычек'],
    ['&#11; внутри слова (VT снимается)', vAbzac(html, razrez('&#11;')), 'вне кавычек'],
    ['DEL внутри слова', vAbzac(html, razrez(String.fromCharCode(127))), 'вне кавычек'],
    ['&ZeroWidthSpace; внутри слова', vAbzac(html, razrez('&ZeroWidthSpace;')), 'вне кавычек'],
    ['заполнитель хангыля вместо пробелов', vAbzac(html, k.slice(0, 12).join(String.fromCharCode(0x3164))), 'вне кавычек'],
    ['<script-x> — не скрипт, текст виден', vAbzac(html, '<script-x>' + k12 + '</script-x>'), 'вне кавычек'],
    ['«</script >» закрывает скрипт', vAbzac(html, '<script>x</script > ' + k12), 'вне кавычек'],
    ['управляющий знак в имени «скрипта»', vAbzac(html, '<scr' + String.fromCharCode(1) + 'ipt>' + k12 + '</scr' + String.fromCharCode(1) + 'ipt>'), 'вне кавычек'],
    ['«<!--» в alt не прячет текст', vAbzac(html, '<img src="a.png" alt="<!-- x"> ' + k12 + ' <img src="b.png" alt="y -->">'), 'вне кавычек'],
    ['«<!--» в description перед фразой', vAtr(html, 'name="description" content', '<!-- ' + k12), GOLOVA],
    ['атрибут title= после «title=» в aria-label', vAbzac(html, '<span aria-label="See title=HLTB" title="' + k12 + '">x</span>'), GOLOVA],
    ['фраза документа в label= у option', vAbzac(html, '<select><option label="' + k12 + '">x</option></select>'), GOLOVA],
    ['«</main>» в атрибуте без кавычек', vAbzac(html, '<span title=</main>>x</span> ' + k12), 'вне кавычек'],
    ['meta description между </head> и <body>', html.replace(/<\/head>\s*<body/, (m) => '</head><meta name="description" content="' + k12 + '">' + m.slice(7)), { isklyuchenie: 'description — 2' }],
    ['два <title>', html.replace('</title>', '</title><title>x</title>'), { isklyuchenie: 'title — 2' }],
    ['пустой og:title', html.replace(/(property="og:title" content=")[^"]*"/, '$1"'), { isklyuchenie: 'og:title — 1 пустой' }],
    ['SVG с <title> в адресе иконки — чисто', html.replace('</head>', '<link rel="icon" href="data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'><title>x</title></svg>"></head>'), 'чисто'],
    ['SVG с <title> в начале тела — чисто', html.replace(/<body\b[^>]*>/, (m) => m + '<svg><title>Logo</title></svg>'), 'чисто'],
    ['<main-menu> в начале тела — чисто', html.replace(/<body\b[^>]*>/, (m) => m + '<main-menu>Menu</main-menu>'), 'чисто'],
    ['ряд: id раньше class, layer не первый — чисто', html.replace('<section class="layer section layer--bez-kadru" id="chapters"', '<section id="chapters" class="section layer layer--bez-kadru"'), 'чисто'],
    ['метка: t-label не первый класс — чисто', html.replace(/(id="chapters"[\s\S]*?<p class=")t-label/, '$1x t-label'), 'чисто'],
    ['комментарий внутри слова строки IX — чисто', html.replace('The favela again', 'The fav<!-- -->ela again'), 'чисто'],
    ['свой номер последним, чужой — в отрезке', html.replace('IX. The favela again, during a police raid (6 / 3): ', 'IX. The favela again, as in X. and IX. before, during a police raid (6 / 3): '), PERED_IX],
    ['«·X.» между IX и названием', html.replace('police raid (6 / 3): ' + IX, 'police raid ·X. A bus station (6 / 3): ' + IX), PERED_IX],
    ['кириллическая «Х.» между IX и названием', html.replace('police raid (6 / 3): ' + IX, 'police raid Х. A bus station (6 / 3): ' + IX), PERED_IX],
    ['«X.—» без пробела между IX и названием', html.replace('police raid (6 / 3): ' + IX, 'police raid X.—A bus station (6 / 3): ' + IX), PERED_IX],
    // Раунд 4: номер белым списком, адрес, замена кода с конца, атрибуты, пробельные знаки, метка, <main-…>.
    ['греческая «Χ.» между IX и названием', html.replace('police raid (6 / 3): ' + IX, 'police raid ' + String.fromCharCode(0x3a7) + '. A bus station (6 / 3): ' + IX), PERED_IX],
    ['«ꞏX.» (буква-точка) между IX и названием', html.replace('police raid (6 / 3): ' + IX, 'police raid ' + String.fromCharCode(0xa78f) + 'X. A bus station (6 / 3): ' + IX), PERED_IX],
    ['«Ⅹ.» (U+2169) между IX и названием', html.replace('police raid (6 / 3): ' + IX, 'police raid ' + String.fromCharCode(0x2169) + '. A bus station (6 / 3): ' + IX), PERED_IX],
    ['кириллическая буква в месте IX — строже', html.replace('The favela again', 'The favela ag' + String.fromCharCode(0x430) + 'in'), PERED_IX],
    ['счёт «(6/3):» — чисто', html.replace('police raid (6 / 3): ' + IX, 'police raid (6/3): ' + IX), 'чисто'],
    ['«by the PMC.» в месте IX — чисто', html.replace('police raid (6 / 3): ' + IX, 'police raid by the PMC. (6 / 3): ' + IX), 'чисто'],
    // РАСХОЖДЕНИЕ: прежний судья — код 2 («слова строки разошлись со сторожем»: две модели слов); новый — одна модель,
    // адрес режется знаками адреса, фраза ловится.
    ['фраза через U+2800 вплотную к адресу', vAbzac(html, 'https://example.com/x' + String.fromCharCode(0x2800) + k.slice(0, 12).join(String.fromCharCode(0x2800))), 'вне кавычек'],
    ['два комментария перед фразой (замена с конца)', vAbzac(html, '<!-- a --> x <!-- bb --> ' + k.slice(0, 8).join(' ')), 'вне кавычек'],
    ['дубль атрибута title= (судится первый)', vAbzac(html, '<span title="' + k12 + '" title="HowLongToBeat">x</span>'), GOLOVA],
    ['&ZeroWidthSpace; внутри слова в alt', vAlt(html, razrez('&ZeroWidthSpace;')), GOLOVA],
    ['пара «< >» в alt вокруг фразы', vAlt(html, 'x < 30 fps: ' + k12 + ' (> 60 fps)'), GOLOVA],
    ['«<!-- … -->» в description вокруг фразы', vAtr(html, 'name="description" content', '<!-- ' + k12 + ' -->'), GOLOVA],
    ['«<!-- … -->» в alt вокруг фразы', vAlt(html, '<!-- ' + k12 + ' -->'), GOLOVA],
    ['фраза документа в placeholder=', vAbzac(html, '<input placeholder="' + k12 + '">'), GOLOVA],
    ['табуляция вплотную между словами', vAbzac(html, k.slice(0, 6).join(' ') + '\t' + k.slice(6, 12).join(' ')), 'вне кавычек'],
    ['&#13; вплотную между словами', vAbzac(html, k.slice(0, 6).join(' ') + '&#13;' + k.slice(6, 12).join(' ')), 'вне кавычек'],
    ['сырой \\v внутри слова', vAbzac(html, razrez(String.fromCharCode(11))), 'вне кавычек'],
    ['сырой \\f внутри слова', vAbzac(html, razrez(String.fromCharCode(12))), 'вне кавычек'],
    ['U+FFA0 вместо пробелов', vAbzac(html, k.slice(0, 12).join(String.fromCharCode(0xffa0))), 'вне кавычек'],
    ['U+1BCA0 вместо пробелов', vAbzac(html, k.slice(0, 12).join(String.fromCodePoint(0x1bca0))), 'вне кавычек'],
    ['<script-x> и парный </script> дальше', vAbzac(html, '<script-x>' + k12 + '</script-x><script></script>'), 'вне кавычек'],
    ['«</script >» и парный скрипт дальше', vAbzac(html, '<script>x</script > ' + k12 + ' <script></script>'), 'вне кавычек'],
    ['<style-x> и парный </style> дальше', vAbzac(html, '<style-x>' + k12 + '</style-x><style></style>'), 'вне кавычек'],
    ['«</style >» и парный стиль дальше', vAbzac(html, '<style>x</style > ' + k12 + ' <style></style>'), 'вне кавычек'],
    ['метка «Chap<!-- -->ters» — чисто', html.replace(/(id="chapters"[\s\S]*?<p class="t-label[^"]*"[^>]*>)Chapters</, '$1Chap<!-- -->ters<'), 'чисто'],
    ['<main-menu> с фразой до <main> — чисто', html.replace(/<body\b[^>]*>/, (m) => m + '<main-menu>' + k12 + '</main-menu>'), 'чисто'],
    // Раунд 5.
    ['U+115F вместо пробелов', vAbzac(html, k.slice(0, 12).join(String.fromCharCode(0x115f))), 'вне кавычек'],
    ['U+1160 вместо пробелов', vAbzac(html, k.slice(0, 12).join(String.fromCharCode(0x1160))), 'вне кавычек'],
    ['U+1BCA3 вместо пробелов', vAbzac(html, k.slice(0, 12).join(String.fromCodePoint(0x1bca3))), 'вне кавычек'],
    ['фраза через U+2800 вплотную к адресу в alt', vAlt(html, 'https://example.com/x' + String.fromCharCode(0x2800) + k.slice(0, 12).join(String.fromCharCode(0x2800))), GOLOVA],
    ['широкий адрес в тексте перед фразой — не код 2', vAbzac(html, 'https://example.com/w/Max_Payne_3?a=1&amp;b=2~x#s(1),y;z%20q&#39;r*+!$@[] ' + k12), 'вне кавычек'],
    ['место IX: цифры, ’ \' & - – — — чисто', html.replace('IX. The favela again, during a police raid (6 / 3): ', 'IX. The favela again – Max&#39;s 2nd &amp; 3rd re-entry — during a police raid’s end (6 / 3): '), 'чисто'],
    ['«L.A.» и «12C.» в месте IX — чисто', html.replace('IX. The favela again, during a police raid (6 / 3): ', 'IX. The favela again, a police raid in L.A. style at 12C. (6 / 3): '), 'чисто'],
    ['сырой CR вплотную между словами', vAbzac(html, k.slice(0, 6).join(' ') + '\r' + k.slice(6, 12).join(' ')), 'вне кавычек'],
    ['&#9; вплотную между словами', vAbzac(html, k.slice(0, 6).join(' ') + '&#9;' + k.slice(6, 12).join(' ')), 'вне кавычек'],
    ['&#x9; вплотную между словами', vAbzac(html, k.slice(0, 6).join(' ') + '&#x9;' + k.slice(6, 12).join(' ')), 'вне кавычек'],
    ['&#xA; вплотную между словами', vAbzac(html, k.slice(0, 6).join(' ') + '&#xA;' + k.slice(6, 12).join(' ')), 'вне кавычек'],
    ['&#x1; посреди фразы', vAbzac(html, pol('&#x1;')), 'вне кавычек'],
    // Охраны: страница не читается — итог не выдаётся.
    ['второй <main>', html.replace('</main>', '</main><main>x</main>'), { isklyuchenie: '<main> — 2' }],
    ['пустой <main>', html.replace(/(<main\b[^>]*>)[\s\S]*(<\/main>)/, '$1<p>Only a few words here.</p>$2'), { isklyuchenie: 'меньше 100' }],
    ['нет meta description', html.replace(/<meta name="description"[^>]*>/, ''), { isklyuchenie: 'description — 0' }],
    // РАСХОЖДЕНИЕ: прежний судья — код 2 (слова строки разошлись со сторожем: адрес съедал кавычку); новый — одна модель
    // слов, в строке нет 8 чужих слов — чисто.
    ['адрес у кавычки (прежде — слова разошлись со сторожем)', vAbzac(html, '“Alpha https://example.com/”beta gamma.'), 'чисто'],
  ];
  for (const [imya, h, zhdem] of PORCHI) await t.test(imya, () => zhdat(url, h, zhdem, imya === 'контроль' ? null : html));
});
