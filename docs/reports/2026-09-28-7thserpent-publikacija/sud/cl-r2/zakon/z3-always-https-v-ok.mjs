// CL2-Z-3: на здоровом сайте (Always Use HTTPS выключен, редирект делает .htaccess одним скачком) строки
// «http → https …: Location» — ok, но команда печатает в них «Always Use HTTPS на Cloudflare включён — выключить
// (второй скачок)»: для канонического хоста замена http:// → https:// и есть канонический адрес, признак срабатывает всегда.
import { progon, stroka } from './stend.mjs';

const r = await progon();
const stroki = r.proverki.filter((c) => c.imya.endsWith(': Location'));
for (const c of stroki) console.log(stroka(c));
const lozh = stroki.filter((c) => c.ok && c.otkuda.includes('Always Use HTTPS'));
console.log(`\nИТОГ Z3: здоровый сайт ${r.schet}; ok-строк Location с «Always Use HTTPS … включён — выключить»: ${lozh.length} (${lozh.map((c) => c.imya).join('; ')})`);
