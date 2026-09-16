// Вставляет поля героя (art, lead, primary, secondary) в frontmatter файла содержания (CRLF) сразу после строки url:
//   node hero-set.mjs <hero.json>  — { file, art, lead: [строки], primary: {href,label}, secondary: {href,label} }
// Проверки: CRLF без голых LF; полей art/lead/primary/secondary в файле ещё нет; файл кадра существует.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const h = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const path = `src/content/tresc/${h.file}`;
const raw = readFileSync(path, 'utf8');
if ((raw.match(/(?<!\r)\n/g) || []).length) throw new Error('голые LF');
const lines = raw.split('\r\n');
const fmEnd = lines.indexOf('---', 1);
const top = lines.slice(0, fmEnd);
for (const k of ['art', 'lead', 'primary', 'secondary']) if (top.some((l) => l.startsWith(k + ':'))) throw new Error('поле уже есть: ' + k);
if (!existsSync(`src/assets/gry/${h.art}.jpg`) && !existsSync(`src/assets/foto/${h.art}.jpg`)) throw new Error('нет файла кадра ' + h.art);
const urlIdx = lines.findIndex((l) => l.startsWith('url: '));
if (urlIdx < 0) throw new Error('нет url:');
const q = (s) => (s.startsWith('#') ? `'${s}'` : s);
const block = [
  `art: ${h.art}`,
  'lead: >-',
  ...h.lead.map((l) => '  ' + l),
  'primary:',
  `  href: ${q(h.primary.href)}`,
  `  label: ${h.primary.label}`,
  'secondary:',
  `  href: ${h.secondary.href.startsWith('#') ? `'${h.secondary.href}'` : h.secondary.href}`,
  `  label: ${h.secondary.label}`,
];
const at = lines[urlIdx + 1]?.startsWith('era: ') ? urlIdx + 2 : urlIdx + 1;
lines.splice(at, 0, ...block);
const out = lines.join('\r\n');
if ((out.match(/(?<!\r)\n/g) || []).length) throw new Error('голые LF после');
writeFileSync(path, out);
const znaki = (h.lead.join(' ') + h.primary.label + h.secondary.label).replace(/\s+/g, '').length;
console.log(`${h.file}: герой вставлен; знаков без пробелов (лид + подписи): ${znaki} (лид ${h.lead.join(' ').replace(/\s+/g, '').length})`);
