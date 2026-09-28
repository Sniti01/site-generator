// H0: здоровый стенд — выкладка = dist/ (со строкой ящика), сборка инструмента = тот же dist/.
// (а) транспорт в процессе; (б) настоящий HTTP: сжатие тем, что просит клиент (br/zstd/gzip), chunked, ETag, Vary.
import { server, vProcesse, poHttp, progon, pechat, sborkaInstrumenta } from './stend.mjs';

const sborka = sborkaInstrumenta();
const s = server();

const zakr = vProcesse(s);
const a = await progon({ sborka });
await zakr();
pechat('H0а в процессе', a);

const http = await poHttp(s);
const b = await progon({ sborka });
await http.zakryt();
pechat('H0б настоящий HTTP (сжатие, chunked)', b);
const enc = [...new Set(http.zhurnal.map((z) => `${z.ae} → ${z.enc || 'без сжатия'}`))];
console.log(`клиент просил и получил: ${enc.join(' | ')}`);
console.log(`ИТОГ: в процессе ${a.schet}; по HTTP ${b.schet}; справки: ${a.spravki.length}`);
