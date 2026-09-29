// Разбор входа SERPENT_DOMAIN_BOUND (soglasieIzVkhoda и ветка команды domen): крайние значения — регистр, пробелы,
// переводы строки, BOM, нулевой знак, пустое и отсутствующее. Команда — под замком сети и заглушкой пробы
// (ни одного запроса наружу); ждём: on — согласие, off/пусто/нет — нет, прочее — код 2 до сети.
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { SV, PAPKA, STOROZH, adresFajla, zapuskKomandy, vyvod } from './obshchee-o.mjs';

const ZNACHENIYA = ['on', 'off', '', undefined, 'ON', 'On', 'OFF', ' on', 'on ', 'on\n', 'on\r', 'on\r\n', '﻿on', 'on\u0000', 'o n', 'true', '1', 'yes', 'null', 'undefined'];
const ZAMOK = adresFajla(join(PAPKA, 'zamok-seti.mjs'));
const PEREKHVAT = adresFajla(join(PAPKA, 'perekhvat.mjs'));
const zhZ = join(PAPKA, 'razbor-zhurnal-zamka.txt');
const zhP = join(PAPKA, 'razbor-zhurnal-perekhvata.txt');
const stroki = ['значение (JSON) → soglasieIzVkhoda | команда domen при SERPENT_PERVAYA=on: код, запросов fetch'];
for (const z of ZNACHENIYA) {
  const f = SV.soglasieIzVkhoda(z);
  let komanda = '— (нулевой знак в окружение не передать)';
  if (!String(z ?? '').includes('\u0000')) {
    if (existsSync(zhP)) rmSync(zhP);
    const r = zapuskKomandy(STOROZH, [ZAMOK, PEREKHVAT], { SERPENT_PERVAYA: 'on', ZAMOK_ZHURNAL: zhZ, PEREKHVAT_ZHURNAL: zhP, ...(z === undefined ? {} : { SERPENT_DOMAIN_BOUND: z }) });
    const n = existsSync(zhP) ? readFileSync(zhP, 'utf8').trim().split('\n').filter(Boolean).length : 0;
    komanda = `код ${r.status}, запросов ${n}`;
  }
  stroki.push(`${JSON.stringify(z) ?? 'нет входа'} → ${f} | ${komanda}`);
}
stroki.push(`журнал замка: ${existsSync(zhZ) ? readFileSync(zhZ, 'utf8').trim() || 'пусто' : 'пусто'}`);
vyvod('razbor-vkhoda-vyvod.txt', stroki);
