// Одноразовая читалка корпуса (бэклог 43 — в репозитории её нет). Запуск из корня сайта.
//   node korpus.mjs list <подстрока url|группы>   — документы (n, url, outcome, file)
//   node korpus.mjs text <подстрока url>           — текст без тегов первого совпавшего документа
//   node korpus.mjs grep <regex> [<подстрока url>] — строки с совпадением по документам
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const man = readFileSync('input/corpus/manifest.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const [cmd, a, b] = process.argv.slice(2);
const lc = (s) => decodeURIComponent(String(s ?? '')).toLowerCase();
const pick = (q) => man.filter((m) => m.file && (lc(m.url).includes(lc(q)) || (m.groups ?? []).some((g) => lc(g).includes(lc(q)))));
const textOf = (m) => {
  const html = gunzipSync(readFileSync('input/corpus/' + m.file)).toString('utf8');
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|p|div|li|h\d|tr|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#160;/g, ' ')
    .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
};
if (cmd === 'list') {
  for (const m of pick(a)) console.log(m.n, m.outcome, m.url, m.file);
} else if (cmd === 'text') {
  const m = pick(a)[0];
  if (!m) throw new Error('нет документа ' + a);
  console.log('# ' + m.url + '\n' + textOf(m));
} else if (cmd === 'grep') {
  const re = new RegExp(a, 'i');
  for (const m of b ? pick(b) : man.filter((m) => m.file)) {
    let t;
    try { t = textOf(m); } catch { continue; }
    for (const line of t.split('\n')) if (re.test(line)) console.log(m.n + ' ' + m.url + ' :: ' + line.slice(0, 300));
  }
} else console.log('list|text|grep');
