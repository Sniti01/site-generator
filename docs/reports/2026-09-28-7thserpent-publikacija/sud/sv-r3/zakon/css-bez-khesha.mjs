// Держит ли нормализация CSS без хеша в имени (_astro/print.css и /styles.css из public) с cid ядра внутри:
// на раннере меняется только значение cid, имя то же — ждём проход.
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const { spisokSborki, sverkaDist } = await import(pathToFileURL(SAYT + '/tools/storozha-vykladki.mjs').href);
const d = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/2a2fa1b5-b706-4952-b80c-ce6acb0f1174/scratchpad/sud/sv-r3/zakon/tmp-css';
rmSync(d, { recursive: true, force: true });
const f = {
  'index.html': '<!doctype html><html><head><link rel="canonical" href="https://www.7thserpent.com/"><link rel="stylesheet" href="/_astro/print.css"><link rel="stylesheet" href="/styles.css"></head><body><div data-astro-cid-m3tnyskv>x</div></body></html>',
  '_astro/print.css': '.a[data-astro-cid-m3tnyskv]{color:red}',
  'styles.css': '.b[data-astro-cid-m3tnyskv]{color:blue}',
};
for (const [p, t] of Object.entries(f)) { mkdirSync(join(d, p, '..'), { recursive: true }); writeFileSync(join(d, p), t); }
try {
  const prin = spisokSborki(d);
  for (const p of Object.keys(f)) writeFileSync(join(d, p), readFileSync(join(d, p), 'utf8').split('m3tnyskv').join('545q7pxz'));
  const r = sverkaDist(d, prin);
  console.log(`CSS без хеша (_astro/print.css, styles.css), cid ядра иной | ждём: проход | ${r.ok ? 'ПРОХОД' : 'ОТКАЗ'} — ${r.stroki[0]}`);
} finally {
  rmSync(d, { recursive: true, force: true });
}
