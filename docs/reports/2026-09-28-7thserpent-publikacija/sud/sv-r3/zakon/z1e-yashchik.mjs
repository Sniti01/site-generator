// Z1e: заход «ящик заведён» пишет НОВЫЙ список принятой сборки (ruki-vladelca.md, шаг 6) — имена 816ba46 уходят
// из верха сборки. Если между первой выкладкой и заходом «ящик» страница переименована (remake/ → max-payne-remake/),
// выкладка «ящика» (SERPENT_FIRST=off) встречает на сервере свою прежнюю remake/ — и сторож папки говорит «чужие».
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const { papka } = await import(pathToFileURL(SAYT + '/tools/storozha-vykladki.mjs').href);
const PRIN = JSON.parse(readFileSync(SAYT + '/gates/sborka-prinyataya.json', 'utf8'));
const v816 = [...new Set(Object.keys(PRIN.fajly).map((f) => f.split('/')[0]))];
const kornevye = (a) => a.map((n) => (/\.[a-z0-9]+$/i.test(n) || n.startsWith('.') ? n : n + '/'));
const nash = '<!doctype html><html><head><link rel="canonical" href="https://www.7thserpent.com/"></head><body></body></html>';
const server = ['./', '../', ...kornevye(v816)].join('\n');
const yashchik = [...v816.filter((n) => n !== 'remake'), 'max-payne-remake'];
const r = papka(server, nash, yashchik);
console.log(`Z1e выкладка «ящика»: на сервере 816ba46 (remake/), верх — dist и новый список «ящика» (max-payne-remake/) | ждём: проход | сторож: ${r.ok ? 'ПРОХОД' : 'ОТКАЗ'} — ${r.stroki.join(' / ')}`);
