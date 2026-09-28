// Пишет brauzer.js — код Playwright со страницами внутри (страницы отдаются перехватом, без сети).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const D = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r3/s2r3-klass-prov/';
const S = Object.fromEntries(readdirSync(join(D, 'stranicy')).map((f) => [f, readFileSync(join(D, 'stranicy', f), 'utf8')]));
const imena = JSON.parse(readFileSync(join(D, 'imena.json'), 'utf8'));
const kod = `async (page) => {
  const S = ${JSON.stringify(S)};
  const IMENA = ${JSON.stringify(imena)};
  await page.context().route('http://proverka.test/**', (r) => {
    const f = new URL(r.request().url()).pathname.slice(1);
    return S[f] ? r.fulfill({ contentType: 'text/html; charset=utf-8', body: S[f] }) : r.fulfill({ status: 404, body: '' });
  });
  const out = [];
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    await page.setViewportSize({ width: w, height: h });
    for (const [f, nazv] of Object.entries(IMENA)) {
      await page.goto('http://proverka.test/' + f);
      await page.waitForTimeout(1200);
      const r = await page.evaluate(() => {
        const p = document.querySelector('.podpis-geroya');
        if (!p) return 'адрес ' + location.pathname + ', подписи нет';
        const b = p.getBoundingClientRect();
        const t = b.width ? document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) : null;
        const ten = [document.querySelector('section.hero')?.shadowRoot, document.querySelector('main')?.shadowRoot, document.body.shadowRoot].map((x) => (x ? 1 : 0)).join('');
        return 'адрес ' + location.pathname + ' | текст «' + p.textContent.slice(0, 50) + '» | виден ' + p.checkVisibility() + ' | rect ' + [b.left, b.top, b.width, b.height].map(Math.round).join(',') + ' | сверху ' + (t ? t.tagName + '.' + t.className + ' «' + (t.textContent || '').trim().slice(0, 30) + '»' : '—') + ' | тень h/m/b ' + ten;
      });
      out.push(w + ' ' + nazv + ': ' + r);
    }
  }
  return out.join('\\n');
}`;
writeFileSync(join(D, 'brauzer.js'), kod);
console.log(kod.length);
