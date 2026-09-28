// Правила CSS страницы /remake/ (голова и таблицы _astro), в которых есть geroy, hero__art, foto, link-list.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const h = readFileSync(join(DIST, 'remake/index.html'), 'utf8');
const stili = [...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const linki = [...h.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
console.log('style в голове:', stili.length, 'link:', linki);
const css = [...stili, ...readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(DIST, '_astro', f), 'utf8'))].join('\n');
const pravila = css.split('}').map((x) => x + '}');
for (const p of pravila) if (/geroy|hero__art|\.foto\b|fokus/.test(p)) console.log(p.trim().slice(0, 240));
