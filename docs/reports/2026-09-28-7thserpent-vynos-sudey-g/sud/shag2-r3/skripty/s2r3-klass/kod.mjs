// Пишет brauzer.js — код Playwright со страницами внутри (у кода браузера нет доступа к файлам).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const D = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r3/s2r3-klass/';
const stranicy = Object.fromEntries(readdirSync(join(D, 'stranicy')).map((f) => [f, readFileSync(join(D, 'stranicy', f), 'utf8')]));
const kod = `async (page) => {
  const S = ${JSON.stringify(stranicy)};
  await page.context().route('http://proba.test/**', (r) => {
    const f = new URL(r.request().url()).pathname.slice(1);
    return S[f] ? r.fulfill({ contentType: 'text/html; charset=utf-8', body: S[f] }) : r.fulfill({ status: 404, body: '' });
  });
  const out = {};
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h });
    for (const v of ['kontrol', 'ten-hero', 'ten-main', 'ten-body', 'kredit', 'iframe-srcdoc', 'iframe-js', 'refresh']) {
      await page.goto('http://proba.test/' + v + '.html');
      await page.waitForTimeout(1500);
      out[w + ' ' + v] = await page.evaluate(() => {
        const p = document.querySelector('.podpis-geroya');
        if (!p) return { url: location.pathname, podpis: 'нет', h1: document.querySelector('h1')?.textContent };
        p.scrollIntoView({ block: 'center' });
        const r = p.getBoundingClientRect();
        const top = r.width ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
        const hero = document.querySelector('section.hero');
        return {
          url: location.pathname,
          tekst: p.textContent,
          vidima: p.checkVisibility(),
          rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
          sverhu: top ? top.tagName + '.' + top.className + ' «' + (top.textContent || '').slice(0, 60) + '»' : '—',
          ten: [!!hero.shadowRoot, !!document.querySelector('main').shadowRoot, !!document.body.shadowRoot],
        };
      });
    }
  }
  return JSON.stringify(out, null, 1);
}`;
writeFileSync(join(D, 'brauzer.js'), kod);
console.log(kod.length);
