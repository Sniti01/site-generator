// Внешние загрузки статически: каждый загружаемый адрес в HTML и CSS сборки (src, srcset,
// href у link, poster, url() в CSS и style) — свой хост или относительный. Ссылки <a href>
// — не загрузки, считаются отдельно. Только чтение. node vneshnie.mjs <dist>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
const dist = process.argv[2];
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); } };
walk(dist);
const chuzhoy = (u) => /^(https?:)?\/\//i.test(u.trim()) && !/^(https?:)?\/\/(www\.)?7thserpent\.com\//i.test(u.trim());
const zagruzki = [], ssylki = [];
for (const f of files) {
  const ext = extname(f);
  if (ext !== '.html' && ext !== '.css') continue;
  const t = readFileSync(f, 'utf8');
  if (ext === '.html') {
    for (const m of t.matchAll(/<(img|script|source|video|audio|iframe|embed|track|link)\b[^>]*>/gi)) {
      const tag = m[0];
      const rel = (tag.match(/\brel="([^"]*)"/i) || [])[1] || '';
      for (const a of tag.matchAll(/\b(src|href|poster|data)="([^"]*)"/gi)) {
        if (m[1].toLowerCase() === 'link' && a[1].toLowerCase() === 'href' && /canonical|alternate/i.test(rel)) continue;
        if (chuzhoy(a[2])) zagruzki.push(`${f}: <${m[1]} ${a[1]}="${a[2]}">`);
      }
      for (const a of tag.matchAll(/\bsrcset="([^"]*)"/gi)) for (const c of a[1].split(',')) if (chuzhoy(c.trim().split(/\s+/)[0])) zagruzki.push(`${f}: srcset ${c.trim()}`);
    }
    for (const m of t.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)) if (chuzhoy(m[1])) ssylki.push(`${f.slice(dist.length)}: ${m[1]}`);
  }
  for (const m of t.matchAll(/url\(\s*['"]?([^'")]+)/gi)) if (chuzhoy(m[1])) zagruzki.push(`${f}: url(${m[1]})`);
  for (const m of t.matchAll(/@import\s+(?:url\()?['"]?([^'");]+)/gi)) if (chuzhoy(m[1])) zagruzki.push(`${f}: @import ${m[1]}`);
}
console.log(`файлов HTML и CSS разобрано: ${files.filter((f) => ['.html', '.css'].includes(extname(f))).length}`);
console.log(`внешних загрузок: ${zagruzki.length}`);
for (const z of zagruzki) console.log('  ' + z);
console.log(`внешних ссылок <a> (не загрузки): ${ssylki.length}`);
for (const s of ssylki) console.log('  ' + s);
process.exit(zagruzki.length ? 1 : 0);
