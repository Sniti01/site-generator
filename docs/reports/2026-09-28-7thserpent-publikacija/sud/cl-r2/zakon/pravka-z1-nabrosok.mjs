// Набросок правки CL2-Z-1/Z-2 (не в репозитории): адрес ящика — в видимом тексте /privacy/ (теги сняты, сущности
// раскрыты), ссылка mailto не обязательна; обфускация — своя причина. Прогон на формах z1/z2.
import { privacy, YASHCHIK } from './stend.mjs';

const suschnosti = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const OBF = ['__cf_email__', 'email-decode', 'data-cfemail', '/cdn-cgi/l/email-protection'];
function adresYashchika(telo, domen) {
  if (OBF.some((m) => telo.includes(m))) return { ok: false, pochemu: 'адрес скрыт обфускацией Cloudflare (строка выше) — Scrape Shield → Email Address Obfuscation' };
  const vidimyy = suschnosti(telo.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' '));
  const re = new RegExp(`[A-Za-z0-9._%+-]+@${domen.replace(/\./g, '\\.')}\\b`, 'gi');
  const adresa = [...new Set(vidimyy.match(re) ?? [])];
  return adresa.length ? { ok: true, pochemu: `в тексте: ${adresa.join(', ')}` } : { ok: false, pochemu: 'адреса ящика на странице нет — порядок П52 п. 3' };
}
const zamena = (html) => privacy('ssylka').replace(/<p>Requests about the logs go to[\s\S]*?<\/p>/, html);
const formy = [
  ['a) текстом (форма первого сайта)', privacy('tekst')],
  ['b) разметка в YAML, экранирована', zamena(`<p>Requests about the logs go to &lt;a href=&quot;mailto:${YASHCHIK}&quot;&gt;${YASHCHIK}&lt;/a&gt;.</p>`)],
  ['c) «email us» + адрес в скобках', zamena(`<p>Requests: <a href="mailto:${YASHCHIK}">email us</a> (${YASHCHIK}).</p>`)],
  ['d) &#64;', zamena('<p>Requests about the logs go to <a href="mailto:box&#64;7thserpent.com">box&#64;7thserpent.com</a>.</p>')],
  ['e) mailto', privacy('ssylka')],
  ['f) без адреса (сегодняшняя сборка)', privacy('ssylka').replace(/<p>Requests about the logs go to[\s\S]*?<\/p>/, '')],
  ['g) обфускация включена', privacy('tekst').replace(YASHCHIK, '<a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="1f">[email&#160;protected]</a>')],
];
const itog = [];
for (const [imya, t] of formy) {
  const r = adresYashchika(t, '7thserpent.com');
  console.log(`${imya}: ${r.ok ? 'ok' : 'ПЛОХО'} — ${r.pochemu}`);
  itog.push(`${imya.slice(0, 2)} ${r.ok ? 'ok' : 'ПЛОХО'}`);
}
console.log(`ИТОГ набросок: ${itog.join('; ')}`);
