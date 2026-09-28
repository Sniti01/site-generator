// H0: здоровый стек из dist/ как есть (плюс строка адреса ящика ссылкой mailto) — все ли 43 ok.
import { progon, pechat } from './stend.mjs';

const r = await progon();
pechat('H0 dist как есть, адрес ящика ссылкой mailto', r);
for (const s of r.spravki) console.log(`  справка: ${s}`);
console.log(`ИТОГ H0: ${r.schet}`);
