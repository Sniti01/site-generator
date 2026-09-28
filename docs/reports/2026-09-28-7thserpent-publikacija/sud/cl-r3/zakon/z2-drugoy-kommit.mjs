// CL3-Z-2: dist/ на машине собран не из того коммита, что выложен (ветка сессии впереди main; или main ушёл вперёд,
// а dist/ старый). Живой сайт здоров — это та же форма сборки, только другая редакция текста одной страницы.
// Инструмент: ПЛОХО «HTML отличается от сборки — /privacy/ обещает: два своих скрипта, запросов наружу нет» —
// причина читается как вставка на пути; какая строка разошлась — не сказано.
import { server, vProcesse, progon, pechat, sborkaInstrumenta, vykladIzDist } from './stend.mjs';
import { vykladCi } from './sborka-ci.mjs';
import { sPravkami } from './pravka.mjs';

// Выложенная редакция /max-payne-1/: первый абзац длиннее 40 знаков — другой формулировки (правка текста между коммитами).
let tronut = '';
const staraya = (rel, t) => {
  if (rel !== 'max-payne-1/index.html') return t;
  return t.replace(/(<p\b[^>]*>)([^<]{40,}?)(\.)/, (m, a, b, c) => {
    tronut = b.slice(0, 60);
    return `${a}${b} — first published wording${c}`;
  });
};
const sborka = sborkaInstrumenta();

let zakr = vProcesse(server({ vyklad: vykladIzDist({ pravka: staraya }) }));
const r = await progon({ sborka });
await zakr();
pechat('Z2 выложен другой коммит (текст /max-payne-1/), dist/ — этой ветки, та же машина', r);
console.log(`  тронут абзац: «${tronut}…»`);

const P = await sPravkami(['z2']);
zakr = vProcesse(server({ vyklad: vykladIzDist({ pravka: staraya }) }));
const rp = await progon({ sborka, mod: P });
await zakr();
pechat('Z2 с правкой z2', rp);

// Вместе с CL3-Z-1 (живой — сборка CI): правки z1 + z2 — строка называет именно текст, а не cid.
const P12 = await sPravkami(['z1', 'z2']);
zakr = vProcesse(server({ vyklad: vykladCi({ pravka: staraya }) }));
const r12 = await progon({ sborka, mod: P12 });
await zakr();
pechat('Z2 + Z1 (сайт CI, другой коммит) с правками z1, z2', r12);

const s = (x) => x.plokho.map((c) => c.otkuda).join(' | ');
console.log(`ИТОГ: как есть ${r.schet} — «${s(r)}»; с правкой z2 ${rp.schet} — «${s(rp).slice(0, 260)}»`);
