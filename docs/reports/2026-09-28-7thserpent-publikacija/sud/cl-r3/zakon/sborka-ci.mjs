// Модель сборки CI (раннер GitHub, checkout в /home/runner/work/site-generator/site-generator) из dist/ этой машины —
// как у скептика SV1-Z-1 (sud/sv-r1/zakon/sim-ci.mjs, sim-ci-imena.mjs), но в памяти, без копии dist:
// cid компонентов ядра — те, что настоящий компилятор Astro даёт для пути раннера; CSS с иными cid — иное имя
// (хеш содержимого), ссылки HTML на него — тоже.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { REPO, DIST, vykladIzDist } from './stend.mjs';

const { transform } = await import(pathToFileURL(`${REPO}/node_modules/@astrojs/compiler-rs/dist/index.mjs`).href);
const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));

export const zamenaCid = new Map();
for (const f of obhod(`${REPO}/core`).filter((x) => x.endsWith('.astro'))) {
  const src = readFileSync(f, 'utf8');
  const r = relative(REPO, f).replace(/\\/g, '/');
  const win = transform(src, { filename: `D:/SEO/cloud/site-generator/${r}`, normalizedFilename: `D:/SEO/cloud/site-generator/${r}` }).scope;
  const ci = transform(src, { filename: `/home/runner/work/site-generator/site-generator/${r}`, normalizedFilename: `/home/runner/work/site-generator/site-generator/${r}` }).scope;
  if (win !== ci) zamenaCid.set(win, ci);
}
const naCi = (t) => t.replace(/data-astro-cid-([a-z0-9]{8})/g, (m, k) => (zamenaCid.has(k) ? `data-astro-cid-${zamenaCid.get(k)}` : m));

// CSS: содержимое с cid раннера → новое имя.
export const imenaCss = new Map(); // старое имя → новое
const cssCi = new Map(); // новое имя → содержимое
for (const f of obhod(join(DIST, '_astro')).filter((x) => x.endsWith('.css'))) {
  const bylo = readFileSync(f, 'utf8');
  const stalo = naCi(bylo);
  if (stalo === bylo) continue;
  const h = createHash('sha256').update(stalo).digest('base64url').slice(0, 8);
  const novoe = basename(f).replace(/\.[A-Za-z0-9_-]{8}\.css$/, `.${h}.css`);
  imenaCss.set(basename(f), novoe);
  cssCi.set(novoe, stalo);
}
export const htmlNaCi = (t) => {
  let n = naCi(t);
  for (const [a, b] of imenaCss) n = n.split(`/_astro/${a}`).join(`/_astro/${b}`);
  return n;
};

/** Выкладка CI: HTML с cid раннера и новыми именами CSS; CSS — под новыми именами. */
export function vykladCi({ pravka } = {}) {
  const baza = vykladIzDist({ pravka: (rel, t) => (pravka ? pravka(rel, htmlNaCi(t)) : htmlNaCi(t)) });
  const staryeImena = new Set(imenaCss.keys());
  return (rel) => {
    const imya = rel.startsWith('_astro/') ? rel.slice(7) : null;
    if (imya && cssCi.has(imya)) return Buffer.from(cssCi.get(imya), 'utf8');
    if (imya && staryeImena.has(imya)) return null;
    return baza(rel);
  };
}

/** Сколько HTML сборки иные на раннере. */
export function skolkoInyh() {
  const html = obhod(DIST).filter((x) => x.endsWith('.html'));
  return { vsego: html.length, inyh: html.filter((f) => htmlNaCi(readFileSync(f, 'utf8')) !== readFileSync(f, 'utf8')).length };
}
