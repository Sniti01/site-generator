// Извлечение рядов страниц из src/content/tresc/*.md → JSON для подборщиков.
// Запуск из корня сайта: node <scratchpad>/rows.mjs [slug,...] > rows.json
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module'; const yaml = createRequire('D:/SEO/cloud/site-generator/package.json')('js-yaml');

const dir = 'src/content/tresc';
const only = process.argv[2] ? new Set(process.argv[2].split(',')) : null;
const out = [];
for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
  const slug = f.replace(/\.md$/, '');
  if (only && !only.has(slug)) continue;
  const text = readFileSync(join(dir, f), 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;
  const fm = yaml.load(m[1]);
  out.push({
    file: f,
    url: fm.url,
    era: fm.era ?? null,
    art: fm.art ?? null,
    hasLead: fm.lead !== undefined,
    rows: (fm.rows ?? []).map((r) => ({
      id: r.id,
      year: r.year ?? null,
      title: r.title,
      meta: r.meta ?? null,
      art: r.art ?? null,
      flip: r.flip ?? null,
      band: r.band ?? null,
      body: (r.body ?? []).map((p) => String(p).replace(/\s+/g, ' ').trim()),
    })),
    gallery: (fm.gallery?.items ?? []).map((k) => ({ art: k.art ?? null, title: k.title ?? null })),
    cards: (fm.cards ?? fm.rail?.items ?? []).map((k) => ({ art: k.art ?? null, title: k.title ?? null })),
  });
}
process.stdout.write(JSON.stringify(out, null, 1));
