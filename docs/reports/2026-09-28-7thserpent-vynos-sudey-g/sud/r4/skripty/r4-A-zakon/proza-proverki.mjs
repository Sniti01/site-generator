// Проза раунда 3 против кода: (1) шаблон теневого корня в <head> с <title>/<main> — громкий отказ;
// (2) брошенный .tmp старше часа — убирается ли, когда кеш берётся (без записи).
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, utimesSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { izvlechStranicu, OshibkaIzvlecheniya } from 'file:///D:/SEO/cloud/site-generator/core/text/extract.mjs';
import { ukazatelKorpusa } from 'file:///D:/SEO/cloud/site-generator/core/text/corpus.mjs';

const tekstMain = '<p>' + 'word '.repeat(20) + '</p>';
const h1 = `<html><head><title>T</title><template shadowrootmode="open"><title>S</title></template></head><body><main>${tekstMain}</main></body></html>`;
console.log('(1a) title в шаблоне головы:', JSON.stringify(izvlechStranicu(h1).golova.title));
const h2 = `<html><head><title>T</title><template shadowrootmode="closed"><main><p>x</p></main></template></head><body><main>${tekstMain}</main></body></html>`;
try {
  izvlechStranicu(h2);
  console.log('(1b) main в шаблоне головы: отказа нет');
} catch (e) {
  console.log('(1b) main в шаблоне головы:', e instanceof OshibkaIzvlecheniya ? 'OshibkaIzvlecheniya' : e.constructor.name, e.message.slice(0, 80));
}

const papka = mkdtempSync(join(tmpdir(), 'korpus-test-'));
mkdirSync(join(papka, 'raw'));
writeFileSync(join(papka, 'raw', 'd0.html.gz'), gzipSync('<p>one two three four five six seven eight</p>'));
writeFileSync(join(papka, 'manifest.jsonl'), JSON.stringify({ url: 'u', outcome: 'ok', file: 'raw/d0.html.gz' }) + '\n');
const kesh = mkdtempSync(join(tmpdir(), 'kesh-test-'));
ukazatelKorpusa(papka, { kesh });
const f = readdirSync(kesh).find((x) => x.endsWith('.json.gz'));
const broshennyi = join(kesh, `${f}.4242.tmp`); // как оставил бы убитый процесс: <файл кеша>.<pid>.tmp
writeFileSync(broshennyi, 'oborvano');
const dvaChasa = (Date.now() - 2 * 3600 * 1000) / 1000;
utimesSync(broshennyi, dvaChasa, dvaChasa);
const u = ukazatelKorpusa(papka, { kesh });
console.log(`(2) второй прогон: izKesha ${u.izKesha}; брошенный .tmp двухчасовой давности на месте: ${existsSync(broshennyi)}`);
