// Две страницы /mods/ для глаз: как есть и с подписью без метки области (data-astro-cid-n67f4zmd снят).
// Адреса /_astro/ — на файлы сборки (file:///), чтобы открыть без сервера.
import { readFileSync, writeFileSync } from 'node:fs';
const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const TUT = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/s2r1/s2r1-klass';
const h = readFileSync(`${DIST}/mods/index.html`, 'utf8').replaceAll('"/_astro/', `"file:///${DIST}/_astro/`).replaceAll(' /_astro/', ` file:///${DIST}/_astro/`).replaceAll(',/_astro/', `,file:///${DIST}/_astro/`);
const P = '<p class="podpis-geroya t-caption" data-astro-cid-n67f4zmd>';
if (!h.includes(P)) throw new Error('нет подписи');
writeFileSync(`${TUT}/mods-kak-est.html`, h);
writeFileSync(`${TUT}/mods-bez-metki.html`, h.replace(P, '<p class="podpis-geroya t-caption">'));
console.log('готово');
