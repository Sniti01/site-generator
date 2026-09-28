// Предлагаемые тесты Z-2 (а, б): судья слушает параметр obyazatelnaPodpis.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const { sverkaStranicy, vhody } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/sverka.mjs');
const V = vhody('D:/SEO/cloud/site-generator/sites/7thserpent.com');
const po = (url) => ({
  page: V.struktura.pages.find((p) => p.url === url),
  dane: V.soderzhanie.find((s) => s.dane?.url === url).dane,
  html: readFileSync(join(process.env.PROVERKI_DIST, url.slice(1), 'index.html'), 'utf8'),
});
const PODPIS = /<p class="podpis-geroya[^"]*"[^>]*>[\s\S]*?<\/p>/;
const sv = (x, html, dane, spisok) => sverkaStranicy({ page: x.page, dane, html, kredity: V.kredity, ikony: V.ikony, obyazatelnaPodpis: new Set(spisok) });

test('Z-2 (а): /media/ без подписи, /media/ вне переданного списка — замечания нет', () => {
  const x = po('/media/');
  const d = { ...x.dane };
  delete d.artCaption;
  assert.deepEqual(sv(x, x.html.replace(PODPIS, ''), d, ['/remake/']), []);
});
test('Z-2 (б): /story/ (подписи нет) в переданном списке — замечание', () => {
  const x = po('/story/');
  assert.ok(sv(x, x.html, x.dane, ['/story/']).some((y) => y.includes('подпись кадра обязательна у героя /story/')));
});
